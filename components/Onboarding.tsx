
import React, { useState } from 'react';
import { UserData, GoalType } from '../types';
import { ref, set } from "firebase/database";
import { db } from '../firebase';
import { 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  Flame, 
  Leaf, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Ban,
  Dumbbell,
  Timer,
  Activity
} from 'lucide-react';

interface OnboardingProps {
  user: UserData;
  onComplete: (user: UserData) => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ user, onComplete }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<UserData>({
    ...user,
    identity: { ...user.identity, gender: 'male' }, // Default fallback
    context: { 
      ...user.context, 
      trains: false, // Default
      trainingFrequency: 3,
      trainingDurationMinutes: 60,
      trainingIntensity: 'medium'
    }
  });
  const [isAnimating, setIsAnimating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lista comum de alergias
  const commonAllergies = ["Glúten", "Lactose", "Amendoim", "Ovos", "Frutos do Mar", "Soja"];

  const toggleAllergy = (allergy: string) => {
    const current = formData.identity.allergies || [];
    const updated = current.includes(allergy)
      ? current.filter(a => a !== allergy)
      : [...current, allergy];
    setFormData({ ...formData, identity: { ...formData.identity, allergies: updated } });
  };

  const validateStep = () => {
    setError(null);
    if (step === 1) {
      if (!formData.identity.weight || !formData.identity.height || !formData.identity.age || !formData.identity.name) {
        setError("Preencha todos os dados.");
        return false;
      }
    }
    if (step === 2 && !formData.primaryGoal) {
      setError("Selecione um objetivo principal.");
      return false;
    }
    if (step === 4) {
      if (formData.context.trains) {
        if (!formData.context.trainingFrequency || !formData.context.trainingDurationMinutes) {
          setError("Informe a frequência e duração do treino.");
          return false;
        }
      }
    }
    return true;
  };

  const changeStep = (next: number) => {
    if (next > step && !validateStep()) return;
    
    setIsAnimating(true);
    setTimeout(() => {
      setStep(next);
      setIsAnimating(false);
    }, 300);
  };

  // Função auxiliar para calcular TDEE
  const calculateTDEE = (data: UserData) => {
    const { weight, height, age, gender } = data.identity;
    
    // 1. Taxa Metabólica Basal (BMR) - Mifflin-St Jeor Equation
    let bmr = (10 * weight) + (6.25 * height) - (5 * age);
    bmr += gender === 'male' ? 5 : -161;

    // 2. Fator de Atividade do Trabalho (NEAT aproximado)
    // Sitting (1.2), Standing (1.3), Active (1.45 - ajustado pois treino é separado)
    const workFactor = 
      data.context.workType === 'active' ? 1.45 : 
      data.context.workType === 'standing' ? 1.3 : 
      1.2;

    let tdee = bmr * workFactor;

    // 3. Adicional de Exercício (EAT)
    if (data.context.trains) {
      // Estimativa baseada em METs (Metabolic Equivalent of Task)
      // Low: ~4 METs, Medium: ~6 METs, High: ~9 METs
      const mets = data.context.trainingIntensity === 'high' ? 9 : 
                   data.context.trainingIntensity === 'medium' ? 6 : 4;
      
      const durationHours = (data.context.trainingDurationMinutes || 0) / 60;
      
      // Calorias por sessão = METs * Peso(kg) * Duração(h)
      const caloriesPerSession = mets * weight * durationHours;
      
      // Média diária adicionada ao TDEE
      const weeklyCalories = caloriesPerSession * (data.context.trainingFrequency || 0);
      const dailyExerciseAdd = weeklyCalories / 7;

      tdee += dailyExerciseAdd;
    }

    return Math.round(tdee);
  };

  const handleFinish = async () => {
    const tdee = calculateTDEE(formData);
    let calorieGoal = tdee;

    // Ajuste inicial grosseiro (será refinado no GoalSetup com o prazo)
    if (formData.primaryGoal === GoalType.WEIGHT_LOSS) {
      calorieGoal = tdee - 300; // Déficit leve inicial
    } else if (formData.primaryGoal === GoalType.MUSCLE_GAIN) {
      calorieGoal = tdee + 300; // Superávit
    }

    // Macros padrão iniciais (serão recalculados depois)
    const protein = Math.round(formData.identity.weight * 2); // 2g/kg
    const fat = Math.round((calorieGoal * 0.25) / 9); // 25% gordura
    const carbs = Math.round((calorieGoal - (protein * 4) - (fat * 9)) / 4); // Resto em carbo

    const finalData: UserData = { 
      ...formData, 
      onboardingComplete: true, 
      goalsSetupComplete: false, 
      reputation: 0,
      context: {
        ...formData.context,
        calorieGoal,
        macros: { protein, carbs, fat }
      }
    };
    
    await set(ref(db, `users/${user.id}/profile`), finalData);
    onComplete(finalData);
  };

  return (
    <div className="min-h-[100dvh] bg-[#F9FAFB] flex flex-col items-center justify-center p-3 sm:p-3 overflow-hidden">
      <div className="w-full max-w-xl">
        
        <div className="flex items-center justify-between mb-1 px-2">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step >= i ? 'w-6 bg-gray-900' : 'w-4 bg-gray-200'}`} />
            ))}
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">Passo {step} de 5</span>
        </div>

        <div className={`transition-all duration-300 min-h-[400px] ${isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          
          {step === 1 && (
            <div className="space-y-2">
              <div>
                <h1 className="text-sm font-extrabold text-gray-900 tracking-tight leading-tight">Quem é <span className="text-gray-400">você?</span></h1>
                <p className="text-gray-600 mt-3 text-sm">Precisamos identificar você biologicamente.</p>
              </div>

              <div className="space-y-2">
                 <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-700 ml-4">Como devemos te chamar?</label>
                  <input
                    type="text"
                    required
                    value={formData.identity.name || ''}
                    onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, name: e.target.value } })}
                    className="w-full px-2 py-3 bg-white rounded-md border-2 border-gray-100 focus:border-gray-900 transition-all outline-none text-base font-bold text-gray-900 shadow-sm placeholder:text-gray-400"
                    placeholder="Nome e Sobrenome"
                  />
                </div>

                {/* Seleção de Sexo */}
                <div className="flex gap-3">
                   <button 
                     onClick={() => setFormData({...formData, identity: {...formData.identity, gender: 'male'}})}
                     className={`flex-1 py-2 rounded-md border-2 font-bold transition-all ${formData.identity.gender === 'male' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
                   >
                     Masculino
                   </button>
                   <button 
                     onClick={() => setFormData({...formData, identity: {...formData.identity, gender: 'female'}})}
                     className={`flex-1 py-2 rounded-md border-2 font-bold transition-all ${formData.identity.gender === 'female' ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 bg-white text-gray-500 hover:border-gray-300'}`}
                   >
                     Feminino
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                   <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-700 ml-4">Idade</label>
                      <input
                        type="number"
                        required
                        value={formData.identity.age || ''}
                        onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, age: Number(e.target.value) } })}
                        className="w-full px-2 py-3 bg-white rounded-md border-2 border-gray-100 focus:border-gray-900 transition-all outline-none text-base font-bold text-gray-900 shadow-sm placeholder:text-gray-400"
                        placeholder="Anos"
                      />
                    </div>
                     <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-widest text-gray-700 ml-4">Peso (kg)</label>
                      <input
                        type="number"
                        required
                        value={formData.identity.weight || ''}
                        onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, weight: Number(e.target.value) } })}
                        className="w-full px-2 py-3 bg-white rounded-md border-2 border-gray-100 focus:border-gray-900 transition-all outline-none text-base font-bold text-gray-900 shadow-sm placeholder:text-gray-400"
                        placeholder="00.0"
                      />
                    </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-700 ml-4">Altura (cm)</label>
                  <input
                    type="number"
                    required
                    value={formData.identity.height || ''}
                    onChange={(e) => setFormData({ ...formData, identity: { ...formData.identity, height: Number(e.target.value) } })}
                    className="w-full px-2 py-3 bg-white rounded-md border-2 border-gray-100 focus:border-gray-900 transition-all outline-none text-base font-bold text-gray-900 shadow-sm placeholder:text-gray-400"
                    placeholder="170"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Qual seu <span className="text-gray-400">objetivo?</span></h1>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { type: GoalType.WEIGHT_LOSS, icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
                  { type: GoalType.MUSCLE_GAIN, icon: Zap, color: 'text-blue-500', bg: 'bg-blue-50' },
                  { type: GoalType.HEALTHY_HABITS, icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50' }
                ].map((g) => (
                  <button
                    key={g.type}
                    onClick={() => setFormData({ ...formData, primaryGoal: g.type })}
                    className={`p-3 rounded-md border-2 flex items-center gap-3 transition-all ${
                      formData.primaryGoal === g.type ? 'border-gray-900 bg-white shadow-xl' : 'border-transparent bg-white shadow-sm hover:border-gray-200'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-lg ${g.bg} flex items-center justify-center`}>
                      <g.icon className={g.color} size={28} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-900 text-sm">{g.type}</p>
                      <p className="text-xs text-gray-500">Toque para selecionar</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

           {step === 3 && (
            <div className="space-y-2">
              <div>
                <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Restrições e <span className="text-gray-400">Alergias.</span></h1>
                <p className="text-gray-600 mt-3 text-sm">Para que a Mesa nunca te sugira algo perigoso.</p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {commonAllergies.map((allergy) => (
                  <button
                    key={allergy}
                    onClick={() => toggleAllergy(allergy)}
                    className={`p-2 rounded-lg border-2 text-sm font-bold transition-all flex items-center gap-2 ${
                      formData.identity.allergies?.includes(allergy) 
                        ? 'border-red-500 bg-red-50 text-red-600' 
                        : 'border-transparent bg-white shadow-sm text-gray-500'
                    }`}
                  >
                     <Ban size={16} />
                     {allergy}
                  </button>
                ))}
              </div>
              <p className="text-xs text-center text-gray-400 font-medium">Se não tiver alergias, apenas continue.</p>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2 pb-10">
               <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Contexto de <span className="text-gray-400">Vida.</span></h1>
               
               <div className="space-y-2">
                  {/* Tipo de Trabalho */}
                  <div className="bg-white p-3 rounded-md shadow-sm border border-gray-100">
                     <p className="font-bold text-gray-900 mb-2">Como é seu dia (trabalho)?</p>
                     <div className="grid grid-cols-3 gap-2">
                        {[
                           { val: 'sitting', label: 'Sentado' }, 
                           { val: 'standing', label: 'Em Pé' }, 
                           { val: 'active', label: 'Ativo' }
                        ].map(opt => (
                           <button 
                             key={opt.val}
                             onClick={() => setFormData({...formData, context: {...formData.context, workType: opt.val as any}})}
                             className={`p-3 rounded-lg text-xs font-bold border-2 transition-all ${formData.context.workType === opt.val ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-100 text-gray-500'}`}
                           >
                              {opt.label}
                           </button>
                        ))}
                     </div>
                  </div>
                  
                  {/* Pergunta de Treino */}
                  <div 
                    className={`bg-white rounded-md shadow-sm border-2 transition-all overflow-hidden ${formData.context.trains ? 'border-gray-900' : 'border-transparent hover:border-gray-200'}`}
                  >
                     <div 
                       className="p-2 cursor-pointer flex items-center justify-between"
                       onClick={() => setFormData({...formData, context: {...formData.context, trains: !formData.context.trains}})}
                     >
                        <div className="flex items-center gap-3">
                           <div className="w-6 h-6 bg-orange-50 rounded-lg flex items-center justify-center text-orange-600">
                              <Dumbbell size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-gray-900">Você treina?</p>
                              <p className="text-xs text-gray-500">Musculação, Crossfit, Corrida...</p>
                           </div>
                        </div>
                        <div className={`w-6 h-7 rounded-full transition-all relative ${formData.context.trains ? 'bg-orange-500' : 'bg-gray-200'}`}>
                           <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.context.trains ? 'left-8' : 'left-1'}`} />
                        </div>
                     </div>

                     {/* Campos Condicionais de Treino */}
                     {formData.context.trains && (
                        <div className="px-2 pb-8 pt-0 space-y-3 animate-fadeIn">
                           <div className="h-px bg-gray-100 mb-3"></div>
                           
                           {/* Frequência */}
                           <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Frequência Semanal</p>
                              <div className="flex justify-between gap-1">
                                 {[1,2,3,4,5,6,7].map(num => (
                                    <button
                                      key={num}
                                      onClick={() => setFormData({...formData, context: {...formData.context, trainingFrequency: num}})}
                                      className={`w-6 h-6 rounded-md font-black text-sm transition-all ${formData.context.trainingFrequency === num ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-gray-50 text-gray-400'}`}
                                    >
                                       {num}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Duração */}
                           <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Duração (minutos)</p>
                              <div className="relative">
                                 <Timer className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                 <input 
                                    type="number"
                                    value={formData.context.trainingDurationMinutes}
                                    onChange={(e) => setFormData({...formData, context: {...formData.context, trainingDurationMinutes: Number(e.target.value)}})}
                                    className="w-full bg-gray-50 pl-12 pr-4 py-2 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500/20"
                                    placeholder="Ex: 60"
                                 />
                              </div>
                           </div>

                           {/* Intensidade */}
                           <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Intensidade</p>
                              <div className="grid grid-cols-3 gap-2">
                                 {[
                                    { id: 'low', label: 'Leve', desc: 'Sem suar' },
                                    { id: 'medium', label: 'Moderada', desc: 'Suor normal' },
                                    { id: 'high', label: 'Alta', desc: 'Exaustão' }
                                 ].map(lvl => (
                                    <button
                                       key={lvl.id}
                                       onClick={() => setFormData({...formData, context: {...formData.context, trainingIntensity: lvl.id as any}})}
                                       className={`p-3 rounded-lg border-2 transition-all text-left ${formData.context.trainingIntensity === lvl.id ? 'border-orange-500 bg-orange-50' : 'border-gray-100 bg-white'}`}
                                    >
                                       <span className={`block font-bold text-sm ${formData.context.trainingIntensity === lvl.id ? 'text-orange-700' : 'text-gray-700'}`}>{lvl.label}</span>
                                       <span className="text-[10px] text-gray-400">{lvl.desc}</span>
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                     )}
                  </div>

                  {/* Filhos */}
                  <div className="p-2 bg-white rounded-md shadow-sm border-2 border-transparent hover:border-gray-900 transition-all cursor-pointer flex items-center justify-between"
                        onClick={() => setFormData({...formData, context: {...formData.context, hasKids: !formData.context.hasKids}})}>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-gray-50 rounded-lg flex items-center justify-center text-gray-900">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Tem filhos?</p>
                          <p className="text-xs text-gray-500">Iremos configurar a Mesa Familiar</p>
                        </div>
                      </div>
                      <div className={`w-6 h-7 rounded-full transition-all relative ${formData.context.hasKids ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${formData.context.hasKids ? 'left-8' : 'left-1'}`} />
                      </div>
                  </div>
               </div>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-2">
              <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 size={48} />
              </div>
              <h1 className="text-sm font-extrabold text-gray-900 tracking-tight">Perfil <span className="text-emerald-500">Criado.</span></h1>
              <p className="text-gray-600 text-sm">Agora vamos calcular suas calorias e traçar o prazo.</p>
            </div>
          )}

        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 text-red-500 bg-red-50 p-2 rounded-lg animate-shake">
            <AlertCircle size={18} />
            <span className="text-xs font-bold uppercase tracking-wide">{error}</span>
          </div>
        )}

        <div className="mt-3 flex items-center gap-2">
          {step > 1 && (
            <button onClick={() => changeStep(step - 1)} className="p-3 rounded-md bg-white text-gray-900 border border-gray-100 shadow-sm hover:bg-gray-50 transition-all">
              <ArrowLeft size={24} />
            </button>
          )}
          <button 
            onClick={() => step === 5 ? handleFinish() : changeStep(step + 1)}
            className="flex-1 bg-gray-900 text-white h-20 rounded-md font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-xl shadow-gray-200"
          >
            {step === 5 ? 'Traçar Metas' : 'Continuar'}
            <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
