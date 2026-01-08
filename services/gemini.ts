
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Lesson, AppSection, AssistantMessage, Persona, ChatMsg, GameState, CEFRLevel, SpecializationTrack, SRSItem } from "../types";

// --- CACHING LAYER (Cost & Speed Optimization) ---
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

// --- AI CLIENT ---
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("API Key is missing.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
};

// --- CEFR & LEVEL PROMPT ENGINEERING ---

export const getSystemPromptForLevel = (level: number | CEFRLevel, track: SpecializationTrack, lang: 'es' | 'en') => {
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const instructionLang = lang === 'es' ? 'Spanish' : 'English';
  
  // DYNAMIC LEVEL SCALING (1-500)
  if (typeof level === 'number') {
      return `
        IDENTITY: You are Professor Tomas, the ultimate language examiner.
        CURRENT LEVEL: ${level} / 500.
        TARGET LANGUAGE: ${targetLang}.
        INSTRUCTION LANGUAGE: ${instructionLang}.

        TASK: 
        1. Explain a speaking challenge appropriate for Level ${level} in ${instructionLang}.
           - Level 1: Say "Hello".
           - Level 100: Describe your day.
           - Level 500: Debate philosophy.
        2. Wait for audio.
        3. STRICTLY verify grammar/pronunciation.
        4. IF CORRECT: Say "CORRECT. LEVEL UP." and present the next challenge.
        5. IF WRONG: Explain why in ${instructionLang} and repeat the level.
      `;
  }

  // FALLBACK FOR OLD CEFR LOGIC
  const basePrompts = {
    'A1': `ROLE: Friendly Guide. SPEECH: Slow. FOCUS: Basic words.`,
    'A2': `ROLE: Tutor. SPEECH: Moderate. FOCUS: Sentences.`,
    'B1': `ROLE: Partner. SPEECH: Natural. FOCUS: Conversation.`,
    'B2': `ROLE: Coach. SPEECH: Fast. FOCUS: Fluency.`,
    'C1': `ROLE: Mentor. SPEECH: Complex. FOCUS: Nuance.`,
    'C2': `ROLE: Expert. SPEECH: Native. FOCUS: Mastery.`,
    'PhD': `ROLE: Professor. SPEECH: Academic. FOCUS: Thesis.`
  };

  return `
    TARGET: ${targetLang}.
    ${basePrompts[level as CEFRLevel] || basePrompts['A1']}
    Explain in ${instructionLang}.
  `;
};

// --- JOB SEARCH SERVICE ---

export interface JobListing {
  title: string;
  company: string;
  location: string;
  salary?: string;
  description: string;
  url?: string;
  postedTime?: string;
}

export const searchBilingualJobs = async (lang: 'es' | 'en'): Promise<JobListing[]> => {
  const cacheKey = `jobs_${lang}`; 
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  const searchPrompt = `
    Find 6 recent ENTRY LEVEL BILINGUAL (Spanish/English) job openings.
    Output JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: searchPrompt }] }],
      config: { tools: [{googleSearch: {}}] }
    });

    let text = response.text || '[]';
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let jobs = [];
    try { jobs = JSON.parse(text); } catch (e) { jobs = []; }
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && Array.isArray(jobs)) {
       jobs.forEach((job: any, index: number) => {
          if (!job.url && groundingChunks[index % groundingChunks.length]?.web?.uri) {
             job.url = groundingChunks[index % groundingChunks.length].web?.uri;
          }
       });
    }
    
    if (jobs.length > 0) {
        setInCache(cacheKey, jobs);
        return jobs;
    }
    return [];
  } catch (e) {
    return [];
  }
};

// --- SRS & VOCABULARY ---

export const generateSRSBatch = async (level: CEFRLevel, track: SpecializationTrack, lang: 'es' | 'en', count: number = 6): Promise<SRSItem[]> => {
  const ai = getAI();
  
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const nativeLang = lang === 'es' ? 'Spanish' : 'English';

  const prompt = `
    Generate ${count} "Power Patterns" or high-value vocabulary chunks for CEFR Level ${level} in the ${track} track.
    Target Language: ${targetLang}.
    Definition Language: ${nativeLang}.
    
    IMPORTANT: The 'context' field MUST contain an example sentence in ${targetLang} AND its translation in ${nativeLang}.
    
    Format: JSON Array of objects { "term": "string", "translation": "string", "context": "string (Example in target - Translation in native)" }.
    Ensure definitions are precise.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });
    
    const raw = JSON.parse(response.text || '[]');
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
    console.error("SRS Gen Error", e);
    return [];
  }
};

export const generateNewsVocabulary = async (lang: 'es' | 'en'): Promise<any[]> => {
  const dateKey = new Date().toISOString().split('T')[0];
  const cacheKey = `vocab_${lang}_${dateKey}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const userLang = lang === 'es' ? 'Spanish' : 'English';

  const prompt = `
    Generate 6 SOPHISTICATED ${targetLang} words from TODAY'S global news.
    Output JSON: [{ "word": "", "translation": "", "definition": "", "newsContext": "", "category": "" }]
    Definitions in ${userLang}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" }
    });

    const result = JSON.parse(response.text || '[]');
    setInCache(cacheKey, result);
    return result;
  } catch (e) {
    return [];
  }
};

// --- EVALUATION SERVICES ---

export const evaluateSpeakingSession = async (
  transcript: {role: string, text: string}[],
  objectives: string[],
  lang: 'es' | 'en'
): Promise<{ score: number, feedback: string, objectivesMet: number }> => {
  const ai = getAI();
  const systemInstruction = `
    Evaluate conversation.
    Objectives: ${objectives.join(', ')}.
    Output JSON: { "score": number, "objectivesMet": number, "feedback": string }
    Language: ${lang === 'es' ? 'Spanish' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [{ role: 'user', parts: [{ text: JSON.stringify(transcript) }] }],
      config: { systemInstruction, responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { score: 0, objectivesMet: 0, feedback: "Error evaluating." };
  }
};

export const evaluateWritingExercise = async (text: string, targetWords: string[], topic: string, lang: 'es'|'en') => {
    const ai = getAI();
    const prompt = `Evaluate writing. Topic: ${topic}. Words: ${targetWords}. Text: ${text}. JSON Output: { "stars": number, "feedback": string }`;
    try {
        const res = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(res.text || '{}');
    } catch(e) { return { stars: 0, feedback: "Error." }; }
};

// --- CORE UTILS ---

export const generateLesson = async (topic: string, level: number, lang: 'es'|'en', userTier: string) => {
    const ai = getAI();
    
    // Updated prompt for massive quiz and strict correlation
    const prompt = `
      Create a COMPREHENSIVE language lesson.
      Topic: "${topic}".
      Target Level: ${level} (1-100 scale).
      Target Language: ${lang === 'es' ? 'English' : 'Spanish'}.
      Support Language: ${lang === 'es' ? 'Spanish' : 'English'}.
      
      REQUIREMENTS:
      1. Provide **8 to 10** Quiz Questions.
      2. Quiz questions MUST be directly answerable from the 'content' or 'vocabulary' provided.
      3. All content must be bilingual (En & Es).
      
      Output JSON:
      {
        "title": "Engaging Title",
        "topic": "${topic}",
        "level": "Level ${level}",
        "numericLevel": ${level},
        "content": {
          "concept": { "en": "Explanation in English", "es": "Explicación en Español" },
          "scenario": { "en": "Dialogue in English", "es": "Diálogo en Español" },
          "culture": { "en": "Cultural Note", "es": "Nota Cultural" },
          "mistakes": { "en": "Common Mistake", "es": "Error Común" }
        },
        "summary": { "en": "Summary", "es": "Resumen" },
        "vocabulary": [
          { "word": "Term", "translation": "Translation", "example": "Sentence / Oración" }
        ],
        "quiz": [
          { 
            "question": "Question about the concept/vocab?", 
            "options": ["A", "B", "C", "D"], 
            "answer": "Correct Option Text",
            "explanation": "Brief explanation of why this answer is correct in the Support Language (${lang === 'es' ? 'Spanish' : 'English'})."
          }
        ]
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text || '{}');
    } catch (e) {
        console.error("Lesson Gen Error", e);
        return {
            title: "Error Generating Lesson",
            topic: topic,
            level: "Error",
            numericLevel: 0,
            content: { concept: { en: "Try again", es: "Intenta de nuevo" }, scenario: {en:"", es:""}, culture: {en:"", es:""}, mistakes: {en:"", es:""} },
            summary: { en: "Error", es: "Error" },
            vocabulary: [],
            quiz: []
        };
    }
};

export const getPronunciation = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const cacheKey = `tts_${voiceName}_${text.substring(0, 50)}`; // limit key length
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text.substring(0, 300) }] }], // Limit text length for speed
      config: { 
        responseModalities: [Modality.AUDIO], 
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } } } 
      }
    });
    const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
    if (data) setInCache(cacheKey, data);
    return data;
  } catch (e) { return ''; }
};

export const generateCommunityChat = async (lang: 'es' | 'en', personas: Persona[], history: ChatMsg[], userMessage?: string, activeTopic?: string, environment?: string) => {
    const ai = getAI();
    const personasDesc = personas.map(p => `${p.name} (${p.vibe}, Region: ${p.state})`).join(', ');
    const historyText = history.map(h => `${h.user}: ${h.text}`).join('\n');

    // Prompt updated to encourage cross-cultural dialogue based on persona origins
    const prompt = `
        Simulate a lively cross-cultural conversation.
        Context: ${activeTopic || 'General Chat'} in ${environment || 'City'}.
        Characters: ${personasDesc}.
        
        INSTRUCTION:
        - Characters should speak in a mix of English and Spanish depending on their origin, or mostly in the Target Language (${lang === 'es' ? 'English' : 'Spanish'}) if they are native to it.
        - Colombian characters might use slang like 'Parce', 'Bacano'.
        - US characters might use casual American English.
        - They should interact with each other.
        
        Recent History:
        ${historyText}

        Task: Generate the next 2-3 turns of conversation.
        ${userMessage ? `User just said: "${userMessage}". One character should respond to this.` : 'Continue the flow naturally.'}

        Output strictly valid JSON array:
        [
            { "personaId": "id", "text": "message" }
        ]
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json" }
        });
        const generated = JSON.parse(response.text || '[]');
        return { 
            messages: generated, 
            newTopic: activeTopic,
            sources: [] as {title: string, uri: string}[] 
        };
    } catch (e) {
        console.error("Community Chat Gen Error", e);
        return { 
            messages: [], 
            newTopic: activeTopic,
            sources: [] 
        };
    }
};

export const tutorChat = async (history: AssistantMessage[], persona: string, lang: 'es'|'en') => {
    const ai = getAI();
    const systemPrompt = `You are an AI Tutor. Persona: ${persona}. Language: ${lang}. Concise, helpful, encouraging.`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: [
                { role: 'user', parts: [{ text: systemPrompt }] },
                ...history.map(h => ({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.text }] }))
            ],
        });
        return { text: response.text || "...", type: "explanation" as const };
    } catch(e) {
        return { text: "Connection error.", type: "explanation" as const };
    }
};

export const assistantChat = async (history: AssistantMessage[], section: string, lang: string) => {
    return { text: "How can I help?", suggestion: null };
};

export const getPersonaResponse = async (persona: 'tomas'|'carolina', input: string) => {
    return "Response";
};

export const getGameHint = async (state: GameState) => {
    return "Hint";
};

export function encodeAudio(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export function decodeBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext) {
  const dataInt16 = new Int16Array(data.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
  return buffer;
}

export const generateEncouragingFact = async (lang: 'es'|'en') => "Keep going!";
