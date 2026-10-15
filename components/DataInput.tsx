import React, { useState, useEffect } from 'react';
import { motion, Variants } from 'framer-motion';
import { ArrowRight, Zap, Trash2 } from 'lucide-react';

interface DataInputProps {
  onProcess: (data: string) => void;
  isProcessing: boolean;
  initialValue?: string;
}

export const DataInput: React.FC<DataInputProps> = ({ onProcess, isProcessing, initialValue = '' }) => {
  const [input, setInput] = useState(initialValue);

  // Sync if initialValue changes externally
  useEffect(() => {
    if (initialValue) setInput(initialValue);
  }, [initialValue]);

  const containerVariants: Variants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { 
      opacity: 1, 
      scale: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1],
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.3 } }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 50 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className="w-full max-w-5xl mx-auto"
    >
      <div className="relative z-10 group">
        
        {/* Subtle Glow Behind Card */}
        <div className="absolute inset-0 bg-cyan-500/10 rounded-[3rem] blur-2xl transform scale-95 opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>

        {/* Main Glass Card - Royal Navy Theme */}
        <div className="relative bg-navy-800/40 backdrop-blur-2xl rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl transition-all duration-500 hover:shadow-[0_0_40px_-10px_rgba(34,211,238,0.15)] group-hover:border-white/20">
          
          <div className="relative p-8 md:p-14">
            
            {/* Input Area */}
            <motion.div variants={itemVariants} className="relative">
              {/* Focus Glow Ring */}
              <div className="absolute -inset-[1px] bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-blue-500/0 rounded-[1.8rem] opacity-0 transition-opacity duration-500 pointer-events-none" style={{ opacity: input ? 0.3 : 0 }}></div>
              
              <div className="relative overflow-hidden rounded-[1.8rem] bg-navy-950/50 border border-white/10 shadow-inner focus-within:bg-navy-950/80 focus-within:border-cyan-500/30 transition-all duration-300">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isProcessing}
                  placeholder="Paste raw table data (ARRIVALS, DEPARTURES...)"
                  className="w-full h-[30rem] p-8 bg-transparent border-none focus:ring-0 resize-none font-mono text-sm text-cyan-100 placeholder:text-slate-600 leading-relaxed selection:bg-cyan-900 selection:text-white"
                />
                
                {/* Character Count Pill & Clear Button */}
                <div className="absolute bottom-6 right-6 flex items-center gap-3 pointer-events-none">
                    <motion.button
                         initial={{ scale: 0, opacity: 0 }}
                         animate={{ scale: input.length > 0 ? 1 : 0, opacity: input.length > 0 ? 1 : 0 }}
                         onClick={() => setInput('')}
                         className="pointer-events-auto px-4 py-2 bg-rose-500/10 backdrop-blur-md border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 text-xs font-bold rounded-full shadow-lg flex items-center gap-2 transition-all"
                    >
                        <Trash2 size={12} />
                        Clear
                    </motion.button>

                   <motion.div 
                     initial={{ scale: 0, opacity: 0 }}
                     animate={{ scale: input.length > 0 ? 1 : 0, opacity: input.length > 0 ? 1 : 0 }}
                     className="px-4 py-2 bg-navy-800/80 backdrop-blur-md border border-white/20 text-cyan-400 text-xs font-bold rounded-full shadow-lg flex items-center gap-2"
                   >
                     <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                     {input.length.toLocaleString()} chars
                   </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Action Bar - Expanded Button */}
            <motion.div variants={itemVariants} className="mt-8 w-full">
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => input.trim() && onProcess(input)}
                disabled={!input.trim() || isProcessing}
                className={`
                  relative overflow-hidden group flex items-center justify-center gap-6 w-full px-8 py-8 rounded-[1.5rem] font-bold text-2xl text-white shadow-2xl transition-all duration-300 border border-white/10
                  ${!input.trim() || isProcessing 
                    ? 'bg-navy-800/50 cursor-not-allowed text-slate-500 shadow-none' 
                    : 'bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 bg-[length:200%_100%] hover:bg-[100%_0] hover:shadow-[0_0_50px_-10px_rgba(8,145,178,0.5)]'
                  }
                `}
              >
                {!(!input.trim() || isProcessing) && (
                  <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out skew-x-12" />
                )}
                
                {isProcessing ? (
                  <div className="relative z-10 flex items-center gap-4">
                    <svg className="animate-spin h-8 w-8 text-white/90" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Analyze & Transform</span>
                  </div>
                ) : (
                  <div className="relative z-10 flex items-center gap-4">
                    <Zap size={32} className={input.trim() ? "text-yellow-300 fill-yellow-300 animate-pulse" : ""} />
                    <span>Process Data</span>
                    <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
                  </div>
                )}
              </motion.button>
            </motion.div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};