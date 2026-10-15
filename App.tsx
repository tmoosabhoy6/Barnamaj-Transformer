import React, { useState } from 'react';
import { Background } from './components/Background';
import { DataInput } from './components/DataInput';
import { DataReview } from './components/DataReview';
import { SuccessScreen } from './components/SuccessScreen';
import { processERPData } from './services/geminiService';
import { AppState, TransformedData } from './types';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WEBHOOK_URL = "https://n8n.srv1180208.hstgr.cloud/webhook/318d39e3-d69e-4f5a-99e9-a0fb68b06499";

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [transformedData, setTransformedData] = useState<TransformedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cachedInput, setCachedInput] = useState<string>('');

  const handleProcessData = async (rawData: string) => {
    setCachedInput(rawData); // Cache the input
    setAppState(AppState.PROCESSING);
    setError(null);
    try {
      const result = await processERPData(rawData);
      
      // Deduplicate group names (tourId) to prevent "Maimoon/Maimoon"
      const dedupe = (list: any[]) => list.map(item => ({
        ...item,
        tourId: item.tourId 
          ? Array.from(new Set(item.tourId.split('/').map((s: string) => s.trim()))).join('/')
          : item.tourId
      }));

      result.arrivals = dedupe(result.arrivals);
      result.departures = dedupe(result.departures);

      setTransformedData(result);
      setAppState(AppState.REVIEW);
    } catch (err: any) {
      console.error(err);
      setError("Failed to process data. Please ensure the input format is correct and try again.");
      setAppState(AppState.IDLE);
    }
  };

  const handleConfirmSend = async () => {
    if (!transformedData) return;
    
    setError(null); 
    setAppState(AppState.SENDING);
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transformedData)
      });
      
      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.status} ${response.statusText}`);
      }

      setAppState(AppState.SUCCESS);
    } catch (err) {
      console.error(err);
      setError("Failed to send data to the webhook. Please try again.");
      setAppState(AppState.REVIEW); 
    }
  };

  const resetApp = () => {
    setAppState(AppState.IDLE);
    setTransformedData(null);
    setError(null);
    setCachedInput(''); // Clear cache on full reset (success flow)
  };

  const handleBackToInput = () => {
    setAppState(AppState.IDLE);
    setError(null);
    // Do not clear cachedInput here
  };

  // Dynamic padding based on state to maximize screen real estate in Review mode
  const mainPadding = appState === AppState.REVIEW ? "px-4" : "px-4 container mx-auto";

  return (
    <div className="relative h-screen w-full text-slate-200 font-sans selection:bg-cyan-500/30 selection:text-cyan-100 overflow-hidden flex flex-col">
      <Background />
      
      <header className={`relative text-center z-10 transition-all duration-500 ${appState === AppState.REVIEW ? 'pt-6 pb-2 shrink-0' : 'pt-12 pb-8'}`}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="mb-1"
        >
          <h1 className={`font-arabic font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] tracking-wide transition-all duration-500 ${appState === AppState.REVIEW ? 'text-4xl' : 'text-6xl md:text-8xl'}`}>
            كربلاء المعلى
          </h1>
        </motion.div>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className={`font-medium tracking-[0.2em] uppercase bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent transition-all duration-500 mt-4 ${appState === AppState.REVIEW ? 'text-base' : 'text-xl md:text-2xl'}`}
        >
          Barnamaj Transformer
        </motion.p>
      </header>

      <main className={`flex-1 relative z-10 flex flex-col min-h-0 ${mainPadding} pb-4`}>
        <AnimatePresence>
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="max-w-md mx-auto mb-4 overflow-hidden shrink-0 w-full"
            >
              <div className="p-4 bg-red-900/50 backdrop-blur-sm text-red-200 rounded-2xl border border-red-500/30 shadow-lg flex items-start gap-3">
                <AlertCircle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {(appState === AppState.IDLE || appState === AppState.PROCESSING) && (
            <div className="flex-1 flex items-center justify-center">
              <DataInput 
                key="input"
                initialValue={cachedInput}
                onProcess={handleProcessData} 
                isProcessing={appState === AppState.PROCESSING} 
              />
            </div>
          )}

          {((appState === AppState.REVIEW || appState === AppState.SENDING) && transformedData) && (
            <DataReview 
              key="review"
              data={transformedData} 
              onConfirm={handleConfirmSend} 
              onBack={handleBackToInput}
              onUpdate={setTransformedData}
              isSending={appState === AppState.SENDING}
            />
          )}

          {(appState === AppState.SUCCESS && transformedData) && (
            <SuccessScreen 
              key="success"
              date={transformedData.processingDate} 
              onReset={resetApp} 
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;