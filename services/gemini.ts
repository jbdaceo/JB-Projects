
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson, AssistantMessage, ChatMsg, CEFRLevel, SpecializationTrack, SRSItem, AIAgent, CityData, Language, GameState, JobListing } from "../types";

// --- 1. ROBUST RETRY LOGIC ---
const withRetry = async <T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 2000
): Promise<T> => {
  try {
    return await operation();
  } catch (error: any) {
    // Check for Rate Limits (429) or Quota issues
    const isRateLimit = 
      error.status === 429 || 
      error.code === 429 || 
      (error.message && (
        error.message.includes('429') || 
        error.message.includes('quota') || 
        error.message.includes('RESOURCE_EXHAUSTED')
      ));

    if (isRateLimit) {
      if (retries <= 0) throw error;
      console.warn(`Gemini API: Rate limit hit. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      // Exponential backoff: 2s -> 4s -> 8s
      return withRetry(operation, retries - 1, delay * 2); 
    }
    
    // Check for Transient Server Errors
    const isTransient = 
      error.status === 500 || 
      error.status === 503 || 
      (error.message && (
        error.message.includes('xhr') || 
        error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('Rpc failed') ||
        error.message.includes('overloaded')
      ));

    if (isTransient) {
      if (retries <= 0) throw error;
      console.warn(`Gemini API: Transient error (${error.status}). Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
      return withRetry(operation, retries - 1, delay * 1.5);
    }
    
    throw error;
  }
};

// --- 2. MODEL FALLBACK ORCHESTRATOR ---
// Attempts Pro model first, falls back to Flash if Pro fails/exhausts quota
const runWithModelFallback = async <T>(
  generationTask: (modelName: string) => Promise<T>
): Promise<T> => {
  try {
    // Attempt 1: High Intelligence
    return await withRetry(() => generationTask('gemini-3-pro-preview'));
  } catch (error) {
    console.warn("Primary model (Pro) failed, attempting fallback to Flash...", error);
    try {
      // Attempt 2: High Speed / Lower Latency
      return await withRetry(() => generationTask('gemini-3-flash-preview'));
    } catch (finalError) {
      console.error("All models failed for this request.", finalError);
      throw finalError; // Propagate error to UI
    }
  }
};

// --- API SERVICES ---

export const generateLesson = async (topic: string, level: number, uiLang: Language, userTier: string): Promise<Lesson> => {
    return runWithModelFallback(async (modelName) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // LOGIC REINFORCEMENT:
        // uiLang 'es' -> User is Native Spanish, Learning English.
        // uiLang 'en' -> User is Native English, Learning Spanish.
        
        const nativeLang = uiLang === 'es' ? 'Spanish' : 'English';
        const targetLang = uiLang === 'es' ? 'English' : 'Spanish';

        const prompt = `
          ACT AS: Expert Language Architect.
          CONTEXT: User speaks ${nativeLang} perfectly. User is learning ${targetLang}.
          TASK: Create a comprehensive lesson about "${topic}".
          LEVEL: ${level} (1=Beginner, 100=Native).
          
          REQUIREMENTS:
          1. 'title': Engaging title in ${targetLang}.
          2. 'explanation': Clear grammar/context explanation in ${nativeLang} (so user understands).
          3. 'content': A reading passage or dialogue in ${targetLang} (approx 150 words).
          4. 'contentTranslation': Translation of content in ${nativeLang}.
          5. 'vocabulary': List of key words from the content. Definitions in ${nativeLang}.
          6. 'quiz': 10 distinct multiple choice questions. 
             - CRITICAL: 'question' MUST be in ${nativeLang} so the user understands what is being asked.
             - CRITICAL: 'options' and 'answer' MUST be in ${targetLang} to test proficiency.
             - STRICT CONSTRAINT: All 'options' MUST be words explicitly found in the 'content' text or the 'vocabulary' list of this JSON. DO NOT use external words.
             - CRITICAL: 'explanation' MUST be in ${nativeLang} to explain why the answer is correct.
          
          OUTPUT: JSON ONLY.
        `;

        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: { 
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  topic: { type: Type.STRING },
                  level: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  content: { type: Type.STRING },
                  contentTranslation: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  vocabulary: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        translation: { type: Type.STRING },
                        definitionEn: { type: Type.STRING },
                        definitionEs: { type: Type.STRING },
                        example: { type: Type.STRING }
                      },
                      required: ["word", "translation", "definitionEn", "definitionEs", "example"]
                    }
                  },
                  quiz: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        answer: { type: Type.STRING },
                        explanation: { type: Type.STRING }
                      },
                      required: ["id", "question", "options", "answer", "explanation"]
                    }
                  }
                },
                required: ["title", "explanation", "content", "contentTranslation", "vocabulary", "quiz"]
              }
            }
        });
        return {
          ...JSON.parse(response.text || '{}'),
          numericLevel: level
        };
    });
};

export const generateHardQuizItems = async (content: string, uiLang: Language): Promise<any[]> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const nativeLang = uiLang === 'es' ? 'Spanish' : 'English';
      const targetLang = uiLang === 'es' ? 'English' : 'Spanish';

      const prompt = `
        ACT AS: Ruthless Language Examiner.
        CONTEXT: Based on the following text: "${content.substring(0, 500)}...".
        TASK: Generate 5 EXTREMELY DIFFICULT multiple choice questions.
        FOCUS: Nuance, inference, complex grammar, and idiom usage within the text.
        
        REQUIREMENTS:
        - Question in ${nativeLang}.
        - Options and Answer in ${targetLang}.
        - KEEP OPTIONS SHORT (max 5 words) AND USE ONLY KNOWN VOCABULARY.
        - Explanation in ${nativeLang}.
      `;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["id", "question", "options", "answer", "explanation"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]');
  });
};

export const getSocraticHint = async (question: string, correctAnswer: string, context: string, uiLang: Language): Promise<string> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const nativeLang = uiLang === 'es' ? 'Spanish' : 'English';
      
      const prompt = `
        ACT AS: A Socratic Tutor.
        User missed the question: "${question}".
        The correct answer is: "${correctAnswer}".
        Context: "${context.substring(0, 100)}...".
        
        TASK: Provide a very short hint in ${nativeLang}.
        RULES: 
        1. DO NOT reveal the answer directly.
        2. Ask a guiding question or provide a similar example.
        3. Keep it under 20 words.
        4. Be encouraging but cryptic.
      `;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      return response.text || (uiLang === 'es' ? "Piensa en el contexto..." : "Think about the context...");
  });
};

export const generateSRSBatch = async (level: CEFRLevel, track: SpecializationTrack, lang: 'es' | 'en', count: number = 6): Promise<SRSItem[]> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Generate ${count} vocabulary items for ${level} students. Include context sentences in BOTH English and Spanish. Return an array of objects.`;
      
      const response = await ai.models.generateContent({
        model: modelName,
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
                definitionEn: { type: Type.STRING },
                definitionEs: { type: Type.STRING },
                contextEn: { type: Type.STRING },
                contextEs: { type: Type.STRING }
              },
              required: ["term", "translation", "definitionEn", "definitionEs", "contextEn", "contextEs"]
            }
          }
        }
      });
      return JSON.parse(response.text || '[]').map((r: any, i: number) => ({ 
        id: `srs-${Date.now()}-${i}`, 
        term: r.term, 
        translation: r.translation, 
        definitionEn: r.definitionEn,
        definitionEs: r.definitionEs,
        contextEn: r.contextEn,
        contextEs: r.contextEs,
        level, 
        nextReview: Date.now(), 
        interval: 0, 
        repetition: 0, 
        easeFactor: 2.5 
      }));
  });
};

export const searchBilingualJobs = async (lang: 'es' | 'en'): Promise<JobListing[]> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = "Generate 12 diverse, high-paying BILINGUAL job listings (English/Spanish). Focus on Tech, Finance, and Management. Ensure strict JSON array format.";
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
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
                industry: { type: Type.STRING }
              },
              required: ["title", "company", "location", "description", "industry"]
            }
          }
        }
      });
      const result = JSON.parse(response.text || '[]');
      return Array.isArray(result) ? result : [];
  });
};

export const evaluatePronunciation = async (
  target: string,
  transcript: string,
  nativeLang: Language
): Promise<{ score: number; feedback: string; wordScores: { word: string; status: 'good' | 'ok' | 'bad' }[] }> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Logic: If user speaks Spanish (nativeLang='es'), give feedback in Spanish
      const feedbackLang = nativeLang === 'es' ? 'SPANISH' : 'ENGLISH';
      
      const prompt = `Evaluate pronunciation: Target "${target}", Spoke "${transcript}". Provide feedback in ${feedbackLang} ONLY. Score 0-100.`;
      
      const response = await ai.models.generateContent({
        model: modelName,
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
                    status: { type: Type.STRING } 
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
  });
};

export const getRoomAgentResponse = async (agents: AIAgent[], history: ChatMsg[], city: CityData, uiLang: Language, userMessage?: string) => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const agentsDesc = agents.map(a => `ID: ${a.id}, Name: ${a.name}, City: ${a.city}, Persona: ${a.persona}`).join('\n');
      
      // Target lang is opposite of UI lang
      const targetLang = uiLang === 'es' ? 'ENGLISH' : 'SPANISH';
      
      const instruction = userMessage 
        ? `User said: "${userMessage}". Respond naturally.` 
        : `User is silent. Choose an agent to continue the conversation or start a new topic relevant to ${city.name}.`;

      const prompt = `Multi-Agent Room. Context: ${city.name}. Agents Pool: ${agentsDesc}. History: ${history.map(h => `${h.user}: ${h.text}`).join('\n')}. ${instruction}. Speak in ${targetLang}.`;
      
      const response = await ai.models.generateContent({
        model: modelName,
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
          }
        }
      });
      return JSON.parse(response.text || '[]');
  });
};

export const tutorChat = async (history: AssistantMessage[], systemInstruction: string, lang: 'es'|'en') => {
    return runWithModelFallback(async (modelName) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
            config: { systemInstruction }
        });
        return { text: response.text || "...", type: "explanation" as const };
    });
};

export const assistantChat = async (history: AssistantMessage[], section: string, lang: string) => {
    return runWithModelFallback(async (modelName) => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: modelName,
            contents: history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] })),
            config: { systemInstruction: `You are the ILS Assistant. Section: ${section}. Lang: ${lang}. Explain things simply in ${lang === 'es' ? 'Spanish' : 'English'}.` }
        });
        return { text: response.text || "Hi!", suggestion: null };
    });
};

export const getPersonaResponse = async (persona: string, userMessage: string): Promise<string> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are ${persona}. Respond to the following user message in the context of language learning: "${userMessage}". Keep it simple.`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      return response.text || "...";
  });
};

export const getGameHint = async (gameState: GameState): Promise<string> => {
  return runWithModelFallback(async (modelName) => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Give a short, helpful hint for the missing word in this sentence: "${gameState.sentenceEn}" (The word is: ${gameState.missingWordEn})`;
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      return response.text || "Think about the context!";
  });
};

// TTS typically stays on the specific TTS model, but we wrap in retry
export const getPronunciation = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  return withRetry(async () => {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  });
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
