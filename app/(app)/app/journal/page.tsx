import { redirect } from 'next/navigation';

import { createServerClient } from '@/lib/supabase/server';

import { JournalClient } from './journal-client';
import type { JournalEntry } from './types';

export default async function JournalPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get user profile for timezone
  const { data: profile } = await supabase
    .from('profiles')
    .select('timezone')
    .eq('id', userId)
    .maybeSingle();

  const timezone = profile?.timezone ?? 'UTC';

  // Get all check-ins with notes or photos, joined with habit data
  const { data: checkinsData, error: checkinsError } = await supabase
    .from('checkins')
    .select(`
      id,
      habit_id,
      user_id,
      local_date,
      count,
      note,
      photo_url,
      created_at,
      habit:habits(id, title, emoji, cadence)
    `)
    .eq('user_id', userId)
    .order('local_date', { ascending: false })
    .limit(100);

  if (checkinsError || !checkinsData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Failed to load journal entries. Please try again.</p>
      </div>
    );
  }

  // Transform to JournalEntry format
  const entries: JournalEntry[] = checkinsData
    .filter((checkin) => checkin.habit)
    .map((checkin) => ({
      id: checkin.id,
      habitId: checkin.habit_id,
      habitTitle: (checkin.habit as any).title,
      habitEmoji: (checkin.habit as any).emoji,
      localDate: checkin.local_date,
      count: checkin.count,
      note: checkin.note,
      photoUrl: checkin.photo_url,
      createdAt: checkin.created_at,
    }));

  return <JournalClient entries={entries} timezone={timezone} />;
}
