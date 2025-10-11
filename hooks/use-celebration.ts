'use client';

import { useCallback } from 'react';
import { celebrate, celebrationPresets, type CelebrationConfig } from '@/lib/celebrations';

export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';

export function useCelebration() {
  const triggerBadgeCelebration = useCallback((rarity: BadgeRarity) => {
    let preset: CelebrationConfig;

    switch (rarity) {
      case 'common':
        preset = celebrationPresets.firstBadge;
        break;
      case 'rare':
        preset = celebrationPresets.rareBadge;
        break;
      case 'epic':
        preset = celebrationPresets.epicBadge;
        break;
      case 'legendary':
        preset = celebrationPresets.legendaryBadge;
        break;
      default:
        preset = celebrationPresets.firstBadge;
    }

    celebrate(preset);
  }, []);

  const triggerStreakCelebration = useCallback((streakDays: number) => {
    let preset: CelebrationConfig;

    if (streakDays >= 365) {
      preset = celebrationPresets.yearStreak;
    } else if (streakDays >= 30) {
      preset = celebrationPresets.monthStreak;
    } else if (streakDays >= 7) {
      preset = celebrationPresets.weekStreak;
    } else {
      preset = celebrationPresets.weekStreak;
    }

    celebrate(preset);
  }, []);

  const triggerHabitCelebration = useCallback((habitCount: number) => {
    const preset = habitCount >= 10
      ? celebrationPresets.habitMilestone
      : celebrationPresets.habitCreated;

    celebrate(preset);
  }, []);

  const triggerCustomCelebration = useCallback((config: CelebrationConfig) => {
    celebrate(config);
  }, []);

  return {
    triggerBadgeCelebration,
    triggerStreakCelebration,
    triggerHabitCelebration,
    triggerCustomCelebration,
  };
}
