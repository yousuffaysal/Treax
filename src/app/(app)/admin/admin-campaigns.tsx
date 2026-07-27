'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { compactCount } from '@/lib/types';
import { createCampaign, toggleCampaign } from './admin-actions';

type Campaign = {
  id: string;
  brand: string;
  title: string;
  body: string;
  cta: string;
  impressions: number;
  clicks: number;
  spend: number;
  budget: number;
  active: boolean;
};

const label: React.CSSProperties = {
  display: 'block',
  font: '600 13px/1 var(--font-inter), Inter, sans-serif',
  color: 'var(--ink)',
  marginBottom: 8,
};

const input: React.CSSProperties = {
  width: '100%',
  background: 'var(--soft)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '11px 14px',
  fontSize: 14.5,
  color: 'var(--ink)',
};

export function AdminCampaigns({ campaigns }: { campaigns: Campaign[] }) {
  const router = useRouter();
  const { flash, error } = useToast();
  const [draft, setDraft] = useState({ brand: '', title: '', body: '', cta: 'Get started', link: '' });
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function publish() {
    if (!draft.brand.trim() || !draft.title.trim()) return error('Add a brand and a headline first.');
    setSaving(true);
    const result = await createCampaign(draft);
    setSaving(false);
    if (!result.ok) return error(result.error);
    flash('Campaign is live in the feed.');
    setDraft({ brand: '', title: '', body: '', cta: 'Get started', link: '' });
    router.refresh();
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 22, padding: 22 }}>
        <h2 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 16px' }}>New campaign</h2>
        <div className="sl-grid2" style={{ marginBottom: 14 }}>
          <div>
            <label htmlFor="ad-brand" style={label}>Brand</label>
            <input id="ad-brand" value={draft.brand} onChange={set('brand')} placeholder="bKash for Business" style={input} />
          </div>
          <div>
            <label htmlFor="ad-cta" style={label}>Button label</label>
            <input id="ad-cta" value={draft.cta} onChange={set('cta')} style={input} />
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="ad-title" style={label}>Headline</label>
          <input id="ad-title" value={draft.title} onChange={set('title')} placeholder="Take payments the day you launch" style={input} />
        </div>
        <div style={{ marginBottom: 14 }}>
          <label htmlFor="ad-body" style={label}>Body</label>
          <textarea id="ad-body" value={draft.body} onChange={set('body')} rows={3} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
        <div style={{ marginBottom: 18 }}>
          <label htmlFor="ad-link" style={label}>Link</label>
          <input id="ad-link" value={draft.link} onChange={set('link')} placeholder="https://…" style={input} />
        </div>
        <button
          onClick={publish}
          disabled={saving}
          style={{
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 9999,
            padding: '12px 24px',
            font: '600 14.5px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Publishing…' : 'Publish campaign'}
        </button>
      </div>

      <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 22, padding: 22 }}>
        <h2 style={{ font: '700 16px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)', margin: '0 0 16px' }}>Campaigns</h2>
        {campaigns.length === 0 ? (
          <p style={{ margin: 0, fontSize: 15, color: 'var(--mute)' }}>No campaigns yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {campaigns.map((c) => {
              const ctr = c.impressions === 0 ? null : (c.clicks / c.impressions) * 100;
              return (
                <div key={c.id} style={{ background: 'var(--soft)', borderRadius: 18, padding: '16px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{c.brand}</span>
                    <span
                      style={{
                        font: '700 10.5px/1 var(--font-inter), Inter, sans-serif',
                        textTransform: 'uppercase',
                        letterSpacing: '.05em',
                        padding: '4px 9px',
                        borderRadius: 9999,
                        background: c.active ? 'rgba(46,173,75,.14)' : 'var(--card)',
                        color: c.active ? 'var(--positive)' : 'var(--mute)',
                      }}
                    >
                      {c.active ? 'live' : 'paused'}
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                      onClick={() =>
                        startTransition(async () => {
                          const result = await toggleCampaign(c.id);
                          if (!result.ok) return error(result.error);
                          flash(result.data.active ? 'Campaign resumed.' : 'Campaign paused.');
                          router.refresh();
                        })
                      }
                      style={{
                        borderRadius: 9999,
                        padding: '8px 16px',
                        font: '600 12.5px/1 var(--font-inter), Inter, sans-serif',
                        cursor: 'pointer',
                        border: '1px solid var(--border-strong)',
                        background: 'var(--card)',
                        color: 'var(--ink)',
                      }}
                    >
                      {c.active ? 'Pause' : 'Resume'}
                    </button>
                  </div>

                  <p style={{ margin: '10px 0 0', fontSize: 14.5, color: 'var(--ink)', fontWeight: 500 }}>{c.title}</p>

                  <div style={{ display: 'flex', gap: 22, marginTop: 14, flexWrap: 'wrap' }}>
                    <Metric label="Impressions" value={compactCount(c.impressions)} />
                    <Metric label="Clicks" value={compactCount(c.clicks)} />
                    <Metric label="CTR" value={ctr === null ? '—' : `${ctr.toFixed(2)}%`} />
                    <Metric label="Spend" value={`৳${compactCount(Math.round(c.spend))}`} />
                    {c.budget > 0 ? <Metric label="Budget" value={`৳${compactCount(Math.round(c.budget))}`} /> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Metric({ label: name, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ font: '800 18px/1 var(--font-manrope), Manrope', color: 'var(--ink)' }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--mute)', marginTop: 3 }}>{name}</div>
    </div>
  );
}
