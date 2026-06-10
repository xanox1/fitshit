import { useState } from 'react';
import { Settings2, Plus, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { DumbbellConfig, KettlebellConfig } from '../types';

export default function EquipmentConfig() {
  const { settings, updateEquipment } = useApp();
  const { equipment } = settings;

  const [newKbWeight, setNewKbWeight] = useState('');

  function toggle(key: keyof typeof equipment) {
    updateEquipment({ [key]: !equipment[key] } as never);
  }

  function updateDumbbell(patch: Partial<DumbbellConfig>) {
    updateEquipment({
      dumbbellConfig: { ...equipment.dumbbellConfig, ...patch },
    });
  }

  function updateKettlebell(patch: Partial<KettlebellConfig>) {
    updateEquipment({
      kettlebellConfig: { ...equipment.kettlebellConfig, ...patch },
    });
  }

  function addKbWeight() {
    const val = parseFloat(newKbWeight);
    if (isNaN(val) || val <= 0) return;
    const existing = equipment.kettlebellConfig.weights;
    if (existing.includes(val)) return;
    const sorted = [...existing, val].sort((a, b) => a - b);
    updateKettlebell({ weights: sorted });
    setNewKbWeight('');
  }

  function removeKbWeight(w: number) {
    updateKettlebell({
      weights: equipment.kettlebellConfig.weights.filter((x) => x !== w),
    });
  }

  const db = equipment.dumbbellConfig;
  const kb = equipment.kettlebellConfig;

  const availableDbWeights: number[] = [];
  if (db.minWeight <= db.maxWeight && db.increment > 0) {
    for (let w = db.minWeight; w <= db.maxWeight; w += db.increment) {
      availableDbWeights.push(parseFloat(w.toFixed(2)));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Settings2 className="w-5 h-5 text-violet-600" />
        <h2 className="text-xl font-semibold text-gray-900">Equipment</h2>
      </div>

      {/* Basic equipment toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(
          [
            { key: 'bodyweight', label: '🏋️ Bodyweight' },
            { key: 'pullUpBar', label: '🔧 Pull-up Bar' },
            { key: 'resistanceBands', label: '🎗️ Resistance Bands' },
            { key: 'barbell', label: '🏋️ Barbell' },
            { key: 'bench', label: '🪑 Bench' },
            { key: 'cableMachine', label: '⚙️ Cable Machine' },
          ] as { key: keyof typeof equipment; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => toggle(key)}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
              equipment[key as keyof typeof equipment]
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-white text-gray-700 border-gray-300 hover:border-violet-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Adjustable Dumbbells */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">🥊 Adjustable Dumbbells</h3>
          <button
            onClick={() => toggle('adjustableDumbbells')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              equipment.adjustableDumbbells
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {equipment.adjustableDumbbells ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {equipment.adjustableDumbbells && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Min Weight
                </label>
                <input
                  type="number"
                  min={0}
                  step={db.increment}
                  value={db.minWeight}
                  onChange={(e) =>
                    updateDumbbell({ minWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Max Weight
                </label>
                <input
                  type="number"
                  min={0}
                  step={db.increment}
                  value={db.maxWeight}
                  onChange={(e) =>
                    updateDumbbell({ maxWeight: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Increment
                </label>
                <input
                  type="number"
                  min={0.5}
                  step={0.5}
                  value={db.increment}
                  onChange={(e) =>
                    updateDumbbell({ increment: parseFloat(e.target.value) || 1 })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Unit
                </label>
                <select
                  value={db.unit}
                  onChange={(e) =>
                    updateDumbbell({ unit: e.target.value as 'kg' | 'lbs' })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                >
                  <option value="kg">kg</option>
                  <option value="lbs">lbs</option>
                </select>
              </div>
            </div>

            {availableDbWeights.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-600 mb-2">
                  Available weights ({availableDbWeights.length}):
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {availableDbWeights.map((w) => (
                    <span
                      key={w}
                      className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-xs font-medium"
                    >
                      {w} {db.unit}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Kettlebells */}
      <div className="border border-gray-200 rounded-xl p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">🔔 Kettlebells</h3>
          <button
            onClick={() => toggle('kettlebells')}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              equipment.kettlebells
                ? 'bg-violet-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {equipment.kettlebells ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {equipment.kettlebells && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-600">Unit:</label>
              <select
                value={kb.unit}
                onChange={(e) =>
                  updateKettlebell({ unit: e.target.value as 'kg' | 'lbs' })
                }
                className="border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              >
                <option value="kg">kg</option>
                <option value="lbs">lbs</option>
              </select>
            </div>

            <div className="flex gap-2">
              <input
                type="number"
                min={1}
                step={1}
                placeholder={`Add weight (${kb.unit})`}
                value={newKbWeight}
                onChange={(e) => setNewKbWeight(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addKbWeight()}
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              <button
                onClick={addKbWeight}
                className="flex items-center gap-1 px-3 py-2 bg-violet-600 text-white rounded-lg text-sm hover:bg-violet-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>

            {kb.weights.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {kb.weights.map((w) => (
                  <span
                    key={w}
                    className="flex items-center gap-1 px-2 py-1 bg-violet-50 text-violet-700 rounded-lg text-sm font-medium"
                  >
                    {w} {kb.unit}
                    <button
                      onClick={() => removeKbWeight(w)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                No kettlebell weights added yet.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
