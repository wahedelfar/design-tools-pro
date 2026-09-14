import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });

  try {
    const { productImages, styleImages, prompt } = req.body ?? {};
    if (!prompt || typeof prompt !== 'string') return res.status(400).json({ error: 'Prompt is required' });

    const images = [
      ...(Array.isArray(productImages) ? productImages : []),
      ...(Array.isArray(styleImages) ? styleImages : []),
    ];

    if (images.length > 3) {
      return res.status(400).json({ error: 'Gemini image generation supports up to 3 input images per request' });
    }

    const parts: any[] = images.map((img: any) => ({
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
    console.error('Gemini image generation error:', error);
    const status = Number(error?.status) || 500;
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: error?.message || 'Gemini image generation failed',
      status,
    });
  }
}
