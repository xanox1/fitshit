export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export type ExerciseCategory =
  | 'push'
  | 'pull'
  | 'legs'
  | 'core'
  | 'cardio'
  | 'mobility';

export interface CategoryLevel {
  category: ExerciseCategory;
  level: FitnessLevel;
}

export interface DumbbellConfig {
  minWeight: number;
  maxWeight: number;
  increment: number;
  unit: 'kg' | 'lbs';
}

export interface KettlebellConfig {
  weights: number[];
  unit: 'kg' | 'lbs';
}

export interface Equipment {
  bodyweight: boolean;
  pullUpBar: boolean;
  resistanceBands: boolean;
  adjustableDumbbells: boolean;
  dumbbellConfig: DumbbellConfig;
  kettlebells: boolean;
  kettlebellConfig: KettlebellConfig;
  barbell: boolean;
  bench: boolean;
  cableMachine: boolean;
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  weight?: string;
  rest: string;
  notes?: string;
  category: ExerciseCategory;
}

export interface WorkoutRound {
  roundNumber: number;
  name: string;
  exercises: Exercise[];
  duration?: string;
}

export interface WorkoutPlan {
  id: string;
  title: string;
  description: string;
  rounds: WorkoutRound[];
  totalDuration?: string;
  warmup?: Exercise[];
  cooldown?: Exercise[];
  createdAt: string;
}

export interface ScheduledWorkout {
  id: string;
  dayOfWeek: number;
  workoutPlan: WorkoutPlan;
}

export interface AppSettings {
  openAiApiKey: string;
  categoryLevels: CategoryLevel[];
  equipment: Equipment;
  numberOfRounds: number;
}

export const DEFAULT_EQUIPMENT: Equipment = {
  bodyweight: true,
  pullUpBar: false,
  resistanceBands: false,
  adjustableDumbbells: false,
  dumbbellConfig: {
    minWeight: 2,
    maxWeight: 32,
    increment: 2,
    unit: 'kg',
  },
  kettlebells: false,
  kettlebellConfig: {
    weights: [8, 12, 16, 20, 24],
    unit: 'kg',
  },
  barbell: false,
  bench: false,
  cableMachine: false,
};

export const DEFAULT_CATEGORY_LEVELS: CategoryLevel[] = [
  { category: 'push', level: 'beginner' },
  { category: 'pull', level: 'beginner' },
  { category: 'legs', level: 'beginner' },
  { category: 'core', level: 'beginner' },
  { category: 'cardio', level: 'beginner' },
  { category: 'mobility', level: 'beginner' },
];

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
  push: 'Push (Chest / Shoulders / Triceps)',
  pull: 'Pull (Back / Biceps)',
  legs: 'Legs (Quads / Hamstrings / Glutes)',
  core: 'Core (Abs / Obliques)',
  cardio: 'Cardio / Conditioning',
  mobility: 'Mobility / Flexibility',
};

export const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
