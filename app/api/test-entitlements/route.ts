import { NextRequest, NextResponse } from 'next/server';
import { updateUserEntitlements, fetchUserEntitlementsServiceRole } from '@/lib/entitlements-server';
import { createServerClient, createServiceRoleClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, tier, customerId } = await request.json();

    if (!userId || !tier) {
      return NextResponse.json(
        { error: 'Missing userId or tier' },
        { status: 400 }
      );
    }

    // First, check if the user exists in auth.users
    const supabase = createServiceRoleClient();
    const { data: userExists, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError && userError.code !== 'user_not_found') {
      return NextResponse.json(
        { error: 'Auth error', userId, userError },
        { status: 400 }
      );
    }

    if (userError && userError.code === 'user_not_found') {
      // User does not exist in auth.users table - this is expected for test UUIDs
    }

    // Test with service role
    const source = customerId
      ? { customerId, subscriptionId: "sub_1S9qPXCyXEVsMkWU1I0Rsq5G" }
      : { test: true };
    const success = await updateUserEntitlements(userId, tier, source, true);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to update entitlements with service role' },
        { status: 500 }
      );
    }

    // Fetch and return the updated entitlements
    const entitlements = await fetchUserEntitlementsServiceRole(userId);

    return NextResponse.json({
      success: true,
      message: `Successfully updated user ${userId} to tier ${tier}`,
      entitlements
    });

  } catch (error) {
    console.error('Test entitlements error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current authenticated user
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'No authenticated user' },
        { status: 401 }
      );
    }

    const entitlements = await fetchUserEntitlementsServiceRole(user.id);

    // Also get some test user IDs from profiles table for testing
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id')
      .limit(3);

    return NextResponse.json({
      currentUserId: user.id,
      currentEntitlements: entitlements,
      testUserIds: profiles?.map(p => p.id) || []
    });

  } catch (error) {
    console.error('Get entitlements error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch entitlements' },
      { status: 500 }
    );
  }
}
