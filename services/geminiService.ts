import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { ChatMessage, AnalysisResult } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction for the quiz analysis
const QUIZ_SYSTEM_PROMPT = `
You are the "Debt Eraser", a ruthless, no-nonsense financial strategist. 
Your goal is to analyze the user's financial situation based on 8 deep-dive questions.

You must assign a "Financial Archetype" (e.g., The Survivor, The Brawler, The Strategist) and a "Battle Plan".

CRITICAL: You must assign one of the following SPECIFIC "PDF Stacks" based on their answers:
1. "Mortgage Remedy Stack" (If mortgage/foreclosure mentioned)
2. "Repo Reversal Stack" (If car repossession/auto loans mentioned)
3. "Revolving Credit Stax" (If high credit card usage/utilization mentioned)
4. "Collections & Repo Stax" (If 3rd party collections mentioned)
5. "Administrative Remedy Stax" (If court/tickets/governmental issues mentioned)
6. "Credit Profile Sweep Stax" (General cleanup/inquiries/late payments)

Return purely JSON: { "archetype": "string", "plan": "string", "pdfStack": "string" }
`;

// System instruction for the community chatbot (War Room AI)
const CHAT_SYSTEM_PROMPT = `
You are the "War Room AI", a specialized expert system for the Debt Eraser Pro community.
You are trained on:
- FCRA (Fair Credit Reporting Act)
- FDCPA (Fair Debt Collection Practices Act)
- Metro 2 Compliance
- E-OSCAR system loopholes
- Factual Disputing strategies
- 1099-C Cancellation of Debt
- Contract Law regarding note issuance

Your Role:
- You help members create custom dispute letters.
- You explain complex legal codes in simple, aggressive terms.
- You are strictly on the side of the consumer.
- You DO NOT give legal advice, you give "educational strategies" based on federal law.

Tone:
- High-level consultant ($1000/hr value).
- Direct, no fluff.
- "We don't pay what we don't owe."

If asked about documents, refer to "The Vault".
If asked about process, refer to "The Classroom modules".
`;

export const analyzeQuizResults = async (answers: { question: string, answer: string }[]): Promise<AnalysisResult> => {
  try {
    const prompt = `
      User Profile:
      ${answers.map(a => `- ${a.question}: ${a.answer}`).join('\n')}
      
      Analyze and provide JSON output.
    `;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: QUIZ_SYSTEM_PROMPT,
        responseMimeType: "application/json"
      }
    });

    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Quiz Error:", error);
    return {
      archetype: "The Survivor",
      plan: "The system is failing. We'll bypass the API and go manual. Your situation requires immediate validation letters sent to all bureaus.",
      pdfStack: "Credit Profile Sweep Stax"
    };
  }
};

export const createChatSession = (): Chat => {
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: CHAT_SYSTEM_PROMPT,
    }
  });
};

export const sendMessageToBot = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    return response.text || "Connection interrupted. Try again.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "The encrypted channel is experiencing interference. Please try again.";
  }
};