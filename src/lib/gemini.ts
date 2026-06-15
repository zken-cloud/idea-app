import { GoogleGenAI } from '@google/genai';

// Initialize Gemini with Vertex AI
let ai: GoogleGenAI | null = null;

function getAi(): GoogleGenAI {
  if (!ai) {
    ai = new GoogleGenAI({
      project: process.env.GOOGLE_CLOUD_PROJECT || 'zken-genai',
      location: 'global',
      vertexai: true
    });
  }
  return ai;
}

export const geminiModel = 'gemini-2.5-flash';

export const generationConfig = {
  maxOutputTokens: 65535,
  temperature: 1,
  topP: 0.95,
  safetySettings: [
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    },
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_LOW_AND_ABOVE',
    }
  ],
};

// Only allow fetching images from our own public GCS bucket host. This blocks
// SSRF (e.g. cloud metadata at 169.254.169.254, internal services, localhost)
// since post image URLs are always written as storage.googleapis.com/<bucket>/...
const ALLOWED_IMAGE_HOST = 'storage.googleapis.com';
const MAX_IMAGE_BYTES = 10 * 1024 * 1024; // 10MB

function isAllowedImageUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && url.hostname === ALLOWED_IMAGE_HOST;
  } catch {
    return false;
  }
}

export async function summarizePost(content: string, imageUrls?: string[]): Promise<string> {
  const prompt = `Summarize the following post and the attached images. Keep it concise. Max 3 sentences.\n\nPost Content:\n${content}`;

  const parts: any[] = [{ text: prompt }];

  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      const trimmed = url.trim();
      if (!trimmed) continue;
      if (!isAllowedImageUrl(trimmed)) {
        console.error("Skipping disallowed image URL for summarization");
        continue;
      }
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);
        const response = await fetch(trimmed, {
          redirect: "error",
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const buffer = await response.arrayBuffer();
        if (buffer.byteLength > MAX_IMAGE_BYTES) {
          console.error("Skipping oversized image for summarization");
          continue;
        }
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        parts.push({
          inlineData: {
            data: base64,
            mimeType,
          },
        });
      } catch (e) {
        console.error("Failed to fetch image for summarization:", e);
      }
    }
  }

  try {
    const response = await getAi().models.generateContent({
      model: geminiModel,
      contents: [{ role: "user", parts }],
      config: generationConfig as any,
    });

    return response.text || "No summary generated.";
  } catch (error) {
    console.error("Gemini Summarization Error:", error);
    throw error;
  }
}
