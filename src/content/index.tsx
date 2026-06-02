import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom/client';
import FloatingTooltip from './FloatingTooltip';
import ExplainPopup from './ExplainPopup';
import { getSettings } from '../utils/storage';
import type { ActionType, SelectionPosition, Settings } from '../types';
// @ts-expect-error — Vite ?inline import returns string
import styles from './content.css?inline';

interface UIState {
  phase: 'hidden' | 'tooltip' | 'popup';
  selectedText: string;
  position: SelectionPosition;
  action: ActionType | null;
}

const INITIAL: UIState = {
  phase: 'hidden',
  selectedText: '',
  position: { top: 0, bottom: 0, left: 0, right: 0, centerX: 0 },
  action: null,
};

function ContentApp({ shadowRoot }: { shadowRoot: ShadowRoot }) {
  const [ui, setUi] = useState<UIState>(INITIAL);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isDark, setIsDark] = useState(false);

  // Ref so the stable mouseup handler always sees the latest settings
  const settingsRef = useRef<Settings | null>(null);
  settingsRef.current = settings;

  useEffect(() => {
    getSettings().then((s) => {
      setSettings(s);
      setIsDark(s.theme === 'dark');
    });
    const onChanged = () => {
      getSettings().then((s) => {
        setSettings(s);
        setIsDark(s.theme === 'dark');
      });
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  const close = useCallback(() => setUi(INITIAL), []);

  // Close when clicking outside the extension UI
  useEffect(() => {
    const onMousedown = (e: MouseEvent) => {
      const path = e.composedPath();
      const inside = path.some(
        (el) => el === shadowRoot || (el instanceof Element && el.id === 'ser-root'),
      );
      if (!inside) setUi(INITIAL);
    };
    document.addEventListener('mousedown', onMousedown, true);
    return () => document.removeEventListener('mousedown', onMousedown, true);
  }, [shadowRoot]);

  // Stable mouseup handler via ref — never recreated, avoids stale-closure bug.
  // Previously ui.phase was in the dep array, causing the old handler (with phase==='popup')
  // to still be active after the popup closed, which silently dropped the next selection.
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // Ignore events that originate inside our shadow DOM
      const path = e.composedPath();
      if (path.some((el) => el === shadowRoot)) return;

      const s = settingsRef.current;
      if (!s?.autoShowPopup) return;

      // Small delay so the browser has time to finalise the selection
      setTimeout(() => {
        const sel = window.getSelection();
        const text = sel?.toString().trim() ?? '';
        if (!text || !sel || sel.rangeCount === 0) return;

        const range = sel.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Zero-size rect means selection collapsed or not on screen
        if (rect.width === 0 && rect.height === 0) return;

        setUi({
          phase: 'tooltip',
          selectedText: text,
          position: {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            right: rect.right,
            centerX: rect.left + rect.width / 2,
          },
          action: null,
        });
      }, 10);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [shadowRoot]); // shadowRoot never changes — handler is truly stable

  const handleAction = useCallback((action: ActionType) => {
    setUi((prev) => ({ ...prev, phase: 'popup', action }));
  }, []);

  if (ui.phase === 'hidden') return null;

  return (
    <>
      {ui.phase === 'tooltip' && (
        <FloatingTooltip
          position={ui.position}
          selectedText={ui.selectedText}
          isDark={isDark}
          onAction={handleAction}
          onClose={close}
        />
      )}
      {ui.phase === 'popup' && ui.action && (
        <ExplainPopup
          text={ui.selectedText}
          action={ui.action}
          position={ui.position}
          isDark={isDark}
          onClose={close}
        />
      )}
    </>
  );
}

function mount() {
  if (document.getElementById('ser-root')) return;

  const host = document.createElement('div');
  host.id = 'ser-root';
  host.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;overflow:visible;z-index:2147483647;pointer-events:none;';
  document.body.appendChild(host);

  const shadowRoot = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = styles as string;
  shadowRoot.appendChild(style);

  const container = document.createElement('div');
  container.style.cssText = 'pointer-events:none;';
  shadowRoot.appendChild(container);

  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ContentApp shadowRoot={shadowRoot} />
    </React.StrictMode>,
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
