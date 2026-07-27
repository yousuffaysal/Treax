'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

type ToastTone = 'success' | 'error';
type Toast = { id: number; message: string; tone: ToastTone };

type ToastValue = {
  /** Mirrors the prototype's flash() (Treax.dc.html:2844) — 2.6s, one at a time. */
  flash: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastValue | null>(null);
const DURATION = 2600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const seq = useRef(0);

  const show = useCallback((message: string, tone: ToastTone) => {
    seq.current += 1;
    setToast({ id: seq.current, message, tone });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), DURATION);
  }, []);

  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);

  const flash = useCallback((message: string) => show(message, 'success'), [show]);
  const error = useCallback((message: string) => show(message, 'error'), [show]);

  return (
    <ToastContext.Provider value={{ flash, error }}>
      {children}
      <div aria-live="polite" aria-atomic="true">
        {toast ? <ToastCard key={toast.id} toast={toast} /> : null}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast }: { toast: Toast }) {
  const accent = toast.tone === 'error' ? 'var(--negative)' : 'var(--primary)';
  const glyph = toast.tone === 'error' ? '#fff' : '#163300';

  return (
    <div
      className="sl-toast"
      role="status"
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 30,
        transform: 'translateX(-50%)',
        transformOrigin: 'bottom center',
        zIndex: 80,
        background: 'linear-gradient(140deg,#1c1e19,#0e0f0c)',
        color: '#fff',
        padding: '15px 22px 15px 15px',
        borderRadius: 18,
        font: '600 14.5px/1.3 var(--font-inter), Inter, sans-serif',
        boxShadow: '0 18px 44px rgba(0,0,0,.42),0 0 0 1px rgba(255,255,255,.06) inset',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        overflow: 'hidden',
        animation: 'sl-genie .62s cubic-bezier(.34,1.56,.64,1) both',
        willChange: 'transform,opacity',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '38%',
          height: '100%',
          background: 'linear-gradient(105deg,transparent,rgba(255,255,255,.14),transparent)',
          transform: 'translateX(-120%)',
          animation: 'sl-sheen 1.4s ease .35s both',
          pointerEvents: 'none',
        }}
      />
      <span style={{ position: 'relative', flexShrink: 0, width: 34, height: 34, display: 'grid', placeItems: 'center' }}>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 9999,
            background: accent,
            opacity: 0.32,
            animation: 'sl-ring 1.1s ease-out .2s both',
          }}
        />
        <span
          style={{
            position: 'relative',
            width: 34,
            height: 34,
            borderRadius: 9999,
            background: accent,
            display: 'grid',
            placeItems: 'center',
            boxShadow: '0 3px 10px rgba(46,173,75,.5)',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={glyph} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {toast.tone === 'error' ? (
              <path d="M18 6 6 18M6 6l12 12" style={{ strokeDasharray: 22, strokeDashoffset: 22, animation: 'sl-check .4s ease .32s forwards' }} />
            ) : (
              <path d="M20 6 9 17l-5-5" style={{ strokeDasharray: 22, strokeDashoffset: 22, animation: 'sl-check .4s ease .32s forwards' }} />
            )}
          </svg>
        </span>
      </span>
      <span style={{ position: 'relative' }}>{toast.message}</span>
      <span
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          height: 3,
          width: '100%',
          transformOrigin: 'left',
          transform: 'scaleX(1)',
          background: accent,
          borderRadius: '0 0 0 18px',
          animation: `sl-drain ${DURATION}ms linear both`,
        }}
      />
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
