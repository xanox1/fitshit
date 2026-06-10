import { TrendingUp } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ExerciseCategory, FitnessLevel } from '../types';
import { CATEGORY_LABELS } from '../types';

const LEVELS: { value: FitnessLevel; label: string; color: string }[] = [
  { value: 'beginner', label: 'Beginner', color: 'green' },
  { value: 'intermediate', label: 'Intermediate', color: 'amber' },
  { value: 'advanced', label: 'Advanced', color: 'red' },
];

const LEVEL_COLORS: Record<FitnessLevel, string> = {
  beginner: 'bg-green-600 text-white border-green-600',
  intermediate: 'bg-amber-500 text-white border-amber-500',
  advanced: 'bg-red-600 text-white border-red-600',
};

const LEVEL_INACTIVE: Record<FitnessLevel, string> = {
  beginner: 'text-green-700 border-green-300 hover:border-green-400',
  intermediate: 'text-amber-700 border-amber-300 hover:border-amber-400',
  advanced: 'text-red-700 border-red-300 hover:border-red-400',
};

export default function CategoryLevels() {
  const { settings, updateCategoryLevel } = useApp();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-violet-600" />
        <h2 className="text-xl font-semibold text-gray-900">Fitness Levels</h2>
      </div>

      <p className="text-sm text-gray-500">
        Set your current level for each category. The AI will tailor exercise
        difficulty accordingly.
      </p>

      <div className="space-y-3">
        {settings.categoryLevels.map((cl) => {
          const category = cl.category as ExerciseCategory;
          return (
            <div
              key={category}
              className="border border-gray-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {CATEGORY_LABELS[category]}
                </p>
              </div>
              <div className="flex gap-2">
                {LEVELS.map(({ value, label }) => {
                  const active = cl.level === value;
                  return (
                    <button
                      key={value}
                      onClick={() =>
                        updateCategoryLevel({ category, level: value })
                      }
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                        active
                          ? LEVEL_COLORS[value]
                          : `bg-white ${LEVEL_INACTIVE[value]}`
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
