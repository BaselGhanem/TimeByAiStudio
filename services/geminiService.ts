
import { GoogleGenAI, Type } from "@google/genai";
import { TaskEntry, DailyReport } from "../types";

export const analyzeDay = async (entries: TaskEntry[], date: string): Promise<Partial<DailyReport>> => {
  // Always use { apiKey: process.env.API_KEY } for initialization
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Analyze the following behavior data for the user on ${date}.
    The data consists of time-stamped activities and their categories.
    
    Data:
    ${JSON.stringify(entries)}
    
    Provide:
    1. Narrative: A 2-paragraph story of how the day went. Focus on focus vs shallow work.
    2. CEO Summary:
       - Top Risk: The most critical behavioral signal that threatens efficiency.
       - Top Opportunity: Where can the user improve or double down.
       - Recommendation: A clear directive for tomorrow.
    
    Be critical and data-driven.
  `;

  try {
    // Correct usage of generateContent with model name directly in parameters
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            ceoSummary: {
              type: Type.OBJECT,
              properties: {
                topRisk: { type: Type.STRING },
                topOpportunity: { type: Type.STRING },
                recommendation: { type: Type.STRING }
              },
              required: ["topRisk", "topOpportunity", "recommendation"]
            }
          },
          required: ["narrative", "ceoSummary"]
        }
      }
    });

    // Use .text property instead of .text() method
    const text = response.text || "{}";
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    return {
      narrative: "Intelligence engine currently unavailable. Please check your behavior manually.",
      ceoSummary: {
        topRisk: "System disconnection",
        topOpportunity: "Manual review",
        recommendation: "Continue tracking accurately"
      }
    };
  }
};
