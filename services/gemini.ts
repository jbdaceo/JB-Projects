
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson, AppSection, AssistantMessage, Persona, ChatMsg, GameState, CEFRLevel, SpecializationTrack, SRSItem } from "../types";

const cache = new Map<string, any>();

const getFromCache = (key: string) => {
  return cache.get(key);
};

const setInCache = (key: string, value: any) => {
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey); 
  }
  cache.set(key, value);
};

export const getSystemPromptForPersona = (persona: string, lang: 'es' | 'en') => {
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  if (persona.includes('Tom (UK)')) return `You are Tom from the UK. Refined British accent. Sophisticated but approachable.`;
  if (persona.includes('Manuela')) return `You are Manuela from Medellín. Sultry, sophisticated. Explain 'parce', 'bacano'. Seductive yet professional.`;
  if (persona.includes('Yerson Mosquera')) return `You are Yerson Mosquera. Chocó flavor. Urban, intelligent, verbose. Grra-pa-pa-pa!`;
  return `You are Professor Tomas Martinez. Friendly Colombian mentor.`;
};

// --- Missing functions for mockBackend.ts ---

/**
 * Get a natural response from a specific persona using Gemini
 */
export const getPersonaResponse = async (personaId: string, userText: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: userText,
      config: {
        systemInstruction: `You are a language learning persona named ${personaId}. Respond naturally to the user message in a helpful, bilingual context.`,
        temperature: 0.7,
      },
    });
    return response.text || "...";
  } catch (e) {
    console.error("Persona Response Error:", e);
    return "I am currently syncing my neural pathways. Please try again in a moment.";
  }
};

/**
 * Generate an educational hint for the bilingual word game
 */
export const getGameHint = async (gameState: GameState): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Give a short, helpful hint for a student trying to find the missing word in this bilingual game. 
  English: ${gameState.sentenceEn} (Missing: ${gameState.missingWordEn})
  Spanish: ${gameState.sentenceEs} (Missing: ${gameState.missingWordEs})
  Keep it encouraging and brief.`;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.3 }
    });
    return response.text || "Think about the translation of the neighboring words.";
  } catch (e) {
    return "Consider the context of the sentence.";
  }
};

export const generateSRSBatch = async (level: CEFRLevel, track: SpecializationTrack, lang: 'es' | 'en', count: number = 6): Promise<SRSItem[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const nativeLang = lang === 'es' ? 'Spanish' : 'English';
  const prompt = `Generate ${count} high-value vocabulary items for CEFR Level ${level} in ${track} track. Target: ${targetLang}. Native: ${nativeLang}. Include a context sentence for each.`;

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
        },
        temperature: 0.1,
      }
    });
    if (!response.text) throw new Error("Empty AI response");
    const raw = JSON.parse(response.text.trim());
    return raw.map((r: any, i: number) => ({
      id: `srs-${Date.now()}-${i}`,
      term: r.term,
      translation: r.translation,
      context: r.context,
      level,
      nextReview: Date.now(),
      interval: 0,
      repetition: 0,
      easeFactor: 2.5
    }));
  } catch (e) {
    console.error("SRS Gen Error:", e);
    return [];
  }
};

export const generateLesson = async (topic: string, level: number, lang: 'es'|'en', userTier: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Create a language lesson about "${topic}" at Level ${level}/100. Target: ${lang === 'es' ? 'English' : 'Spanish'}. Support: ${lang === 'es' ? 'Spanish' : 'English'}. 6-8 quiz questions.`;
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
                  numericLevel: { type: Type.NUMBER },
                  content: {
                    type: Type.OBJECT,
                    properties: {
                      concept: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, es: { type: Type.STRING } }, required: ["en", "es"] },
                      scenario: { type: Type.OBJECT, properties: { en: { type: Type.STRING }, es: { type: Type.STRING } }, required: ["en", "es"] }
                    },
                    required: ["concept", "scenario"]
                  },
                  vocabulary: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { word: { type: Type.STRING }, translation: { type: Type.STRING } }, required: ["word", "translation"] } },
                  quiz: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { question: { type: Type.STRING }, options: { type: Type.ARRAY, items: { type: Type.STRING } }, answer: { type: Type.STRING } }, required: ["question", "options", "answer"] } }
                },
                required: ["title", "topic", "level", "numericLevel", "content", "vocabulary", "quiz"]
              },
              temperature: 0.3
            }
        });
        return JSON.parse(response.text?.trim() || '{}');
    } catch (e) { throw e; }
};

export const getPronunciation = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const cacheKey = `tts_${voiceName}_${text.substring(0, 50)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: { parts: [{ text: text.substring(0, 200) }] },
      config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } } }
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    if (data) setInCache(cacheKey, data);
    return data;
  } catch (e) { return ''; }
};

export const generateCommunityChat = async (lang: 'es' | 'en', personalities: Persona[], history: ChatMsg[], userMessage?: string, activeTopic?: string, environment?: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const personasDesc = personalities.map(p => `${p.name} (${p.vibe})`).join(', ');
    const prompt = `Simulate cross-cultural conversation in ${environment || 'City'} about ${activeTopic || 'General'}. Characters: ${personasDesc}. Mixed EN/ES. Use slang. Recent History: ${history.map(h => `${h.user}: ${h.text}`).join('\n')}. ${userMessage ? `Respond to: "${userMessage}"` : 'Continue naturally.'}`;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: { type: Type.OBJECT, properties: { personaId: { type: Type.STRING }, text: { type: Type.STRING } }, required: ["personaId", "text"] }
              }
            }
        });
        return { messages: JSON.parse(response.text?.trim() || '[]'), newTopic: activeTopic, sources: [] };
    } catch (e) { return { messages: [], newTopic: activeTopic, sources: [] }; }
};

export const tutorChat = async (history: AssistantMessage[], persona: string, lang: 'es'|'en') => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
            config: { systemInstruction: `You are a language tutor. Persona: ${persona}. Lang: ${lang}.` }
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

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

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

export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url?: string;
  postedTime?: string;
  source?: 'LinkedIn' | 'Indeed' | 'El Empleo' | 'Remote.co' | 'Other';
}

export const searchBilingualJobs = async (lang: 'es' | 'en'): Promise<JobListing[]> => {
  const cacheKey = `jobs_v3_${lang}`; 
  const cached = getFromCache(cacheKey);
  if (cached) return cached;
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const searchPrompt = `Search for 18 recent BILINGUAL (Spanish/English) jobs. 
  Include: 
  1. 100% Remote Global roles.
  2. Local roles specifically in COLOMBIA (Bogotá, Medellín, Cali) from sources like El Empleo and LinkedIn Colombia.
  Output JSON: [{"title":"","company":"","location":"","salary":"","description":"","source":""}]`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: searchPrompt,
      config: { tools: [{googleSearch: {}}] }
    });
    let text = response.text || '[]';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    let jobs = JSON.parse(text);
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(jobs)) {
       jobs.forEach((job: any, index: number) => {
          if (!job.url && groundingChunks[index % groundingChunks.length]?.web?.uri) {
             job.url = groundingChunks[index % groundingChunks.length].web?.uri;
          }
       });
    }
    if (jobs.length > 0) { setInCache(cacheKey, jobs); return jobs; }
    return [];
  } catch (e) { return []; }
};
