import React, { useState, useEffect } from 'react';
import { HistoryItem } from '../types';
import { getHistory } from '../services/historyService';
import { Search, Calendar, ArrowLeft, MessageCircle, Award } from 'lucide-react';

interface HistoryListProps {
  onSelect: (item: HistoryItem) => void;
  onBack: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ onSelect, onBack }) => {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setItems(getHistory());
  }, []);

  const filteredItems = items.filter(item => 
    item.topic.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-retro-bg font-sans">
      <header className="bg-white border-b-4 border-retro-border shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto p-4 flex items-center gap-4">
          <button onClick={onBack} className="p-3 bg-retro-bg border-2 border-retro-border rounded-xl hover:shadow-none shadow-retro-sm transition-all">
            <ArrowLeft size={24} className="text-retro-dark" strokeWidth={2.5} />
          </button>
          <h1 className="text-2xl font-black text-retro-dark uppercase tracking-wide">Histórico</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-6">
        {/* Search */}
        <div className="relative mb-8">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
             <Search className="text-gray-400" size={24} strokeWidth={2.5} />
          </div>
          <input 
            type="text" 
            placeholder="Pesquisar lições..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-4 border-retro-border focus:ring-4 focus:ring-retro-secondary/20 outline-none shadow-retro text-lg font-bold text-retro-dark placeholder-gray-400 transition-all"
          />
        </div>

        {/* List */}
        <div className="space-y-4">
          {filteredItems.length === 0 ? (
            <div className="text-center py-20 opacity-50">
              <div className="text-6xl mb-4">📂</div>
              <p className="font-bold text-xl">Nada encontrado</p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full bg-white p-6 rounded-3xl border-4 border-retro-border shadow-retro hover:shadow-none hover:translate-y-1 transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <h3 className="font-black text-xl text-retro-dark group-hover:text-retro-primary transition-colors capitalize">
                    {item.topic}
                  </h3>
                  <div className="flex items-center gap-3 text-sm font-bold text-gray-500 mt-2">
                    <span className="flex items-center gap-1">
                        <Calendar size={14} /> {formatDate(item.timestamp)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md border-2 border-black text-xs uppercase tracking-wide ${item.mode === 'SCENARIO' ? 'bg-retro-accent text-retro-dark' : 'bg-retro-secondary text-white'}`}>
                        {item.mode === 'SCENARIO' ? 'Cenário' : 'Entrevista'}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1 bg-retro-card px-3 py-1 rounded-lg border-2 border-retro-border">
                        <Award size={18} className="text-retro-primary" strokeWidth={3} />
                        <span className="font-black text-retro-dark">{item.report.score}</span>
                    </div>
                </div>
              </button>
            ))
          )}
        </div>
      </main>
    </div>
  );
};