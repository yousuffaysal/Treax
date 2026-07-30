'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/providers/toast-provider';
import { useChannel } from '@/components/providers/realtime-provider';
import { conversationChannelName } from '@/lib/realtime-names';
import { markConversationRead, sendMessage, sendTyping } from '@/app/(app)/messages/actions';

/**
 * Docked chat panel — port of Treax.dc.html:2134-2153.
 *
 * 364x540 pinned bottom-right on desktop. Below 860px the `.sl-chatdock` rule
 * in globals.css expands it to a full-screen sheet, so this markup covers both
 * without a breakpoint of its own.
 *
 * Closing runs the prototype's four-part choreography (Treax.dc.html:3407-3410):
 * the box collapses to a 74px bar and slides out, the header drops away, a mini
 * header fades in behind it, and the body fades. That takes 800ms, so the panel
 * stays mounted until it finishes.
 */

export type ChatPerson = { id: string; name: string; handle: string; initials: string; avatarColor: string };
type Message = { id: string; body: string; senderId: string; createdAt: string };

const CLOSE_MS = 800;

/** nowTime() — Treax.dc.html:2322 */
function timeLabel(iso: string) {
  const d = new Date(iso);
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
}

export function ChatDock({
  conversationId,
  person,
  viewerId,
  onClose,
}: {
  conversationId: string;
  person: ChatPerson;
  viewerId: string;
  onClose: () => void;
}) {
  const t = useTranslations();
  const { error } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load the thread.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void (async () => {
      const res = await fetch(`/api/conversations/${conversationId}/messages`);
      if (cancelled) return;
      if (res.ok) {
        const data = (await res.json()) as { messages: Message[] };
        setMessages(data.messages);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Opening a thread clears its unread state.
  useEffect(() => {
    void markConversationRead(conversationId);
  }, [conversationId]);

  // Pin to the bottom, as componentDidUpdate did in the prototype.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  useEffect(() => () => void (closeTimer.current && clearTimeout(closeTimer.current)), []);

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSent = useRef<number>(0);

  // Popular builder & expression emojis for the quick picker
  const EMOJI_CATEGORIES = [
    { title: 'Reactions', emojis: ['😊', '🚀', '🔥', '👍', '❤️', '😂', '🎉', '💡', '👏', '🎯', '💯', '🙏'] },
    { title: 'Builder & Tech', emojis: ['💻', '⚡', '🛠️', '✨', '📊', '📈', '🧠', '🌟', '🙌', '🤝', '💪', '🏆'] },
    { title: 'Expressions', emojis: ['😍', '😎', '🥳', '🤔', '😅', '🤯', '🤩', '🤙', '🔥', '👀', '✨', '⚡'] },
  ];

  // Listen for incoming messages
  const onIncoming = useCallback((payload: unknown) => {
    const data = payload as { messageId: string; senderId: string; body: string; createdAt: string };
    if (!data?.messageId) return;
    setMessages((cur) =>
      cur.some((m) => m.id === data.messageId)
        ? cur
        : [...cur, { id: data.messageId, body: data.body, senderId: data.senderId, createdAt: data.createdAt }],
    );
    setIsTyping(false);
  }, []);

  // Listen for typing indicator
  const onTyping = useCallback((payload: unknown) => {
    const data = payload as { userId: string };
    if (data?.userId && data.userId !== viewerId) {
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
    }
  }, [viewerId]);

  useChannel(conversationChannelName(conversationId), 'message:new', onIncoming);
  useChannel(conversationChannelName(conversationId), 'message:typing', onTyping);

  function requestClose() {
    if (closing) return;
    setClosing(true);
    closeTimer.current = setTimeout(onClose, CLOSE_MS);
  }

  function handleDraftChange(val: string) {
    setDraft(val);
    const now = Date.now();
    if (now - lastTypingSent.current > 2000) {
      lastTypingSent.current = now;
      void sendTyping(conversationId);
    }
  }

  function addEmoji(emoji: string) {
    setDraft((prev) => prev + emoji);
  }

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setDraft('');
    setShowEmojiPicker(false);

    const tempId = `temp-${Date.now()}`;
    setMessages((cur) => [...cur, { id: tempId, body, senderId: viewerId, createdAt: new Date().toISOString() }]);

    const result = await sendMessage({ conversationId, body });
    setSending(false);

    if (!result.ok) {
      setMessages((cur) => cur.filter((m) => m.id !== tempId));
      setDraft(body);
      return error(result.error);
    }
    setMessages((cur) => cur.map((m) => (m.id === tempId ? { ...m, id: result.data.id, createdAt: result.data.createdAt } : m)));
  }

  // Check if string contains only 1-3 emojis
  const isOnlyEmoji = (str: string) => {
    const emojiRegex = /^(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff]){1,3}$/gi;
    return emojiRegex.test(str.trim());
  };

  return (
    <div
      className="sl-chatdock"
      role="dialog"
      aria-label={`Chat with ${person.name}`}
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        zIndex: 75,
        width: 364,
        maxWidth: 'calc(100vw - 32px)',
        height: 540,
        maxHeight: 'calc(100vh - 48px)',
        background: 'var(--card)',
        border: '1px solid var(--card-border)',
        borderRadius: 22,
        boxShadow: '0 26px 64px rgba(0,0,0,.34)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        transformOrigin: 'bottom right',
        animation: closing
          ? 'sl-chat-close .8s cubic-bezier(.45,0,.55,1) both'
          : 'sl-liquid .3s cubic-bezier(.2,.8,.2,1) both',
      }}
    >
      {/* mini header — only visible during the collapse */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 74,
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '0 16px',
          pointerEvents: 'none',
          zIndex: 2,
          opacity: 0,
          animation: closing ? 'sl-mini-in .8s ease both' : 'none',
        }}
      >
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 9999,
            background: person.avatarColor,
            color: '#fff',
            font: '800 14px/1 var(--font-manrope), Manrope',
            display: 'grid',
            placeItems: 'center',
            flexShrink: 0,
          }}
        >
          {person.initials}
        </span>
        <span
          style={{
            font: '700 15px/1.2 var(--font-inter), Inter, sans-serif',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {person.name}
        </span>
      </div>

      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '13px 16px',
          borderBottom: '1px solid var(--border)',
          animation: closing ? 'sl-hdr-drop .8s cubic-bezier(.45,0,.55,1) both' : 'none',
        }}
      >
        <Link href={`/u/${person.handle}`} style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 9999,
              background: person.avatarColor,
              color: '#fff',
              font: '800 15px/1 var(--font-manrope), Manrope',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {person.initials}
          </span>
          <span
            style={{
              position: 'absolute',
              right: -1,
              bottom: -1,
              width: 12,
              height: 12,
              borderRadius: 9999,
              background: 'var(--positive)',
              border: '2px solid var(--card)',
            }}
          />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Link
            href={`/u/${person.handle}`}
            style={{
              display: 'block',
              font: '700 15px/1.2 var(--font-inter), Inter, sans-serif',
              color: 'var(--ink)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {person.name}
          </Link>
          <div style={{ fontSize: 12, color: isTyping ? 'var(--primary-active, #9fe870)' : 'var(--positive)', transition: 'all 0.2s' }}>
            {isTyping ? 'typing...' : t('online')}
          </div>
        </div>
        <button
          onClick={requestClose}
          aria-label="Close chat"
          style={{
            width: 32,
            height: 32,
            borderRadius: 9999,
            border: 'none',
            background: 'var(--soft)',
            color: 'var(--ink)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* body */}
      <div
        ref={scrollRef}
        className="sl-scroll"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          background: 'var(--soft-2)',
          animation: closing ? 'sl-body-fade .4s ease both' : 'none',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 2 }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 11,
              color: 'var(--mute)',
              background: 'var(--card)',
              padding: '6px 12px',
              borderRadius: 9999,
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="4" y="11" width="16" height="10" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
            {t('encrypted')}
          </span>
        </div>

        {loading ? (
          <div style={{ margin: 'auto', fontSize: 13, color: 'var(--mute)' }}>{t('loading')}</div>
        ) : messages.length === 0 ? (
          <div style={{ margin: 'auto', fontSize: 13.5, color: 'var(--mute)', textAlign: 'center', padding: '0 20px' }}>
            No messages yet. Say something specific — it works better than “hi”.
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === viewerId;
            const bigEmoji = isOnlyEmoji(m.body);
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '82%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: mine ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    background: bigEmoji ? 'transparent' : mine ? 'var(--primary)' : 'var(--soft)',
                    color: mine ? '#163300' : 'var(--ink)',
                    borderRadius: mine ? '18px 18px 5px 18px' : '18px 18px 18px 5px',
                    padding: bigEmoji ? '4px 8px' : '9px 14px',
                    fontSize: bigEmoji ? 28 : 14,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                >
                  {m.body}
                </div>
                <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 4 }}>{timeLabel(m.createdAt)}</div>
              </div>
            );
          })
        )}
        {isTyping ? (
          <div style={{ alignSelf: 'flex-start', background: 'var(--soft)', padding: '6px 12px', borderRadius: 14, fontSize: 12, color: 'var(--mute)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <span>{person.name.split(' ')[0]} is typing</span>
            <span style={{ animation: 'sl-pulse 1s infinite' }}>...</span>
          </div>
        ) : null}
      </div>

      {/* Popover Emoji Picker */}
      {showEmojiPicker ? (
        <div
          style={{
            position: 'absolute',
            bottom: 70,
            left: 12,
            right: 12,
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
            zIndex: 90,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--mute)' }}>Select Emoji</span>
            <button
              onClick={() => setShowEmojiPicker(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: 'var(--mute)' }}
            >
              ✕
            </button>
          </div>
          {EMOJI_CATEGORIES.map((cat) => (
            <div key={cat.title} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--mute)', marginBottom: 4 }}>{cat.title}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {cat.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    style={{
                      background: 'var(--soft)',
                      border: 'none',
                      borderRadius: 8,
                      padding: 6,
                      fontSize: 18,
                      cursor: 'pointer',
                      transition: 'transform 0.1s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.2)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* composer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px', borderTop: '1px solid var(--border)' }}>
        <button
          onClick={() => setShowEmojiPicker((prev) => !prev)}
          title="Add Emoji"
          aria-label="Add Emoji"
          style={{
            width: 36,
            height: 36,
            borderRadius: 9999,
            border: 'none',
            background: showEmojiPicker ? 'var(--primary)' : 'var(--soft)',
            color: showEmojiPicker ? '#163300' : 'var(--ink)',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            fontSize: 17,
            transition: 'all 0.2s',
          }}
        >
          😊
        </button>

        <input
          value={draft}
          onChange={(e) => handleDraftChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
          placeholder={t('typeMsg')}
          aria-label={t('typeMsg')}
          style={{
            flex: 1,
            minWidth: 0,
            background: 'var(--soft)',
            border: '1px solid var(--border)',
            borderRadius: 9999,
            padding: '11px 16px',
            fontSize: 14,
            color: 'var(--ink)',
          }}
        />
        <button
          onClick={send}
          disabled={sending || !draft.trim()}
          title="Send"
          aria-label="Send"
          style={{
            width: 42,
            height: 42,
            borderRadius: 9999,
            border: 'none',
            background: 'var(--primary)',
            color: '#163300',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            opacity: sending || !draft.trim() ? 0.6 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

