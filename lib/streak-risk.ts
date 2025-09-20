import type { HabitSummary } from '@/app/(app)/app/habits/types';

export type StreakRiskResult = {
  isAtRisk: boolean;
  mostAtRiskHabit: HabitSummary | null;
  riskCount: number; // Number of habits at risk
};

export function checkStreakRisk(habits: HabitSummary[]): StreakRiskResult {
  const atRiskHabits = habits.filter(
    (habit) => habit.currentStreak > 0 && habit.todayCount === 0
  );

  if (atRiskHabits.length === 0) {
    return {
      isAtRisk: false,
      mostAtRiskHabit: null,
      riskCount: 0,
    };
  }

  // Find the habit with the longest current streak (most at risk)
  const mostAtRiskHabit = atRiskHabits.reduce((mostAtRisk, habit) => {
    return habit.currentStreak > mostAtRisk.currentStreak ? habit : mostAtRisk;
  });

  return {
    isAtRisk: true,
    mostAtRiskHabit,
    riskCount: atRiskHabits.length,
  };
}

