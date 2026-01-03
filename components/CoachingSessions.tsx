
import React, { useState } from 'react';
// Added Language import
import { Language } from '../types';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.11.11?external=react,react-dom';

type SessionType = 'virtual' | 'in-person' | null;

// Added CoachingSessionsProps
interface CoachingSessionsProps {
  lang: Language;
}

const CoachingSessions: React.FC<CoachingSessionsProps> = ({ lang }) => {
  const [sessionType, setSessionType] = useState<SessionType>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    topic: '',
    location: 'Medellín (Parque Lleras)'
  });
  const [confirmed, setConfirmed] = useState(false);

  const locations = [
    'Medellín (Parque Lleras)',
    'Bogotá (Chapinero)',
    'Cali (El Peñón)',
    'Barranquilla (Paseo de la Castellana)'
  ];

  const handleBook = () => {
    setConfirmed(true);
  };

  if (confirmed) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-full text-center space-y-10 py-32"
      >
        <div className="w-32 h-32 bg-emerald-500/10 rounded-full flex items-center justify-center text-6xl border-4 border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]">✅</div>
        <div className="space-y-4">
          <h2 className="text-5xl font-black text-white tracking-tighter">¡Agendado con Éxito!</h2>
          <p className="text-slate-400 max-w-lg mx-auto text-xl leading-relaxed font-medium">
            Tomas te espera el <span className="text-white font-black underline decoration-emerald-500">{formData.date}</span> a las <span className="text-white font-black underline decoration-emerald-500">{formData.time}</span>. 
            Te enviamos un correo con los pasos a seguir.
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => { setConfirmed(false); setSessionType(null); setStep(1); }}
          className="px-12 py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 text-lg"
        >
          Nueva Tutoría
        </motion.button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-12 md:space-y-16 pb-24">
      <header>
        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">Tutorías 1-a-1</h2>
        <p className="text-slate-400 mt-3 text-lg font-medium">Feedback directo de Tomas para destruir tus barreras mentales.</p>
      </header>

      <div className="max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
              <h3 className="text-2xl font-black text-center text-white tracking-tight">¿Cómo prefieres elevar tu nivel?</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderColor: '#3b82f6' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSessionType('virtual'); setStep(2); }}
                  className="p-12 bg-slate-900/40 rounded-[48px] border-2 border-slate-800 flex flex-col items-center text-center space-y-8 group transition-all backdrop-blur-sm"
                >
                  <div className="w-24 h-24 bg-blue-600/10 rounded-[32px] flex items-center justify-center text-5xl group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">🌐</div>
                  <div>
                    <h4 className="text-3xl font-black text-white mb-3">Tutoría Virtual</h4>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">Video-coaching intensivo desde cualquier lugar del mundo.</p>
                  </div>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02, backgroundColor: 'rgba(30, 41, 59, 0.6)', borderColor: '#f59e0b' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => { setSessionType('in-person'); setStep(2); }}
                  className="p-12 bg-slate-900/40 rounded-[48px] border-2 border-slate-800 flex flex-col items-center text-center space-y-8 group transition-all backdrop-blur-sm"
                >
                  <div className="w-24 h-24 bg-amber-600/10 rounded-[32px] flex items-center justify-center text-5xl group-hover:bg-amber-600 group-hover:text-white transition-all shadow-inner">📍</div>
                  <div>
                    <h4 className="text-3xl font-black text-white mb-3">Presencial</h4>
                    <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">Coffee & English en los hubs de innovación de Colombia.</p>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-slate-900/40 p-10 md:p-14 rounded-[48px] border border-slate-800 shadow-2xl space-y-12 backdrop-blur-md"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-10">
                <div className="space-y-1">
                  <h3 className="text-3xl font-black text-white tracking-tight">
                    Agendando {sessionType === 'virtual' ? 'Sesión Virtual' : 'Sesión Presencial'}
                  </h3>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em]">Paso 2 de 2: Confirmación de Detalles</p>
                </div>
                <button 
                  onClick={() => setStep(1)} 
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  ← Volver
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block px-2">Selecciona la Fecha</label>
                  <input 
                    type="date" 
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl p-5 text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg shadow-inner transition-all"
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block px-2">Hora (GMT-5)</label>
                  <select 
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl p-5 text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg shadow-inner transition-all cursor-pointer"
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  >
                    <option value="">Selecciona disponibilidad</option>
                    <option>08:00 AM</option>
                    <option>10:00 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                    <option>06:00 PM</option>
                  </select>
                </div>
                
                {sessionType === 'in-person' && (
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block px-2">¿Dónde nos vemos?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {locations.map(loc => (
                        <button
                          key={loc}
                          onClick={() => setFormData({ ...formData, location: loc })}
                          className={`p-6 rounded-2xl border-2 text-sm font-black text-left transition-all shadow-lg ${
                            formData.location === loc ? 'border-amber-500 bg-amber-500/10 text-amber-400' : 'border-slate-800 bg-slate-950 text-slate-500 hover:border-slate-600'
                          }`}
                        >
                          {loc}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block px-2">¿Cuál es tu objetivo principal?</label>
                  <textarea 
                    placeholder="Describe lo que quieres lograr en estos 60 minutos..."
                    className="w-full bg-slate-950 border border-slate-700/50 rounded-2xl p-6 text-white outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 min-h-[150px] text-lg shadow-inner transition-all resize-none"
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  ></textarea>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-800 flex justify-end">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 20px 40px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleBook}
                  disabled={!formData.date || !formData.time || !formData.topic}
                  className="w-full md:w-auto px-20 py-6 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-500/20 disabled:opacity-50 text-xl transition-all"
                >
                  Confirmar Tutoría
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 p-10 bg-gradient-to-r from-blue-600/10 to-indigo-600/10 rounded-[48px] border border-blue-500/20 flex flex-col md:flex-row items-center gap-10 backdrop-blur-md shadow-2xl"
        >
          <div className="w-24 h-24 bg-slate-950/60 rounded-[32px] flex items-center justify-center text-5xl shrink-0 shadow-inner border border-blue-500/20">🎓</div>
          <div className="space-y-3">
            <h4 className="text-2xl font-black text-white italic tracking-tight">"El Camino with TMC teacher se construye paso a paso."</h4>
            <p className="text-slate-400 text-base md:text-lg leading-relaxed font-medium">
              Estas sesiones son el catalizador de tu carrera. Tomas te dará el feedback real que las academias tradicionales temen darte. Prepárate para subir de nivel.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CoachingSessions;
