/**
 * Enhanced Analytics Library
 *
 * Provides advanced analytics calculations including:
 * - Best/worst days analysis
 * - Streak survival predictions
 * - Habit correlations
 * - Monthly/yearly trends
 */

export interface DayOfWeekStats {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  dayName: string;
  completions: number;
  attempts: number;
  completionRate: number;
}

export interface BestWorstDays {
  bestDay: DayOfWeekStats;
  worstDay: DayOfWeekStats;
  allDays: DayOfWeekStats[];
}

export interface StreakPrediction {
  currentStreak: number;
  survivalProbability: number; // 0-100
  confidence: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  contributingFactors: string[];
}

export interface HabitCorrelation {
  habitAId: string;
  habitATitle: string;
  habitBId: string;
  habitBTitle: string;
  correlationCoefficient: number; // -1 to 1
  correlationType: 'positive' | 'negative' | 'none';
  strength: 'strong' | 'moderate' | 'weak';
  insight: string;
}

export interface TrendData {
  period: string; // e.g., "2024-01", "2024-W01"
  completions: number;
  target: number;
  completionRate: number;
  streakDays: number;
}

export interface MonthlyYearlyTrends {
  monthly: TrendData[];
  yearly: TrendData[];
  trendDirection: 'improving' | 'stable' | 'declining';
  averageGrowthRate: number;
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculate best and worst days for a habit based on historical data
 */
export function calculateBestWorstDays(
  checkins: Array<{ local_date: string; count: number }>,
  target: number = 1
): BestWorstDays | null {
  if (checkins.length === 0) return null;

  // Group by day of week
  const dayStats = new Map<number, { completions: number; attempts: number }>();

  for (let i = 0; i < 7; i++) {
    dayStats.set(i, { completions: 0, attempts: 0 });
  }

  checkins.forEach((checkin) => {
    const date = new Date(checkin.local_date + 'T00:00:00Z');
    const dayOfWeek = date.getUTCDay();
    const stats = dayStats.get(dayOfWeek)!;

    stats.attempts += 1;
    if (checkin.count >= target) {
      stats.completions += 1;
    }
  });

  // Calculate rates for each day
  const allDays: DayOfWeekStats[] = Array.from(dayStats.entries()).map(([dayOfWeek, stats]) => ({
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    completions: stats.completions,
    attempts: stats.attempts,
    completionRate: stats.attempts > 0 ? (stats.completions / stats.attempts) * 100 : 0,
  }));

  // Find best and worst days (only consider days with attempts)
  const daysWithAttempts = allDays.filter((d) => d.attempts > 0);
  if (daysWithAttempts.length === 0) return null;

  const bestDay = daysWithAttempts.reduce((best, current) =>
    current.completionRate > best.completionRate ? current : best
  );

  const worstDay = daysWithAttempts.reduce((worst, current) =>
    current.completionRate < worst.completionRate ? current : worst
  );

  return {
    bestDay,
    worstDay,
    allDays,
  };
}

/**
 * Predict streak survival probability based on historical patterns
 */
export function predictStreakSurvival(
  currentStreak: number,
  historicalStreaks: number[],
  recentCompletionRate: number, // 0-100
  dayOfWeekFactor: number = 1.0 // Multiplier based on today's day of week performance
): StreakPrediction {
  // Base survival probability on current streak length
  // Longer streaks have higher momentum
  const streakMomentum = Math.min(currentStreak / 30, 1.0); // Max at 30 days

  // Calculate historical streak survival rate
  const longStreaks = historicalStreaks.filter((s) => s >= 7).length;
  const totalStreaks = historicalStreaks.length || 1;
  const historicalSurvivalRate = (longStreaks / totalStreaks) * 100;

  // Recent performance weight (higher weight = more important)
  const recentPerformanceWeight = 0.4;
  const historicalWeight = 0.3;
  const momentumWeight = 0.2;
  const dayOfWeekWeight = 0.1;

  // Calculate weighted probability
  const rawProbability =
    recentCompletionRate * recentPerformanceWeight +
    historicalSurvivalRate * historicalWeight +
    streakMomentum * 100 * momentumWeight +
    dayOfWeekFactor * 100 * dayOfWeekWeight;

  const survivalProbability = Math.max(0, Math.min(100, rawProbability));

  // Determine risk level
  let riskLevel: 'low' | 'medium' | 'high';
  if (survivalProbability >= 70) {
    riskLevel = 'low';
  } else if (survivalProbability >= 40) {
    riskLevel = 'medium';
  } else {
    riskLevel = 'high';
  }

  // Calculate confidence based on data availability
  const dataPoints = Math.min(historicalStreaks.length, 30);
  const confidence = Math.min(100, (dataPoints / 30) * 100);

  // Generate contributing factors
  const contributingFactors: string[] = [];

  if (recentCompletionRate >= 80) {
    contributingFactors.push('Strong recent performance');
  } else if (recentCompletionRate < 50) {
    contributingFactors.push('Recent performance below average');
  }

  if (currentStreak >= 14) {
    contributingFactors.push('Strong momentum from current streak');
  } else if (currentStreak < 3) {
    contributingFactors.push('Building early streak momentum');
  }

  if (historicalSurvivalRate >= 60) {
    contributingFactors.push('Good historical streak maintenance');
  }

  if (dayOfWeekFactor >= 1.2) {
    contributingFactors.push('Today is typically a strong day');
  } else if (dayOfWeekFactor < 0.8) {
    contributingFactors.push('Today is historically challenging');
  }

  return {
    currentStreak,
    survivalProbability: Math.round(survivalProbability),
    confidence: Math.round(confidence),
    riskLevel,
    contributingFactors,
  };
}

/**
 * Calculate correlation between two habits using Pearson correlation coefficient
 */
export function calculateHabitCorrelation(
  habitACheckins: Array<{ local_date: string; count: number }>,
  habitBCheckins: Array<{ local_date: string; count: number }>,
  habitATitle: string,
  habitBTitle: string,
  habitAId: string,
  habitBId: string
): HabitCorrelation | null {
  // Create date maps for both habits
  const habitAMap = new Map(habitACheckins.map((c) => [c.local_date, c.count > 0 ? 1 : 0]));
  const habitBMap = new Map(habitBCheckins.map((c) => [c.local_date, c.count > 0 ? 1 : 0]));

  // Find common dates
  const commonDates = Array.from(habitAMap.keys()).filter((date) => habitBMap.has(date));

  // Need at least 7 days of overlapping data for meaningful correlation
  if (commonDates.length < 7) return null;

  // Extract values for common dates
  const xValues = commonDates.map((date) => habitAMap.get(date)!);
  const yValues = commonDates.map((date) => habitBMap.get(date)!);

  // Calculate Pearson correlation coefficient
  const n = xValues.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  const sumY2 = yValues.reduce((sum, y) => sum + y * y, 0);

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return null;

  const correlationCoefficient = numerator / denominator;

  // Determine correlation type
  let correlationType: 'positive' | 'negative' | 'none';
  if (correlationCoefficient > 0.1) {
    correlationType = 'positive';
  } else if (correlationCoefficient < -0.1) {
    correlationType = 'negative';
  } else {
    correlationType = 'none';
  }

  // Determine strength
  const absCorr = Math.abs(correlationCoefficient);
  let strength: 'strong' | 'moderate' | 'weak';
  if (absCorr >= 0.7) {
    strength = 'strong';
  } else if (absCorr >= 0.4) {
    strength = 'moderate';
  } else {
    strength = 'weak';
  }

  // Generate insight
  let insight = '';
  if (correlationType === 'positive' && strength === 'strong') {
    insight = `Completing ${habitATitle} strongly increases likelihood of completing ${habitBTitle}`;
  } else if (correlationType === 'positive' && strength === 'moderate') {
    insight = `${habitATitle} and ${habitBTitle} tend to be completed together`;
  } else if (correlationType === 'negative' && strength === 'strong') {
    insight = `Completing ${habitATitle} is strongly associated with skipping ${habitBTitle}`;
  } else if (correlationType === 'negative' && strength === 'moderate') {
    insight = `${habitATitle} and ${habitBTitle} tend to be completed on different days`;
  } else {
    insight = `${habitATitle} and ${habitBTitle} show minimal correlation`;
  }

  return {
    habitAId,
    habitATitle,
    habitBId,
    habitBTitle,
    correlationCoefficient: Math.round(correlationCoefficient * 10000) / 10000,
    correlationType,
    strength,
    insight,
  };
}

/**
 * Calculate monthly and yearly trends
 */
export function calculateMonthlyYearlyTrends(
  checkins: Array<{ local_date: string; count: number }>,
  target: number = 1
): MonthlyYearlyTrends {
  // Group by month and year
  const monthlyMap = new Map<string, { completions: number; attempts: number; streakDays: Set<string> }>();
  const yearlyMap = new Map<string, { completions: number; attempts: number; streakDays: Set<string> }>();

  checkins.forEach((checkin) => {
    const date = new Date(checkin.local_date + 'T00:00:00Z');
    const monthKey = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
    const yearKey = `${date.getUTCFullYear()}`;

    // Update monthly
    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, { completions: 0, attempts: 0, streakDays: new Set() });
    }
    const monthStats = monthlyMap.get(monthKey)!;
    monthStats.attempts += 1;
    if (checkin.count >= target) {
      monthStats.completions += 1;
      monthStats.streakDays.add(checkin.local_date);
    }

    // Update yearly
    if (!yearlyMap.has(yearKey)) {
      yearlyMap.set(yearKey, { completions: 0, attempts: 0, streakDays: new Set() });
    }
    const yearStats = yearlyMap.get(yearKey)!;
    yearStats.attempts += 1;
    if (checkin.count >= target) {
      yearStats.completions += 1;
      yearStats.streakDays.add(checkin.local_date);
    }
  });

  // Convert to arrays
  const monthly: TrendData[] = Array.from(monthlyMap.entries())
    .map(([period, stats]) => ({
      period,
      completions: stats.completions,
      target: stats.attempts * target,
      completionRate: stats.attempts > 0 ? (stats.completions / stats.attempts) * 100 : 0,
      streakDays: stats.streakDays.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const yearly: TrendData[] = Array.from(yearlyMap.entries())
    .map(([period, stats]) => ({
      period,
      completions: stats.completions,
      target: stats.attempts * target,
      completionRate: stats.attempts > 0 ? (stats.completions / stats.attempts) * 100 : 0,
      streakDays: stats.streakDays.size,
    }))
    .sort((a, b) => a.period.localeCompare(b.period));

  // Calculate trend direction
  let trendDirection: 'improving' | 'stable' | 'declining' = 'stable';
  let averageGrowthRate = 0;

  if (monthly.length >= 2) {
    const recentMonths = monthly.slice(-3); // Last 3 months
    const rates = recentMonths.map((m) => m.completionRate);

    // Calculate simple linear regression slope
    const n = rates.length;
    const xValues = Array.from({ length: n }, (_, i) => i);
    const sumX = xValues.reduce((a, b) => a + b, 0);
    const sumY = rates.reduce((a, b) => a + b, 0);
    const sumXY = xValues.reduce((sum, x, i) => sum + x * rates[i], 0);
    const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    averageGrowthRate = slope;

    if (slope > 2) {
      trendDirection = 'improving';
    } else if (slope < -2) {
      trendDirection = 'declining';
    } else {
      trendDirection = 'stable';
    }
  }

  return {
    monthly,
    yearly,
    trendDirection,
    averageGrowthRate: Math.round(averageGrowthRate * 100) / 100,
  };
}

/**
 * Helper function to get day of week performance factor
 */
export function getDayOfWeekFactor(
  dayOfWeek: number,
  bestWorstDays: BestWorstDays | null
): number {
  if (!bestWorstDays) return 1.0;

  const dayStats = bestWorstDays.allDays.find((d) => d.dayOfWeek === dayOfWeek);
  if (!dayStats || dayStats.attempts === 0) return 1.0;

  // Calculate factor relative to average
  const avgCompletionRate =
    bestWorstDays.allDays.reduce((sum, d) => sum + d.completionRate, 0) / 7;

  if (avgCompletionRate === 0) return 1.0;

  return dayStats.completionRate / avgCompletionRate;
}

/**
 * Extract historical streaks from checkins
 */
export function extractHistoricalStreaks(
  checkins: Array<{ local_date: string; count: number }>,
  target: number = 1
): number[] {
  if (checkins.length === 0) return [];

  // Sort by date
  const sorted = [...checkins]
    .sort((a, b) => a.local_date.localeCompare(b.local_date))
    .filter((c) => c.count >= target);

  const streaks: number[] = [];
  let currentStreak = 0;
  let previousDate: Date | null = null;

  sorted.forEach((checkin) => {
    const currentDate = new Date(checkin.local_date + 'T00:00:00Z');

    if (previousDate === null) {
      currentStreak = 1;
    } else {
      const daysDiff = Math.floor(
        (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        currentStreak += 1;
      } else {
        if (currentStreak > 0) {
          streaks.push(currentStreak);
        }
        currentStreak = 1;
      }
    }

    previousDate = currentDate;
  });

  // Add final streak
  if (currentStreak > 0) {
    streaks.push(currentStreak);
  }

  return streaks;
}
