
import { GoogleGenAI, Type, GenerateContentResponse, Modality, FunctionDeclaration } from "@google/genai";
import { Lesson, AppSection, AssistantMessage } from "../types";

// Always use process.env.API_KEY directly in the named parameter object.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLesson = async (
  topic: string, 
  level: number, 
  lang: 'es' | 'en' = 'es',
  userTier: 'Novice' | 'Semi Pro' | 'Pro' = 'Novice'
): Promise<Lesson> => {
  const ai = getAI();
  
  // Determine Context based on Language Toggle
  // If lang is 'es': User is Spanish Speaker -> Target is English
  // If lang is 'en': User is English Speaker -> Target is Spanish
  const targetLanguage = lang === 'es' ? 'English' : 'Spanish';
  const nativeLanguage = lang === 'es' ? 'Spanish' : 'English';
  
  let academicGrade = "";
  let complexityInstruction = "";
  let quizComplexity = "";

  // Logic: Map numeric level to Grades 4-12 + Collegiate
  if (level > 90 && userTier !== 'Pro') {
    academicGrade = "Grade 12 (Advanced C2)";
    complexityInstruction = `Use sophisticated ${targetLanguage} vocabulary, complex sentence structures, and idioms.`;
    quizComplexity = "Questions must be very difficult. Use trick answers. Focus on nuance.";
  } else {
    if (level <= 10) {
      academicGrade = "Grade 4 (Elementary A1)";
      complexityInstruction = `Use very basic ${targetLanguage} vocabulary (Top 500 words). Short, simple sentences.`;
      quizComplexity = "Questions must be direct and literal.";
    } else if (level <= 30) {
      academicGrade = "Grade 6 (Lower Intermediate A2)";
      complexityInstruction = `Introduce past simple. Connectors. Vocabulary related to daily routines in ${targetLanguage}.`;
      quizComplexity = "Questions require understanding simple context clues.";
    } else if (level <= 60) {
      academicGrade = "Grade 9 (Advanced B1+)";
      complexityInstruction = "Conditionals. Passive voice basics. Professional terminology.";
      quizComplexity = "Questions involve conditionals. Requires understanding cause and effect.";
    } else if (level <= 90) {
      academicGrade = "Grade 12 (Mastery C2)";
      complexityInstruction = `Full fluency. Idiomatic mastery in ${targetLanguage}.`;
      quizComplexity = "Mastery level. Questions should be challenging even for native speakers.";
    } else {
      academicGrade = `Collegiate Year ${Math.ceil((level - 90) / 10)} (Pro Tier)`;
      complexityInstruction = `University/Ivy League level ${targetLanguage}. Specialized business/tech jargon.`;
      quizComplexity = "Extreme difficulty. Focus on rhetorical analysis and etymology.";
    }
  }

  const pedagogyEs = `
    PEDAGOGY (Target: ENGLISH):
    1.  **Context**: Spanish to English. Explain concepts in Spanish so the student understands, but give examples in English.
    2.  **Culture**: Compare **Colombian phrases** with **American equivalents**.
    3.  **Goal**: Focus on Travel, Business, and Gaining Followers in the US.
    `;

  const pedagogyEn = `
    PEDAGOGY (Target: SPANISH):
    1.  **Context**: English to Spanish. Explain concepts in simple English, but give examples in **Colombian Spanish**.
    2.  **Culture**: Teach the specific **Colombian dialect (Paisa/Rolos)** vs generic Spanish.
    3.  **Goal**: Focus on Traveling to Colombia, Digital Nomad life, and Socializing in Medellin/Bogota.
    `;

  const prompt = `
  Act as Professor Tomas Martinez. Create a personalized ${targetLanguage} lesson.
  
  USER NATIVE LANGUAGE: ${nativeLanguage}
  TARGET LANGUAGE: ${targetLanguage}
  TOPIC: ${topic}
  LEVEL: ${level} -> ${academicGrade}
  INSTRUCTION: ${complexityInstruction}
  QUIZ DIFFICULTY: ${quizComplexity}
  ${lang === 'es' ? pedagogyEs : pedagogyEn}

  STRUCTURE THE JSON EXACTLY AS FOLLOWS:
  {
    "title": "Catchy Title in ${targetLanguage}",
    "topic": "${topic}",
    "level": "${academicGrade}",
    "numericLevel": ${level},
    "summary": "A 3-bullet point summary in ${nativeLanguage} explaining why this helps them.",
    "content": "A comprehensive explanation. Use markdown. \n- Explain the grammar/concept in ${nativeLanguage}.\n- Provide a real-world scenario.\n- Show the Cultural difference between ${nativeLanguage} and ${targetLanguage}.",
    "vocabulary": [
      {
        "word": "${targetLanguage} Phrase",
        "translation": "${nativeLanguage} Meaning",
        "example": "A sentence using the phrase in ${targetLanguage}."
      }
      // ... 5 items total
    ],
    "quiz": [
      {
        "question": "A scenario-based question in ${targetLanguage} matching difficulty.",
        "options": ["Option A", "Option B", "Option C"],
        "answer": "The correct option text"
      }
      // ... 3 questions total
    ]
  }
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
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
          summary: { type: Type.STRING },
          content: { type: Type.STRING },
          vocabulary: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                word: { type: Type.STRING },
                translation: { type: Type.STRING },
                example: { type: Type.STRING },
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
              },
              required: ["question", "options", "answer"]
            }
          }
        },
        required: ["title", "topic", "level", "summary", "content", "vocabulary", "quiz"]
      }
    }
  });

  return JSON.parse(response.text || '{}');
};

export const generateEncouragingFact = async (
  category: string, 
  userAnswer: string, 
  lang: 'es' | 'en'
): Promise<{ text: string, fact: string }> => {
  const ai = getAI();
  const prompt = `
    The user just finished a lesson.
    I asked them: "What is your favorite ${category}?"
    They answered: "${userAnswer}".
    
    1. Compliment them enthusiastically as Professor Tomas.
    2. Provide a super interesting fact.
    
    Output Language: ${lang === 'es' ? 'Spanish' : 'English'}.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING },
          fact: { type: Type.STRING }
        }
      }
    }
  });

  return JSON.parse(response.text || '{"text": "Awesome!", "fact": "Cool fact!"}');
};

export const translateUI = async (text: string, targetLang: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate to ${targetLang === 'es' ? 'Spanish' : 'English'}. Professional tone. Text: "${text}"`,
  });
  return response.text || text;
};

// Tool definition for navigation
const navTool: FunctionDeclaration = {
  name: 'navigate_to_section',
  description: 'Suggest navigating to a specific internal section of the app.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      section: {
        type: Type.STRING,
        enum: ['home', 'lessons', 'speaking', 'vocab', 'coaching', 'community', 'kids'],
        description: 'The internal ID of the section.'
      },
      label: {
        type: Type.STRING,
        description: 'A short label for the button.'
      }
    },
    required: ['section', 'label']
  }
};

export const assistantChat = async (
  history: AssistantMessage[], 
  currentSection: string, 
  lang: string
): Promise<{ text: string, suggestion?: { section: AppSection, label: string } }> => {
  const ai = getAI();
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const systemPrompt = `You are the TMC AI Assistant for "El Camino".
  User Language: ${lang}.
  Current Section: ${currentSection}.
  Help users navigate and learn. Keep responses concise and use Colombian flair if appropriate.
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contents,
    config: {
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: [navTool] }]
    }
  });

  let textResponse = response.text || (lang === 'es' ? "¡Estoy aquí para ayudarte!" : "I'm here to help!");
  let suggestion = undefined;

  const functionCall = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;
  if (functionCall && functionCall.name === 'navigate_to_section') {
    const args = functionCall.args as any;
    suggestion = { section: args.section as AppSection, label: args.label };
    if (!response.text) {
      textResponse = lang === 'es' ? `Te recomiendo ir a ${args.label}.` : `Check out ${args.label}.`;
    }
  }

  return { text: textResponse, suggestion };
};

export const getPronunciation = async (text: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const generateKidVideo = async (topicPrompt: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${topicPrompt}. Cute 3D animation for kids.`,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation failed:", error);
    return null;
  }
};

export const decodeBase64Audio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

export const decodeAudioData = async (
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1
): Promise<AudioBuffer> => {
  const dataInt16 = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
};

export const encodeAudio = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
