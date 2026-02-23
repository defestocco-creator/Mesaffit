
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { LogEntry, UserData } from '../types';
import { Flame, ChevronDown, Calendar, Trophy, Zap, TrendingUp, ArrowUpRight, ArrowDownRight, Activity, Droplets } from 'lucide-react';

interface StatsProps {
  user: UserData;
  logs: LogEntry[];
}

type TimeRange = 'today' | 'yesterday' | 'week' | 'month' | 'quarter';

export const Stats: React.FC<StatsProps> = ({ user, logs }) => {
  const [range, setRange] = useState<TimeRange>('week');
  const [animating, setAnimating] = useState(false);
  const [hoverData, setHoverData] = useState<{ val: number, p: number, c: number, f: number, label: string, date: string } | null>(null);
  const graphContainerRef = useRef<HTMLDivElement>(null);

  // Trigger animation on mount
  useEffect(() => {
    setAnimating(true);
  }, []);

  // --- DATA PROCESSING ENGINE ---

  const processData = useMemo(() => {
    const today = new Date();
    const dataPoints: { date: Date, val: number, p: number, c: number, f: number, label: string }[] = [];
    
    // --- LÓGICA DE DATAS ---
    if (range === 'today' || range === 'yesterday') {
        // VISUALIZAÇÃO POR HORA (00h - 23h)
        const targetDate = new Date(today);
        if (range === 'yesterday') targetDate.setDate(targetDate.getDate() - 1);
        targetDate.setHours(0,0,0,0);

        for (let i = 0; i < 24; i++) {
            // Filtra logs daquela hora específica
            const hourLogs = logs.filter(l => {
                const lDate = new Date(l.timestamp);
                return lDate.getDate() === targetDate.getDate() &&
                       lDate.getMonth() === targetDate.getMonth() &&
                       lDate.getFullYear() === targetDate.getFullYear() &&
                       lDate.getHours() === i &&
                       l.type === 'food';
            });

            const val = hourLogs.reduce((acc, curr) => acc + (curr.value.kcal || 0), 0);
            const p = hourLogs.reduce((acc, curr) => acc + (curr.value.protein || 0), 0);
            const c = hourLogs.reduce((acc, curr) => acc + (curr.value.carbs || 0), 0);
            const f = hourLogs.reduce((acc, curr) => acc + (curr.value.fat || 0), 0);

            dataPoints.push({
                date: targetDate, // Data base
                val, p, c, f,
                label: `${i}h`
            });
        }

    } else {
        // VISUALIZAÇÃO POR DIAS
        today.setHours(0, 0, 0, 0);
        let daysToLoad = 7;
        if (range === 'month') daysToLoad = 30;
        if (range === 'quarter') daysToLoad = 90;

        for (let i = daysToLoad - 1; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            
            const dayLogs = logs.filter(l => {
                const logDate = new Date(l.timestamp);
                return logDate.getDate() === d.getDate() && 
                       logDate.getMonth() === d.getMonth() &&
                       logDate.getFullYear() === d.getFullYear() &&
                       l.type === 'food';
            });

            const val = dayLogs.reduce((acc, curr) => acc + (curr.value.kcal || 0), 0);
            const p = dayLogs.reduce((acc, curr) => acc + (curr.value.protein || 0), 0);
            const c = dayLogs.reduce((acc, curr) => acc + (curr.value.carbs || 0), 0);
            const f = dayLogs.reduce((acc, curr) => acc + (curr.value.fat || 0), 0);
            
            // Label formatting
            let label = d.getDate().toString();
            if (range === 'week') label = d.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
            
            dataPoints.push({ date: d, val, p, c, f, label });
        }
    }

    // --- CÁLCULO DE MACROS MÉDIOS GERAIS ---
    // Usamos os dataPoints gerados para calcular a média do período visualizado
    const totalP = dataPoints.reduce((acc, d) => acc + d.p, 0);
    const totalC = dataPoints.reduce((acc, d) => acc + d.c, 0);
    const totalF = dataPoints.reduce((acc, d) => acc + d.f, 0);
    const totalKcal = dataPoints.reduce((acc, d) => acc + d.val, 0);
    
    // Se for 'today'/'yesterday', é a soma total do dia. Se for periodos, é média diária.
    const divisor = (range === 'today' || range === 'yesterday') ? 1 : (dataPoints.length || 1);

    const avgMacros = {
        p: Math.round(totalP / divisor),
        c: Math.round(totalC / divisor),
        f: Math.round(totalF / divisor),
        kcal: Math.round(totalKcal / divisor)
    };

    // --- CÁLCULO SEMANAL DO MÊS ATUAL (1, 2, 3, 4) ---
    const currentMonthWeeks = [0, 0, 0, 0];
    const currentMonth = today.getMonth();
    
    logs.forEach(l => {
        const d = new Date(l.timestamp);
        if (d.getMonth() === currentMonth && d.getFullYear() === today.getFullYear() && l.type === 'food') {
            const day = d.getDate();
            const weekIndex = Math.min(Math.floor((day - 1) / 7), 3);
            currentMonthWeeks[weekIndex] += (l.value.kcal || 0);
        }
    });

    // Calcular Streak
    let streak = 0;
    const checkinDates = new Set(
        logs
        .filter(l => l.type === 'checkin' || (l.type === 'food' && l.value.kcal > 500))
        .map(l => new Date(l.timestamp).toDateString())
    );

    for (let i = 0; i < 365; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (checkinDates.has(d.toDateString())) {
            streak++;
        } else if (i > 0) {
             if (i === 1 && !checkinDates.has(d.toDateString())) break;
             if (i > 1) break;
        }
    }

    return { dataPoints, streak, avgMacros, currentMonthWeeks };
  }, [logs, range]);

  // --- SVG GRAPH ENGINE ---

  const height = 250;
  const width = 1000;
  
  // Escalas Independentes para visualização
  const maxKcal = Math.max(...processData.dataPoints.map(d => d.val), user.context.calorieGoal * 1.2, 100);
  const maxMacro = Math.max(
      ...processData.dataPoints.map(d => Math.max(d.p, d.c, d.f)), 
      100 // Mínimo visual para não quebrar escala
  ) * 1.2; 

  const pointsX = processData.dataPoints.map((_, i) => (i / (processData.dataPoints.length - 1)) * width);
  
  // Y Points Calculation
  const pointsYKcal = processData.dataPoints.map(d => height - (d.val / maxKcal) * height);
  const pointsYP = processData.dataPoints.map(d => height - (d.p / maxMacro) * height);
  const pointsYC = processData.dataPoints.map(d => height - (d.c / maxMacro) * height);
  const pointsYF = processData.dataPoints.map(d => height - (d.f / maxMacro) * height);

  const generatePath = (ptsX: number[], ptsY: number[]) => {
    if (ptsX.length === 0) return "";
    let d = `M ${ptsX[0]},${ptsY[0]}`;
    for (let i = 0; i < ptsX.length - 1; i++) {
      const x_mid = (ptsX[i] + ptsX[i+1]) / 2;
      d += ` Q ${x_mid},${ptsY[i]} ${x_mid},${ptsY[i+1]} T ${ptsX[i+1]},${ptsY[i+1]}`; 
    }
    return d;
  };

  const linePathKcal = generatePath(pointsX, pointsYKcal);
  const areaPathKcal = `${linePathKcal} L ${width},${height} L 0,${height} Z`;
  
  const linePathP = generatePath(pointsX, pointsYP);
  const linePathC = generatePath(pointsX, pointsYC);
  const linePathF = generatePath(pointsX, pointsYF);

  // Interaction Handler
  const handleTouch = (e: React.MouseEvent | React.TouchEvent) => {
    if (!graphContainerRef.current) return;
    const rect = graphContainerRef.current.getBoundingClientRect();
    let clientX;
    if ('touches' in e) clientX = e.touches[0].clientX;
    else clientX = (e as React.MouseEvent).clientX;

    const x = clientX - rect.left;
    const width = rect.width;
    const index = Math.min(Math.max(Math.round((x / width) * (processData.dataPoints.length - 1)), 0), processData.dataPoints.length - 1);
    
    const point = processData.dataPoints[index];
    setHoverData({
        val: point.val,
        p: point.p,
        c: point.c,
        f: point.f,
        label: point.label,
        date: range === 'today' || range === 'yesterday' 
            ? `${point.label} - ${range === 'today' ? 'Hoje' : 'Ontem'}`
            : point.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    });
  };

  // --- HEATMAP GENERATOR ---
  const renderHeatmap = () => {
     const weeks = 12; 
     const days = weeks * 7;
     const today = new Date();
     
     const grid = [];
     for(let i=0; i<days; i++) {
         const d = new Date(today);
         d.setDate(d.getDate() - ((days-1) - i));
         
         const dayLog = logs.find(l => 
             new Date(l.timestamp).toDateString() === d.toDateString() && l.type === 'food'
         );
         const dayTotal = logs
             .filter(l => new Date(l.timestamp).toDateString() === d.toDateString() && l.type === 'food')
             .reduce((acc, curr) => acc + (curr.value.kcal || 0), 0);
             
         let opacity = 0.1;
         let colorClass = 'bg-gray-800';
         
         if (dayTotal > 0) {
             const ratio = dayTotal / user.context.calorieGoal;
             if (ratio > 1.1) { colorClass = 'bg-red-500'; opacity = 0.8; }
             else if (ratio > 0.8) { colorClass = 'bg-emerald-500'; opacity = ratio; }
             else { colorClass = 'bg-emerald-500'; opacity = 0.3; }
         }

         grid.push(
             <div 
                key={i} 
                className={`w-full aspect-square rounded-sm sm:rounded-md transition-all duration-500 hover:scale-125 ${colorClass}`}
                style={{ opacity }}
                title={d.toLocaleDateString()}
             />
         );
     }
     return grid;
  };

  // Dados para exibição no Card Principal (Usa hoverData se disponível, senão usa média do período)
  const displayData = hoverData || {
    val: processData.avgMacros.kcal,
    p: processData.avgMacros.p,
    c: processData.avgMacros.c,
    f: processData.avgMacros.f,
    label: range === 'today' ? 'Hoje' : range === 'yesterday' ? 'Ontem' : range === 'week' ? 'Média Semanal' : range === 'month' ? 'Média Mensal' : 'Média Trimestral',
    date: ''
  };

  const caloriePercentage = Math.min((displayData.val / user.context.calorieGoal) * 100, 100);

  return (
    <div className="pb-32 animate-slideUp w-full max-w-7xl mx-auto">
        {/* --- HEADER: STREAK & META --- */}
        <div className="px-6 pt-12 mb-8">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Sequência</h2>
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Flame 
                                size={32} 
                                className={`text-orange-500 ${processData.streak > 0 ? 'animate-pulse drop-shadow-[0_0_15px_rgba(249,115,22,0.6)]' : 'text-gray-700'}`} 
                                fill={processData.streak > 0 ? "currentColor" : "none"}
                            />
                            {processData.streak > 0 && (
                                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-30 animate-pulse"></div>
                            )}
                        </div>
                        <span className="text-4xl font-black text-white tracking-tighter">
                            {processData.streak} <span className="text-sm text-gray-500 font-bold">dias</span>
                        </span>
                    </div>
                </div>
                
                <div className="text-right">
                    <div className="bg-zinc-900 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                        <Trophy size={16} className="text-yellow-500" />
                        <span className="text-xs font-black text-white uppercase">{user.primaryGoal}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* --- RESPONSIVE GRID LAYOUT --- */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-6">
            
            {/* LEFT COLUMN (Desktop: 8/12) - MAIN CHART & WEEKLY BREAKDOWN */}
            <div className="lg:col-span-8 space-y-6">
                {/* --- MAIN CHART CONTAINER --- */}
                <div className="glass-panel rounded-3xl p-5 relative overflow-hidden group shadow-2xl">
                    {/* Range Selector */}
                    <div className="flex flex-wrap justify-center gap-1.5 mb-6 relative z-20">
                        {(['today', 'yesterday', 'week', 'month', 'quarter'] as TimeRange[]).map((r) => (
                            <button
                                key={r}
                                onClick={() => setRange(r)}
                                className={`px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                                    range === r 
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                                    : 'bg-black/20 text-gray-500 hover:text-white border border-white/5 hover:bg-white/5'
                                }`}
                            >
                                {r === 'today' ? 'Hoje' : r === 'yesterday' ? 'Ontem' : r === 'week' ? 'Semana' : r === 'month' ? 'Mês' : 'Trimestre'}
                            </button>
                        ))}
                    </div>

                    {/* NEW SUMMARY CARD (Dynamic) */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 relative z-20 gap-4 animate-fadeIn">
                        <div className="flex-1 w-full">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1 block">
                                {hoverData ? hoverData.date : displayData.label}
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="text-4xl font-black text-white tracking-tighter leading-none transition-all tabular-nums">
                                    {displayData.val}
                                </span>
                                <span className="text-xs font-bold text-gray-500">kcal</span>
                            </div>
                            {/* Progress Bar Line */}
                             <div className="flex items-center gap-2 mt-2">
                                <div className="h-1 w-full max-w-[160px] bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${caloriePercentage}%` }}></div>
                                </div>
                                <span className="text-[9px] font-bold text-gray-500">de {user.context.calorieGoal}</span>
                            </div>
                        </div>
                        
                        {/* Circle */}
                        <div className="relative w-16 h-16 shrink-0 hidden sm:block">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 112 112">
                                <circle cx="56" cy="56" r="46" stroke="#27272a" strokeWidth="8" fill="transparent" />
                                <circle cx="56" cy="56" r="46" stroke="#10b981" strokeWidth="8" fill="transparent" strokeDasharray={289} strokeDashoffset={289 - (289 * caloriePercentage) / 100} strokeLinecap="round" className="transition-all duration-500" />
                            </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                                <Flame size={16} className="text-white fill-white" />
                            </div>
                        </div>
                    </div>

                    {/* MACROS GRID */}
                    <div className="grid grid-cols-3 gap-3 mb-6 relative z-20">
                        {/* Prot */}
                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 backdrop-blur-sm">
                             <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-black text-blue-400 uppercase">Prot</span>
                                <span className="text-[10px] font-bold text-white tabular-nums">{displayData.p}g</span>
                             </div>
                             <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 transition-all duration-500" style={{ width: `${Math.min((displayData.p / user.context.macros.protein)*100, 100)}%` }}></div>
                             </div>
                        </div>
                        {/* Carb */}
                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 backdrop-blur-sm">
                             <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-black text-purple-400 uppercase">Carb</span>
                                <span className="text-[10px] font-bold text-white tabular-nums">{displayData.c}g</span>
                             </div>
                             <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500 transition-all duration-500" style={{ width: `${Math.min((displayData.c / user.context.macros.carbs)*100, 100)}%` }}></div>
                             </div>
                        </div>
                        {/* Fat */}
                        <div className="bg-black/20 rounded-xl p-2.5 border border-white/5 backdrop-blur-sm">
                             <div className="flex justify-between items-end mb-1">
                                <span className="text-[9px] font-black text-yellow-400 uppercase">Gord</span>
                                <span className="text-[10px] font-bold text-white tabular-nums">{displayData.f}g</span>
                             </div>
                             <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500 transition-all duration-500" style={{ width: `${Math.min((displayData.f / user.context.macros.fat)*100, 100)}%` }}></div>
                             </div>
                        </div>
                    </div>

                    {/* THE CHART */}
                    <div 
                        ref={graphContainerRef}
                        className="h-[200px] w-full relative cursor-crosshair touch-none -mx-4 sm:mx-0 w-[calc(100%+2rem)] sm:w-full"
                        onMouseMove={handleTouch}
                        onTouchMove={handleTouch}
                        onMouseLeave={() => setHoverData(null)}
                        onTouchEnd={() => setHoverData(null)}
                    >
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                                </linearGradient>
                                <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            {/* Goal Line */}
                            <line 
                                x1="0" y1={height - (user.context.calorieGoal / maxKcal) * height} 
                                x2={width} y2={height - (user.context.calorieGoal / maxKcal) * height} 
                                stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="5,5" 
                            />

                            {/* KCAL Area (Background) */}
                            <path d={areaPathKcal} fill="url(#chartGradient)" className={`transition-all duration-1000 ease-out ${animating ? 'opacity-100' : 'opacity-0 translate-y-10'}`} />
                            
                            {/* KCAL Line (Main) */}
                            <path 
                                d={linePathKcal} fill="none" stroke="#10b981" strokeWidth="3" filter="url(#glow)" strokeLinecap="round" 
                                className={`transition-all duration-1000 ease-out ${animating ? 'opacity-100' : 'opacity-0'}`} 
                                strokeDasharray={width * 2} strokeDashoffset={animating ? 0 : width * 2} 
                            />

                            {/* MACRO LINES (Thinner) */}
                            {/* Protein - Blue */}
                            <path d={linePathP} fill="none" stroke="#3b82f6" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" className="transition-all duration-1000 delay-100" />
                            {/* Carbs - Purple */}
                            <path d={linePathC} fill="none" stroke="#a855f7" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" className="transition-all duration-1000 delay-200" />
                            {/* Fat - Yellow */}
                            <path d={linePathF} fill="none" stroke="#eab308" strokeWidth="2" strokeOpacity="0.8" strokeLinecap="round" className="transition-all duration-1000 delay-300" />
                            
                            {/* Hover Indicator */}
                            {hoverData && processData.dataPoints.map((p, i) => (
                                p.label === hoverData.label && (
                                    <g key={i}>
                                        <line x1={pointsX[i]} y1="0" x2={pointsX[i]} y2={height} stroke="white" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />
                                        {/* Kcal Dot */}
                                        <circle cx={pointsX[i]} cy={pointsYKcal[i]} r="6" fill="#18181b" stroke="#10b981" strokeWidth="3" />
                                        {/* P Dot */}
                                        <circle cx={pointsX[i]} cy={pointsYP[i]} r="4" fill="#3b82f6" />
                                        {/* C Dot */}
                                        <circle cx={pointsX[i]} cy={pointsYC[i]} r="4" fill="#a855f7" />
                                        {/* F Dot */}
                                        <circle cx={pointsX[i]} cy={pointsYF[i]} r="4" fill="#eab308" />
                                    </g>
                                )
                            ))}
                        </svg>

                        {/* X Axis Labels */}
                        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-4 pb-2 pointer-events-none">
                            {processData.dataPoints.filter((_, i) => i % Math.ceil(processData.dataPoints.length / 6) === 0).map((p, i) => (
                                <span key={i} className="text-[10px] font-bold text-gray-600 uppercase">{p.label}</span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- WEEKLY BREAKDOWN (Current Month) --- */}
                <div>
                    <div className="flex items-center gap-2 mb-4 px-2">
                         <Activity size={18} className="text-gray-400" />
                         <h3 className="text-sm font-bold text-white">Resumo do Mês (Semanal)</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {processData.currentMonthWeeks.map((total, index) => {
                            const weeklyGoal = user.context.calorieGoal * 7;
                            const percentage = Math.min((total / weeklyGoal) * 100, 100);
                            const isCurrentWeek = Math.floor((new Date().getDate() - 1) / 7) === index;

                            return (
                                <div key={index} className={`glass-panel p-5 rounded-[2rem] border ${isCurrentWeek ? 'border-emerald-500/50' : 'border-white/5'} relative overflow-hidden group`}>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Semana {index + 1}</p>
                                    <p className={`text-xl font-black ${total > 0 ? 'text-white' : 'text-gray-600'}`}>
                                        {total > 1000 ? (total/1000).toFixed(1) + 'k' : total}
                                    </p>
                                    <div className="mt-3 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${total > weeklyGoal ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* RIGHT COLUMN (Desktop: 4/12) - MACROS, HEATMAP & INSIGHTS */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* --- MACROS NUTRIENTS CARD (Redundant but requested) --- */}
                <div className="glass-panel p-6 rounded-[2rem] relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-6">
                        <Droplets size={18} className="text-blue-400" />
                        <h3 className="text-sm font-bold text-white">Composição Nutricional</h3>
                    </div>
                    
                    <div className="space-y-5">
                         {/* Protein */}
                         <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Proteína</span>
                                <span className="text-xs font-bold text-white">{processData.avgMacros.p}g <span className="text-gray-500 text-[10px]">/dia (méd)</span></span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${Math.min((processData.avgMacros.p / user.context.macros.protein) * 100, 100)}%` }}></div>
                            </div>
                         </div>

                         {/* Carbs */}
                         <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Carboidrato</span>
                                <span className="text-xs font-bold text-white">{processData.avgMacros.c}g <span className="text-gray-500 text-[10px]">/dia (méd)</span></span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-purple-500" style={{ width: `${Math.min((processData.avgMacros.c / user.context.macros.carbs) * 100, 100)}%` }}></div>
                            </div>
                         </div>

                         {/* Fat */}
                         <div>
                            <div className="flex justify-between mb-1">
                                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-widest">Gordura</span>
                                <span className="text-xs font-bold text-white">{processData.avgMacros.f}g <span className="text-gray-500 text-[10px]">/dia (méd)</span></span>
                            </div>
                            <div className="h-2 w-full bg-gray-800 rounded-full overflow-hidden">
                                <div className="h-full bg-yellow-500" style={{ width: `${Math.min((processData.avgMacros.f / user.context.macros.fat) * 100, 100)}%` }}></div>
                            </div>
                         </div>
                    </div>
                </div>

                {/* --- HEATMAP CONSISTENCY --- */}
                <div className="glass-panel p-6 rounded-[2rem] h-fit">
                    <div className="flex items-center gap-2 mb-4">
                        <Calendar size={18} className="text-gray-400" />
                        <h3 className="text-sm font-bold text-white">Consistência</h3>
                    </div>
                    <div className="grid grid-cols-12 gap-1.5">
                        {renderHeatmap()}
                    </div>
                    <div className="flex justify-between items-center mt-4">
                        <span className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">3 meses</span>
                        <div className="flex items-center gap-2">
                            <span className="text-[8px] text-gray-600 font-bold">Menos</span>
                            <div className="flex gap-1">
                                <div className="w-2 h-2 rounded bg-gray-800"></div>
                                <div className="w-2 h-2 rounded bg-emerald-900"></div>
                                <div className="w-2 h-2 rounded bg-emerald-500"></div>
                            </div>
                            <span className="text-[8px] text-gray-600 font-bold">Mais</span>
                        </div>
                    </div>
                </div>

                {/* --- COMPARATIVE INSIGHTS --- */}
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
                    <div className="glass-panel p-5 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <TrendingUp size={48} className="text-white" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Média Semanal</p>
                        <p className="text-2xl font-black text-white mb-2">
                            {Math.round(processData.dataPoints.slice(-7).reduce((a,b)=>a+b.val,0)/7)} <span className="text-xs text-gray-500">kcal</span>
                        </p>
                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-bold bg-emerald-500/10 w-max px-2 py-1 rounded-lg">
                            <ArrowUpRight size={12} />
                            <span>Estável</span>
                        </div>
                    </div>

                    <div className="glass-panel p-5 rounded-[2rem] relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <Zap size={48} className="text-yellow-500" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Déficit Estimado</p>
                        <p className="text-2xl font-black text-white mb-2">
                            -350 <span className="text-xs text-gray-500">kcal/dia</span>
                        </p>
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold bg-yellow-500/10 w-max px-2 py-1 rounded-lg">
                            <span>Em Progresso</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
