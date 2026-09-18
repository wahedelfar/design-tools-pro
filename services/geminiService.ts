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
    // The server also enforces the master directive, but keeping the client
    // brief explicit makes every studio follow the same generation contract.
    const finalPrompt = IMAGE_GENERATION_MASTER_PROMPT + prompt.trim();
    const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productImages, styleImages, prompt: finalPrompt }),
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

const IMAGE_GENERATION_MASTER_PROMPT = `MASTER IMAGE GENERATION DIRECTIVE

Create the requested image as a professional production asset. Follow the user's creative brief precisely while treating uploaded reference images as authoritative visual sources.

REFERENCE PRIORITY:
- Product, packaging, logo, person, garment, food, architecture, or other explicitly referenced subject: preserve its recognizable identity, proportions, colors, materials, markings and distinctive details.
- Style/reference images: use them as visual guidance for lighting, palette, composition language, materials and atmosphere; do not copy unrelated subjects or objects from them.
- If multiple references are provided, combine them only according to the user's request. Do not invent a conflicting subject.

CREATIVE EXECUTION:
- Follow the requested subject, action, composition, camera angle, lens perspective, environment, lighting, color grade, mood, aspect ratio and visual style.
- Make the result look intentional, premium, coherent and production-ready.
- Prefer physically plausible materials, realistic light transport, natural shadows, accurate reflections and convincing depth.
- For photorealistic requests, produce authentic photographic detail rather than illustration-like or synthetic-looking surfaces.

FIDELITY RULES:
- Do not redesign the referenced product, person, logo, packaging, food or brand identity.
- Do not alter important reference details unless the prompt explicitly requests the change.
- Preserve readable brand marks and requested typography as accurately as the model permits.
- Do not add random people, products, props, accessories, text, logos, watermarks or decorative elements that were not requested.
- Do not duplicate subjects or create accidental extra limbs, fingers, eyes, objects or products.
- Avoid plastic skin, excessive smoothing, artificial HDR, muddy textures, warped geometry and obvious generative artifacts.

COMPOSITION DISCIPLINE:
- Respect the requested framing and hierarchy.
- Keep the primary subject clearly dominant.
- Use negative space only when useful to the requested design.
- Ensure foreground, midground and background support the brief rather than competing with it.

FINAL QUALITY BAR:
The result must look like a deliberate professional photograph, advertisement, campaign asset, product render, brand mockup or editorial image—whichever the user requested—not like an arbitrary AI reinterpretation.

USER CREATIVE BRIEF:
`;

const IMAGE_EDIT_MASTER_PROMPT = `MASTER IMAGE EDITING DIRECTIVE

Use the uploaded image as the PRIMARY SOURCE. This is a controlled image edit, not a recreation from scratch.

PRIORITY ORDER:
1. Preserve the exact source identity and visual information.
2. Apply only the requested edit.
3. Preserve photorealism and anatomical consistency.
4. Do not introduce creative changes that were not requested.

IDENTITY LOCK:
- Preserve the same person, face shape, facial proportions, eyes, eyebrows, nose, lips, jawline, ears, skin tone, natural skin texture, age appearance, hair, facial hair and distinctive features.
- Preserve natural asymmetry and recognizable details.
- Never replace, redesign, beautify, merge, or reinterpret the identity unless explicitly requested.

SOURCE LOCK:
- Preserve original pose, body proportions, clothing, accessories, hands, background, composition, framing, camera angle, perspective, lighting direction, color balance, depth of field and photographic texture.
- Treat every unmentioned attribute as IMMUTABLE.

CONTROLLED EDIT:
- Change ONLY what the user explicitly requests.
- Keep the requested change localized and visually plausible.
- Match existing light, shadow, perspective, focus, grain and color response.
- Make transitions natural; do not create visible seams or pasted-looking edits.

QUALITY GUARDRAILS:
- No identity drift.
- No facial warping or feature duplication.
- No plastic skin or excessive beauty retouching.
- No malformed eyes, teeth, ears, hands or fingers.
- No new people, objects, accessories, text or logos unless explicitly requested.
- Do not change the camera or composition unless explicitly requested.

USER REQUEST:
`;

export async function editImage(image: ImageFile, prompt: string): Promise<ImageFile> {
    const finalPrompt = IMAGE_EDIT_MASTER_PROMPT + prompt.trim();
    return generateImage([image], finalPrompt, null);
}

const PROMPT_ENGINE_MASTER = `You are a senior commercial image prompt director.

Transform the user's idea into a production-ready image-generation prompt.

PROMPT CONTRACT:
- Preserve the user's core subject, product identity and intent.
- Add concrete visual direction: subject, composition, camera/lens perspective, lighting, environment, materials, color palette, mood, depth, texture and finishing.
- Prefer specific visual language over vague adjectives.
- Resolve ambiguity with restrained, commercially plausible choices.
- Keep brand/product identity stable when a reference image is involved.
- Do not invent brand names, slogans, claims, people or product features that the user did not request.
- Write one coherent prompt optimized for an image model.
- Output ONLY the final English image prompt; no analysis, headings or commentary.
`;

export async function generatePromptFromText(instructions: string): Promise<string> {
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `${PROMPT_ENGINE_MASTER}

USER IDEA:
${instructions.trim()}`,
        config: { safetySettings }
    });
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
    // Expansion is an image edit, so use the preservation-first edit contract
    // rather than the general generation contract.
    const finalPrompt = IMAGE_EDIT_MASTER_PROMPT + `Expand the canvas naturally: ${prompt.trim()}`;
    return generateImage([image], finalPrompt, null);
}
