import confetti from 'canvas-confetti';

export type CelebrationType = 'badge_unlock' | 'streak_milestone' | 'habit_milestone';

export type CelebrationConfig = {
  type: CelebrationType;
  duration?: number;
  particleCount?: number;
  spread?: number;
  colors?: string[];
};

/**
 * Trigger confetti animation based on the celebration type
 */
export function celebrate(config: CelebrationConfig) {
  const {
    type,
    duration = 3000,
    particleCount = 100,
    spread = 70,
    colors,
  } = config;

  // Get theme-appropriate colors
  const defaultColors = getThemeColors();
  const confettiColors = colors || defaultColors;

  switch (type) {
    case 'badge_unlock':
      fireBadgeConfetti(duration, particleCount, spread, confettiColors);
      break;
    case 'streak_milestone':
      fireStreakConfetti(duration, particleCount, spread, confettiColors);
      break;
    case 'habit_milestone':
      fireHabitConfetti(duration, particleCount, spread, confettiColors);
      break;
  }
}

/**
 * Badge unlock celebration - burst from center
 */
function fireBadgeConfetti(
  duration: number,
  particleCount: number,
  spread: number,
  colors: string[]
) {
  const animationEnd = Date.now() + duration;

  const randomInRange = (min: number, max: number) => {
    return Math.random() * (max - min) + min;
  };

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleRatio = timeLeft / duration;

    // Burst from center
    confetti({
      particleCount: Math.floor(particleCount * particleRatio),
      spread: spread,
      origin: { x: 0.5, y: 0.5 },
      colors: colors,
      startVelocity: 45,
      gravity: 1.2,
      scalar: randomInRange(0.8, 1.4),
      ticks: 200,
      shapes: ['circle', 'square'],
      zIndex: 9999,
    });
  }, 250);
}

/**
 * Streak milestone celebration - continuous fireworks
 */
function fireStreakConfetti(
  duration: number,
  particleCount: number,
  spread: number,
  colors: string[]
) {
  const animationEnd = Date.now() + duration;

  const interval = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    // Fire from random positions
    confetti({
      particleCount: particleCount / 2,
      angle: 60,
      spread: spread,
      origin: { x: 0, y: 0.8 },
      colors: colors,
      startVelocity: 55,
      zIndex: 9999,
    });

    confetti({
      particleCount: particleCount / 2,
      angle: 120,
      spread: spread,
      origin: { x: 1, y: 0.8 },
      colors: colors,
      startVelocity: 55,
      zIndex: 9999,
    });
  }, 400);
}

/**
 * Habit milestone celebration - cannon blast
 */
function fireHabitConfetti(
  duration: number,
  particleCount: number,
  spread: number,
  colors: string[]
) {
  const defaults = {
    spread: spread,
    ticks: 100,
    gravity: 1,
    decay: 0.94,
    startVelocity: 30,
    colors: colors,
    zIndex: 9999,
  };

  function shoot(angle: number, originX: number, originY: number) {
    confetti({
      ...defaults,
      particleCount: particleCount / 3,
      angle,
      origin: { x: originX, y: originY },
    });
  }

  setTimeout(() => shoot(60, 0.1, 0.6), 0);
  setTimeout(() => shoot(90, 0.5, 0.6), 100);
  setTimeout(() => shoot(120, 0.9, 0.6), 200);
}

/**
 * Get theme-appropriate colors for confetti
 */
function getThemeColors(): string[] {
  // Check if we're in dark mode
  const isDark = document.documentElement.classList.contains('dark');

  if (isDark) {
    // Dark mode: bright, vibrant colors
    return ['#58c4ff', '#34d399', '#f97316', '#a855f7', '#f472b6'];
  }

  // Light mode: warm zest colors
  return ['#ffb400', '#ff7a1b', '#8bc63e', '#ffc044', '#e59600'];
}

/**
 * Celebration presets for common milestones
 */
export const celebrationPresets = {
  firstBadge: {
    type: 'badge_unlock' as const,
    duration: 2000,
    particleCount: 80,
    spread: 60,
  },
  rareBadge: {
    type: 'badge_unlock' as const,
    duration: 3000,
    particleCount: 120,
    spread: 80,
  },
  epicBadge: {
    type: 'badge_unlock' as const,
    duration: 4000,
    particleCount: 150,
    spread: 90,
  },
  legendaryBadge: {
    type: 'streak_milestone' as const,
    duration: 5000,
    particleCount: 200,
    spread: 100,
  },
  weekStreak: {
    type: 'streak_milestone' as const,
    duration: 3000,
    particleCount: 100,
    spread: 70,
  },
  monthStreak: {
    type: 'streak_milestone' as const,
    duration: 4000,
    particleCount: 150,
    spread: 80,
  },
  yearStreak: {
    type: 'streak_milestone' as const,
    duration: 6000,
    particleCount: 250,
    spread: 100,
  },
  habitCreated: {
    type: 'habit_milestone' as const,
    duration: 2000,
    particleCount: 60,
    spread: 50,
  },
  habitMilestone: {
    type: 'habit_milestone' as const,
    duration: 3000,
    particleCount: 100,
    spread: 70,
  },
} as const;
