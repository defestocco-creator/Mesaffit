
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ref, push, onValue, off, update, remove } from "firebase/database";
import { db } from '../firebase';
import { UserData, LogEntry } from '../types';
import { RegisterModal } from './RegisterModal';
import { Profile } from './Profile';
import { Stats } from './Stats';
import { Library } from './Library';
import { WeeklyPlan } from './WeeklyPlan';
import { 
  Plus, 
  Home, 
  PieChart, 
  Settings, 
  Flame,
  User as UserIcon,
  Trophy,
  Maximize2,
  X,
  Trash2,
  Clock,
  ChevronRight,
  Calendar as CalendarIcon,
  Activity,
  Edit2,
  Save,
  Utensils,
  Compass,
  BookOpen,
  Bookmark,
  Globe,
  Library as LibraryIcon,
  Camera,
  Droplets,
  CheckCircle2
} from 'lucide-react';

interface MesaProps {
  user: UserData;
  onLogout: () => void;
}

export const Mesa: React.FC<MesaProps> = ({ user, onLogout }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [registerInitialData, setRegisterInitialData] = useState<any>(null); // Estado para dados pré-preenchidos
  const [preSelectedFoodlist, setPreSelectedFoodlist] = useState<any>(null); // Foodlist pré-selecionada para planejamento
  const [todayPlan, setTodayPlan] = useState<any>(null);

  // Drag to scroll logic
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Scroll speed
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const getLocalDateKey = (date = new Date()) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  const [activeTab, setActiveTab] = useState('home');
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isExpandedView, setIsExpandedView] = useState(false);
  
  // Estado para controlar a data visualizada na Home
  const [viewDate, setViewDate] = useState(new Date());

  // Estados para Edição/Detalhes
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [isEditingLog, setIsEditingLog] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', kcal: 0, protein: 0, carbs: 0, fat: 0, amount: 0 });

  const [registerMode, setRegisterMode] = useState<'log' | 'create_only'>('log');
  const [registerInitialView, setRegisterInitialView] = useState<'form' | 'camera'>('form');
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showWaterModal, setShowWaterModal] = useState(false);
  const [waterAmount, setWaterAmount] = useState('250');

  const firstName = user.identity.name ? user.identity.name.split(' ')[0] : 'Visitante';

  useEffect(() => {
    const logsRef = ref(db, `users/${user.id}/logs`);
    const unsubscribe = onValue(logsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setLogs(Object.keys(data).map(key => ({ id: key, ...data[key] })).sort((a, b) => b.timestamp - a.timestamp));
      } else {
        setLogs([]);
      }
    });
    
    const today = new Date().toDateString();
    if (user.lastCheckIn && new Date(user.lastCheckIn).toDateString() === today) {
      setIsCheckedIn(true);
    }

    // Carregar planejamento de hoje
    const todayKey = getLocalDateKey();
    const planningRef = ref(db, `users/${user.id}/planning/${todayKey}`);
    const unsubscribePlanning = onValue(planningRef, (snapshot) => {
      setTodayPlan(snapshot.val());
    });

    // Listener para disparo de notificações via Firebase
    const notificationRef = ref(db, `users/${user.id}/profile/notificationDispar`);
    const unsubscribeNotification = onValue(notificationRef, async (snapshot) => {
      if (snapshot.val() === true) {
        // Buscar planejamento de hoje
        const todayKey = getLocalDateKey();
        const planningRef = ref(db, `users/${user.id}/planning/${todayKey}`);
        
        // Usar once() aqui seria ideal, mas como estamos dentro de um onValue, vamos ler o estado atual ou buscar
        // Como o todayPlan já está no estado, podemos tentar usá-lo, mas ele pode não estar atualizado dentro deste callback closure se não estiver nas dependências.
        // Melhor buscar diretamente do snapshot ou usar uma ref separada se quisermos garantir dados frescos sem depender do estado.
        // Vamos ler o planejamento diretamente para garantir.
        
        // Pequeno hack: ler o planejamento atual via onValue unique
        onValue(planningRef, (planSnap) => {
          const plan = planSnap.val();
          let notificationBody = "Hora de se hidratar! 💧";
          let notificationIcon = "/favicon.ico";

          if (plan && plan.meals && plan.meals.length > 0) {
            // Filtrar refeições não consumidas
            const pendingMeals = plan.meals.filter((m: any) => !m.consumed);
            
            if (pendingMeals.length > 0) {
              // Pegar uma aleatória
              const randomMeal = pendingMeals[Math.floor(Math.random() * pendingMeals.length)];
              notificationBody = `Hora da refeição: ${randomMeal.description} 🍽️`;
            } else {
              notificationBody = "Você completou todas as refeições de hoje! 🎉";
            }
          }

          // Disparar notificação
          if (Notification.permission === 'granted') {
            new Notification("MesaFit Lembrete", {
              body: notificationBody,
              icon: notificationIcon
            });
          }

          // Resetar a flag no Firebase
          update(ref(db, `users/${user.id}/profile`), {
            notificationDispar: false
          });
        }, { onlyOnce: true });
      }
    });

    return () => {
      off(logsRef);
      unsubscribePlanning();
      off(notificationRef);
    };
  }, [user.id, user.lastCheckIn]);

  const handleCheckIn = async () => {
    if (isCheckedIn) return;
    const today = Date.now();
    const newReputation = (user.reputation || 0) + 10;
    
    await update(ref(db, `users/${user.id}/profile`), {
      reputation: newReputation,
      lastCheckIn: today
    });
    
    await push(ref(db, `users/${user.id}/logs`), {
      timestamp: today,
      type: 'checkin',
      value: { description: 'Check-in Diário' }
    });
    
    setIsCheckedIn(true);
  };

  const handleSaveWater = async () => {
    const amount = Number(waterAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    await push(ref(db, `users/${user.id}/logs`), { 
      timestamp: Date.now(), 
      type: 'water', 
      value: { amount, description: 'Água' } 
    });
    
    setShowWaterModal(false);
    setWaterAmount('250');
  };

  const deleteLog = async (logId: string) => {
    if(window.confirm("Apagar registro permanentemente?")) {
      await remove(ref(db, `users/${user.id}/logs/${logId}`));
      if (selectedLog?.id === logId) {
        setSelectedLog(null);
      }
    }
  };

  const handleLogClick = (log: LogEntry) => {
    if (log.type === 'checkin') return; 
    
    setSelectedLog(log);
    setEditForm({
      description: log.value.description || '',
      kcal: log.value.kcal || 0,
      protein: log.value.protein || 0,
      carbs: log.value.carbs || 0,
      fat: log.value.fat || 0,
      amount: log.value.amount || 0
    });
    setIsEditingLog(false);
  };

  const handleUpdateLog = async () => {
    if (!selectedLog) return;
    
    const updateData: any = {
      description: editForm.description,
    };

    if (selectedLog.type === 'water') {
      updateData.amount = Number(editForm.amount);
    } else {
      updateData.kcal = Number(editForm.kcal);
      updateData.protein = Number(editForm.protein);
      updateData.carbs = Number(editForm.carbs);
      updateData.fat = Number(editForm.fat);
    }

    await update(ref(db, `users/${user.id}/logs/${selectedLog.id}/value`), updateData);
    
    setSelectedLog(null);
    setIsEditingLog(false);
  };

  const handleConsumePlannedMeal = async (meal: any, index: number) => {
    // 1. Abrir modal de registro com os dados da refeição planejada
    setRegisterInitialData({
      ...meal,
      plannedIndex: index, // Passar o índice para marcar como consumido depois
      plannedDate: getLocalDateKey()
    });
    setShowRegister(true);
  };

  const stats = useMemo(() => {
    // Filtra logs baseados na data selecionada (viewDate)
    const targetDateStr = viewDate.toDateString();
    const targetLogs = logs.filter(l => new Date(l.timestamp).toDateString() === targetDateStr);
    
    const consumed = targetLogs.reduce((acc, l) => acc + (l.value.kcal || 0), 0);
    const protein = targetLogs.reduce((acc, l) => acc + (l.value.protein || 0), 0);
    const carbs = targetLogs.reduce((acc, l) => acc + (l.value.carbs || 0), 0);
    const fat = targetLogs.reduce((acc, l) => acc + (l.value.fat || 0), 0);
    const water = targetLogs.reduce((acc, l) => l.type === 'water' ? acc + (l.value.amount || 0) : acc, 0);
    
    // Timeline específica do dia selecionado
    const timeline = [...targetLogs].sort((a, b) => a.timestamp - b.timestamp);

    // Checkins são globais para renderizar as bolinhas corretamente independente do dia selecionado
    const checkInDates = new Set(
      logs
        .filter(l => l.type === 'checkin')
        .map(l => new Date(l.timestamp).toDateString())
    );

    return { consumed, protein, carbs, fat, water, history: targetLogs, timeline, checkInDates };
  }, [logs, viewDate]);

  const caloriePercentage = Math.min((stats.consumed / user.context.calorieGoal) * 100, 100);

  const currentWeekDays = useMemo(() => {
    const today = new Date();
    const currentDay = today.getDay(); 
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - currentDay);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, []);

  const weekDayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Função para formatar o título da data
  const getDateLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (viewDate.toDateString() === today.toDateString()) return 'Hoje';
    if (viewDate.toDateString() === yesterday.toDateString()) return 'Ontem';
    return viewDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' });
  };

  // --- RENDERIZADORES DE TAB ---

  if (activeTab === 'profile') {
    return (
      <div className="min-h-screen bg-[#09090b] text-white pb-32">
         <div className="max-w-lg mx-auto h-full">
            <Profile user={user} onLogout={onLogout} />
         </div>
         <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onRegister={() => setShowRegister(true)} />
      </div>
    )
  }

  if (activeTab === 'stats') {
    return (
      <div className="min-h-screen bg-[#09090b] text-white">
        <Stats user={user} logs={logs} />
        <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onRegister={() => setShowRegister(true)} />
      </div>
    );
  }
  
  if (activeTab === 'library') {
      return (
          <div className="min-h-screen bg-[#09090b] text-white pb-32">
              <Library 
                user={user} 
                onClose={() => setActiveTab('home')} 
                onAddLog={(item) => {
                  setRegisterInitialData(item);
                  setShowRegister(true);
                  setActiveTab('home');
                }}
                onNavigateToWeeklyPlan={(foodlist) => {
                    setPreSelectedFoodlist(foodlist);
                    setActiveTab('plan');
                }}
              />
              <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onRegister={() => setShowRegister(true)} />
          </div>
      )
  }

  if (activeTab === 'plan') {
    return (
      <div className="min-h-screen bg-[#09090b] text-white pb-32">
         <WeeklyPlan 
            user={user} 
            onClose={() => setActiveTab('home')} 
            initialFoodlist={preSelectedFoodlist}
            onClearInitialFoodlist={() => setPreSelectedFoodlist(null)}
         />
         <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onRegister={() => setShowRegister(true)} />
      </div>
    )
  }

  // --- TAB HOME PRINCIPAL (Mesa) ---

  return (
    <div className="min-h-screen bg-[#09090b] text-white pb-32 font-sans overflow-x-hidden">
      
      {/* Header Responsivo */}
      <header className="w-full max-w-7xl mx-auto px-6 pt-8 pb-3 flex justify-between items-center sticky top-0 z-40 bg-[#09090b]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-white/5 overflow-hidden">
            {user.identity.photoURL ? (
              <img src={user.identity.photoURL} className="w-full h-full object-cover" />
            ) : (
              <span className="text-black text-sm font-black tracking-tighter">MF</span>
            )}
          </div>
          <div>
            <h1 className="text-lg font-black text-white leading-none">MesaFit</h1>
            <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-0.5">
              {firstName}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#18181b] px-3 py-1.5 rounded-full border border-white/5">
           <Trophy size={14} className="text-amber-400" />
           <span className="text-xs font-black text-gray-300">{user.reputation || 0} RP</span>
        </div>
      </header>

      {/* Main Container Híbrido: Mobile Stack | Desktop Grid */}
      <main className="px-6 mt-6 w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* --- LEFT COLUMN (Desktop: 5/12) - CONTROLES & STATUS --- */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
              {/* Check-in Logic */}
              {!isCheckedIn ? (
                <div className="glass-panel rounded-2xl p-5 text-white relative overflow-hidden animate-slideUp">
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-base">Check-in Diário</h3>
                      <p className="text-xs text-gray-400 font-medium mt-0.5">Mantenha a chama acesa.</p>
                    </div>
                    <button 
                      onClick={handleCheckIn}
                      className="px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest bg-white text-black hover:scale-105 active:scale-95 transition-all"
                    >
                      Check-in
                    </button>
                  </div>
                </div>
              ) : (
                <div className="glass-panel rounded-2xl p-5 animate-slideUp">
                  
                  {/* NEW EXPLORE BUTTONS ROW */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                     <button 
                        onClick={() => { setActiveTab('library'); }}
                        className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all p-3 rounded-2xl border border-white/5 flex flex-col justify-between h-24 group relative overflow-hidden"
                     >
                        <div className="absolute top-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity">
                           <ChevronRight size={12} className="text-gray-500 group-hover:text-emerald-500" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-1">
                           <Globe size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 leading-tight text-left">Explorar</span>
                     </button>

                     <button 
                        onClick={() => { setActiveTab('library'); }}
                        className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all p-3 rounded-2xl border border-white/5 flex flex-col justify-between h-24 group relative overflow-hidden"
                     >
                        <div className="absolute top-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity">
                           <ChevronRight size={12} className="text-gray-500 group-hover:text-blue-500" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-1">
                           <LibraryIcon size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 leading-tight text-left">Minhas Foodlists</span>
                     </button>

                     <button 
                        onClick={() => setActiveTab('plan')}
                        className="bg-white/5 hover:bg-white/10 active:scale-95 transition-all p-3 rounded-2xl border border-white/5 flex flex-col justify-between h-24 group relative overflow-hidden"
                     >
                        <div className="absolute top-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity">
                           <ChevronRight size={12} className="text-gray-500 group-hover:text-purple-500" />
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-1">
                           <CalendarIcon size={16} />
                        </div>
                        <span className="text-[10px] font-bold text-gray-300 leading-tight text-left">Planejar Semana</span>
                     </button>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Essa Semana</h3>
                      <button 
                        onClick={() => setActiveTab('stats')}
                        className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 transition-colors uppercase tracking-wider"
                      >
                        Ver Mês <ChevronRight size={12} />
                      </button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                      {currentWeekDays.map((date, idx) => {
                        const isDone = stats.checkInDates.has(date.toDateString());
                        const isToday = date.toDateString() === new Date().toDateString();
                        const isSelected = date.toDateString() === viewDate.toDateString();
                        
                        return (
                          <div 
                            key={idx} 
                            className="flex flex-col items-center gap-1.5 cursor-pointer group"
                            onClick={() => setViewDate(date)}
                          >
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all relative ${
                                  isDone 
                                  ? 'bg-amber-400 border-amber-400 text-black shadow-[0_0_10px_rgba(251,191,36,0.4)]' 
                                  : 'bg-transparent border-white/10 border-dashed text-gray-600'
                                }`}
                              >
                                {isSelected && (
                                   <div className="absolute -inset-1 rounded-full border-2 border-emerald-500 animate-pulse"></div>
                                )}
                                {isDone ? <Flame size={12} fill="currentColor" /> : <div className="w-1 h-1 bg-gray-700 rounded-full" />}
                              </div>
                              <div className="text-center group-hover:scale-110 transition-transform">
                                <p className={`text-[9px] font-black uppercase ${isToday ? 'text-white' : 'text-gray-600'}`}>{weekDayLetters[idx]}</p>
                                <p className={`text-[9px] font-bold ${isSelected ? 'text-emerald-500' : 'text-gray-500'}`}>{date.getDate()}</p>
                              </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Calorias Circular */}
              <div className="glass-panel p-5 rounded-3xl relative overflow-hidden transition-all">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 transition-all">
                      {getDateLabel()}
                    </span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black text-white tracking-tighter leading-none">{stats.consumed}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="h-1 w-12 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${caloriePercentage}%` }}></div>
                      </div>
                      <span className="text-[10px] font-bold text-gray-500">de {user.context.calorieGoal} kcal</span>
                    </div>
                  </div>
                  
                  <div className="relative w-20 h-20 shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                      <circle cx="56" cy="56" r="46" stroke="#27272a" strokeWidth="8" fill="transparent" />
                      <circle 
                        cx="56" cy="56" r="46" 
                        stroke="#10b981" 
                        strokeWidth="8" 
                        fill="transparent" 
                        strokeDasharray={289} 
                        strokeDashoffset={289 - (289 * caloriePercentage) / 100} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out" 
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <Flame size={20} className="text-white fill-white" />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-3 mt-6 pt-4 border-t border-white/5">
                  {[
                    { label: 'Prot.', val: stats.protein, max: user.context.macros.protein, color: 'bg-blue-500', unit: 'g' },
                    { label: 'Carb.', val: stats.carbs, max: user.context.macros.carbs, color: 'bg-emerald-500', unit: 'g' },
                    { label: 'Gord.', val: stats.fat, max: user.context.macros.fat, color: 'bg-yellow-500', unit: 'g' },
                    { label: 'Água', val: stats.water, max: user.context.waterIntakeGoal, color: 'bg-cyan-500', unit: 'ml' }
                  ].map(m => (
                    <div key={m.label} className="flex flex-col gap-1">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-wider">{m.label}</span>
                        <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                          <div className={`h-full ${m.color}`} style={{ width: `${Math.min((m.val/m.max)*100, 100)}%` }}></div>
                        </div>
                        <span className="text-[10px] font-bold text-white">{m.val}{m.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
          </div>

          {/* --- RIGHT COLUMN (Desktop: 7/12) - FEED & TIMELINE --- */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Horizontal Scroll de Planejamento de Hoje */}
            {todayPlan && todayPlan.meals && todayPlan.meals.length > 0 && (
              <div className="animate-fadeIn">
                <div className="flex justify-between items-center mb-4 px-1">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
                    <CalendarIcon size={14} className="text-emerald-500" />
                    Programação de Hoje
                  </h3>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    {todayPlan.meals.filter((m:any) => m.consumed).length}/{todayPlan.meals.length} Concluído
                  </span>
                </div>
                
                <div 
                  ref={scrollRef}
                  onMouseDown={handleMouseDown}
                  onMouseLeave={handleMouseLeave}
                  onMouseUp={handleMouseUp}
                  onMouseMove={handleMouseMove}
                  className={`flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-1 px-1 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                  {todayPlan.meals.map((meal: any, idx: number) => (
                    <div 
                      key={meal.id || idx}
                      className={`min-w-[160px] max-w-[160px] p-4 rounded-2xl border transition-all flex flex-col justify-between h-32 relative overflow-hidden ${
                        meal.consumed 
                          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-60' 
                          : 'bg-[#18181b] border-white/5 hover:border-white/10'
                      }`}
                    >
                      {meal.consumed && (
                        <div className="absolute top-2 right-2 text-emerald-500">
                          <CheckCircle2 size={16} />
                        </div>
                      )}
                      
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock size={10} className="text-gray-500" />
                          <span className="text-[10px] font-black text-gray-500">{meal.time || '--:--'}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">{meal.description}</h4>
                      </div>

                      <div className="mt-auto pt-2 flex items-center justify-between">
                        <span className="text-[10px] font-black text-emerald-500">{meal.kcal} kcal</span>
                        {!meal.consumed && (
                          <button 
                            onClick={() => handleConsumePlannedMeal(meal, idx)}
                            className="px-3 py-1 bg-white text-black rounded-lg font-black text-[9px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                          >
                            Consumi
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stats.timeline.length > 0 ? (
              <div className="animate-slideUp">
                  <div className="flex justify-between items-center mb-4 px-1">
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">
                        Linha do Tempo 
                        <span className="text-gray-500 ml-2 normal-case font-medium opacity-60">({getDateLabel()})</span>
                      </h3>
                      <button 
                        onClick={() => setIsExpandedView(true)}
                        className="w-8 h-8 rounded-full bg-[#18181b] flex items-center justify-center border border-white/5 text-gray-400 hover:text-white transition-colors lg:hidden"
                      >
                        <Maximize2 size={14} />
                      </button>
                  </div>

                  {/* Desktop Timeline - Always Expanded Logicish */}
                  <div className="glass-panel rounded-2xl p-4 space-y-2">
                      {stats.timeline.map((log, index) => (
                          <div 
                            key={log.id} 
                            onClick={() => handleLogClick(log)}
                            className={`flex items-center gap-3 group cursor-pointer transition-all hover:translate-x-1 ${log.type === 'checkin' ? 'cursor-default' : ''}`}
                          >
                            <span className="text-xs font-bold text-gray-500 w-12 shrink-0">
                               {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <div className="flex-1 p-4 bg-black/20 rounded-2xl flex justify-between items-center border border-transparent group-hover:border-white/10 group-hover:bg-black/40 transition-all">
                              <div>
                                <span className="block text-sm font-bold text-white">{log.value.description || (log.type === 'checkin' ? 'Check-in' : log.type === 'water' ? 'Água' : 'Item')}</span>
                                {log.type === 'food' && (
                                  <div className="flex gap-3 text-[10px] text-gray-500 mt-1 uppercase font-bold">
                                    <span>P: {log.value.protein}g</span>
                                    <span>C: {log.value.carbs}g</span>
                                    <span>G: {log.value.fat}g</span>
                                  </div>
                                )}
                              </div>
                              {log.type === 'food' && <span className="text-sm font-black text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-xl">{log.value.kcal} kcal</span>}
                              {log.type === 'water' && <span className="text-sm font-black text-cyan-500 bg-cyan-500/10 px-3 py-1.5 rounded-xl">{log.value.amount} ml</span>}
                              {log.type === 'checkin' && <Flame size={18} className="text-amber-500" fill="currentColor" />}
                            </div>
                          </div>
                      ))}
                  </div>
              </div>
            ) : (
              <div className="glass-panel rounded-[2rem] p-12 flex flex-col items-center justify-center text-center opacity-50 border-dashed border-white/10">
                  <Utensils size={32} className="mb-4 text-gray-500" />
                  <p className="text-sm font-bold text-gray-400">Mesa vazia neste dia.</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {viewDate.toDateString() === new Date().toDateString() 
                      ? 'Adicione sua primeira refeição.' 
                      : 'Nenhum registro encontrado.'}
                  </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Expanded Meal View (Timeline) - Mobile Only/Overlay */}
      <div 
        className={`fixed inset-0 z-50 bg-[#09090b] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] lg:hidden ${
           isExpandedView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100%] pointer-events-none'
        }`}
      >
         <div className="h-full overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-8 pt-4">
               <div>
                  <h2 className="text-2xl font-black text-white">Refeições</h2>
                  <p className="text-gray-500 text-sm">Detalhamento diário</p>
               </div>
               <button onClick={() => setIsExpandedView(false)} className="p-3 bg-[#18181b] rounded-full text-white border border-white/5">
                  <X size={20} />
               </button>
            </div>
            
            <div className="space-y-4 pb-24">
                {stats.timeline.map((log) => (
                    <div 
                      key={log.id} 
                      onClick={() => handleLogClick(log)}
                      className="glass-panel p-5 rounded-2xl flex justify-between items-center"
                    >
                        <div>
                            <span className="block text-sm font-bold text-white">{log.value.description}</span>
                            <span className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        {log.type === 'food' && <span className="font-bold text-emerald-500">{log.value.kcal} kcal</span>}
                        {log.type === 'water' && <span className="font-bold text-cyan-500">{log.value.amount} ml</span>}
                    </div>
                ))}
            </div>
         </div>
      </div>

      {/* Detail / Edit Modal for Meals */}
      {selectedLog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fadeIn">
           <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedLog(null)}></div>
           
           <div className="relative glass-dark w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                 <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <Utensils size={24} />
                 </div>
                 <button onClick={() => setSelectedLog(null)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
                    <X size={20} />
                 </button>
              </div>

              {!isEditingLog ? (
                 <>
                   <h2 className="text-2xl font-black text-white mb-1">{selectedLog.value.description}</h2>
                   <p className="text-gray-500 text-sm font-bold mb-8">
                     {new Date(selectedLog.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedLog.timestamp).toLocaleDateString()}
                   </p>

                   <div className="flex items-baseline gap-1 mb-8">
                      <span className="text-5xl font-black text-white tracking-tighter">{selectedLog.type === 'water' ? selectedLog.value.amount : selectedLog.value.kcal}</span>
                      <span className="text-sm font-bold text-gray-500 uppercase">{selectedLog.type === 'water' ? 'ml' : 'kcal'}</span>
                   </div>

                   {selectedLog.type === 'food' && (
                     <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                           <span className="block text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">PROT</span>
                           <span className="text-xl font-bold text-white">{selectedLog.value.protein}g</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                           <span className="block text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">CARB</span>
                           <span className="text-xl font-bold text-white">{selectedLog.value.carbs}g</span>
                        </div>
                        <div className="bg-black/40 p-3 rounded-2xl text-center border border-white/5">
                           <span className="block text-[10px] font-black text-yellow-400 uppercase tracking-widest mb-1">GORD</span>
                           <span className="text-xl font-bold text-white">{selectedLog.value.fat}g</span>
                        </div>
                     </div>
                   )}

                   <div className="flex gap-3">
                      <button 
                         onClick={() => deleteLog(selectedLog.id)}
                         className="flex-1 py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                      >
                         <Trash2 size={16} /> Excluir
                      </button>
                      <button 
                         onClick={() => setIsEditingLog(true)}
                         className="flex-[2] py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                         <Edit2 size={16} /> Editar
                      </button>
                   </div>
                 </>
              ) : (
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Editar {selectedLog.type === 'water' ? 'Água' : 'Refeição'}</h3>
                    
                    <input 
                      value={editForm.description} 
                      onChange={e => setEditForm({...editForm, description: e.target.value})}
                      className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/5 focus:border-emerald-500/50 outline-none font-bold"
                      placeholder="Nome"
                    />
                    
                    {selectedLog.type === 'water' ? (
                      <div className="relative">
                         <input 
                           type="number" 
                           value={editForm.amount} 
                           onChange={e => setEditForm({...editForm, amount: Number(e.target.value)})}
                           className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/5 focus:border-cyan-500/50 outline-none font-bold"
                           placeholder="Quantidade"
                         />
                         <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">ml</span>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                           <input 
                             type="number" 
                             value={editForm.kcal} 
                             onChange={e => setEditForm({...editForm, kcal: Number(e.target.value)})}
                             className="w-full bg-black/40 text-white p-4 rounded-xl border border-white/5 focus:border-emerald-500/50 outline-none font-bold"
                             placeholder="Kcal"
                           />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">kcal</span>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                           <input type="number" placeholder="P" value={editForm.protein} onChange={e => setEditForm({...editForm, protein: Number(e.target.value)})} className="bg-black/40 p-3 rounded-xl border border-white/5 text-center text-white font-bold outline-none focus:border-blue-500/50" />
                           <input type="number" placeholder="C" value={editForm.carbs} onChange={e => setEditForm({...editForm, carbs: Number(e.target.value)})} className="bg-black/40 p-3 rounded-xl border border-white/5 text-center text-white font-bold outline-none focus:border-emerald-500/50" />
                           <input type="number" placeholder="G" value={editForm.fat} onChange={e => setEditForm({...editForm, fat: Number(e.target.value)})} className="bg-black/40 p-3 rounded-xl border border-white/5 text-center text-white font-bold outline-none focus:border-yellow-500/50" />
                        </div>
                      </>
                    )}

                    <div className="flex gap-3 mt-6">
                       <button 
                          onClick={() => setIsEditingLog(false)}
                          className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-bold uppercase text-xs hover:text-white transition-all"
                       >
                          Cancelar
                       </button>
                       <button 
                          onClick={handleUpdateLog}
                          className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-emerald-400 transition-all flex items-center justify-center gap-2"
                       >
                          <Save size={16} /> Salvar
                       </button>
                    </div>
                 </div>
              )}
           </div>
        </div>
      )}

      <NavBar activeTab={activeTab} setActiveTab={setActiveTab} onRegister={() => { setRegisterInitialData(null); setShowActionMenu(true); }} />

      {showActionMenu && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 animate-fadeIn">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowActionMenu(false)}></div>
            <div className="relative glass-dark w-full max-w-sm sm:rounded-[2.5rem] rounded-t-[2.5rem] p-6 shadow-2xl animate-slideUp">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white">Adicionar</h3>
                    <button onClick={() => setShowActionMenu(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                </div>
                
                <div className="space-y-4">
                    <button 
                        onClick={() => {
                            setRegisterMode('log');
                            setRegisterInitialView('form');
                            setShowActionMenu(false);
                            setShowRegister(true);
                        }}
                        className="w-full bg-[#27272a] p-5 rounded-3xl border border-white/5 flex items-center justify-between group active:scale-95 transition-all hover:bg-white/5"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                <Utensils size={24} />
                            </div>
                            <div className="text-left">
                                <h4 className="font-bold text-white text-sm">Registrar no Dia</h4>
                                <p className="text-[10px] font-medium text-gray-500 mt-0.5">Adiciona à sua linha do tempo de hoje.</p>
                            </div>
                        </div>
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                setRegisterMode('log');
                                setRegisterInitialView('camera');
                                setShowActionMenu(false);
                                setShowRegister(true);
                            }}
                            className="p-3 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                        >
                            <Camera size={20} />
                        </div>
                    </button>

                    <button 
                        onClick={() => {
                            setRegisterMode('create_only');
                            setRegisterInitialView('form');
                            setShowActionMenu(false);
                            setShowRegister(true);
                        }}
                        className="w-full bg-[#27272a] p-5 rounded-3xl border border-white/5 flex items-center gap-4 group active:scale-95 transition-all hover:bg-white/5"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                            <BookOpen size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-white text-sm">Criar Item</h4>
                            <p className="text-[10px] font-medium text-gray-500 mt-0.5">Salva na biblioteca para usar depois.</p>
                        </div>
                    </button>

                    <button 
                        onClick={() => {
                            setShowActionMenu(false);
                            setShowWaterModal(true);
                        }}
                        className="w-full bg-[#27272a] p-5 rounded-3xl border border-white/5 flex items-center gap-4 group active:scale-95 transition-all hover:bg-white/5"
                    >
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
                            <Droplets size={24} />
                        </div>
                        <div className="text-left">
                            <h4 className="font-bold text-white text-sm">Beber Água</h4>
                            <p className="text-[10px] font-medium text-gray-500 mt-0.5">Registre sua hidratação diária.</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
      )}

      {showRegister && (
        <RegisterModal 
          userId={user.id}
          initialData={registerInitialData}
          mode={registerMode}
          initialView={registerInitialView}
          onClose={() => { setShowRegister(false); setRegisterInitialData(null); }} 
          onSave={async (type, val) => {
            await push(ref(db, `users/${user.id}/logs`), { timestamp: Date.now(), type, value: val });
            setShowRegister(false);
            setRegisterInitialData(null);
          }} 
        />
      )}

      {showWaterModal && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-fadeIn">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowWaterModal(false)}></div>
            <div className="relative glass-dark w-full max-w-xs rounded-[2rem] p-6 shadow-2xl animate-slideUp border border-white/10">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400 mx-auto mb-4 border border-blue-500/20">
                        <Droplets size={32} />
                    </div>
                    <h3 className="text-xl font-black text-white">Beber Água</h3>
                    <p className="text-xs text-gray-500 mt-1">Quanto você bebeu agora?</p>
                </div>

                <div className="space-y-4">
                    <div className="relative">
                        <input 
                            type="number" 
                            value={waterAmount}
                            onChange={(e) => setWaterAmount(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-center text-2xl font-black text-white outline-none focus:border-blue-500/50 transition-all"
                            placeholder="0"
                            autoFocus
                        />
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs font-black text-gray-600 uppercase">ML</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {['200', '350', '500'].map(val => (
                            <button 
                                key={val}
                                onClick={() => setWaterAmount(val)}
                                className={`py-2 rounded-xl text-[10px] font-black border transition-all ${waterAmount === val ? 'bg-blue-500 border-blue-500 text-white' : 'bg-white/5 border-white/5 text-gray-400'}`}
                            >
                                {val}ml
                            </button>
                        ))}
                    </div>

                    <button 
                        onClick={handleSaveWater}
                        className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all shadow-lg shadow-white/10"
                    >
                        Confirmar
                    </button>
                    
                    <button 
                        onClick={() => setShowWaterModal(false)}
                        className="w-full py-2 text-[10px] font-black text-gray-500 uppercase tracking-widest"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

const NavBar = ({ activeTab, setActiveTab, onRegister }: any) => (
  <div className="fixed bottom-4 left-0 right-0 z-50 px-6 pointer-events-none flex justify-center">
    <nav className="w-full max-w-[320px] glass-dark rounded-full p-1.5 flex items-center justify-between shadow-2xl pointer-events-auto">
       <button onClick={() => setActiveTab('home')} className={`p-3 rounded-full transition-all ${activeTab === 'home' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
          <Home size={18} />
       </button>
       
       <button onClick={() => setActiveTab('library')} className={`p-3 rounded-full transition-all ${activeTab === 'library' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
          <Bookmark size={18} />
       </button>
       
       <button 
         onClick={onRegister}
         className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-black shadow-lg shadow-white/20 active:scale-90 transition-all -mt-6 border-4 border-[#09090b]"
       >
          <Plus size={20} strokeWidth={3} />
       </button>

       <button onClick={() => setActiveTab('stats')} className={`p-3 rounded-full transition-all ${activeTab === 'stats' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
          <PieChart size={18} />
       </button>
       <button onClick={() => setActiveTab('profile')} className={`p-3 rounded-full transition-all ${activeTab === 'profile' ? 'text-white bg-white/10' : 'text-gray-500 hover:text-gray-300'}`}>
          <UserIcon size={18} />
       </button>
    </nav>
  </div>
);
