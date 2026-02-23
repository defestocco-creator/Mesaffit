
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { UserData, Foodlist, FoodlistMeal } from '../types';
import { db } from '../firebase';
import { ref, onValue, update, push, remove, set } from "firebase/database";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  MoreVertical, 
  Copy, 
  Save, 
  Flame, 
  Utensils,
  X,
  Check,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { LimitAlert } from './LimitAlert';

interface WeeklyPlanProps {
  user: UserData;
  onClose: () => void;
  initialFoodlist?: Foodlist;
  onClearInitialFoodlist?: () => void;
}

interface DayPlan {
  date: string; // YYYY-MM-DD
  meals: (FoodlistMeal & { time?: string })[];
  totalKcal: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const DEFAULT_TIMES = ['08:00', '12:00', '16:00', '19:00', '21:00'];

export const WeeklyPlan: React.FC<WeeklyPlanProps> = ({ user, onClose, initialFoodlist, onClearInitialFoodlist }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekPlans, setWeekPlans] = useState<Record<string, DayPlan>>({});
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [showFoodlistSelector, setShowFoodlistSelector] = useState(false);
  const [myFoodlists, setMyFoodlists] = useState<Foodlist[]>([]);
  const [selectedFoodlist, setSelectedFoodlist] = useState<Foodlist | null>(null);
  const [applyMode, setApplyMode] = useState<'day' | 'week_days' | 'full_week' | 'custom'>('day');
  const [customDays, setCustomDays] = useState<string[]>([]);
  
  useEffect(() => {
      if (initialFoodlist) {
          setSelectedFoodlist(initialFoodlist);
          const today = getLocalDateKey();
          setSelectedDay(today);
          setApplyMode('day');
          setShowFoodlistSelector(true); 
          
          if (onClearInitialFoodlist) {
              // Timeout para evitar update durante render
              setTimeout(() => onClearInitialFoodlist(), 100);
          }
      }
  }, [initialFoodlist]);
  
  // Estados para edição de horário
  const [editingTimeIndex, setEditingTimeIndex] = useState<number | null>(null);
  const [tempTime, setTempTime] = useState('');

  // Estados para conflito de Foodlist
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [pendingDates, setPendingDates] = useState<string[]>([]);
  const [limitAlert, setLimitAlert] = useState<{show: boolean, message: string}>({ show: false, message: '' });

  const getLocalDateKey = (date = new Date()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Carregar Foodlists
  useEffect(() => {
    onValue(ref(db, `users/${user.id}/foodlists`), (snap) => {
      const data = snap.val();
      setMyFoodlists(data ? Object.entries(data).map(([key, value]: any) => ({ ...value, id: key })) : []);
    });
  }, [user.id]);

  // Carregar Planejamento da Semana
  useEffect(() => {
    // Carregar logs futuros que atuam como planejamento
    // Por enquanto, vamos simular uma estrutura de planejamento separada no DB
    // `users/${user.id}/planning/${date}`
    
    const startOfWeek = getStartOfWeek(currentDate);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Listener para a semana atual
    // Na prática, ideal seria carregar por mês ou range, mas vamos simplificar
    onValue(ref(db, `users/${user.id}/planning`), (snap) => {
      const data = snap.val();
      if (data) {
        setWeekPlans(data);
      } else {
        setWeekPlans({});
      }
    });
  }, [user.id, currentDate]);

  const getStartOfWeek = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
    const start = new Date(d.setDate(diff));
    // Se for domingo, volta para a segunda anterior (ou mantém domingo se a semana começa no domingo)
    // Vamos assumir semana começando no Domingo para visualização, mas lógica de "Segunda a Sexta"
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay());
    return sunday;
  };

  const currentWeekStart = getStartOfWeek(currentDate);
  const weekDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(currentWeekStart.getDate() + i);
    return d;
  });

  const formatDateKey = (date: Date) => {
    return getLocalDateKey(date);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const initiateApplyFoodlist = () => {
    if (!selectedFoodlist) return;

    const datesToApply: string[] = [];
    const start = getStartOfWeek(currentDate);

    if (applyMode === 'day' && selectedDay) {
      datesToApply.push(selectedDay);
    } else if (applyMode === 'week_days') {
      for (let i = 1; i <= 5; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        datesToApply.push(formatDateKey(d));
      }
    } else if (applyMode === 'full_week') {
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        datesToApply.push(formatDateKey(d));
      }
    } else if (applyMode === 'custom') {
      datesToApply.push(...customDays);
    }

    // Verificar conflitos
    const hasConflict = datesToApply.some(date => weekPlans[date]?.meals?.length > 0);

    if (hasConflict) {
        setPendingDates(datesToApply);
        setShowConflictModal(true);
    } else {
        executeApply(datesToApply, 'replace');
    }
  };

  const executeApply = async (dates: string[], mode: 'replace' | 'stack') => {
    if (!selectedFoodlist) return;

    const updates: any = {};
    let limitExceeded = false;
    
    dates.forEach(dateKey => {
      if (limitExceeded) return;

      let existingMeals: (FoodlistMeal & { time?: string })[] = [];
      
      if (mode === 'stack' && weekPlans[dateKey]?.meals) {
          existingMeals = [...weekPlans[dateKey].meals];
      }

      // Verificar limite de 24 refeições por dia
      if (existingMeals.length + selectedFoodlist.meals.length > 24) {
          limitExceeded = true;
          return;
      }

      // Cria novas refeições com horários sequenciais baseados no que já existe
      const startIndex = existingMeals.length;
      const newMeals = selectedFoodlist.meals.map((m, idx) => ({
        ...m, 
        id: Date.now() + Math.random().toString(),
        time: DEFAULT_TIMES[startIndex + idx] || '22:00' // Horários sequenciais ou final do dia
      }));
      
      const finalMeals = [...existingMeals, ...newMeals];
      
      // Ordenar por horário
      finalMeals.sort((a, b) => (a.time || '00:00').localeCompare(b.time || '00:00'));

      const dayStats = finalMeals.reduce((acc, m) => ({
        totalKcal: acc.totalKcal + m.kcal,
        totalProtein: acc.totalProtein + (m.protein || 0),
        totalCarbs: acc.totalCarbs + (m.carbs || 0),
        totalFat: acc.totalFat + (m.fat || 0),
      }), { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

      updates[`users/${user.id}/planning/${dateKey}`] = {
        date: dateKey,
        meals: finalMeals,
        ...dayStats
      };
    });

    if (limitExceeded) {
        setLimitAlert({ show: true, message: "Limite de 24 refeições por dia atingido! Não é possível adicionar mais refeições." });
        return;
    }

    await update(ref(db), updates);
    setShowFoodlistSelector(false);
    setSelectedFoodlist(null);
    setApplyMode('day');
    setCustomDays([]);
    setShowConflictModal(false);
    setPendingDates([]);
  };

  const removeMealFromDay = async (dateKey: string, mealIndex: number) => {
    const dayPlan = weekPlans[dateKey];
    if (!dayPlan) return;

    const newMeals = [...dayPlan.meals];
    newMeals.splice(mealIndex, 1);

    const newStats = newMeals.reduce((acc, m) => ({
        totalKcal: acc.totalKcal + m.kcal,
        totalProtein: acc.totalProtein + (m.protein || 0),
        totalCarbs: acc.totalCarbs + (m.carbs || 0),
        totalFat: acc.totalFat + (m.fat || 0),
      }), { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });

    if (newMeals.length === 0) {
        await remove(ref(db, `users/${user.id}/planning/${dateKey}`));
    } else {
        await update(ref(db, `users/${user.id}/planning/${dateKey}`), {
            meals: newMeals,
            ...newStats
        });
    }
  };

  const updateMealTime = async (dateKey: string, mealIndex: number, newTime: string) => {
    const dayPlan = weekPlans[dateKey];
    if (!dayPlan) return;

    const newMeals = [...dayPlan.meals];
    newMeals[mealIndex] = { ...newMeals[mealIndex], time: newTime };
    
    // Ordenar refeições por horário
    newMeals.sort((a, b) => {
        const timeA = a.time || '00:00';
        const timeB = b.time || '00:00';
        return timeA.localeCompare(timeB);
    });

    await set(ref(db, `users/${user.id}/planning/${dateKey}/meals`), newMeals);
    setEditingTimeIndex(null);
  };

  // Cálculos da Semana
  const weekStats = weekDates.reduce((acc, date) => {
    const key = formatDateKey(date);
    const plan = weekPlans[key];
    if (plan) {
        acc.totalKcal += plan.totalKcal;
        acc.totalProtein += plan.totalProtein;
        acc.totalCarbs += plan.totalCarbs;
        acc.totalFat += plan.totalFat;
        acc.daysWithPlan += 1;
    }
    return acc;
  }, { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0, daysWithPlan: 0 });

  const avgKcal = weekStats.daysWithPlan > 0 ? Math.round(weekStats.totalKcal / weekStats.daysWithPlan) : 0;
  const kcalDiff = avgKcal > 0 ? Math.round(((avgKcal - user.context.calorieGoal) / user.context.calorieGoal) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-[#09090b] text-white flex flex-col animate-fadeIn pb-24">
      {limitAlert.show && <LimitAlert message={limitAlert.message} onClose={() => setLimitAlert({ show: false, message: '' })} />}
      {/* Header */}
      <div className="px-2 pt-6 pb-4 bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-30 border-b border-white/5">
        <div className="flex justify-between items-start mb-3">
            <div>
                <h1 className="text-lg font-black text-white tracking-tight">Planejar Semana</h1>
                <p className="text-xs font-medium text-gray-500 mt-0.5">Organize sua alimentação antes que a semana comece.</p>
            </div>
            <button onClick={onClose} className="p-1.5 bg-zinc-900 rounded-full text-gray-400 hover:text-white border border-white/5">
                <X size={18} />
            </button>
        </div>

        <div className="flex items-center justify-between bg-[#18181b] p-1.5 rounded-md border border-white/5">
            <button onClick={handlePrevWeek} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"><ChevronLeft size={18} /></button>
            <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-emerald-500" />
                <span className="text-xs font-bold text-white">
                    {currentWeekStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </span>
            </div>
            <button onClick={handleNextWeek} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* Visão Semanal */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="grid grid-cols-7 gap-1 mb-3">
            {weekDates.map((date, i) => {
                const key = formatDateKey(date);
                const plan = weekPlans[key];
                const isSelected = selectedDay === key;
                const isToday = key === formatDateKey(new Date());
                
                return (
                    <div 
                        key={key}
                        onClick={() => setSelectedDay(key)}
                        className={`flex flex-col items-center gap-1.5 p-2 rounded-xl cursor-pointer transition-all border ${
                            isSelected 
                                ? 'bg-emerald-500/10 border-emerald-500' 
                                : 'bg-[#18181b] border-white/5 hover:border-white/20'
                        }`}
                    >
                        <span className="text-[10px] font-black uppercase text-gray-500">{WEEK_DAYS[date.getDay()]}</span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isToday ? 'bg-white text-black' : 'text-white'}`}>
                            {date.getDate()}
                        </div>
                        
                        {plan ? (
                            <div className="flex flex-col items-center gap-1 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${plan.totalKcal > user.context.calorieGoal * 1.1 ? 'bg-red-500' : plan.totalKcal < user.context.calorieGoal * 0.9 ? 'bg-yellow-500' : 'bg-emerald-500'}`} />
                                <span className="text-[9px] font-bold text-gray-400">{Math.round(plan.totalKcal/1000)}k</span>
                            </div>
                        ) : (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-800 mt-2" />
                        )}
                    </div>
                );
            })}
        </div>

        {/* Detalhes do Dia Selecionado */}
        {selectedDay ? (
            <div className="animate-slideUp">
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-black text-white capitalize">
                        {new Date(selectedDay + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' })}
                    </h2>
                    <button 
                        onClick={() => setShowFoodlistSelector(true)}
                        className="px-4 py-2 bg-emerald-500 text-black rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-1.5 hover:scale-105 transition-transform"
                    >
                        <Plus size={14} /> Aplicar Foodlist
                    </button>
                </div>

                {weekPlans[selectedDay] ? (
                    <div className="space-y-3">
                        {/* Resumo do Dia */}
                        <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Energia Planejada</span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-xl font-black text-white">{weekPlans[selectedDay].totalKcal}</span>
                                    <span className="text-xs font-bold text-gray-500">kcal</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-blue-500 uppercase">Prot</span>
                                    <span className="text-sm font-bold text-white">{weekPlans[selectedDay].totalProtein}g</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-emerald-500 uppercase">Carb</span>
                                    <span className="text-sm font-bold text-white">{weekPlans[selectedDay].totalCarbs}g</span>
                                </div>
                                <div className="text-center">
                                    <span className="block text-[10px] font-black text-yellow-500 uppercase">Gord</span>
                                    <span className="text-sm font-bold text-white">{weekPlans[selectedDay].totalFat}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Lista de Refeições */}
                        <div className="space-y-3">
                            {weekPlans[selectedDay].meals.map((meal, idx) => (
                                <div key={meal.id || idx} className={`p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                                    (meal as any).consumed ? 'bg-emerald-500/5 border-emerald-500/20 opacity-80' : 'bg-[#18181b] border-white/5'
                                }`}>
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                        {/* Horário Editável */}
                                        <div 
                                            className="w-12 shrink-0 cursor-pointer"
                                            onClick={() => {
                                                setEditingTimeIndex(idx);
                                                setTempTime(meal.time || DEFAULT_TIMES[idx] || '12:00');
                                            }}
                                        >
                                            {editingTimeIndex === idx ? (
                                                <input 
                                                    type="time"
                                                    value={tempTime}
                                                    onChange={(e) => setTempTime(e.target.value)}
                                                    onBlur={() => updateMealTime(selectedDay, idx, tempTime)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') updateMealTime(selectedDay, idx, tempTime);
                                                        if (e.key === 'Escape') setEditingTimeIndex(null);
                                                    }}
                                                    autoFocus
                                                    className="w-full bg-white/10 text-white text-xs font-bold rounded-lg p-1.5 outline-none border border-emerald-500"
                                                />
                                            ) : (
                                                <div className="text-xs font-black text-gray-500 hover:text-emerald-500 transition-colors flex items-center gap-1">
                                                    <Clock size={10} />
                                                    {meal.time || DEFAULT_TIMES[idx] || '--:--'}
                                                </div>
                                            )}
                                        </div>

                                        {/* Imagem da Refeição */}
                                        <div className="w-12 h-12 bg-black rounded-xl overflow-hidden shrink-0 border border-white/5 relative">
                                            {(meal as any).image ? (
                                                <img src={(meal as any).image} className="w-full h-full object-cover" alt="" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-700">
                                                    <Utensils size={20} />
                                                </div>
                                            )}
                                            {(meal as any).consumed && (
                                                <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                                    <CheckCircle2 size={24} className="text-emerald-500" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-white text-base truncate">{meal.description}</p>
                                                {(meal as any).consumed && <span className="text-[8px] font-black bg-emerald-500 text-black px-1.5 py-0.5 rounded uppercase tracking-widest">Consumido</span>}
                                            </div>
                                            <p className="text-xs text-gray-500 font-bold uppercase tracking-tight">
                                                <span className="text-emerald-500">{meal.kcal} kcal</span> • P: {meal.protein}g • C: {meal.carbs}g • G: {meal.fat}g
                                            </p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => removeMealFromDay(selectedDay, idx)}
                                        className="p-2.5 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="py-2 flex flex-col items-center justify-center text-center border-2 border-dashed border-white/5 rounded-md">
                        <Utensils size={32} className="text-gray-600 mb-2" />
                        <p className="text-gray-400 font-bold text-sm">Dia livre.</p>
                        <p className="text-gray-600 text-xs mt-1 max-w-[200px]">Nenhuma refeição planejada para este dia.</p>
                        <button 
                            onClick={() => setShowFoodlistSelector(true)}
                            className="mt-2 text-emerald-500 font-bold text-xs uppercase tracking-widest hover:underline"
                        >
                            Aplicar Foodlist
                        </button>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center opacity-50">
                <CalendarIcon size={48} className="text-gray-600 mb-2" />
                <p className="text-gray-400 font-bold">Selecione um dia</p>
                <p className="text-gray-600 text-xs mt-1">Toque nos dias acima para ver ou editar.</p>
            </div>
        )}

        {/* Projeção da Semana */}
        {weekStats.daysWithPlan > 0 && (
            <div className="mt-6 pt-8 border-t border-white/5">
                <h3 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-4">Projeção da Semana</h3>
                
                <div className="bg-[#18181b] p-5 rounded-3xl border border-white/5 relative overflow-hidden">
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xl font-black text-white mb-1">{avgKcal}</p>
                            <p className="text-sm font-bold text-gray-500 uppercase">Média Diária (kcal)</p>
                        </div>
                        <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase ${Math.abs(kcalDiff) > 15 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                            {kcalDiff > 0 ? `+${kcalDiff}% da meta` : `${kcalDiff}% da meta`}
                        </div>
                    </div>

                    {Math.abs(kcalDiff) > 15 && (
                        <div className="mt-4 flex items-center gap-3 text-red-400 text-sm font-bold bg-red-500/5 p-4 rounded-2xl border border-red-500/10">
                            <AlertTriangle size={18} />
                            <span>Atenção: Sua semana está {kcalDiff > 0 ? 'acima' : 'abaixo'} da meta.</span>
                        </div>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Modal Seleção de Foodlist */}
      {showFoodlistSelector && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-2 animate-fadeIn">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowFoodlistSelector(false)}></div>
            <div className="relative bg-[#18181b] w-full max-w-sm sm:rounded-md rounded-t-3xl p-3 shadow-2xl border-t sm:border border-white/10 max-h-[90vh] flex flex-col animate-slideUp">
                
                {!selectedFoodlist ? (
                    <>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-sm font-black text-white">Escolher Foodlist</h3>
                            <button onClick={() => setShowFoodlistSelector(false)} className="p-1.5 bg-white/5 rounded-full"><X size={18} /></button>
                        </div>
                        
                        {myFoodlists.length > 0 ? (
                            <div className="space-y-3 overflow-y-auto pb-8">
                                {myFoodlists.map(list => (
                                    <div 
                                        key={list.id} 
                                        onClick={() => setSelectedFoodlist(list)}
                                        className="p-2 bg-black/40 rounded-lg border border-white/5 flex items-center gap-2 cursor-pointer hover:bg-white/5 transition-all active:scale-95"
                                    >
                                        <div className={`w-6 h-6 rounded-md ${list.coverGradient || 'bg-zinc-800'} flex items-center justify-center shrink-0`}>
                                            <Utensils size={20} className="text-white/50" />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-bold text-white text-sm">{list.name}</h4>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">{list.meals.length} refeições • {list.stats.totalKcal} kcal</p>
                                        </div>
                                        <ChevronRight size={16} className="text-gray-600" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-2 text-center">
                                <p className="text-gray-500 font-bold text-sm">Nenhuma Foodlist encontrada.</p>
                                <button onClick={onClose} className="mt-2 text-emerald-500 font-bold text-xs uppercase">Criar na Biblioteca</button>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        <div className="flex items-center gap-2 mb-3">
                            <button onClick={() => setSelectedFoodlist(null)} className="p-2 bg-white/5 rounded-full"><ChevronLeft size={20} /></button>
                            <h3 className="text-base font-black text-white">Aplicar "{selectedFoodlist.name}"</h3>
                        </div>

                        <div className="space-y-2 mb-2">
                            <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${applyMode === 'day' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/20 border-white/5'}`}>
                                <input type="radio" name="applyMode" checked={applyMode === 'day'} onChange={() => setApplyMode('day')} className="hidden" />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applyMode === 'day' ? 'border-emerald-500' : 'border-gray-600'}`}>
                                    {applyMode === 'day' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-bold text-white">Apenas neste dia ({new Date(selectedDay!).getDate()}/{new Date(selectedDay!).getMonth()+1})</span>
                            </label>

                            <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${applyMode === 'week_days' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/20 border-white/5'}`}>
                                <input type="radio" name="applyMode" checked={applyMode === 'week_days'} onChange={() => setApplyMode('week_days')} className="hidden" />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applyMode === 'week_days' ? 'border-emerald-500' : 'border-gray-600'}`}>
                                    {applyMode === 'week_days' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-bold text-white">Segunda a Sexta</span>
                            </label>

                            <label className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${applyMode === 'full_week' ? 'bg-emerald-500/10 border-emerald-500' : 'bg-black/20 border-white/5'}`}>
                                <input type="radio" name="applyMode" checked={applyMode === 'full_week'} onChange={() => setApplyMode('full_week')} className="hidden" />
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${applyMode === 'full_week' ? 'border-emerald-500' : 'border-gray-600'}`}>
                                    {applyMode === 'full_week' && <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />}
                                </div>
                                <span className="text-sm font-bold text-white">Semana Inteira</span>
                            </label>
                        </div>

                        <button 
                            onClick={initiateApplyFoodlist}
                            className="w-full py-2 bg-emerald-500 text-black rounded-lg font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Confirmar Planejamento
                        </button>
                    </>
                )}
            </div>
        </div>,
        document.body
      )}

      {/* Modal de Conflito */}
      {showConflictModal && createPortal(
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 animate-fadeIn">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowConflictModal(false)}></div>
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-2 border border-white/10 shadow-2xl animate-slideUp">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center text-yellow-500">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">Dias já planejados</h3>
                        <p className="text-sm text-gray-500 font-medium mt-2">Alguns dias já possuem refeições. O que deseja fazer?</p>
                    </div>
                    <div className="w-full space-y-3">
                        <button 
                            onClick={() => executeApply(pendingDates, 'replace')} 
                            className="w-full py-2 bg-red-500/10 text-red-500 rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
                        >
                            Substituir Tudo
                        </button>
                        <button 
                            onClick={() => executeApply(pendingDates, 'stack')} 
                            className="w-full py-2 bg-emerald-500 text-black rounded-lg font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors"
                        >
                            Empilhar (Adicionar)
                        </button>
                        <button 
                            onClick={() => setShowConflictModal(false)} 
                            className="w-full py-2 bg-white/5 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
      )}
    </div>
  );
};
