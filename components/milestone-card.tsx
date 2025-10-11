'use client';

import { useState } from 'react';
import { Share2, Download, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export type MilestoneType = 'badge' | 'streak' | 'habit_count';

export type MilestoneCardProps = {
  type: MilestoneType;
  title: string;
  description: string;
  emoji: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  value?: number;
  username?: string;
  unlockedAt: Date;
  className?: string;
};

const rarityColors = {
  common: 'from-gray-400 to-gray-600 dark:from-slate-600 dark:to-slate-800',
  rare: 'from-blue-400 to-blue-600 dark:from-sky-500 dark:to-sky-700',
  epic: 'from-purple-400 to-purple-600 dark:from-violet-500 dark:to-violet-700',
  legendary: 'from-amber-400 to-amber-600 dark:from-cyan-400 dark:to-cyan-600',
} as const;

const rarityGlow = {
  common: 'shadow-gray-400/20 dark:shadow-slate-600/20',
  rare: 'shadow-blue-400/40 dark:shadow-sky-500/40',
  epic: 'shadow-purple-400/40 dark:shadow-violet-500/40',
  legendary: 'shadow-amber-400/60 dark:shadow-cyan-400/60',
} as const;

export function MilestoneCard({
  type,
  title,
  description,
  emoji,
  rarity = 'common',
  value,
  username,
  unlockedAt,
  className,
}: MilestoneCardProps) {
  const [copied, setCopied] = useState(false);
  const [sharing, setSharing] = useState(false);

  const shareUrl = username
    ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app'}/u/${username}`
    : process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app';

  const ogImageUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://z3st.app'}/og/milestone?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}&emoji=${encodeURIComponent(emoji)}&rarity=${rarity}${value ? `&value=${value}` : ''}`;

  const handleShare = async () => {
    setSharing(true);

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${title} - z3st`,
          text: description,
          url: shareUrl,
        });
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback: copy link
      await handleCopyLink();
    }

    setSharing(false);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(ogImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}-milestone.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download:', error);
    }
  };

  return (
    <Card
      className={cn(
        'relative overflow-hidden transition-all duration-300 hover:shadow-xl',
        rarityGlow[rarity],
        className
      )}
    >
      {/* Gradient overlay */}
      <div
        className={cn(
          'absolute inset-0 opacity-5 dark:opacity-10 bg-gradient-to-br',
          rarityColors[rarity]
        )}
      />

      <CardHeader className="relative space-y-4">
        {/* Emoji and rarity badge */}
        <div className="flex items-start justify-between">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-5xl shadow-lg">
            {emoji}
          </div>
          <div
            className={cn(
              'rounded-full px-3 py-1 text-xs font-semibold text-white shadow-md',
              `bg-gradient-to-r ${rarityColors[rarity]}`
            )}
          >
            {rarity.toUpperCase()}
          </div>
        </div>

        {/* Title and description */}
        <div>
          <CardTitle className="text-2xl font-bold">{title}</CardTitle>
          <CardDescription className="mt-2 text-base">
            {description}
          </CardDescription>
        </div>

        {/* Value display for streaks/counts */}
        {value !== undefined && (
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-primary">{value}</span>
            <span className="text-muted-foreground">
              {type === 'streak' ? 'day streak' : 'habits'}
            </span>
          </div>
        )}
      </CardHeader>

      <CardContent className="relative space-y-4">
        {/* Unlocked date */}
        <div className="text-sm text-muted-foreground">
          Unlocked on {unlockedAt.toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </div>

        {/* Share buttons */}
        <div className="flex gap-2">
          <Button
            variant="default"
            size="sm"
            onClick={handleShare}
            disabled={sharing}
            className="flex-1"
          >
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyLink}
            disabled={copied}
          >
            {copied ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Copied
              </>
            ) : (
              <>
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>

        {/* Footer branding */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>z3st.app</span>
            <span>{username && `@${username}`}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
