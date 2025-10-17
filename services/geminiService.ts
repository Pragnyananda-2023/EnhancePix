import { GoogleGenAI, Modality } from "@google/genai";

if (!process.env.API_KEY) {
  // This is a fallback for development; in a real environment, the key should always be present.
  // In this context, we assume process.env.API_KEY is populated by the runtime.
  console.warn("API_KEY environment variable is not set. Using a placeholder.");
}

interface EditImageProps {
  base64Data: string;
  mimeType: string;
  prompt: string;
}

const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1000;

// Helper function to parse raw errors into user-friendly messages
const parseApiError = (error: unknown): Error => {
  if (error instanceof Error) {
    // If it's one of our custom, already-friendly errors, just return it.
    if (error.message.includes("safety policies") || error.message.includes("model stopped for the following reason")) {
        return error;
    }
      
    try {
      // The error message from the SDK might be a JSON string.
      const parsedError = JSON.parse(error.message);
      if (parsedError?.error?.message) {
        const apiError = parsedError.error;
        
        if (apiError.status === 'RESOURCE_EXHAUSTED') {
          return new Error("You've exceeded your current API quota. Please check your plan and billing details.");
        }
        
        if (apiError.code >= 500 || apiError.status === 'UNKNOWN' || apiError.message.includes('xhr error')) {
            return new Error("A temporary server error occurred while contacting the AI service. Please try again in a moment.");
        }
        
        return new Error(`An API error occurred: ${apiError.message}`);
      }
    } catch (e) {
      // The message was not a valid JSON string, which is fine.
      // We'll fall through and use the original error message.
    }
    return new Error(error.message);
  }
  
  return new Error("An unknown error occurred while editing the image.");
};

// Helper to determine if an error is worth retrying
const isRetryableError = (error: unknown): boolean => {
    if (error instanceof Error) {
        // Do not retry on model refusals like safety blocks.
        if (error.message.includes("safety policies") || error.message.includes("model stopped for the following reason")) {
            return false;
        }

        try {
            const parsedError = JSON.parse(error.message);
            const apiError = parsedError?.error;
            if (apiError) {
                // Retry on 5xx errors or UNKNOWN status, but not on client errors (4xx) like quota issues.
                return apiError.code >= 500 || apiError.status === 'UNKNOWN';
            }
        } catch (e) {
            // Not a JSON error. Could be a network flake, which is worth retrying.
            return true;
        }
    }
    return false;
}

export const editImage = async ({ base64Data, mimeType, prompt }: EditImageProps): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "YOUR_API_KEY" });
  
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
      try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                {
                    inlineData: {
                    data: base64Data,
                    mimeType: mimeType,
                    },
                },
                {
                    text: prompt,
                },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        const candidate = response.candidates?.[0];

        if (!candidate) {
          throw new Error("The model did not return a valid response. Please try again.");
        }
        
        // Check for non-OK finish reasons, especially safety.
        if (candidate.finishReason && candidate.finishReason !== 'STOP' && candidate.finishReason !== 'MAX_TOKENS') {
            if (candidate.finishReason.includes('SAFETY')) {
                // This is a non-retryable error. Catches 'SAFETY', 'IMAGE_SAFETY', etc.
                throw new Error("The request was refused due to safety policies. Please adjust your prompt or use a different image.");
            }
            // For other reasons like RECITATION, OTHER, etc.
            throw new Error(`Image generation failed. The model stopped for the following reason: ${candidate.finishReason}.`);
        }
        
        for (const part of candidate.content?.parts || []) {
            if (part.inlineData) {
                const newMimeType = part.inlineData.mimeType;
                const newBase64Data = part.inlineData.data;
                return `data:${newMimeType};base64,${newBase64Data}`;
            }
        }
        
        // This is a fallback if the finish reason was STOP but no image was in the parts.
        throw new Error("No image was generated in the response. The model may have refused the request for an unstated reason.");
      
    } catch (error) {
        const isLastAttempt = attempt > MAX_RETRIES;
        const shouldRetry = !isLastAttempt && isRetryableError(error);

        if (shouldRetry) {
             console.warn(`Attempt ${attempt} to edit image failed. Retrying...`);
             await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)));
        } else {
            console.error(`Editing image failed after ${attempt} attempt(s). Original error:`, error);
            throw parseApiError(error);
        }
    }
  }
  
  // This line should not be reachable if MAX_RETRIES >= 0, but it satisfies TypeScript's need for a return path.
  throw new Error("Image editing failed after multiple retries.");
};