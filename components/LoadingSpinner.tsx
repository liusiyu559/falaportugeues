import React from 'react';

export const LoadingSpinner: React.FC<{message?: string}> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-6 p-6">
    <div className="relative">
      <div className="w-16 h-16 bg-retro-accent rounded-full border-4 border-retro-border animate-bounce shadow-retro"></div>
      <div className="absolute top-0 left-0 w-16 h-16 bg-retro-secondary rounded-full border-4 border-retro-border animate-ping opacity-75"></div>
    </div>
    {message && (
      <div className="bg-white border-2 border-retro-border px-6 py-3 rounded-full shadow-retro">
        <p className="text-retro-dark font-bold text-lg tracking-wide">{message}</p>
      </div>
    )}
  </div>
);