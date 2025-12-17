
import { GoogleGenAI } from "@google/genai";
import { DriveSubmission } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const AIService = {
  /**
   * Uses Gemini to analyze a property lead and provide a summary + score.
   */
  analyzeLead: async (submission: DriveSubmission) => {
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

  /**
   * Fetches latest Nigerian real estate trends using Google Search Grounding.
   */
  getMarketIntel: async () => {
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
