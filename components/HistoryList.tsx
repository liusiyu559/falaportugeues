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
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto p-4 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">Histórico de Prática</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4">
        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Pesquisar por tópico..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none shadow-sm"
          />
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {search ? 'Nenhum resultado encontrado.' : 'Nenhum histórico ainda.'}
            </div>
          ) : (
            filteredItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:border-green-400 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <div className="text-left">
                  <h3 className="font-bold text-lg text-gray-800 group-hover:text-green-700 transition-colors">
                    {item.topic}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                        <Calendar size={12} /> {formatDate(item.timestamp)}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-medium ${item.mode === 'SCENARIO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {item.mode === 'SCENARIO' ? 'Cenário' : 'Entrevista'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1 text-gray-600">
                            <Award size={16} className="text-yellow-500" />
                            <span className="font-bold">{item.report.score}/10</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                            <MessageCircle size={12} />
                            <span>{item.messages.length} msgs</span>
                        </div>
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