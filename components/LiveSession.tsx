import React, { useEffect, useState, useRef } from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import { Message } from '../types';
import { Controls } from './Controls';
import { LoadingSpinner } from './LoadingSpinner';

interface LiveSessionProps {
  mode: 'SCENARIO' | 'INTERVIEW';
  topic: string;
  imageUrl: string | null; // Null for interview if we just want a gradient or generic bg
  onSessionEnd: (messages: Message[]) => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ mode, topic, imageUrl, onSessionEnd }) => {
  const [showCaptions, setShowCaptions] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Optimized Prompts for Speed and Initiation
  const systemInstruction = mode === 'SCENARIO' 
    ? `INSTRUÇÃO PRINCIPAL: O usuário está vendo uma foto de "${topic}".
       AÇÃO IMEDIATA: Assim que a conexão abrir, diga "Olá!" e faça a primeira pergunta sobre a imagem. NÃO ESPERE O USUÁRIO FALAR.
       REGRA DE OURO: Seja MUITO BREVE. Suas respostas e perguntas devem ter no máximo 2 frases curtas.
       OBJETIVO: Fazer 10 perguntas rápidas sobre a cena (cores, objetos, pessoas).
       Tutor nativo brasileiro. Fale rápido e animado.`
    : `INSTRUÇÃO PRINCIPAL: Você é um examinador do CELPE-Bras. Tópico: "${topic}".
       AÇÃO IMEDIATA: Assim que a conexão abrir, inicie a entrevista com uma saudação e a primeira pergunta. NÃO ESPERE O USUÁRIO FALAR.
       REGRA DE OURO: Seja MUITO BREVE e DIRETO. Sem discursos longos. Máximo 2 frases por turno.
       Estilo: Profissional, firme, mas encorajador.
       Fale apenas em Português.`;

  const { startSession, stopSession, isConnected, messages, streamingContent, error } = useLiveSession({
    modelId: 'gemini-2.5-flash-native-audio-preview-09-2025',
    systemInstruction,
    initialImageBase64: imageUrl, // Will be passed if Scenario mode
    onClose: () => {
       setIsSessionActive(false);
    }
  });

  useEffect(() => {
    startSession();
    setIsSessionActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll transcripts
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingContent, showCaptions]);

  const handleHangup = () => {
    const finalMessages = stopSession();
    onSessionEnd(finalMessages);
  };

  if (!isConnected && !error) {
    return (
      <div className="h-screen w-full bg-gray-900 flex items-center justify-center">
        <LoadingSpinner message="Preparando sala de aula..." />
      </div>
    );
  }

  if (error) {
     return (
         <div className="h-screen w-full bg-gray-900 flex flex-col items-center justify-center text-white gap-4">
             <p className="text-red-400">{error}</p>
             <button onClick={handleHangup} className="bg-gray-700 px-4 py-2 rounded">Voltar</button>
         </div>
     )
  }

  return (
    <div className="relative h-screen w-full bg-black overflow-hidden">
      {/* Background */}
      {imageUrl ? (
        <div 
            className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
            style={{ backgroundImage: `url(${imageUrl})` }}
        >
            <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/90" />
        </div>
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-green-900">
             <div className="absolute inset-0 flex items-center justify-center opacity-20">
                <span className="text-9xl">🇧🇷</span>
             </div>
        </div>
      )}

      {/* Header / Topic */}
      <div className="absolute top-0 left-0 right-0 p-6 z-10 bg-gradient-to-b from-black/80 to-transparent">
        <h2 className="text-white text-xl font-semibold text-center shadow-sm">
            {mode === 'SCENARIO' ? 'Descreva a Imagem' : `Entrevista: ${topic}`}
        </h2>
        <p className="text-center text-green-300 text-sm animate-pulse mt-1">
            {isConnected ? 'Gravando' : 'Conectando...'}
        </p>
      </div>

      {/* Transcripts / Subtitles Overlay */}
      {showCaptions && (
        <div 
            className="absolute bottom-32 left-4 right-4 top-24 z-10 flex flex-col justify-end pointer-events-none"
        >
            <div 
                ref={scrollRef}
                className="bg-black/40 backdrop-blur-sm rounded-2xl p-4 overflow-y-auto flex flex-col gap-3 pointer-events-auto max-h-full border border-white/10"
            >
                {/* History */}
                {messages.map((msg, idx) => (
                    <div 
                        key={idx} 
                        className={`p-3 rounded-xl max-w-[85%] text-base md:text-lg shadow-md transition-all ${
                            msg.role === 'ai' 
                                ? 'bg-white/90 text-gray-900 self-start rounded-tl-none' 
                                : 'bg-green-600/90 text-white self-end rounded-tr-none'
                        }`}
                    >
                        <span className="font-bold text-xs block mb-1 opacity-70 uppercase">
                            {msg.role === 'ai' ? 'Professor' : 'Você'}
                        </span>
                        {msg.text}
                    </div>
                ))}
                
                {/* Streaming AI Message (Real-time) */}
                {streamingContent.ai && (
                     <div className="p-3 rounded-xl max-w-[85%] text-base md:text-lg shadow-md bg-white/70 text-gray-900 self-start rounded-tl-none animate-pulse">
                        <span className="font-bold text-xs block mb-1 opacity-70 uppercase">Professor (Falando...)</span>
                        {streamingContent.ai}
                    </div>
                )}

                {/* Streaming User Message (Real-time) */}
                {streamingContent.user && (
                     <div className="p-3 rounded-xl max-w-[85%] text-base md:text-lg shadow-md bg-green-600/70 text-white self-end rounded-tr-none animate-pulse">
                        <span className="font-bold text-xs block mb-1 opacity-70 uppercase">Você (Falando...)</span>
                        {streamingContent.user}
                    </div>
                )}
            </div>
        </div>
      )}

      {/* Controls */}
      <Controls 
        onHangup={handleHangup}
        showCaptions={showCaptions}
        onToggleCaptions={() => setShowCaptions(!showCaptions)}
      />
    </div>
  );
};