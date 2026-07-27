'use client';

import Pusher, { type Channel } from 'pusher-js';
import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode } from 'react';

/**
 * Client half of lib/realtime.ts. One Pusher connection per tab, shared by the
 * message panel, the notification badge and anything else that subscribes.
 *
 * If NEXT_PUBLIC_PUSHER_KEY is absent the provider is inert and every consumer
 * simply never fires — callers already refresh after their own mutations.
 */

type RealtimeValue = {
  subscribe: (channel: string, event: string, handler: (data: unknown) => void) => () => void;
  enabled: boolean;
};

const RealtimeContext = createContext<RealtimeValue>({ subscribe: () => () => {}, enabled: false });

export function RealtimeProvider({ userId, children }: { userId: string; children: ReactNode }) {
  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'ap2';
  const clientRef = useRef<Pusher | null>(null);
  const channels = useRef(new Map<string, Channel>());

  useEffect(() => {
    if (!key) return;
    const client = new Pusher(key, {
      cluster,
      authEndpoint: '/api/realtime/auth',
      forceTLS: true,
    });
    clientRef.current = client;
    const open = channels.current;
    return () => {
      open.clear();
      client.disconnect();
      clientRef.current = null;
    };
  }, [key, cluster, userId]);

  const value = useMemo<RealtimeValue>(
    () => ({
      enabled: Boolean(key),
      subscribe(channelName, event, handler) {
        const client = clientRef.current;
        if (!client) return () => {};

        let channel = channels.current.get(channelName);
        if (!channel) {
          channel = client.subscribe(channelName);
          channels.current.set(channelName, channel);
        }
        channel.bind(event, handler);

        return () => {
          channel?.unbind(event, handler);
          // Leave the channel subscribed - other consumers may still be bound,
          // and re-subscribing costs an auth round trip.
        };
      },
    }),
    [key],
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}

export function useRealtime() {
  return useContext(RealtimeContext);
}

/** Subscribe for the lifetime of a component. */
export function useChannel(channel: string | null, event: string, handler: (data: unknown) => void) {
  const { subscribe } = useRealtime();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!channel) return;
    return subscribe(channel, event, (data) => handlerRef.current(data));
  }, [channel, event, subscribe]);
}
