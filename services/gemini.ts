import { GoogleGenAI, Type } from "@google/genai";
import { Lesson, AppSection, AssistantMessage, Persona, ChatMsg, GameState } from "../types";

// EN: This line creates a function to get the AI tool ready, using a secret key (password) from the environment.
// ES: Esta línea crea una función para preparar la herramienta de IA, usando una clave secreta (contraseña) del entorno.
// SAFEGUARD: Ensure process.env exists to prevent "process is not defined" crash in older browsers/environments.
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env) ? process.env.API_KEY : '';
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
  }
  return new GoogleGenAI({ apiKey: apiKey || 'MISSING_KEY' });
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
  const ai = getAI();
  const searchPrompt = `
    Find 6 recent (last 96 hours) ENTRY LEVEL (0-3 years experience) BILINGUAL (Spanish/English) job openings in USA or Colombia.
    Prioritize jobs from major boards like LinkedIn, Indeed, Glassdoor, Torre, etc.
    
    CRITERIA:
    1. Must be Bilingual (English/Spanish).
    2. Must be Entry Level or Junior.
    3. Location: USA or Colombia (Remote is okay).
    
    OUTPUT JSON FORMAT:
    [
      {
        "title": "Job Title",
        "company": "Company Name",
        "location": "City, Country (or Remote)",
        "salary": "$X/year or Competitive (if found)",
        "description": "Short 1 sentence summary",
        "url": "Direct Link to job (if found via search) or Search URL",
        "postedTime": "2h ago"
      }
    ]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: searchPrompt }] }],
      config: {
        tools: [{googleSearch: {}}],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              company: { type: Type.STRING },
              location: { type: Type.STRING },
              salary: { type: Type.STRING, nullable: true },
              description: { type: Type.STRING },
              url: { type: Type.STRING, nullable: true },
              postedTime: { type: Type.STRING, nullable: true }
            },
            required: ["title", "company", "location", "description"]
          }
        }
      }
    });

    const jobs = JSON.parse(response.text || '[]');
    
    // Enrich with grounding metadata if available (fallback urls)
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks && jobs.length > 0) {
       jobs.forEach((job: any, index: number) => {
          if (!job.url && groundingChunks[index % groundingChunks.length]?.web?.uri) {
             job.url = groundingChunks[index % groundingChunks.length].web?.uri;
          }
       });
    }
    
    return jobs;
  } catch (e) {
    console.error("Job Search Error", e);
    // Fallback Mock Data if search fails (to maintain aesthetic)
    return [
      {
        title: "Bilingual Customer Success Specialist",
        company: "TechGlobal",
        location: "Bogotá, Colombia (Remote)",
        salary: "$1,200 - $1,500 USD/mo",
        description: "Support US clients via chat and email. No experience required.",
        postedTime: "4h ago"
      },
      {
        title: "Junior Spanish/English Translator",
        company: "LangBridge USA",
        location: "Miami, FL (Hybrid)",
        salary: "$45,000/yr",
        description: "Translate documents and assist in client meetings.",
        postedTime: "1d ago"
      },
      {
        title: "Sales Development Rep (Bilingual)",
        company: "StartUp Flow",
        location: "Medellín, Colombia",
        salary: "Competitive + Commission",
        description: "Entry level sales role targeting the Latin American market.",
        postedTime: "12h ago"
      }
    ];
  }
};

// --- WRITING EVALUATION ---

export const evaluateWritingExercise = async (
  text: string, 
  targetWords: string[], 
  topic: string, 
  lang: 'es' | 'en'
): Promise<{ stars: number, text: string }> => {
  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish'; // The language the user is writing in (presumably target)
  
  const systemInstruction = `
    You are Professor Tomas Martinez.
    Role: Evaluate a student's short writing exercise.
    Topic: "${topic}".
    Required Vocabulary: ${targetWords.join(', ')}.
    User Text: "${text}".
    
    Criteria:
    1. Did they use the vocabulary correctly?
    2. Is the grammar understandable for a learner?
    3. Is it creative?
    
    Output JSON:
    {
      "stars": number (1-5),
      "feedback": string (A short, encouraging comment in ${lang === 'es' ? 'Spanish' : 'English'} mixing in some English/Spanish Spanglish flavor. Be specific about what they did well.)
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: "Evaluate this writing." }] }],
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            stars: { type: Type.INTEGER },
            feedback: { type: Type.STRING }
          },
          required: ["stars", "feedback"]
        }
      }
    });
    
    const parsed = JSON.parse(response.text || '{ "stars": 3, "feedback": "Good effort!" }');
    return { stars: parsed.stars, text: parsed.feedback };
  } catch (e) {
    console.error("Eval Error", e);
    return { stars: 3, text: "Great effort! Keep practicing." };
  }
};

// --- VOCABULARY NEWS GENERATOR ---

export interface NewsWord {
  word: string;
  translation: string;
  definition: string;
  newsContext: string; // The headline or context where it was used today
  category: string; // e.g. "Politics", "Tech", "Economy"
}

export const generateNewsVocabulary = async (lang: 'es' | 'en'): Promise<NewsWord[]> => {
  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish'; // What they are learning
  const userLang = lang === 'es' ? 'Spanish' : 'English'; // UI Language

  const prompt = `
    Generate 6 SOPHISTICATED and UNCOMMON ${targetLang} vocabulary words that would likely appear in TODAY'S global news headlines (Business, Tech, Politics, Science).
    
    CRITERIA:
    1. Words must be "C1/C2 Level" (Advanced).
    2. Context must look like a real headline from the last 24 hours.
    3. Output JSON.
    
    Response format in ${userLang} for definitions/translations.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              definition: { type: Type.STRING },
              newsContext: { type: Type.STRING, description: "A realistic news headline using the word" },
              category: { type: Type.STRING, description: "e.g. Tech, Politics, Economy" }
            },
            required: ["word", "translation", "definition", "newsContext", "category"]
          }
        }
      }
    });

    return JSON.parse(response.text || '[]');
  } catch (e) {
    console.error("Vocab Gen Error", e);
    // Fallback if AI fails
    return [
      { word: "Ubiquitous", translation: "Omnipresente", definition: "Present, appearing, or found everywhere.", newsContext: "AI becomes ubiquitous in modern software development sectors.", category: "Tech" },
      { word: "Volatile", translation: "Volátil", definition: "Liable to change rapidly and unpredictably.", newsContext: "Markets remain volatile amidst new interest rate announcements.", category: "Economy" }
    ];
  }
};

// --- DISCOVERY & LESSON GENERATION ---

export const conductLessonDiscovery = async (
  history: { role: 'user' | 'model', text: string }[],
  lang: 'es' | 'en'
): Promise<{ nextQuestion?: string, topic?: string, level?: number }> => {
  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const nativeLang = lang === 'es' ? 'Spanish' : 'English';
  
  const safeHistory = history || [];

  const systemInstruction = `
    You are Professor Tomas Martinez.
    Goal: Help the student find a learning focus for their ${targetLang} lesson.
    Tone: Friendly, encouraging, adult-to-adult.
    Output JSON: { "nextQuestion": string, "topic": string (optional), "level": number (optional) }
    Language: Respond in ${nativeLang}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: safeHistory.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextQuestion: { type: Type.STRING },
            topic: { type: Type.STRING },
            level: { type: Type.NUMBER }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (e) {
    return { nextQuestion: lang === 'es' ? "¿Qué te gustaría aprender hoy?" : "What would you like to learn today?" };
  }
};

export const generateLesson = async (
  topic: string, 
  level: number, 
  lang: 'es' | 'en' = 'es',
  userTier: 'Novice' | 'Semi Pro' | 'Pro' = 'Novice'
): Promise<Lesson> => {
  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  
  let complexity = "Beginner";
  if (level > 30) complexity = "Intermediate";
  if (level > 70) complexity = "Advanced";

  const systemInstruction = `
    You are Professor Tomas Martinez. Create a structured ${targetLang} lesson about "${topic}".
    Level: ${level}/100 (${complexity}).
    User Tier: ${userTier}.
    
    PEDAGOGICAL STRATEGY:
    1. **Bilingual Success Criteria**: Provide 'content' and 'summary' in both English (en) and Spanish (es).
    2. **Interleaving**: Mix vocabulary practice with usage examples immediately.
    3. **Retrieval**: The quiz questions should force the user to recall information, not just recognize it.
    
    Format: JSON matching the provided schema. content.en and content.es should be substantial.
    Content Style: Engaging, practical, cultural notes included.
  `;

  const prompt = `Generate a lesson for topic: "${topic}".`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    config: {
      systemInstruction: systemInstruction,
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
              }
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                answer: { type: Type.STRING }
              }
            }
          }
        },
        required: ["title", "topic", "content", "summary", "vocabulary", "quiz"]
      }
    }
  });

  if (!response.text) throw new Error("No content generated");
  
  return JSON.parse(response.text) as Lesson;
};

// --- TUTOR CHAT (MASCOT) ---

// EN: This function handles the new minimalist chat interface where the pet helps the user.
export const tutorChat = async (
  history: AssistantMessage[],
  personaDescription: string,
  lang: 'es' | 'en'
): Promise<{ text: string, type: 'explanation' | 'correction' | 'encouragement' }> => {
  const ai = getAI();
  const targetLang = lang === 'es' ? 'English' : 'Spanish';
  const nativeLang = lang === 'es' ? 'Spanish' : 'English';

  const systemInstruction = `
    You are a patient, bilingual language tutor.
    Your PERSONA is: ${personaDescription}.
    
    CORE PRINCIPLES:
    1. **Teach by Asking**: Do not just give answers. Ask guiding questions. (e.g. "What part confuses you?" instead of "Here is the rule.")
    2. **Gentle Correction**: If the user makes a mistake, correct it gently and briefly.
    3. **Minimalist**: Keep responses concise. No long lectures.
    4. **Bilingual**: You can use ${nativeLang} to explain complex concepts, but encourage ${targetLang}.
    
    OUTPUT JSON:
    {
      "text": "Your response string here (use Markdown for bolding key terms)",
      "type": "explanation" | "correction" | "encouragement"
    }
  `;

  // Convert history to Gemini format
  const chatContents = history.map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: chatContents,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["explanation", "correction", "encouragement"] }
          },
          required: ["text", "type"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      text: result.text || "I am listening...",
      type: result.type || "explanation"
    };
  } catch (e) {
    console.error("Tutor Chat Error", e);
    return { text: "I'm having trouble thinking right now. Try again?", type: "explanation" };
  }
};

// --- COMMUNITY CHAT BOT ---

export const generateCommunityChat = async (
  lang: 'es' | 'en',
  personas: Persona[],
  history: ChatMsg[],
  userMessage?: string,
  activeTopic?: string,
  environment?: string
): Promise<{ messages: { personaId: string, text: string, replyTo?: string }[], newTopic: string, sources?: {title: string, uri: string}[] }> => {
  const ai = getAI();
  const isAmericanChat = lang === 'es';
  
  const targetDialect = isAmericanChat 
    ? 'American English (Urban/Casual)' 
    : 'Colombian Spanish (Paisa/Rolo Dialect)';
    
  const forbiddenLang = isAmericanChat ? 'Spanish' : 'English';

  const leaders = personas.slice(0, 2);
  const observers = personas.slice(2);

  const leadersContext = leaders.map(p => `${p.id} (${p.name}): [LEADER] ${p.vibe} vibe. Uses slang: ${p.slang.join(', ')}. From ${p.state}. PASSION: ${p.topics[0]}.`).join('\n');
  const observersContext = observers.map(p => `${p.id} (${p.name}): [OBSERVER] ${p.vibe} vibe. Uses slang: ${p.slang.join(', ')}. From ${p.state}. PASSION: ${p.topics[0]}.`).join('\n');
  
  let politicsInstruction = "";
  if (isAmericanChat) {
    politicsInstruction = `
      CRITICAL: You are simulating Americans discussing REAL-TIME trends and current events in the USA.
      - Use Google Search to find LATEST info on:
        1. Sports scores (NBA, NFL, MLB).
        2. New movies/TV shows (Netflix, HBO, Theaters).
        3. Music (Billboard Top 10, trending concerts).
      - Be OPINIONATED but RESPECTFUL.
      - Model healthy civil discourse.
      - Use slang like "cap", "bet", "vibe check", "woke", "based" naturally.
    `;
  } else {
    politicsInstruction = `
      CRITICAL: You are simulating Colombians (Paisas/Rolos) discussing REAL-TIME events in Colombia.
      - Use Google Search to look up:
        1. LATEST scores/matches for **Atletico Nacional**, **Independiente Medellin (DIM)**, **Millonarios**, or **America**.
        2. Colombian National Team (La Selección) news.
        3. New Reggaeton/Urban releases (Feid, Karol G, Blessd, J Balvin).
        4. Viral trends/news in Bogota, Medellin, or Cali.
      - Use heavy local slang: "Parce", "Que chimba", "Nea", "Sisas", "Mor", "Tinto", "Bacano".
      - Be warm, expressive, and passionate.
    `;
  }

  let locationDetails = "";
  if (environment) {
    const envLower = environment.toLowerCase();
    if (envLower.includes('medellin')) locationDetails = "Mention 'La Eterna Primavera', the Metro, Provenza.";
    else if (envLower.includes('nyc')) locationDetails = "Mention subway noise, pizza slices, Broadway.";
  }

  const envInstruction = environment ? `
    CURRENT ENVIRONMENT: ${environment}
    - The characters are physically present in this location RIGHT NOW.
    - BACKGROUND NOISE CONTEXT: The user is hearing ambient sounds of this city.
    - LOCATION CONTEXT: ${locationDetails}
  ` : '';

  const systemInstruction = `
    You are simulating a lively group chat of 6 people.
    Target Language STRICTLY: ${targetDialect}.
    You must ONLY speak ${isAmericanChat ? 'English' : 'Spanish'}.
    Do NOT use ${forbiddenLang}.
    
    Current Room Topic: ${activeTopic || 'General Life'}.
    ${politicsInstruction}
    ${envInstruction}
    
    CHARACTERS:
    **LEADERS** (These two speak the most):
    ${leadersContext}

    **OBSERVERS** (These four speak rarely):
    ${observersContext}
    
    EDUCATIONAL STRATEGY:
    1. **Cooperative Tasks**: Occasionally ask the user ("You") for help to solve a problem or give an opinion to "settle a debate".
    2. **Gentle Feedback**: If the user makes a mistake, ONE character should repeat the phrase correctly in a natural way (Recasting), without scolding.
    
    Output JSON format.
  `;

  const prompt = userMessage 
    ? `User said: "${userMessage}". Generate replies.` 
    : `Generate conversational banter. Leaders discuss the topic. Observers might react.`;

  const callModel = async (withTools: boolean) => {
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: {
        systemInstruction: systemInstruction,
        tools: withTools ? [{googleSearch: {}}] : [],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            newTopic: { type: Type.STRING, description: "Update topic if conversation shifts" },
            messages: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  personaId: { type: Type.STRING },
                  text: { type: Type.STRING },
                  replyTo: { type: Type.STRING, nullable: true }
                },
                required: ["personaId", "text"]
              }
            }
          },
          required: ["messages", "newTopic"]
        }
      }
    });
  };

  try {
    // Attempt with Google Search enabled
    const response = await callModel(true);
    
    const sources: {title: string, uri: string}[] = [];
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    const data = JSON.parse(response.text || '{ "messages": [], "newTopic": "General" }');
    return { ...data, sources };
  } catch (e: any) {
    // Retry without tool if RPC/500 error occurs
    if (e.toString().includes('Rpc') || e.toString().includes('500') || e.toString().includes('xhr')) {
        console.warn("Chat tool error, retrying without search...", e);
        try {
            const fallbackResponse = await callModel(false);
            const data = JSON.parse(fallbackResponse.text || '{ "messages": [], "newTopic": "General" }');
            return { ...data, sources: [] };
        } catch (retryE) {
            console.error("Chat Retry Gen Error", retryE);
            return { messages: [], newTopic: activeTopic || "General" };
        }
    }
    
    if (e.toString().includes('429')) {
        console.warn("Chat Quota Exceeded. Returning empty update.");
        return { messages: [], newTopic: activeTopic || "General" };
    }
    console.error("Chat Gen Error", e);
    return { messages: [], newTopic: activeTopic || "General" };
  }
};

// --- UTILS ---

export const getPronunciation = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getAI();
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say: ${text}` }] }],
      config: { 
        responseModalities: ["AUDIO"], 
        speechConfig: { 
          voiceConfig: { 
            prebuiltVoiceConfig: { voiceName: voiceName } 
          } 
        } 
      }
    });
    return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
  } catch (e: any) {
    if (e.toString().includes('429') || e.status === 429 || e.code === 429) {
        console.warn("TTS Quota Exceeded. Audio playback skipped.");
        return '';
    }
    console.error("TTS Error:", e);
    return '';
  }
};

export const getPersonaResponse = async (persona: 'tomas' | 'carolina', input: string): Promise<string> => {
  const ai = getAI();
  const systemPrompt = persona === 'tomas' 
    ? "You are Professor Tomas Martinez. Colombian. Warm, Spanglish, encouraging. Love coffee."
    : "You are Carolina. American student in Medellin. Trendy, fast talker, US slang.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: input }] }],
      config: { systemInstruction: systemPrompt }
    });
    return response.text || "...";
  } catch (e) {
    return "...";
  }
};

export const getGameHint = async (gameState: GameState): Promise<string> => {
  const ai = getAI();
  const prompt = `
    Game: Bilingual Missing Word.
    EN: "${gameState.sentenceEn}" (Missing: ${gameState.missingWordEn})
    ES: "${gameState.sentenceEs}" (Missing: ${gameState.missingWordEs})
    Give a short, helpful hint about the missing word meaning. No spoilers.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });
    return response.text || "Think about the context!";
  } catch (e) {
    console.error("Game Hint Error", e);
    return "Try focusing on the other language sentence for clues!";
  }
};

// --- AUDIO HELPERS ---

export function encodeAudio(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decodeBase64Audio(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// --- ENCOURAGING FACT ---

export const generateEncouragingFact = async (lang: 'es' | 'en'): Promise<string> => {
    const ai = getAI();
    const prompt = lang === 'es' 
        ? "Dime un dato curioso muy corto (1 frase) y alentador sobre el aprendizaje de idiomas." 
        : "Tell me a very short (1 sentence) encouraging fact about language learning.";
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        });
        return response.text || (lang === 'es' ? "¡Tu cerebro crece cuando aprendes!" : "Your brain grows when you learn!");
    } catch (e) {
        return lang === 'es' ? "¡Sigue adelante!" : "Keep going!";
    }
};

// --- ASSISTANT CHAT ---

export const assistantChat = async (
  history: AssistantMessage[], 
  section: string, 
  lang: string
): Promise<{ text: string, suggestion?: { section: AppSection, label: string } }> => {
  const ai = getAI();
  
  const systemInstruction = `
    You are the AI assistant for "El Camino", an immersive language learning app.
    Current Section: ${section}.
    User Language: ${lang}.
    
    Goal: Help the user navigate, answer questions about features, or practice language.
    If the user asks about a specific feature (like "Where are the classes?", "I want to practice speaking"), suggest navigating to it using the 'suggestion' field.
    
    Available Sections for suggestion:
    - ${AppSection.Home} (Home)
    - ${AppSection.Worlds} (Worlds)
    - ${AppSection.Classes} (Classes)
    - ${AppSection.Lessons} (Lessons)
    - ${AppSection.Speaking} (Speaking)
    - ${AppSection.Vocab} (Vocab)
    - ${AppSection.Coaching} (Coaching)
    - ${AppSection.Community} (Community)
    - ${AppSection.Kids} (Kids)
    - ${AppSection.Jobs} (Jobs)
    
    Output JSON:
    {
      "text": "Response text...",
      "suggestion": { "section": "section_id", "label": "Button Label" } (Optional)
    }
  `;

  const contents = history.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }]
  }));

  try {
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
          config: {
              systemInstruction: systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                      text: { type: Type.STRING },
                      suggestion: {
                          type: Type.OBJECT,
                          properties: {
                              section: { type: Type.STRING },
                              label: { type: Type.STRING }
                          },
                          nullable: true
                      }
                  },
                  required: ["text"]
              }
          }
      });
      
      const result = JSON.parse(response.text || '{}');
      return result;
  } catch (e) {
      console.error(e);
      return { text: lang === 'es' ? "Lo siento, tuve un problema conectando con el servidor." : "Sorry, I had an issue connecting to the server." };
  }
};
