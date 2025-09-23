import { redirect } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements, getEntitlementLimits } from '@/lib/entitlements-server';

import { ProfileForm } from './profile-form';
import { BillingCard } from './billing-card';
import { ReminderPreferencesForm } from './reminder-preferences';

export default async function MePage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, username, timezone, emoji, bio, is_public, avatar_url, reminder_preferences')
    .eq('id', session.user.id)
    .maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let ensuredProfile: Record<string, any> | null = profile;

  // If there's an error, try selecting just the basic fields
  if (error) {
    const { data: basicProfile, error: basicError } = await supabase
      .from('profiles')
      .select('id, username, timezone, emoji')
      .eq('id', session.user.id)
      .single();

    if (basicError) {
      redirect('/app');
    }

    ensuredProfile = basicProfile;
  }

  if (!ensuredProfile) {
    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert({ id: session.user.id })
      .select('id, username, timezone, emoji')
      .single();

    if (insertError && insertError.code !== '23505') {
      redirect('/app');
    }

    if (!insertedProfile) {
      const { data: fallbackProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id, username, timezone, emoji')
        .eq('id', session.user.id)
        .maybeSingle();

      if (fetchError) {
        redirect('/app');
      }

      ensuredProfile = fallbackProfile;
    } else {
      ensuredProfile = insertedProfile;
    }
  }

  if (!ensuredProfile) {
    redirect('/app');
  }

  const rawEntitlements = await fetchUserEntitlements(session.user.id);
  const entitlements = rawEntitlements || {
    tier: 'free' as const,
    source: {},
    updatedAt: new Date().toISOString()
  };
  const limits = getEntitlementLimits(entitlements.tier);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and subscription.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <Card className="border-border/60 bg-background/95 shadow-sm">
          <CardHeader className="space-y-1">
            <CardTitle>Account basics</CardTitle>
            <CardDescription>
              Pick a handle, preferred timezone, and optional emoji flair.
            </CardDescription>
          </CardHeader>
          <Separator className="mx-6" />
          <CardContent className="pt-6">
            <ProfileForm profile={ensuredProfile} />
          </CardContent>
        </Card>

        <BillingCard
          entitlements={entitlements}
          limits={limits}
        />
      </div>

      <ReminderPreferencesForm 
        preferences={ensuredProfile?.reminder_preferences || {
          email_reminders_enabled: true,
          streak_reminders_enabled: true,
          reminder_frequency: 'daily',
          quiet_hours: {
            enabled: false,
            start: '22:00',
            end: '08:00'
          }
        }}
      />
    </div>
  );
}