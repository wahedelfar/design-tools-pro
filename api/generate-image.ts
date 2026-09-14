import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from '@google/genai';

type InputImage = {
  base64: string;
  mimeType: string;
};

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on Vercel' });
  }

  try {
    const { productImages, styleImages, prompt } = req.body ?? {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const images: InputImage[] = [
      ...(Array.isArray(productImages) ? productImages : []),
      ...(Array.isArray(styleImages) ? styleImages : []),
    ];

    if (images.length > 3) {
      return res.status(400).json({ error: 'Gemini image generation supports up to 3 input images per request' });
    }

    const parts = images.map((img) => ({
      inlineData: {
        data: img.base64,
        mimeType: img.mimeType,
      },
    }));

    parts.push({ text: prompt } as { inlineData: { data: string; mimeType: string } });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        responseModalities: ['Image'],
        safetySettings,
      },
    });

    const responseParts = response.candidates?.[0]?.content?.parts ?? [];
    for (const part of responseParts) {
      if (part.inlineData?.data) {
        return res.status(200).json({
          base64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png',
          name: `gen-${Date.now()}.png`,
        });
      }
    }

    const finishReason = response.candidates?.[0]?.finishReason;
    const blockReason = response.promptFeedback?.blockReason;
    return res.status(502).json({
      error: 'Gemini returned no image',
      finishReason,
      blockReason,
      details: response.text || null,
    });
  } catch (error: any) {
    const status = Number(error?.status) || 500;
    const message = error?.message || 'Gemini image generation failed';
    console.error('Gemini image generation error:', error);
    return res.status(status >= 400 && status < 600 ? status : 500).json({
      error: message,
      status,
    });
  }
}
