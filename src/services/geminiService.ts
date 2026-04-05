import { GoogleGenAI } from "@google/genai";
import { ImageAngle, PropertyContext } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";

// gemini-3.1-flash-image-preview: supports image input + image output (for editing photos)
export const IMAGE_EDIT_MODEL = "gemini-3.1-flash-image-preview";
// imagen-4.0-generate-001: text-to-image generation only (for generating from scratch)
export const IMAGE_GEN_MODEL = "imagen-4.0-generate-001";
// gemini-2.5-flash: vision + text, no image output (for analysis, chat, material estimation)
export const CHAT_MODEL = "gemini-2.5-flash";

function extractBase64(dataUrl: string): string {
  return dataUrl.split(",")[1] || dataUrl;
}

function detectMimeType(dataUrl: string): string {
  if (dataUrl.startsWith("data:image/jpeg") || dataUrl.startsWith("data:image/jpg")) return "image/jpeg";
  if (dataUrl.startsWith("data:image/png")) return "image/png";
  if (dataUrl.startsWith("data:image/webp")) return "image/webp";
  if (dataUrl.startsWith("data:image/heic")) return "image/heic";
  if (dataUrl.startsWith("data:image/gif")) return "image/gif";
  return "image/jpeg";
}

function imagePart(dataUrl: string) {
  return {
    inlineData: {
      data: extractBase64(dataUrl),
      mimeType: detectMimeType(dataUrl),
    },
  };
}

/**
 * Edit a single landscape image using Gemini 2.5 Flash (which supports image output).
 * Falls back to a descriptive chat response if image generation fails.
 */
export async function editLandscapeImage(
  imageUrl: string,
  prompt: string,
  propertyContext?: PropertyContext
): Promise<{ imageUrl: string; text?: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const contextText = propertyContext
    ? `\n\nProperty context: ${propertyContext.summary}. Key features: ${propertyContext.features.map(f => `${f.type} at ${f.location}`).join(", ")}.`
    : "";

  // Use Gemini 3.1 Flash Image Preview for image in+out editing
  const response = await ai.models.generateContent({
    model: IMAGE_EDIT_MODEL,
    contents: {
      parts: [
        imagePart(imageUrl),
        {
          text: `You are a professional landscape architect and photorealistic image editor. Modify this property photo based on the following request: ${prompt}${contextText}

Make the edit photorealistic and seamlessly integrated into the existing scene. Preserve the same lighting, perspective, and style of the original photo. Return the modified image and briefly explain what you changed.`,
        },
      ],
    },
    config: {
      responseModalities: ["IMAGE", "TEXT"],
    },
  });

  let resultImageUrl = "";
  let text = "";

  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        resultImageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      } else if (part.text) {
        text += part.text;
      }
    }
  }

  return { imageUrl: resultImageUrl, text };
}

/**
 * Generate an initial landscape design from a text description using Imagen 4.0.
 */
export async function generateInitialLandscape(
  prompt: string
): Promise<{ imageUrl: string; text?: string }> {
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateImages({
    model: IMAGE_GEN_MODEL,
    prompt: `Professional photorealistic landscape design visualization: ${prompt}. 
Ground level residential property photo. Detailed believable landscape with natural lighting, real photography style.`,
    config: {
      numberOfImages: 1,
      outputMimeType: "image/jpeg",
    },
  });

  const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
  if (imageBytes) {
    return {
      imageUrl: `data:image/jpeg;base64,${imageBytes}`,
      text: "Here is a design concept based on your description.",
    };
  }

  return { imageUrl: "", text: "Could not generate an initial design. Please try again." };
}

/**
 * Edit all provided angles with the same prompt in parallel.
 */
export async function editAllAngles(
  images: ImageAngle[],
  prompt: string,
  propertyContext?: PropertyContext,
  onProgress?: (index: number, imageName: string) => void
): Promise<Array<{ id: string; imageUrl: string; text?: string }>> {
  const results = await Promise.allSettled(
    images.map(async (img, index) => {
      onProgress?.(index, img.name);
      const result = await editLandscapeImage(img.url, prompt, propertyContext);
      return { id: img.id, ...result };
    })
  );

  return results.map((r, index) =>
    r.status === "fulfilled"
      ? r.value
      : { id: images[index].id, imageUrl: images[index].url, text: "Edit failed for this angle." }
  );
}

/**
 * Analyze all property photos to build a comprehensive property context model.
 */
export async function analyzePropertyContext(
  images: ImageAngle[]
): Promise<PropertyContext> {
  const ai = new GoogleGenAI({ apiKey });

  const parts: object[] = images.map(img => imagePart(img.url));
  parts.push({
    text: `You are analyzing ${images.length} photos of a residential property taken from different angles (${images.map(i => i.name).join(", ")}).

Please analyze all photos together and respond with a JSON object (no markdown, just raw JSON) with this exact structure:
{
  "summary": "2-3 sentence summary of the property and yard",
  "features": [
    { "type": "feature name", "location": "where in the yard", "notes": "optional detail" }
  ],
  "estimatedSqFt": 0,
  "suggestedImprovements": ["improvement 1", "improvement 2", "improvement 3", "improvement 4", "improvement 5"]
}

Be specific: lawn condition, existing plants, hardscape, structures, fencing, drainage, etc.`,
  });

  const response = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: { parts },
    config: { responseModalities: ["TEXT"] },
  });

  const text = response.candidates?.[0]?.content?.parts
    ?.filter((p: { text?: string }) => p.text)
    ?.map((p: { text?: string }) => p.text)
    ?.join("") ?? "{}";

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    return {
      summary: parsed.summary ?? "Property analyzed.",
      features: parsed.features ?? [],
      estimatedSqFt: parsed.estimatedSqFt,
      suggestedImprovements: parsed.suggestedImprovements ?? [],
      analyzedAt: Date.now(),
    };
  } catch {
    return {
      summary: text.slice(0, 300),
      features: [],
      suggestedImprovements: [],
      analyzedAt: Date.now(),
    };
  }
}

/**
 * Multi-turn text chat with knowledge of all property photos.
 */
export async function chatWithPropertyContext(
  userMessage: string,
  images: ImageAngle[],
  propertyContext?: PropertyContext,
  history: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = []
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });

  const systemContext = `You are TerraForm AI, an expert landscape architect and designer assistant. 
You are helping a user design their property.${
    propertyContext
      ? ` Property summary: ${propertyContext.summary} Features: ${propertyContext.features.map(f => `${f.type} at ${f.location}`).join("; ")}.`
      : ""
  }
Answer design questions clearly and helpfully. When recommending changes you can show visually, suggest the user ask you to "apply" the change.`;

  const imageContextParts: object[] = images.length > 0
    ? [
        ...images.map(img => imagePart(img.url)),
        { text: `These are the property photos: ${images.map(i => i.name).join(", ")}. ${systemContext}` },
      ]
    : [{ text: systemContext }];

  const chat = ai.chats.create({
    model: CHAT_MODEL,
    history: [
      { role: "user", parts: imageContextParts },
      { role: "model", parts: [{ text: "I've reviewed your property photos and I'm ready to help you design your ideal landscape. What would you like to explore?" }] },
      ...history,
    ],
  });

  const response = await chat.sendMessage({ message: userMessage });
  return response.text ?? "I couldn't generate a response. Please try again.";
}

/**
 * AI-powered material quantity estimation from an image.
 */
export async function estimateMaterialsFromImage(
  imageUrl: string,
  propertyContext?: PropertyContext
): Promise<Array<{ name: string; estimatedQuantity: number; unit: string; reasoning: string }>> {
  const ai = new GoogleGenAI({ apiKey });

  const contextText = propertyContext?.estimatedSqFt
    ? ` The property is approximately ${propertyContext.estimatedSqFt} sq ft total.`
    : "";

  const response = await ai.models.generateContent({
    model: CHAT_MODEL,
    contents: {
      parts: [
        imagePart(imageUrl),
        {
          text: `Analyze this landscape photo and estimate material quantities needed.${contextText}

Respond with a JSON array (no markdown) like:
[
  { "name": "Premium Sod", "estimatedQuantity": 800, "unit": "sq ft", "reasoning": "visible lawn area" },
  { "name": "Mulch (Dark Brown)", "estimatedQuantity": 4, "unit": "cubic yard", "reasoning": "mulch beds around foundation" }
]

Only include materials visible or clearly needed based on the photo. Be conservative in estimates.`,
        },
      ],
    },
    config: { responseModalities: ["TEXT"] },
  });

  const text = response.candidates?.[0]?.content?.parts
    ?.filter((p: { text?: string }) => p.text)
    ?.map((p: { text?: string }) => p.text)
    ?.join("") ?? "[]";

  try {
    const cleaned = text.replace(/```json?\n?/g, "").replace(/```/g, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return [];
  }
}
