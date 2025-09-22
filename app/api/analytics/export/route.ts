'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements } from '@/lib/entitlements-server';

export async function GET(request: NextRequest) {
  const supabase = await createServerClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const userId = session.user.id;

  // Check entitlements - only Plus users can export
  const entitlements = await fetchUserEntitlements(userId);
  if (!entitlements || entitlements.tier !== 'plus') {
    return NextResponse.json(
      { error: 'CSV export requires Plus subscription' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  if (!dateFrom || !dateTo) {
    return NextResponse.json(
      { error: 'Date range is required for export' },
      { status: 400 }
    );
  }

  const startDate = new Date(dateFrom);
  const endDate = new Date(dateTo);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid date format' },
      { status: 400 }
    );
  }

  try {
    const { data: checkins, error: checkinsError } = await supabase
      .from('checkins')
      .select(`
        local_date,
        count,
        habits(id, title, emoji, cadence, target_per_period)
      `)
      .eq('user_id', userId)
      .gte('local_date', startDate.toISOString().split('T')[0])
      .lte('local_date', endDate.toISOString().split('T')[0])
      .order('local_date', { ascending: true })
      .order('habits(title)', { ascending: true });

    if (checkinsError) {
      console.error('Error fetching checkins for export:', checkinsError);
      return NextResponse.json(
        { error: 'Failed to fetch export data' },
        { status: 500 }
      );
    }

    // Generate CSV content
    const csvContent = generateCSV(checkins || []);

    // Return CSV file
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="habits-export-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.csv"`,
      },
    });
  } catch (error) {
    console.error('Export API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(
  checkins: Array<{
    local_date: string;
    count: number;
    habits: {
      id: string;
      title: string;
      emoji: string | null;
      cadence: string;
      target_per_period: number;
    } | {
      id: string;
      title: string;
      emoji: string | null;
      cadence: string;
      target_per_period: number;
    }[];
  }>
): string {
  const headers = ['Date', 'Habit', 'Emoji', 'Cadence', 'Target per Period', 'Count'];

  const rows = checkins.map((checkin) => {
    // Handle both object and array cases for habits
    const habits = Array.isArray(checkin.habits) ? checkin.habits[0] : checkin.habits;

    return [
      checkin.local_date,
      habits.title,
      habits.emoji || '🍋',
      habits.cadence,
      habits.target_per_period.toString(),
      checkin.count.toString(),
    ];
  });

  const csvRows = [headers, ...rows];

  return csvRows
    .map((row) =>
      row
        .map((field) => {
          // Escape fields containing commas, quotes, or newlines
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        })
        .join(',')
    )
    .join('\n');
}
