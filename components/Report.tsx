import React, { useEffect, useState } from 'react';
import { Message, SessionReport } from '../types';
import { generateReport } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Award, BookOpen, CheckCircle, Home, MessageCircle, Lightbulb, Languages } from 'lucide-react';

interface ReportProps {
  messages: Message[];
  mode: 'SCENARIO' | 'INTERVIEW';
  topic: string;
  existingReport?: SessionReport | null;
  onBackHome: () => void;
  onReportGenerated?: (report: SessionReport) => void;
}

export const Report: React.FC<ReportProps> = ({ messages, mode, topic, existingReport, onBackHome, onReportGenerated }) => {
  const [report, setReport] = useState<SessionReport | null>(existingReport || null);

  useEffect(() => {
    if (existingReport) return;

    const fetchReport = async () => {
      try {
        const data = await generateReport(messages, mode, topic);
        setReport(data);
        if (onReportGenerated) {
            onReportGenerated(data);
        }
      } catch (error) {
        console.error("Failed to generate report", error);
      }
    };
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingReport]);

  if (!report) {
    return (
        <div className="min-h-screen bg-retro-bg text-retro-dark flex items-center justify-center">
            <LoadingSpinner message="Corrigindo prova e gerando notas..." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-retro-bg text-retro-dark font-sans overflow-y-auto pb-20">
        <header className="bg-white border-b-4 border-retro-border p-6 shadow-sm sticky top-0 z-20">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-black uppercase tracking-wider text-retro-dark">Boletim de Prática</h1>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-3 py-1 rounded-lg text-xs font-bold border-2 border-retro-border shadow-retro-sm ${mode === 'SCENARIO' ? 'bg-retro-accent' : 'bg-retro-secondary text-white'}`}>
                        {mode === 'SCENARIO' ? 'CENÁRIO' : 'ENTREVISTA'}
                    </span>
                    <span className="font-bold text-gray-600">{topic}</span>
                  </div>
                </div>
                <button onClick={onBackHome} className="bg-retro-dark text-white p-3 rounded-xl border-2 border-black hover:bg-gray-800 shadow-retro hover:shadow-none hover:translate-y-1 transition-all">
                    <Home size={24} strokeWidth={2.5} />
                </button>
            </div>
        </header>

        <main className="max-w-3xl mx-auto p-6 space-y-8">
            {/* Score Card - Retro Stamp Style */}
            <div className="bg-retro-card rounded-3xl p-8 border-4 border-retro-border shadow-retro flex items-center justify-between relative overflow-hidden">
                <div className="z-10">
                    <h2 className="text-retro-dark text-sm uppercase font-black tracking-widest mb-2">Nota Final</h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-6xl font-black text-retro-primary">{report.score}</span>
                        <span className="text-2xl font-bold text-gray-400">/10</span>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-full border-4 border-retro-border shadow-retro-sm rotate-12 transform">
                    <Award size={48} className="text-retro-accent" strokeWidth={2.5} />
                </div>
                {/* Decorative background pattern */}
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-retro-primary opacity-10 rounded-full"></div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-3xl border-4 border-retro-border shadow-retro overflow-hidden">
                <div className="bg-blue-100 p-4 border-b-4 border-retro-border flex items-center gap-2">
                    <BookOpen size={24} className="text-blue-600" strokeWidth={2.5}/>
                    <h3 className="text-xl font-black text-retro-dark uppercase">Resumo da Lição</h3>
                </div>
                <div className="p-6 space-y-6">
                    {report.summary.map((item, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-xl border-2 border-gray-100 hover:border-blue-200 transition-colors">
                            <p className="text-retro-dark font-bold text-lg leading-snug">
                                {item.portuguese}
                            </p>
                            <p className="text-gray-500 font-medium">
                                {item.chinese}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

             {/* Vocabulary */}
             <div className="bg-white rounded-3xl border-4 border-retro-border shadow-retro overflow-hidden">
                <div className="bg-purple-100 p-4 border-b-4 border-retro-border flex items-center gap-2">
                    <Languages size={24} className="text-purple-600" strokeWidth={2.5}/>
                    <h3 className="text-xl font-black text-retro-dark uppercase">Vocabulário</h3>
                </div>
                <div className="p-6 grid gap-4">
                    {report.vocabulary.map((item, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border-2 border-retro-border shadow-retro-sm hover:translate-x-1 transition-transform">
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xl font-black text-purple-700">{item.word}</span>
                                  <span className="text-xs px-2 py-0.5 bg-purple-200 text-purple-900 rounded-lg border border-purple-300 font-bold uppercase">
                                    {item.type}
                                  </span>
                                </div>
                                <span className="text-sm font-bold bg-gray-100 px-3 py-1 rounded-lg border border-gray-300">
                                  {item.definition}
                                </span>
                            </div>
                            <p className="text-gray-600 text-sm font-medium border-t-2 border-dashed border-gray-200 pt-2 mt-2">
                                "{item.example}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Corrections & Feedback */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border-4 border-retro-border shadow-retro overflow-hidden">
                  <div className="bg-red-100 p-4 border-b-4 border-retro-border flex items-center gap-2">
                      <CheckCircle size={24} className="text-red-600" strokeWidth={2.5}/>
                      <h3 className="text-lg font-black text-retro-dark uppercase">Correções</h3>
                  </div>
                  <ul className="p-6 space-y-4">
                      {report.corrections.map((item, i) => (
                          <li key={i} className="flex gap-3 text-sm text-gray-800 bg-red-50 p-3 rounded-xl border border-red-100">
                            <span className="font-black text-red-500 bg-white w-6 h-6 flex items-center justify-center rounded-full border border-red-200 shrink-0">{i+1}</span> 
                            <span className="font-medium">{item}</span>
                          </li>
                      ))}
                  </ul>
              </div>

              <div className="bg-white rounded-3xl border-4 border-retro-border shadow-retro overflow-hidden">
                  <div className="bg-yellow-100 p-4 border-b-4 border-retro-border flex items-center gap-2">
                      <Lightbulb size={24} className="text-yellow-600" strokeWidth={2.5}/>
                      <h3 className="text-lg font-black text-retro-dark uppercase">Feedback</h3>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-700 font-medium leading-relaxed bg-yellow-50 p-4 rounded-xl border border-yellow-100 border-dashed">
                        {report.feedback}
                    </p>
                  </div>
              </div>
            </div>

             {/* Transcript */}
             <div className="bg-retro-card rounded-3xl border-4 border-retro-border shadow-retro p-6">
                <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-retro-dark uppercase">
                    <MessageCircle size={24} strokeWidth={2.5}/> Transcrição
                </h3>
                <div className="space-y-4 max-h-80 overflow-y-auto p-4 bg-white rounded-2xl border-2 border-retro-border inset-shadow">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                             <span className="text-[10px] font-black text-gray-400 mb-1 uppercase tracking-wider">{msg.role === 'ai' ? 'Professor' : 'Você'}</span>
                             <div className={`p-3 rounded-xl text-sm font-bold border-2 border-retro-border shadow-[2px_2px_0px_0px_rgba(0,0,0,0.1)] ${msg.role === 'user' ? 'bg-retro-secondary text-white' : 'bg-gray-100 text-gray-800'}`}>
                                {msg.text}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <button 
                onClick={onBackHome}
                className="w-full py-4 bg-retro-dark text-white rounded-2xl font-black text-xl shadow-retro hover:shadow-none hover:translate-y-1 transition-all border-4 border-transparent"
            >
                VOLTAR AO INÍCIO
            </button>
        </main>
    </div>
  );
};