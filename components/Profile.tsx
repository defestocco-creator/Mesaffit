
import React, { useState, useRef } from 'react';
import { UserData, GoalType } from '../types';
import { ref, update } from "firebase/database";
import { auth, db } from '../firebase';
import { User, LogOut, Save, Camera, X, Edit2, ChevronRight, Plus, Trash2, Settings } from 'lucide-react';

interface ProfileProps {
  user: UserData;
  onLogout: () => void;
}

const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('Canvas context error');
        
        // Calculate aspect ratio to crop center
        const scale = Math.max(128 / img.width, 128 / img.height);
        const x = (128 - img.width * scale) / 2;
        const y = (128 - img.height * scale) / 2;
        
        ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

export const Profile: React.FC<ProfileProps> = ({ user, onLogout }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSettings, setIsSettings] = useState(false);
  
  // Form States
  const [name, setName] = useState(user.identity.name || '');
  const [fullName, setFullName] = useState(user.identity.fullName || '');
  const [phone, setPhone] = useState(user.identity.phone || '');
  const [theme, setTheme] = useState(user.theme || 'dark');
  const [photoURL, setPhotoURL] = useState(user.identity.photoURL || '');
  const [weight, setWeight] = useState(user.identity.weight);
  const [height, setHeight] = useState(user.identity.height);
  const [age, setAge] = useState(user.identity.age);
  const [gender, setGender] = useState(user.identity.gender);
  const [goal, setGoal] = useState(user.primaryGoal);
  
  // Context States
  const [hasKids, setHasKids] = useState(user.context.hasKids);
  const [kids, setKids] = useState(user.context.family || []);
  const [workType, setWorkType] = useState(user.context.workType);
  const [trains, setTrains] = useState(user.context.trains);
  const [eatOutFreq, setEatOutFreq] = useState(user.context.eatOutFrequency);
  const [waterGoal, setWaterGoal] = useState(user.context.waterIntakeGoal);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notificationStatus, setNotificationStatus] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }
    
    if (Notification.permission === 'denied') {
      alert("As notificações estão bloqueadas. Por favor, habilite nas configurações do seu navegador.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationStatus(permission);
      
      if (permission === 'granted') {
        try {
          new Notification("MesaFit", {
            body: "Notificações ativadas com sucesso!",
            icon: "/favicon.ico"
          });
        } catch (e) {
          console.log("Notificação de teste falhou (comum em mobile sem SW):", e);
        }
      }
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      alert("Erro ao solicitar permissão de notificação.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const resized = await resizeImage(file);
        setPhotoURL(resized);
      } catch (err) {
        console.error("Error processing image", err);
      }
    }
  };

  const handleSave = async () => {
    const updates: any = {
      'profile/identity/name': name,
      'profile/identity/photoURL': photoURL,
      'profile/identity/weight': Number(weight),
      'profile/identity/height': Number(height),
      'profile/identity/age': Number(age),
      'profile/identity/gender': gender,
      'profile/primaryGoal': goal,
      'profile/context/hasKids': hasKids,
      'profile/context/family': kids,
      'profile/context/workType': workType,
      'profile/context/trains': trains,
      'profile/context/eatOutFrequency': Number(eatOutFreq),
      'profile/context/waterIntakeGoal': Number(waterGoal)
    };

    await update(ref(db, `users/${user.id}`), updates);
    setIsEditing(false);
  };

  const handleSaveSettings = async () => {
    const updates: any = {
      'profile/identity/fullName': fullName,
      'profile/identity/phone': phone,
      'profile/theme': theme
    };

    await update(ref(db, `users/${user.id}`), updates);
    setIsSettings(false);
  };

  const handleLogout = () => {
    auth.signOut();
    onLogout();
  };

  const addKid = () => {
    const newKid = { id: Date.now().toString(), name: '', age: 0 };
    setKids([...kids, newKid]);
  };

  const updateKid = (index: number, field: string, value: any) => {
    const newKids = [...kids];
    newKids[index] = { ...newKids[index], [field]: value };
    setKids(newKids);
  };

  const removeKid = (index: number) => {
    const newKids = [...kids];
    newKids.splice(index, 1);
    setKids(newKids);
  };

  if (isSettings) {
    return (
      <div className="flex flex-col h-full animate-slideUp p-4 pt-20 pb-24">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-black text-white">Configurações</h2>
           <button onClick={() => setIsSettings(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
              <X size={18} />
           </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
           <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dados Pessoais</h3>
              
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome Completo</label>
                 <input 
                    value={fullName} 
                    onChange={e => setFullName(e.target.value)} 
                    className="w-full bg-black/40 text-white px-4 py-3.5 rounded-xl border border-white/5 focus:border-emerald-500 outline-none font-bold text-base mt-1" 
                    placeholder="Seu nome completo"
                 />
              </div>
              
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase ml-1">Telefone</label>
                 <input 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    type="tel"
                    className="w-full bg-black/40 text-white px-4 py-3.5 rounded-xl border border-white/5 focus:border-emerald-500 outline-none font-bold text-base mt-1" 
                    placeholder="(00) 00000-0000"
                 />
              </div>
           </div>

           <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Aparência</h3>
              
              <div className="flex items-center justify-between bg-black/40 p-3 rounded-xl border border-white/5">
                 <span className="text-sm font-bold text-white">Tema Claro</span>
                 <button 
                    onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} 
                    className={`w-10 h-6 rounded-full transition-colors relative ${theme === 'light' ? 'bg-emerald-500' : 'bg-zinc-700'}`}
                 >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all`} style={{ left: theme === 'light' ? 'calc(100% - 20px)' : '4px' }} />
                 </button>
              </div>
              <p className="text-xs text-gray-500">O tema claro será aplicado em todo o aplicativo.</p>
           </div>

           <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notificações</h3>
              
              <div className="flex items-center justify-between bg-black/40 p-4 rounded-xl border border-white/5">
                 <span className="text-base font-bold text-white">Lembretes</span>
                 <button 
                    onClick={handleRequestNotificationPermission}
                    className={`px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${
                       notificationStatus === 'granted' 
                       ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                       : 'bg-emerald-500 text-black'
                    }`}
                 >
                    {notificationStatus === 'granted' ? 'Ativado' : 'Ativar'}
                 </button>
              </div>
              <p className="text-sm text-gray-500">Receba avisos para suas refeições planejadas e hidratação.</p>
           </div>
        </div>

        <button onClick={handleSaveSettings} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 mt-4 text-xs">
           <Save size={16} /> Salvar Configurações
        </button>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="flex flex-col h-full animate-slideUp p-4 pt-20 pb-24">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-xl font-black text-white">Editar Perfil</h2>
           <button onClick={() => setIsEditing(false)} className="p-2 bg-white/5 rounded-full text-gray-400 hover:text-white">
              <X size={18} />
           </button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 custom-scrollbar">
           {/* Header Compacto: Foto + Nome + Meta */}
           <div className="bg-[#18181b] p-5 rounded-2xl border border-white/5 flex items-center gap-4">
              <div className="relative group cursor-pointer shrink-0" onClick={() => fileInputRef.current?.click()}>
                 <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-emerald-500/20 group-hover:border-emerald-500 transition-colors bg-zinc-800 flex items-center justify-center">
                    {photoURL ? (
                      <img src={photoURL} className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-gray-500" />
                    )}
                 </div>
                 <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera size={20} className="text-white" />
                 </div>
                 <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </div>
              
              <div className="flex-1 space-y-3">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Nome (max 24)</label>
                    <input 
                       value={name} 
                       onChange={e => setName(e.target.value)} 
                       maxLength={24}
                       className="w-full bg-black/40 text-white px-4 py-2.5 rounded-xl border border-white/5 focus:border-emerald-500 outline-none font-bold text-base" 
                       placeholder="Seu nome"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase ml-1">Objetivo</label>
                    <select value={goal} onChange={e => setGoal(e.target.value as any)} className="w-full bg-black/40 text-white px-4 py-2.5 rounded-xl border border-white/5 outline-none font-bold text-sm appearance-none truncate">
                        {Object.values(GoalType).map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
              </div>
           </div>

           {/* Biometria Compacta */}
           <div className="bg-[#18181b] p-4 rounded-3xl border border-white/5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Biometria</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Idade</label>
                    <input type="number" value={age} onChange={e => setAge(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                 </div>
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Gênero</label>
                    <select value={gender} onChange={e => setGender(e.target.value as any)} className="w-full bg-transparent text-white font-bold outline-none text-sm appearance-none p-0">
                       <option value="male">Masc.</option>
                       <option value="female">Fem.</option>
                    </select>
                 </div>
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 relative">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Peso</label>
                    <div className="flex items-center">
                        <input type="number" value={weight} onChange={e => setWeight(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                        <span className="text-[10px] text-gray-600 font-bold absolute right-3 bottom-3">kg</span>
                    </div>
                 </div>
                 <div className="bg-black/40 p-2.5 rounded-xl border border-white/5 relative">
                    <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Altura</label>
                    <div className="flex items-center">
                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                        <span className="text-[10px] text-gray-600 font-bold absolute right-3 bottom-3">cm</span>
                    </div>
                 </div>
              </div>
           </div>

           {/* Rotina & Hábitos (Grid) */}
           <div className="bg-[#18181b] p-4 rounded-3xl border border-white/5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Rotina & Hábitos</h3>
              <div className="space-y-3">
                 <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Trabalho</label>
                        <select value={workType} onChange={e => setWorkType(e.target.value as any)} className="w-full bg-transparent text-white font-bold outline-none text-xs appearance-none">
                           <option value="sitting">Sentado</option>
                           <option value="standing">Em pé</option>
                           <option value="active">Ativo</option>
                        </select>
                    </div>
                    <div className="bg-black/40 p-2.5 rounded-xl border border-white/5">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Ref. Fora/Sem</label>
                        <input type="number" value={eatOutFreq} onChange={e => setEatOutFreq(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                    </div>
                 </div>

                 <div className="flex items-center gap-3">
                     <div className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-300">Treina?</span>
                        <button onClick={() => setTrains(!trains)} className={`w-8 h-4 rounded-full transition-colors relative ${trains ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`} style={{ left: trains ? 'calc(100% - 14px)' : '2px' }} />
                        </button>
                     </div>
                     <div className="flex-1 bg-black/40 p-2.5 rounded-xl border border-white/5 relative">
                        <label className="text-[9px] font-bold text-gray-500 uppercase block mb-1">Meta Água</label>
                        <input type="number" value={waterGoal} onChange={e => setWaterGoal(Number(e.target.value))} className="w-full bg-transparent text-white font-bold outline-none text-sm" />
                        <span className="text-[9px] text-gray-600 font-bold absolute right-3 bottom-3">ml</span>
                     </div>
                 </div>
              </div>
           </div>

           {/* Filhos (Compact List) */}
           <div className="bg-[#18181b] p-4 rounded-3xl border border-white/5">
              <div className="flex justify-between items-center mb-3">
                 <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filhos</h3>
                 <button onClick={() => setHasKids(!hasKids)} className={`w-8 h-4 rounded-full transition-colors relative ${hasKids ? 'bg-emerald-500' : 'bg-zinc-700'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all`} style={{ left: hasKids ? 'calc(100% - 14px)' : '2px' }} />
                 </button>
              </div>
              
              {hasKids && (
                 <div className="space-y-2">
                    {kids.map((kid, idx) => (
                       <div key={idx} className="flex gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5">
                          <input 
                             placeholder="Nome" 
                             value={kid.name} 
                             onChange={e => updateKid(idx, 'name', e.target.value)}
                             className="flex-1 bg-transparent text-white text-xs font-bold outline-none"
                          />
                          <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                              <input 
                                 type="number" 
                                 value={kid.age} 
                                 onChange={e => updateKid(idx, 'age', Number(e.target.value))}
                                 className="w-8 bg-transparent text-white text-xs font-bold outline-none text-right"
                              />
                              <span className="text-[9px] text-gray-500">anos</span>
                          </div>
                          <button onClick={() => removeKid(idx)} className="text-gray-500 hover:text-red-500 p-1"><Trash2 size={14} /></button>
                       </div>
                    ))}
                    <button onClick={addKid} className="w-full py-2 border border-dashed border-white/10 rounded-xl text-[10px] font-bold text-gray-500 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center gap-1">
                       <Plus size={12} /> Adicionar
                    </button>
                 </div>
              )}
           </div>
        </div>

        <button onClick={handleSave} className="w-full py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 mt-4 text-xs">
           <Save size={16} /> Salvar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full animate-slideUp p-6 pt-24">
       <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-emerald-500/20 flex items-center justify-center bg-zinc-800 shadow-2xl">
             {user.identity.photoURL ? (
               <img src={user.identity.photoURL} className="w-full h-full object-cover" />
             ) : (
               <div className="text-emerald-500 text-4xl font-black">
                 {user.identity.name?.charAt(0) || <User size={48} />}
               </div>
             )}
          </div>
          <div className="text-center">
             <h1 className="text-2xl font-black text-white">{user.identity.fullName || user.identity.name}</h1>
             <p className="text-gray-500 text-sm font-medium">{user.email}</p>
             {user.identity.phone && <p className="text-gray-500 text-xs mt-1">{user.identity.phone}</p>}
          </div>
          <button onClick={() => setIsEditing(true)} className="px-6 py-2 bg-white/5 rounded-full text-xs font-bold text-white border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2">
             <Edit2 size={14} /> Editar Perfil
          </button>
       </div>

       <div className="space-y-3">
          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Dados Biométricos</h3>
             <div className="grid grid-cols-2 gap-3">
                <div className="bg-black/30 p-3 rounded-xl">
                   <p className="text-[10px] text-gray-500 mb-0.5">Peso (kg)</p>
                   <p className="text-xl font-black text-white">{user.identity.weight}</p>
                </div>
                <div className="bg-black/30 p-3 rounded-xl">
                   <p className="text-[10px] text-gray-500 mb-0.5">Altura (cm)</p>
                   <p className="text-xl font-black text-white">{user.identity.height}</p>
                </div>
             </div>
          </div>

          <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5">
             <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Meta Atual</h3>
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                   <User size={20} />
                </div>
                <div>
                   <h4 className="text-sm font-bold text-white">{user.primaryGoal}</h4>
                   <p className="text-[10px] text-gray-500">Foco Principal</p>
                </div>
             </div>
          </div>

           <div className="bg-[#18181b] p-4 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Assinatura</h3>
              <div className="flex justify-between items-center">
                 <span className="text-sm text-white font-bold">Plano Gratuito</span>
                 <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-bold">Ativo</span>
              </div>
           </div>

           <button onClick={() => setIsSettings(true)} className="w-full bg-[#18181b] p-4 rounded-2xl border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400 group-hover:text-white transition-colors">
                    <Settings size={20} />
                 </div>
                 <div className="text-left">
                    <h4 className="text-sm font-bold text-white">Configurações</h4>
                    <p className="text-[10px] text-gray-500">Tema, dados pessoais e mais</p>
                 </div>
              </div>
              <ChevronRight size={16} className="text-gray-500 group-hover:text-white transition-colors" />
           </button>
       </div>

       <button onClick={handleLogout} className="mt-auto w-full py-5 bg-red-500/10 text-red-500 rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all mt-6">
          <LogOut size={18} /> Sair do App
       </button>
    </div>
  );
};
