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
          background: 'linear-gradient(135deg, #fffdf6 0%, #fff2d6 100%)',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Header with app logo */}
        <div
          style={{
            position: 'absolute',
            top: '30px',
            left: '30px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #ffb400 0%, #e59600 100%)',
              borderRadius: '50%',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(255, 180, 0, 0.2)',
            }}
          >
            <span
              style={{
                fontSize: '1.2rem',
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              Z
            </span>
          </div>
          <span
            style={{
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#201000',
            }}
          >
            Z3st Habits
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '50px',
            borderRadius: '24px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
            border: '1px solid rgba(255, 180, 0, 0.1)',
            maxWidth: '850px',
            width: '100%',
            margin: '0 30px',
          }}
        >
          {/* Habit header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                fontSize: '70px',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))',
              }}
            >
              {habit.emoji || '🎯'}
            </div>
            <div>
              <div
                style={{
                  fontSize: '42px',
                  fontWeight: 'bold',
                  color: '#201000',
                  marginBottom: '6px',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                }}
              >
                {habit.title}
              </div>
              <div
                style={{
                  fontSize: '20px',
                  color: '#70531f',
                  fontWeight: '500',
                }}
              >
                by {profile.username}
              </div>
            </div>
          </div>

          {/* Stats with improved styling */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '40px',
              marginBottom: '30px',
            }}
          >
            <div
              style={{
                textAlign: 'center',
                padding: '20px 30px',
                background: 'linear-gradient(135deg, #fff2d6 0%, #ffe3aa 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 180, 0, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#ffb400',
                  marginBottom: '4px',
                }}
              >
                {currentStreak}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#70531f',
                  fontWeight: '500',
                }}
              >
                day{currentStreak !== 1 ? 's' : ''} streak
              </div>
            </div>

            <div
              style={{
                textAlign: 'center',
                padding: '20px 30px',
                background: 'linear-gradient(135deg, #f0ff9a 0%, #e8f573 100%)',
                borderRadius: '16px',
                border: '1px solid rgba(139, 198, 62, 0.2)',
              }}
            >
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#8bc63e',
                  marginBottom: '4px',
                }}
              >
                {habit.target_per_period}
              </div>
              <div
                style={{
                  fontSize: '16px',
                  color: '#4a5c2a',
                  fontWeight: '500',
                }}
              >
                target
              </div>
            </div>
          </div>

          {/* Sparkline with improved styling */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '20px',
              padding: '20px',
              background: 'rgba(255, 255, 255, 0.7)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 180, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '16px',
                color: '#70531f',
                minWidth: '80px',
                fontWeight: '500',
              }}
            >
              Last 7 days
            </div>
            <svg width={width} height={height} style={{ marginLeft: '12px' }}>
              <path
                d={pathData}
                fill="none"
                stroke="#ffb400"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="drop-shadow(0 2px 4px rgba(255, 180, 0, 0.2))"
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
                      r="4"
                      fill="#ffb400"
                      filter="drop-shadow(0 2px 4px rgba(255, 180, 0, 0.3))"
                    />
                  );
                }
                return null;
              })}
            </svg>
          </div>

          {/* Footer with app branding */}
          <div
            style={{
              marginTop: '20px',
              fontSize: '14px',
              color: '#c8ad7a',
              fontWeight: '500',
              letterSpacing: '0.5px',
            }}
          >
            Track your habits at z3st.app
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
