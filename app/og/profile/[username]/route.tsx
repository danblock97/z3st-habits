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
          }}
        >
          <div
            style={{
              fontSize: '120px',
              marginBottom: '20px',
            }}
          >
            {profile.emoji || '👤'}
          </div>
          <div
            style={{
              fontSize: '48px',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '16px',
            }}
          >
            {profile.username}
          </div>
          {profile.bio && (
            <div
              style={{
                fontSize: '24px',
                color: '#64748b',
                marginBottom: '24px',
                maxWidth: '600px',
                lineHeight: '1.4',
              }}
            >
              {profile.bio}
            </div>
          )}
          <div
            style={{
              fontSize: '28px',
              color: '#475569',
              fontWeight: '500',
            }}
          >
            {habitCount} habit{habitCount !== 1 ? 's' : ''} tracked
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
