import React, { useEffect, useState } from 'react';
import { Message, SessionReport } from '../types';
import { generateReport } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';
import { Award, BookOpen, CheckCircle, Home, MessageCircle, Lightbulb, Languages, History } from 'lucide-react';

interface ReportProps {
  messages: Message[];
  mode: 'SCENARIO' | 'INTERVIEW';
  topic: string;
  existingReport?: SessionReport | null; // New prop: if provided, don't generate, just show
  onBackHome: () => void;
  onReportGenerated?: (report: SessionReport) => void; // Callback to save history
}

export const Report: React.FC<ReportProps> = ({ messages, mode, topic, existingReport, onBackHome, onReportGenerated }) => {
  const [report, setReport] = useState<SessionReport | null>(existingReport || null);

  useEffect(() => {
    // If we already have a report (History Mode), don't fetch
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
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <LoadingSpinner message="Gerando relatório detalhado e analisando vocabulário..." />
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans overflow-y-auto">
        <header className="bg-green-600 text-white p-6 shadow-lg sticky top-0 z-20">
            <div className="max-w-3xl mx-auto flex justify-between items-center">
                <div>
                  <h1 className="text-2xl font-bold">Relatório de Prática</h1>
                  <div className="flex items-center gap-2 text-sm text-green-100 opacity-90">
                    <span className="bg-green-700 px-2 py-0.5 rounded text-xs font-mono">
                        {mode === 'SCENARIO' ? 'CENÁRIO' : 'ENTREVISTA'}
                    </span>
                    <span>Tema: {topic}</span>
                  </div>
                </div>
                <button onClick={onBackHome} className="bg-white/20 p-2 rounded-full hover:bg-white/30">
                    <Home size={24} />
                </button>
            </div>
        </header>

        <main className="max-w-3xl mx-auto p-6 space-y-6 pb-20">
            {/* Score Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 flex items-center justify-between">
                <div>
                    <h2 className="text-gray-500 text-sm uppercase font-bold tracking-wide">Nível de Fluência</h2>
                    <span className="text-5xl font-extrabold text-green-600">{report.score}<span className="text-xl text-gray-400">/10</span></span>
                </div>
                <Award size={48} className="text-yellow-500" />
            </div>

            {/* Summary: Bilingual Description/Answers */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 border-l-4 border-l-blue-500">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-blue-700">
                    <BookOpen size={20} /> 
                    {mode === 'SCENARIO' ? 'Descrição Modelo (Bilingue)' : 'Sugestão de Respostas (Bilingue)'}
                </h3>
                <div className="bg-blue-50 p-4 rounded-lg space-y-4">
                    {report.summary.map((item, i) => (
                        <div key={i} className="flex flex-col gap-1">
                            <p className="text-gray-800 font-medium text-lg leading-snug">
                                {item.portuguese}
                            </p>
                            <p className="text-gray-500 text-sm">
                                {item.chinese}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

             {/* Vocabulary Table */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-purple-700">
                    <Languages size={20} /> Vocabulário Essencial
                </h3>
                <div className="grid gap-4">
                    {report.vocabulary.map((item, i) => (
                        <div key={i} className="bg-purple-50/50 rounded-xl p-4 border border-purple-100 hover:border-purple-300 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                  <span className="text-lg font-bold text-purple-900">{item.word}</span>
                                  <span className="ml-2 text-xs px-2 py-0.5 bg-purple-200 text-purple-800 rounded-full uppercase font-semibold">
                                    {item.type}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-600 font-medium bg-white px-2 py-1 rounded shadow-sm">
                                  {item.definition}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm border-t border-purple-100 pt-2 mt-1 italic">
                                "{item.example}"
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Feedback & Corrections */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-red-600">
                      <CheckCircle size={20}/> Correções Pontuais
                  </h3>
                  <ul className="space-y-3">
                      {report.corrections.map((item, i) => (
                          <li key={i} className="flex gap-2 text-sm text-gray-700 bg-red-50 p-2 rounded">
                            <span className="font-bold text-red-400">{i+1}.</span> {item}
                          </li>
                      ))}
                  </ul>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-bold mb-3 flex items-center gap-2 text-orange-600">
                      <Lightbulb size={20}/> Dicas de Expressão
                  </h3>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {report.feedback}
                  </p>
              </div>
            </div>

             {/* Full Transcript */}
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-gray-600">
                    <MessageCircle size={20} className="text-gray-600"/> Transcrição Completa
                </h3>
                <div className="space-y-4 max-h-64 overflow-y-auto p-2 bg-gray-50 rounded-xl border border-gray-100 scrollbar-thin">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                             <span className="text-xs font-bold text-gray-400 mb-1 uppercase">{msg.role === 'ai' ? 'Professor' : 'Você'}</span>
                             <div className={`p-3 rounded-lg text-sm max-w-[90%] ${msg.role === 'user' ? 'bg-green-100 text-green-900' : 'bg-white border border-gray-200 text-gray-800'}`}>
                                {msg.text}
                             </div>
                        </div>
                    ))}
                </div>
            </div>
            
            <div className="pt-6">
                <button 
                    onClick={onBackHome}
                    className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-colors"
                >
                    Voltar ao Início
                </button>
            </div>
        </main>
    </div>
  );
};