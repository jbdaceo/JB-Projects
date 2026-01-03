
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { encodeAudio, decodeBase64Audio, decodeAudioData } from '../services/gemini';
// Added Language import
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

// Added SpeakingPracticeProps
interface SpeakingPracticeProps {
  lang: Language;
}

const SpeakingPractice: React.FC<SpeakingPracticeProps> = ({ lang }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [transcriptions, setTranscriptions] = useState<{role: string, text: string}[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const currentInputTransRef = useRef('');
  const currentOutputTransRef = useRef('');

  const stopSession = useCallback(() => {
    if (sessionPromiseRef.current) {
      sessionPromiseRef.current.then(s => s.close());
      sessionPromiseRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputAudioContextRef.current) {
      outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }
    setIsActive(false);
    setIsConnecting(false);
  }, []);

  const createBlob = (data: Float32Array): Blob => {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      int16[i] = data[i] * 32768;
    }
    return {
      data: encodeAudio(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000',
    };
  };

  const startSession = async () => {
    try {
      setIsConnecting(true);
      // Fixed: Strictly use process.env.API_KEY directly
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setIsActive(true);
            setIsConnecting(false);
            
            const source = audioContextRef.current!.createMediaStreamSource(stream);
            const scriptProcessor = audioContextRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              // Ensure session is sent after promise resolves
              sessionPromise.then(session => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(audioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
              const ctx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              // Correct decoding of raw PCM data
              const buffer = await decodeAudioData(decodeBase64Audio(base64Audio), ctx);
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => sourcesRef.current.delete(source));
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
              sourcesRef.current.add(source);
            }

            if (message.serverContent?.inputTranscription) {
              currentInputTransRef.current += message.serverContent.inputTranscription.text;
            }
            if (message.serverContent?.outputTranscription) {
              currentOutputTransRef.current += message.serverContent.outputTranscription.text;
            }

            if (message.serverContent?.turnComplete) {
              const userInput = currentInputTransRef.current;
              const modelOutput = currentOutputTransRef.current;
              if (userInput || modelOutput) {
                setTranscriptions(prev => [
                  ...prev, 
                  { role: 'Tú', text: userInput },
                  { role: 'Tomas', text: modelOutput }
                ]);
              }
              currentInputTransRef.current = '';
              currentOutputTransRef.current = '';
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error('Live error:', e),
          onclose: () => stopSession(),
        },
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: 'Eres el Profesor Tomas Martinez, mentor e inspirador. Usas "El Camino" como metáfora del éxito. Eres cálido, corriges de forma sutil, usas "Vamo\' con toda". Tu objetivo es que el estudiante consiga un trabajo mejor.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
          }
        }
      });
      sessionPromiseRef.current = sessionPromise;
    } catch (error) {
      console.error('Failed to start session:', error);
      alert('Activa el micrófono.');
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  return (
    <div className="flex flex-col h-full space-y-4 md:space-y-10 pb-20">
      <header className="flex items-center justify-between">
        <div>
           <h2 className="text-2xl md:text-5xl font-black text-white tracking-tighter">Entrenamiento</h2>
           <p className="text-slate-500 text-[10px] md:text-lg font-bold uppercase tracking-widest">Feedback Real-Time</p>
        </div>
        {isActive && (
          <motion.div 
            layoutId="statusIsland"
            className="px-4 py-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]"></span>
            <span className="text-[10px] font-black uppercase tracking-widest">Live</span>
          </motion.div>
        )}
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6">
        <div className="flex-1 flex flex-col glass-morphism rounded-[40px] md:rounded-[56px] overflow-hidden shadow-2xl relative">
          <div className="flex-1 p-6 md:p-12 overflow-y-auto space-y-6 hide-scrollbar">
            {transcriptions.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-8">
                <motion.div 
                  animate={{ 
                    scale: [1, 1.1, 1],
                    rotate: [0, 2, -2, 0]
                  }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className="w-32 h-32 md:w-48 md:h-48 bg-white/5 rounded-[40px] flex items-center justify-center text-5xl md:text-7xl border border-white/10 shadow-inner"
                >
                  🎙️
                </motion.div>
                <p className="text-slate-400 text-sm md:text-xl font-medium max-w-xs leading-relaxed italic">
                  "Speak your future into existence. Tomas is listening."
                </p>
              </div>
            ) : (
              transcriptions.map((t, idx) => (
                <motion.div 
                  key={idx} 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`flex ${t.role === 'Tomas' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-5 md:p-8 rounded-[32px] ${
                    t.role === 'Tomas' 
                      ? 'bg-white/5 text-slate-100 rounded-tl-none border border-white/5' 
                      : 'bg-blue-600 text-white rounded-tr-none'
                  }`}>
                    <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-2 ${t.role === 'Tomas' ? 'text-blue-400' : 'text-blue-100 opacity-60'}`}>
                      {t.role}
                    </p>
                    <p className="text-sm md:text-lg leading-relaxed font-bold">{t.text || '...'}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Siri-like Waveform & Control */}
          <div className="p-8 md:p-12 bg-black/20 border-t border-white/5">
            <div className="flex flex-col items-center gap-8">
              {isActive ? (
                <div className="flex flex-col items-center gap-8 w-full">
                  <div className="flex gap-2 h-12 items-center">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 8, 7, 6, 5, 4, 3, 2, 1].map((i, idx) => (
                      <motion.div
                        key={idx}
                        animate={{ height: [10, Math.random() * 40 + 10, 10] }}
                        transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.05 }}
                        className="w-1.5 bg-blue-500/60 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.3)]"
                      />
                    ))}
                  </div>
                  <button 
                    onClick={stopSession}
                    className="px-12 py-4 bg-red-500/20 text-red-500 border border-red-500/30 font-black rounded-3xl text-sm active-scale uppercase tracking-widest"
                  >
                    Terminar
                  </button>
                </div>
              ) : (
                <button 
                  onClick={startSession}
                  disabled={isConnecting}
                  className="w-full md:w-auto px-16 py-6 bg-blue-600 text-white font-black rounded-[32px] shadow-2xl shadow-blue-500/20 flex items-center justify-center gap-4 text-xl active-scale"
                >
                  {isConnecting ? (
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-2xl">⚡</span>
                      HABLAR CON TOMAS
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar Info - Desktop Only Hidden on Small Screens to save space */}
        <div className="hidden lg:flex flex-col w-96 space-y-6">
           <div className="glass-morphism p-8 rounded-[40px] border border-white/5">
              <h3 className="font-black text-white text-xl mb-6">Próximos Retos</h3>
              <div className="space-y-4">
                 {['Elevator Pitch', 'Job Offer Negotiation', 'Remote Tech Sync'].map((r, i) => (
                   <div key={i} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-blue-500/30 transition-all cursor-pointer">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Misión {i+1}</p>
                      <p className="text-slate-100 font-bold text-sm">{r}</p>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SpeakingPractice;
