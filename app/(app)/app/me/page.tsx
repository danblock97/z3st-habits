import { redirect } from 'next/navigation';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, CreditCard } from 'lucide-react';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements, getEntitlementLimits, formatLimit, getUserUsage, canDowngradeToTier } from '@/lib/entitlements-server';
import { getCurrentUsage, checkDowngradeRequirements } from './actions';

import { ProfileForm } from './profile-form';
import { DowngradeModal } from '@/components/ui/go-plus-modal';

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
    .select('id, username, timezone, emoji, bio, is_public')
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

  const entitlements = await fetchUserEntitlements(session.user.id);
  const limits = entitlements ? getEntitlementLimits(entitlements.tier) : getEntitlementLimits('free');

  // Get current usage for downgrade protection
  const usageData = await getCurrentUsage();
  const freeRequirements = await checkDowngradeRequirements('free');
  const proRequirements = await checkDowngradeRequirements('pro');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Your profile</h1>
        <p className="text-muted-foreground">
          Tailor how your identity shows up across Z3st. We auto-detected your timezone, but you can update it anytime.
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

        <Card className="border-border/60 bg-background/95 shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-primary" />
                  Subscription
                </CardTitle>
                <CardDescription>
                  Current plan and usage limits
                </CardDescription>
              </div>
              <Badge variant={entitlements?.tier === 'free' ? 'secondary' : 'default'} className="capitalize">
                {entitlements?.tier || 'Free'}
              </Badge>
            </div>
          </CardHeader>
          <Separator className="mx-6" />
          <CardContent className="pt-6 space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Habits</span>
                <span className="font-medium">
                  {formatLimit(limits.maxActiveHabits)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reminders</span>
                <span className="font-medium">
                  {formatLimit(limits.maxReminders)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Groups</span>
                <span className="font-medium">
                  {formatLimit(limits.maxGroups)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <CreditCard className="mr-2 h-4 w-4" />
                Manage Billing
              </Button>
              {(entitlements?.tier === 'free' || entitlements?.tier === 'pro') && (
                <Button size="sm" className="flex-1">
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downgrade Protection */}
      {entitlements?.tier === 'plus' && (
        <div className="grid gap-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Downgrade Protection</h2>
            <p className="text-muted-foreground">
              Before downgrading, reduce your usage to fit within the target plan limits.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Downgrade to Pro</CardTitle>
              <CardDescription>
                Check if you can downgrade to the Pro plan (15 habits, 3 groups, 15 members per group)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {proRequirements ? (
                <div className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Habits</span>
                      <span className="font-medium">
                        {usageData?.usage.habits || 0} / 15
                        {proRequirements.issues.habits.needsReduction > 0 && (
                          <span className="text-destructive ml-2">
                            (-{proRequirements.issues.habits.needsReduction})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Groups</span>
                      <span className="font-medium">
                        {usageData?.usage.groups || 0} / 3
                        {proRequirements.issues.groups.needsReduction > 0 && (
                          <span className="text-destructive ml-2">
                            (-{proRequirements.issues.groups.needsReduction})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Groups over member limit</span>
                      <span className="font-medium">
                        {proRequirements.issues.groupMembers.length}
                      </span>
                    </div>
                  </div>

                  {proRequirements.canDowngrade ? (
                    <div className="text-center py-4">
                      <div className="text-green-600 font-medium mb-2">✅ Ready to downgrade to Pro</div>
                      <Button>Continue to Downgrade</Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-orange-600 font-medium mb-2">
                        ⚠️ Reduce usage before downgrading
                      </div>
                      <Button variant="outline">Manage Resources</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading downgrade requirements...
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Downgrade to Free</CardTitle>
              <CardDescription>
                Check if you can downgrade to the Free plan (5 habits, 1 group, 5 members)
              </CardDescription>
            </CardHeader>
            <CardContent>
              {freeRequirements ? (
                <div className="space-y-4">
                  <div className="grid gap-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Habits</span>
                      <span className="font-medium">
                        {usageData?.usage.habits || 0} / 5
                        {freeRequirements.issues.habits.needsReduction > 0 && (
                          <span className="text-destructive ml-2">
                            (-{freeRequirements.issues.habits.needsReduction})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Groups</span>
                      <span className="font-medium">
                        {usageData?.usage.groups || 0} / 1
                        {freeRequirements.issues.groups.needsReduction > 0 && (
                          <span className="text-destructive ml-2">
                            (-{freeRequirements.issues.groups.needsReduction})
                          </span>
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Groups over member limit</span>
                      <span className="font-medium">
                        {freeRequirements.issues.groupMembers.length}
                      </span>
                    </div>
                  </div>

                  {freeRequirements.canDowngrade ? (
                    <div className="text-center py-4">
                      <div className="text-green-600 font-medium mb-2">✅ Ready to downgrade to Free</div>
                      <Button>Continue to Downgrade</Button>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <div className="text-orange-600 font-medium mb-2">
                        ⚠️ Reduce usage before downgrading
                      </div>
                      <Button variant="outline">Manage Resources</Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Loading downgrade requirements...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Downgrade Modal */}
      <DowngradeModal
        open={false} // This will be controlled by state
        onOpenChange={() => {}} // This will be controlled by state
        currentTier={entitlements?.tier || 'plus'}
        targetTier="pro"
        onConfirmDowngrade={() => {
          // Redirect to billing management or Stripe
          window.location.href = '/app/me/billing';
        }}
      />
    </div>
  );
}
