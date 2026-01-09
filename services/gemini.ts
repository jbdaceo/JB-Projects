import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson, AppSection, AssistantMessage, Persona, ChatMsg, GameState, CEFRLevel, SpecializationTrack, SRSItem, AIAgent, CityData, Language } from "../types";

const cache = new Map<string, any>();

const getFromCache = (key: string) => cache.get(key);
const setInCache = (key: string, value: any) => {
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey); 
  }
  cache.set(key, value);
};

/**
 * Multi-Agent Room Manager: Decides who talks next and generates their response.
 * Strictly enforces street slang and city-specific vernacular.
 */
export const getRoomAgentResponse = async (
  agents: AIAgent[],
  history: ChatMsg[],
  city: CityData,
  uiLang: Language,
  userMessage?: string
): Promise<{ personaId: string; text: string; shouldSpeak: boolean }[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const agentsDesc = agents.map(a => 
    `ID: ${a.id}, Name: ${a.name}, City: ${a.city}, Persona: ${a.persona}, Specialties: ${a.specialties.join(', ')}`
  ).join('\n');

  // Enforce street-level slang based on UI setting:
  // UI Language EN -> Learning Spanish from Colombians.
  // UI Language ES -> Learning English from Americans.
  const targetLang = uiLang === 'en' ? 'SPANISH' : 'ENGLISH';
  const targetCulture = uiLang === 'en' ? 'Colombian Street' : 'American Street';

  const prompt = `
    Multi-Agent Community Room Manager.
    Current Context: Conversations in ${city.country === 'CO' ? 'Colombia' : 'USA'}.
    
    User's UI Language: ${uiLang}.
    Target Response Language: ${targetLang}.
    
    Agents Pool (${targetCulture}):
    ${agentsDesc}

    Recent History:
    ${history.map(h => `${h.user}: ${h.text}`).join('\n')}
    ${userMessage ? `New Input: "${userMessage}"` : "Bootstrap greeting."}

    CRITICAL INSTRUCTION FOR TONE AND VERNACULAR:
    1. Agents must speak like they are in a TikTok or Instagram comment section. 
    2. USE HEAVY STREET SLANG specific to their city.
       - If Bogotá: Use "parce", "paila", "gonorrea" (contextually), "su mercé" (if older/sarcastic), "firme".
       - If Medellín: Use "mijo", "qué chimba", "parche", "nea", "visaje".
       - If NYC: Use "facts", "deadass", "on god", "word to", "mad", "b", "yo".
       - If LA: Use "no cap", "bet", "finna", "bruh", "periodt", "vibing", "lowkey".
    3. Keep it raw, energetic, and highly authentic. Do not sound like a helpful assistant; sound like a group of friends chatting.

    JSON Output Format:
    [{"personaId": "ID", "text": "Raw street message in ${targetLang}", "shouldSpeak": boolean}]
  `;

  try {
    // Note: googleSearch is removed here because it can interfere with strict JSON response parsing.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              personaId: { type: Type.STRING },
              text: { type: Type.STRING },
              shouldSpeak: { type: Type.BOOLEAN }
            },
            required: ["personaId", "text", "shouldSpeak"]
          }
        },
        temperature: 0.9 // Higher temperature for more creative slang
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Multi-agent Decision Error:", e);
    return [{ personaId: agents[0].id, text: uiLang === 'en' ? "Epa, el internet anda lento pero aquí seguimos, parce." : "Yo, net's buggin' but we still here, deadass.", shouldSpeak: true }];
  }
};

/**
 * Get response from a specific AI persona.
 */
export const getPersonaResponse = async (persona: string, text: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `You are an AI assistant persona named ${persona}. Provide a short, culturally relevant response in a street-authentic tone to: "${text}"`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text || "...";
    } catch (e) {
        return "...";
    }
};

/**
 * Provide a hint for a word game based on the current state.
 */
export const getGameHint = async (gameState: GameState): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Provide a very short, helpful hint (in English or Spanish depending on context) for someone trying to guess the missing word in this game state: ${JSON.stringify(gameState)}. Don't give the answer away directly.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt
        });
        return response.text || "Think about the context!";
    } catch (e) {
        return "You've got this!";
    }
};

export const evaluatePronunciation = async (
  target: string,
  transcript: string,
  nativeLang: Language
): Promise<{ score: number; feedback: string; wordScores: { word: string; status: 'good' | 'ok' | 'bad' }[] }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Evaluate pronunciation: Target "${target}", Spoke "${transcript}". Native: ${nativeLang}. Score 0-100 and give feedback.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            feedback: { type: Type.STRING },
            wordScores: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  word: { type: Type.STRING }, 
                  status: { 
                    type: Type.STRING,
                    description: "Status of pronunciation for this word: 'good', 'ok', or 'bad'."
                  } 
                },
                required: ["word", "status"]
              } 
            }
          },
          required: ["score", "feedback", "wordScores"]
        }
      }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) { return { score: 0, feedback: "Error", wordScores: [] }; }
};

export const getPronunciation = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 200) }] }],
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: voiceName } 
          } 
        } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (e) { return ''; }
};

export const generateSRSBatch = async (level: CEFRLevel, track: SpecializationTrack, lang: 'es' | 'en', count: number = 6): Promise<SRSItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Generate ${count} vocabulary learning items for ${level} students in the ${track} track. Return an array of objects.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              term: { type: Type.STRING },
              translation: { type: Type.STRING },
              context: { type: Type.STRING }
            },
            required: ["term", "translation", "context"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]').map((r: any, i: number) => ({ id: `srs-${Date.now()}-${i}`, term: r.term, translation: r.translation, context: r.context, level, nextReview: Date.now(), interval: 0, repetition: 0, easeFactor: 2.5 }));
  } catch (e) { return []; }
};

export const generateLesson = async (topic: string, level: number, lang: 'es'|'en', userTier: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Create a language lesson about "${topic}" for Level ${level} students in the ${userTier} tier. Provide content in both English and Spanish where appropriate.`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  level: { type: Type.STRING },
                  content: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      es: { type: Type.STRING }
                    },
                    required: ["en", "es"]
                  },
                  summary: {
                    type: Type.OBJECT,
                    properties: {
                      en: { type: Type.STRING },
                      es: { type: Type.STRING }
                    },
                    required: ["en", "es"]
                  },
                  vocabulary: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        example: { type: Type.STRING }
                      },
                      required: ["word", "translation", "example"]
                    }
                  },
                  quiz: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["question", "options", "answer"]
                    }
                  }
                },
                required: ["title", "topic", "level", "content", "summary", "vocabulary", "quiz"]
              }
            }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) { throw e; }
};

export const tutorChat = async (history: AssistantMessage[], systemInstruction: string, lang: 'es'|'en') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
            config: { systemInstruction }
        });
        return { text: response.text || "...", type: "explanation" as const };
    } catch(e) { return { text: "Error", type: "explanation" as const }; }
};

export const assistantChat = async (history: AssistantMessage[], section: string, lang: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
            config: { systemInstruction: `You are the ILS Assistant. Section: ${section}. Lang: ${lang}.` }
        });
        return { text: response.text || "Hi!", suggestion: null };
    } catch (e) { return { text: "Error", suggestion: null }; }
};

export function decodeBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export interface JobListing { title: string; company: string; location: string; salary?: string; description: string; url?: string; postedTime?: string; source?: string; }

export const searchBilingualJobs = async (lang: 'es' | 'en'): Promise<JobListing[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    // Note: googleSearch is removed here because it can interfere with strict JSON response parsing.
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate 18 realistic BILINGUAL job listings for remote work and Colombia. Return an array of job listing objects.",
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              salary: { type: Type.STRING },
              description: { type: Type.STRING },
              url: { type: Type.STRING },
              postedTime: { type: Type.STRING },
              source: { type: Type.STRING }
            },
            required: ["title", "company", "location", "description"]
          }
        }
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) { return []; }
}
