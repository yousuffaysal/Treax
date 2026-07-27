'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useChatDock } from '@/components/providers/chat-dock-provider';
import { relativeTime } from '@/lib/feed';

type Thread = {
  id: string;
  other: { id: string; name: string; handle: string; initials: string; avatarColor: string };
  lastBody: string;
  lastAt: string;
  unread: boolean;
};

export function ThreadList({ threads, openHandle }: { threads: Thread[]; openHandle: string | null }) {
  const t = useTranslations();
  const { openChat, openConversationId, activeConversationId } = useChatDock();
  const opened = useRef(false);

  // `?to=handle` arriving as a full navigation opens the dock once.
  useEffect(() => {
    if (!openHandle || opened.current) return;
    opened.current = true;
    openChat(openHandle);
  }, [openHandle, openChat]);

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--card-border)', borderRadius: 24, overflow: 'hidden', boxShadow: 'var(--elev)' }}>
      <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
        <h1 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 26, letterSpacing: '-.02em', color: 'var(--ink)', margin: 0 }}>
          {t('messages')}
        </h1>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--mute)' }}>
          {threads.length === 0 ? 'Nothing here yet.' : 'Pick a conversation — it opens in the corner.'}
        </p>
      </div>

      {threads.length === 0 ? (
        <p style={{ padding: 30, margin: 0, fontSize: 15, color: 'var(--mute)', textAlign: 'center' }}>
          Open a builder&apos;s profile and hit Message to start one.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {threads.map((thread) => {
            const active = thread.id === activeConversationId;
            return (
              <button
                key={thread.id}
                onClick={() => openConversationId(thread.id, thread.other)}
                aria-current={active ? 'true' : undefined}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 13,
                  padding: '16px 22px',
                  background: active ? 'var(--soft)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <span
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 9999,
                    background: thread.other.avatarColor,
                    color: '#fff',
                    font: '800 16px/1 var(--font-manrope), Manrope',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  {thread.other.initials}
                </span>

                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                      {thread.other.name}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--mute)' }}>{relativeTime(new Date(thread.lastAt))}</span>
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 13.5,
                      color: thread.unread ? 'var(--ink)' : 'var(--mute)',
                      fontWeight: thread.unread ? 600 : 400,
                      marginTop: 4,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {thread.lastBody || 'No messages yet'}
                  </span>
                </span>

                {thread.unread ? <span style={{ width: 10, height: 10, borderRadius: 9999, background: 'var(--primary)', flexShrink: 0 }} /> : null}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
