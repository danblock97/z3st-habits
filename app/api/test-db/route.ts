import { NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('Testing database connection with service role...');

    const supabase = createServiceRoleClient();

    // Test basic connection
    const { data, error } = await supabase
      .from('entitlements')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error);
      return NextResponse.json({
        error: 'Database connection failed',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    // Test updating an existing record instead of inserting
    // First, let's try to find if there's an existing user with entitlements
    const { data: existing, error: selectError } = await supabase
      .from('entitlements')
      .select('user_id')
      .limit(1)
      .maybeSingle();

    if (selectError) {
      console.error('Select error:', selectError);
      return NextResponse.json({
        error: 'Select failed',
        details: selectError.message,
        code: selectError.code
      }, { status: 500 });
    }

    if (!existing) {
      return NextResponse.json({
        success: true,
        message: 'Service role working - no existing entitlements to test with'
      });
    }

    // Update the existing record
    const { error: updateError } = await supabase
      .from('entitlements')
      .update({
        tier: 'pro',
        source: { test: true, updated: new Date().toISOString() },
        updated_at: new Date().toISOString()
      })
      .eq('user_id', existing.user_id);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json({
        error: 'Update failed',
        details: updateError.message,
        code: updateError.code
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service role database access working correctly'
    });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
