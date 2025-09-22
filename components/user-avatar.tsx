'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type UserAvatarProps = {
  avatarUrl?: string | null;
  emoji?: string | null;
  username?: string | null;
  email?: string | null;
  className?: string;
};

export function UserAvatar({ 
  avatarUrl, 
  emoji, 
  username, 
  email, 
  className 
}: UserAvatarProps) {
  // Generate fallback initials from username or email
  const getInitials = () => {
    if (username) {
      return username.slice(0, 2).toUpperCase();
    }
    if (email) {
      return email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  // Use emoji as fallback if available, otherwise use initials
  const fallback = emoji || getInitials();

  return (
    <Avatar className={className}>
      {avatarUrl && (
        <AvatarImage 
          src={avatarUrl} 
          alt={`${username || email || 'User'}'s profile picture`}
        />
      )}
      <AvatarFallback>
        {typeof fallback === 'string' && fallback.length <= 2 ? fallback : emoji || '👤'}
      </AvatarFallback>
    </Avatar>
  );
}
