
import React, { useState, useEffect } from 'react';
import { Login } from './components/Login';
import { Onboarding } from './components/Onboarding';
import { GoalSetup } from './components/GoalSetup';
import { EducationFlow } from './components/EducationFlow';
import { Mesa } from './components/Mesa';
import { UserData, GoalType } from './types';
import { ref, onValue } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from './firebase';

const App: React.FC = () => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Escuta mudanças na autenticação do Firebase
    const unsubscribe = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        // Usuário logado, buscar dados no DB
        const userRef = ref(db, `users/${authUser.uid}/profile`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
            setUser(data);
          } else {
            // Se autenticou mas não tem perfil (primeiro acesso)
            setUser({
              id: authUser.uid,
              email: authUser.email || '',
              reputation: 0,
              onboardingComplete: false,
              goalsSetupComplete: false,
              educationComplete: false,
              identity: { age: 0, height: 0, weight: 0, gender: 'male' },
              primaryGoal: GoalType.HEALTHY_HABITS,
              context: {
                hasKids: false,
                workType: 'sitting',
                trains: false,
                eatOutFrequency: 0,
                waterIntakeGoal: 2000,
                calorieGoal: 2000,
                macros: { protein: 0, carbs: 0, fat: 0 }
              }
            });
          }
          setLoading(false);
        });
      } else {
        // Não logado
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user?.theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [user?.theme]);

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
       <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
    </div>
  );

  if (!user) {
    return <Login />;
  }

  if (!user.onboardingComplete) {
    return <Onboarding user={user} onComplete={setUser} />;
  }

  if (!user.goalsSetupComplete) {
    return <GoalSetup user={user} onComplete={setUser} />;
  }

  if (!user.educationComplete) {
    return <EducationFlow user={user} onComplete={setUser} />;
  }

  return <Mesa user={user} onLogout={() => {}} />;
};

export default App;
