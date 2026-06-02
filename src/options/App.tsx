import React, { useEffect, useState } from 'react';
import {
  Key,
  Eye,
  EyeOff,
  Cpu,
  Moon,
  Sun,
  Zap,
  Check,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { getSettings, saveSettings, defaultSettings } from '../utils/storage';
import type { Settings } from '../types';

const MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', desc: 'Fast & affordable' },
  { id: 'gpt-4o', label: 'GPT-4o', desc: 'More capable' },
  { id: 'gpt-4-turbo', label: 'GPT-4 Turbo', desc: 'High quality' },
  { id: 'gpt-5-mini', label: 'GPT-5 Mini', desc: 'Next generation' },
];

export default function App() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [showKey, setShowKey] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [useCustom, setUseCustom] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setIsDark(s.theme === 'dark');
      const isKnown = MODELS.some((m) => m.id === s.model);
      if (!isKnown && s.model) {
        setUseCustom(true);
        setCustomModel(s.model);
      }
    });
  }, []);

  // Sync dark mode class on html element
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const update = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleThemeToggle = () => {
    const next = !isDark;
    setIsDark(next);
    update('theme', next ? 'dark' : 'light');
  };

  const handleSave = async () => {
    setSaving(true);
    const toSave: Settings = {
      ...settings,
      model: useCustom && customModel ? customModel : settings.model,
    };
    await saveSettings(toSave);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const bg = isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const label = isDark ? 'text-gray-300' : 'text-gray-700';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="rounded-xl bg-blue-600 p-2.5">
            <BookOpen size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Simple English Reader</h1>
            <p className={`text-sm ${muted}`}>Extension Settings</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* API Key */}
          <Section title="OpenAI API Key" icon={<Key size={16} />} card={card} label={label}>
            <p className={`text-sm mb-3 ${muted}`}>
              Required to use AI features. Get your key at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                platform.openai.com
              </a>
              .
            </p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={settings.apiKey}
                onChange={(e) => update('apiKey', e.target.value)}
                placeholder="sk-..."
                className={`input-field pr-10 ${isDark ? 'dark' : ''}`}
              />
              <button
                onClick={() => setShowKey((v) => !v)}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:text-gray-600`}
              >
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {settings.apiKey && !settings.apiKey.startsWith('sk-') && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-600">
                <AlertCircle size={12} />
                API keys usually start with "sk-"
              </div>
            )}
          </Section>

          {/* Model */}
          <Section title="AI Model" icon={<Cpu size={16} />} card={card} label={label}>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {MODELS.map((m) => {
                const selected = !useCustom && settings.model === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => { setUseCustom(false); update('model', m.id); }}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-all ${
                      selected
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
                        : isDark
                        ? 'border-gray-700 hover:border-gray-600 hover:bg-gray-800'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className={`text-sm font-medium ${selected ? 'text-blue-600' : label}`}>
                        {m.label}
                      </span>
                      {selected && <Check size={13} className="text-blue-600" />}
                    </div>
                    <span className={`text-xs ${muted}`}>{m.desc}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setUseCustom((v) => !v)}
              className={`text-xs mb-2 ${useCustom ? 'text-blue-600' : muted} hover:text-blue-500 transition-colors`}
            >
              {useCustom ? '↓ Using custom model' : '+ Use custom model ID'}
            </button>

            {useCustom && (
              <input
                type="text"
                value={customModel}
                onChange={(e) => setCustomModel(e.target.value)}
                placeholder="e.g. gpt-4o-2024-08-06"
                className="input-field"
              />
            )}
          </Section>

          {/* Appearance & Behavior */}
          <Section title="Appearance & Behavior" icon={<Zap size={16} />} card={card} label={label}>
            <div className="space-y-1">
              <Toggle
                label="Dark theme"
                description="Use dark colors for the extension UI"
                checked={isDark}
                onChange={handleThemeToggle}
                icon={isDark ? <Moon size={15} /> : <Sun size={15} />}
                isDark={isDark}
                muted={muted}
              />
              <Toggle
                label="Auto-show popup"
                description="Show tooltip automatically when text is selected"
                checked={settings.autoShowPopup}
                onChange={(v) => update('autoShowPopup', v)}
                isDark={isDark}
                muted={muted}
              />
            </div>
          </Section>

          {/* Save button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-primary min-w-28"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Saving…
                </span>
              ) : saved ? (
                <span className="flex items-center gap-1.5">
                  <Check size={14} />
                  Saved!
                </span>
              ) : (
                'Save Settings'
              )}
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 animate-fade-in">
                Settings saved successfully.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  icon,
  card,
  label,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  card: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`rounded-xl border p-5 ${card}`}>
      <div className={`flex items-center gap-2 mb-4 ${label}`}>
        {icon}
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
  icon,
  isDark,
  muted,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
  isDark: boolean;
  muted: string;
}) {
  return (
    <div className={`flex items-center justify-between rounded-lg px-3 py-3 ${isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'} transition-colors`}>
      <div className="flex items-start gap-2.5">
        {icon && <span className={`mt-0.5 ${muted}`}>{icon}</span>}
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className={`text-xs mt-0.5 ${muted}`}>{description}</p>
        </div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
          checked ? 'bg-blue-600' : isDark ? 'bg-gray-700' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
            checked ? 'translate-x-4' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
