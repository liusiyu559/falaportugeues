import React, { useState, useEffect } from 'react';
import { AppMode, Message, SessionReport, HistoryItem } from './types';
import { LiveSession } from './components/LiveSession';
import { Report } from './components/Report';
import { HistoryList } from './components/HistoryList';
import { generateScenarioImage } from './services/geminiService';
import { saveHistoryItem } from './services/historyService';
import { Camera, Mic, Play, Key, History, Map } from 'lucide-react';
import { LoadingSpinner } from './components/LoadingSpinner';

function App() {
  const [appMode, setAppMode] = useState<AppMode>(AppMode.IDLE);
  const [topic, setTopic] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [sessionMessages, setSessionMessages] = useState<Message[]>([]);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [isCheckingKey, setIsCheckingKey] = useState(true);
  const [viewingHistoryReport, setViewingHistoryReport] = useState<SessionReport | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // Robust check for various environments
      const envKey = typeof process !== 'undefined' ? process.env?.API_KEY : undefined;
      
      if (envKey) {
          setHasApiKey(true);
          setIsCheckingKey(false);
          return;
      }

      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        try {
            const hasKey = await aistudio.hasSelectedApiKey();
            setHasApiKey(hasKey);
        } catch (e) {
            setHasApiKey(false);
        }
      } else {
         // If no AI studio and no Env key, we still let them try, but it might fail later
         // Or we could implement a manual input. For now, we trust the deployment config.
         // If "cannot deploy", usually means env var is missing.
         setHasApiKey(false); 
      }
      setIsCheckingKey(false);
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      } catch (e) {
        setHasApiKey(true); 
      }
    } else {
        // Simple fallback if not in AI Studio environment
        alert("Please set REACT_APP_API_KEY or VITE_API_KEY in your deployment settings.");
    }
  };

  const handleStartScenario = async () => {
    if (!topic) return;
    setViewingHistoryReport(null);
    setAppMode(AppMode.SCENARIO_SETUP);
    try {
      const imageBase64 = await generateScenarioImage(topic);
      setGeneratedImage(imageBase64);
      setAppMode(AppMode.SCENARIO_LIVE);
    } catch (e) {
      console.error(e);
      alert("Erro ao gerar cenário. Tente novamente.");
      setAppMode(AppMode.IDLE);
    }
  };

  const handleStartInterview = () => {
    if (!topic) return;
    setViewingHistoryReport(null);
    setGeneratedImage(null);
    setAppMode(AppMode.INTERVIEW_LIVE);
  };

  const handleSessionEnd = (msgs: Message[]) => {
    setSessionMessages(msgs);
    setAppMode(AppMode.REPORT);
  };

  const handleNewReportGenerated = (report: SessionReport) => {
    const newItem: HistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        topic: topic,
        mode: generatedImage ? 'SCENARIO' : 'INTERVIEW',
        messages: sessionMessages,
        report: report
    };
    saveHistoryItem(newItem);
  };

  const handleHistorySelect = (item: HistoryItem) => {
      setTopic(item.topic);
      setSessionMessages(item.messages);
      setGeneratedImage(item.mode === 'SCENARIO' ? 'HISTORY_PLACEHOLDER' : null);
      setViewingHistoryReport(item.report);
      setAppMode(AppMode.REPORT);
  };

  const goHome = () => {
      setAppMode(AppMode.IDLE);
      setTopic('');
      setGeneratedImage(null);
      setSessionMessages([]);
      setViewingHistoryReport(null);
  };

  if (isCheckingKey) {
    return (
      <div className="h-screen bg-retro-bg flex items-center justify-center">
        <LoadingSpinner message="Carregando..." />
      </div>
    );
  }

  // Fallback for missing key (Non-AI Studio Env)
  if (!hasApiKey && !(typeof process !== 'undefined' && process.env?.API_KEY)) {
     return (
         <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center p-6 font-sans">
             <div className="max-w-md w-full bg-white rounded-3xl border-4 border-retro-border shadow-retro p-8 text-center space-y-6">
                 <div className="w-20 h-20 bg-retro-accent rounded-full border-4 border-retro-border mx-auto flex items-center justify-center shadow-retro-sm">
                    <Key size={32} className="text-retro-dark" />
                 </div>
                 <h1 className="text-3xl font-black text-retro-dark uppercase">Acesso Necessário</h1>
                 <p className="text-gray-600 font-medium">
                     Selecione sua chave API para começar a praticar.
                 </p>
                 <button 
                    onClick={handleSelectKey}
                    className="w-full py-4 bg-retro-secondary hover:bg-teal-500 rounded-xl font-black text-lg text-white border-4 border-retro-border shadow-retro hover:shadow-none hover:translate-y-1 transition-all"
                 >
                    CONECTAR CHAVE
                 </button>
             </div>
         </div>
     )
  }

  if (appMode === AppMode.HISTORY_LIST) {
      return (
          <HistoryList 
            onSelect={handleHistorySelect} 
            onBack={goHome}
          />
      );
  }

  if (appMode === AppMode.REPORT) {
    return (
      <Report 
        messages={sessionMessages} 
        mode={generatedImage ? 'SCENARIO' : 'INTERVIEW'}
        topic={topic}
        existingReport={viewingHistoryReport}
        onReportGenerated={handleNewReportGenerated}
        onBackHome={goHome} 
      />
    );
  }

  if (appMode === AppMode.SCENARIO_SETUP) {
    return (
      <div className="h-screen bg-retro-bg flex items-center justify-center">
        <LoadingSpinner message="Desenhando o cenário..." />
      </div>
    );
  }

  if (appMode === AppMode.SCENARIO_LIVE || appMode === AppMode.INTERVIEW_LIVE) {
    return (
      <LiveSession
        mode={appMode === AppMode.SCENARIO_LIVE ? 'SCENARIO' : 'INTERVIEW'}
        topic={topic}
        imageUrl={generatedImage}
        onSessionEnd={handleSessionEnd}
      />
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg flex flex-col items-center justify-center p-6 font-sans">
      
      {/* Decorative Background Elements */}
      <div className="fixed top-10 left-10 text-retro-secondary opacity-20 transform -rotate-12 pointer-events-none">
        <Map size={120} strokeWidth={3} />
      </div>
      <div className="fixed bottom-10 right-10 text-retro-primary opacity-20 transform rotate-12 pointer-events-none">
        <Mic size={120} strokeWidth={3} />
      </div>

      <div className="bg-white rounded-[40px] border-[6px] border-retro-border shadow-retro-lg p-8 w-full max-w-md space-y-8 relative z-10">
        
        {/* History Button */}
        <button 
            onClick={() => setAppMode(AppMode.HISTORY_LIST)}
            className="absolute -top-6 -right-6 bg-retro-accent p-4 border-4 border-retro-border rounded-2xl shadow-retro hover:shadow-none hover:translate-y-1 transition-all group"
            title="Histórico"
        >
            <History size={28} className="text-retro-dark group-hover:rotate-12 transition-transform" strokeWidth={2.5} />
        </button>

        <div className="text-center space-y-4 pt-4">
          <div className="inline-block bg-retro-card px-6 py-2 rounded-full border-4 border-retro-border shadow-retro-sm transform -rotate-2">
            <h1 className="text-3xl font-black text-retro-dark uppercase tracking-wide">FalaBrasil</h1>
          </div>
          <p className="text-gray-600 font-bold text-lg">Prática de Conversação</p>
        </div>

        <div className="space-y-4">
          <label className="block text-sm font-black text-retro-dark uppercase tracking-wider ml-1">
            Qual é o tema de hoje?
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Praia, Restaurante..."
            className="w-full px-6 py-4 rounded-2xl border-4 border-retro-border focus:ring-4 focus:ring-retro-primary/20 outline-none transition-all text-xl font-bold placeholder-gray-300 text-retro-dark"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2">
          <button
            disabled={!topic}
            onClick={handleStartScenario}
            className="group relative w-full bg-retro-primary hover:bg-[#FF7043] disabled:opacity-50 disabled:cursor-not-allowed border-4 border-retro-border rounded-2xl p-0 shadow-retro hover:shadow-none hover:translate-y-1 transition-all overflow-hidden"
          >
            <div className="flex items-center p-4">
                <div className="bg-white/20 p-3 rounded-xl border-2 border-white/30 mr-4">
                    <Camera size={28} className="text-white" strokeWidth={3} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="font-black text-white text-xl uppercase">Cenário</h3>
                    <p className="text-white/80 text-xs font-bold">Descrever imagem</p>
                </div>
                <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0" fill="currentColor" />
            </div>
          </button>

          <button
            disabled={!topic}
            onClick={handleStartInterview}
            className="group relative w-full bg-retro-secondary hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed border-4 border-retro-border rounded-2xl p-0 shadow-retro hover:shadow-none hover:translate-y-1 transition-all overflow-hidden"
          >
            <div className="flex items-center p-4">
                <div className="bg-white/20 p-3 rounded-xl border-2 border-white/30 mr-4">
                    <Mic size={28} className="text-white" strokeWidth={3} />
                </div>
                <div className="text-left flex-1">
                    <h3 className="font-black text-white text-xl uppercase">Entrevista</h3>
                    <p className="text-white/80 text-xs font-bold">Simular exame</p>
                </div>
                <Play size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-4 group-hover:translate-x-0" fill="currentColor" />
            </div>
          </button>
        </div>
      </div>
      
      <p className="text-xs font-bold text-retro-dark/50 mt-8 uppercase tracking-widest">
         Powered by Gemini Live
      </p>
    </div>
  );
}

export default App;