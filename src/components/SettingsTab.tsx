import React from 'react';
import { Key } from 'lucide-react';

interface SettingsTabProps {
  groqKey: string;
  setGroqKey: (key: string) => void;
  geminiKey: string;
  setGeminiKey: (key: string) => void;
}

export default function SettingsTab({ groqKey, setGroqKey, geminiKey, setGeminiKey }: SettingsTabProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-2xl font-bold mb-1">Project Settings</h2>
        <p className="text-gray-400 text-sm">Configure your API keys for script generation and vision analysis.</p>
      </div>

      <div className="space-y-4 mt-8">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Key size={16} className="text-purple-400" />
            GROQ_API_KEY
          </label>
          <input
            type="password"
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            placeholder="gsk_..."
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all"
          />
          <p className="text-xs text-gray-500 mt-2">Required for Llama 3 70B script generation.</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
            <Key size={16} className="text-blue-400" />
            GEMINI_API_KEY
          </label>
          <input
            type="password"
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder="AIza..."
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
          />
          <p className="text-xs text-gray-500 mt-2">Required for Gemini Vision context analysis.</p>
        </div>
      </div>
    </div>
  );
}
