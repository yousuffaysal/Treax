'use client';

import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { requestService } from './actions';

export function HireButton({ serviceId, sellerName, cta }: { serviceId: string; sellerName: string; cta: string }) {
  const router = useRouter();
  const { flash, error } = useToast();
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const result = await requestService({ serviceId });
          if (!result.ok) return error(result.error);
          flash(`Request sent to ${sellerName}. They'll confirm your order shortly.`);
          router.push(`/messages?c=${result.data.conversationId}`);
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
      {pending ? 'Sending…' : cta}
    </button>
  );
}
