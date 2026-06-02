import React, { useEffect, useState } from 'react';
import { BookOpen, Settings, Clock, Key, ChevronRight, Sparkles } from 'lucide-react';
import { getSettings, getHistory } from '../utils/storage';
import type { Settings as SettingsType } from '../types';

export default function App() {
  const [settings, setSettings] = useState<SettingsType | null>(null);
  const [historyCount, setHistoryCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);

  useEffect(() => {
    getSettings().then(setSettings);
    getHistory().then((h) => {
      setHistoryCount(h.length);
      const today = new Date().setHours(0, 0, 0, 0);
      setTodayCount(h.filter((e) => e.timestamp >= today).length);
    });
  }, []);

  const hasApiKey = Boolean(settings?.apiKey);

  const openOptions = () => chrome.runtime.openOptionsPage();
  const openHistory = () =>
    chrome.tabs.create({ url: chrome.runtime.getURL('history.html') });

  return (
    <div className="w-80 bg-white font-sans">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 px-4 py-5">
        <div className="flex items-center gap-2 mb-1">
          <div className="rounded-lg bg-white/20 p-1.5">
            <BookOpen size={16} className="text-white" />
          </div>
          <h1 className="text-white font-bold text-base tracking-tight">Simple English Reader</h1>
        </div>
        <p className="text-blue-100 text-xs">
          Highlight any text on a webpage to get instant explanations.
        </p>
      </div>

      {/* API Key Warning */}
      {!hasApiKey && settings !== null && (
        <button
          onClick={openOptions}
          className="w-full flex items-start gap-3 px-4 py-3 bg-amber-50 border-b border-amber-100 hover:bg-amber-100 transition-colors text-left"
        >
          <Key size={14} className="text-amber-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-800">API Key Required</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Add your OpenAI API key to start explaining text.
            </p>
          </div>
          <ChevronRight size={14} className="text-amber-500 mt-0.5 shrink-0" />
        </button>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-px bg-gray-100 border-b border-gray-100">
        <StatCard label="Today" value={todayCount} />
        <StatCard label="Total lookups" value={historyCount} />
      </div>

      {/* How to use */}
      <div className="px-4 py-3 border-b border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">How to use</p>
        <ol className="space-y-1.5">
          {[
            'Select any text on a webpage',
            'Click Explain, Simplify, or Define',
            'Get instant AI-powered help',
          ].map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <span className="shrink-0 w-4 h-4 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </div>

      {/* Actions */}
      <div className="p-2">
        <PopupLink icon={<Clock size={14} />} label="Lookup History" count={historyCount} onClick={openHistory} />
        <PopupLink icon={<Settings size={14} />} label="Settings" onClick={openOptions} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">v1.0.0</span>
        {hasApiKey && (
          <div className="flex items-center gap-1 text-xs text-emerald-600">
            <Sparkles size={11} />
            <span>{settings?.model}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white px-4 py-3 text-center">
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function PopupLink({
  icon,
  label,
  count,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
    >
      <span className="text-gray-400">{icon}</span>
      <span className="flex-1 text-left font-medium">{label}</span>
      {count !== undefined && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
          {count}
        </span>
      )}
      <ChevronRight size={14} className="text-gray-300" />
    </button>
  );
}
