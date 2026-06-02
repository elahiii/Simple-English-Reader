import React, { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  Clock,
  Copy,
  Check,
  Trash2,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Hash,
} from 'lucide-react';
import { getHistory, deleteFromHistory, clearHistory, getSettings } from '../utils/storage';
import type { ActionType, HistoryEntry } from '../types';

const ACTION_BADGE: Record<ActionType, { label: string; cls: string }> = {
  explain: { label: 'Explain', cls: 'bg-blue-100 text-blue-700' },
  simplify: { label: 'Simplify', cls: 'bg-purple-100 text-purple-700' },
  define: { label: 'Define', cls: 'bg-emerald-100 text-emerald-700' },
};

const ACTION_ICON: Record<ActionType, React.ReactNode> = {
  explain: <BookOpen size={11} />,
  simplify: <Sparkles size={11} />,
  define: <Hash size={11} />,
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

export default function App() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    getHistory().then(setEntries);
    getSettings().then((s) => {
      setIsDark(s.theme === 'dark');
      document.documentElement.classList.toggle('dark', s.theme === 'dark');
    });
  }, []);

  const filtered = useMemo(() => {
    if (!query) return entries;
    const q = query.toLowerCase();
    return entries.filter(
      (e) =>
        e.text.toLowerCase().includes(q) ||
        e.result.toLowerCase().includes(q) ||
        e.action.includes(q),
    );
  }, [entries, query]);

  // Group by date
  const groups = useMemo(() => {
    const map = new Map<string, HistoryEntry[]>();
    for (const e of filtered) {
      const key = formatDate(e.timestamp);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string) => {
    await deleteFromHistory(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    await clearHistory();
    setEntries([]);
    setConfirmClear(false);
  };

  const handleCopy = (entry: HistoryEntry) => {
    navigator.clipboard.writeText(entry.result).then(() => {
      setCopied(entry.id);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const bg = isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900';
  const card = isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200';
  const muted = isDark ? 'text-gray-500' : 'text-gray-400';
  const inputBg = isDark
    ? 'bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-600 focus:border-blue-500'
    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-blue-500';

  return (
    <div className={`min-h-screen ${bg} font-sans`}>
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-600 p-2.5">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lookup History</h1>
              <p className={`text-sm ${muted}`}>{entries.length} total lookup{entries.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          {entries.length > 0 && (
            <button
              onClick={handleClearAll}
              className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${
                confirmClear
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : isDark
                  ? 'text-red-400 hover:bg-red-950/30'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              {confirmClear ? 'Confirm clear all?' : 'Clear all'}
            </button>
          )}
        </div>

        {/* Search */}
        {entries.length > 0 && (
          <div className="relative mb-6">
            <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search history…"
              className={`w-full rounded-xl border pl-9 pr-8 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 ${muted} hover:text-gray-600`}
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}

        {/* Empty state */}
        {entries.length === 0 && (
          <div className="text-center py-20">
            <BookOpen size={40} className={`mx-auto mb-4 ${muted}`} />
            <p className={`text-lg font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              No lookups yet
            </p>
            <p className={`text-sm ${muted}`}>
              Select text on any webpage and click Explain or Simplify to get started.
            </p>
          </div>
        )}

        {/* No results */}
        {entries.length > 0 && filtered.length === 0 && (
          <div className="text-center py-16">
            <p className={`text-sm ${muted}`}>No results for "{query}"</p>
          </div>
        )}

        {/* Groups */}
        <div className="space-y-6">
          {groups.map(([date, items]) => (
            <div key={date}>
              <h2 className={`text-xs font-semibold uppercase tracking-wide mb-2 ${muted}`}>{date}</h2>
              <div className={`rounded-xl border overflow-hidden divide-y ${card} ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                {items.map((entry) => (
                  <HistoryRow
                    key={entry.id}
                    entry={entry}
                    expanded={expanded.has(entry.id)}
                    copied={copied === entry.id}
                    isDark={isDark}
                    muted={muted}
                    onToggle={() => toggle(entry.id)}
                    onCopy={() => handleCopy(entry)}
                    onDelete={() => handleDelete(entry.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function HistoryRow({
  entry,
  expanded,
  copied,
  isDark,
  muted,
  onToggle,
  onCopy,
  onDelete,
}: {
  entry: HistoryEntry;
  expanded: boolean;
  copied: boolean;
  isDark: boolean;
  muted: string;
  onToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const badge = ACTION_BADGE[entry.action];
  const icon = ACTION_ICON[entry.action];

  return (
    <div className={`transition-colors ${isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-50/50'}`}>
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-start gap-3"
      >
        {/* Badge */}
        <span className={`mt-0.5 shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${badge.cls}`}>
          {icon}
          {badge.label}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            "{entry.text.length > 80 ? entry.text.slice(0, 80) + '…' : entry.text}"
          </p>
          {!expanded && (
            <p className={`text-xs mt-0.5 truncate ${muted}`}>
              {entry.result.slice(0, 100)}…
            </p>
          )}
        </div>

        {/* Time */}
        <div className="shrink-0 flex flex-col items-end gap-1">
          <span className={`text-xs ${muted}`}>{formatTime(entry.timestamp)}</span>
          {expanded ? (
            <ChevronUp size={14} className={muted} />
          ) : (
            <ChevronDown size={14} className={muted} />
          )}
        </div>
      </button>

      {/* Expanded result */}
      {expanded && (
        <div className={`px-4 pb-4 ${isDark ? 'border-t border-gray-800' : 'border-t border-gray-100'}`}>
          <p className={`text-sm leading-relaxed mt-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {entry.result}
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={onCopy}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
            <button
              onClick={onDelete}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                isDark
                  ? 'text-red-400 hover:bg-red-950/30'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
