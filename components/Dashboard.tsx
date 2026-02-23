
import React, { useState } from 'react';
import { UserData } from '../types';
import { 
  Home, 
  User as UserIcon, 
  Settings, 
  ChevronUp, 
  Plus, 
  PieChart, 
  Target,
  LogOut,
  Sparkles
} from 'lucide-react';

interface DashboardProps {
  user: UserData;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onLogout }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative min-h-[100dvh] bg-white overflow-hidden">
      {/* Área Branca Principal - Ajuste de Contraste */}
      <main className="flex flex-col items-center justify-center min-h-[100dvh] p-3">
        <div className="text-center animate-fadeIn max-w-sm">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full mb-4">
            <Sparkles size={14} className="text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-widest text-emerald-600">Mesa Ativa</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight mb-3">
            Olá, <span className="text-gray-400">{user.email.split('@')[0]}</span>
          </h2>
          <p className="text-base font-medium leading-relaxed text-gray-400">
            Sua mesa inteligente está se organizando para o objetivo de <span className="text-gray-900 font-bold">{user.primaryGoal}</span>.
          </p>
          
          <div className="mt-3 grid grid-cols-3 gap-2 opacity-20 filter grayscale">
            <div className="h-1 w-full bg-gray-200 rounded-full" />
            <div className="h-1 w-full bg-gray-200 rounded-full" />
            <div className="h-1 w-full bg-gray-200 rounded-full" />
          </div>
        </div>
      </main>

      {/* Barra de Navegação Flutuante e Expansível - Dark Theme */}
      <div className="fixed bottom-8 left-0 right-0 z-50 px-3 pointer-events-none">
        <div className="max-w-xs mx-auto pointer-events-auto">
          
          {/* Painel Expansível */}
          <div 
            className={`nav-glass rounded-t-[2.5rem] overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
              isExpanded ? 'max-h-64 opacity-100 mb-2 p-3 pb-4' : 'max-h-0 opacity-0 mb-0 p-0'
            }`}
          >
            <div className="grid grid-cols-3 gap-3">
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <PieChart size={24} className="text-gray-400 group-hover:text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Stats</span>
              </button>
              <button className="flex flex-col items-center gap-2 group">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
                  <Target size={24} className="text-gray-400 group-hover:text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Metas</span>
              </button>
              <button 
                onClick={onLogout}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={24} className="text-gray-400 group-hover:text-red-500" />
                </div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Sair</span>
              </button>
            </div>
          </div>

          {/* Barra Principal */}
          <nav className="nav-glass rounded-[2.5rem] p-2 flex items-center justify-between shadow-2xl border border-white/5">
            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <UserIcon size={20} />
            </button>
            <button className="p-2 text-white transition-colors">
              <Home size={20} />
            </button>
            
            {/* Botão Plus Central */}
            <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 shadow-lg hover:scale-105 active:scale-95 transition-all mx-2">
              <Plus size={28} strokeWidth={3} />
            </button>

            <button className="p-2 text-white/50 hover:text-white transition-colors">
              <Settings size={20} />
            </button>

            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 transition-all duration-500 ${isExpanded ? 'rotate-180 text-emerald-400' : 'text-white/50 hover:text-white'}`}
            >
              <ChevronUp size={20} />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};
