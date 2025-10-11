'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { MilestoneCard, type MilestoneCardProps } from '@/components/milestone-card';
import { useCelebration, type BadgeRarity } from '@/hooks/use-celebration';
import { cn } from '@/lib/utils';

export type CelebrationModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: Omit<MilestoneCardProps, 'className'>;
  autoClose?: boolean;
  autoCloseDuration?: number;
};

export function CelebrationModal({
  open,
  onOpenChange,
  milestone,
  autoClose = false,
  autoCloseDuration = 10000,
}: CelebrationModalProps) {
  const { triggerBadgeCelebration } = useCelebration();
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    if (open && !hasTriggered) {
      // Trigger confetti when modal opens
      const rarity = milestone.rarity || 'common';
      triggerBadgeCelebration(rarity as BadgeRarity);
      setHasTriggered(true);

      // Auto-close after duration if enabled
      if (autoClose) {
        const timer = setTimeout(() => {
          onOpenChange(false);
        }, autoCloseDuration);

        return () => clearTimeout(timer);
      }
    }

    // Reset triggered state when modal closes
    if (!open) {
      setHasTriggered(false);
    }
  }, [open, hasTriggered, milestone.rarity, triggerBadgeCelebration, autoClose, autoCloseDuration, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-lg border-2 p-0 gap-0 overflow-hidden',
          'animate-in fade-in-0 zoom-in-95 duration-300',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95'
        )}
      >
        {/* Close button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full bg-background/80 p-2 opacity-70 backdrop-blur-sm transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>

        {/* Hidden header for accessibility */}
        <DialogHeader className="sr-only">
          <DialogTitle>Achievement Unlocked!</DialogTitle>
          <DialogDescription>
            You've unlocked a new milestone: {milestone.title}
          </DialogDescription>
        </DialogHeader>

        {/* Celebration banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 px-6 py-8 text-center">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="relative">
            <h2 className="mb-2 text-3xl font-bold">
              🎉 Achievement Unlocked! 🎉
            </h2>
            <p className="text-sm text-muted-foreground">
              Congratulations on reaching this milestone!
            </p>
          </div>
        </div>

        {/* Milestone card */}
        <div className="p-6">
          <MilestoneCard {...milestone} className="shadow-none border-0" />
        </div>

        {/* Action buttons */}
        <div className="border-t bg-muted/30 px-6 py-4">
          <div className="flex gap-2">
            <Button
              variant="default"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Awesome!
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                // Re-trigger celebration
                const rarity = milestone.rarity || 'common';
                triggerBadgeCelebration(rarity as BadgeRarity);
              }}
            >
              🎊 Again!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Grid pattern SVG for background
const gridPatternStyle = `
  .bg-grid-pattern {
    background-image:
      linear-gradient(to right, currentColor 1px, transparent 1px),
      linear-gradient(to bottom, currentColor 1px, transparent 1px);
    background-size: 20px 20px;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gridPatternStyle;
  document.head.appendChild(style);
}
