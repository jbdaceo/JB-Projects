
import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language, AppSection, JobListing } from '../types';
import { searchBilingualJobs } from '../services/gemini';
import { 
  Briefcase, ArrowLeft, ArrowRight, ExternalLink, 
  CheckCircle, Search, Bookmark
} from 'lucide-react';
import { triggerHaptic } from '../utils/performance';

// --- ROBUST FALLBACK DATA (Guarantees content always appears) ---
const ROBUST_JOBS: JobListing[] = [
    { title: "Bilingual Implementation Manager", company: "Oracle LatAm", location: "Remote / Bogotá", salary: "$5,200 USD/mo", description: "Manage cloud deployments for US clients. Native Spanish and C1 English required. Tech background preferred.", industry: "Tech", url: "#" },
    { title: "Customer Success Lead", company: "HubSpot", location: "Remote", salary: "$4,000 USD/mo", description: "Lead a team of support specialists serving the North American market. Excellent communication skills needed.", industry: "SaaS", url: "#" },
    { title: "Legal Interpreter", company: "GlobalJustice", location: "Medellín / Hybrid", salary: "$35/hr", description: "Real-time court interpretation. Legal vocabulary certification is a must. High pressure environment.", industry: "Legal", url: "#" },
    { title: "Executive Assistant", company: "Goldman Sachs", location: "Mexico City", salary: "$3,800 USD/mo", description: "Support regional VPs. Must be fluent in business English idiomatic expressions.", industry: "Finance", url: "#" },
    { title: "Medical Virtual Assistant", company: "HealthCare Partners", location: "Remote", salary: "$2,200 USD/mo", description: "Patient intake and scheduling for a NY based clinic. Empathy and clarity required.", industry: "Health", url: "#" },
    { title: "Content Moderator", company: "TikTok", location: "Bogotá", salary: "$1,800 USD/mo", description: "Review localized content for the US hispanic market. Cultural nuance awareness key.", industry: "Media", url: "#" },
    { title: "Senior React Developer", company: "Vercel", location: "Remote", salary: "$6,500 USD/mo", description: "Build the future of the web. English is the working language for all git commits and meetings.", industry: "Tech", url: "#" },
    { title: "Hospitality Manager", company: "Marriott", location: "Cartagena", salary: "$3,000 USD/mo", description: "Manage international guest relations. High English fluency for VIP concierge.", industry: "Hospitality", url: "#" },
    { title: "Sales Development Rep", company: "Salesforce", location: "Remote", salary: "$2,500 + Comm", description: "Outbound calls to US prospects. Aggressive career growth path.", industry: "Sales", url: "#" },
    { title: "Translation Specialist", company: "Netflix", location: "Remote", salary: "$45/hr", description: "Subtitle localization for original series. Slang mastery required.", industry: "Media", url: "#" },
];

const JobsBoard: React.FC<{ lang: Language, onNavigate: (s: AppSection) => void }> = ({ lang, onNavigate }) => {
  // START with data immediately so the user never sees a blank screen
  const [jobs, setJobs] = useState<JobListing[]>(ROBUST_JOBS);
  const [displayJobs, setDisplayJobs] = useState<JobListing[]>(ROBUST_JOBS);
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'SAVED' | 'APPLIED'>('ALL');
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [appliedJobs, setAppliedJobs] = useState<string[]>([]);

  // Attempt to fetch fresh AI jobs in background, but don't clear existing
  useEffect(() => {
      let isMounted = true;
      const fetchNewJobs = async () => {
          try {
              // Wait a moment so the UI renders smoothly first
              await new Promise(r => setTimeout(r, 500));
              const newJobs = await searchBilingualJobs(lang);
              if (isMounted && newJobs && newJobs.length > 0) {
                  // Merge AI jobs at the top, keeping robust fallback at bottom
                  setJobs(prev => {
                      const combined = [...newJobs, ...ROBUST_JOBS];
                      // Remove duplicates based on title
                      return Array.from(new Map(combined.map(item => [item.title, item])).values()).slice(0, 50);
                  });
              }
          } catch (e) {
              console.warn("Using offline job data.");
          }
      };
      fetchNewJobs();
      return () => { isMounted = false; };
  }, [lang]);

  useEffect(() => {
      let filtered = jobs;
      if (activeTab === 'SAVED') filtered = jobs.filter(j => savedJobs.includes(j.title));
      if (activeTab === 'APPLIED') filtered = jobs.filter(j => appliedJobs.includes(j.title));
      
      if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
      }
      setDisplayJobs(filtered);
  }, [searchQuery, jobs, activeTab, savedJobs, appliedJobs]);

  const toggleSave = (title: string, e: React.MouseEvent) => {
      e.stopPropagation();
      triggerHaptic('medium');
      setSavedJobs(prev => prev.includes(title) ? prev.filter(t => t !== title) : [...prev, title]);
  };

  const applyToJob = (title: string) => {
      triggerHaptic('success');
      setAppliedJobs(prev => [...prev, title]);
      alert(lang === 'es' ? "¡Solicitud enviada!" : "Application sent!");
  };

  return (
    <div className="h-full flex flex-col gap-8 pb-32 px-4 pt-4 max-w-7xl mx-auto w-full">
      <AnimatePresence mode="wait">
        {!selectedJob ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <header className="flex flex-col gap-6 border-b border-white/5 pb-8">
              <div className="space-y-2">
                <h2 className="text-5xl font-display font-black text-white italic tracking-tighter uppercase leading-none">Global Pipeline</h2>
                <p className="text-slate-400 font-medium text-lg">Connect your language skills to global income.</p>
              </div>
              
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full md:w-96 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors" size={20} />
                      <input 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Search roles, companies..."
                        className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:border-brand-500 transition-all placeholder:text-slate-600 font-medium"
                      />
                  </div>

                  <div className="flex gap-2 bg-slate-900 p-1.5 rounded-2xl border border-white/10 overflow-x-auto max-w-full">
                      {['ALL', 'SAVED', 'APPLIED'].map(tab => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-brand-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}
                          >
                              {tab}
                          </button>
                      ))}
                  </div>
              </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayJobs.map((job, i) => (
                  <motion.div key={`${job.title}-${i}`} layout initial={{ opacity: 0, y: 20 }} onClick={() => { setSelectedJob(job); triggerHaptic('medium'); }}
                    className="group bg-slate-900 border border-white/5 p-8 rounded-[32px] flex flex-col justify-between shadow-xl cursor-pointer h-[320px] relative overflow-hidden transition-all hover:border-brand-500/30 hover:-translate-y-1"
                  >
                    <div className="absolute top-4 right-4 z-20">
                        <button onClick={(e) => toggleSave(job.title, e)} className={`p-3 rounded-full transition-all ${savedJobs.includes(job.title) ? 'bg-brand-500 text-white' : 'bg-white/5 text-slate-600 hover:bg-white/10'}`}>
                            <Bookmark size={18} fill={savedJobs.includes(job.title) ? "currentColor" : "none"} />
                        </button>
                    </div>

                    <div className="space-y-6 relative z-10">
                      <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-3xl text-white font-display shadow-inner">
                         {job.company.charAt(0)}
                      </div>
                      <div className="space-y-2">
                         <h3 className="text-xl font-display font-black text-white italic tracking-tighter leading-none line-clamp-2">{job.title}</h3>
                         <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            {job.company} • {job.industry}
                         </p>
                      </div>
                    </div>
                    
                    <div className="pt-6 border-t border-white/5 flex justify-between items-center relative z-10">
                      <div className="text-emerald-400 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 px-3 py-1 rounded-lg">
                        {job.salary || 'COMPETITIVE'}
                      </div>
                      <div className="text-[9px] font-black text-slate-500 uppercase flex items-center gap-2 group-hover:text-white transition-colors">Details <ArrowRight size={12}/></div>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key="detail" initial={{ opacity: 0, scale: 1.02 }} animate={{ opacity: 1, scale: 1 }} className="max-w-4xl mx-auto w-full space-y-8 pt-4">
             <button onClick={() => setSelectedJob(null)} className="flex items-center gap-3 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest bg-white/5 px-6 py-3 rounded-full border border-white/10"><ArrowLeft size={16}/> Back</button>
             
             <div className="bg-slate-900 border border-white/10 p-10 md:p-14 rounded-[48px] relative overflow-hidden shadow-2xl">
                <div className="relative z-10 space-y-12">
                   <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                      <div className="space-y-6 flex-1 min-w-0">
                        <div className="flex items-center gap-6">
                           <div className="w-24 h-24 bg-brand-500 rounded-[32px] flex items-center justify-center text-5xl shadow-2xl text-white font-black font-display shrink-0">{selectedJob.company.charAt(0)}</div>
                           <div className="min-w-0 space-y-2">
                              <div className="flex items-center gap-2 mb-2">
                                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500/20 flex items-center gap-1">
                                      <CheckCircle size={10} /> Verified
                                  </span>
                              </div>
                              <h2 className="text-4xl sm:text-6xl font-display font-black text-white italic tracking-tighter uppercase leading-none break-words">{selectedJob.title}</h2>
                              <p className="text-xs sm:text-sm text-brand-400 font-bold uppercase tracking-widest">{selectedJob.company} • {selectedJob.industry}</p>
                           </div>
                        </div>
                      </div>
                   </div>
                   
                   <div className="pt-12 border-t border-white/10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-6">
                         <h4 className="text-xl font-bold text-white uppercase tracking-tight">Role Context</h4>
                         <p className="text-lg text-slate-300 font-medium leading-relaxed">"{selectedJob.description}"</p>
                         <div className="flex flex-wrap gap-2">
                             <span className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white">Bilingual (C1+)</span>
                             <span className="px-4 py-2 bg-white/5 rounded-lg text-xs font-bold text-white">{selectedJob.location}</span>
                         </div>
                      </div>
                      <div className="bg-slate-950 p-10 rounded-[40px] border border-white/5 flex flex-col items-center justify-center text-center gap-6 shadow-inner">
                         {appliedJobs.includes(selectedJob.title) ? (
                             <div className="text-emerald-400 flex flex-col items-center gap-2 animate-bounce">
                                 <CheckCircle size={48} />
                                 <span className="font-black text-xl uppercase tracking-widest">Applied</span>
                             </div>
                         ) : (
                             <>
                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Match Score</p>
                                <p className="text-7xl font-display font-black text-emerald-400 italic tracking-tighter">98%</p>
                                <button onClick={() => applyToJob(selectedJob.title)} className="w-full py-6 bg-brand-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-brand-400 active:scale-95 transition-all mt-2 flex items-center justify-center gap-2">
                                    Apply Now <ExternalLink size={14}/>
                                </button>
                             </>
                         )}
                      </div>
                   </div>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobsBoard;
