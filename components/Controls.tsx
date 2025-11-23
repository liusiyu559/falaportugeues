import React from 'react';
import { PhoneOff, Mic, Captions, CaptionsOff } from 'lucide-react';

interface ControlsProps {
  onHangup: () => void;
  showCaptions: boolean;
  onToggleCaptions: () => void;
}

export const Controls: React.FC<ControlsProps> = ({ onHangup, showCaptions, onToggleCaptions }) => {
  return (
    <div className="absolute bottom-8 left-0 right-0 flex justify-center items-center gap-6 z-50 pointer-events-none">
        {/* Caption Toggle */}
        <button 
            onClick={onToggleCaptions}
            className="pointer-events-auto bg-retro-accent border-2 border-retro-border p-4 rounded-2xl hover:translate-y-1 hover:shadow-none shadow-retro transition-all text-retro-dark"
            title={showCaptions ? "Ocultar Legendas" : "Mostrar Legendas"}
        >
            {showCaptions ? <Captions size={28} strokeWidth={2.5} /> : <CaptionsOff size={28} strokeWidth={2.5} />}
        </button>

        {/* Mic Indicator */}
        <div className="pointer-events-auto bg-white border-2 border-retro-border p-5 rounded-full shadow-retro-lg animate-pulse">
            <Mic size={32} className="text-retro-secondary" strokeWidth={3} />
        </div>

        {/* Hangup */}
        <button 
            onClick={onHangup}
            className="pointer-events-auto bg-retro-primary hover:bg-red-400 border-2 border-retro-border p-4 rounded-2xl text-white transition-all shadow-retro hover:translate-y-1 hover:shadow-none"
            title="Encerrar Chamada"
        >
            <PhoneOff size={28} strokeWidth={2.5} />
        </button>
    </div>
  );
};