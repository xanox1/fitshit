import React, { useState } from 'react';
import { Dumbbell, Sparkles, CalendarDays, Timer, Settings, TrendingUp } from 'lucide-react';
import { AppProvider } from './context/AppContext';
import EquipmentConfig from './components/EquipmentConfig';
import CategoryLevels from './components/CategoryLevels';
import WorkoutGenerator from './components/WorkoutGenerator';
import WorkoutSchedule from './components/WorkoutSchedule';
import WorkoutTimer from './components/WorkoutTimer';
import SettingsPanel from './components/SettingsPanel';

type Tab = 'generate' | 'equipment' | 'levels' | 'schedule' | 'timer' | 'settings';

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'generate', label: 'Generate', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'equipment', label: 'Equipment', icon: <Dumbbell className="w-4 h-4" /> },
  { id: 'levels', label: 'Levels', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'schedule', label: 'Schedule', icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'timer', label: 'Timer', icon: <Timer className="w-4 h-4" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('generate');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="w-6 h-6 text-violet-600" />
            <span className="text-lg font-black text-gray-900 tracking-tight">
              fitshit
            </span>
          </div>
          <p className="text-xs text-gray-400 hidden sm:block">
            AI-powered calisthenics planner
          </p>
        </div>
        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4 overflow-x-auto">
          <div className="flex gap-1 pb-px min-w-max">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-600 text-violet-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.icon}
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6">
        {activeTab === 'generate' && <WorkoutGenerator />}
        {activeTab === 'equipment' && <EquipmentConfig />}
        {activeTab === 'levels' && <CategoryLevels />}
        {activeTab === 'schedule' && <WorkoutSchedule />}
        {activeTab === 'timer' && <WorkoutTimer />}
        {activeTab === 'settings' && <SettingsPanel />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

