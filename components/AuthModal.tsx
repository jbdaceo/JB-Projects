
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: () => void;
  onGuest: () => void;
  lang: Language;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin, onGuest, lang }) => {
  const { signInWithProvider, loading } = useAuth();

  if (!isOpen) return null;

  const handleSocialLogin = async (provider: 'google' | 'facebook' | 'apple') => {
    await signInWithProvider(provider);
    onLogin();
  };

  const socialButtons = [
    { name: 'Google', id: 'google', icon: 'G', color: 'bg-white text-slate-900 border-white hover:bg-slate-100' },
    { name: 'Facebook', id: 'facebook', icon: 'f', color: 'bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#166fe5]' },
    { name: 'Apple', id: 'apple', icon: '', color: 'bg-black text-white border-black hover:bg-slate-900' },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="absolute inset-0 bg-black/80 backdrop-blur-md" 
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-slate-950 border border-white/10 rounded-[40px] p-8 md:p-12 w-full max-w-md shadow-2xl overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-500/20 to-transparent pointer-events-none"></div>

        <div className="relative text-center space-y-2 mb-10">
          <div className={`w-16 h-16 rounded-2xl ${lang === 'es' ? 'colombia-gradient' : 'usa-gradient'} flex items-center justify-center text-3xl shadow-lg mx-auto mb-6`}>C</div>
          <h2 className="text-3xl font-black text-white">Welcome Back</h2>
          <p className="text-slate-400 text-sm font-medium">Continue your journey with El Camino.</p>
        </div>

        <div className="space-y-3">
          {socialButtons.map((btn) => (
            <button
              key={btn.name}
              onClick={() => handleSocialLogin(btn.id as any)}
              disabled={loading}
              className={`w-full py-4 px-6 rounded-2xl flex items-center justify-center gap-4 font-bold text-sm transition-all active:scale-95 border ${btn.color} shadow-lg disabled:opacity-50`}
            >
              {loading ? '...' : (
                  <>
                    <span className="text-lg font-serif">{btn.icon}</span>
                    <span>Continue with {btn.name}</span>
                  </>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8 pt-8 border-t border-white/5 text-center">
          <button 
            onClick={onGuest}
            className="text-slate-500 text-xs font-bold uppercase tracking-widest hover:text-white transition-colors"
          >
            Continue as Guest
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthModal;
