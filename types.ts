
export interface User {
  id: string;
  email: string;
  name?: string;
}

export enum GoalType {
  WEIGHT_LOSS = "Emagrecer",
  MUSCLE_GAIN = "Ganhar Massa",
  HEALTHY_HABITS = "Saúde & Longevidade",
  PERFORMANCE = "Performance"
}

export interface Child {
  id: string;
  name: string;
  age: number;
  weight?: number;
  height?: number;
  allergies?: string[];
  notes?: string;
}

export interface UserData extends User {
  onboardingComplete?: boolean;
  goalsSetupComplete?: boolean; 
  educationComplete?: boolean; // Novo flag para o fluxo educativo
  
  theme?: 'dark' | 'light';
  
  identity: {
    name?: string; // Nome obrigatório agora
    fullName?: string; // Nome completo
    phone?: string; // Telefone
    age: number;
    height: number;
    weight: number;
    gender: 'male' | 'female'; // Adicionado para cálculo de BMR
    photoURL?: string; // Foto de perfil (Base64 ou URL)
    allergies?: string[]; // Alergias no perfil base
  };
  
  reputation: number; // Gamificação
  lastCheckIn?: number;

  primaryGoal: GoalType;
  
  context: {
    hasKids: boolean;
    workType: 'sitting' | 'standing' | 'active';
    
    // Configuração de Treino
    trains: boolean;
    trainingFrequency?: number; // Vezes na semana (1-7)
    trainingDurationMinutes?: number; // Minutos por sessão
    trainingIntensity?: 'low' | 'medium' | 'high';

    eatOutFrequency: number;
    waterIntakeGoal: number;
    calorieGoal: number;
    monthlyIncome?: number; // Para dicas de economia
    
    timeline?: {
      targetDate: number; // Timestamp
      startWeight: number;
      targetWeight: number;
      months: number;
    };

    family?: Child[]; // Array de filhos
    
    macros: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
}

export interface LogEntry {
  id: string;
  timestamp: number;
  type: 'food' | 'water' | 'weight' | 'activity' | 'checkin';
  value: {
    description?: string;
    kcal?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    amount?: number;
  };
}

export interface BoardConfig {
  id: string;
  title: string;
  iconName: string;
  coverQuery: string;
  content: any;
}

export interface AppState {
  user: UserData | null;
  loading: boolean;
}

export interface FoodlistMeal {
  id: string;
  description: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  amount: number;
}

export interface Foodlist {
  id: string;
  name: string;
  description: string;
  icon: string; // Nome do ícone (ex: 'Apple')
  type: string; // Categoria (ex: 'Café da Manhã')
  coverGradient: string; // CSS Gradient string
  goal: 'Cutting' | 'Bulking' | 'Manutenção' | 'Geral';
  meals: FoodlistMeal[];
  isPublic: boolean;
  authorId: string;
  authorName: string;
  authorPhoto?: string; // Foto do autor
  savedCount: number;
  createdAt: number;
  tags?: string[];
  stats: {
    totalKcal: number;
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
  };
}
