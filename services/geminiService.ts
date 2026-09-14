import { GoogleGenAI, Modality, Part, HarmCategory, HarmBlockThreshold, Type } from "@google/genai";
import { ImageFile, AudioFile } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
];

export async function analyzeImageForPrompt(images: ImageFile[], instructions: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [ ...images.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })), { text: `You are an expert Prompt Engineer for High-End Advertising. Task: Analyze the uploaded image and write the BEST possible AI image generation prompt to recreate it exactly. Breakdown your analysis into: 1. Subject: Detailed description of the product/person. 2. Lighting: Type of light (softbox, rim light, caustic shadows). 3. Environment: Background details, textures, and depth of field. 4. Camera Settings: Lens type (Macro, 85mm, Wide-angle), aperture (f/1.8), and angle. 5. Color Grade: Palette, saturation, and mood. Additional Instructions: ${instructions} Output ONLY the final highly-detailed English prompt that starts with "A professional photograph of..."` } ] },
        config: { thinkingConfig: { thinkingBudget: 0 }, safetySettings }
    });
    return response.text || '';
}

export async function analyzeStyleImage(styleImages: ImageFile[]): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: { parts: [ ...styleImages.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })), { text: "Extract the cinematic DNA of these images. Focus on lighting techniques, color grading styles, and environmental aesthetics. Describe it in technical terms for an AI image generator." } ] },
        config: { safetySettings }
    });
    return response.text || '';
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Translate the following text to ${targetLanguage}: "${text}". Return only the translated text.`, config: { safetySettings } });
    return response.text || text;
}

export async function generateImage(productImages: ImageFile[], prompt: string, styleImages: ImageFile[] | null): Promise<ImageFile> {
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productImages, styleImages, prompt }),
    });

    let payload: any = null;
    try { payload = await response.json(); } catch { payload = null; }

    if (!response.ok) {
        throw new Error(payload?.error || `Image generation failed (${response.status})`);
    }

    if (!payload?.base64) {
        throw new Error(payload?.error || 'No image returned');
    }

    return {
        base64: payload.base64,
        mimeType: payload.mimeType || 'image/png',
        name: payload.name || `gen-${Date.now()}.png`,
    };
}

export async function editImage(image: ImageFile, prompt: string): Promise<ImageFile> {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: prompt }] }, config: { safetySettings } });
    for (const part of response.candidates?.[0]?.content?.parts || []) if (part.inlineData) return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType, name: `edit-${Date.now()}.png` };
    throw new Error("Edit failed");
}

export async function generatePromptFromText(instructions: string): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Expand this idea into a detailed, professional AI image generation prompt: "${instructions}"`, config: { safetySettings } });
    return response.text || '';
}

export async function analyzeLogoForBranding(logos: ImageFile[]): Promise<{ colors: string[] }> {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [...logos.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })), { text: "Extract brand hex colors. Return as JSON array." }] }, config: { responseMimeType: "application/json", responseSchema: { type: Type.OBJECT, properties: { colors: { type: Type.ARRAY, items: { type: Type.STRING } } }, required: ["colors"] }, safetySettings } });
    try { return JSON.parse(response.text || '{"colors": []}'); } catch { return { colors: [] }; }
}

export async function generateSpeech(text: string, styleInstructions: string, voiceName: string): Promise<AudioFile> {
    const prompt = `Say ${styleInstructions ? `${styleInstructions}: ` : 'clearly: '}${text}`;
    const response = await ai.models.generateContent({ model: "gemini-2.5-flash-preview-tts", contents: [{ parts: [{ text: prompt }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName } } }, safetySettings } });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64) throw new Error("Audio generation failed");
    return { base64, name: `speech-${Date.now()}.pcm` };
}

export async function analyzeProductForCampaign(productImages: ImageFile[]): Promise<string> {
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts: [...productImages.map(img => ({ inlineData: { data: img.base64, mimeType: img.mimeType } })), { text: "Analyze product features and target audience for marketing." }] }, config: { safetySettings } });
    return response.text || '';
}

export async function generateCampaignPlan(productImages: ImageFile[], userPrompt: string, targetMarket: string = "Egypt", dialect: string = "Egyptian Arabic"): Promise<any[]> {
    const parts: Part[] = [];
    productImages.forEach(img => parts.push({ inlineData: { data: img.base64, mimeType: img.mimeType } }));
    parts.push({ text: `Target: ${targetMarket}. Dialect: ${dialect}. Plan 9 posts. Return ONLY JSON array with scenario, caption, tov, schedule.` });
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: { parts }, config: { responseMimeType: "application/json", safetySettings } });
    return JSON.parse(response.text || '[]');
}

export async function expandImage(image: ImageFile, prompt: string): Promise<ImageFile> {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts: [{ inlineData: { data: image.base64, mimeType: image.mimeType } }, { text: `Expand image: ${prompt}` }] }, config: { safetySettings } });
    for (const part of response.candidates?.[0]?.content?.parts || []) if (part.inlineData) return { base64: part.inlineData.data, mimeType: part.inlineData.mimeType, name: `exp-${Date.now()}.png` };
    throw new Error("Expansion failed");
}
