import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, AppSection } from '../types';
import { searchBilingualJobs, JobListing } from '../services/gemini';
import { Briefcase, MapPin, Globe, ExternalLink, DollarSign, Zap, Filter, Search } from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

const JobsBoard: React.FC<{ lang: Language, onNavigate: (s: AppSection) => void }> = ({ lang, onNavigate }) => {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'remote' | 'colombia'>('all');

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await searchBilingualJobs(lang);
        setJobs(res);
        setFilteredJobs(res);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    };
    fetch();
  }, [lang]);

  useEffect(() => {
    if (filter === 'all') setFilteredJobs(jobs);
    else if (filter === 'remote') setFilteredJobs(jobs.filter(j => j.location.toLowerCase().includes('remote') || j.location.toLowerCase().includes('global')));
    else if (filter === 'colombia') setFilteredJobs(jobs.filter(j => j.location.toLowerCase().includes('colombia') || j.location.toLowerCase().includes('bogotá') || j.location.toLowerCase().includes('medellín')));
  }, [filter, jobs]);

  const handleFilterChange = (newFilter: 'all' | 'remote' | 'colombia') => {
    triggerHaptic('light');
    setFilter(newFilter);
  };

  return (
    <div className="h-full flex flex-col gap-8 p-6 bg-slate-950 font-sans pb-32">
      <header className="flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-center md:text-left">
          <h2 className="text-5xl font-black text-white tracking-tighter italic leading-none">Global Careers</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">Connecting Colombian Talent to Global Wealth</p>
        </div>
        
        <div className="flex bg-slate-900 p-1.5 rounded-[24px] border border-white/10 shadow-2xl">
           {[
             { id: 'all', label: 'All Openings' },
             { id: 'remote', label: '100% Remote' },
             { id: 'colombia', label: 'Local Colombia' }
           ].map(f => (
             <button 
              key={f.id} 
              onClick={() => handleFilterChange(f.id as any)}
              className={`px-6 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.id ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
             >
               {f.label}
             </button>
           ))}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 overflow-y-auto pr-2 hide-scrollbar">
        {loading ? (
          [1,2,3,4,5,6].map(i => (
            <div key={i} className="h-72 bg-slate-900/50 rounded-[48px] animate-pulse border border-white/5" />
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredJobs.map((job, i) => (
              <motion.div 
                key={job.title + job.company} 
                layout
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="bg-slate-900/40 border border-white/10 p-10 rounded-[48px] flex flex-col justify-between shadow-2xl hover:border-brand-500/50 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity"><Briefcase size={80}/></div>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-start">
                     <div className="w-14 h-14 bg-brand-500/20 rounded-2xl flex items-center justify-center text-brand-400 font-black text-2xl shadow-inner border border-white/5">{job.company.charAt(0)}</div>
                     <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${job.source === 'El Empleo' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                       {job.source || 'Premium Source'}
                     </span>
                  </div>
                  <div>
                     <h3 className="text-2xl font-black text-white leading-tight group-hover:text-brand-400 transition-colors italic tracking-tighter">{job.title}</h3>
                     <p className="text-sm font-bold text-slate-400 mt-2">{job.company}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-slate-500">
                      <MapPin size={14} className="text-brand-400"/>
                      <span className="text-[10px] font-black uppercase tracking-widest">{job.location}</span>
                    </div>
                    <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-widest text-slate-500">
                       <span className="flex items-center gap-2 text-emerald-400"><DollarSign size={14}/> {job.salary || 'Negotiable'}</span>
                       <span className="flex items-center gap-2 text-blue-400"><Zap size={14}/> Bilingual</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => job.url && window.open(job.url, '_blank')}
                  className="mt-10 w-full py-5 bg-white text-slate-950 rounded-[28px] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  Apply via {job.source?.split(' ')[0] || 'Portal'} <ExternalLink size={14}/>
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      
      {filteredJobs.length === 0 && !loading && (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-500 opacity-30 p-20">
          <Search size={64} className="mb-6"/>
          <p className="font-black uppercase tracking-widest">No listings found in this category.</p>
        </div>
      )}
    </div>
  );
};

export default JobsBoard;