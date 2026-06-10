import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type {
  AppSettings,
  WorkoutPlan,
  ScheduledWorkout,
  CategoryLevel,
  Equipment,
} from '../types';
import {
  DEFAULT_EQUIPMENT,
  DEFAULT_CATEGORY_LEVELS,
} from '../types';

interface AppContextValue {
  settings: AppSettings;
  updateApiKey: (key: string) => void;
  updateCategoryLevel: (level: CategoryLevel) => void;
  updateEquipment: (equipment: Partial<Equipment>) => void;
  updateNumberOfRounds: (n: number) => void;

  generatedWorkout: WorkoutPlan | null;
  setGeneratedWorkout: (plan: WorkoutPlan | null) => void;

  schedule: ScheduledWorkout[];
  addToSchedule: (dayOfWeek: number, plan: WorkoutPlan) => void;
  removeFromSchedule: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem('fitshit_settings');
    if (raw) return JSON.parse(raw) as AppSettings;
  } catch {
    // ignore
  }
  return {
    openAiApiKey: '',
    categoryLevels: DEFAULT_CATEGORY_LEVELS,
    equipment: DEFAULT_EQUIPMENT,
    numberOfRounds: 4,
  };
}

function loadSchedule(): ScheduledWorkout[] {
  try {
    const raw = localStorage.getItem('fitshit_schedule');
    if (raw) return JSON.parse(raw) as ScheduledWorkout[];
  } catch {
    // ignore
  }
  return [];
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutPlan | null>(null);
  const [schedule, setSchedule] = useState<ScheduledWorkout[]>(loadSchedule);

  const saveSettings = useCallback((next: AppSettings) => {
    setSettings(next);
    localStorage.setItem('fitshit_settings', JSON.stringify(next));
  }, []);

  const saveSchedule = useCallback((next: ScheduledWorkout[]) => {
    setSchedule(next);
    localStorage.setItem('fitshit_schedule', JSON.stringify(next));
  }, []);

  const updateApiKey = useCallback(
    (key: string) => saveSettings({ ...settings, openAiApiKey: key }),
    [settings, saveSettings]
  );

  const updateCategoryLevel = useCallback(
    (updated: CategoryLevel) => {
      const categoryLevels = settings.categoryLevels.map((cl) =>
        cl.category === updated.category ? updated : cl
      );
      saveSettings({ ...settings, categoryLevels });
    },
    [settings, saveSettings]
  );

  const updateEquipment = useCallback(
    (patch: Partial<Equipment>) => {
      saveSettings({
        ...settings,
        equipment: { ...settings.equipment, ...patch },
      });
    },
    [settings, saveSettings]
  );

  const updateNumberOfRounds = useCallback(
    (n: number) => saveSettings({ ...settings, numberOfRounds: n }),
    [settings, saveSettings]
  );

  const addToSchedule = useCallback(
    (dayOfWeek: number, workoutPlan: WorkoutPlan) => {
      const entry: ScheduledWorkout = {
        id: crypto.randomUUID(),
        dayOfWeek,
        workoutPlan,
      };
      saveSchedule([...schedule, entry]);
    },
    [schedule, saveSchedule]
  );

  const removeFromSchedule = useCallback(
    (id: string) => saveSchedule(schedule.filter((s) => s.id !== id)),
    [schedule, saveSchedule]
  );

  return (
    <AppContext.Provider
      value={{
        settings,
        updateApiKey,
        updateCategoryLevel,
        updateEquipment,
        updateNumberOfRounds,
        generatedWorkout,
        setGeneratedWorkout,
        schedule,
        addToSchedule,
        removeFromSchedule,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
