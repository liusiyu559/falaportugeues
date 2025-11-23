import React, { useEffect, useState, useRef } from 'react';
import { useLiveSession } from '../hooks/useLiveSession';
import { Message } from '../types';
import { Controls } from './Controls';
import { LoadingSpinner } from './LoadingSpinner';

interface LiveSessionProps {
  mode: 'SCENARIO' | 'INTERVIEW';
  topic: string;
  imageUrl: string | null;
  onSessionEnd: (messages: Message[]) => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ mode, topic, imageUrl, onSessionEnd }) => {
  const [showCaptions, setShowCaptions] = useState(true);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    initialImageBase64: imageUrl,
    onClose: () => {
       setIsSessionActive(false);
    }
  });

  useEffect(() => {
    startSession();
    setIsSessionActive(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      <div className="h-screen w-full bg-retro-bg flex items-center justify-center">
        <LoadingSpinner message={mode === 'SCENARIO' ? "Criando Cenário..." : "Conectando Examinador..."} />
      </div>
    );
  }

  if (error) {
     return (
         <div className="h-screen w-full bg-retro-card flex flex-col items-center justify-center gap-6 border-8 border-retro-primary box-border p-8">
             <div className="text-6xl">⚠️</div>
             <p className="text-retro-dark text-xl font-bold text-center">{error}</p>
             <button onClick={handleHangup} className="bg-retro-dark text-white px-8 py-3 rounded-xl border-2 border-black shadow-retro hover:shadow-none hover:translate-y-1 transition-all font-bold">
                 Voltar ao Início
             </button>
         </div>
     )
  }

  return (
    <div className="relative h-screen w-full bg-retro-card overflow-hidden flex flex-col">
      {/* Retro Header Bar */}
      <div className="bg-retro-accent border-b-4 border-retro-border p-4 z-20 shadow-md flex justify-between items-center">
         <div className="flex items-center gap-2">
            <div className={`w-4 h-4 rounded-full border-2 border-black ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="font-bold text-retro-dark uppercase tracking-wider text-sm">
                {isConnected ? 'No Ar' : 'Conectando'}
            </span>
         </div>
         <h2 className="text-retro-dark font-black text-lg uppercase tracking-widest truncate max-w-[200px]">
            {topic}
         </h2>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative m-4 mt-0 mb-0 border-4 border-retro-border rounded-3xl overflow-hidden bg-black shadow-retro-lg">
          {imageUrl ? (
            <div 
                className="absolute inset-0 bg-cover bg-center transition-opacity duration-1000"
                style={{ backgroundImage: `url(${imageUrl})` }}
            >
                {/* Vintage vignette effect */}
                <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(0,0,0,0.6)]" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-retro-bg flex items-center justify-center">
                <div className="text-center opacity-50">
                    <span className="text-9xl block mb-4">🇧🇷</span>
                    <span className="text-2xl font-bold text-retro-dark">Sala de Entrevista</span>
                </div>
            </div>
          )}

          {/* Subtitles Container (Retro Chat Box) */}
          {showCaptions && (
            <div className="absolute bottom-24 left-2 right-2 md:left-6 md:right-6 top-6 flex flex-col justify-end pointer-events-none">
                <div 
                    ref={scrollRef}
                    className="flex flex-col gap-3 max-h-full overflow-y-auto pointer-events-auto pb-4"
                >
                    {messages.map((msg, idx) => (
                        <div 
                            key={idx} 
                            className={`p-4 rounded-2xl max-w-[85%] text-lg font-medium border-2 border-retro-border shadow-retro-sm ${
                                msg.role === 'ai' 
                                    ? 'bg-white text-retro-dark self-start rounded-tl-none' 
                                    : 'bg-retro-secondary text-white self-end rounded-tr-none'
                            }`}
                        >
                            <span className="font-black text-xs block mb-1 uppercase tracking-wide opacity-80">
                                {msg.role === 'ai' ? 'Professor' : 'Você'}
                            </span>
                            {msg.text}
                        </div>
                    ))}
                    
                    {streamingContent.ai && (
                         <div className="p-4 rounded-2xl max-w-[85%] text-lg font-medium border-2 border-retro-border shadow-retro-sm bg-white text-retro-dark self-start rounded-tl-none opacity-90">
                            <span className="font-black text-xs block mb-1 uppercase tracking-wide opacity-80">Professor (Falando...)</span>
                            {streamingContent.ai}
                        </div>
                    )}

                    {streamingContent.user && (
                         <div className="p-4 rounded-2xl max-w-[85%] text-lg font-medium border-2 border-retro-border shadow-retro-sm bg-retro-secondary text-white self-end rounded-tr-none opacity-90">
                            <span className="font-black text-xs block mb-1 uppercase tracking-wide opacity-80">Você (Falando...)</span>
                            {streamingContent.user}
                        </div>
                    )}
                </div>
            </div>
          )}
      </div>

      <Controls 
        onHangup={handleHangup}
        showCaptions={showCaptions}
        onToggleCaptions={() => setShowCaptions(!showCaptions)}
      />
    </div>
  );
};