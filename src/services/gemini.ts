import { GoogleGenAI, Type } from "@google/genai";
import { Flashcard, QuizQuestion } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function generateStudyMaterials(content: string) {
  const model = "gemini-3-flash-preview";

  const response = await ai.models.generateContent({
    model,
    contents: `Generate study materials from the following content:
    
    ${content}
    
    Provide the response in JSON format with the following structure:
    {
      "title": "A concise title for the study set",
      "notes": "Detailed, structured markdown notes with headings, bullet points, and bold text",
      "flashcards": [
        { "question": "Question text", "answer": "Answer text" }
      ],
      "quiz": [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The exact correct option string",
          "explanation": "Brief explanation of why this answer is correct"
        }
      ]
    }`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          notes: { type: Type.STRING },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "correctAnswer", "explanation"]
            }
          }
        },
        required: ["title", "notes", "flashcards", "quiz"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function chatWithMaterial(content: string, history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) {
  const model = "gemini-3-flash-preview";
  
  const chat = ai.chats.create({
    model,
    config: {
      systemInstruction: `You are a helpful AI study tutor. You are helping a student understand the following content:
      
      ${content}
      
      Answer questions concisely and clearly. If the answer is not in the content, use your general knowledge but mention it's outside the provided material.`,
    },
    history: history,
  });

  const response = await chat.sendMessage({ message });
  return response.text;
}
