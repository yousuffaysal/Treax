'use client';

import { useChatDock } from '@/components/providers/chat-dock-provider';

/**
 * Opens the docked chat instead of navigating.
 *
 * Every "Message" affordance in the app routes through this, so the panel
 * behaves the same whether it is opened from a profile, the team grid, a post
 * or the top bar.
 */
export function MessageButton({
  handle,
  label = 'Message',
  variant = 'outline',
  children,
}: {
  handle: string;
  label?: string;
  variant?: 'outline' | 'soft' | 'ghost';
  children?: React.ReactNode;
}) {
  const { openChat } = useChatDock();

  const styles: Record<typeof variant, React.CSSProperties> = {
    outline: {
      background: 'var(--card)',
      color: 'var(--ink)',
      border: '1px solid var(--border-strong)',
      padding: '12px 20px',
      font: '600 14px/1 var(--font-inter), Inter, sans-serif',
    },
    soft: {
      background: 'var(--card)',
      color: 'var(--ink)',
      border: '1px solid var(--border-strong)',
      padding: '10px 18px',
      font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
    },
    ghost: {
      background: 'var(--soft)',
      color: 'var(--ink)',
      border: 'none',
      padding: '9px 15px',
      font: '600 13px/1 var(--font-inter), Inter, sans-serif',
    },
  };

  return (
    <button
      onClick={() => openChat(handle)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        borderRadius: 9999,
        cursor: 'pointer',
        flexShrink: 0,
        ...styles[variant],
      }}
    >
      {children ?? label}
    </button>
  );
}
