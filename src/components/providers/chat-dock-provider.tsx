'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { ChatDock, type ChatPerson } from '@/components/messages/chat-dock';
import { openConversation } from '@/app/(app)/messages/actions';

/**
 * Holds the docked chat open across navigation.
 *
 * The prototype's chat was a floating panel rather than a screen, so it had to
 * survive moving between pages. Mounting it in the app layout gives the same
 * behaviour: the dock stays put while the page underneath changes.
 */

type ChatDockValue = {
  /** Opens the 1:1 thread with a builder, creating it on first message. */
  openChat: (handle: string) => void;
  /** Opens a thread already known by id (used by the messages list). */
  openConversationId: (conversationId: string, person: ChatPerson) => void;
  activeConversationId: string | null;
};

const ChatDockContext = createContext<ChatDockValue | null>(null);

export function ChatDockProvider({ viewerId, children }: { viewerId: string; children: ReactNode }) {
  const { error } = useToast();
  const [open, setOpen] = useState<{ conversationId: string; person: ChatPerson } | null>(null);
  const [pending, setPending] = useState(false);

  const openChat = useCallback(
    (handle: string) => {
      if (pending) return;
      setPending(true);
      void (async () => {
        const result = await openConversation(handle);
        setPending(false);
        if (!result.ok) return error(result.error);

        // The action returns the id; the header details come from the thread
        // endpoint so we never render a half-populated panel.
        const res = await fetch(`/api/conversations/${result.data.conversationId}/messages`);
        if (!res.ok) return error('Could not open that conversation.');
        const data = (await res.json()) as { other: ChatPerson | null };
        if (!data.other) return error('That conversation has no one else in it.');

        setOpen({ conversationId: result.data.conversationId, person: data.other });
      })();
    },
    [error, pending],
  );

  const openConversationId = useCallback((conversationId: string, person: ChatPerson) => {
    setOpen({ conversationId, person });
  }, []);

  return (
    <ChatDockContext.Provider value={{ openChat, openConversationId, activeConversationId: open?.conversationId ?? null }}>
      {children}
      {open ? (
        <ChatDock
          key={open.conversationId}
          conversationId={open.conversationId}
          person={open.person}
          viewerId={viewerId}
          onClose={() => setOpen(null)}
        />
      ) : null}
    </ChatDockContext.Provider>
  );
}

export function useChatDock() {
  const ctx = useContext(ChatDockContext);
  if (!ctx) throw new Error('useChatDock must be used inside <ChatDockProvider>');
  return ctx;
}
