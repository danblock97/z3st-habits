/**
 * Example component showing how to integrate celebrations
 * into your habit completion flow.
 *
 * This is a reference implementation - adapt to your needs!
 */

'use client';

import { useState } from 'react';
import { useCelebration } from '@/hooks/use-celebration';
import { CelebrationModal } from '@/components/celebration-modal';
import { Button } from '@/components/ui/button';
import type { MilestoneCardProps } from '@/components/milestone-card';

export function CelebrationExample() {
  const [showCelebration, setShowCelebration] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<Omit<MilestoneCardProps, 'className'> | null>(null);
  const { triggerBadgeCelebration, triggerStreakCelebration, triggerCustomCelebration } = useCelebration();

  // Example 1: Trigger confetti only (no modal)
  const handleQuickCelebration = () => {
    triggerBadgeCelebration('epic');
  };

  // Example 2: Show full celebration modal with badge unlock
  const handleBadgeUnlock = (badgeType: 'common' | 'rare' | 'epic' | 'legendary') => {
    const milestones = {
      common: {
        type: 'badge' as const,
        title: 'Getting Started',
        description: 'Complete a habit streak',
        emoji: '🌱',
        rarity: 'common' as const,
        unlockedAt: new Date(),
      },
      rare: {
        type: 'badge' as const,
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        emoji: '⚔️',
        rarity: 'rare' as const,
        unlockedAt: new Date(),
      },
      epic: {
        type: 'badge' as const,
        title: 'Century Club',
        description: 'Maintain a 100-day streak',
        emoji: '💯',
        rarity: 'epic' as const,
        value: 100,
        unlockedAt: new Date(),
      },
      legendary: {
        type: 'badge' as const,
        title: 'Streak Legend',
        description: 'Maintain a 365-day streak',
        emoji: '🏆',
        rarity: 'legendary' as const,
        value: 365,
        unlockedAt: new Date(),
      },
    };

    setCurrentMilestone(milestones[badgeType]);
    setShowCelebration(true);
  };

  // Example 3: Celebrate streak milestone
  const handleStreakMilestone = (days: number) => {
    const milestoneData = {
      type: 'streak' as const,
      title: `${days}-Day Streak!`,
      description: `You've maintained a ${days}-day habit streak!`,
      emoji: days >= 100 ? '🔥' : days >= 30 ? '⭐' : '✨',
      rarity: (days >= 365 ? 'legendary' : days >= 100 ? 'epic' : days >= 30 ? 'rare' : 'common') as const,
      value: days,
      unlockedAt: new Date(),
    };

    triggerStreakCelebration(days);
    setCurrentMilestone(milestoneData);
    setShowCelebration(true);
  };

  // Example 4: Custom celebration with specific config
  const handleCustomCelebration = () => {
    triggerCustomCelebration({
      type: 'habit_milestone',
      duration: 4000,
      particleCount: 150,
      spread: 80,
      colors: ['#ffb400', '#ff7a1b', '#8bc63e'], // Custom colors
    });
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Celebration Examples</h2>
        <p className="text-muted-foreground mb-6">
          Click the buttons below to test different celebration types
        </p>
      </div>

      {/* Example 1: Confetti Only */}
      <div className="space-y-2">
        <h3 className="font-semibold">Confetti Only (No Modal)</h3>
        <Button onClick={handleQuickCelebration} variant="outline">
          🎊 Quick Celebration
        </Button>
      </div>

      {/* Example 2: Badge Unlocks */}
      <div className="space-y-2">
        <h3 className="font-semibold">Badge Unlock Celebrations</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleBadgeUnlock('common')} variant="outline">
            Common Badge
          </Button>
          <Button onClick={() => handleBadgeUnlock('rare')} variant="outline">
            Rare Badge
          </Button>
          <Button onClick={() => handleBadgeUnlock('epic')} variant="outline">
            Epic Badge
          </Button>
          <Button onClick={() => handleBadgeUnlock('legendary')} variant="outline">
            Legendary Badge
          </Button>
        </div>
      </div>

      {/* Example 3: Streak Milestones */}
      <div className="space-y-2">
        <h3 className="font-semibold">Streak Milestone Celebrations</h3>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => handleStreakMilestone(7)} variant="outline">
            7-Day Streak
          </Button>
          <Button onClick={() => handleStreakMilestone(30)} variant="outline">
            30-Day Streak
          </Button>
          <Button onClick={() => handleStreakMilestone(100)} variant="outline">
            100-Day Streak
          </Button>
          <Button onClick={() => handleStreakMilestone(365)} variant="outline">
            365-Day Streak
          </Button>
        </div>
      </div>

      {/* Example 4: Custom */}
      <div className="space-y-2">
        <h3 className="font-semibold">Custom Celebration</h3>
        <Button onClick={handleCustomCelebration} variant="outline">
          🎨 Custom Config
        </Button>
      </div>

      {/* Celebration Modal */}
      {currentMilestone && (
        <CelebrationModal
          open={showCelebration}
          onOpenChange={setShowCelebration}
          milestone={currentMilestone}
        />
      )}
    </div>
  );
}

/**
 * Real-world integration example:
 *
 * // In your habit completion handler:
 * async function handleHabitComplete(habitId: string) {
 *   // Complete the habit
 *   const result = await completeHabit(habitId);
 *
 *   // Check for badge unlocks
 *   const badges = await checkAndAwardBadges({
 *     userId: user.id,
 *     habitId,
 *     action: 'habit_completed',
 *   });
 *
 *   // Show celebration for any newly unlocked badges
 *   for (const badge of badges) {
 *     if (badge.awarded) {
 *       const milestone = {
 *         type: 'badge' as const,
 *         title: badge.title,
 *         description: badge.message,
 *         emoji: getBadgeEmoji(badge.badgeKind),
 *         rarity: getBadgeRarity(badge.badgeKind),
 *         unlockedAt: new Date(),
 *       };
 *
 *       // Show modal
 *       showCelebration(milestone);
 *
 *       // Or just trigger confetti
 *       triggerBadgeCelebration(milestone.rarity);
 *     }
 *   }
 * }
 */
