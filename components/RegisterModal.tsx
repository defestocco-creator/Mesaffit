
import React, { useState, useEffect, useRef } from 'react';
import { X, BookOpen, Search, Trash2, Check, ArrowRight, Scale, Save, Clock, Flame, Camera, Image as ImageIcon, Sparkles, Loader2, RotateCw, CheckCircle2, ChevronLeft, ChevronRight, Utensils, Tag } from 'lucide-react';
import { ref, push, onValue, remove, update } from "firebase/database";
import { db } from '../firebase';
import { GoogleGenAI, Type } from "@google/genai";

interface RegisterModalProps {
  userId: string;
  onClose: () => void;
  onSave: (type: 'food' | 'water' | 'weight', value: any) => void;
  initialData?: any;
  mode?: 'log' | 'create_only';
  initialView?: ModalViewState;
}

interface LibraryItem {
  id: string;
  description: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number;
  usageCount: number;
  lastUsed: number;
  image?: string;
}

interface DetectedFood {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  weight: number;
  confidence: number;
}

type ModalViewState = 'form' | 'choice' | 'camera' | 'preview' | 'analyzing' | 'review' | 'library';

export const RegisterModal: React.FC<RegisterModalProps> = ({ userId, onClose, onSave, initialData, mode = 'log', initialView = 'form' }) => {
  const [view, setView] = useState<ModalViewState>(initialView);
  
  // Inicializa estados com initialData se existir
  const [description, setDescription] = useState(initialData?.description || '');
  const [kcal, setKcal] = useState(initialData?.kcal ? String(initialData.kcal) : '');
  const [protein, setProtein] = useState(initialData?.protein ? String(initialData.protein) : '');
  const [carbs, setCarbs] = useState(initialData?.carbs ? String(initialData.carbs) : '');
  const [fat, setFat] = useState(initialData?.fat ? String(initialData.fat) : '');
  const [amount, setAmount] = useState(initialData?.amount ? String(initialData.amount) : '');
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  
  const [saveToLibrary, setSaveToLibrary] = useState(mode === 'create_only' ? true : false);
  const [isImported, setIsImported] = useState(!!initialData); // Se veio de dados iniciais, conta como importado

  const [capturedImage, setCapturedImage] = useState<string | null>(initialData?.image || null);
  const [thumbnail, setThumbnail] = useState<string | null>(initialData?.image || null);
  const [rotation, setRotation] = useState(0);

  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([]);
  const [detectedFoods, setDetectedFoods] = useState<DetectedFood[]>([]);
  const [suggestedName, setSuggestedName] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const libRef = ref(db, `users/${userId}/library`);
    const unsubscribe = onValue(libRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const items = Object.keys(data).map(key => ({ id: key, ...data[key] }));
        setLibraryItems(items.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0)));
      }
    });
    return () => { unsubscribe(); stopCamera(); };
  }, [userId]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const createThumbnail = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 128, 128);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        }
      };
      img.src = base64;
    });
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      setView('camera');
    } catch (err) { alert("Permissão de câmera negada."); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        createThumbnail(dataUrl).then(setThumbnail);
        stopCamera();
        setView('preview');
      }
    }
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setView('analyzing');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const cleanBase64 = capturedImage.split(',')[1];
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: cleanBase64 } },
            { text: "Analise esta refeição. Forneça: 1. Um 'suggestedName' (nome curto e criativo para a refeição, ex: 'Almoço Fit', 'Prato Colorido'). 2. Uma lista de ingredientes detalhados com peso, kcal e macros. Retorne JSON em português." }
          ]
        }],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedName: { type: Type.STRING },
              ingredients: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    kcal: { type: Type.NUMBER },
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fat: { type: Type.NUMBER },
                    weight: { type: Type.NUMBER },
                    confidence: { type: Type.NUMBER }
                  },
                  required: ["name", "kcal", "protein", "carbs", "fat", "weight", "confidence"]
                }
              }
            },
            required: ["suggestedName", "ingredients"]
          }
        }
      });
      const result = JSON.parse(response.text || "{}");
      setSuggestedName(result.suggestedName || "Nova Refeição");
      setDetectedFoods(result.ingredients.filter((f: DetectedFood) => f.confidence > 0.3));
      setView('review');
    } catch (error) {
      setView('form');
      alert("Erro ao processar.");
    }
  };

  const handleConfirmReview = () => {
    const totalKcal = Math.round(detectedFoods.reduce((acc, f) => acc + f.kcal, 0));
    const totalP = Math.round(detectedFoods.reduce((acc, f) => acc + f.protein, 0));
    const totalC = Math.round(detectedFoods.reduce((acc, f) => acc + f.carbs, 0));
    const totalG = Math.round(detectedFoods.reduce((acc, f) => acc + f.fat, 0));
    const totalW = Math.round(detectedFoods.reduce((acc, f) => acc + f.weight, 0));
    
    setDescription(suggestedName);
    setKcal(String(totalKcal));
    setProtein(String(totalP));
    setCarbs(String(totalC));
    setFat(String(totalG));
    setAmount(String(totalW));
    setTags(detectedFoods.map(f => f.name));
    setView('form');
  };

  const handleSave = async () => {
    if (!description || !kcal) return;
    const foodData = { 
      description, 
      kcal: Number(kcal), 
      protein: Number(protein) || 0, 
      carbs: Number(carbs) || 0, 
      fat: Number(fat) || 0,
      amount: Number(amount) || 0,
      image: thumbnail || capturedImage || null, // Salva imagem se tiver
      tags
    };

    if (mode === 'create_only' || (saveToLibrary && !isImported)) {
      await push(ref(db, `users/${userId}/library`), { ...foodData, image: thumbnail, usageCount: 1, lastUsed: Date.now() });
    }

    if (mode === 'log') {
        // Se for uma refeição planejada, marcar como consumida no planejamento
        if (initialData?.plannedIndex !== undefined && initialData?.plannedDate) {
          await update(ref(db, `users/${userId}/planning/${initialData.plannedDate}/meals/${initialData.plannedIndex}`), {
            consumed: true
          });
        }
        onSave('food', foodData);
    } else {
        alert("Item salvo na biblioteca!");
        onClose();
    }
  };

  const handleSelectFromLibrary = async (item: LibraryItem) => {
    setDescription(item.description);
    setKcal(String(item.kcal));
    setProtein(String(item.protein));
    setCarbs(String(item.carbs));
    setFat(String(item.fat));
    setAmount(String(item.amount || ''));
    setIsImported(true);
    setThumbnail(item.image || null);
    setSaveToLibrary(false);
    await update(ref(db, `users/${userId}/library/${item.id}`), { usageCount: (item.usageCount || 0) + 1, lastUsed: Date.now() });
    setView('form');
  };

  if (view === 'choice') {
    return (
      <div className="fixed inset-0 z-[120] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-3 animate-fadeIn">
        <button onClick={() => setView('form')} className="absolute top-6 right-6 text-gray-500 hover:text-white"><X size={24} /></button>
        <div className="text-center mb-3">
          <Sparkles size={32} className="text-emerald-500 mx-auto mb-3 animate-pulse" />
          <h2 className="text-sm font-black text-white">Importar Refeição</h2>
        </div>
        <div className="grid grid-cols-1 w-full gap-3 max-w-xs">
          <button onClick={startCamera} className="flex items-center gap-3 p-2 bg-white rounded-lg text-black font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center text-white"><Camera size={20} /></div>
            Tirar Foto
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-3 p-2 bg-zinc-900 border border-white/10 rounded-lg text-white font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">
            <div className="w-6 h-6 bg-white/5 rounded-md flex items-center justify-center text-gray-400"><ImageIcon size={20} /></div>
            Galeria
          </button>
        </div>
        <input type="file" ref={fileInputRef} onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const r = new FileReader();
            r.onload = () => { setCapturedImage(r.result as string); createThumbnail(r.result as string).then(setThumbnail); setView('preview'); };
            r.readAsDataURL(file);
          }
        }} accept="image/*" className="hidden" />
      </div>
    );
  }

  if (view === 'analyzing') {
    return (
      <div className="fixed inset-0 z-[130] bg-black flex flex-col items-center justify-center text-white">
        <Loader2 size={60} className="text-emerald-500 animate-spin mb-2" />
        <h3 className="text-sm font-black uppercase tracking-widest opacity-60">processando sua refeição...</h3>
      </div>
    );
  }

  if (view === 'review') {
    return (
      <div className="fixed inset-0 z-[120] bg-[#09090b] flex flex-col animate-slideUp">
        <div className="p-2 flex items-center justify-between border-b border-white/5">
          <button onClick={() => setView('preview')}><ChevronLeft size={20} /></button>
          <h2 className="text-xs font-black uppercase tracking-widest">Página Trat</h2>
          <div className="w-5" />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          <div className="relative h-40 rounded-lg overflow-hidden shadow-2xl">
            <img src={capturedImage!} className="w-full h-full object-cover" style={{ transform: `rotate(${rotation}deg)` }} />
          </div>
          <div className="space-y-3">
            <h3 className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Identificados</h3>
            {detectedFoods.map((f, i) => (
              <div key={i} className="bg-zinc-900 p-3 rounded-md flex justify-between items-center animate-fadeIn" style={{ animationDelay: `${i*100}ms` }}>
                <div>
                  <p className="font-bold text-white text-xs">{f.name}</p>
                  <p className="text-[9px] text-gray-500 font-bold">{f.weight}g • {f.kcal} kcal</p>
                </div>
                <div className="flex gap-2 text-[8px] font-black text-gray-600">
                  <span>P:{f.protein}</span><span>C:{f.carbs}</span><span>G:{f.fat}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="p-3 bg-zinc-950 border-t border-white/5">
           <button onClick={handleConfirmReview} className="w-full py-2 bg-emerald-500 text-black rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2">
             <CheckCircle2 size={16} /> Confirmar Refeição
           </button>
        </div>
      </div>
    );
  }

  if (view === 'preview') {
    return (
      <div className="fixed inset-0 z-[120] bg-black flex flex-col">
        <div className="flex-1 flex items-center justify-center p-3 relative">
          <img src={capturedImage!} className="max-w-full max-h-full rounded-lg" style={{ transform: `rotate(${rotation}deg)` }} />
          <button onClick={() => setRotation(r => (r+90)%360)} className="absolute bottom-10 right-10 p-2 bg-white text-black rounded-full"><RotateCw size={24} /></button>
        </div>
        <div className="p-2 flex gap-2">
          <button onClick={() => setView('choice')} className="flex-1 py-2 bg-zinc-900 text-gray-400 font-black uppercase tracking-widest text-[10px] rounded-lg">Refazer</button>
          <button onClick={analyzeImage} className="flex-[2] py-2 bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] rounded-lg">Tratar Imagem</button>
        </div>
      </div>
    );
  }

  if (view === 'camera') {
    return (
      <div className="fixed inset-0 z-[120] bg-black flex flex-col">
        <video ref={videoRef} autoPlay playsInline className="flex-1 object-cover" />
        <canvas ref={canvasRef} className="hidden" />
        <div className="h-40 bg-zinc-950 flex items-center justify-center">
          <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full flex items-center justify-center border-4 border-white/20">
            <div className="w-6 h-6 rounded-full border-2 border-black" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 animate-fadeIn">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-[#18181b] w-full max-w-sm rounded-2xl p-6 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto">
        <div className="absolute top-0 right-0 p-4"><button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24} /></button></div>
        <h2 className="text-xl font-black text-white mb-4">Adicionar</h2>
        <div className="grid grid-cols-2 gap-3 mb-4">
           <button onClick={() => setView('choice')} className="p-4 bg-emerald-500/10 text-emerald-500 rounded-xl flex flex-col items-center gap-2 border border-emerald-500/20 active:scale-95 transition-all">
             <Camera size={20} />
             <span className="text-[10px] font-black uppercase tracking-widest">Câmera IA</span>
           </button>
           <button onClick={() => setView('library')} className="p-4 bg-blue-500/10 text-blue-500 rounded-xl flex flex-col items-center gap-2 border border-blue-500/20 active:scale-95 transition-all">
             <BookOpen size={20} />
             <span className="text-[10px] font-black uppercase tracking-widest">Biblioteca</span>
           </button>
        </div>
        
        {/* Preview da Imagem se existir (vinda da library ou camera) */}
        {(thumbnail || capturedImage) && (
           <div className="mb-4 h-32 w-full rounded-xl overflow-hidden relative group">
              <img src={thumbnail || capturedImage!} className="w-full h-full object-cover" />
              <button onClick={() => { setThumbnail(null); setCapturedImage(null); }} className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white"><X size={14} /></button>
           </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <input value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-black/30 text-white p-4 rounded-xl border border-white/5 font-bold outline-none focus:border-emerald-500/40 text-base" placeholder="Nome da refeição" />
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-1">
                 {tags.map((t, i) => (
                   <span key={i} className="text-[10px] font-bold bg-white/5 text-gray-400 px-2 py-1 rounded-lg border border-white/5 flex items-center gap-1">
                     <Tag size={10} /> {t}
                   </span>
                 ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div className="relative">
                <input type="number" value={kcal} onChange={e => setKcal(e.target.value)} className="w-full bg-black/30 text-white p-4 rounded-xl border border-white/5 font-bold outline-none text-base" placeholder="Kcal" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">KCAL</span>
             </div>
             <div className="relative">
                <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full bg-black/30 text-white p-4 rounded-xl border border-white/5 font-bold outline-none text-base" placeholder="Peso" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-600">G</span>
             </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
             <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-600 uppercase ml-1">Prot</span>
                <input type="number" value={protein} onChange={e => setProtein(e.target.value)} className="w-full p-3 bg-black/30 border border-white/5 rounded-xl text-center font-bold text-white text-base" placeholder="0" />
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-600 uppercase ml-1">Carb</span>
                <input type="number" value={carbs} onChange={e => setCarbs(e.target.value)} className="w-full p-3 bg-black/30 border border-white/5 rounded-xl text-center font-bold text-white text-base" placeholder="0" />
             </div>
             <div className="space-y-1">
                <span className="text-[10px] font-black text-gray-600 uppercase ml-1">Gord</span>
                <input type="number" value={fat} onChange={e => setFat(e.target.value)} className="w-full p-3 bg-black/30 border border-white/5 rounded-xl text-center font-bold text-white text-base" placeholder="0" />
             </div>
          </div>
        </div>
        {!isImported && mode !== 'create_only' && (
          <div onClick={() => setSaveToLibrary(!saveToLibrary)} className="flex items-center gap-2 mt-4 mb-4 cursor-pointer">
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${saveToLibrary ? 'bg-emerald-500 border-emerald-500' : 'border-gray-600'}`}>
               {saveToLibrary && <Check size={12} className="text-black" />}
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Salvar na Biblioteca</span>
          </div>
        )}
        <button onClick={handleSave} className="w-full py-4 bg-white text-black rounded-xl font-black uppercase tracking-widest text-xs active:scale-95 transition-all">
            {mode === 'create_only' ? 'Criar na Biblioteca' : 'Confirmar'}
        </button>
      </div>
    </div>
  );
};
