
import React, { useState, useEffect, useRef } from 'react';
import { UserData, Foodlist, FoodlistMeal } from '../types';
import { db } from '../firebase';
import { LimitAlert } from './LimitAlert';
import { ref, onValue, push, update, set, remove } from "firebase/database";
import { 
  Search, 
  Plus, 
  Heart, 
  Globe, 
  Lock, 
  Play, 
  X, 
  Trash2, 
  Edit2, 
  BookOpen, 
  Utensils, 
  ChevronLeft,
  ChevronDown,
  Flame,
  User as UserIcon,
  AlertTriangle,
  CheckCircle2,
  MoreVertical,
  GripVertical,
  Calendar,
  Tag,
  Save,
  Info,
  BookMarked,
  BookCheck,
  PieChart,
  Circle,
  CheckCircle,
  Filter,
  // Icons de comida
  Apple, Banana, Bean, Beef, Drumstick, Grape, Ham, IceCreamBowl, Nut, Cherry, Cookie, Croissant, Sandwich, CakeSlice, Wine, Milk, Martini, Pizza, Hop, GlassWater, Wheat, Dessert, LeafyGreen, Vegan, Fish, Donut, Egg, EggFried, Beer, Microwave, Popsicle, ChefHat, CookingPot, Popcorn, Carrot, Candy, Coffee, CupSoda, Soup
} from 'lucide-react';

interface LibraryProps {
  user: UserData;
  onClose: () => void;
  onAddLog?: (item: any) => void; // Callback para adicionar refeição
  onNavigateToWeeklyPlan?: (foodlist: Foodlist) => void;
}

const GRADIENTS = [
  "bg-gradient-to-b from-pink-600 to-black",
  "bg-gradient-to-b from-emerald-600 to-black",
  "bg-gradient-to-b from-blue-600 to-black",
  "bg-gradient-to-b from-orange-600 to-black",
  "bg-gradient-to-b from-purple-600 to-black",
  "bg-gradient-to-b from-gray-700 to-black",
];

const TYPE_GRADIENTS: Record<string, string> = {
  "Café da Manhã": "from-orange-500 to-orange-900",
  "Almoço": "from-emerald-500 to-emerald-900",
  "Jantar": "from-indigo-500 to-indigo-900",
  "Lanche da Manhã": "from-yellow-500 to-yellow-900",
  "Lanche da Tarde": "from-amber-500 to-amber-900",
  "Pré-treino": "from-red-500 to-red-900",
  "Pós-treino": "from-blue-500 to-blue-900",
  "Ceia": "from-purple-500 to-purple-900",
  "Brunch": "from-pink-500 to-pink-900",
  "Happy Hour": "from-fuchsia-500 to-fuchsia-900",
  "Vegano": "from-green-500 to-green-900",
  "Vegetariano": "from-lime-500 to-lime-900",
  "Low Carb": "from-cyan-500 to-cyan-900",
  "High Carb": "from-rose-500 to-rose-900",
  "Proteico": "from-sky-500 to-sky-900",
  "Detox": "from-teal-500 to-teal-900",
  "Bulking": "from-violet-500 to-violet-900",
  "Cutting": "from-rose-600 to-rose-950",
  "Manutenção": "from-slate-500 to-slate-900",
  "Reeducação": "from-emerald-600 to-emerald-950",
  "Jejum": "from-zinc-600 to-zinc-950",
  "Cheat Meal": "from-red-600 to-red-950",
  "Bebidas": "from-blue-400 to-blue-800",
  "Suplementos": "from-gray-400 to-gray-800",
  "Sobremesas": "from-pink-300 to-pink-700",
  "Sopas": "from-orange-300 to-orange-700",
  "Saladas": "from-green-300 to-green-700",
  "Massas": "from-yellow-600 to-yellow-900",
  "Carnes": "from-red-700 to-red-950",
  "Peixes": "from-blue-300 to-blue-700",
  "Frango": "from-orange-200 to-orange-600",
  "Grãos": "from-stone-400 to-stone-800",
  "Frutas": "from-lime-300 to-lime-700",
  "Laticínios": "from-blue-100 to-blue-500",
  "Snacks": "from-amber-300 to-amber-700"
};

const FOODLIST_TYPES = [
  "Café da Manhã", "Almoço", "Jantar", "Lanche da Manhã", "Lanche da Tarde", 
  "Pré-treino", "Pós-treino", "Ceia", "Brunch", "Happy Hour", 
  "Rodízio", "Festas", "Churrasco", "Piquenique", "Viagem", 
  "Detox", "Low Carb", "High Carb", "Proteico", "Vegano", 
  "Vegetariano", "Sem Glúten", "Sem Lactose", "Bulking", "Cutting", 
  "Manutenção", "Reeducação", "Jejum", "Cheat Meal", "Bebidas", 
  "Suplementos", "Sobremesas", "Sopas", "Saladas", "Massas", 
  "Carnes", "Peixes", "Frango", "Grãos", "Frutas", 
  "Laticínios", "Snacks"
];

const ICON_MAP: Record<string, React.ElementType> = {
  'Utensils': Utensils, 'Apple': Apple, 'Banana': Banana, 'Bean': Bean, 'Beef': Beef, 'Drumstick': Drumstick, 'Grape': Grape, 'Ham': Ham, 'IceCreamBowl': IceCreamBowl, 'Nut': Nut, 'Cherry': Cherry, 'Cookie': Cookie, 'Croissant': Croissant, 'Sandwich': Sandwich, 'CakeSlice': CakeSlice, 'Wine': Wine, 'Milk': Milk, 'Martini': Martini, 'Pizza': Pizza, 'Hop': Hop, 'GlassWater': GlassWater, 'Wheat': Wheat, 'Dessert': Dessert, 'LeafyGreen': LeafyGreen, 'Vegan': Vegan, 'Fish': Fish, 'Donut': Donut, 'Egg': Egg, 'EggFried': EggFried, 'Beer': Beer, 'Microwave': Microwave, 'Popsicle': Popsicle, 'ChefHat': ChefHat, 'CookingPot': CookingPot, 'Popcorn': Popcorn, 'Carrot': Carrot, 'Candy': Candy, 'Coffee': Coffee, 'CupSoda': CupSoda, 'Soup': Soup
};

const FoodlistCard: React.FC<{ list: Foodlist; onSelect: (list: Foodlist) => void }> = ({ list, onSelect }) => {
  const IconComponent = ICON_MAP[list.icon] || Utensils;
  const mealsWithThumbs = (list.meals || []).filter((m: any) => m.image).slice(0, 4);
  
  const typeGradient = TYPE_GRADIENTS[list.type] || "from-zinc-700 to-zinc-900";
  const cardGradient = `bg-gradient-to-b ${typeGradient}`;

  return (
    <div onClick={() => onSelect(list)} className="group glass-panel p-4 rounded-2xl hover:bg-white/5 transition-all cursor-pointer overflow-hidden active:scale-[0.98]">
       <div className={`aspect-square rounded-xl mb-3 relative overflow-hidden flex items-center justify-center ${cardGradient} shadow-lg`}>
          {mealsWithThumbs.length > 0 && (
            <div className="grid grid-cols-2 grid-rows-2 w-full h-full">
              {mealsWithThumbs.map((m: any, i) => (
                <img key={i} src={m.image} className="w-full h-full object-cover" />
              ))}
              {Array.from({ length: 4 - mealsWithThumbs.length }).map((_, i) => (
                <div key={i+10} className={`w-full h-full ${cardGradient}`} />
              ))}
            </div>
          )}
          
          {/* Overlay escuro para destacar o ícone */}
          <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-all" />
          
          {/* Ícone centralizado e branco */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <IconComponent className="text-white drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]" size={36} />
          </div>
       </div>
       <h3 className="font-bold text-white text-sm truncate mb-1">{list.name}</h3>
       <div className="flex items-center justify-between mt-2">
         <div className="flex items-center gap-2 max-w-[60%]">
             <div className="flex items-center gap-1.5 overflow-hidden">
                {list.authorPhoto ? (
                   <img src={list.authorPhoto} className="w-4 h-4 rounded-full object-cover border border-white/10" />
                ) : (
                   <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center">
                      <UserIcon size={8} className="text-gray-500" />
                   </div>
                )}
                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest truncate">{list.authorName}</span>
             </div>
             {list.savedCount > 0 && (
                 <div className="flex items-center gap-0.5 text-gray-500 shrink-0">
                    <BookMarked size={10} />
                    <span className="text-[9px] font-bold">{list.savedCount}</span>
                 </div>
             )}
         </div>
         {list.stats?.totalKcal > 0 && <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-lg shrink-0">{list.stats.totalKcal} kcal</span>}
       </div>
    </div>
  );
};

// --- INFO NUTRICIONAL MODAL ---
const NutritionalInfoModal = ({ list, onClose }: { list: Foodlist, onClose: () => void }) => {
   const total = list.stats?.totalKcal || 0;
   const p = list.stats?.totalProtein || 0;
   const c = list.stats?.totalCarbs || 0;
   const f = list.stats?.totalFat || 0;
   
   return (
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 animate-fadeIn">
         <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
         <div className="relative glass-dark w-full max-w-sm rounded-[2.5rem] p-2 shadow-2xl animate-slideUp">
             <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2 text-emerald-500">
                   <Info size={20} />
                   <span className="text-xs font-black uppercase tracking-widest">Info Nutricional</span>
                </div>
                <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white"><X size={18} /></button>
             </div>

             <div className="text-center mb-2">
                <h3 className="text-sm font-black text-white mb-1">{total}</h3>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Calorias</p>
             </div>

             <div className="space-y-2 mb-2">
                <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex justify-between items-center">
                   <span className="text-xs font-black text-blue-500 uppercase">Proteína</span>
                   <span className="text-sm font-bold text-white">{p}g</span>
                </div>
                <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex justify-between items-center">
                   <span className="text-xs font-black text-emerald-500 uppercase">Carboidrato</span>
                   <span className="text-sm font-bold text-white">{c}g</span>
                </div>
                <div className="bg-black/30 p-2 rounded-lg border border-white/5 flex justify-between items-center">
                   <span className="text-xs font-black text-yellow-500 uppercase">Gordura</span>
                   <span className="text-sm font-bold text-white">{f}g</span>
                </div>
             </div>
             
             <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                <p className="text-[10px] text-gray-400 leading-relaxed text-center">
                   Esta lista contém <strong>{list.meals?.length || 0} refeições</strong>. Os valores acima representam a soma total de todos os itens.
                </p>
             </div>
         </div>
      </div>
   );
};

// --- SPOTIFY STYLE DETAIL VIEW ---
const FoodlistDetail = ({ list, user, onBack, onComecar, onSalvar, onEdit, onDelete }: any) => {
   const [showInfo, setShowInfo] = useState(false);
   const isOwner = list.authorId === user.id;
   const IconComponent = ICON_MAP[list.icon] || Utensils;
   const mealsWithImages = (list.meals || []).filter((m:any) => m.image).slice(0, 4);
   
   const typeGradient = TYPE_GRADIENTS[list.type] || "from-emerald-800 to-black";
   const bgGradient = `bg-gradient-to-b ${typeGradient}`;

   return (
      <div className="flex flex-col h-full bg-[#000] animate-fadeIn">
         {showInfo && <NutritionalInfoModal list={list} onClose={() => setShowInfo(false)} />}
         
         {/* Header Gradiente + Capa */}
         <div className={`relative pt-12 px-3 pb-6 ${bgGradient} flex flex-col items-center shadow-[0_20px_50px_-10px_rgba(0,0,0,0.5)] z-10`}>
             <div className="w-full flex justify-between items-center mb-3">
                 <button onClick={onBack} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md hover:bg-black/40 transition-all">
                   <ChevronLeft size={24} />
                 </button>
                 {isOwner && (
                     <div className="flex gap-2">
                         <button onClick={onEdit} className="p-2 bg-black/20 rounded-full text-white backdrop-blur-md"><Edit2 size={18} /></button>
                         <button onClick={onDelete} className="p-2 bg-black/20 rounded-full text-red-400 backdrop-blur-md"><Trash2 size={18} /></button>
                     </div>
                 )}
             </div>

             <div className="w-48 h-48 shadow-[0_8px_40px_rgba(0,0,0,0.5)] bg-[#1c1c1e] mb-3 shrink-0 relative overflow-hidden rounded-xl">
                 {mealsWithImages.length > 0 && (
                    <div className="w-full h-full grid grid-cols-2">
                        {mealsWithImages.map((m: any, i: number) => (
                            <img key={i} src={m.image} className="w-full h-full object-cover" alt="" />
                        ))}
                        {Array.from({ length: 4 - mealsWithImages.length }).map((_, i) => (
                            <div key={i} className={`w-full h-full ${bgGradient}`} />
                        ))}
                    </div>
                 )}
                 
                 {/* Overlay escuro */}
                 <div className="absolute inset-0 bg-black/40" />
                 
                 {/* Ícone centralizado */}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <IconComponent size={64} className="text-white drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]" />
                  </div>
             </div>

             <div className="w-full text-left">
                <h1 className="text-sm font-black text-white mb-2 leading-tight tracking-tight line-clamp-2">{list.name}</h1>
                <div className="flex items-center gap-2 mb-3">
                   {list.authorPhoto ? (
                      <img src={list.authorPhoto} className="w-5 h-5 rounded-full object-cover border border-white/20" />
                   ) : (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                         <UserIcon size={12} className="text-white" />
                      </div>
                   )}
                   <span className="text-xs font-bold text-white">{list.authorName}</span>
                </div>
                <div className="flex items-center gap-3 text-[10px] font-bold text-white/60 uppercase tracking-widest mb-2">
                   <span>{new Date(list.createdAt).getFullYear()}</span>
                   <span>•</span>
                   <span className="flex items-center gap-1">
                      <BookMarked size={12} /> {list.savedCount || 0} Saves
                   </span>
                </div>

                {/* Descrição e Tags */}
                <div className="mb-2">
                    <p className="text-xs text-gray-300 leading-relaxed mb-3 line-clamp-3">{list.description}</p>
                    <div className="flex flex-wrap gap-2">
                        {(list.tags || []).map((tag: string) => (
                            <span key={tag} className="bg-white/10 text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                                {tag}
                            </span>
                        ))}
                        {list.type && (
                            <span className="bg-emerald-500/20 text-emerald-500 text-[9px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
                                {list.type}
                            </span>
                        )}
                    </div>
                </div>
             </div>
         </div>

         {/* Corpo com Lista */}
         <div className="flex-1 bg-black relative z-20 px-2 -mt-2 pt-4 overflow-y-auto pb-32 bg-gradient-to-b from-black/50 to-black">
             
             {/* Barra de Ações */}
             <div className="flex items-center justify-between mb-2 px-2">
                 <div className="flex items-center gap-2">
                     {(!isOwner && list.isPublic && list.allowSaving) && (
                        <button onClick={onSalvar} className="text-gray-400 hover:text-white transition-transform active:scale-90 flex flex-col items-center gap-1" title="Salvar em Álbum">
                           <BookMarked size={28} />
                        </button>
                     )}
                     <button onClick={() => setShowInfo(true)} className="text-gray-400 hover:text-white transition-transform active:scale-90 flex flex-col items-center gap-1">
                        <Info size={28} />
                     </button>
                 </div>

                 {/* Botão COMEÇAR */}
                 {(isOwner || list.allowSaving) && (
                     <button 
                        onClick={onComecar}
                        className="h-6 px-2 bg-emerald-500 rounded-full flex items-center justify-center text-black font-black uppercase text-xs tracking-widest gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all hover:scale-105"
                     >
                        <Play size={18} fill="currentColor" />
                        COMEÇAR
                     </button>
                 )}
             </div>

             {/* Stats Box Minimalista (Agora que tem modal de info) */}
             <div className="glass-panel p-3 rounded-lg mb-2">
                 <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Resumo Rápido</span>
                    <span className="text-emerald-500 font-black text-sm">{list.stats?.totalKcal} kcal</span>
                 </div>
             </div>

             {/* Lista de Refeições */}
             <div>
                <h3 className="text-sm font-bold text-white mb-2 px-2">Refeições ({list.meals?.length || 0})</h3>
                <div className="space-y-1">
                   {list.meals?.map((meal: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 py-3 px-2 rounded-md hover:bg-white/5 transition-colors group cursor-default">
                          <div className="w-6 text-center text-gray-500 font-bold text-sm shrink-0 group-hover:text-white transition-colors">
                             {idx + 1}
                          </div>

                          <div className="w-6 h-6 bg-zinc-900 rounded-lg overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
                             {meal.image ? (
                                <img src={meal.image} className="w-full h-full object-cover" alt="" />
                             ) : (
                                <Utensils size={14} className="text-gray-700" />
                             )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                              <p className={`font-bold text-white text-sm truncate ${isOwner ? 'group-hover:text-emerald-500' : ''} transition-colors`}>{meal.description}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[10px] font-bold text-gray-400 uppercase">{meal.kcal} kcal</span>
                                 {meal.protein && <span className="text-[10px] text-gray-500 font-bold">• P: {meal.protein}g</span>}
                              </div>
                          </div>
                      </div>
                   ))}
                </div>
             </div>
         </div>
      </div>
   );
};

// --- CREATE FOODLIST ---
const CreateFoodlist = ({ user, initialData, onClose, myFoodlistsCount }: any) => {
   const [formData, setFormData] = useState<Partial<Foodlist>>({
      name: '', description: '', goal: 'Geral', icon: 'Utensils', type: 'Almoço', isPublic: false, allowSaving: true,
      coverGradient: GRADIENTS[Math.floor(Math.random() * GRADIENTS.length)], meals: [], ...initialData
   });
   const [showMealSelector, setShowMealSelector] = useState(false);
   const [showIconSelector, setShowIconSelector] = useState(false);
   const [userLibrary, setUserLibrary] = useState<any[]>([]);
   const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
   const [limitAlert, setLimitAlert] = useState<{show: boolean, message: string}>({ show: false, message: '' });
   const [tagInput, setTagInput] = useState('');

   useEffect(() => {
      onValue(ref(db, `users/${user.id}/library`), snap => {
         const d = snap.val();
         setUserLibrary(d ? Object.values(d) : []);
      }, { onlyOnce: true });
   }, [user.id]);

   const handleAddTag = () => {
       if (!tagInput.trim()) return;
       if ((formData.tags?.length || 0) >= 4) return;
       
       const newTags = [...(formData.tags || []), tagInput.trim()];
       setFormData({ ...formData, tags: newTags });
       setTagInput('');
   };

   const removeTag = (tagToRemove: string) => {
       const newTags = (formData.tags || []).filter(t => t !== tagToRemove);
       setFormData({ ...formData, tags: newTags });
   };

   const addMealToList = (meal: any) => {
      if ((formData.meals?.length || 0) >= 24) {
          setLimitAlert({ show: true, message: "Você atingiu o limite máximo de 24 refeições por Foodlist." });
          return;
      }
      setFormData(prev => ({ ...prev, meals: [...(prev.meals || []), { id: Date.now().toString(), ...meal }] }));
      setShowMealSelector(false);
   };
   
   const removeMeal = (index: number) => {
      if(!formData.meals) return;
      const newMeals = [...formData.meals];
      newMeals.splice(index, 1);
      setFormData({ ...formData, meals: newMeals });
   };

   const handleDrop = (index: number) => {
      if (draggedItemIndex === null || !formData.meals) return;
      if (draggedItemIndex === index) return;

      const items = [...formData.meals];
      const [reorderedItem] = items.splice(draggedItemIndex, 1);
      items.splice(index, 0, reorderedItem);
      
      setFormData({ ...formData, meals: items });
      setDraggedItemIndex(null);
   };

   const handleSave = async () => {
      if(!formData.name) return alert("Dê um nome!");
      
      // Verificar limite de 4 foodlists criadas (apenas para criação nova)
      if (!initialData && myFoodlistsCount >= 4) {
          setLimitAlert({ show: true, message: "Você atingiu o limite de 4 Foodlists criadas! Remova alguma da aba 'Minhas' para criar novas." });
          return;
      }

      const meals = formData.meals || [];
      const stats = meals.reduce((acc, m) => ({
         totalKcal: acc.totalKcal + m.kcal, totalProtein: acc.totalProtein + (m.protein || 0), totalCarbs: acc.totalCarbs + (m.carbs || 0), totalFat: acc.totalFat + (m.fat || 0),
      }), { totalKcal: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 });
      
      const listId = initialData?.id || Date.now().toString();
      const payload: Foodlist = {
         ...formData, id: listId, name: formData.name!, icon: formData.icon || 'Utensils',
         coverGradient: formData.coverGradient!, meals, isPublic: !!formData.isPublic, allowSaving: !!formData.allowSaving, authorId: user.id,
         authorName: user.identity.name || 'Eu', authorPhoto: user.identity.photoURL, stats, createdAt: Date.now(), tags: formData.tags || []
      } as any;

      await set(ref(db, `users/${user.id}/foodlists/${listId}`), payload);
      
      if (formData.isPublic) {
          await set(ref(db, `global_foodlists/${listId}`), { ...payload, isPublic: true });
      } else if (initialData?.isPublic) {
          await remove(ref(db, `global_foodlists/${listId}`));
      }
      
      onClose();
   };

   if (showIconSelector) {
     // ... (keep existing code)
     return (
        <div className="fixed inset-0 z-[60] bg-black p-3 flex flex-col animate-slideUp">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-black text-white">Escolher Ícone</h3>
                <button onClick={() => setShowIconSelector(false)} className="p-3 bg-white/10 rounded-full"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-4 gap-2 overflow-y-auto pb-32">
                {Object.keys(ICON_MAP).map(iconName => {
                    const Icon = ICON_MAP[iconName];
                    return (
                        <button 
                            key={iconName}
                            onClick={() => { setFormData({...formData, icon: iconName}); setShowIconSelector(false); }}
                            className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-2 border transition-all ${formData.icon === iconName ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-zinc-900 text-gray-500 border-white/5 hover:bg-zinc-800'}`}
                        >
                            <Icon size={28} />
                        </button>
                    )
                })}
            </div>
        </div>
     );
   }

   if (showMealSelector) {
      // ... (keep existing code)
      return (
         <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl p-2 animate-slideUp">
            <div className="flex justify-between items-center mb-2"><h2 className="text-sm font-black text-white">Escolher Refeição</h2><button onClick={() => setShowMealSelector(false)} className="p-3 bg-white/10 rounded-full"><X size={20} /></button></div>
            <div className="space-y-2 overflow-y-auto h-full pb-32">
               {userLibrary.map((item, i) => (
                  <div key={i} onClick={() => addMealToList(item)} className="p-3 glass-panel rounded-md flex justify-between items-center active:bg-white/5 transition-all cursor-pointer"><span className="font-bold text-white">{item.description}</span><span className="text-emerald-500 font-bold text-xs">{item.kcal} kcal</span></div>
               ))}
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col h-full bg-black animate-slideUp p-2 pt-16">
         {limitAlert.show && <LimitAlert message={limitAlert.message} onClose={() => setLimitAlert({ show: false, message: '' })} />}
         <div className="flex justify-between items-center mb-1"><h2 className="text-base font-black text-white tracking-tight">{initialData ? 'Editar' : 'Nova'} Lista</h2><button onClick={onClose} className="p-3 bg-white/5 text-gray-500 rounded-full"><X size={24} /></button></div>
         <div className="space-y-2 flex-1 overflow-y-auto pb-32 pr-1">
            {/* ... rest of the component ... */}
            <div className="flex flex-col sm:flex-row gap-3">
               <div onClick={() => setShowIconSelector(true)} className={`w-20 h-20 rounded-[2rem] shadow-2xl shrink-0 bg-gradient-to-b ${TYPE_GRADIENTS[formData.type || ''] || 'from-zinc-700 to-zinc-900'} flex items-center justify-center overflow-hidden border border-white/10 cursor-pointer active:scale-95 transition-all relative group mx-auto sm:mx-0`}>
                  {React.createElement(ICON_MAP[formData.icon || 'Utensils'] as any, { className: "text-white/80 transition-opacity group-hover:opacity-40", size: 48 })}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Edit2 size={24} className="text-white drop-shadow-md" />
                  </div>
               </div>
               <div className="flex-1 space-y-2 pt-2">
                  <div>
                      <label className="text-xs font-bold text-gray-500 uppercase mb-1 block ml-1">Nome</label>
                      <input 
                        placeholder="Nome da Lista" 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})} 
                        maxLength={32}
                        className="w-full bg-zinc-900 text-base font-black text-white p-2 rounded-lg border border-white/10 focus:border-emerald-500 outline-none transition-all" 
                      />
                      <div className="text-[10px] text-gray-600 text-right mt-1 font-bold">{formData.name?.length || 0}/32</div>
                  </div>
                  
                  <div>
                      <textarea 
                        placeholder="Descrição (Biografia da Foodlist)" 
                        value={formData.description} 
                        onChange={e => setFormData({...formData, description: e.target.value})} 
                        maxLength={256}
                        className="w-full bg-zinc-900 text-sm font-medium text-gray-300 border border-white/10 rounded-lg p-2 outline-none focus:border-emerald-500 transition-all resize-none h-20 leading-relaxed"
                      />
                      <div className="text-[10px] text-gray-600 text-right mt-1 font-bold">{formData.description?.length || 0}/256</div>
                  </div>

                  {/* Tags Input */}
                  <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                          {(formData.tags || []).map(tag => (
                              <span key={tag} className="bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                                  {tag}
                                  <button onClick={() => removeTag(tag)}><X size={10} /></button>
                              </span>
                          ))}
                          {formData.type && (
                              <span className="bg-emerald-500/20 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-lg border border-emerald-500/20">
                                  {formData.type}
                              </span>
                          )}
                      </div>
                      
                      {(formData.tags?.length || 0) < 4 && (
                          <div className="flex gap-2 items-center bg-zinc-900 rounded-md px-3 border border-white/10 focus-within:border-emerald-500 transition-colors">
                              <input 
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleAddTag()}
                                maxLength={18}
                                placeholder="Adicionar tag..."
                                className="flex-1 bg-transparent border-none text-xs text-white py-3 outline-none font-bold placeholder:text-gray-600"
                              />
                              <button onClick={handleAddTag} disabled={!tagInput} className="text-emerald-500 p-1"><Plus size={16} /></button>
                          </div>
                      )}
                      <div className="text-[10px] text-gray-600 text-right font-bold">{tagInput.length}/18</div>
                  </div>
                  
                  {/* Tipo de Foodlist com estilo Zinc */}
                  <div className="relative">
                      <select 
                        value={formData.type} 
                        onChange={e => setFormData({...formData, type: e.target.value})}
                        className="w-full bg-zinc-900 text-white font-bold p-2 rounded-lg border border-white/10 outline-none appearance-none focus:border-emerald-500 transition-all cursor-pointer"
                      >
                        {FOODLIST_TYPES.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                         <ChevronDown size={20} />
                      </div>
                  </div>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
                <div onClick={() => setFormData({...formData, isPublic: !formData.isPublic})} className={`p-2 rounded-lg border-2 flex items-center gap-3 cursor-pointer ${formData.isPublic ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 bg-white/5'}`}>
                   {formData.isPublic ? <Globe size={20} className="text-emerald-500" /> : <Lock size={20} className="text-gray-500" />}
                   <span className={`text-xs font-bold uppercase ${formData.isPublic ? 'text-emerald-500' : 'text-gray-500'}`}>{formData.isPublic ? 'Pública' : 'Privada'}</span>
                </div>
                {formData.isPublic && (
                   <div onClick={() => setFormData({...formData, allowSaving: !formData.allowSaving})} className={`p-2 rounded-lg border-2 flex items-center gap-3 cursor-pointer ${formData.allowSaving ? 'border-blue-500 bg-blue-500/10' : 'border-white/10 bg-white/5'}`}>
                      <CheckCircle2 size={20} className={formData.allowSaving ? "text-blue-500" : "text-gray-500"} />
                      <span className={`text-xs font-bold uppercase ${formData.allowSaving ? 'text-blue-500' : 'text-gray-500'}`}>Permitir Cópia</span>
                   </div>
                )}
            </div>

            <div>
               <h3 className="text-xs font-black text-gray-500 uppercase mb-3">Refeições ({formData.meals?.length || 0})</h3>
               <div className="space-y-2 mb-2">
                  {formData.meals?.map((m: any, i) => (
                     <div 
                        key={m.id || i} 
                        draggable
                        onDragStart={() => setDraggedItemIndex(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleDrop(i)}
                        className={`glass-panel p-3 rounded-lg flex items-center justify-between group ${draggedItemIndex === i ? 'opacity-50 border-emerald-500 border-dashed' : ''}`}
                     >
                        <div className="flex items-center gap-3 overflow-hidden flex-1">
                           <div className="cursor-grab active:cursor-grabbing text-gray-600 hover:text-white transition-colors shrink-0">
                              <GripVertical size={20} />
                           </div>
                           
                           <div className="w-6 h-6 bg-black rounded-md overflow-hidden shrink-0 border border-white/5 relative">
                              {m.image ? (
                                 <img src={m.image} className="w-full h-full object-cover" alt="" />
                              ) : (
                                 <div className="w-full h-full flex items-center justify-center text-gray-700">
                                    <Utensils size={16} />
                                 </div>
                              )}
                           </div>

                           <div className="min-w-0 flex-1">
                              <p className="font-bold text-white text-sm truncate">{m.description}</p>
                              <p className="text-[10px] font-bold text-gray-500 uppercase">{m.kcal} kcal</p>
                           </div>
                        </div>
                        <button 
                           onClick={() => removeMeal(i)}
                           className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                        >
                           <Trash2 size={18} />
                        </button>
                     </div>
                  ))}
                  
                  {(!formData.meals || formData.meals.length === 0) && (
                     <div className="text-center py-2 text-gray-600 text-xs font-bold border-2 border-dashed border-white/5 rounded-lg">
                        Nenhuma refeição adicionada
                     </div>
                  )}
               </div>

               <button onClick={() => setShowMealSelector(true)} className="w-full py-2 border-2 border-dashed border-white/5 rounded-md text-gray-500 font-bold flex items-center justify-center gap-2 active:bg-white/5 transition-all hover:border-emerald-500/30 hover:text-emerald-500">
                  <Plus size={20} /> Adicionar da Biblioteca
               </button>
            </div>
         </div>
         <div className="pt-6"><button onClick={handleSave} className="w-full py-2 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-widest active:scale-95 transition-all">Salvar Playlist</button></div>
      </div>
   );
};


export const Library: React.FC<LibraryProps> = ({ user, onClose, onAddLog, onNavigateToWeeklyPlan }) => {
  const [activeTab, setActiveTab] = useState<'my' | 'explore' | 'saved_items' | 'saved_lists'>('my');
  const [myFoodlists, setMyFoodlists] = useState<Foodlist[]>([]);
  const [publicFoodlists, setPublicFoodlists] = useState<Foodlist[]>([]);
  const [savedItems, setSavedItems] = useState<any[]>([]);
  const [selectedFoodlist, setSelectedFoodlist] = useState<Foodlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado para visualização e edição de detalhes de item salvo
  const [viewingSavedItem, setViewingSavedItem] = useState<any | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [isEditing, setIsEditing] = useState(false);
  
  const [newTag, setNewTag] = useState(''); // Estado para input de nova tag

  // Estado para exclusão
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Seleção Múltipla e Exclusão em Lote
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false);
  const [limitAlert, setLimitAlert] = useState<{show: boolean, message: string}>({ show: false, message: '' });
  
  // --- FILTER STATES ---
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filterDateStart, setFilterDateStart] = useState('');
  const [filterDateEnd, setFilterDateEnd] = useState('');
  const [filterCreator, setFilterCreator] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterMinMeals, setFilterMinMeals] = useState('');
  const [filterMaxMeals, setFilterMaxMeals] = useState('');

  // State for Add Confirmation Modal
  const [showAddConfirmModal, setShowAddConfirmModal] = useState(false);
  const [itemToAdd, setItemToAdd] = useState<any>(null);

  const pressTimer = useRef<any>(null);
  const longPressTriggered = useRef(false);

  const resetFilters = () => {
      setFilterDateStart('');
      setFilterDateEnd('');
      setFilterCreator('');
      setFilterType('');
      setFilterMinMeals('');
      setFilterMaxMeals('');
      setShowFilterModal(false);
  };

  const applyFilters = (list: Foodlist) => {
      const matchesSearch = (list.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCreator = !filterCreator || (list.authorName || '').toLowerCase().includes(filterCreator.toLowerCase());
      const matchesType = !filterType || list.type === filterType;
      const matchesMinMeals = !filterMinMeals || (list.meals?.length || 0) >= Number(filterMinMeals);
      const matchesMaxMeals = !filterMaxMeals || (list.meals?.length || 0) <= Number(filterMaxMeals);
      
      let matchesDate = true;
      if (filterDateStart) {
          matchesDate = matchesDate && (list.createdAt || 0) >= new Date(filterDateStart).getTime();
      }
      if (filterDateEnd) {
          const endDate = new Date(filterDateEnd);
          endDate.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && (list.createdAt || 0) <= endDate.getTime();
      }

      return matchesSearch && matchesCreator && matchesType && matchesMinMeals && matchesMaxMeals && matchesDate;
  };


  useEffect(() => {
    onValue(ref(db, `users/${user.id}/foodlists`), (snap) => {
      const data = snap.val();
      setMyFoodlists(data ? Object.entries(data).map(([key, value]: any) => ({ ...value, id: key })) : []);
    });
    onValue(ref(db, `global_foodlists`), (snap) => {
      const data = snap.val();
      setPublicFoodlists(data ? Object.entries(data).map(([key, value]: any) => ({ ...value, id: key })) : []);
    });
    onValue(ref(db, `users/${user.id}/library`), (snap) => {
      const data = snap.val();
      setSavedItems(data ? Object.entries(data).map(([key, value]: any) => ({ ...value, id: key })) : []);
    });
  }, [user.id]);

  // --- SELECTION HANDLERS ---
  const startPress = (id: string) => {
    pressTimer.current = setTimeout(() => {
      setIsSelectionMode(true);
      setSelectedIds([id]);
      longPressTriggered.current = true; // Marca que acabamos de ativar via long press
      
      // Haptic Feedback
      if (navigator.vibrate) navigator.vibrate(50);
    }, 800); // 800ms para ativar seleção
  };

  const cancelPress = () => {
    if (pressTimer.current) {
      clearTimeout(pressTimer.current);
      pressTimer.current = null;
    }
  };

  const handleItemClick = (item: any) => {
    // Se este clique for o "soltar" do dedo que ativou o long press, ignoramos
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }

    if (isSelectionMode) {
      if (selectedIds.includes(item.id)) {
        const newIds = selectedIds.filter(id => id !== item.id);
        setSelectedIds(newIds);
        if (newIds.length === 0) setIsSelectionMode(false);
      } else {
        setSelectedIds([...selectedIds, item.id]);
      }
    } else {
      setViewingSavedItem(item);
      setEditForm(item);
      setIsEditing(false);
    }
  };

  const openBatchDeleteModal = () => {
     if (selectedIds.length > 0) {
         setShowBatchDeleteConfirm(true);
     }
  };

  const executeBatchDelete = async () => {
     setIsDeleting(true);
     const updates: any = {};
     selectedIds.forEach(id => {
         updates[id] = null;
     });
     await update(ref(db, `users/${user.id}/library`), updates);
     setIsSelectionMode(false);
     setSelectedIds([]);
     setShowBatchDeleteConfirm(false);
     setIsDeleting(false);
  };

  const handleAddMealToDay = (item: any) => {
     setItemToAdd(item);
     setShowAddConfirmModal(true);
  };

  const confirmAddMeal = () => {
      if (onAddLog && itemToAdd) {
          onAddLog(itemToAdd);
      }
      setShowAddConfirmModal(false);
      setItemToAdd(null);
  };

  const handleComecar = async (list: Foodlist) => {
    const isMine = list.authorId === user.id;
    const isSaved = (list as any).isCloned;

    if (!isMine && !isSaved) {
        // Verificar limite de 4 foodlists salvas (clonadas)
        const savedCount = myFoodlists.filter((l: any) => l.isCloned).length;
        if (savedCount >= 4) {
            setLimitAlert({ show: true, message: "Você atingiu o limite de 4 Foodlists salvas! Remova alguma da aba 'Salvos' para salvar novas e poder planejar." });
            return;
        }

        // Salvar automaticamente
        const newId = Date.now().toString();
        const copy = { 
           ...list, 
           id: newId, 
           authorId: user.id, 
           authorName: user.identity.name || 'Eu', 
           authorPhoto: user.identity.photoURL,
           isPublic: false, 
           savedCount: 0, 
           createdAt: Date.now(),
           isCloned: true 
        };
        await set(ref(db, `users/${user.id}/foodlists/${newId}`), copy);

        if (list.isPublic) {
           const currentCount = list.savedCount || 0;
           await update(ref(db, `global_foodlists/${list.id}`), { savedCount: currentCount + 1 });
        }
        
        alert("Foodlist salva! pode organizar-lá agora!");
        
        if (onNavigateToWeeklyPlan) {
            onNavigateToWeeklyPlan(copy as Foodlist);
            return;
        }
    } else {
        if (onNavigateToWeeklyPlan) {
            onNavigateToWeeklyPlan(list);
            return;
        }
    }
    
    onClose();
  };

  const handleSalvarCopia = async (list: Foodlist) => {
    // Verificar limite de 4 foodlists salvas (clonadas)
    const savedCount = myFoodlists.filter((l: any) => l.isCloned).length;
    if (savedCount >= 4) {
        setLimitAlert({ show: true, message: "Você atingiu o limite de 4 Foodlists salvas! Remova alguma da aba 'Salvos' para salvar novas." });
        return;
    }

    const newId = Date.now().toString();
    const copy = { 
       ...list, 
       id: newId, 
       authorId: user.id, 
       authorName: user.identity.name || 'Eu', 
       isPublic: false, 
       savedCount: 0, 
       createdAt: Date.now(),
       isCloned: true // Marca como lista salva/clonada
    };
    await set(ref(db, `users/${user.id}/foodlists/${newId}`), copy);

    // INCREMENTAR O CONTADOR ORIGINAL SE FOR PÚBLICA
    if (list.isPublic) {
       const currentCount = list.savedCount || 0;
       await update(ref(db, `global_foodlists/${list.id}`), { savedCount: currentCount + 1 });
    }

    alert("Salva no seu álbum 'Foodlist Salvos'!");
    setActiveTab('saved_lists');
    setSelectedFoodlist(null);
  };

  const executeDelete = async () => {
     if (!selectedFoodlist) return;
     setIsDeleting(true);
     await remove(ref(db, `users/${user.id}/foodlists/${selectedFoodlist.id}`));
     if (selectedFoodlist.isPublic) {
         await remove(ref(db, `global_foodlists/${selectedFoodlist.id}`));
     }
     setShowDeleteConfirm(false);
     setSelectedFoodlist(null);
     setIsDeleting(false);
  };

  const handleUpdateItem = async () => {
      if (!viewingSavedItem) return;
      const updates = {
          description: editForm.description,
          kcal: Number(editForm.kcal),
          protein: Number(editForm.protein),
          carbs: Number(editForm.carbs),
          fat: Number(editForm.fat)
      };
      
      await update(ref(db, `users/${user.id}/library/${viewingSavedItem.id}`), updates);
      setViewingSavedItem({ ...viewingSavedItem, ...updates });
      setIsEditing(false);
  };

  // --- GERENCIAMENTO DE TAGS (INGREDIENTES) ---
  const handleRemoveTag = async (tagToRemove: string) => {
    if (!viewingSavedItem) return;
    const updatedTags = (viewingSavedItem.tags || []).filter((t: string) => t !== tagToRemove);
    
    setViewingSavedItem({ ...viewingSavedItem, tags: updatedTags });
    await update(ref(db, `users/${user.id}/library/${viewingSavedItem.id}`), { tags: updatedTags });
  };

  const handleAddTag = async () => {
    if (!viewingSavedItem || !newTag.trim()) return;
    const currentTags = viewingSavedItem.tags || [];
    const updatedTags = [...currentTags, newTag.trim()];
    
    setViewingSavedItem({ ...viewingSavedItem, tags: updatedTags });
    await update(ref(db, `users/${user.id}/library/${viewingSavedItem.id}`), { tags: updatedTags });
    setNewTag('');
  };

  // --- RENDERIZAR DETALHES DE ITEM SALVO (NOVO LAYOUT) ---
  if (viewingSavedItem) {
     return (
       <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 animate-fadeIn">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setViewingSavedItem(null)}></div>
          
          <div className="relative bg-[#18181b] w-full max-w-sm rounded-[2rem] p-0 shadow-2xl border border-white/5 overflow-hidden flex flex-col max-h-[85vh]">
             {/* Header com Botão Fechar e Editar */}
             <div className="absolute top-4 right-4 z-20 flex gap-2">
                <button 
                   onClick={() => {
                      if (isEditing) {
                         handleUpdateItem();
                      } else {
                         setEditForm({
                            description: viewingSavedItem.description,
                            kcal: viewingSavedItem.kcal,
                            protein: viewingSavedItem.protein,
                            carbs: viewingSavedItem.carbs,
                            fat: viewingSavedItem.fat
                         });
                         setIsEditing(true);
                      }
                   }} 
                   className={`p-2 backdrop-blur-md rounded-full text-white/70 hover:text-white transition-colors border border-white/5 ${isEditing ? 'bg-emerald-500/20 text-emerald-500' : 'bg-black/40'}`}
                >
                   {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                </button>
                <button onClick={() => setViewingSavedItem(null)} className="p-2 bg-black/40 backdrop-blur-md rounded-full text-white/70 hover:bg-black/60 hover:text-white transition-colors border border-white/5">
                   <X size={16} />
                </button>
             </div>

             {/* CONTEÚDO SCROLLÁVEL */}
             <div className="flex-1 overflow-y-auto">
                {/* FOTO - Quadrada 1:1 com bordas redondas */}
                <div className="p-3 pb-0">
                   <div className="aspect-square w-full bg-zinc-900 rounded-[2rem] overflow-hidden relative shadow-2xl border border-white/5">
                      {viewingSavedItem.image ? (
                         <img src={viewingSavedItem.image} className="w-full h-full object-cover" />
                      ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                            <Utensils size={32} className="mb-2 opacity-50" />
                            <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sem Imagem</span>
                         </div>
                      )}
                   </div>
                </div>

                <div className="p-3">
                   {/* DADOS NOMINAIS */}
                   <div className="mb-3">
                      {isEditing ? (
                         <input 
                            value={editForm.description} 
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                            className="w-full bg-white/5 text-base font-bold text-white p-2 rounded-md outline-none border border-white/10 focus:border-emerald-500 mb-2"
                         />
                      ) : (
                         <h2 className="text-base font-bold text-white leading-tight mb-1">{viewingSavedItem.description}</h2>
                      )}
                      
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400">
                         <Calendar size={10} />
                         <span className="uppercase tracking-wide">Adicionado em {new Date(Number(viewingSavedItem.id) || Date.now()).toLocaleDateString()}</span>
                      </div>
                   </div>

                   {/* DADOS TÉCNICOS (Grid de Macros) */}
                   <div className="bg-[#27272a]/40 rounded-lg p-2 mb-3 border border-white/5 backdrop-blur-sm">
                       <div className="flex items-baseline gap-1 mb-2">
                          {isEditing ? (
                             <input 
                                type="number"
                                value={editForm.kcal}
                                onChange={e => setEditForm({...editForm, kcal: e.target.value})}
                                className="bg-white/5 text-base font-black text-white w-20 p-1 rounded-lg outline-none border border-white/10 focus:border-emerald-500"
                             />
                          ) : (
                             <span className="text-base font-black text-white tracking-tighter">{viewingSavedItem.kcal}</span>
                          )}
                          <span className="text-[10px] font-bold text-gray-500 uppercase">Kcal</span>
                       </div>

                       <div className="grid grid-cols-3 gap-2">
                          <div className="bg-black/20 p-2.5 rounded-md text-center border border-white/5">
                             <span className="block text-[8px] font-black text-blue-400 uppercase tracking-widest mb-0.5">PROT</span>
                             {isEditing ? (
                                <input 
                                   type="number" 
                                   value={editForm.protein}
                                   onChange={e => setEditForm({...editForm, protein: e.target.value})}
                                   className="w-full bg-white/5 text-xs font-bold text-white text-center p-1 rounded outline-none border border-white/10 focus:border-blue-500"
                                />
                             ) : (
                                <span className="text-xs font-bold text-white">{viewingSavedItem.protein}g</span>
                             )}
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-md text-center border border-white/5">
                             <span className="block text-[8px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">CARB</span>
                             {isEditing ? (
                                <input 
                                   type="number" 
                                   value={editForm.carbs}
                                   onChange={e => setEditForm({...editForm, carbs: e.target.value})}
                                   className="w-full bg-white/5 text-xs font-bold text-white text-center p-1 rounded outline-none border border-white/10 focus:border-emerald-500"
                                />
                             ) : (
                                <span className="text-xs font-bold text-white">{viewingSavedItem.carbs}g</span>
                             )}
                          </div>
                          <div className="bg-black/20 p-2.5 rounded-md text-center border border-white/5">
                             <span className="block text-[8px] font-black text-yellow-400 uppercase tracking-widest mb-0.5">GORD</span>
                             {isEditing ? (
                                <input 
                                   type="number" 
                                   value={editForm.fat}
                                   onChange={e => setEditForm({...editForm, fat: e.target.value})}
                                   className="w-full bg-white/5 text-xs font-bold text-white text-center p-1 rounded outline-none border border-white/10 focus:border-yellow-500"
                                />
                             ) : (
                                <span className="text-xs font-bold text-white">{viewingSavedItem.fat}g</span>
                             )}
                          </div>
                       </div>
                   </div>

                   {/* INGREDIENTES / TAGS */}
                   <div className="mb-20">
                      <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
                         <Tag size={12} className="text-gray-500" />
                         <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Ingredientes / Tags</h3>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                         {(viewingSavedItem.tags || []).map((tag: string, idx: number) => (
                            <div key={idx} className="bg-white/5 border border-white/10 rounded-lg pl-3 pr-2 py-1.5 flex items-center gap-2 group hover:border-white/20 transition-all">
                               <span className="text-[10px] font-bold text-gray-300">{tag}</span>
                               <button 
                                  onClick={() => handleRemoveTag(tag)}
                                  className="text-gray-600 hover:text-red-500 transition-colors p-0.5 hover:bg-white/5 rounded"
                               >
                                  <X size={10} />
                               </button>
                            </div>
                         ))}
                         
                         {(!viewingSavedItem.tags || viewingSavedItem.tags.length === 0) && (
                            <span className="text-[10px] text-gray-600 font-medium italic py-2">Nenhum ingrediente listado.</span>
                         )}
                      </div>

                      {/* Input para adicionar nova tag */}
                      <div className="flex gap-2 items-center bg-white/5 rounded-md px-3 border border-white/5 focus-within:border-emerald-500/50 transition-colors">
                         <Plus size={12} className="text-gray-500" />
                         <input 
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            placeholder="Adicionar ingrediente..."
                            className="bg-transparent border-none text-[10px] text-white py-3 outline-none w-full placeholder:text-gray-600 font-medium"
                            onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                         />
                         {newTag && (
                             <button 
                                onClick={handleAddTag} 
                                className="text-emerald-500 font-bold text-[10px] uppercase px-2 py-1 bg-emerald-500/10 rounded-md hover:bg-emerald-500/20"
                             >
                                Add
                             </button>
                         )}
                      </div>
                   </div>
                </div>
             </div>

             {/* BOTÃO FLUTUANTE DE ADICIONAR */}
             <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-[#18181b] via-[#18181b] to-transparent pointer-events-none">
                 <button 
                    onClick={() => handleAddMealToDay(viewingSavedItem)}
                    className="w-full py-3.5 bg-white text-black rounded-md font-black uppercase tracking-widest text-[10px] hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/50 pointer-events-auto active:scale-95 border border-white/20"
                 >
                    <Plus size={14} /> Adicionar ao Dia
                 </button>
             </div>
          </div>
       </div>
     );
  }

  if (selectedFoodlist && !isCreating) {
     return (
       <div className="h-full bg-[#000]">
          <FoodlistDetail 
             list={selectedFoodlist} 
             user={user} 
             onBack={() => setSelectedFoodlist(null)} 
             onComecar={() => handleComecar(selectedFoodlist)}
             onSalvar={() => handleSalvarCopia(selectedFoodlist)}
             onEdit={() => setIsCreating(true)}
             onDelete={() => setShowDeleteConfirm(true)}
          />
          {showDeleteConfirm && (
             <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 animate-fadeIn">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => !isDeleting && setShowDeleteConfirm(false)}></div>
               <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-2 border border-white/10 shadow-2xl animate-slideUp">
                 <div className="flex flex-col items-center text-center space-y-3">
                   <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500"><AlertTriangle size={32} /></div>
                   <h3 className="text-base font-black text-white">Excluir Playlist?</h3>
                   <div className="w-full space-y-3">
                     <button onClick={executeDelete} disabled={isDeleting} className="w-full py-2 bg-red-500 text-white rounded-lg font-black text-xs uppercase tracking-widest">{isDeleting ? "Excluindo..." : "Sim, Excluir"}</button>
                     <button onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting} className="w-full py-2 bg-white/5 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-widest">Cancelar</button>
                   </div>
                 </div>
               </div>
             </div>
          )}
       </div>
     );
  }

  if (isCreating) {
     const createdCount = myFoodlists.filter((l: any) => !l.isCloned).length;
     return <CreateFoodlist user={user} initialData={selectedFoodlist} onClose={() => { setIsCreating(false); setSelectedFoodlist(null); }} myFoodlistsCount={createdCount} />;
  }

  return (
    <div className="flex flex-col h-full pt-6 px-3 animate-fadeIn bg-[#09090b]">
       {limitAlert.show && <LimitAlert message={limitAlert.message} onClose={() => setLimitAlert({ show: false, message: '' })} />}
       <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {isSelectionMode ? (
              <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]); }} className="p-3 bg-white/10 text-white rounded-full active:scale-95 transition-all">
                Cancelar
              </button>
            ) : (
              <button onClick={onClose} className="p-3 bg-zinc-900 rounded-full border border-white/5 active:scale-95 transition-all"><ChevronLeft size={20} /></button>
            )}
            <h1 className="text-sm font-black text-white tracking-tight">
              {isSelectionMode ? `${selectedIds.length} Selecionados` : 'Biblioteca'}
            </h1>
          </div>
          
          {isSelectionMode ? (
            <button 
              onClick={openBatchDeleteModal} 
              className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white active:scale-90 transition-all shadow-lg"
              disabled={selectedIds.length === 0}
            >
              <Trash2 size={24} />
            </button>
          ) : (
            <button onClick={() => { setSelectedFoodlist(null); setIsCreating(true); }} className="w-6 h-6 bg-white rounded-full flex items-center justify-center text-black active:scale-90 transition-all shadow-lg"><Plus size={24} /></button>
          )}
       </div>
       
       <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar py-1">
          {[
            {id:'my', label:'MINHAS'}, 
            {id:'saved_lists', label:'SALVOS'}, 
            {id:'saved_items', label:'REFEIÇÕES'}, 
            {id:'explore', label:'EXPLORAR'}
          ].map(tab => (
             <button 
               key={tab.id} 
               onClick={() => setActiveTab(tab.id as any)} 
               className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-gray-500 hover:text-gray-300'}`}
             >
                {tab.label}
             </button>
          ))}
       </div>

       <div className="relative mb-3 flex gap-2">
          <div className="relative flex-1">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
             <input 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                placeholder="Buscar..." 
                className="w-full bg-zinc-900 text-white pl-12 pr-4 py-2 rounded-lg border border-white/5 focus:border-emerald-500/50 outline-none font-bold"
             />
          </div>
          <button 
             onClick={() => setShowFilterModal(true)}
             className={`p-2 rounded-lg border transition-all active:scale-95 ${
                 filterDateStart || filterDateEnd || filterCreator || filterType || filterMinMeals || filterMaxMeals 
                 ? 'bg-emerald-500 text-black border-emerald-500' 
                 : 'bg-zinc-900 text-gray-500 border-white/5 hover:text-white'
             }`}
          >
             <Filter size={20} />
          </button>
       </div>

       {/* --- FILTER MODAL --- */}
       {showFilterModal && (
           <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center sm:p-3 animate-fadeIn">
               <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={() => setShowFilterModal(false)}></div>
               <div className="relative bg-[#1c1c1e] w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] p-3 shadow-2xl border-t sm:border border-white/10 max-h-[90vh] flex flex-col animate-slideUp">
                   <div className="flex justify-between items-center mb-3">
                       <h3 className="text-base font-black text-white">Filtros</h3>
                       <button onClick={() => setShowFilterModal(false)} className="p-2 bg-white/5 rounded-full"><X size={20} /></button>
                   </div>

                   <div className="space-y-3 overflow-y-auto pb-8">
                       {/* Data */}
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Data de Criação</label>
                           <div className="flex gap-2">
                               <input type="date" value={filterDateStart} onChange={e => setFilterDateStart(e.target.value)} className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 text-xs font-bold" />
                               <input type="date" value={filterDateEnd} onChange={e => setFilterDateEnd(e.target.value)} className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 text-xs font-bold" />
                           </div>
                       </div>

                       {/* Criador */}
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Criador</label>
                           <input value={filterCreator} onChange={e => setFilterCreator(e.target.value)} placeholder="Nome do autor..." className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 font-bold" />
                       </div>

                       {/* Categoria */}
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Categoria</label>
                           <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 font-bold appearance-none">
                               <option value="">Todas</option>
                               {FOODLIST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                           </select>
                       </div>

                       {/* Qtd Refeições */}
                       <div>
                           <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Qtd. Refeições</label>
                           <div className="flex gap-2 items-center">
                               <input type="number" placeholder="Min" value={filterMinMeals} onChange={e => setFilterMinMeals(e.target.value)} className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 font-bold text-center" />
                               <span className="text-gray-500 font-bold">-</span>
                               <input type="number" placeholder="Max" value={filterMaxMeals} onChange={e => setFilterMaxMeals(e.target.value)} className="w-full bg-black/40 text-white p-3 rounded-md border border-white/5 outline-none focus:border-emerald-500 font-bold text-center" />
                           </div>
                       </div>
                   </div>

                   <div className="flex gap-3 mt-2 pt-4 border-t border-white/5">
                       <button onClick={resetFilters} className="flex-1 py-2 bg-white/5 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                           Limpar
                       </button>
                       <button onClick={() => setShowFilterModal(false)} className="flex-[2] py-2 bg-emerald-500 text-black rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20">
                           Aplicar Filtros
                       </button>
                   </div>
               </div>
           </div>
       )}

       <div className="flex-1 overflow-y-auto pb-32 pr-1 space-y-2">
          {activeTab === 'saved_items' ? (
             <div className="space-y-3">
                {savedItems.filter(i => i.description.toLowerCase().includes(searchTerm.toLowerCase())).map(item => (
                   <div 
                     key={item.id} 
                     onClick={() => handleItemClick(item)}
                     onTouchStart={() => startPress(item.id)}
                     onTouchEnd={cancelPress}
                     onTouchMove={cancelPress}
                     onMouseDown={() => startPress(item.id)}
                     onMouseUp={cancelPress}
                     onMouseLeave={cancelPress}
                     className={`bg-zinc-900 p-2 rounded-md border transition-all flex items-center gap-2 cursor-pointer active:scale-95 relative overflow-hidden ${isSelectionMode && selectedIds.includes(item.id) ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/5'}`}
                   >
                      {isSelectionMode && (
                        <div className="shrink-0 animate-fadeIn">
                          {selectedIds.includes(item.id) ? (
                            <CheckCircle2 size={24} className="text-emerald-500" fill="currentColor" color="black" />
                          ) : (
                            <Circle size={24} className="text-gray-500" />
                          )}
                        </div>
                      )}

                      <div className="w-6 h-6 bg-black rounded-lg overflow-hidden shrink-0 border border-white/5 relative">
                         {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <Utensils size={20} className="text-gray-700 m-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                         <h3 className="font-bold text-white text-sm truncate">{item.description}</h3>
                         <p className="text-[10px] font-black text-emerald-500 uppercase">{item.kcal} kcal</p>
                      </div>
                      
                      {!isSelectionMode && (
                        <button 
                          onClick={(e) => { e.stopPropagation(); handleAddMealToDay(item); }}
                          className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white hover:bg-white/10"
                        >
                          <Plus size={20} />
                        </button>
                      )}
                   </div>
                ))}
             </div>
          ) : (
             <div className="grid grid-cols-2 gap-2">
                {(activeTab === 'my' 
                    ? myFoodlists.filter(l => !(l as any).isCloned) 
                    : activeTab === 'saved_lists'
                        ? myFoodlists.filter(l => (l as any).isCloned)
                        : publicFoodlists
                 )
                   .filter(applyFilters)
                   .map(list => <FoodlistCard key={list.id} list={list} onSelect={setSelectedFoodlist} />)
                }
                
                {activeTab === 'saved_lists' && myFoodlists.filter(l => (l as any).isCloned).length === 0 && (
                   <div className="col-span-2 text-center py-2 text-gray-500 text-xs font-bold opacity-50">
                      Nenhuma lista salva ainda. Explore e salve!
                   </div>
                )}
             </div>
          )}
       </div>

       {showBatchDeleteConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 animate-fadeIn">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowBatchDeleteConfirm(false)}></div>
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-2 border border-white/10 shadow-2xl animate-slideUp">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-6 h-6 bg-red-500/20 rounded-lg flex items-center justify-center text-red-500">
                        <Trash2 size={32} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">Excluir {selectedIds.length} itens?</h3>
                        <p className="text-sm text-gray-500 font-medium mt-2">Esta ação não pode ser desfeita.</p>
                    </div>
                    <div className="w-full space-y-3">
                        <button onClick={executeBatchDelete} disabled={isDeleting} className="w-full py-2 bg-red-500 text-white rounded-lg font-black text-xs uppercase tracking-widest hover:bg-red-600 transition-colors">
                            {isDeleting ? "Excluindo..." : "Sim, Excluir"}
                        </button>
                        <button onClick={() => setShowBatchDeleteConfirm(false)} disabled={isDeleting} className="w-full py-2 bg-white/5 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}

    {showAddConfirmModal && itemToAdd && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 animate-fadeIn">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowAddConfirmModal(false)}></div>
            <div className="relative bg-[#1c1c1e] w-full max-w-sm rounded-[2.5rem] p-2 border border-white/10 shadow-2xl animate-slideUp">
                <div className="flex flex-col items-center text-center space-y-3">
                    <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-500">
                        <Utensils size={32} />
                    </div>
                    <div>
                        <h3 className="text-base font-black text-white">Adicionar à Linha do Tempo?</h3>
                        <p className="text-sm text-gray-500 font-medium mt-2">
                            Deseja adicionar <span className="text-white font-bold">"{itemToAdd.description}"</span> ao seu dia de hoje?
                        </p>
                    </div>
                    <div className="w-full space-y-3">
                        <button 
                            onClick={confirmAddMeal} 
                            className="w-full py-2 bg-emerald-500 text-black rounded-lg font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                        >
                            Sim, Adicionar
                        </button>
                        <button 
                            onClick={() => setShowAddConfirmModal(false)} 
                            className="w-full py-2 bg-white/5 text-gray-400 rounded-lg font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-colors"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )}
    </div>
  );
};
