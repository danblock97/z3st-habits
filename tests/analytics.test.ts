// Analytics testing utilities and test data
// This file provides comprehensive testing instructions and utilities for the analytics features

import { expect } from 'vitest';

export interface TestHabitData {
  id: string;
  title: string;
  emoji: string;
  cadence: 'daily' | 'weekly';
  targetPerPeriod: number;
}

export interface TestCheckinData {
  habitId: string;
  localDate: string;
  count: number;
}

// Sample test data for different scenarios
export const TEST_HABITS: TestHabitData[] = [
  {
    id: 'test-habit-1',
    title: 'Morning Meditation',
    emoji: '🧘',
    cadence: 'daily',
    targetPerPeriod: 1
  },
  {
    id: 'test-habit-2',
    title: 'Read 30 minutes',
    emoji: '📚',
    cadence: 'daily',
    targetPerPeriod: 1
  },
  {
    id: 'test-habit-3',
    title: 'Exercise',
    emoji: '💪',
    cadence: 'daily',
    targetPerPeriod: 1
  },
  {
    id: 'test-habit-4',
    title: 'Weekly Planning',
    emoji: '📅',
    cadence: 'weekly',
    targetPerPeriod: 1
  }
];

// Generate test checkins for the last 30 days with realistic patterns
export function generateTestCheckins(habits: TestHabitData[], days: number = 30): TestCheckinData[] {
  const checkins: TestCheckinData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateString = date.toISOString().split('T')[0];

    // Generate checkins with realistic patterns
    habits.forEach((habit, index) => {
      // Skip some days to create realistic gaps
      const shouldSkip = Math.random() < 0.2; // 20% chance to skip a day

      if (!shouldSkip) {
        // Different completion rates for different habits
        const completionRate = 0.7 + (index * 0.1); // 70% to 100% completion rate
        const shouldComplete = Math.random() < completionRate;

        if (shouldComplete) {
          // Generate 1-3 checkins per day for this habit
          const checkinCount = Math.floor(Math.random() * 3) + 1;

          checkins.push({
            habitId: habit.id,
            localDate: dateString,
            count: checkinCount
          });
        }
      }
    });
  }

  return checkins;
}

// Test scenarios for different user types
export const TEST_SCENARIOS = {
  FREE_USER: {
    description: 'Free tier user with limited access',
    tier: 'free',
    expectedFeatures: {
      analytics: false,
      export: false,
      advancedAnalytics: false
    }
  },

  PRO_USER: {
    description: 'Pro tier user with basic analytics',
    tier: 'pro',
    expectedFeatures: {
      analytics: true,
      export: false,
      advancedAnalytics: false
    }
  },

  PLUS_USER: {
    description: 'Plus tier user with full analytics and export',
    tier: 'plus',
    expectedFeatures: {
      analytics: true,
      export: true,
      advancedAnalytics: true
    }
  }
};

// Test helper functions
export function createTestUserScenario(tier: 'free' | 'pro' | 'plus') {
  const scenario = TEST_SCENARIOS[tier === 'free' ? 'FREE_USER' : tier === 'pro' ? 'PRO_USER' : 'PLUS_USER'];

  return {
    ...scenario,
    testHabits: TEST_HABITS,
    testCheckins: generateTestCheckins(TEST_HABITS, 30)
  };
}

// Validation functions for testing
export function validateAnalyticsResponse(data: any) {
  expect(data).toHaveProperty('success', true);
  expect(data).toHaveProperty('data');
  expect(data).toHaveProperty('period');

  const { summary, dailyStats, habitBreakdown, trends } = data.data;

  // Validate summary structure
  expect(summary).toHaveProperty('totalCheckins');
  expect(summary).toHaveProperty('totalHabits');
  expect(summary).toHaveProperty('averageCompletionRate');
  expect(summary).toHaveProperty('streakDays');

  // Validate daily stats
  expect(Array.isArray(dailyStats)).toBe(true);
  dailyStats.forEach((stat: any) => {
    expect(stat).toHaveProperty('date');
    expect(stat).toHaveProperty('totalCheckins');
    expect(stat).toHaveProperty('completionRate');
    expect(stat).toHaveProperty('habitsCompleted');
  });

  // Validate habit breakdown
  expect(Array.isArray(habitBreakdown)).toBe(true);
  habitBreakdown.forEach((habit: any) => {
    expect(habit).toHaveProperty('habitId');
    expect(habit).toHaveProperty('title');
    expect(habit).toHaveProperty('emoji');
    expect(habit).toHaveProperty('totalCheckins');
    expect(habit).toHaveProperty('completionRate');
    expect(habit).toHaveProperty('streakDays');
  });

  // Validate trends
  expect(trends).toHaveProperty('dailyAverage');
  expect(trends).toHaveProperty('weeklyAverage');
  expect(trends).toHaveProperty('consistencyScore');
}

// Test the analytics API endpoints
export async function testAnalyticsAPI(baseUrl: string = '', tier: 'free' | 'pro' | 'plus' = 'pro') {
  const scenario = createTestUserScenario(tier);

  console.log(`🧪 Testing ${scenario.description}`);

  try {
    // Test basic analytics endpoint
    const analyticsResponse = await fetch(`${baseUrl}/api/analytics/habits?period=30d`);
    const analyticsData = await analyticsResponse.json();

    console.log('📊 Analytics API Response:');
    console.log(`   Status: ${analyticsResponse.status}`);
    console.log(`   Success: ${analyticsData.success}`);

    if (analyticsData.success) {
      validateAnalyticsResponse(analyticsData);
      console.log('✅ Analytics API validation passed');
    } else {
      console.log('❌ Analytics API returned error:', analyticsData.error);
    }

    // Test CSV export (only for Plus users)
    if (tier === 'plus') {
      const exportResponse = await fetch(`${baseUrl}/api/analytics/export?dateFrom=2024-01-01&dateTo=2024-01-31`);
      const exportData = await exportResponse.blob();

      console.log('📄 Export API Response:');
      console.log(`   Status: ${exportResponse.status}`);
      console.log(`   Content-Type: ${exportResponse.headers.get('content-type')}`);
      console.log(`   Size: ${exportData.size} bytes`);

      if (exportResponse.ok) {
        console.log('✅ Export API working correctly');
      } else {
        console.log('❌ Export API returned error');
      }
    }

    console.log(`🎉 ${scenario.description} testing completed\n`);

  } catch (error) {
    console.error(`❌ Error testing ${scenario.description}:`, error);
  }
}

// Instructions for manual testing
export const TESTING_INSTRUCTIONS = `
🧪 ANALYTICS FEATURE TESTING INSTRUCTIONS

1. SETUP TEST DATA
   - Create test habits with different cadences
   - Add checkins over several days/weeks
   - Test with different completion patterns

2. TEST DIFFERENT USER TIERS
   - Free users: Should see upgrade prompts
   - Pro users: Should see basic analytics
   - Plus users: Should see advanced analytics + export

3. TEST ANALYTICS FEATURES
   - Line charts showing daily progress
   - Habit breakdown with completion rates
   - Trend analysis and consistency scores
   - Date range filtering (7d, 30d, custom)

4. TEST EXPORT FUNCTIONALITY (PLUS ONLY)
   - Export CSV with different date ranges
   - Verify CSV contains correct data
   - Test export with different habit filters

5. TEST EDGE CASES
   - No checkins in selected period
   - Single habit vs multiple habits
   - Different timezones
   - Very long date ranges

6. PERFORMANCE TESTING
   - Large datasets (100+ checkins)
   - Multiple habits with many checkins
   - Real-time updates after adding checkins

To run automated tests:
\`\`\`bash
npm run test:analytics
\`\`\`

To test manually:
1. Navigate to /app/analytics
2. Try different time periods
3. Check charts load correctly
4. Test export functionality (Plus only)
`;
