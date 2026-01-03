
import { GoogleGenAI, Type, GenerateContentResponse, Modality, FunctionDeclaration } from "@google/genai";
import { Lesson, AppSection, AssistantMessage } from "../types";

// Always use process.env.API_KEY directly in the named parameter object.
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateLesson = async (topic: string, level: string): Promise<Lesson> => {
  const ai = getAI();
  const prompt = `Create a comprehensive English lesson for a Colombian student. 
  Topic: ${topic}
  Level: ${level}
  Format as JSON with: title, topic, level, summary (3-4 bullet points), content (main body), vocabulary (5 items with word, translation, example), quiz (3 questions).`;

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

export const translateUI = async (text: string, targetLang: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Translate the following UI text to ${targetLang === 'es' ? 'Spanish' : 'English'}. Keep the tone professional yet inspiring. Text: "${text}"`,
  });
  return response.text || text;
};

// Tool definition for navigation
const navTool: FunctionDeclaration = {
  name: 'navigate_to_section',
  description: 'Suggest navigating to a specific internal section of the app. Use this when the user asks for a feature available in another section.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      section: {
        type: Type.STRING,
        enum: [
          'home', 
          'lessons', 
          'speaking', 
          'vocab', 
          'coaching', 
          'community', 
          'kids'
        ],
        description: 'The internal ID of the section to navigate to.'
      },
      label: {
        type: Type.STRING,
        description: 'A short, action-oriented label for the button (e.g., "Ir a Lecciones", "Start Speaking").'
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
  
  // Convert history to Gemini format
  const contents = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.text }]
  }));

  const systemPrompt = `You are the TMC AI Assistant, a helpful guide for "El Camino", an English learning app for Colombians.
  Your goal is to help users find information and navigate the app.
  
  CURRENT CONTEXT:
  - User Language: ${lang}
  - Current Section: ${currentSection}

  SITE STRUCTURE (INTERNAL ROUTES ONLY):
  - home: Landing page, welcome, philosophy.
  - lessons: AI Lesson Generator (create custom lessons).
  - speaking: Real-time voice practice with AI.
  - vocab: Vocabulary cards and pronunciation tools.
  - coaching: Book 1-on-1 sessions with Tomas.
  - community: Chat with other students and leave comments.
  - kids: "Zona de Niños" for younger learners.

  RULES:
  1. If a user asks for a feature (e.g., "I want to practice speaking"), call the 'navigate_to_section' tool with the correct section ID.
  2. NEVER provide external URLs (http://...). Always guide them to internal sections using the tool.
  3. Keep responses concise, encouraging, and use Colombian flair ("¡Vamo' con toda!", "De una").
  4. If the user is already on the requested section, tell them they are in the right place and explain how to use it.
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

  // Check for tool calls
  const functionCall = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;
  
  if (functionCall && functionCall.name === 'navigate_to_section') {
    const args = functionCall.args as any;
    suggestion = {
      section: args.section as AppSection,
      label: args.label
    };
    // If the model didn't generate text along with the tool call, provide a default
    if (!response.text) {
      textResponse = lang === 'es' 
        ? `¡Claro! Te recomiendo ir a la sección de ${args.label}.` 
        : `Sure! I recommend checking out ${args.label}.`;
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
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
      },
    },
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || '';
};

export const generateKidVideo = async (topicPrompt: string): Promise<string | null> => {
  // Re-instantiate to ensure fresh key if changed in dialog
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `${topicPrompt}. Create a cute, friendly, colorful 3D animated video for young kids. High quality, smooth motion.`,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) return null;

    // Fetch the MP4 bytes using the key
    const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Video generation failed:", error);
    return null;
  }
};

// Implement manual decoding as required for raw PCM streams.
export const decodeBase64Audio = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Implement manual audio buffer creation for raw PCM data.
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

// Implement manual base64 encoding.
export const encodeAudio = (bytes: Uint8Array): string => {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};
