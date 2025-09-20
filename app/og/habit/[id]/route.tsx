import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getLocalDateForTZ } from '@/lib/dates';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createServerClient();

  // Fetch habit
  const { data: habit, error } = await supabase
    .from('habits')
    .select('id, title, emoji, color, cadence, target_per_period, timezone, start_date, owner_id')
    .eq('id', id)
    .single();

  if (error || !habit) {
    return new Response('Habit not found', { status: 404 });
  }

  // Fetch owner profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, emoji')
    .eq('id', habit.owner_id)
    .single();

  if (!profile) {
    return new Response('Profile not found', { status: 404 });
  }

  // Get the last 7 days for sparkline
  const now = new Date();
  const today = getLocalDateForTZ(habit.timezone, now, 3);
  const sparklineData = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setUTCDate(date.getUTCDate() - i);
    const localDate = getLocalDateForTZ(habit.timezone, date, 3);

    const { data: checkins } = await supabase
      .from('checkins')
      .select('count')
      .eq('habit_id', id)
      .eq('user_id', profile.id)
      .eq('local_date', localDate);

    const count = checkins?.reduce((sum, c) => sum + c.count, 0) || 0;
    sparklineData.push(count);
  }

  // Calculate current streak
  const { data: allCheckins } = await supabase
    .from('checkins')
    .select('count, local_date')
    .eq('habit_id', id)
    .eq('user_id', profile.id)
    .order('local_date', { ascending: true });

  const entries = allCheckins?.map(c => ({ count: c.count, localDate: c.local_date })) || [];

  // Simple streak calculation for OG image
  let currentStreak = 0;
  let cursor = today;

  for (let i = 0; i < 30; i++) { // Check last 30 days
    const hasActivity = entries.some(entry => entry.localDate === cursor);
    if (hasActivity) {
      currentStreak++;
      const prevDate = new Date(cursor + 'T12:00:00');
      prevDate.setUTCDate(prevDate.getUTCDate() - 1);
      cursor = getLocalDateForTZ(habit.timezone, prevDate, 3);
    } else {
      break;
    }
  }

  // Calculate max value for sparkline scaling
  const maxValue = Math.max(...sparklineData, habit.target_per_period);

  // Generate sparkline path
  const width = 200;
  const height = 40;
  const points = sparklineData.map((value, index) => {
    const x = (index / 6) * width;
    const y = height - (value / maxValue) * height;
    return `${x},${y}`;
  });

  const pathData = `M ${points.join(' L ')}`;

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f8fafc',
          backgroundImage: 'radial-gradient(circle at 1px 1px, #e2e8f0 1px, transparent 0)',
          backgroundSize: '20px 20px',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '40px',
            borderRadius: '20px',
            backgroundColor: 'white',
            boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.1)',
            maxWidth: '800px',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '20px',
            }}
          >
            <div
              style={{
                fontSize: '60px',
              }}
            >
              {habit.emoji || '🎯'}
            </div>
            <div>
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#1e293b',
                  marginBottom: '4px',
                }}
              >
                {habit.title}
              </div>
              <div
                style={{
                  fontSize: '18px',
                  color: '#64748b',
                }}
              >
                by {profile.username}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#10b981',
                }}
              >
                {currentStreak}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                }}
              >
                day{currentStreak !== 1 ? 's' : ''} streak
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  color: '#3b82f6',
                }}
              >
                {habit.target_per_period}
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#64748b',
                }}
              >
                target
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                fontSize: '14px',
                color: '#64748b',
                minWidth: '40px',
              }}
            >
              Last 7 days
            </div>
            <svg width={width} height={height} style={{ marginLeft: '8px' }}>
              <path
                d={pathData}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {sparklineData.map((value, index) => {
                if (value > 0) {
                  const x = (index / 6) * width;
                  const y = height - (value / maxValue) * height - 3;
                  return (
                    <circle
                      key={index}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#3b82f6"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
