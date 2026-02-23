
import React, { useState, useEffect } from 'react';
import { BoardConfig, LogEntry } from '../types';
import { 
  Droplets, 
  Scale, 
  Apple, 
  Baby, 
  Wallet, 
  Search, 
  LayoutDashboard,
  HelpCircle,
  MoreVertical
} from 'lucide-react';

interface BoardProps {
  config: BoardConfig;
  logs: LogEntry[];
}

const IconMap: Record<string, React.ElementType> = {
  'Droplets': Droplets,
  'Scale': Scale,
  'Apple': Apple,
  'Baby': Baby,
  'Wallet': Wallet,
  'LayoutDashboard': LayoutDashboard,
  'Search': Search
};

export const Board: React.FC<BoardProps> = ({ config, logs }) => {
  const [coverUrl, setCoverUrl] = useState<string>('');
  
  useEffect(() => {
    const query = encodeURIComponent(config.coverQuery);
    setCoverUrl(`https://source.unsplash.com/featured/400x200/?${query}`);
  }, [config.coverQuery]);

  const IconComponent = IconMap[config.iconName] || HelpCircle;

  const renderContent = () => {
    switch (config.id) {
      case 'water':
        const { goal, current } = config.content;
        const percentage = Math.min((current / goal) * 100, 100);
        return (
          <div className="space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-black text-gray-900 tracking-tighter">{current}<span className="text-[10px] text-gray-400 font-bold ml-1">ml</span></span>
              <span className="text-[9px] font-black text-gray-300 uppercase">Meta {goal}</span>
            </div>
            <div className="h-1.5 bg-gray-50 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${percentage}%` }}></div>
            </div>
          </div>
        );
      case 'weight_progress':
        return (
          <div className="flex items-center justify-between">
             <span className="text-sm font-black text-gray-900 tracking-tighter">{config.content.current}<span className="text-[10px] text-gray-400 font-bold ml-1">kg</span></span>
             <div className="w-6 h-6 bg-emerald-50 rounded-full flex items-center justify-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
             </div>
          </div>
        );
      default:
        return <p className="text-xs text-gray-400 font-medium leading-relaxed">Dados em análise adaptativa pela Mesa.</p>;
    }
  };

  return (
    <div className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-300 animate-fadeIn">
      {/* Capa com Overlay de Alto Contraste */}
      <div className="relative h-6 overflow-hidden">
        <img src={coverUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent"></div>
        <div className="absolute bottom-3 left-4 flex items-center gap-2">
           <div className="p-1.5 bg-white/10 backdrop-blur-md rounded-lg text-white">
              <IconComponent size={14} />
           </div>
           <h3 className="text-xs font-bold text-white tracking-wide">{config.title}</h3>
        </div>
        <button className="absolute top-3 right-3 text-white/50 hover:text-white transition-colors">
           <MoreVertical size={16} />
        </button>
      </div>

      <div className="p-3">
        <div className="min-h-[40px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
