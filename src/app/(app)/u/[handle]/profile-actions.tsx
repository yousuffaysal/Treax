'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/providers/toast-provider';
import { CrossIcon, SparkIcon } from '@/components/ui/icons';
import { MessageButton } from '@/components/messages/message-button';
import { AVATAR_COLORS } from '@/lib/handle';
import { toggleFollow } from '@/app/(app)/actions';
import { saveProfile, suggestBio } from './actions';

/**
 * Profile header buttons plus the edit sheet — Treax.dc.html:769-777 and the
 * edit modal. Saving updates the shell everywhere, live.
 */

const BIO_MAX = 220;

/** peTagPool — Treax.dc.html:2277. */
const TAG_POOL = ['Mobility', 'Student startups', 'Dhaka builders', 'EdTech', 'AgriTech', 'Fintech', 'Design', 'AI tools'];

/** peColorPool — Treax.dc.html:2278, extended to the full avatar palette. */
const COLOR_NAMES: Record<string, string> = {
  '#0e0f0c': 'Ink',
  '#2ead4b': 'Leaf',
  '#38c8ff': 'Sky',
  '#d03238': 'Clay',
  '#8b7bf0': 'Iris',
  '#b86700': 'Amber',
  '#163300': 'Forest',
};

type ProfileDraft = {
  name: string;
  handle: string;
  university: string;
  focus: string;
  building: string;
  bio: string;
  seeking: string;
  avatarColor: string;
  tags: string[];
};

const pillButton: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  borderRadius: 9999,
  padding: '12px 20px',
  font: '600 15px/1 var(--font-inter), Inter, sans-serif',
  cursor: 'pointer',
};

const fieldLabel: React.CSSProperties = {
  display: 'block',
  font: '600 13px/1 var(--font-inter), Inter, sans-serif',
  color: 'var(--ink)',
  marginBottom: 8,
};

const fieldInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--soft)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '12px 14px',
  fontSize: 15,
  color: 'var(--ink)',
};

export function ProfileHeaderActions({
  isMe,
  targetId,
  targetHandle,
  initialFollowing,
  editLabel,
  connectLabel,
  messageLabel,
  followLabel,
  followingLabel,
  profile,
}: {
  isMe: boolean;
  targetId: string;
  targetHandle: string;
  initialFollowing: boolean;
  editLabel: string;
  connectLabel: string;
  messageLabel: string;
  followLabel: string;
  followingLabel: string;
  profile: ProfileDraft;
}) {
  const router = useRouter();
  const { update } = useSession();
  const { flash, error } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [editOpen, setEditOpen] = useState(false);
  const [, startTransition] = useTransition();

  function onFollow() {
    startTransition(async () => {
      const previous = following;
      setFollowing(!previous);
      const result = await toggleFollow(targetId);
      if (result.ok) {
        setFollowing(result.data.following);
        flash(result.data.following ? `Connection request sent to ${profile.name}.` : 'Unfollowed.');
      } else {
        setFollowing(previous);
        error(result.error);
      }
    });
  }

  if (!isMe) {
    return (
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onFollow}
          style={{
            ...pillButton,
            background: following ? 'var(--soft)' : 'var(--primary)',
            color: following ? 'var(--body)' : '#163300',
            border: 'none',
          }}
        >
          {following ? followingLabel : `${connectLabel} · ${followLabel}`}
        </button>
        <MessageButton handle={targetHandle} label={messageLabel} />
      </div>
    );
  }

  return (
    <>
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={() => setEditOpen(true)}
          style={{ ...pillButton, background: 'var(--card)', color: 'var(--ink)', border: '1px solid var(--border-strong)', padding: '12px 22px' }}
        >
          {editLabel}
        </button>
      </div>
      {editOpen ? (
        <EditProfileSheet
          initial={profile}
          onClose={() => setEditOpen(false)}
          onSaved={async (handle) => {
            setEditOpen(false);
            flash('Profile updated.');
            // The handle is part of the JWT and every profile URL.
            await update();
            router.replace(`/u/${handle}`);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function EditProfileSheet({
  initial,
  onClose,
  onSaved,
}: {
  initial: ProfileDraft;
  onClose: () => void;
  onSaved: (handle: string) => void;
}) {
  const { error } = useToast();
  const [draft, setDraft] = useState<ProfileDraft>(initial);
  const [saving, setSaving] = useState(false);
  const [suggesting, setSuggesting] = useState(false);

  const set = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const bioLeft = BIO_MAX - draft.bio.length;

  function toggleTag(tag: string) {
    setDraft((d) => ({ ...d, tags: d.tags.includes(tag) ? d.tags.filter((x) => x !== tag) : [...d.tags, tag] }));
  }

  async function writeForMe() {
    setSuggesting(true);
    const result = await suggestBio();
    setSuggesting(false);
    if (!result.ok) return error(result.error);
    set('bio', result.data.bio);
  }

  async function save() {
    if (!draft.name.trim()) return error('Add your name first.');
    if (!draft.handle.trim()) return error('Pick a handle.');
    setSaving(true);
    const result = await saveProfile(draft);
    setSaving(false);
    if (!result.ok) return error(result.error);
    onSaved(result.data.handle);
  }

  return (
    <div
      onClick={onClose}
      className="sl-modal sl-scroll"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 70,
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
        aria-label="Edit profile"
        style={{
          width: '100%',
          maxWidth: 600,
          background: 'var(--card)',
          borderRadius: 26,
          boxShadow: '0 30px 80px rgba(0,0,0,.4)',
          animation: 'sl-modal-genie .62s cubic-bezier(.2,.85,.25,1) both',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 20, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
            Edit profile
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ width: 34, height: 34, borderRadius: 9999, border: 'none', background: 'var(--soft)', color: 'var(--ink)', display: 'grid', placeItems: 'center', cursor: 'pointer' }}
          >
            <CrossIcon size={17} />
          </button>
        </div>

        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label htmlFor="pe-name" style={fieldLabel}>Name</label>
            <input id="pe-name" value={draft.name} onChange={(e) => set('name', e.target.value)} style={fieldInput} />
          </div>

          <div>
            <label htmlFor="pe-handle" style={fieldLabel}>Handle</label>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--soft)', border: '1px solid var(--border)', borderRadius: 12, padding: '0 14px' }}>
              <span style={{ color: 'var(--mute)', fontSize: 15 }}>@</span>
              <input
                id="pe-handle"
                value={draft.handle}
                onChange={(e) => set('handle', e.target.value)}
                style={{ flex: 1, border: 'none', background: 'none', padding: '12px 6px', fontSize: 15, color: 'var(--ink)' }}
              />
            </div>
          </div>

          <div className="sl-grid2">
            <div>
              <label htmlFor="pe-uni" style={fieldLabel}>University</label>
              <input id="pe-uni" value={draft.university} onChange={(e) => set('university', e.target.value)} style={fieldInput} />
            </div>
            <div>
              <label htmlFor="pe-focus" style={fieldLabel}>Focus</label>
              <input id="pe-focus" value={draft.focus} onChange={(e) => set('focus', e.target.value)} placeholder="CSE student · product" style={fieldInput} />
            </div>
          </div>

          <div>
            <label htmlFor="pe-building" style={fieldLabel}>Building</label>
            <input id="pe-building" value={draft.building} onChange={(e) => set('building', e.target.value)} style={fieldInput} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label htmlFor="pe-bio" style={{ ...fieldLabel, marginBottom: 0 }}>Bio</label>
              <button
                onClick={writeForMe}
                disabled={suggesting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--soft)',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '7px 12px',
                  font: '600 12px/1 var(--font-inter), Inter, sans-serif',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                <SparkIcon size={13} />
                {suggesting ? 'Writing…' : 'Write it for me'}
              </button>
            </div>
            <textarea
              id="pe-bio"
              value={draft.bio}
              onChange={(e) => set('bio', e.target.value.slice(0, BIO_MAX))}
              rows={4}
              style={{ ...fieldInput, resize: 'vertical', lineHeight: 1.5 }}
            />
            <div style={{ marginTop: 6, fontSize: 12, color: bioLeft < 20 ? 'var(--warning)' : 'var(--mute)', textAlign: 'right' }}>
              {bioLeft} characters left
            </div>
          </div>

          <div>
            <label htmlFor="pe-seeking" style={fieldLabel}>Looking for</label>
            <input id="pe-seeking" value={draft.seeking} onChange={(e) => set('seeking', e.target.value)} placeholder="A business co-founder in Dhaka" style={fieldInput} />
          </div>

          <div>
            <span style={fieldLabel}>Avatar colour</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {AVATAR_COLORS.map((hex) => {
                const on = draft.avatarColor.toLowerCase() === hex.toLowerCase();
                return (
                  <button
                    key={hex}
                    onClick={() => set('avatarColor', hex)}
                    aria-pressed={on}
                    aria-label={COLOR_NAMES[hex] ?? hex}
                    title={COLOR_NAMES[hex] ?? hex}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 9999,
                      background: hex,
                      border: on ? '3px solid var(--ink)' : '3px solid transparent',
                      cursor: 'pointer',
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div>
            <span style={fieldLabel}>Interests</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {TAG_POOL.map((tag) => {
                const on = draft.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    aria-pressed={on}
                    style={{
                      padding: '9px 15px',
                      borderRadius: 9999,
                      font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                      cursor: 'pointer',
                      background: on ? 'var(--primary)' : 'var(--card)',
                      color: on ? '#163300' : 'var(--ink)',
                      border: on ? '1px solid transparent' : '1px solid var(--border-strong)',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--card)',
              color: 'var(--ink)',
              border: '1px solid var(--border-strong)',
              borderRadius: 9999,
              padding: '12px 22px',
              font: '600 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            style={{
              background: 'var(--primary)',
              color: '#163300',
              border: 'none',
              borderRadius: 9999,
              padding: '12px 26px',
              font: '600 15px/1 var(--font-inter), Inter, sans-serif',
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Saving…' : 'Save profile'}
          </button>
        </div>
      </div>
    </div>
  );
}
