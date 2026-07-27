import Image from 'next/image';

interface AvatarProps {
  user: {
    name: string;
    initials: string;
    avatarColor: string;
    avatarUrl?: string | null;
  };
  size?: number;
}

export function Avatar({ user, size = 48 }: AvatarProps) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name}
        width={size}
        height={size}
        style={{
          width: size,
          height: size,
          borderRadius: 9999,
          objectFit: 'cover',
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 9999,
        background: user.avatarColor,
        color: '#fff',
        font: `800 ${Math.max(12, size * 0.35)}px/1 var(--font-manrope), Manrope`,
        display: 'grid',
        placeItems: 'center',
        flexShrink: 0,
      }}
    >
      {user.initials}
    </div>
  );
}
