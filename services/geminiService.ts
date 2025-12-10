import { GoogleGenAI } from "@google/genai";
import { Dimension, Software } from "../types";

export const generateComparisonAnalysis = async (
  dimensions: Dimension[],
  softwares: Software[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "API Key is missing. Please ensure process.env.API_KEY is set.";
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const dataContext = JSON.stringify({
    dimensions: dimensions.map(d => d.name),
    software_comparison: softwares.map(s => ({
      name: s.name,
      scores: s.scores
    }))
  }, null, 2);

  const prompt = `
    Act as a senior cybersecurity analyst. 
    Analyze the following JSON data representing a capability comparison of different Endpoint Protection Platforms (EPP) and Antivirus software.
    
    Data:
    ${dataContext}

    Please provide:
    1. A brief summary of the market landscape based on these scores.
    2. A "Best for..." recommendation for each software (e.g., Best for Performance, Best for Protection).
    3. An objective critique of the trade-offs (e.g., High security vs High resource usage).
    
    Format the output in clean Markdown. Keep it concise but professional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Failed to generate analysis. Please try again later.";
  }
};