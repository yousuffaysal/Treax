/** Loading state for the streamed feed rows. Matches the post card's geometry. */

const shimmer: React.CSSProperties = {
  background:
    'linear-gradient(90deg, var(--soft) 0%, var(--soft-2) 40%, var(--soft) 80%)',
  backgroundSize: '260% 100%',
  animation: 'sl-shimmer 1.4s ease-in-out infinite',
  borderRadius: 8,
};

function Line({ width, height = 14 }: { width: string; height?: number }) {
  return <div style={{ ...shimmer, width, height }} />;
}

export function FeedSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <article
          key={i}
          style={{
            background: 'var(--card)',
            border: '1px solid var(--card-border)',
            borderRadius: 24,
            padding: 22,
            boxShadow: 'var(--elev)',
          }}
        >
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ ...shimmer, width: 48, height: 48, borderRadius: 9999, flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Line width="38%" height={15} />
              <Line width="52%" height={12} />
            </div>
          </div>
          <div style={{ ...shimmer, width: 104, height: 24, borderRadius: 9999, margin: '14px 0 12px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <Line width="100%" />
            <Line width="94%" />
            <Line width="72%" />
          </div>
        </article>
      ))}
      <span className="sr-only">Loading updates…</span>
    </div>
  );
}
