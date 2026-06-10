import { useState } from 'react';
import { Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateWorkoutPlan } from '../lib/openai';
import RoundsPreview from './RoundsPreview';

export default function WorkoutGenerator() {
  const { settings, generatedWorkout, setGeneratedWorkout, updateNumberOfRounds } =
    useApp();

  const [focusAreas, setFocusAreas] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setError(null);
    setLoading(true);
    try {
      const plan = await generateWorkoutPlan(
        settings,
        focusAreas,
        settings.numberOfRounds
      );
      setGeneratedWorkout(plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-violet-600" />
        <h2 className="text-xl font-semibold text-gray-900">AI Workout Generator</h2>
      </div>

      {/* Config */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Focus areas (optional)
          </label>
          <input
            type="text"
            placeholder="e.g. upper body, glutes, HIIT, mobility..."
            value={focusAreas}
            onChange={(e) => setFocusAreas(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Number of rounds:
          </label>
          <input
            type="number"
            min={1}
            max={20}
            value={settings.numberOfRounds}
            onChange={(e) =>
              updateNumberOfRounds(parseInt(e.target.value) || 1)
            }
            className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>
      </div>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={loading}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow ${
          loading
            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
            : 'bg-violet-600 text-white hover:bg-violet-700 active:scale-95'
        }`}
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Generating…
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            {generatedWorkout ? 'Regenerate Workout' : 'Generate Workout'}
          </>
        )}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Result */}
      {generatedWorkout && !loading && (
        <div className="border border-gray-200 rounded-xl p-4">
          <RoundsPreview plan={generatedWorkout} />
        </div>
      )}
    </div>
  );
}
