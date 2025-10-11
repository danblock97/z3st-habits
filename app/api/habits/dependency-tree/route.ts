import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { getUserDependencyTree } from '@/lib/habit-dependencies';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const tree = await getUserDependencyTree(supabase, userId);

    return NextResponse.json({ success: true, tree });
  } catch (error) {
    console.error('Error fetching dependency tree:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
