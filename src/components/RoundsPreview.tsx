import { useState } from 'react';
import { ChevronDown, ChevronUp, Clock, RotateCcw } from 'lucide-react';
import type { WorkoutPlan, WorkoutRound, Exercise } from '../types';

interface RoundsPreviewProps {
  plan: WorkoutPlan;
}

const CATEGORY_BADGE_COLORS: Record<string, string> = {
  push: 'bg-blue-100 text-blue-700',
  pull: 'bg-purple-100 text-purple-700',
  legs: 'bg-green-100 text-green-700',
  core: 'bg-yellow-100 text-yellow-700',
  cardio: 'bg-red-100 text-red-700',
  mobility: 'bg-teal-100 text-teal-700',
};

function ExerciseRow({ exercise }: { exercise: Exercise }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-100 last:border-0 gap-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-gray-900 text-sm">{exercise.name}</span>
          <span
            className={`px-1.5 py-0.5 rounded text-xs font-medium ${
              CATEGORY_BADGE_COLORS[exercise.category] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {exercise.category}
          </span>
        </div>
        {exercise.notes && (
          <p className="text-xs text-gray-500 mt-0.5 italic">{exercise.notes}</p>
        )}
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-600 whitespace-nowrap shrink-0">
        <span className="font-semibold text-gray-800">
          {exercise.sets > 1 ? `${exercise.sets}×` : ''}{exercise.reps}
        </span>
        {exercise.weight && (
          <span className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded font-medium">
            {exercise.weight}
          </span>
        )}
        {exercise.rest && exercise.rest !== '0 sec' && (
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3 h-3" />
            {exercise.rest}
          </span>
        )}
      </div>
    </div>
  );
}

function RoundCard({ round, defaultOpen }: { round: WorkoutRound; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
            {round.roundNumber}
          </span>
          <div>
            <p className="font-semibold text-gray-900 text-sm">{round.name}</p>
            <p className="text-xs text-gray-500">
              {round.exercises.length} exercises
              {round.duration && ` · ${round.duration}`}
            </p>
          </div>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 py-2">
          {round.exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

function ExerciseSection({
  title,
  exercises,
  icon,
}: {
  title: string;
  exercises: Exercise[];
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-semibold text-gray-800 text-sm">{title}</span>
          <span className="text-xs text-gray-400">({exercises.length})</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {open && (
        <div className="px-4 py-2">
          {exercises.map((ex, i) => (
            <ExerciseRow key={i} exercise={ex} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoundsPreview({ plan }: RoundsPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-gray-900">{plan.title}</h3>
        {plan.description && (
          <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
        )}
        {plan.totalDuration && (
          <div className="flex items-center gap-1 mt-2 text-sm text-violet-600 font-medium">
            <Clock className="w-4 h-4" />
            <span>{plan.totalDuration}</span>
          </div>
        )}
      </div>

      {/* Warmup */}
      {plan.warmup && plan.warmup.length > 0 && (
        <ExerciseSection
          title="Warm-up"
          exercises={plan.warmup}
          icon={<span className="text-base">🔥</span>}
        />
      )}

      {/* Rounds — scrollable container */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <RotateCcw className="w-4 h-4 text-violet-600" />
          <p className="text-sm font-semibold text-gray-700">
            Rounds ({plan.rounds.length})
          </p>
        </div>
        {/* Scrollable rounds list — all rounds shown, not capped at 5 */}
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
          {plan.rounds.map((round, i) => (
            <RoundCard
              key={round.roundNumber}
              round={round}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>

      {/* Cooldown */}
      {plan.cooldown && plan.cooldown.length > 0 && (
        <ExerciseSection
          title="Cool-down"
          exercises={plan.cooldown}
          icon={<span className="text-base">🧊</span>}
        />
      )}
    </div>
  );
}
