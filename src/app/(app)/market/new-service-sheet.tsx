'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/providers/toast-provider';
import { CrossIcon, PlusIcon } from '@/components/ui/icons';
import { saveService } from '@/app/(app)/u/[handle]/actions';

/** "Add a service" sheet — the service form from Treax.dc.html's market screen. */
export function NewServiceSheet({ openInitially = false }: { openInitially?: boolean }) {
  const t = useTranslations();
  const router = useRouter();
  const { flash, error } = useToast();
  const [open, setOpen] = useState(openInitially);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({ title: '', description: '', price: '', cta: 'Request this' });
  const [images, setImages] = useState<string[]>([]);
  const fileInput = useRef<HTMLInputElement>(null);

  const set = (k: keyof typeof draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setDraft((d) => ({ ...d, [k]: e.target.value }));

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (images.length >= 2) return error('Two sample images is the limit.');

    const body = new FormData();
    body.set('file', file);
    body.set('folder', 'services');
    const res = await fetch('/api/upload', { method: 'POST', body });
    if (!res.ok) {
      const payload = (await res.json().catch(() => null)) as { error?: string } | null;
      return error(payload?.error ?? 'Upload failed.');
    }
    const { url } = (await res.json()) as { url: string };
    setImages((cur) => [...cur, url]);
  }

  async function save() {
    if (!draft.title.trim()) return error('Give the service a title first.');
    setSaving(true);
    const result = await saveService({ ...draft, images });
    setSaving(false);
    if (!result.ok) return error(result.error);
    flash('Service published.');
    setOpen(false);
    setDraft({ title: '', description: '', price: '', cta: 'Request this' });
    setImages([]);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          alignSelf: 'flex-start',
          background: 'var(--primary)',
          color: '#163300',
          border: 'none',
          borderRadius: 9999,
          padding: '13px 22px',
          font: '600 14.5px/1 var(--font-inter), Inter, sans-serif',
          cursor: 'pointer',
        }}
      >
        <PlusIcon size={16} />
        {t('addService')}
      </button>
    );
  }

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
    padding: '12px 14px',
    fontSize: 15,
    color: 'var(--ink)',
  };

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, padding: 24, boxShadow: 'var(--elev)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 20, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
            {t('addService')}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--mute)' }}>{t('serviceSub')}</p>
        </div>
        <button
          onClick={() => setOpen(false)}
          aria-label="Close"
          style={{ width: 34, height: 34, borderRadius: 9999, border: 'none', background: 'var(--soft)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
        >
          <CrossIcon size={17} />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="svc-title" style={label}>{t('serviceName')}</label>
          <input id="svc-title" value={draft.title} onChange={set('title')} placeholder={t('servicePh')} style={input} />
        </div>
        <div>
          <label htmlFor="svc-desc" style={label}>{t('serviceDesc')}</label>
          <textarea id="svc-desc" value={draft.description} onChange={set('description')} rows={3} placeholder={t('serviceDescPh')} style={{ ...input, resize: 'vertical', lineHeight: 1.5 }} />
        </div>
        <div className="sl-grid2">
          <div>
            <label htmlFor="svc-price" style={label}>{t('servicePrice')}</label>
            <input id="svc-price" value={draft.price} onChange={set('price')} placeholder="৳799" style={input} />
          </div>
          <div>
            <label htmlFor="svc-cta" style={label}>{t('serviceCta')}</label>
            <input id="svc-cta" value={draft.cta} onChange={set('cta')} style={input} />
          </div>
        </div>

        <div>
          <span style={label}>{t('serviceImgs')}</span>
          <input ref={fileInput} onChange={onPick} type="file" accept="image/*" style={{ display: 'none' }} />
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {images.map((url) => (
              <div key={url} style={{ position: 'relative', width: 120, height: 90, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)' }}>
                <Image src={url} alt="" fill sizes="120px" style={{ objectFit: 'cover' }} />
                <button
                  onClick={() => setImages((cur) => cur.filter((u) => u !== url))}
                  aria-label="Remove image"
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    width: 24,
                    height: 24,
                    borderRadius: 9999,
                    border: 'none',
                    background: 'rgba(14,15,12,.72)',
                    color: '#fff',
                    display: 'grid',
                    placeItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CrossIcon size={12} />
                </button>
              </div>
            ))}
            {images.length < 2 ? (
              <button
                onClick={() => fileInput.current?.click()}
                style={{
                  width: 120,
                  height: 90,
                  borderRadius: 12,
                  border: '1px dashed var(--border-strong)',
                  background: 'var(--soft)',
                  color: 'var(--mute)',
                  cursor: 'pointer',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 13,
                }}
              >
                + Add
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            background: 'var(--primary)',
            color: '#163300',
            border: 'none',
            borderRadius: 9999,
            padding: '13px 26px',
            font: '600 15px/1 var(--font-inter), Inter, sans-serif',
            cursor: 'pointer',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Publishing…' : t('publishService')}
        </button>
      </div>
    </div>
  );
}
