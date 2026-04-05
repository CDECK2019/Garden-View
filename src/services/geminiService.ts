import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// The API key is injected by the platform into process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || "";

export const MODEL_NAME = "gemini-2.5-flash-image";

export async function editLandscapeImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png"
): Promise<{ imageUrl: string; text?: string }> {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Image.split(",")[1] || base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: `You are a professional landscape architect. Modify the provided image based on this request: ${prompt}. Return the modified image. If you have any specific advice or notes about the design, include them as text.`,
        },
      ],
    },
  });

  let imageUrl = "";
  let text = "";

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }
  }

  return { imageUrl, text };
}

export async function generateInitialLandscape(prompt: string): Promise<{ imageUrl: string; text?: string }> {
  const ai = new GoogleGenAI({ apiKey });
  
  const response = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: {
      parts: [
        {
          text: `Generate a professional landscape design visualization based on this description: ${prompt}. Ensure it looks realistic and high-quality.`,
        },
      ],
    },
  });

  let imageUrl = "";
  let text = "";

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }
  }

  return { imageUrl, text };
}
