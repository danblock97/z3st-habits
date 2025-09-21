"use client";

import { useState } from 'react';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Crown, CreditCard, AlertTriangle } from 'lucide-react';
import { formatLimit } from '@/lib/utils';

interface BillingCardProps {
  entitlements: { tier?: string; source?: Record<string, unknown>; [key: string]: unknown };
  limits: { maxActiveHabits: number; maxGroups: number; [key: string]: unknown };
}

export function BillingCard({ entitlements, limits }: BillingCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageBilling = async () => {
    setIsLoading(true);
    try {
      // For free tier users, go directly to pricing
      if (entitlements?.tier === 'free') {
        window.location.href = '/pricing';
        return;
      }

      // For paid users, try to open billing portal
      const response = await fetch('/api/billing/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/app/me`,
          customerId: entitlements?.source?.customerId,
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('Failed to get portal URL:', data.error);
        if (data.redirectTo) {
          window.location.href = data.redirectTo;
        } else {
          window.location.href = '/pricing';
        }
      }
    } catch (error) {
      console.error('Error opening billing portal:', error);
      window.location.href = '/pricing';
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-border/60 bg-background/95 shadow-sm">
      <CardHeader className="space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Billing & Subscription
            </CardTitle>
            <CardDescription>
              Manage your subscription and billing
            </CardDescription>
          </div>
          <Badge variant={entitlements?.tier === 'free' ? 'secondary' : 'default'} className="capitalize">
            {entitlements?.tier || 'Free'}
          </Badge>
        </div>
      </CardHeader>
      <Separator className="mx-6" />
      <CardContent className="pt-6 space-y-6">
        {/* Current plan info */}
        <div className="grid gap-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current Plan</span>
            <span className="font-medium capitalize">{entitlements?.tier || 'Free'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Habits</span>
            <span className="font-medium">{formatLimit(limits.maxActiveHabits)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Groups</span>
            <span className="font-medium">{formatLimit(limits.maxGroups)}</span>
          </div>
        </div>

        {/* Downgrade warning */}
        {entitlements?.tier === 'plus' && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertTitle>Downgrading Your Plan</AlertTitle>
            <AlertDescription className="text-orange-800">
              If you downgrade to Pro or Free, we&apos;ll automatically remove excess habits, groups, and group members to fit your new plan limits.
              <br /><br />
              <strong>Oldest items will be removed first.</strong> We recommend reviewing your content before downgrading.
            </AlertDescription>
          </Alert>
        )}

        {/* Billing actions */}
        <div className="space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={handleManageBilling}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Loading...
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {entitlements?.tier === 'free' ? 'Upgrade Plan' : 'Manage Billing & Subscription'}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
