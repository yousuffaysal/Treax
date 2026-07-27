'use client';

import { useEffect, useState } from 'react';

/**
 * Sticky reading progress bar — Treax.dc.html:1293.
 *
 * The prototype attached a scroll listener to whichever ancestor actually
 * scrolled; here the document scrolls, so this tracks window scroll against
 * the full document height.
 */
export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function update() {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable <= 0 ? 1 : Math.min(1, Math.max(0, window.scrollY / scrollable)));
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return (
    <div style={{ height: 3, background: 'var(--soft)' }}>
      <span
        role="progressbar"
        aria-label="Reading progress"
        aria-valuenow={Math.round(progress * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          display: 'block',
          height: '100%',
          background: 'var(--primary)',
          transformOrigin: 'left',
          transform: `scaleX(${progress})`,
        }}
      />
    </div>
  );
}
