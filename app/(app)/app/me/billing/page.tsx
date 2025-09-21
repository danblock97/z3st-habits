import { redirect } from 'next/navigation';
import { CreditCard, Crown, ExternalLink, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { createServerClient } from '@/lib/supabase/server';
import { fetchUserEntitlements, getEntitlementLimits, getUserUsage, canDowngradeToTier } from '@/lib/entitlements-server';
import { formatLimit } from '@/lib/utils';
import { getCurrentUsage, checkDowngradeRequirements } from '../actions';
import { DowngradeModal } from '@/components/ui/go-plus-modal';

export default async function BillingPage() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userId = session.user.id;
  const entitlements = await fetchUserEntitlements(userId);

  if (!entitlements) {
    redirect('/app');
  }

  const limits = getEntitlementLimits(entitlements.tier);

  // Get current usage for downgrade protection
  const usageData = await getCurrentUsage();
  const freeRequirements = await checkDowngradeRequirements('free');
  const proRequirements = await checkDowngradeRequirements('pro');

  const handleManageBilling = async () => {
    'use server';

    // Get the current user's Stripe customer ID from entitlements
    const supabase = await createServerClient();
    const { data: entitlements } = await supabase
      .from('entitlements')
      .select('source')
      .eq('user_id', userId)
      .maybeSingle();

    const customerId = entitlements?.source?.customerId as string;

    if (customerId) {
      // Call the portal API and redirect
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/billing/portal`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            returnUrl: '/app/me',
            customerId: customerId,
          }),
        });

        const { url, error } = await response.json();

        if (url) {
          redirect(url);
        } else {
          console.error('Failed to get portal URL:', error);
          redirect('/pricing');
        }
      } catch (error) {
        console.error('Error creating portal session:', error);
        redirect('/pricing');
      }
    } else {
      // If no customer ID, redirect to pricing to upgrade
      redirect('/pricing');
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing & Subscription</h1>
        <p className="text-muted-foreground">
          Manage your subscription and view your current plan details.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Crown className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="capitalize">
                    {entitlements.tier} Plan
                  </CardTitle>
                  <CardDescription>
                    {entitlements.tier === 'free' ? 'No subscription required' : 'Active subscription'}
                  </CardDescription>
                </div>
              </div>
              <Badge variant={entitlements.tier === 'free' ? 'secondary' : 'default'}>
                {entitlements.tier === 'free' ? 'Free' : 'Active'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Habits Limit</span>
                <span className="text-sm font-medium">
                  {formatLimit(limits.maxActiveHabits)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Reminders Limit</span>
                <span className="text-sm font-medium">
                  {formatLimit(limits.maxReminders)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Groups Limit</span>
                <span className="text-sm font-medium">
                  {formatLimit(limits.maxGroups)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Group Members</span>
                <span className="text-sm font-medium">
                  {formatLimit(limits.maxGroupMembers)} per group
                </span>
              </div>
            </div>

            <Separator />

            <div className="flex flex-col gap-3">
              {entitlements.tier === 'free' || entitlements.tier === 'pro' ? (
                <Button className="w-full" size="lg">
                  <Crown className="mr-2 h-4 w-4" />
                  {entitlements.tier === 'free' ? 'Upgrade to Pro' : 'Upgrade to Plus'}
                </Button>
              ) : (
                <form action={handleManageBilling}>
                  <Button variant="outline" className="w-full" size="lg">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Billing
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </form>
              )}

              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  Need help? Contact our support team.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Usage Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Usage Overview</CardTitle>
            <CardDescription>
              Your current usage across all features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Usage tracking coming soon...
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        {entitlements.tier !== 'free' && (
          <Card>
            <CardHeader>
              <CardTitle>Billing History</CardTitle>
              <CardDescription>
                View your past invoices and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <CreditCard className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-4">
                  Billing history available in Stripe Customer Portal
                </p>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View in Portal
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Downgrade Protection */}
        {entitlements.tier === 'plus' && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Downgrade Protection</CardTitle>
                <CardDescription>
                  Before downgrading, you need to reduce your usage to fit within the target plan limits
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Downgrade to Pro</div>
                      <div className="text-sm text-muted-foreground">15 habits, 3 groups, 15 members per group</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {proRequirements?.canDowngrade ? (
                        <>
                          <Badge variant="secondary" className="text-green-600">Ready</Badge>
                          <Button size="sm">Continue</Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive">
                            {proRequirements?.issues.habits.needsReduction || 0 +
                             proRequirements?.issues.groups.needsReduction || 0 +
                             proRequirements?.issues.groupMembers.length || 0} items to reduce
                          </Badge>
                          <Button size="sm" variant="outline">Manage</Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">Downgrade to Free</div>
                      <div className="text-sm text-muted-foreground">5 habits, 1 group, 5 members</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {freeRequirements?.canDowngrade ? (
                        <>
                          <Badge variant="secondary" className="text-green-600">Ready</Badge>
                          <Button size="sm">Continue</Button>
                        </>
                      ) : (
                        <>
                          <Badge variant="destructive">
                            {freeRequirements?.issues.habits.needsReduction || 0 +
                             freeRequirements?.issues.groups.needsReduction || 0 +
                             freeRequirements?.issues.groupMembers.length || 0} items to reduce
                          </Badge>
                          <Button size="sm" variant="outline">Manage</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Downgrade Modal */}
      <DowngradeModal
        open={false} // This will be controlled by state
        onOpenChange={() => {}} // This will be controlled by state
        currentTier={entitlements.tier}
        targetTier="pro"
        onConfirmDowngrade={() => {
          // This would redirect to Stripe cancel page
          window.location.href = '/api/billing/portal';
        }}
      />
    </div>
  );
}
