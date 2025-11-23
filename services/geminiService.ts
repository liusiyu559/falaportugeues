
import { GoogleGenAI, Type } from "@google/genai";
import { SessionReport } from "../types";
import { getApiKey } from "../utils/envUtils";

export const generateScenarioImage = async (topic: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const promptText = `Generate a hyper-realistic, photograph-style image of a daily life scene in Brazil related to: "${topic}". 
  The image MUST contain at least 10 distinct elements (people, objects, background details) to talk about. 
  The lighting should be natural. High resolution.`;

  try {
    // 1. Try High Quality Model
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: promptText }]
      },
      config: {
        imageConfig: {
          aspectRatio: "9:16",
          imageSize: "1K"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated from Pro model");

  } catch (error: any) {
    console.warn("Pro model generation failed (likely permission or quota), attempting fallback:", error);
    
    // 2. Fallback to Flash Image model
    try {
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: promptText }]
        },
        config: {
          imageConfig: {
            aspectRatio: "9:16"
          }
        }
      });

      for (const part of fallbackResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
    } catch (fallbackError) {
       console.error("Fallback image generation failed:", fallbackError);
    }

    // 3. Final fallback if everything fails
    return "https://picsum.photos/1080/1920?grayscale"; 
  }
};

export const generateReport = async (
  transcripts: {role: string, text: string}[], 
  mode: 'SCENARIO' | 'INTERVIEW',
  topic: string
): Promise<SessionReport> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key missing");
  
  const ai = new GoogleGenAI({ apiKey });
  
  const transcriptText = transcripts.map(t => `${t.role}: ${t.text}`).join('\n');
  
  const scenarioPrompt = `
    Context: The user practiced describing a photo of "${topic}" in Portuguese.
    Your Task:
    1. Summary: Write a vivid description of a typical scene of "${topic}" in Portuguese. Break it down into 4-5 sentences. For EACH sentence, provide the Portuguese text AND its Chinese translation.
    2. Vocabulary: Extract or suggest 6-8 key Nouns (Substantivos) and Verbs (Verbos) related to this scene. For each, provide the Portuguese word, its type, the Chinese definition, and a Portuguese example sentence.
    3. Corrections: Identify 3 critical grammar or pronunciation errors from the user's transcript and provide corrections.
    4. Feedback: Provide general advice on the user's syntax and expression.
    5. Score: Rate fluency from 1-10.
  `;

  const interviewPrompt = `
    Context: The user had a mock interview about "${topic}" in Portuguese.
    Your Task:
    1. Summary: Write ideal, fluent Portuguese answers to the main questions asked by the AI. Break it down into 4-5 sentences. For EACH sentence, provide the Portuguese text AND its Chinese translation.
    2. Vocabulary: Extract or suggest 6-8 key Nouns (Substantivos) and Verbs (Verbos) related to this interview topic. For each, provide the Portuguese word, its type, the Chinese definition, and a Portuguese example sentence.
    3. Corrections: Identify 3 critical grammar or pronunciation errors from the user's transcript and provide corrections.
    4. Feedback: Provide general advice on the user's syntax and expression.
    5. Score: Rate fluency from 1-10.
  `;

  const prompt = mode === 'SCENARIO' ? scenarioPrompt : interviewPrompt;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Transcript:\n${transcriptText}\n\n${prompt}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { 
            type: Type.ARRAY, 
            description: "List of translated sentences describing the scene or answering questions.",
            items: {
              type: Type.OBJECT,
              properties: {
                portuguese: { type: Type.STRING, description: "Portuguese sentence" },
                chinese: { type: Type.STRING, description: "Chinese translation of the sentence" }
              },
              required: ["portuguese", "chinese"]
            }
          },
          corrections: { type: Type.ARRAY, items: { type: Type.STRING } },
          vocabulary: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                type: { type: Type.STRING, description: "Noun or Verb" },
                definition: { type: Type.STRING, description: "Chinese Definition" },
                example: { type: Type.STRING, description: "Portuguese Example Sentence" }
              },
              required: ["word", "type", "definition", "example"]
            } 
          },
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING, description: "General advice on syntax and expression." }
        },
        required: ["summary", "corrections", "vocabulary", "score", "feedback"]
      }
    }
  });

  const jsonText = response.text || "{}";
  try {
    return JSON.parse(jsonText) as SessionReport;
  } catch (e) {
    console.error("Error parsing report JSON", e);
    return {
      summary: [{ portuguese: "Erro ao gerar.", chinese: "Error generating." }],
      corrections: [],
      vocabulary: [],
      score: 0,
      feedback: "Não foi possível analisar a conversa."
    };
  }
};
