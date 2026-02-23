
import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  AuthError 
} from "firebase/auth";
import { auth } from '../firebase';
import { LogIn, Sparkles, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        // O App.tsx detectará a mudança de estado e redirecionará para o Onboarding
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        // O App.tsx detectará a mudança de estado e carregará o perfil
      }
    } catch (err: any) {
      console.error(err);
      let msg = "Ocorreu um erro. Tente novamente.";
      
      // Tratamento de erros comuns do Firebase em PT-BR
      if (err.code === 'auth/invalid-email') msg = "E-mail inválido.";
      if (err.code === 'auth/user-disabled') msg = "Usuário desativado.";
      if (err.code === 'auth/user-not-found') msg = "Usuário não encontrado.";
      if (err.code === 'auth/wrong-password') msg = "Senha incorreta.";
      if (err.code === 'auth/email-already-in-use') msg = "Este e-mail já está em uso.";
      if (err.code === 'auth/weak-password') msg = "A senha deve ter pelo menos 6 caracteres.";
      
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#09090b] flex flex-col items-center justify-center p-3 text-white relative overflow-hidden">
      {/* Background Ambient */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-emerald-500/5 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-sm space-y-1 animate-slideUp relative z-10">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-6 h-6 bg-[#18181b] border border-white/5 rounded-lg mb-2 shadow-2xl backdrop-blur-md">
            <Sparkles className="text-emerald-500" size={24} />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tighter text-white">MesaFit<span className="text-emerald-500">.</span></h1>
            <p className="text-gray-500 font-medium text-sm mt-1">OS Alimentar Adaptativo</p>
          </div>
        </div>

        {/* Form Container */}
        <div className="bg-[#18181b]/50 backdrop-blur-xl border border-white/5 p-2 rounded-[2rem] shadow-2xl">
          <form onSubmit={handleAuth} className="space-y-2">
            
            <div className="space-y-2">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-3">E-mail</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-black/40 text-white pl-12 pr-4 py-2 rounded-md border border-white/5 focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-500 ml-3">Senha</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 text-white pl-12 pr-4 py-2 rounded-md border border-white/5 focus:border-emerald-500/50 outline-none transition-all placeholder:text-gray-700 font-medium"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg text-xs font-bold animate-fadeIn">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-white text-black rounded-md font-black uppercase tracking-widest hover:bg-gray-200 active:scale-95 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  {isSignUp ? 'Criar Conta' : 'Entrar'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Signup */}
          <div className="mt-3 text-center">
            <button 
              onClick={() => { setIsSignUp(!isSignUp); setError(null); }}
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-wider"
            >
              {isSignUp ? 'Já tem uma conta? Entrar' : 'Não tem conta? Criar agora'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
