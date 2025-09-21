import { NextRequest, NextResponse } from 'next/server';
import { updateUserEntitlements } from '@/lib/entitlements-server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, tier } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing userId or tier' },
        { status: 400 }
      );
    }

    // Add some debugging
    console.log('=== SIMULATING WEBHOOK PROCESSING ===');
    console.log(`User ID: ${userId}`);
    console.log(`Tier: ${tier}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

    // Check if user exists in auth.users
    const supabase = createServiceRoleClient();
    const { data: userExists, error: userError } = await supabase.auth.admin.getUserById(userId);

    console.log('User exists check:', {
      userExists: !!userExists,
      error: userError,
      userId: userId
    });

    if (userError) {
      if (userError.code === 'user_not_found') {
        console.log('❌ User does not exist in auth.users table');
        return NextResponse.json(
          {
            error: 'User does not exist in auth.users',
            userId,
            suggestion: 'User must exist in auth.users before creating entitlements'
          },
          { status: 400 }
        );
      } else {
        console.log('❌ Auth error:', userError);
        return NextResponse.json(
          { error: 'Auth error', userId, userError },
          { status: 400 }
        );
      }
    }

    // User exists, try to update entitlements
    console.log('✅ User exists, attempting to update entitlements...');
    const success = await updateUserEntitlements(userId, tier, {
      test: true,
      source: 'webhook_simulation'
    }, true);

    if (success) {
      return NextResponse.json({
        success: true,
        message: `Successfully updated entitlements for user ${userId} to tier ${tier}`,
        userId,
        tier
      });
    } else {
      console.log('❌ Entitlements update failed - checking if user has existing entitlements...');

      // Check if user has existing entitlements
      const { data: existingEntitlements } = await supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Existing entitlements:', existingEntitlements);

      return NextResponse.json(
        {
          error: 'Failed to update entitlements',
          userId,
          existingEntitlements
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Webhook simulation error:', error);
    return NextResponse.json(
      { error: 'Simulation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
