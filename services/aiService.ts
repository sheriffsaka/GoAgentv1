
import { GoogleGenAI, Type } from "@google/genai";
import { DriveSubmission, VerificationResult } from "../types";

const getAI = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey.length < 5) {
    throw new Error("TERMINAL_AUTH_MISSING");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const AIService = {
  verifyFieldVisit: async (submission: DriveSubmission): Promise<VerificationResult> => {
    try {
      const ai = getAI();
      const prompt = `
        Verify the existence and details of the following property lead in Nigeria:
        Property Name: ${submission.propertyName}
        Address: ${submission.propertyAddress}, ${submission.stateLocation}
        Claimed Details: ${submission.propertyType} with approximately ${submission.noOfUnits} units.
        
        Tasks:
        1. Find if this property actually exists at this address.
        2. Check if the reported unit count matches public records.
        3. Identify any red flags.
        4. Provide a Verification Score (0-100) and a verdict: AUTHENTIC, SUSPICIOUS, or INCONCLUSIVE.

        Return the data strictly as a JSON object with properties: score, verdict, findings, sources (empty array).
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
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

      let result: any = {};
      try {
        result = JSON.parse(response.text || "{}");
      } catch (e) {
        throw new Error("AI returned invalid JSON: " + response.text);
      }
      
      const searchSources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: String(chunk.web?.title || "Search Verification Source"),
        uri: String(chunk.web?.uri || "")
      })).filter((s: any) => s.uri) || [];

      // Strict validation of findings to ensure it's a string
      const findings = typeof result.findings === 'object' 
        ? JSON.stringify(result.findings) 
        : String(result.findings || "No specific findings recorded.");

      const existingSources = Array.isArray(result.sources) ? result.sources : [];

      return {
        score: typeof result.score === 'number' ? result.score : 0,
        verdict: (['AUTHENTIC', 'SUSPICIOUS', 'INCONCLUSIVE'].includes(result.verdict) ? result.verdict : 'INCONCLUSIVE') as any,
        findings: findings,
        sources: [...existingSources, ...searchSources]
      };
    } catch (error: any) {
      console.error("AI Verification Error:", error);
      if (error.message === "TERMINAL_AUTH_MISSING") {
        return {
          score: 0,
          verdict: 'INCONCLUSIVE',
          findings: "Verification Blocked: API_KEY environment variable is not set on the production server.",
          sources: []
        };
      }
      return {
        score: 0,
        verdict: 'INCONCLUSIVE',
        findings: "System error during AI verification. Manual check required.",
        sources: []
      };
    }
  },

  analyzeLead: async (submission: DriveSubmission) => {
    try {
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

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
      });
      return String(response.text || "No analysis available.");
    } catch (error) {
      return "Unable to generate AI analysis at this time.";
    }
  },

  getMarketIntel: async () => {
    const prompt = "What are the latest real estate market trends and property management news in Nigeria for 2024? Focus on prop-tech and estate management.";
    
    try {
      const ai = getAI();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        title: String(chunk.web?.title || "Market Intelligence Source"),
        uri: String(chunk.web?.uri || "")
      })).filter((s: any) => s.uri) || [];

      return {
        text: String(response.text || "No market intelligence available at this time."),
        sources: sources.slice(0, 5)
      };
    } catch (error: any) {
      console.warn("Market Intel Failure:", error);
      
      if (error.message === "TERMINAL_AUTH_MISSING") {
        return {
          text: "ERROR: [TERMINAL_AUTH_OFFLINE]\nThe AI Intelligence module requires an API_KEY environment variable.",
          sources: []
        };
      }

      try {
        const ai = getAI();
        const fallbackResponse = await ai.models.generateContent({
          model: 'gemini-3-pro-preview',
          contents: prompt + "\n(Note: Search tool currently limited.)",
        });
        return {
          text: String(fallbackResponse.text || "Market Insight: Increasing urbanization is driving prop-tech demand."),
          sources: []
        };
      } catch (innerError) {
        return {
          text: "Terminal update in progress. Market demand remains strong.",
          sources: []
        };
      }
    }
  }
};
