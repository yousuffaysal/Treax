import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { requireViewer } from '@/lib/session';
import { getShellBadges } from '@/lib/shell-data';
import { WideShell } from '@/components/layout/app-shell';
import { AI_TOOLS } from '@/lib/ai/tools';
import { StudioClient } from './studio-client';

export const metadata: Metadata = { title: 'AI Studio' };

/** AI Studio — port of Treax.dc.html:297-400. */
export default async function AiStudioPage({ searchParams }: { searchParams: Promise<{ tool?: string }> }) {
  const viewer = await requireViewer();
  const badges = await getShellBadges(viewer.id);
  const { tool } = await searchParams;
  const t = await getTranslations();

  return (
    <WideShell viewer={viewer} badges={badges}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'end', gap: 24, borderBottom: '2px solid var(--border-strong)', paddingBottom: 28 }}>
        <div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
              fontSize: 13,
              letterSpacing: '.16em',
              color: 'var(--mute)',
              textTransform: 'uppercase',
            }}
          >
            {t('aiKicker')}
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-manrope), Manrope',
              fontWeight: 800,
              fontSize: 60,
              lineHeight: 0.98,
              letterSpacing: '-.04em',
              color: 'var(--ink)',
              margin: '16px 0 0',
              maxWidth: '16ch',
            }}
          >
            {t('aiTitle')}
          </h1>
        </div>
        <div style={{ textAlign: 'right', paddingBottom: 6 }}>
          <div style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 60, lineHeight: 0.9, letterSpacing: '-.04em', color: 'var(--ink)' }}>
            {String(AI_TOOLS.length).padStart(2, '0')}
          </div>
          <div
            style={{
              fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
              fontSize: 12,
              letterSpacing: '.14em',
              color: 'var(--mute)',
              textTransform: 'uppercase',
              marginTop: 4,
            }}
          >
            {t('aiTools6')}
          </div>
        </div>
      </div>

      <p style={{ fontSize: 18, lineHeight: 1.55, color: 'var(--body)', margin: '22px 0 0', maxWidth: '62ch' }}>{t('aiSub')}</p>

      <StudioClient
        initialTool={tool ?? null}
        labels={{ how: t('aiHow'), open: t('aiOpen'), demoType: t('demoType'), demoAi: t('demoAi') }}
      />
    </WideShell>
  );
}
