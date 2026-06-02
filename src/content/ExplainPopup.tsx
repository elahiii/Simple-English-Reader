import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Copy,
  Check,
  Volume2,
  BookOpen,
  Sparkles,
  Hash,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { sendToBackground } from '../utils/messaging';
import type { ActionType, SelectionPosition, WordDefinition } from '../types';

interface ExplainPopupProps {
  text: string;
  action: ActionType;
  position: SelectionPosition;
  isDark: boolean;
  onClose: () => void;
}

const POPUP_WIDTH = 380;
const POPUP_MAX_HEIGHT = 480;
const OFFSET = 12;

const ACTION_META: Record<ActionType, { label: string; icon: React.ReactNode; color: string }> = {
  explain: { label: 'Explanation', icon: <BookOpen size={14} />, color: 'text-blue-600' },
  simplify: { label: 'Simplified', icon: <Sparkles size={14} />, color: 'text-purple-600' },
  define: { label: 'Definition', icon: <Hash size={14} />, color: 'text-emerald-600' },
};

export default function ExplainPopup({
  text,
  action,
  position,
  isDark,
  onClose,
}: ExplainPopupProps) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Compute position: prefer below selection, shift above if needed
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left = position.centerX - POPUP_WIDTH / 2;
  left = Math.max(8, Math.min(left, vw - POPUP_WIDTH - 8));

  let top = position.bottom + OFFSET;
  if (top + POPUP_MAX_HEIGHT > vh - 8) {
    top = position.top - POPUP_MAX_HEIGHT - OFFSET;
  }
  if (top < 8) top = Math.max(8, vh / 2 - POPUP_MAX_HEIGHT / 2);

  useEffect(() => {
    setLoading(true);
    setError('');
    setResult('');

    const messageType =
      action === 'explain' ? 'EXPLAIN' : action === 'simplify' ? 'SIMPLIFY' : 'DEFINE';

    sendToBackground({ type: messageType, text }).then((response) => {
      setLoading(false);
      if (response.success && typeof response.data === 'string') {
        setResult(response.data);
      } else {
        setError(response.error ?? 'Something went wrong.');
      }
    });
  }, [text, action]);

  const handleCopy = () => {
    const toCopy = result;
    navigator.clipboard.writeText(toCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(
      action === 'define' ? text : result || text,
    );
    utterance.lang = 'en-US';
    utterance.rate = 0.9;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const meta = ACTION_META[action];

  const base = isDark
    ? 'bg-gray-900 border-gray-700 text-gray-100'
    : 'bg-white border-gray-200 text-gray-900';

  const muted = isDark ? 'text-gray-400' : 'text-gray-500';
  const subtle = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const divider = isDark ? 'border-gray-800' : 'border-gray-100';

  return (
    <div
      ref={containerRef}
      className={`ser-animate-in ${isDark ? 'dark' : ''}`}
      style={{
        position: 'fixed',
        top,
        left,
        width: POPUP_WIDTH,
        zIndex: 2147483647,
        pointerEvents: 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`rounded-2xl border shadow-2xl overflow-hidden ${base}`}
        style={{ maxHeight: POPUP_MAX_HEIGHT }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${divider}`}>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${meta.color}`}>
              {meta.icon}
              <span className="text-sm font-semibold">{meta.label}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSpeak}
              title="Pronounce"
              className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <Volume2 size={14} />
            </button>
            <button
              onClick={handleCopy}
              title="Copy result"
              disabled={!result}
              className={`rounded-lg p-1.5 transition-colors disabled:opacity-30 ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </button>
            <button
              onClick={onClose}
              title="Close"
              className={`rounded-lg p-1.5 transition-colors ${isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}`}
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Original text */}
        <div className={`px-4 py-2.5 border-b ${divider} ${subtle}`}>
          <p className={`text-xs font-medium uppercase tracking-wide mb-1 ${muted}`}>Selected text</p>
          <p className="text-sm leading-relaxed line-clamp-2" style={{ color: isDark ? '#e5e7eb' : '#374151' }}>
            "{text.length > 120 ? text.slice(0, 120) + '…' : text}"
          </p>
        </div>

        {/* Result area */}
        <div className="overflow-y-auto ser-scroll" style={{ maxHeight: 280 }}>
          {loading && <LoadingState isDark={isDark} />}

          {!loading && error && (
            <ErrorState error={error} isDark={isDark} />
          )}

          {!loading && !error && result && action === 'define' && (
            <WordDefinitionView raw={result} isDark={isDark} muted={muted} divider={divider} subtle={subtle} />
          )}

          {!loading && !error && result && action !== 'define' && (
            <div className="px-4 py-4">
              <p className="text-sm leading-relaxed" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
                {result}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState({ isDark }: { isDark: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10">
      <div
        className="ser-spin rounded-full border-2 border-blue-200 border-t-blue-600"
        style={{ width: 24, height: 24 }}
      />
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Thinking…</p>
    </div>
  );
}

function ErrorState({ error, isDark }: { error: string; isDark: boolean }) {
  const isApiKey = error.toLowerCase().includes('api key');
  return (
    <div className="px-4 py-5">
      <div className={`rounded-xl p-3 flex gap-3 ${isDark ? 'bg-red-950/30' : 'bg-red-50'}`}>
        <AlertCircle size={16} className="text-red-500 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm text-red-600 leading-relaxed">{error}</p>
          {isApiKey && (
            <button
              onClick={() => chrome.runtime.openOptionsPage()}
              className="mt-2 flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Settings size={11} />
              Open Settings
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function WordDefinitionView({
  raw,
  isDark,
  muted,
  divider,
  subtle,
}: {
  raw: string;
  isDark: boolean;
  muted: string;
  divider: string;
  subtle: string;
}) {
  let def: WordDefinition | null = null;
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) def = JSON.parse(match[0]) as WordDefinition;
  } catch {
    // Fall back to plain text
  }

  if (!def) {
    return (
      <div className="px-4 py-4">
        <p className="text-sm leading-relaxed" style={{ color: isDark ? '#d1d5db' : '#374151' }}>
          {raw}
        </p>
      </div>
    );
  }

  const textColor = isDark ? '#d1d5db' : '#374151';

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      {/* Definition */}
      <div>
        <Label text="Meaning" muted={muted} />
        <p className="text-sm leading-relaxed mt-0.5" style={{ color: textColor }}>
          {def.definition}
        </p>
      </div>

      {/* Part of speech */}
      {def.partOfSpeech && (
        <div className={`border-t pt-3 ${divider}`}>
          <Label text="Part of Speech" muted={muted} />
          <span
            className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
              isDark ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'
            }`}
          >
            {def.partOfSpeech}
          </span>
        </div>
      )}

      {/* Example */}
      {def.example && (
        <div className={`border-t pt-3 ${divider}`}>
          <Label text="Example" muted={muted} />
          <p
            className={`mt-1 text-sm italic leading-relaxed rounded-lg px-3 py-2 ${subtle}`}
            style={{ color: textColor }}
          >
            {def.example}
          </p>
        </div>
      )}

      {/* Synonyms */}
      {def.synonyms?.length > 0 && (
        <div className={`border-t pt-3 ${divider}`}>
          <Label text="Synonyms" muted={muted} />
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {def.synonyms.map((s) => (
              <span
                key={s}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'
                }`}
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Label({ text, muted }: { text: string; muted: string }) {
  return (
    <p className={`text-xs font-semibold uppercase tracking-wide ${muted}`}>{text}</p>
  );
}
