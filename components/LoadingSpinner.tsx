import React from 'react';

export const LoadingSpinner: React.FC<{message?: string}> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-full space-y-4">
    <div className="w-12 h-12 border-4 border-yellow-400 border-t-green-600 rounded-full animate-spin"></div>
    {message && <p className="text-gray-200 font-medium animate-pulse">{message}</p>}
  </div>
);
