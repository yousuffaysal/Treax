'use client';

import { useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { requestBooking } from './actions';

export function BookButton({ expertId, expertName, slot }: { expertId: string; expertName: string; slot: string }) {
  const { flash, error } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await requestBooking({ expertId, slot });
          if (!result.ok) return error(result.error);
          flash(`Session request sent to ${expertName}. You'll get a confirmation soon.`);
        })
      }
      disabled={pending}
      style={{
        background: 'var(--primary)',
        color: '#163300',
        border: 'none',
        borderRadius: 9999,
        padding: '11px 20px',
        font: '600 14px/1 var(--font-inter), Inter, sans-serif',
        cursor: 'pointer',
        flexShrink: 0,
        opacity: pending ? 0.7 : 1,
      }}
    >
      {pending ? 'Sending…' : 'Book a session'}
    </button>
  );
}
