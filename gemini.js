import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

const response = await ai.models.generateContent({
  model: "gemini-2.0-flash",
  contents: "Explain recursion simply",
});

console.log(response.text);