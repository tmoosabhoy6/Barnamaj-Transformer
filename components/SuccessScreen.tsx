import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, CalendarCheck } from 'lucide-react';

interface SuccessScreenProps {
  date: string;
  onReset: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ date, onReset }) => {
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 1.1, opacity: 0 }}
      className="flex flex-col items-center justify-center py-24 px-4 text-center"
    >
      <div className="relative mb-10">
        <div className="absolute inset-0 bg-emerald-500 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
        <motion.div 
          initial={{ rotate: -180, scale: 0 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
          className="relative bg-navy-800 p-8 rounded-full shadow-[0_0_50px_rgba(16,185,129,0.2)] ring-1 ring-white/10"
        >
          <CheckCircle2 size={80} className="text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]" />
        </motion.div>
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="text-5xl font-bold text-white mb-6 tracking-tight drop-shadow-lg">Data Sync Complete</h2>
        
        <div className="bg-navy-800/60 backdrop-blur-md border border-white/10 p-6 rounded-2xl shadow-xl max-w-lg mx-auto mb-10 transform hover:scale-105 transition-transform duration-300">
           <div className="flex items-center justify-center gap-3 text-slate-400 mb-2">
             <CalendarCheck size={18} />
             <span className="uppercase text-xs font-bold tracking-widest">Processing Date</span>
           </div>
           <p className="text-3xl font-bold text-emerald-400">{date}</p>
           <p className="text-slate-400 mt-2 text-sm font-medium">Successfully pushed to Karbala Daily Barnamaj</p>
        </div>

        <button 
          onClick={onReset}
          className="group relative inline-flex items-center gap-3 px-10 py-4 bg-white text-navy-900 rounded-2xl font-bold text-lg overflow-hidden transition-all hover:bg-cyan-50 hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:-translate-y-1"
        >
          <span>Process Next Day</span>
          <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </motion.div>
  );
};