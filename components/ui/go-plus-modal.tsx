"use client";

import { useState } from "react";
import { Check, Crown, Sparkles, X, Trash2, Users, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

type PlanType = 'pro' | 'plus';

interface GoPlusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  onUpgrade?: () => void;
  targetPlan?: PlanType;
}

// Downgrade modal props
interface DowngradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentTier: string;
  targetTier: 'free' | 'pro' | 'plus';
  onConfirmDowngrade?: () => void;
}

const PRO_FEATURES = [
  "Up to 15 habits (vs 3 on free)",
  "Unlimited reminders",
  "Up to 3 groups with up to 15 members each",
  "Advanced habit analytics",
  "Priority support",
  "Custom habit categories",
  "Export data",
];

const PLUS_FEATURES = [
  "Unlimited habits",
  "Unlimited reminders",
  "Unlimited groups with unlimited members",
  "Everything in Pro",
  "Advanced team features",
  "Dedicated support",
  "Custom integrations",
  "SLA guarantee",
];

export function GoPlusModal({ open, onOpenChange, feature, onUpgrade, targetPlan = 'pro' }: GoPlusModalProps) {
  const isPro = targetPlan === 'pro';
  const features = isPro ? PRO_FEATURES : PLUS_FEATURES;
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      if (onUpgrade) {
        await onUpgrade();
      } else {
        // Navigate to pricing page
        window.location.href = '/pricing';
      }
    } catch (error) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFeatureSpecificMessage = () => {
    if (!feature) return null;

    const planName = isPro ? 'Pro' : 'Plus';

    switch (feature) {
      case 'habit':
        return `You've reached your habit limit. Upgrade to ${planName} to unlock more habits and advanced features!`;
      case 'reminder':
        return `Upgrade to ${planName} to unlock advanced reminder features and priority support!`;
      case 'group':
        return `You've reached your group limit. Upgrade to ${planName} to unlock multiple groups and larger member limits!`;
      default:
        return `Unlock your full potential with Z3st ${planName}!`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">
            Upgrade to {isPro ? 'Pro' : 'Plus'}
          </DialogTitle>
          <DialogDescription className="text-base">
            {getFeatureSpecificMessage() || `Unlock more habits and advanced features with Z3st ${isPro ? 'Pro' : 'Plus'}!`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-600">
                {isPro ? 'Pro' : 'Plus'} Features
              </span>
            </div>
            <ul className="space-y-2">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 text-center">
            <div className="text-3xl font-bold">
              £{isPro ? '5' : '15'}
              <span className="text-lg font-normal text-muted-foreground">/month</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Cancel anytime. No setup fees.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              onClick={handleUpgrade}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600"
              size="lg"
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <Crown className="mr-2 h-4 w-4" />
                  Upgrade to {isPro ? 'Pro' : 'Plus'}
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = '/pricing'}
              disabled={isLoading}
            >
              View All Plans
            </Button>

            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              size="sm"
            >
              Maybe Later
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By upgrading, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Downgrade protection modal
export function DowngradeModal({
  open,
  onOpenChange,
  currentTier,
  targetTier,
  onConfirmDowngrade
}: DowngradeModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmDowngrade = async () => {
    setIsProcessing(true);
    try {
      if (onConfirmDowngrade) {
        await onConfirmDowngrade();
      } else {
        // Default behavior - redirect to billing management
        window.location.href = '/app/me/billing';
      }
    } catch (error) {
      console.error('Downgrade error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getTierLimits = (tier: string) => {
    switch (tier) {
      case 'free':
        return { habits: 5, groups: 1, members: 5 };
      case 'pro':
        return { habits: 15, groups: 3, members: 15 };
      case 'plus':
        return { habits: -1, groups: -1, members: -1 };
      default:
        return { habits: 3, groups: 1, members: 5 };
    }
  };

  const currentLimits = getTierLimits(currentTier);
  const targetLimits = getTierLimits(targetTier);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'free': return 'bg-gray-100 text-gray-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'plus': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Downgrade to {targetTier.charAt(0).toUpperCase() + targetTier.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Before downgrading from {currentTier} to {targetTier}, you need to reduce your usage to fit within the new limits.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current vs Target Comparison */}
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className={getTierColor(currentTier)}>
                    {currentTier.toUpperCase()}
                  </Badge>
                  Current Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Habits</span>
                  <span>{currentLimits.habits === -1 ? 'Unlimited' : currentLimits.habits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Groups</span>
                  <span>{currentLimits.groups === -1 ? 'Unlimited' : currentLimits.groups}</span>
                </div>
                <div className="flex justify-between">
                  <span>Members per group</span>
                  <span>{currentLimits.members === -1 ? 'Unlimited' : currentLimits.members}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className={getTierColor(targetTier)}>
                    {targetTier.toUpperCase()}
                  </Badge>
                  Target Plan
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Habits</span>
                  <span>{targetLimits.habits === -1 ? 'Unlimited' : targetLimits.habits}</span>
                </div>
                <div className="flex justify-between">
                  <span>Groups</span>
                  <span>{targetLimits.groups === -1 ? 'Unlimited' : targetLimits.groups}</span>
                </div>
                <div className="flex justify-between">
                  <span>Members per group</span>
                  <span>{targetLimits.members === -1 ? 'Unlimited' : targetLimits.members}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Action Items */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Actions Required</h3>

            {/* Habits Section */}
            {currentLimits.habits !== -1 && targetLimits.habits !== -1 && currentLimits.habits > targetLimits.habits && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Reduce Habits</span>
                    <Badge variant="destructive">
                      {currentLimits.habits - targetLimits.habits} habits need to be deleted
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You currently have {currentLimits.habits} habits, but {targetTier} allows only {targetLimits.habits} habits.
                  </p>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Manage Habits
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Groups Section */}
            {currentLimits.groups !== -1 && targetLimits.groups !== -1 && currentLimits.groups > targetLimits.groups && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Reduce Groups</span>
                    <Badge variant="destructive">
                      {currentLimits.groups - targetLimits.groups} groups need to be deleted
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    You currently have {currentLimits.groups} groups, but {targetTier} allows only {targetLimits.groups} groups.
                  </p>
                  <Button variant="outline" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Manage Groups
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Members Section */}
            {currentLimits.members !== -1 && targetLimits.members !== -1 && currentLimits.members > targetLimits.members && (
              <Card className="border-orange-200 bg-orange-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Reduce Group Members</span>
                    <Badge variant="destructive">
                      Some groups have too many members
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    {targetTier} allows only {targetLimits.members} members per group. Remove members from groups that exceed this limit.
                  </p>
                  <Button variant="outline" size="sm">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Members
                  </Button>
                </CardContent>
              </Card>
            )}

            {currentLimits.habits === targetLimits.habits &&
             currentLimits.groups === targetLimits.groups &&
             currentLimits.members === targetLimits.members && (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-800">Ready to Downgrade</span>
                  </div>
                  <p className="text-sm text-green-700 mt-2">
                    Your usage is within {targetTier} limits. You can safely downgrade now.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmDowngrade}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? 'Processing...' : 'Continue to Downgrade'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
