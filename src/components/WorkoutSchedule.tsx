import { useState } from 'react';
import { CalendarDays, Trash2, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DAYS_OF_WEEK } from '../types';

export default function WorkoutSchedule() {
  const { schedule, removeFromSchedule, addToSchedule, generatedWorkout } = useApp();
  const [addingDay, setAddingDay] = useState<number | null>(null);

  function handleAdd(dayOfWeek: number) {
    if (!generatedWorkout) return;
    addToSchedule(dayOfWeek, generatedWorkout);
    setAddingDay(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-violet-600" />
          <h2 className="text-xl font-semibold text-gray-900">Weekly Schedule</h2>
        </div>
        {generatedWorkout && (
          <button
            onClick={() => setAddingDay(addingDay === null ? 1 : null)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Schedule Workout
          </button>
        )}
      </div>

      {/* Quick add panel */}
      {addingDay !== null && generatedWorkout && (
        <div className="border border-violet-200 bg-violet-50 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-violet-900">
            Add "{generatedWorkout.title}" to:
          </p>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day, index) => (
              <button
                key={day}
                onClick={() => handleAdd(index)}
                className="px-3 py-1.5 bg-white border border-violet-300 text-violet-700 rounded-lg text-sm hover:bg-violet-600 hover:text-white transition-colors font-medium"
              >
                {day}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAddingDay(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Cancel
          </button>
        </div>
      )}

      {!generatedWorkout && schedule.length === 0 && (
        <p className="text-sm text-gray-400 italic text-center py-8">
          Generate a workout first, then schedule it here.
        </p>
      )}

      {/* Calendar grid */}
      <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
        {DAYS_OF_WEEK.map((day, dayIndex) => {
          const dayWorkouts = schedule.filter((s) => s.dayOfWeek === dayIndex);
          return (
            <div
              key={day}
              className="border border-gray-200 rounded-xl p-3 min-h-[100px] space-y-2"
            >
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {day.slice(0, 3)}
              </p>
              {dayWorkouts.length === 0 && (
                <p className="text-xs text-gray-300 italic">Rest</p>
              )}
              {dayWorkouts.map((sw) => (
                <div
                  key={sw.id}
                  className="flex items-start justify-between gap-1 bg-violet-50 border border-violet-200 rounded-lg p-2"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-violet-800 truncate">
                      {sw.workoutPlan.title}
                    </p>
                    <p className="text-xs text-violet-500">
                      {sw.workoutPlan.rounds.length} rounds
                    </p>
                  </div>
                  <button
                    onClick={() => removeFromSchedule(sw.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
