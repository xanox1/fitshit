import { useState } from 'react';
import { Key, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function SettingsPanel() {
  const { settings, updateApiKey } = useApp();
  const [draft, setDraft] = useState(settings.openAiApiKey);
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  function handleSave() {
    updateApiKey(draft.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Key className="w-5 h-5 text-violet-600" />
        <h2 className="text-xl font-semibold text-gray-900">Settings</h2>
      </div>

      <div className="border border-gray-200 rounded-xl p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">OpenAI API Key</h3>
          <p className="text-sm text-gray-500">
            Required to generate workouts with AI. Your key is stored only in your
            browser's local storage and never sent to any third-party server.
          </p>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={show ? 'text' : 'password'}
              placeholder="sk-..."
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setSaved(false);
              }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              saved
                ? 'bg-green-600 text-white'
                : 'bg-violet-600 text-white hover:bg-violet-700'
            }`}
          >
            {saved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>

        {settings.openAiApiKey && (
          <p className="text-xs text-green-600 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" />
            API key is set
          </p>
        )}
      </div>
    </div>
  );
}
