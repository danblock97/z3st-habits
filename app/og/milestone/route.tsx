import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const title = searchParams.get('title') || 'Milestone Unlocked!';
    const description = searchParams.get('description') || 'A new achievement';
    const emoji = searchParams.get('emoji') || '🏆';
    const rarity = searchParams.get('rarity') || 'common';
    const value = searchParams.get('value');

    // Rarity-based gradients
    const rarityGradients = {
      common: {
        from: '#9ca3af',
        to: '#4b5563',
        light: 'rgba(156, 163, 175, 0.2)',
      },
      rare: {
        from: '#60a5fa',
        to: '#2563eb',
        light: 'rgba(96, 165, 250, 0.2)',
      },
      epic: {
        from: '#a78bfa',
        to: '#7c3aed',
        light: 'rgba(167, 139, 250, 0.2)',
      },
      legendary: {
        from: '#fbbf24',
        to: '#f59e0b',
        light: 'rgba(251, 191, 36, 0.3)',
      },
    };

    const gradient = rarityGradients[rarity as keyof typeof rarityGradients] || rarityGradients.common;

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
            background: 'linear-gradient(135deg, #0a0e1a 0%, #1a1f35 100%)',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            position: 'relative',
          }}
        >
          {/* Decorative circles */}
          <div
            style={{
              position: 'absolute',
              top: '-100px',
              right: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: gradient.light,
              filter: 'blur(80px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-100px',
              left: '-100px',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: gradient.light,
              filter: 'blur(80px)',
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              maxWidth: '85%',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {/* Rarity badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0.5rem 1.5rem',
                borderRadius: '9999px',
                background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                color: 'white',
                fontSize: '0.875rem',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                marginBottom: '2rem',
                boxShadow: `0 10px 30px ${gradient.light}`,
              }}
            >
              {rarity}
            </div>

            {/* Emoji with glow effect */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '180px',
                height: '180px',
                borderRadius: '50%',
                background: `radial-gradient(circle, ${gradient.light} 0%, transparent 70%)`,
                marginBottom: '2rem',
              }}
            >
              <span
                style={{
                  fontSize: '7rem',
                  filter: 'drop-shadow(0 0 20px rgba(255, 255, 255, 0.3))',
                }}
              >
                {emoji}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontSize: '4rem',
                fontWeight: 'bold',
                color: 'white',
                margin: '0 0 1.5rem 0',
                lineHeight: '1.1',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
                maxWidth: '800px',
              }}
            >
              {title}
            </h1>

            {/* Description */}
            <p
              style={{
                fontSize: '1.5rem',
                color: '#94a3b8',
                margin: '0 0 2rem 0',
                lineHeight: '1.4',
                maxWidth: '700px',
              }}
            >
              {description}
            </p>

            {/* Value display */}
            {value && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: '0.75rem',
                  marginBottom: '2rem',
                }}
              >
                <span
                  style={{
                    fontSize: '5rem',
                    fontWeight: 'bold',
                    background: `linear-gradient(135deg, ${gradient.from} 0%, ${gradient.to} 100%)`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    color: 'transparent',
                  }}
                >
                  {value}
                </span>
                <span
                  style={{
                    fontSize: '1.5rem',
                    color: '#64748b',
                  }}
                >
                  days
                </span>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                marginTop: '3rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #ffb400 0%, #e59600 100%)',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '1.25rem',
                }}
              >
                Z
              </div>
              <span
                style={{
                  fontSize: '1.25rem',
                  color: '#94a3b8',
                  fontWeight: '500',
                }}
              >
                z3st.app
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
