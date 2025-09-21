"use client";

import { useState } from "react";
import { Check, Crown, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface GoPlusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feature?: string;
  onUpgrade?: () => void;
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

export function GoPlusModal({ open, onOpenChange, feature, onUpgrade }: GoPlusModalProps) {
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

    switch (feature) {
      case 'habit':
        return "You've reached your habit limit. Upgrade to unlock more habits and advanced features!";
      case 'reminder':
        return "Upgrade to unlock advanced reminder features and priority support!";
      case 'group':
        return "You've reached your group limit. Upgrade to unlock multiple groups and larger member limits!";
      default:
        return "Unlock your full potential with Z3st Plus!";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-yellow-500">
            <Crown className="h-6 w-6 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold">Upgrade to Pro</DialogTitle>
          <DialogDescription className="text-base">
            {getFeatureSpecificMessage() || "Unlock more habits and advanced features with Z3st Pro!"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-orange-600" />
              <span className="font-medium text-orange-600">Pro Features</span>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((feature, index) => (
                <li key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col gap-2 text-center">
            <div className="text-3xl font-bold">
              £5<span className="text-lg font-normal text-muted-foreground">/month</span>
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
                  Upgrade to Pro
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
