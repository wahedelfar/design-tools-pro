import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const CLOUDFLARE_MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

function base64ToBlob(base64: string, mimeType = 'image/png'): Blob {
  const clean = base64.includes(',') ? base64.split(',').pop()! : base64;
  const binary = Buffer.from(clean, 'base64');
  return new Blob([binary], { type: mimeType });
}

async function generateWithCloudflare(images: any[], prompt: string) {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!accountId || !token) {
    throw new Error(
      'Cloudflare FLUX fallback is not configured. Add CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN to Vercel Production environment variables.'
    );
  }

  const form = new FormData();
  form.append('prompt', prompt);
  form.append('width', '1024');
  form.append('height', '1024');
  form.append('guidance', '4');

  // FLUX.2 klein supports up to 4 reference images. Cloudflare requires
  // each reference image to be smaller than 512x512.
  for (let i = 0; i < Math.min(images.length, 4); i++) {
    const image = images[i];
    if (!image?.base64) continue;
    form.append(
      `input_image_${i}`,
      base64ToBlob(image.base64, image.mimeType || 'image/png'),
      image.name || `reference-${i}.png`
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${encodeURIComponent(CLOUDFLARE_MODEL)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    }
  );

  const payload: any = await response.json().catch(() => null);

  if (!response.ok || payload?.success === false) {
    const message =
      payload?.errors?.map((e: any) => e?.message).filter(Boolean).join('; ') ||
      `Cloudflare image generation failed (${response.status})`;
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  const base64 = payload?.result?.image;
  if (!base64) {
    throw new Error('Cloudflare FLUX returned no image');
  }

  return {
    base64,
    mimeType: 'image/png',
    name: `gen-flux-${Date.now()}.png`,
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { productImages, styleImages, prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const images = [
    ...(Array.isArray(productImages) ? productImages : []),
    ...(Array.isArray(styleImages) ? styleImages : []),
  ];

  if (images.length > 4) {
    return res.status(400).json({ error: 'Image generation supports up to 4 input images per request' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // Keep Gemini as the primary engine when its quota is available.
  if (apiKey) {
    try {
      const parts: any[] = images.slice(0, 3).map((img: any) => ({
        inlineData: { data: img.base64, mimeType: img.mimeType },
      }));
      parts.push({ text: prompt });

      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts },
        config: { responseModalities: ['Image'], safetySettings },
      });

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          return res.status(200).json({
            base64: part.inlineData.data,
            mimeType: part.inlineData.mimeType || 'image/png',
            name: `gen-${Date.now()}.png`,
          });
        }
      }

      return res.status(502).json({
        error: 'Gemini returned no image',
        finishReason: response.candidates?.[0]?.finishReason,
        blockReason: response.promptFeedback?.blockReason,
        details: response.text || null,
      });
    } catch (error: any) {
      const status = Number(error?.status) || 500;
      const isQuotaError =
        status === 429 ||
        error?.status === 429 ||
        error?.code === 429 ||
        error?.message?.includes('RESOURCE_EXHAUSTED') ||
        error?.message?.includes('quota');

      console.error('Gemini image generation error:', error);

      if (!isQuotaError) {
        return res.status(status >= 400 && status < 600 ? status : 500).json({
          error: error?.message || 'Gemini image generation failed',
          status,
        });
      }

      // Gemini image Free Tier is unavailable for this model. Fall through
      // automatically to Cloudflare FLUX.2 klein when configured.
      try {
        const generated = await generateWithCloudflare(images, prompt);
        return res.status(200).json(generated);
      } catch (fallbackError: any) {
        console.error('Cloudflare FLUX fallback error:', fallbackError);
        return res.status(429).json({
          error: 'Gemini quota exceeded and Cloudflare FLUX fallback is unavailable.',
          geminiError: error?.message || 'Gemini quota exceeded',
          fallbackError: fallbackError?.message || 'Cloudflare fallback failed',
          status: 429,
        });
      }
    }
  }

  // If Gemini is not configured, Cloudflare can operate as the standalone engine.
  try {
    const generated = await generateWithCloudflare(images, prompt);
    return res.status(200).json(generated);
  } catch (error: any) {
    console.error('Cloudflare FLUX image generation error:', error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Cloudflare FLUX image generation failed',
      status,
    });
  }
}
