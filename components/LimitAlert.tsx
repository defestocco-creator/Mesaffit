import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface LimitAlertProps {
  message: string;
  onClose: () => void;
}

export const LimitAlert: React.FC<LimitAlertProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-2 animate-fadeIn">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      <div className="relative bg-[#1c1c1e] w-full max-w-xs rounded-md p-3 border border-red-500/20 shadow-2xl animate-slideUp">
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="w-6 h-6 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 ring-4 ring-red-500/20 animate-pulse">
            <AlertTriangle size={28} />
          </div>
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Limite Atingido</h3>
            <p className="text-xs text-gray-400 font-medium mt-2 leading-relaxed">{message}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-full py-3 bg-red-500 text-white rounded-md font-black text-[10px] uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 active:scale-95"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
