'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { CrossIcon, ImageIcon } from '@/components/ui/icons';
import { POST_TAGS, TAG_META, type PostTag } from '@/lib/types';
import { checkUpdate, publishUpdate, type FilterCheck } from '@/app/(app)/actions';

/**
 * Compose modal — port of Treax.dc.html:1943-2004.
 *
 * The scanning state, the bounce card and the accept card are the prototype's,
 * but the verdict now comes from the real filter running on the server. The
 * prototype faked a 1400ms delay; here the wait is however long the check
 * actually takes.
 */

const labelStyle: React.CSSProperties = { font: '700 14px/1 var(--font-inter), Inter, sans-serif' };

function StarGlyph({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3l1.9 4.9L19 9.8l-4.2 3.1L16 18l-4-2.7L8 18l1.2-5.1L5 9.8l5.1-1.9z" />
    </svg>
  );
}

export function Composer({
  viewer,
  initialText = '',
  onClose,
}: {
  viewer: { name: string; initials: string; avatarColor: string; avatarUrl?: string | null; building: string | null };
  initialText?: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const { flash, error } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [text, setText] = useState(initialText);
  const [image, setImage] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [verdict, setVerdict] = useState<FilterCheck | null>(null);
  const [tag, setTag] = useState<PostTag | null>(null);
  const [posting, startPosting] = useTransition();

  const accepted = verdict?.ok === true;
  const rejected = verdict?.ok === false;

  // Editing the draft invalidates the previous verdict — the same rule the
  // prototype used in setComposeText().
  function onText(value: string) {
    setText(value);
    setVerdict(null);
    setTag(null);
  }

  async function runCheck() {
    if (!text.trim() || checking) return;
    setChecking(true);
    setVerdict(null);
    const result = await checkUpdate(text);
    setChecking(false);
    if (!result.ok) return error(result.error);
    setVerdict(result.data);
    if (result.data.ok) setTag(result.data.tag);
  }

  async function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return error('That file is not an image.');
    if (file.size > 4 * 1024 * 1024) return error('Keep the image under 4MB.');

    const body = new FormData();
    body.set('file', file);
    body.set('folder', 'posts');
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      return error(payload?.error ?? 'Upload failed. Try again.');
    }
    const { url } = (await res.json()) as { url: string };
    setImage(url);
  }

  function post() {
    if (!accepted) return;
    startPosting(async () => {
      const result = await publishUpdate({ body: text, imageUrl: image, tag: tag ?? undefined });
      if (!result.ok) return error(result.error);
      flash('Posted. Your update passed the filter.');
      onClose();
      router.push('/');
      router.refresh();
    });
  }

  return (
    <div
      onClick={onClose}
      className="sl-modal sl-scroll"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        background: 'rgba(14,15,12,.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '48px 20px',
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Post an update"
        style={{
          width: '100%',
          maxWidth: 620,
          background: 'var(--card)',
          borderRadius: 24,
          boxShadow: '0 24px 60px rgba(0,0,0,.35)',
          animation: 'sl-up .25s ease both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 20, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
            Post an update
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 34, height: 34, borderRadius: 9999, border: 'none', background: 'var(--soft)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <CrossIcon size={17} />
          </button>
        </div>

        <div style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 9999,
                background: viewer.avatarColor,
                color: '#fff',
                font: '800 16px/1 var(--font-manrope), Manrope',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              {viewer.initials}
            </span>
            <div>
              <div style={{ font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{viewer.name}</div>
              {viewer.building ? <div style={{ fontSize: 13, color: 'var(--mute)' }}>building {viewer.building}</div> : null}
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => onText(e.target.value)}
            autoFocus
            aria-label="Your update"
            placeholder="Share a launch, a lesson, a setback, or a co-founder you're looking for. Be specific — the filter checks for a real update."
            style={{
              width: '100%',
              minHeight: 130,
              border: 'none',
              background: 'none',
              resize: 'vertical',
              fontSize: 18,
              lineHeight: 1.5,
              color: 'var(--ink)',
            }}
          />

          <input ref={fileInput} onChange={onPickImage} type="file" accept="image/*" style={{ display: 'none' }} />

          {image ? (
            <div style={{ position: 'relative', marginTop: 6, borderRadius: 16, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <Image src={image} alt="" width={1200} height={750} style={{ width: '100%', height: 'auto', display: 'block' }} />
              <button
                onClick={() => setImage(null)}
                title="Remove photo"
                aria-label="Remove photo"
                style={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  width: 32,
                  height: 32,
                  borderRadius: 9999,
                  border: 'none',
                  background: 'rgba(14,15,12,.72)',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                }}
              >
                <CrossIcon size={15} />
              </button>
            </div>
          ) : null}

          {/* scanning */}
          {checking ? (
            <div
              aria-live="polite"
              style={{
                position: 'relative',
                overflow: 'hidden',
                marginTop: 8,
                background: 'var(--soft)',
                borderRadius: 16,
                padding: '18px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 9999,
                  border: '2.5px solid var(--border)',
                  borderTopColor: 'var(--ink)',
                  animation: 'sl-spin .7s linear infinite',
                  flexShrink: 0,
                }}
              />
              <div style={{ font: '600 15px/1 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>Running the Treax filter…</div>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  height: '30%',
                  background: 'linear-gradient(var(--primary),transparent)',
                  opacity: 0.2,
                  animation: 'sl-scan 1.1s linear infinite',
                }}
              />
            </div>
          ) : null}

          {/* bounced */}
          {rejected && verdict && !verdict.ok ? (
            <div
              role="alert"
              style={{
                marginTop: 8,
                background: 'rgba(208,50,56,.08)',
                border: '1px solid rgba(208,50,56,.3)',
                borderRadius: 16,
                padding: '18px 20px',
                animation: 'sl-up .2s ease both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--negative)', ...labelStyle, marginBottom: 8 }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v5M12 16.5v.5" />
                </svg>
                Filter bounced this — not a build update
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.5, color: 'var(--ink)', margin: '0 0 10px' }}>{verdict.reason}</p>
              <div style={{ fontSize: 14, lineHeight: 1.5, color: 'var(--body)', background: 'var(--card)', borderRadius: 12, padding: '12px 14px' }}>
                <b style={{ color: 'var(--ink)' }}>Try this shape:</b> {verdict.suggestion}
              </div>
            </div>
          ) : null}

          {/* accepted */}
          {accepted && verdict?.ok ? (
            <div
              style={{
                marginTop: 8,
                background: 'rgba(46,173,75,.08)',
                border: '1px solid rgba(46,173,75,.32)',
                borderRadius: 16,
                padding: '18px 20px',
                animation: 'sl-up .2s ease both',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--positive)', ...labelStyle }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                  Real update detected
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 11px',
                    borderRadius: 9999,
                    background: '#13150d',
                    color: 'var(--primary)',
                    font: '700 13px/1 var(--font-inter), Inter, sans-serif',
                  }}
                >
                  <StarGlyph />
                  Ship score {verdict.score}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--body)', margin: '12px 0 8px' }}>AI-detected tag — tap to adjust:</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {POST_TAGS.map((key) => {
                  const meta = TAG_META[key];
                  const on = tag === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setTag(key)}
                      aria-pressed={on}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '8px 14px',
                        borderRadius: 9999,
                        font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                        cursor: 'pointer',
                        background: on ? 'var(--ink)' : 'var(--card)',
                        color: on ? 'var(--card)' : 'var(--ink)',
                        border: `1px solid ${on ? 'transparent' : 'var(--border)'}`,
                      }}
                    >
                      <span style={{ width: 8, height: 8, borderRadius: 9999, background: meta.dot }} />
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div
          className="sl-composebar"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, padding: '16px 24px', borderTop: '1px solid var(--border)' }}
        >
          <div className="sl-composemeta" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              onClick={() => fileInput.current?.click()}
              title="Add photo"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: 'var(--soft)',
                border: 'none',
                borderRadius: 9999,
                padding: '9px 14px',
                color: 'var(--ink)',
                font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              <ImageIcon size={16} />
              Photo
            </button>
            <span style={{ fontSize: 13, color: 'var(--mute)' }}>{text.length} chars · AI filter on</span>
          </div>

          <div className="sl-composeacts" style={{ display: 'flex', gap: 10 }}>
            {!accepted ? (
              <button
                onClick={runCheck}
                disabled={checking || !text.trim()}
                style={{
                  background: 'var(--ink)',
                  color: 'var(--card)',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '12px 22px',
                  font: '600 15px/1 var(--font-inter), Inter, sans-serif',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  opacity: checking || !text.trim() ? 0.6 : 1,
                }}
              >
                <StarGlyph size={15} />
                {checking ? 'Checking…' : 'Run AI check'}
              </button>
            ) : null}
            <button
              onClick={post}
              disabled={!accepted || posting}
              title={accepted ? undefined : 'Run the AI check first'}
              style={{
                border: 'none',
                borderRadius: 9999,
                padding: '12px 26px',
                font: '600 15px/1 var(--font-inter), Inter, sans-serif',
                cursor: accepted ? 'pointer' : 'not-allowed',
                background: accepted ? 'var(--primary)' : 'var(--soft)',
                color: accepted ? '#163300' : 'var(--mute)',
              }}
            >
              {posting ? 'Posting…' : 'Post update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
