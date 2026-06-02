import React from 'react';
import { BookOpen, Sparkles, Hash, X } from 'lucide-react';
import type { SelectionPosition } from '../types';

interface FloatingTooltipProps {
  position: SelectionPosition;
  selectedText: string;
  isDark: boolean;
  onAction: (action: 'explain' | 'simplify' | 'define') => void;
  onClose: () => void;
}

const TOOLTIP_HEIGHT = 48;
const TOOLTIP_WIDTH = 240;
const OFFSET = 10;

export default function FloatingTooltip({
  position,
  selectedText,
  isDark,
  onAction,
  onClose,
}: FloatingTooltipProps) {
  const isSingleWord = !selectedText.trim().includes(' ');

  // Position above the selection
  let top = position.top - TOOLTIP_HEIGHT - OFFSET;
  let left = position.centerX - TOOLTIP_WIDTH / 2;

  // Clamp horizontally within viewport
  const vw = window.innerWidth;
  left = Math.max(8, Math.min(left, vw - TOOLTIP_WIDTH - 8));

  // If not enough space above, show below
  if (top < 8) {
    top = position.bottom + OFFSET;
  }

  return (
    <div
      className={`ser-animate-tooltip ${isDark ? 'dark' : ''}`}
      style={{ position: 'fixed', top, left, zIndex: 2147483647, pointerEvents: 'auto' }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div
        className={`
          flex items-center gap-1 rounded-xl border px-2 py-1.5 shadow-2xl
          ${isDark
            ? 'border-gray-700 bg-gray-900 text-gray-100'
            : 'border-gray-200 bg-white text-gray-800'}
        `}
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontSize: 13, minWidth: TOOLTIP_WIDTH }}
      >
        {/* Logo pill */}
        <div className={`flex items-center gap-1 rounded-lg px-2 py-1 mr-1 ${isDark ? 'bg-blue-900/40' : 'bg-blue-50'}`}>
          <BookOpen size={12} className="text-blue-600" />
          <span className="text-blue-600 font-semibold" style={{ fontSize: 11 }}>SER</span>
        </div>

        {isSingleWord && (
          <TooltipButton
            onClick={() => onAction('define')}
            isDark={isDark}
            icon={<Hash size={12} />}
            label="Define"
          />
        )}
        <TooltipButton
          onClick={() => onAction('explain')}
          isDark={isDark}
          icon={<BookOpen size={12} />}
          label="Explain"
        />
        <TooltipButton
          onClick={() => onAction('simplify')}
          isDark={isDark}
          icon={<Sparkles size={12} />}
          label="Simplify"
        />

        <button
          onClick={onClose}
          className={`ml-auto rounded-lg p-1 transition-colors ${
            isDark ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
          }`}
          title="Close"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

function TooltipButton({
  onClick,
  isDark,
  icon,
  label,
}: {
  onClick: () => void;
  isDark: boolean;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-1 rounded-lg px-2 py-1 font-medium transition-colors
        ${isDark
          ? 'text-gray-200 hover:bg-gray-700'
          : 'text-gray-700 hover:bg-gray-100'}
      `}
      style={{ fontSize: 12 }}
    >
      {icon}
      {label}
    </button>
  );
}
