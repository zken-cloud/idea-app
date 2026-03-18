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

export async function summarizePost(content: string, imageUrls?: string[]): Promise<string> {
  const prompt = `Summarize the following post and the attached images. Keep it concise. Max 3 sentences.\n\nPost Content:\n${content}`;

  const parts: any[] = [{ text: prompt }];

  if (imageUrls && imageUrls.length > 0) {
    for (const url of imageUrls) {
      if (!url.trim()) continue;
      try {
        const response = await fetch(url.trim());
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString("base64");
        const mimeType = response.headers.get("content-type") || "image/jpeg";
        parts.push({
          inlineData: {
            data: base64,
            mimeType,
          },
        });
      } catch (e) {
        console.error("Failed to fetch image for summarization:", url, e);
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
