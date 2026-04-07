import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// The API key is injected by the platform into process.env.GEMINI_API_KEY
// If the user selects their own key, it's in process.env.API_KEY
const getApiKey = () => process.env.API_KEY || process.env.GEMINI_API_KEY || "";

export const MODEL_NAME = "gemini-3.1-flash-image-preview";

async function resizeImage(base64: string, maxDimension: number = 1024): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDimension) {
          height *= maxDimension / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width *= maxDimension / height;
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(base64);
      }
    };
    img.onerror = () => resolve(base64);
    img.src = base64;
  });
}

export async function editLandscapeImage(
  base64Image: string,
  prompt: string,
  mimeType: string = "image/png",
  maskImage?: string
): Promise<{ imageUrl: string; text?: string; errorType?: 'quota' | 'other' }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { imageUrl: "", text: "Error: API key is missing. Please check your configuration." };
  }

  console.log("Starting editLandscapeImage with prompt:", prompt);
  
  // Resize images to prevent timeouts and payload issues
  const resizedMainImage = await resizeImage(base64Image);
  const resizedMaskImage = maskImage ? await resizeImage(maskImage) : undefined;

  const ai = new GoogleGenAI({ apiKey });
  
  const parts: any[] = [
    {
      inlineData: {
        data: resizedMainImage.split("base64,")[1],
        mimeType: "image/jpeg",
      },
    },
  ];

  if (resizedMaskImage) {
    parts.push({
      inlineData: {
        data: resizedMaskImage.split("base64,")[1],
        mimeType: "image/jpeg",
      },
    });
    parts.push({
      text: `You are a professional space designer and architect (expert in both landscape and interior design). Modify the provided image based on this request: ${prompt}. 
      A mask image has been provided where the white areas indicate the region you should EXCLUSIVELY focus on and modify. 
      Do NOT change anything outside of the masked area. Return the modified image. 
      If you have any specific advice or notes about the design, include them as text.`,
    });
  } else {
    parts.push({
      text: `You are a professional space designer and architect (expert in both landscape and interior design). Modify the provided image based on this request: ${prompt}. 
      Return the modified image. If you have any specific advice or notes about the design, include them as text.`,
    });
  }

  try {
    console.log("Sending request to Gemini...");
    
    // Create a timeout promise - increased to 120 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request to Gemini timed out after 120 seconds. This can happen with complex designs or high server load.")), 120000)
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("429");
    return { 
      imageUrl: "", 
      text: `An error occurred: ${errorMessage}`,
      errorType: isQuotaError ? 'quota' : 'other'
    };
  }
}

export async function generateInitialLandscape(prompt: string): Promise<{ imageUrl: string; text?: string; errorType?: 'quota' | 'other' }> {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("GEMINI_API_KEY is missing");
    return { imageUrl: "", text: "Error: API key is missing. Please check your configuration." };
  }

  console.log("Starting generateInitialLandscape with prompt:", prompt);
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    console.log("Sending request to Gemini...");
    
    // Create a timeout promise - increased to 120 seconds
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Request to Gemini timed out after 120 seconds. This can happen with complex designs or high server load.")), 120000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: MODEL_NAME,
        contents: {
          parts: [
            {
              text: `Generate a professional space design visualization (landscape or interior) based on this description: ${prompt}. Ensure it looks realistic and high-quality.`,
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const isQuotaError = errorMessage.toLowerCase().includes("quota") || errorMessage.toLowerCase().includes("429");
    return { 
      imageUrl: "", 
      text: `An error occurred: ${errorMessage}`,
      errorType: isQuotaError ? 'quota' : 'other'
    };
  }
}
