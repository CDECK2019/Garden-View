import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// The API key is injected by the platform into process.env.GEMINI_API_KEY
const apiKey = process.env.GEMINI_API_KEY || "";

export const MODEL_NAME = "gemini-2.5-flash-image";

export async function editLandscapeImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png",
  maskImage?: string
): Promise<{ imageUrl: string; text?: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { imageUrl: "", text: "Error: API key is missing. Please check your configuration." };
  }

  console.log("Starting editLandscapeImage with prompt:", prompt);
  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [
    {
      inlineData: {
        data: base64Image.includes("base64,") ? base64Image.split("base64,")[1] : base64Image,
        mimeType: mimeType,
      },
    },
  ];

  if (maskImage) {
    parts.push({
      inlineData: {
        data: maskImage.includes("base64,") ? maskImage.split("base64,")[1] : maskImage,
        mimeType: "image/png",
      },
    });
    parts.push({
      text: `You are a professional landscape architect. Modify the provided image based on this request: ${prompt}. 
      A mask image has been provided where the white areas indicate the region you should EXCLUSIVELY focus on and modify. 
      Do NOT change anything outside of the masked area. Return the modified image. 
      If you have any specific advice or notes about the design, include them as text.`,
    });
  } else {
    parts.push({
      text: `You are a professional landscape architect. Modify the provided image based on this request: ${prompt}. 
      Return the modified image. If you have any specific advice or notes about the design, include them as text.`,
    });
  }

  try {
    console.log("Sending request to Gemini...");
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request to Gemini timed out after 60 seconds")), 60000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: parts,
        },
      }),
      timeoutPromise
    ]) as any;

    console.log("Received response from Gemini:", response);

    let imageUrl = "";
    let text = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("Found image in response");
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    if (!imageUrl && text) {
      console.warn("No image returned, but text was found:", text);
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Error in editLandscapeImage API call:", error);
    return { imageUrl: "", text: `An error occurred: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function generateInitialLandscape(prompt: string): Promise<{ imageUrl: string; text?: string }> {
  const apiKey = process.env.GEMINI_API_KEY || "";
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { imageUrl: "", text: "Error: API key is missing. Please check your configuration." };
  }

  console.log("Starting generateInitialLandscape with prompt:", prompt);
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Sending request to Gemini...");
    
    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request to Gemini timed out after 60 seconds")), 60000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              text: `Generate a professional landscape design visualization based on this description: ${prompt}. Ensure it looks realistic and high-quality.`,
            },
          ],
        },
      }),
      timeoutPromise
    ]) as any;

    console.log("Received response from Gemini:", response);

    let imageUrl = "";
    let text = "";

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          console.log("Found image in response");
        } else if (part.text) {
          text += part.text;
        }
      }
    }

    return { imageUrl, text };
  } catch (error) {
    console.error("Error in generateInitialLandscape API call:", error);
    return { imageUrl: "", text: `An error occurred: ${error instanceof Error ? error.message : String(error)}` };
  }
}
