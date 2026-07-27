'use client';

import { useState, useTransition } from 'react';
import { useToast } from '@/components/providers/toast-provider';
import { toggleFollow } from '@/app/(app)/actions';

/** Follow / Following toggle with optimistic state. */
export function FollowButton({ targetId, initialFollowing }: { targetId: string; initialFollowing: boolean }) {
  const { error } = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  return (
    <button
      onClick={() =>
        startTransition(async () => {
          const previous = following;
          setFollowing(!previous);
          const result = await toggleFollow(targetId);
          if (result.ok) setFollowing(result.data.following);
          else {
            setFollowing(previous);
            error(result.error);
          }
        })
      }
      disabled={pending}
      aria-pressed={following}
      style={{
        background: following ? 'var(--soft)' : 'var(--primary)',
        color: following ? 'var(--body)' : '#163300',
        border: 'none',
        borderRadius: 9999,
        padding: '10px 18px',
        font: '600 13.5px/1 var(--font-inter), Inter, sans-serif',
        cursor: 'pointer',
      }}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}
