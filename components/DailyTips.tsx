
import React from 'react';
import { UserData } from '../types';
import { Lightbulb, DollarSign, Heart } from 'lucide-react';

export const DailyTips: React.FC<{ user: UserData }> = ({ user }) => {
  const tips = [
    {
      id: 1,
      category: 'Economia',
      icon: DollarSign,
      title: 'Marmita da Semana',
      text: 'Frango desfiado rende 30% mais se misturado com abóbora.',
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 2,
      category: 'Saúde',
      icon: Heart,
      title: 'Água em Jejum',
      text: 'Beba 500ml ao acordar para ativar o metabolismo.',
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 3,
      category: 'Dica',
      icon: Lightbulb,
      title: 'Fome Emocional',
      text: 'Antes de comer, pergunte: "Eu comeria uma maçã agora?"',
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="w-full overflow-x-auto pb-4 no-scrollbar">
      <div className="flex gap-2 w-max px-1">
        {tips.map(tip => (
          <div key={tip.id} className="w-64 bg-white p-3 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col justify-between shrink-0 h-40">
             <div className="flex justify-between items-start">
                <div className={`p-2 rounded-md ${tip.color}`}>
                   <tip.icon size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-300">{tip.category}</span>
             </div>
             <div>
                <h4 className="font-bold text-gray-900 mb-1">{tip.title}</h4>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">{tip.text}</p>
             </div>
          </div>
        ))}
      </div>
    </div>
  );
};
