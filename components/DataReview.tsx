import React, { useState } from 'react';
import { motion, Variants } from 'framer-motion';
import { Send, Plane, PlaneLanding, PlaneTakeoff, AlertTriangle, ArrowLeft, Wand2, X } from 'lucide-react';
import { TransformedData, TransportRecord } from '../types';
import { resolveFlightTimes } from '../services/geminiService';

interface DataReviewProps {
  data: TransformedData;
  onConfirm: () => void;
  onBack: () => void;
  onUpdate: (data: TransformedData) => void;
  isSending: boolean;
}

export const DataReview: React.FC<DataReviewProps> = ({ data, onConfirm, onBack, onUpdate, isSending }) => {
  const [isResolving, setIsResolving] = useState(false);
  
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1, delayChildren: 0.1 }
    },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 80, damping: 15 } }
  };

  const rowVariant: Variants = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 100 } }
  };

  const arrivals = data.arrivals || [];
  const departures = data.departures || [];
  
  const subvenue = {
    karbalaToNajaf: data.subvenue?.karbalaToNajaf ?? 0,
    najafToKarbala: data.subvenue?.najafToKarbala ?? 0
  };

  const warnings = [...arrivals, ...departures].filter(f => f.time.toLowerCase().includes("check"));

  const handleResolveTimes = async () => {
    if (warnings.length === 0) return;
    setIsResolving(true);

    const pendingRequests: { flight: string, type: 'arrival' | 'departure' }[] = [];
    
    arrivals.forEach(f => {
        if (f.time.toLowerCase().includes("check")) {
            pendingRequests.push({ flight: f.flight, type: 'arrival' });
        }
    });

    departures.forEach(f => {
        if (f.time.toLowerCase().includes("check")) {
            pendingRequests.push({ flight: f.flight, type: 'departure' });
        }
    });

    let resolvedMap: Record<string, string> = {};

    try {
        if (pendingRequests.length > 0) {
            resolvedMap = await resolveFlightTimes(pendingRequests, data.processingDate);
        }
    } catch (error) {
        console.error("Error resolving flights:", error);
    }

    const updateFlights = (list: any[]) => list.map(f => {
      const key = f.flight.trim();
      const resolvedTime = resolvedMap[key] || resolvedMap[key.replace(/\s+/g, '')];

      if (f.time.toLowerCase().includes("check") && resolvedTime) {
        return { ...f, time: resolvedTime };
      }
      return f;
    });

    onUpdate({
      ...data,
      arrivals: updateFlights(arrivals),
      departures: updateFlights(departures)
    });

    setIsResolving(false);
  };

  const updateRecord = (list: 'arrivals' | 'departures', index: number, field: keyof TransportRecord, value: any) => {
      const newList = [...(list === 'arrivals' ? arrivals : departures)];
      newList[index] = { ...newList[index], [field]: value };
      onUpdate({ ...data, [list]: newList });
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      className="flex flex-col h-full w-full gap-4 pb-2"
    >
      {/* Top Control Bar */}
      <motion.div variants={item} className="flex-none flex items-center justify-between bg-navy-800/80 backdrop-blur-xl px-6 py-3 rounded-[1.25rem] border border-white/10 shadow-lg z-30">
        <div className="flex items-center gap-6">
           <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg shadow-lg shadow-cyan-500/20">
             <Plane size={20} className="text-white" />
           </div>
           <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">Operation Dashboard</h2>
           <div className="h-6 w-px bg-white/10 hidden md:block"></div>
           <div className="hidden md:flex items-center gap-4">
            <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">Date</span>
            <input 
              value={data.processingDate || ""}
              onChange={(e) => onUpdate({ ...data, processingDate: e.target.value })}
              className="px-3 py-1 bg-cyan-950/50 text-cyan-400 rounded-lg font-mono font-bold text-lg border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.1)] focus:outline-none focus:border-cyan-400 transition-colors w-32 text-center"
            />
          </div>
        </div>
        <div className="flex gap-3">
          {warnings.length > 0 && (
             <button 
                onClick={handleResolveTimes}
                disabled={isResolving || isSending}
                className="px-4 py-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-all active:scale-95 flex items-center gap-2 text-sm group"
             >
                {isResolving ? <div className="w-4 h-4 border-2 border-amber-300/30 border-t-amber-300 rounded-full animate-spin"></div> : <Wand2 size={16} />}
                Resolve {warnings.length} Warnings
             </button>
          )}

          <button onClick={onBack} disabled={isSending || isResolving} className="px-5 py-2 rounded-xl border border-white/10 bg-white/5 text-slate-300 font-semibold hover:bg-white/10 hover:text-white transition-all active:scale-95 flex items-center gap-2 text-sm group">
             <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Edit
          </button>
          <button onClick={onConfirm} disabled={isSending || isResolving} className="px-6 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all active:scale-95 flex items-center gap-2 text-sm border border-emerald-400/20 group">
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Sending...
              </>
            ) : (
              <><Send size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> Confirm</>
            )}
          </button>
        </div>
      </motion.div>

      {/* Main Split Section (Arrivals & Departures) */}
      <div className="flex-1 min-h-0 grid grid-cols-1 xl:grid-cols-2 gap-4">
        
        {/* Arrivals Panel */}
        <motion.div variants={item} className="flex flex-col bg-navy-900/60 backdrop-blur-xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl relative group hover:border-white/10 transition-colors">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
           
           <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5 bg-navy-950/40">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                    <PlaneLanding size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white">Arrivals</h3>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-4xl font-bold text-white leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(34,211,238,0.3)]">{arrivals.length}</span>
                <span className="text-cyan-400/60 font-bold uppercase tracking-widest text-[10px]">Flights</span>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
             {arrivals.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
                    <div className="p-4 rounded-full bg-white/5">
                        <PlaneLanding size={32} className="opacity-50"/>
                    </div>
                    <span className="text-lg font-light">No Scheduled Arrivals</span>
                </div>
             ) : (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 bg-navy-950/95 backdrop-blur-xl z-20 shadow-lg text-slate-400 text-[10px] md:text-xs tracking-wider">
                    <tr>
                      <th className="w-[15%] py-3 pl-4 font-bold uppercase border-b border-white/5">ID</th>
                      <th className="w-[30%] py-3 font-bold uppercase border-b border-white/5">Group</th>
                      <th className="w-[10%] py-3 text-center font-bold uppercase border-b border-white/5">Pax</th>
                      <th className="w-[12%] py-3 text-center font-bold uppercase border-b border-white/5">Route</th>
                      <th className="w-[15%] py-3 font-bold uppercase border-b border-white/5">Flight</th>
                      <th className="w-[18%] py-3 pr-4 text-right font-bold uppercase border-b border-white/5">Time</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.03 } } }}
                    className="divide-y divide-white/5"
                  >
                    {arrivals.map((row, i) => (
                      <motion.tr key={i} variants={rowVariant} className="hover:bg-white/5 transition-colors group/row">
                        <td className="py-2 pl-4 align-top">
                           <input 
                             value={row.tourCodes} 
                             onChange={(e) => updateRecord('arrivals', i, 'tourCodes', e.target.value)}
                             className="w-full bg-transparent font-mono text-xs md:text-sm text-cyan-300/80 focus:text-white focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 align-middle">
                            <input 
                             value={row.tourId} 
                             onChange={(e) => updateRecord('arrivals', i, 'tourId', e.target.value)}
                             className="w-full bg-transparent font-bold text-slate-100 text-sm md:text-base focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 text-center align-middle">
                            <input 
                             type="number"
                             value={row.pax} 
                             onChange={(e) => updateRecord('arrivals', i, 'pax', parseInt(e.target.value) || 0)}
                             className="w-12 text-center bg-navy-800 rounded-md text-base font-mono font-bold text-cyan-100 border border-white/10 shadow-inner focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
                           />
                        </td>
                        <td className="py-2 text-center align-middle">
                           <div className="flex justify-center">
                             <div className={`flex items-center justify-center w-14 h-8 rounded-md shadow-lg border ${row.route === 'BA' ? 'text-orange-300 bg-orange-900/40 border-orange-500/30 shadow-orange-900/20' : 'text-indigo-300 bg-indigo-900/40 border-indigo-500/30 shadow-indigo-900/20'}`}>
                               <input 
                                 value={row.route} 
                                 onChange={(e) => updateRecord('arrivals', i, 'route', e.target.value)}
                                 className="w-full bg-transparent text-center text-xs font-black uppercase tracking-wider focus:outline-none"
                               />
                             </div>
                           </div>
                        </td>
                        <td className="py-2 align-middle">
                            <input 
                             value={row.flight} 
                             onChange={(e) => updateRecord('arrivals', i, 'flight', e.target.value)}
                             className="w-full bg-transparent font-mono text-sm md:text-base text-slate-300 focus:text-white focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 pr-4 text-right align-middle relative">
                            <input 
                             value={row.time} 
                             onChange={(e) => updateRecord('arrivals', i, 'time', e.target.value)}
                             className={`w-full bg-transparent text-right text-sm md:text-base font-bold focus:outline-none border-b border-transparent focus:border-cyan-500/50 transition-colors ${row.time.toLowerCase().includes("check") ? "text-amber-500" : "text-slate-300 focus:text-white"}`}
                           />
                           {row.time.toLowerCase().includes("check") && (
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 pointer-events-none">
                               <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                             </div>
                           )}
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
             )}
           </div>
        </motion.div>

        {/* Departures Panel */}
        <motion.div variants={item} className="flex flex-col bg-navy-900/60 backdrop-blur-xl rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl relative group hover:border-white/10 transition-colors">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500"></div>
           
           <div className="flex-none px-6 py-4 flex items-center justify-between border-b border-white/5 bg-navy-950/40">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 shadow-[0_0_15px_rgba(244,63,94,0.1)]">
                    <PlaneTakeoff size={20} />
                </div>
                <h3 className="text-2xl font-bold text-white">Departures</h3>
             </div>
             <div className="flex flex-col items-end">
                <span className="text-4xl font-bold text-white leading-none tracking-tighter drop-shadow-[0_0_10px_rgba(244,63,94,0.3)]">{departures.length}</span>
                <span className="text-rose-400/60 font-bold uppercase tracking-widest text-[10px]">Flights</span>
             </div>
           </div>

           <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 custom-scrollbar">
             {departures.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50 space-y-4">
                    <div className="p-4 rounded-full bg-white/5">
                        <PlaneTakeoff size={32} className="opacity-50"/>
                    </div>
                    <span className="text-lg font-light">No Scheduled Departures</span>
                </div>
             ) : (
                <table className="w-full text-left border-collapse table-fixed">
                  <thead className="sticky top-0 bg-navy-950/95 backdrop-blur-xl z-20 shadow-lg text-slate-400 text-[10px] md:text-xs tracking-wider">
                    <tr>
                      <th className="w-[15%] py-3 pl-4 font-bold uppercase border-b border-white/5">ID</th>
                      <th className="w-[30%] py-3 font-bold uppercase border-b border-white/5">Group</th>
                      <th className="w-[10%] py-3 text-center font-bold uppercase border-b border-white/5">Pax</th>
                      <th className="w-[12%] py-3 text-center font-bold uppercase border-b border-white/5">Route</th>
                      <th className="w-[15%] py-3 font-bold uppercase border-b border-white/5">Flight</th>
                      <th className="w-[18%] py-3 pr-4 text-right font-bold uppercase border-b border-white/5">Time</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    initial="hidden"
                    animate="show"
                    variants={{ show: { transition: { staggerChildren: 0.03 } } }}
                    className="divide-y divide-white/5"
                  >
                    {departures.map((row, i) => (
                      <motion.tr key={i} variants={rowVariant} className="hover:bg-white/5 transition-colors group/row">
                        <td className="py-2 pl-4 align-top">
                           <input 
                             value={row.tourCodes} 
                             onChange={(e) => updateRecord('departures', i, 'tourCodes', e.target.value)}
                             className="w-full bg-transparent font-mono text-xs md:text-sm text-rose-300/80 focus:text-white focus:outline-none border-b border-transparent focus:border-rose-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 align-middle">
                            <input 
                             value={row.tourId} 
                             onChange={(e) => updateRecord('departures', i, 'tourId', e.target.value)}
                             className="w-full bg-transparent font-bold text-slate-100 text-sm md:text-base focus:outline-none border-b border-transparent focus:border-rose-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 text-center align-middle">
                            <input 
                             type="number"
                             value={row.pax} 
                             onChange={(e) => updateRecord('departures', i, 'pax', parseInt(e.target.value) || 0)}
                             className="w-12 text-center bg-navy-800 rounded-md text-base font-mono font-bold text-rose-100 border border-white/10 shadow-inner focus:outline-none focus:ring-1 focus:ring-rose-500/50"
                           />
                        </td>
                        <td className="py-2 text-center align-middle">
                           <div className="flex justify-center">
                             <div className={`flex items-center justify-center w-14 h-8 rounded-md shadow-lg border ${row.route === 'BA' ? 'text-orange-300 bg-orange-900/40 border-orange-500/30 shadow-orange-900/20' : 'text-indigo-300 bg-indigo-900/40 border-indigo-500/30 shadow-indigo-900/20'}`}>
                               <input 
                                 value={row.route} 
                                 onChange={(e) => updateRecord('departures', i, 'route', e.target.value)}
                                 className="w-full bg-transparent text-center text-xs font-black uppercase tracking-wider focus:outline-none"
                               />
                             </div>
                           </div>
                        </td>
                        <td className="py-2 align-middle">
                            <input 
                             value={row.flight} 
                             onChange={(e) => updateRecord('departures', i, 'flight', e.target.value)}
                             className="w-full bg-transparent font-mono text-sm md:text-base text-slate-300 focus:text-white focus:outline-none border-b border-transparent focus:border-rose-500/50 transition-colors"
                           />
                        </td>
                        <td className="py-2 pr-4 text-right align-middle relative">
                            <input 
                             value={row.time} 
                             onChange={(e) => updateRecord('departures', i, 'time', e.target.value)}
                             className={`w-full bg-transparent text-right text-sm md:text-base font-bold focus:outline-none border-b border-transparent focus:border-rose-500/50 transition-colors ${row.time.toLowerCase().includes("check") ? "text-amber-500" : "text-slate-300 focus:text-white"}`}
                           />
                           {row.time.toLowerCase().includes("check") && (
                             <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6 pointer-events-none">
                               <AlertTriangle size={14} className="text-amber-500 animate-pulse" />
                             </div>
                           )}
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
             )}
           </div>
        </motion.div>
      </div>

      {/* Bottom Subvenue Section */}
      <motion.div 
        variants={item} 
        className="flex-none h-[180px] w-full relative overflow-hidden rounded-[1.5rem] shadow-2xl border border-white/10 bg-navy-900/80 backdrop-blur-xl z-20"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-full bg-gradient-to-b from-transparent via-white/10 to-transparent hidden md:block"></div>

        <div className="h-full w-full grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0">
            {/* Karbala -> Najaf */}
            <div className="relative group p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-500 overflow-hidden">
                <div className="flex flex-col justify-center h-full w-full z-10 pl-10">
                    <div className="flex items-center gap-3 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                        <span className="text-indigo-300 text-2xl font-bold uppercase tracking-widest">Karbala to Najaf</span>
                    </div>
                    
                    <div className="flex items-baseline gap-6">
                        <input 
                            type="number"
                            value={subvenue.karbalaToNajaf}
                            onChange={(e) => onUpdate({ ...data, subvenue: { ...data.subvenue, karbalaToNajaf: parseInt(e.target.value) || 0 } })}
                            className="text-8xl md:text-9xl font-bold text-white tracking-tighter drop-shadow-xl bg-transparent focus:outline-none border-b border-transparent focus:border-indigo-500/50 transition-all w-full max-w-sm"
                        />
                        <span className="text-white/30 font-medium text-lg uppercase tracking-widest pb-4">Pax</span>
                    </div>
                    
                    <div className="mt-2 w-full max-w-[240px] h-2 bg-navy-950 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: "100%" }} 
                           transition={{ duration: 1, delay: 0.4, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.6)]" 
                         />
                    </div>
                </div>
            </div>

            {/* Najaf -> Karbala */}
            <div className="relative group p-6 flex items-center justify-between hover:bg-white/5 transition-colors duration-500 overflow-hidden">
                <div className="flex flex-col justify-center h-full w-full z-10 pl-10">
                     <div className="flex items-center gap-3 mb-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse"></span>
                        <span className="text-purple-300 text-2xl font-bold uppercase tracking-widest">Najaf to Karbala</span>
                    </div>

                    <div className="flex items-baseline gap-6">
                        <input 
                            type="number"
                            value={subvenue.najafToKarbala}
                            onChange={(e) => onUpdate({ ...data, subvenue: { ...data.subvenue, najafToKarbala: parseInt(e.target.value) || 0 } })}
                            className="text-8xl md:text-9xl font-bold text-white tracking-tighter drop-shadow-xl bg-transparent focus:outline-none border-b border-transparent focus:border-purple-500/50 transition-all w-full max-w-sm"
                        />
                         <span className="text-white/30 font-medium text-lg uppercase tracking-widest pb-4">Pax</span>
                    </div>

                     <div className="mt-2 w-full max-w-[240px] h-2 bg-navy-950 rounded-full overflow-hidden border border-white/5">
                         <motion.div 
                           initial={{ width: 0 }} 
                           animate={{ width: "100%" }} 
                           transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
                           className="h-full bg-gradient-to-r from-purple-600 to-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.6)]" 
                         />
                    </div>
                </div>
            </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        /* Remove arrows from number input */
        input[type=number]::-webkit-inner-spin-button, 
        input[type=number]::-webkit-outer-spin-button { 
            -webkit-appearance: none; 
            margin: 0; 
        }
        input[type=number] {
            -moz-appearance: textfield;
        }
      `}</style>
    </motion.div>
  );
};