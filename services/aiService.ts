
import { GoogleGenAI, Type } from "@google/genai";
import { DriveSubmission, VerificationResult } from "../types";

const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || "";
  } catch (e) {
    return "";
  }
};

// Use a helper to get the AI instance only when needed
const getAI = () => new GoogleGenAI({ apiKey: getApiKey() });

export const AIService = {
  /**
   * Uses Gemini with Search Grounding to verify if a property lead is legitimate.
   */
  verifyFieldVisit: async (submission: DriveSubmission): Promise<VerificationResult> => {
    const ai = getAI();
    const prompt = `
      Verify the existence and details of the following property lead in Nigeria:
      Property Name: ${submission.propertyName}
      Address: ${submission.propertyAddress}, ${submission.stateLocation}
      Claimed Details: ${submission.propertyType} with approximately ${submission.noOfUnits} units.
      
      Tasks:
      1. Use Google Search to find if this property actually exists at this address.
      2. Check if the reported unit count and type (Residential/Commercial) match public records or maps.
      3. Identify any red flags (e.g., address belongs to a different building, property is known by a different name).
      4. Provide a Verification Score (0-100) and a verdict: AUTHENTIC, SUSPICIOUS, or INCONCLUSIVE.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.NUMBER },
              verdict: { type: Type.STRING },
              findings: { type: Type.STRING },
              sources: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    uri: { type: Type.STRING }
                  }
                }
              }
            },
            required: ["score", "verdict", "findings", "sources"]
          }
        },
      });

      const result = JSON.parse(response.text);
      return result;
    } catch (error) {
      console.error("AI Verification Error:", error);
      return {
        score: 0,
        verdict: 'INCONCLUSIVE',
        findings: "System error during AI verification. Manual review required.",
        sources: []
      };
    }
  },

  analyzeLead: async (submission: DriveSubmission) => {
    const ai = getAI();
    const prompt = `
      As a Real Estate Growth Expert for EstateGO, analyze this property lead:
      Property: ${submission.propertyName} (${submission.propertyType})
      Units: ${submission.noOfUnits}, Occupancy: ${submission.occupancyRate}%
      Interest Level: ${submission.interestLevel}
      Feedback: ${submission.feedback}
      
      Provide a concise 3-sentence summary of the opportunity, a Lead Quality Score out of 100, 
      and 3 recommended next steps for the sales team.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("AI Lead Analysis Error:", error);
      return "Unable to generate AI analysis at this time.";
    }
  },

  getMarketIntel: async () => {
    const ai = getAI();
    const prompt = "What are the latest real estate market trends and property management news in Nigeria for 2024? Focus on prop-tech and estate management.";
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: chunk.web?.title || "Source",
        uri: chunk.web?.uri
      })) || [];

      return {
        text: response.text,
        sources: sources.slice(0, 3)
      };
    } catch (error) {
      console.error("Market Intel Error:", error);
      return {
        text: "Could not fetch latest market trends. Focus on high-occupancy estates in Lagos and Abuja.",
        sources: []
      };
    }
  }
};
