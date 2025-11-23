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
            className="pointer-events-auto bg-gray-800/80 p-4 rounded-full hover:bg-gray-700 transition-all text-white backdrop-blur-sm"
        >
            {showCaptions ? <Captions size={24} /> : <CaptionsOff size={24} />}
        </button>

        {/* Fake Mic Indicator (Always active in this implementation as it's VAD) */}
        <div className="pointer-events-auto bg-white p-5 rounded-full shadow-lg animate-pulse">
            <Mic size={32} className="text-green-600" />
        </div>

        {/* Hangup */}
        <button 
            onClick={onHangup}
            className="pointer-events-auto bg-red-600 hover:bg-red-700 p-4 rounded-full text-white transition-all shadow-lg"
        >
            <PhoneOff size={24} />
        </button>
    </div>
  );
};
