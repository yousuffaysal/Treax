import Link from 'next/link';
import type { Viewer } from '@/lib/types';
import { BillboardCard, type BillboardData } from '@/components/layout/billboard-card';
import { StarBigSolidIcon } from '@/components/ui/icons';

/** Right rail — port of Treax.dc.html:993-1054. Hidden below 1100px. */

const card: React.CSSProperties = {
  background: 'var(--card)',
  border: '1px solid var(--card-border)',
  borderRadius: 24,
  padding: 22,
  boxShadow: 'var(--elev)',
};

export type WeekSummaryLine = { color: string; text: string };

export function RightRail({
  viewer,
  billboard,
  weekSummary,
  weeklyGoal,
  champion,
  streakDays,
}: {
  viewer: Viewer;
  billboard: BillboardData;
  weekSummary: WeekSummaryLine[];
  weeklyGoal: { done: number; target: number };
  champion: { name: string; score: number } | null;
  /** Mon-Sun, true where the builder posted. Replaces the prototype's hardcoded i<=4. */
  streakDays: boolean[];
}) {
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const goalPct = weeklyGoal.target === 0 ? 0 : Math.min(100, Math.round((weeklyGoal.done / weeklyGoal.target) * 100));
  const remaining = Math.max(0, weeklyGoal.target - weeklyGoal.done);

  return (
    <aside className="sl-right" style={{ position: 'sticky', top: 84, display: 'flex', flexDirection: 'column', gap: 16 }}>
      <BillboardCard billboard={billboard} isAdmin={viewer.role === 'ADMIN'} />

      {/* Streak — always dark, in both themes */}
      <div style={{ background: '#13150d', border: '1px solid rgba(255,255,255,.07)', borderRadius: 24, padding: 22, color: '#fff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ font: '600 13px/1 var(--font-inter), Inter, sans-serif', color: 'rgba(255,255,255,.6)' }}>Your streak</span>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-manrope), Manrope',
            fontWeight: 800,
            fontSize: 44,
            letterSpacing: '-.03em',
            color: 'var(--primary)',
            margin: '8px 0 2px',
          }}
        >
          {viewer.streak} days
        </div>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,.6)', margin: '0 0 16px' }}>
          Building in public, day after day. Keep the momentum.
        </p>
        <div style={{ display: 'flex', gap: 5 }}>
          {dayLabels.map((label, i) => {
            const done = streakDays[i] ?? false;
            return (
              <span
                key={i}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 8,
                  background: done ? 'var(--primary)' : 'rgba(255,255,255,.1)',
                  display: 'grid',
                  placeItems: 'center',
                  font: '700 10px/1 var(--font-inter), Inter, sans-serif',
                  color: done ? '#163300' : 'rgba(255,255,255,.5)',
                }}
              >
                {label}
              </span>
            );
          })}
        </div>
      </div>

      {/* Weekly goal */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <h3 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: 0 }}>Weekly update goal</h3>
          <span style={{ font: '800 14px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>
            {weeklyGoal.done}/{weeklyGoal.target}
          </span>
        </div>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: '0 0 14px' }}>
          {remaining === 0 ? "You've hit your week. Nice." : `${remaining} more update${remaining === 1 ? '' : 's'} to hit your week.`}
        </p>
        <div style={{ height: 10, borderRadius: 9999, background: 'var(--soft)', overflow: 'hidden' }}>
          <div style={{ width: `${goalPct}%`, height: '100%', background: 'var(--primary)', borderRadius: 9999 }} />
        </div>
      </div>

      {/* Your week, by AI */}
      <div style={card}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            font: '700 16px/1 var(--font-inter), Inter, sans-serif',
            color: 'var(--ink)',
            margin: '0 0 4px',
          }}
        >
          <StarBigSolidIcon size={16} />
          Your week, by AI
        </h3>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: '0 0 14px' }}>Auto-summarised from your updates.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {weekSummary.length === 0 ? (
            <p style={{ fontSize: 14, lineHeight: 1.45, color: 'var(--body)', margin: 0 }}>
              Post an update and your week gets summarised here.
            </p>
          ) : (
            weekSummary.map((line, i) => (
              <div key={i} style={{ display: 'flex', gap: 9, fontSize: 14, lineHeight: 1.45, color: 'var(--body)' }}>
                <span style={{ color: line.color, flexShrink: 0 }}>▸</span>
                {line.text}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Daily challenge */}
      <div style={card}>
        <h3
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            font: '700 16px/1 var(--font-inter), Inter, sans-serif',
            color: 'var(--ink)',
            margin: '0 0 4px',
          }}
        >
          Daily challenge
        </h3>
        <p style={{ fontSize: 13, color: 'var(--mute)', margin: '0 0 12px' }}>Signal Rush — beat the 30-second clock.</p>
        {champion ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: 'var(--soft)',
              borderRadius: 14,
              padding: '10px 12px',
              marginBottom: 14,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  font: '700 13px/1.2 var(--font-inter), Inter, sans-serif',
                  color: 'var(--ink)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {champion.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 2 }}>champion · {champion.score} pts</div>
            </div>
          </div>
        ) : null}
        <Link
          href="/game"
          style={{
            width: '100%',
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 14,
            padding: 12,
            font: '600 14px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          Play now
        </Link>
      </div>
    </aside>
  );
}
