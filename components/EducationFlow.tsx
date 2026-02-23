
import React, { useState } from 'react';
import { UserData } from '../types';
import { ref, update } from "firebase/database";
import { db } from '../firebase';
import { ArrowRight, ChevronRight, X, FlaskConical, Dna, Activity, BrainCircuit } from 'lucide-react';

interface EducationFlowProps {
  user: UserData;
  onComplete: (user: UserData) => void;
}

const slides = [
  {
    id: 1,
    title: "Por que Diferente?",
    subtitle: "A Ciência, não o Chute.",
    icon: FlaskConical,
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
    content: (
      <>
        <p className="mb-2">No universo fitness, é comum ouvir: "2.000 kcal para todos". O MesaFit rejeita médias.</p>
        <p>Utilizamos a equação de <strong className="text-emerald-400">Mifflin-St Jeor</strong>, validada internacionalmente, cruzada com seus dados reais.</p>
        <p className="mt-2 text-sm text-gray-400 border-l-2 border-emerald-500 pl-3 italic">Isso não é mágica. É cálculo metabólico aplicado à sua biologia única.</p>
      </>
    )
  },
  {
    id: 2,
    title: "A Base: BMR & RMR",
    subtitle: "O Custo de Existir.",
    icon: Dna,
    image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&w=800&q=80",
    content: (
      <>
        <p className="mb-2">Primeiro, calculamos sua <strong className="text-blue-400">BMR (Basal Metabolic Rate)</strong>.</p>
        <p>É a energia exata que seu corpo queima em repouso absoluto apenas para manter coração, cérebro e órgãos funcionando.</p>
        <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider text-gray-500">
           <span className="bg-white/5 p-2 rounded-lg text-center">Idade</span>
           <span className="bg-white/5 p-2 rounded-lg text-center">Gênero</span>
           <span className="bg-white/5 p-2 rounded-lg text-center">Altura</span>
           <span className="bg-white/5 p-2 rounded-lg text-center">Peso</span>
        </div>
      </>
    )
  },
  {
    id: 3,
    title: "A Equação Completa",
    subtitle: "TDEE, NEAT & TEF.",
    icon: Activity,
    image: "https://images.unsplash.com/photo-1517836357463-c25dfe949ecd?auto=format&fit=crop&w=800&q=80",
    content: (
      <>
        <p className="mb-2">Não paramos no básico. Expandimos para o <strong className="text-orange-400">TDEE (Total Daily Energy Expenditure)</strong>.</p>
        <ul className="space-y-3 text-sm">
           <li className="flex gap-2">
              <span className="font-bold text-orange-400">NEAT:</span> 
              <span className="text-gray-300">Calorias que você gasta trabalhando, andando, vivendo.</span>
           </li>
           <li className="flex gap-2">
              <span className="font-bold text-orange-400">EAT:</span> 
              <span className="text-gray-300">O gasto específico dos seus treinos.</span>
           </li>
           <li className="flex gap-2">
              <span className="font-bold text-orange-400">TEF:</span> 
              <span className="text-gray-300">Energia usada para digerir o que você come.</span>
           </li>
        </ul>
      </>
    )
  },
  {
    id: 4,
    title: "MesaFit OS",
    subtitle: "Adaptação Contínua.",
    icon: BrainCircuit,
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    content: (
      <>
        <p className="mb-2">Isso não é um contador de calorias estático.</p>
        <p>O MesaFit é um <strong className="text-purple-400">Sistema Operacional Metabólico</strong>. Se sua rotina muda, o cálculo muda.</p>
        <p className="mt-3 font-bold text-white text-sm text-center">Ciência aplicada ao seu controle.</p>
      </>
    )
  }
];

export const EducationFlow: React.FC<EducationFlowProps> = ({ user, onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleFinish = async () => {
    const updatedUser = { ...user, educationComplete: true };
    await update(ref(db, `users/${user.id}/profile`), { educationComplete: true });
    onComplete(updatedUser);
  };

  const nextSlide = () => {
    if (currentSlide === slides.length - 1) {
      handleFinish();
    } else {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentSlide(prev => prev + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-[#09090b] text-white flex flex-col">
      {/* Background Image with Heavy Overlay */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/90 to-[#09090b]/40 z-10"></div>
        <img 
          src={slide.image} 
          alt="Scientific Background" 
          className={`w-full h-full object-cover transition-opacity duration-700 ease-in-out ${isTransitioning ? 'opacity-50 scale-105' : 'opacity-100 scale-100'}`}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 flex-1 flex flex-col justify-end p-2 pb-12 animate-slideUp">
        
        <div className="mb-3">
           <div className="w-6 h-6 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center mb-3 border border-white/10 text-white">
              <Icon size={24} />
           </div>
           
           <h2 className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em] mb-2">{slide.title}</h2>
           <h1 className="text-sm font-black tracking-tight leading-tight mb-3">{slide.subtitle}</h1>
           
           <div className="text-gray-300 font-medium leading-relaxed">
              {slide.content}
           </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-2 pt-6 border-t border-white/10">
           {/* Dots */}
           <div className="flex gap-2">
              {slides.map((_, idx) => (
                 <div 
                   key={idx} 
                   className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentSlide ? 'w-8 bg-white' : 'w-2 bg-white/20'}`}
                 />
              ))}
           </div>

           <div className="flex gap-2">
              <button 
                onClick={handleFinish}
                className="px-2 py-3 text-xs font-bold text-gray-500 uppercase tracking-wider hover:text-white transition-colors"
              >
                 Pular
              </button>
              <button 
                onClick={nextSlide}
                className="px-3 py-3 bg-white text-black rounded-md font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-400 transition-all active:scale-95"
              >
                 {currentSlide === slides.length - 1 ? 'Iniciar' : 'Próximo'}
                 {currentSlide === slides.length - 1 ? <ArrowRight size={16} /> : <ChevronRight size={16} />}
              </button>
           </div>
        </div>

      </div>
    </div>
  );
};
