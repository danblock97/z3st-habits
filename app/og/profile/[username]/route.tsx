import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const supabase = await createServerClient();
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('username, emoji, bio')
    .eq('username', username)
    .single();

  if (error || !profile) {
    return new Response('Profile not found', { status: 404 });
  }

  const { data: habits } = await supabase
    .from('habits')
    .select('id')
    .eq('owner_id', (
      await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single()
    ).data?.id || '')
    .eq('is_archived', false);

  const habitCount = habits?.length || 0;

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
          {/* Profile avatar */}
          <div
            style={{
              fontSize: '140px',
              marginBottom: '30px',
              filter: 'drop-shadow(0 8px 16px rgba(0, 0, 0, 0.1))',
            }}
          >
            {profile.emoji || '👤'}
          </div>

          {/* Username */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: 'bold',
              color: '#201000',
              marginBottom: '20px',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            {profile.username}
          </div>

          {/* Bio */}
          {profile.bio && (
            <div
              style={{
                fontSize: '26px',
                color: '#70531f',
                marginBottom: '30px',
                maxWidth: '650px',
                lineHeight: '1.4',
                fontWeight: '500',
              }}
            >
              {profile.bio}
            </div>
          )}

          {/* Stats card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              padding: '25px 40px',
              background: 'linear-gradient(135deg, #fff2d6 0%, #ffe3aa 100%)',
              borderRadius: '20px',
              border: '1px solid rgba(255, 180, 0, 0.2)',
              boxShadow: '0 8px 25px rgba(255, 180, 0, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: '32px',
                fontWeight: 'bold',
                color: '#ffb400',
                marginRight: '8px',
              }}
            >
              {habitCount}
            </div>
            <div
              style={{
                fontSize: '20px',
                color: '#70531f',
                fontWeight: '500',
              }}
            >
              habit{habitCount !== 1 ? 's' : ''} tracked
            </div>
          </div>

          {/* Footer with app branding */}
          <div
            style={{
              marginTop: '30px',
              fontSize: '14px',
              color: '#c8ad7a',
              fontWeight: '500',
              letterSpacing: '0.5px',
            }}
          >
            Join {profile.username} at z3st.app
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
