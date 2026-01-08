
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Language, AppSection } from '../types';
import { searchBilingualJobs, JobListing } from '../services/gemini';
import { Briefcase, MapPin, Clock, ExternalLink, ArrowLeft, Search, Globe, DollarSign } from 'lucide-react';
import { useAnimationVariants } from '../utils/performance';

interface JobsBoardProps {
  lang: Language;
  onNavigate: (section: AppSection) => void;
}

const JobsBoard: React.FC<JobsBoardProps> = ({ lang, onNavigate }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const animationVariants = useAnimationVariants();

  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const results = await searchBilingualJobs(lang);
        setJobs(results);
        setLastUpdated(new Date());
      } catch (e) {
        console.error("Jobs fetch error", e);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [lang]);

  const text = {
    title: lang === 'es' ? 'Futuro Global' : 'Global Future',
    subtitle: lang === 'es' ? 'Oportunidades Bilingües (0-3 Años Exp)' : 'Bilingual Opportunities (0-3 Years Exp)',
    scanning: lang === 'es' ? 'Escaneando bolsas de trabajo en tiempo real...' : 'Scanning job boards in real-time...',
    back: lang === 'es' ? 'Volver' : 'Back',
    apply: lang === 'es' ? 'Aplicar' : 'Apply Now',
    posted: lang === 'es' ? 'Publicado' : 'Posted',
    salary: lang === 'es' ? 'Salario' : 'Salary',
    location: lang === 'es' ? 'Ubicación' : 'Location',
    source: lang === 'es' ? 'Fuente' : 'Source',
    noJobs: lang === 'es' ? 'No se encontraron trabajos recientes. Intenta más tarde.' : 'No recent jobs found. Try again later.'
  };

  return (
    <div className="h-full flex flex-col pb-20 overflow-hidden">
      {/* Header */}
      <div className="flex-none p-2 mb-6">
        <button 
          onClick={() => onNavigate(AppSection.Home)}
          className="flex items-center gap-2 text-slate-400 hover:text-white font-bold uppercase tracking-widest text-xs mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> {text.back}
        </button>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-2 flex items-center gap-3">
              <Globe className="text-blue-500" size={40} />
              {text.title}
            </h2>
            <p className="text-slate-400 font-medium text-lg">{text.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-3 bg-slate-900/50 px-4 py-2 rounded-full border border-white/10">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-ping' : 'bg-green-500'}`}></div>
            <span className="text-xs font-bold text-slate-300 uppercase tracking-widest">
              {loading ? text.scanning : `Updated: ${lastUpdated.toLocaleTimeString()}`}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto hide-scrollbar px-2">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 rounded-[32px] bg-slate-900/50 border border-white/5 animate-pulse flex flex-col p-6 space-y-4">
                <div className="w-12 h-12 bg-white/10 rounded-xl"></div>
                <div className="h-6 bg-white/10 rounded w-3/4"></div>
                <div className="h-4 bg-white/10 rounded w-1/2"></div>
                <div className="flex-1"></div>
                <div className="h-10 bg-white/10 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : jobs.length > 0 ? (
          <motion.div 
            variants={animationVariants.container}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {jobs.map((job, idx) => (
              <motion.div
                key={idx}
                variants={animationVariants.slideUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="group relative bg-slate-900/40 backdrop-blur-md border border-white/10 hover:border-blue-500/50 rounded-[32px] p-6 flex flex-col h-full shadow-xl overflow-hidden transition-all"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10 flex justify-between items-start mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center text-2xl border border-white/10 shadow-inner">
                    <Briefcase className="text-blue-400" />
                  </div>
                  {job.postedTime && (
                    <div className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full flex items-center gap-1.5">
                      <Clock size={12} className="text-green-400" />
                      <span className="text-[10px] font-black text-green-400 uppercase tracking-wider">{job.postedTime}</span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 mb-6">
                  <h3 className="text-xl font-black text-white mb-1 line-clamp-2 leading-tight group-hover:text-blue-300 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-slate-400 font-bold text-sm uppercase tracking-wide">{job.company}</p>
                </div>

                <div className="relative z-10 space-y-3 mb-8 flex-1">
                  <div className="flex items-center gap-2 text-slate-300 text-sm font-medium">
                    <MapPin size={16} className="text-slate-500" />
                    {job.location}
                  </div>
                  {job.salary && (
                    <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
                      <DollarSign size={16} className="text-emerald-500" />
                      {job.salary}
                    </div>
                  )}
                  <p className="text-slate-500 text-xs leading-relaxed line-clamp-3">
                    {job.description}
                  </p>
                </div>

                <div className="relative z-10 pt-4 border-t border-white/5">
                  <a 
                    href={job.url || `https://www.google.com/search?q=${encodeURIComponent(job.title + ' ' + job.company + ' jobs')}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-3 bg-white text-slate-900 rounded-xl font-black text-sm uppercase tracking-widest hover:bg-blue-50 transition-colors shadow-lg active:scale-95"
                  >
                    {text.apply} <ExternalLink size={14} />
                  </a>
                  {/* Disclaimer about source */}
                  <div className="text-[9px] text-slate-600 text-center mt-2 font-bold uppercase tracking-wider">
                    {text.source}: Google Search
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-4">📡</div>
            <p className="text-slate-400 font-bold">{text.noJobs}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default JobsBoard;
