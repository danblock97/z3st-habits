'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

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

  try {
    // Fetch user entitlements from the database
    const { data: entitlements, error: entitlementsError } = await supabase
      .from('entitlements')
      .select('tier, source, updated_at')
      .eq('user_id', userId)
      .maybeSingle();

    if (entitlementsError) {
      console.error('Error fetching entitlements:', entitlementsError);
      return NextResponse.json(
        { error: 'Failed to fetch entitlements' },
        { status: 500 }
      );
    }

    // If no entitlements found, return default free tier
    const result = entitlements || {
      tier: 'free' as const,
      source: {},
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: {
        tier: result.tier,
        source: result.source,
        updatedAt: result.updated_at,
      }
    });
  } catch (error) {
    console.error('Entitlements API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
