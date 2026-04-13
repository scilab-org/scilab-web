import { cn } from '@/utils/cn';

type UserAvatarProps = {
  avatarUrl?: string | null;
  firstName?: string | null;
  username?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
};

const sizeMap = {
  sm: { container: 'size-7', text: 'text-[10px]', border: '' },
  md: { container: 'size-16', text: 'text-xl', border: 'border-2' },
  lg: { container: 'size-20', text: 'text-2xl', border: 'border-2' },
};

export const UserAvatar = ({
  avatarUrl,
  firstName,
  username,
  size = 'md',
  className,
}: UserAvatarProps) => {
  const { container, text, border } = sizeMap[size];
  const initial = (firstName?.[0] ?? username?.[0] ?? '?').toUpperCase();

  return (
    <span
      className={cn(
        'border-border bg-muted relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full',
        container,
        border,
        className,
      )}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username ?? ''}
          className="size-full object-cover"
        />
      ) : (
        <span
          className={cn(
            'text-muted-foreground font-semibold select-none',
            text,
          )}
        >
          {initial}
        </span>
      )}
    </span>
  );
};
