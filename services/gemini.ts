
import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import { Lesson } from "../types";

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

  // response.text is a getter, not a method.
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

export const assistantChat = async (message: string, currentSection: string): Promise<string> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: `You are the TMC AI Assistant. Help the student navigate "El Camino". 
      Current section: ${currentSection}. 
      If they ask for lessons, guide them to 'Lecciones'. 
      If they want to speak, guide them to 'Entrenamiento'. 
      Keep answers short, helpful, and Colombian-inspired ("¡Vamo' con toda!").`
    }
  });
  return response.text || "I'm here to help!";
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
