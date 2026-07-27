import Image from 'next/image';

interface AvatarProps {
  user: {
    name?: string;
    initials: string;
    avatarColor: string;
    avatarUrl?: string | null;
  };
}

export function Avatar({ user }: AvatarProps) {
  if (user.avatarUrl) {
    return (
      <Image
        src={user.avatarUrl}
        alt={user.name || user.initials}
        fill
        style={{
          borderRadius: 9999,
          objectFit: 'cover',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        borderRadius: 9999,
        background: user.avatarColor,
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 800,
      }}
    >
      {user.initials}
    </div>
  );
}
