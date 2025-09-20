'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShareButtonProps {
  url?: string;
  title?: string;
  className?: string;
}

export function ShareButton({ url, title = 'Share', className }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;

    try {
      // Try native share API first (mobile)
      if (navigator.share) {
        await navigator.share({
          title: title,
          url: shareUrl,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      // Don't show error if user just canceled the share dialog
      if (error instanceof Error && error.name === 'AbortError') {
        // User canceled the share dialog - this is normal behavior
        return;
      }

      console.error('Error sharing:', error);

      // Fallback to clipboard even if native share fails
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (clipboardError) {
        console.error('Error copying to clipboard:', clipboardError);
      }
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleShare}
      className={cn(
        'gap-2 transition-all duration-200',
        copied && 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Share2 className="h-4 w-4" />
          Share
        </>
      )}
    </Button>
  );
}
