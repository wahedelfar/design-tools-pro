import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';
import sharp from 'sharp';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

const CLOUDFLARE_MODEL = '@cf/black-forest-labs/flux-2-klein-9b';

async function base64ToBlob(base64: string, mimeType = 'image/png'): Promise<Blob> {
  const clean = base64.includes(',') ? base64.split(',').pop()! : base64;
  const binary = Buffer.from(clean, 'base64');
  const resized = await sharp(binary).resize({ width: 511, height: 511, fit: 'inside', withoutEnlargement: true }).png().toBuffer();
  return new Blob([resized], { type: 'image/png' });
}

async function generateWithQwen(images: any[], prompt: string) {
  const apiKey = process.env.QWEN_API_KEY;
  const workspaceId = process.env.QWEN_WORKSPACE_ID;

  if (!apiKey || !workspaceId) {
    throw new Error(
      'Qwen Image is not configured. Add QWEN_API_KEY and QWEN_WORKSPACE_ID to Vercel Production environment variables.'
    );
  }

  const endpoint =
    `https://${workspaceId}.ap-southeast-1.maas.aliyuncs.com/compatible-mode/v1/images/generations`;

  const body: any = {
    model: 'qwen-image-2.0',
    prompt,
    watermark: false,
    prompt_extend: true,
    enable_thinking: false,
  };

  if (images.length > 0) {
    body.image = images.slice(0, 3).map((image: any) => {
      const mime = image?.mimeType || 'image/png';
      const base64 = String(image?.base64 || '').replace(/^data:[^;]+;base64,/, '');
      return `data:${mime};base64,${base64}`;
    });
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload: any = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `Qwen image generation failed (${response.status})`;
    const error: any = new Error(message);
    error.status = response.status;
    throw error;
  }

  const imageUrl = payload?.data?.[0]?.url;
  if (!imageUrl || typeof imageUrl !== 'string') {
    throw new Error('Qwen returned no image URL');
  }

  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to download Qwen image (${imageResponse.status})`);
  }

  const buffer = Buffer.from(await imageResponse.arrayBuffer());
  return {
    base64: buffer.toString('base64'),
    mimeType: imageResponse.headers.get('content-type') || 'image/png',
    name: `gen-qwen-${Date.now()}.png`,
  };
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
      await base64ToBlob(image.base64, image.mimeType || 'image/png'),
      image.name || `reference-${i}.png`
    );
  }

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_MODEL}`,
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

      // Gemini image generation is unavailable on its current Free Tier.
      // Try Qwen Image first, then Cloudflare FLUX.
      try {
        const generated = await generateWithQwen(images, prompt);
        return res.status(200).json(generated);
      } catch (qwenError: any) {
        console.error('Qwen image generation fallback error:', qwenError);
        try {
          const generated = await generateWithCloudflare(images, prompt);
          return res.status(200).json(generated);
        } catch (fallbackError: any) {
          console.error('Cloudflare FLUX fallback error:', fallbackError);
          return res.status(429).json({
            error: 'All image generation providers failed.',
            geminiError: error?.message || 'Gemini quota exceeded',
            qwenError: qwenError?.message || 'Qwen fallback failed',
            fallbackError: fallbackError?.message || 'Cloudflare fallback failed',
            status: 429,
          });
        }
      }    }
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
