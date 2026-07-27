'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { useChannel } from '@/components/providers/realtime-provider';
import { conversationChannelName } from '@/lib/realtime-names';
import { markConversationRead, sendMessage, sendTyping } from './actions';

/** Messages UI — the docked panel from the prototype, as a full page. */

type Other = { id: string; name: string; handle: string; initials: string; avatarColor: string; building: string | null };
type Thread = { id: string; other: Other; lastBody: string; lastAt: string; unread: boolean };
type Message = { id: string; body: string; senderId: string; createdAt: string };

function timeLabel(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function MessagesClient({
  viewer,
  threads,
  activeId,
  messages: initialMessages,
}: {
  viewer: { id: string; initials: string; avatarColor: string };
  threads: Thread[];
  activeId: string | null;
  messages: Message[];
}) {
  const router = useRouter();
  const { error } = useToast();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const active = threads.find((t) => t.id === activeId) ?? null;

  // Server-rendered messages change when the thread changes.
  useEffect(() => setMessages(initialMessages), [initialMessages]);

  // Pin to the bottom on new messages, as the prototype did in componentDidUpdate.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Opening a thread clears its unread state.
  useEffect(() => {
    if (!activeId) return;
    void markConversationRead(activeId);
  }, [activeId]);

  const onRealtime = useCallback(
    (payload: unknown) => {
      const data = payload as { messageId: string; senderId: string; body: string; createdAt: string };
      if (!data?.messageId) return;
      setPeerTyping(false);
      setMessages((cur) =>
        cur.some((m) => m.id === data.messageId)
          ? cur
          : [...cur, { id: data.messageId, body: data.body, senderId: data.senderId, createdAt: data.createdAt }],
      );
    },
    [],
  );

  const onTyping = useCallback(
    (payload: unknown) => {
      const data = payload as { userId: string };
      if (data?.userId === viewer.id) return;
      setPeerTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setPeerTyping(false), 2500);
    },
    [viewer.id],
  );

  useChannel(activeId ? conversationChannelName(activeId) : null, 'message:new', onRealtime);
  useChannel(activeId ? conversationChannelName(activeId) : null, 'message:typing', onTyping);

  async function send() {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    setDraft('');

    // Optimistic bubble, reconciled when the server confirms.
    const tempId = `temp-${Date.now()}`;
    setMessages((cur) => [...cur, { id: tempId, body, senderId: viewer.id, createdAt: new Date().toISOString() }]);

    const result = await sendMessage({ conversationId: activeId, body });
    setSending(false);

    if (!result.ok) {
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
      setDraft(body);
      return error(result.error);
    }
    setMessages((cur) => cur.map((m) => (m.id === tempId ? { ...m, id: result.data.id, createdAt: result.data.createdAt } : m)));
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 1216, margin: '0 auto', padding: 24, display: 'grid', gridTemplateColumns: 'minmax(0,320px) minmax(0,1fr)', gap: 16, alignItems: 'start' }}>
      {/* thread list */}
      <aside
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          overflow: 'hidden',
          boxShadow: 'var(--elev)',
        }}
      >
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)' }}>
          <h1 style={{ fontFamily: 'var(--font-manrope), Manrope', fontWeight: 800, fontSize: 20, letterSpacing: '-.01em', color: 'var(--ink)', margin: 0 }}>
            Messages
          </h1>
        </div>
        {threads.length === 0 ? (
          <p style={{ padding: 24, margin: 0, fontSize: 14.5, color: 'var(--mute)' }}>
            No conversations yet. Open a builder&apos;s profile and hit Message.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {threads.map((thread) => {
              const on = thread.id === activeId;
              return (
                <button
                  key={thread.id}
                  onClick={() => router.push(`/messages?c=${thread.id}`)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '14px 18px',
                    background: on ? 'var(--soft)' : 'transparent',
                    border: 'none',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 9999,
                      background: thread.other.avatarColor,
                      color: '#fff',
                      font: '800 15px/1 var(--font-manrope), Manrope',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {thread.other.initials}
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', font: '700 14.5px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>
                      {thread.other.name}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 13,
                        color: thread.unread ? 'var(--ink)' : 'var(--mute)',
                        fontWeight: thread.unread ? 600 : 400,
                        marginTop: 3,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {thread.lastBody || 'No messages yet'}
                    </span>
                  </span>
                  {thread.unread ? <span style={{ width: 9, height: 9, borderRadius: 9999, background: 'var(--primary)', flexShrink: 0 }} /> : null}
                </button>
              );
            })}
          </div>
        )}
      </aside>

      {/* thread */}
      <section
        className="sl-chatdock"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--card-border)',
          borderRadius: 24,
          boxShadow: 'var(--elev)',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 108px)',
          overflow: 'hidden',
        }}
      >
        {!active ? (
          <div style={{ margin: 'auto', padding: 40, textAlign: 'center', color: 'var(--mute)', fontSize: 15 }}>
            Pick a conversation to start reading.
          </div>
        ) : (
          <>
            <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
              <span
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 9999,
                  background: active.other.avatarColor,
                  color: '#fff',
                  font: '800 15px/1 var(--font-manrope), Manrope',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                {active.other.initials}
              </span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ font: '700 15px/1.2 var(--font-inter), Inter, sans-serif', color: 'var(--ink)' }}>{active.other.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--mute)', marginTop: 3 }}>
                  {peerTyping ? 'typing…' : active.other.building ? `building ${active.other.building}` : `@${active.other.handle}`}
                </div>
              </div>
              <a
                href={`/u/${active.other.handle}`}
                style={{
                  background: 'var(--soft)',
                  color: 'var(--ink)',
                  borderRadius: 9999,
                  padding: '9px 15px',
                  font: '600 13px/1 var(--font-inter), Inter, sans-serif',
                  flexShrink: 0,
                }}
              >
                Profile
              </a>
            </header>

            <div ref={scrollRef} className="sl-scroll" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.length === 0 ? (
                <p style={{ margin: 'auto', fontSize: 14.5, color: 'var(--mute)' }}>Say hello.</p>
              ) : (
                messages.map((m) => {
                  const mine = m.senderId === viewer.id;
                  return (
                    <div key={m.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <div
                        style={{
                          maxWidth: '76%',
                          background: mine ? 'var(--primary)' : 'var(--soft)',
                          color: mine ? '#163300' : 'var(--ink)',
                          borderRadius: mine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                          padding: '11px 15px',
                          fontSize: 15,
                          lineHeight: 1.45,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {m.body}
                        <span style={{ display: 'block', marginTop: 5, fontSize: 11, opacity: 0.62 }}>{timeLabel(m.createdAt)}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '14px 18px', borderTop: '1px solid var(--border)' }}>
              <input
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (activeId) void sendTyping(activeId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                placeholder="Type a message"
                aria-label="Type a message"
                style={{
                  flex: 1,
                  background: 'var(--soft)',
                  border: '1px solid var(--border)',
                  borderRadius: 9999,
                  padding: '12px 18px',
                  fontSize: 15,
                  color: 'var(--ink)',
                }}
              />
              <button
                onClick={send}
                disabled={sending || !draft.trim()}
                style={{
                  background: 'var(--primary)',
                  color: '#163300',
                  border: 'none',
                  borderRadius: 9999,
                  padding: '12px 22px',
                  font: '600 14px/1 var(--font-inter), Inter, sans-serif',
                  cursor: 'pointer',
                  opacity: sending || !draft.trim() ? 0.6 : 1,
                  flexShrink: 0,
                }}
              >
                Send
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
