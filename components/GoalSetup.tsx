
import React, { useState } from 'react';
import { UserData, Child, GoalType } from '../types';
import { ref, update } from "firebase/database";
import { db } from '../firebase';
import { 
  Calendar, 
  TrendingDown, 
  DollarSign, 
  Baby, 
  Plus, 
  Trash2, 
  Check,
  ArrowRight,
  Target
} from 'lucide-react';

interface GoalSetupProps {
  user: UserData;
  onComplete: (user: UserData) => void;
}

export const GoalSetup: React.FC<GoalSetupProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [months, setMonths] = useState<number>(3); // Default 3 meses
  const [income, setIncome] = useState<string>('');
  const [family, setFamily] = useState<Child[]>([]);
  const [currentChild, setCurrentChild] = useState<Partial<Child>>({});
  const [showChildForm, setShowChildForm] = useState(false);

  // Define peso alvo baseado no objetivo inicial
  const calculateTargetWeight = () => {
    if (user.primaryGoal === GoalType.WEIGHT_LOSS) return user.identity.weight * 0.9; // Perder 10%
    if (user.primaryGoal === GoalType.MUSCLE_GAIN) return user.identity.weight * 1.05; // Ganhar 5%
    return user.identity.weight; // Manter
  };

  const [targetWeight, setTargetWeight] = useState(Math.round(calculateTargetWeight()));

  // Calcula data futura baseada nos meses
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);

  const handleAddChild = () => {
    if (currentChild.name && currentChild.age) {
      setFamily([...family, { 
        id: Date.now().toString(), 
        name: currentChild.name, 
        age: currentChild.age,
        allergies: [],
        ...currentChild 
      } as Child]);
      setCurrentChild({});
      setShowChildForm(false);
    }
  };

  const calculateTDEE = () => {
    const { weight, height, age, gender } = user.identity;
    
    // 1. BMR
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;
    
    // 2. Work Factor
    const workFactor = 
      user.context.workType === 'active' ? 1.45 : 
      user.context.workType === 'standing' ? 1.3 : 
      1.2;
    
    let tdee = bmr * workFactor;

    // 3. Training Addition (Mesma lógica do Onboarding para consistência)
    if (user.context.trains) {
      const mets = user.context.trainingIntensity === 'high' ? 9 : 
                   user.context.trainingIntensity === 'medium' ? 6 : 4;
      
      const durationHours = (user.context.trainingDurationMinutes || 0) / 60;
      const caloriesPerSession = mets * weight * durationHours;
      const weeklyCalories = caloriesPerSession * (user.context.trainingFrequency || 0);
      const dailyExerciseAdd = weeklyCalories / 7;

      tdee += dailyExerciseAdd;
    }

    return Math.round(tdee);
  };

  const finishSetup = async () => {
    const tdee = calculateTDEE();
    let dailyCalories = tdee;

    // Cálculo Realista de Calorias baseado no Objetivo
    if (user.primaryGoal === GoalType.WEIGHT_LOSS) {
      // 1kg gordura ~= 7700kcal
      const weightDiff = user.identity.weight - targetWeight;
      
      if (weightDiff > 0) {
        const totalDeficitNeeded = weightDiff * 7700;
        const days = months * 30;
        const dailyDeficit = totalDeficitNeeded / days;
        
        dailyCalories = tdee - dailyDeficit;
        
        // Safety Floor (Limites de segurança)
        const minCalories = user.identity.gender === 'male' ? 1500 : 1200;
        if (dailyCalories < minCalories) dailyCalories = minCalories;
      } else {
        // Se o usuário quer perder peso mas colocou meta maior, mantemos déficit padrão
        dailyCalories = tdee - 500;
      }
    
    } else if (user.primaryGoal === GoalType.MUSCLE_GAIN) {
      // Superávit moderado
      dailyCalories = tdee + 300; 
    }

    // Arredondar
    dailyCalories = Math.round(dailyCalories);

    // Calcular Macros Baseados no Novo Objetivo Calórico
    // Proteína alta para ambos os casos principais
    let protein = Math.round(user.identity.weight * 2.0); // 2g/kg base
    let fat = Math.round((dailyCalories * 0.25) / 9); // 25% gordura
    let carbs = Math.round((dailyCalories - (protein * 4) - (fat * 9)) / 4);

    const updatedUser: UserData = {
      ...user,
      goalsSetupComplete: true,
      context: {
        ...user.context,
        monthlyIncome: Number(income),
        calorieGoal: dailyCalories,
        macros: { protein, carbs, fat },
        timeline: {
          targetDate: targetDate.getTime(),
          startWeight: user.identity.weight,
          targetWeight: Number(targetWeight),
          months
        },
        family: family
      }
    };

    await update(ref(db, `users/${user.id}/profile`), updatedUser);
    onComplete(updatedUser);
  };

  return (
    <div className="h-screen bg-white flex flex-col p-3 overflow-hidden">
      
      {/* Header Fixo */}
      <div className="mb-2 pt-4 shrink-0">
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Configuração Avançada</h2>
        <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gray-900 transition-all duration-500" style={{ width: `${(step / (user.context.hasKids ? 3 : 2)) * 100}%` }} />
        </div>
      </div>

      {step === 1 && (
        <div className="flex-1 flex flex-col animate-slideUp overflow-y-auto pb-4">
          <h1 className="text-base font-black text-gray-900 mb-2">Sua Meta</h1>
          <p className="text-gray-500 mb-2">Defina onde quer chegar e em quanto tempo.</p>

          <div className="flex-1 flex flex-col items-center justify-center space-y-2 min-h-[300px]">
            <div className="w-full bg-gray-50 p-3 rounded-[2.5rem] relative overflow-hidden">
              <div className="flex justify-between items-end mb-2">
                <div className="text-center">
                   <p className="text-xs font-bold text-gray-400 uppercase">Hoje</p>
                   <p className="text-sm font-black text-gray-900">{user.identity.weight}kg</p>
                </div>
                 <div className="text-center">
                   <p className="text-xs font-bold text-gray-400 uppercase">Em {months} meses</p>
                   {/* Input editável para o peso alvo */}
                   <div className="flex items-center justify-center gap-1 text-emerald-500">
                     <span className="text-sm font-black">~</span>
                     <input 
                        type="number"
                        value={targetWeight}
                        onChange={(e) => setTargetWeight(Number(e.target.value))}
                        className="bg-transparent text-sm font-black text-emerald-500 w-6 text-center outline-none border-b border-emerald-500/30 focus:border-emerald-500"
                     />
                     <span className="text-sm font-bold">kg</span>
                   </div>
                </div>
              </div>
              
              {/* Linha do Tempo Animada */}
              <div className="relative h-20 w-full">
                <svg className="w-full h-full overflow-visible">
                  <path 
                    d="M 10 40 Q 100 80, 280 10" 
                    fill="none" 
                    stroke="#10B981" 
                    strokeWidth="4" 
                    strokeLinecap="round" 
                    strokeDasharray="10 5"
                    className="animate-pulse"
                  />
                  <circle cx="10" cy="40" r="6" className="fill-gray-900" />
                  <circle cx="280" cy="10" r="6" className="fill-emerald-500" />
                </svg>
              </div>
            </div>

            <div className="w-full space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-4">Duração: {months} Meses</label>
              <input 
                type="range" 
                min="1" 
                max="12" 
                step="1" 
                value={months} 
                onChange={(e) => setMonths(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-gray-900"
              />
              <div className="flex justify-between text-xs font-bold text-gray-300 px-1">
                <span>Rápido (1m)</span>
                <span>Longo Prazo (12m)</span>
              </div>
            </div>

             {/* Feedback Visual da Dificuldade */}
             <div className="bg-blue-50 p-2 rounded-lg w-full text-center">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-widest mb-1">Impacto na Dieta</p>
                <p className="text-sm text-blue-600 font-medium">
                  {user.primaryGoal === GoalType.WEIGHT_LOSS 
                    ? (months < 3 ? "Restrição Calórica Alta" : "Reeducação Alimentar Equilibrada")
                    : "Superávit Controlado para Hipertrofia"
                  }
                </p>
             </div>
          </div>
          
          <button onClick={() => setStep(2)} className="mt-2 w-full py-2 bg-gray-900 text-white rounded-md font-black uppercase tracking-widest shadow-xl shrink-0">
            Confirmar Plano
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="flex-1 flex flex-col animate-slideUp overflow-y-auto pb-4">
           <h1 className="text-base font-black text-gray-900 mb-2">Financeiro</h1>
           <p className="text-gray-500 mb-2">Para sugerirmos compras e dietas que cabem no bolso. (Opcional)</p>
           
           <div className="flex-1 flex flex-col justify-center space-y-3">
              <div className="bg-emerald-50 p-2 rounded-[2.5rem] flex items-center justify-center mb-2">
                 <DollarSign size={48} className="text-emerald-600" />
              </div>

              <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-700 ml-4">Renda Mensal Aproximada (R$)</label>
                  <input
                    type="number"
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-2 py-3 bg-gray-50 rounded-md border-2 border-transparent focus:border-emerald-500 focus:bg-white transition-all outline-none text-sm font-bold text-gray-900 shadow-sm placeholder:text-gray-300"
                    placeholder="0.00"
                  />
              </div>
           </div>

           <button 
             onClick={() => user.context.hasKids ? setStep(3) : finishSetup()} 
             className="mt-2 w-full py-2 bg-gray-900 text-white rounded-md font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 shrink-0"
           >
             {user.context.hasKids ? 'Ir para Mesa Familiar' : 'Finalizar Setup'}
             <ArrowRight size={20} />
           </button>
        </div>
      )}

      {step === 3 && user.context.hasKids && (
        <div className="flex-1 flex flex-col animate-slideUp overflow-hidden">
          <div className="flex justify-between items-start mb-3 shrink-0">
             <div>
                <h1 className="text-base font-black text-gray-900 mb-2">Mesa Familiar</h1>
                <p className="text-gray-500">Cadastre seus filhos para organizar a alimentação da casa.</p>
             </div>
             <div className="bg-blue-50 p-3 rounded-lg">
                <Baby className="text-blue-500" />
             </div>
          </div>

          {/* Área de rolagem interna para a lista de filhos */}
          <div className="flex-1 overflow-y-auto space-y-2 pb-4">
            {family.map((child, idx) => (
              <div key={child.id} className="bg-white border-2 border-gray-100 p-3 rounded-md flex justify-between items-center shadow-sm">
                 <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-black">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{child.name}</p>
                      <p className="text-xs text-gray-400">{child.age} anos</p>
                    </div>
                 </div>
                 <button onClick={() => setFamily(family.filter(f => f.id !== child.id))} className="text-gray-300 hover:text-red-500">
                    <Trash2 size={18} />
                 </button>
              </div>
            ))}

            {showChildForm ? (
              <div className="bg-gray-50 p-3 rounded-[2rem] space-y-2 border-2 border-gray-200 animate-fadeIn">
                 <h3 className="text-xs font-black uppercase text-gray-400">Novo Dependente</h3>
                 <input 
                   placeholder="Nome" 
                   value={currentChild.name || ''} 
                   onChange={e => setCurrentChild({...currentChild, name: e.target.value})}
                   className="w-full p-2 rounded-lg border-none font-bold text-gray-900 bg-white"
                 />
                 <div className="grid grid-cols-2 gap-3">
                    <input 
                      type="number" 
                      placeholder="Idade" 
                      value={currentChild.age || ''} 
                      onChange={e => setCurrentChild({...currentChild, age: Number(e.target.value)})}
                      className="w-full p-2 rounded-lg border-none font-bold text-gray-900 bg-white"
                    />
                     <input 
                      placeholder="Alergias (opcional)" 
                      className="w-full p-2 rounded-lg border-none font-bold text-gray-900 bg-white"
                    />
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setShowChildForm(false)} className="flex-1 py-3 bg-white text-gray-500 font-bold rounded-md">Cancelar</button>
                    <button onClick={handleAddChild} className="flex-1 py-3 bg-gray-900 text-white font-bold rounded-md">Adicionar</button>
                 </div>
              </div>
            ) : (
              family.length < 5 && (
                <button 
                  onClick={() => setShowChildForm(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-300 rounded-[2rem] text-gray-400 font-bold flex items-center justify-center gap-2 hover:border-gray-900 hover:text-gray-900 transition-all"
                >
                  <Plus size={20} /> Adicionar Filho(a)
                </button>
              )
            )}
          </div>

          <button 
             onClick={finishSetup} 
             className="mt-2 w-full py-2 bg-emerald-500 text-white rounded-md font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 shrink-0"
           >
             Concluir & Ir para Mesa
             <Check size={20} />
           </button>
        </div>
      )}
    </div>
  );
};
