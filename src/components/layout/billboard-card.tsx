'use client';

import Image from 'next/image';
import { useRef, useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { ImageIcon, ShieldPillIcon } from '@/components/ui/icons';

/**
 * Platform billboard — port of Treax.dc.html:994-1022.
 *
 * In the prototype the poster lived in localStorage and the "admin mode" pill was
 * a free toggle. Here the poster is a single Billboard row in Postgres, the image
 * goes to Cloudinary, and the edit affordances only render for ADMIN (the server
 * action re-checks the role regardless of what the client sends).
 */

export type BillboardData = {
  imageUrl: string | null;
  headline: string | null;
  cta: string;
  link: string;
};

export function BillboardCard({ billboard, isAdmin }: { billboard: BillboardData; isAdmin: boolean }) {
  const { flash, error } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [cta, setCta] = useState(billboard.cta);
  const [link, setLink] = useState(billboard.link);
  const [imageUrl, setImageUrl] = useState(billboard.imageUrl);
  const [pending, startTransition] = useTransition();

  const adminMode = isAdmin && editing;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return error('That file is not an image.');
    if (file.size > 4 * 1024 * 1024) return error('Keep the poster under 4MB.');

    const body = new FormData();
    body.set('file', file);
    body.set('folder', 'billboard');
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) return error('Upload failed. Try again.');
    const { url } = (await res.json()) as { url: string };
    setImageUrl(url);
    startTransition(async () => {
      const { saveBillboard } = await import('@/app/(app)/admin/actions');
      const result = await saveBillboard({ imageUrl: url, cta, link });
      if (result.ok) flash('Poster published — every builder sees it now.');
      else error(result.error);
    });
  }

  function saveMeta(next: { cta?: string; link?: string }) {
    startTransition(async () => {
      const { saveBillboard } = await import('@/app/(app)/admin/actions');
      const result = await saveBillboard({ imageUrl, cta: next.cta ?? cta, link: next.link ?? link });
      if (!result.ok) error(result.error);
    });
  }

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 24,
        overflow: 'hidden',
        boxShadow: 'var(--elev)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px 0' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontFamily: 'var(--font-jetbrains), JetBrains Mono, monospace',
            fontSize: 11,
            letterSpacing: '.12em',
            textTransform: 'uppercase',
            color: 'var(--mute)',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: 9999, background: 'var(--primary)' }} />
          Sponsored
        </span>
        {isAdmin ? (
          <button
            onClick={() => setEditing((v) => !v)}
            title="Toggle admin controls"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              border: 'none',
              borderRadius: 9999,
              padding: '5px 11px',
              font: '700 11px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              background: adminMode ? 'var(--ink)' : 'var(--soft)',
              color: adminMode ? 'var(--card)' : 'var(--body)',
            }}
          >
            <ShieldPillIcon size={12} />
            {adminMode ? 'Admin on' : 'Admin'}
          </button>
        ) : null}
      </div>

      <div style={{ padding: 12 }}>
        <input ref={fileInput} onChange={onPick} type="file" accept="image/*" style={{ display: 'none' }} />
        <div
          onClick={() => {
            if (adminMode) fileInput.current?.click();
            else if (billboard.link) window.open(billboard.link, '_blank', 'noopener');
            else flash('Opening sponsor link…');
          }}
          role={adminMode ? 'button' : 'link'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') (e.currentTarget as HTMLElement).click();
          }}
          style={{
            position: 'relative',
            width: '100%',
            height: 200,
            borderRadius: 16,
            overflow: 'hidden',
            background:
              'repeating-linear-gradient(135deg,var(--soft),var(--soft) 11px,var(--soft-2) 11px,var(--soft-2) 22px)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
          }}
        >
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={billboard.headline ?? 'Sponsored poster'}
              fill
              sizes="320px"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div style={{ textAlign: 'center', padding: '0 18px', pointerEvents: 'none' }}>
              <span style={{ color: 'var(--mute)', display: 'block', marginBottom: 8 }}>
                <ImageIcon size={26} style={{ margin: '0 auto' }} />
              </span>
              <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                {isAdmin ? 'Upload a poster — 1200×750 works best.' : 'Sponsor slot — coming soon.'}
              </div>
            </div>
          )}
          {adminMode ? (
            <span
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'rgba(14,15,12,.72)',
                color: '#fff',
                font: '600 11px/1 var(--font-inter), Inter, sans-serif',
                padding: '6px 10px',
                borderRadius: 9999,
              }}
            >
              {pending ? 'Publishing…' : 'Tap to upload'}
            </span>
          ) : null}
        </div>
      </div>

      {adminMode ? (
        <div style={{ padding: '0 14px 6px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <input
            value={cta}
            onChange={(e) => setCta(e.target.value)}
            onBlur={() => saveMeta({ cta })}
            placeholder="Button label"
            aria-label="Billboard button label"
            style={{
              width: '100%',
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 13px',
              fontSize: 13,
              color: 'var(--ink)',
            }}
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onBlur={() => saveMeta({ link })}
            placeholder="Link (e.g. treax.co/promo)"
            aria-label="Billboard link"
            style={{
              width: '100%',
              background: 'var(--soft)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: '10px 13px',
              fontSize: 13,
              color: 'var(--ink)',
            }}
          />
          <p style={{ fontSize: 11, color: 'var(--mute)', margin: '0 2px' }}>
            Admin only — every builder sees this poster and button.
          </p>
        </div>
      ) : null}

      <div style={{ padding: '8px 14px 14px' }}>
        <button
          onClick={() => {
            if (billboard.link) window.open(billboard.link, '_blank', 'noopener');
            else flash('Opening sponsor link…');
          }}
          style={{
            width: '100%',
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 14,
            padding: 13,
            font: '600 14px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
