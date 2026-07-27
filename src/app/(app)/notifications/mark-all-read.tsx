'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { markAllNotificationsRead } from './actions';

export function MarkAllRead() {
  const router = useRouter();
  const { error } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await markAllNotificationsRead();
          if (!result.ok) return error(result.error);
          router.refresh();
        })
      }
      disabled={pending}
      style={{
        background: 'var(--card)',
        color: 'var(--ink)',
        border: '1px solid var(--border-strong)',
        borderRadius: 9999,
        padding: '10px 18px',
        font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {pending ? 'Marking…' : 'Mark all read'}
    </button>
  );
}
