"use client";

import { useState } from "react";
import { Check, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

const FREE_FEATURES = [
  "Up to 3 habits",
  "Unlimited reminders",
  "1 group with up to 5 members",
  "Basic habit tracking",
  "Mobile responsive",
];

const PRO_FEATURES = [
  "Up to 15 habits",
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


export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async (monthlyPriceId: string, yearlyPriceId: string) => {
    setIsLoading(true);
    try {
      const priceId = isYearly ? yearlyPriceId : monthlyPriceId;

      // Get user ID from Supabase (client-side)
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        console.error('No user session found');
        return;
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          priceId,
          successUrl: `${window.location.origin}/app?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
          userId: session.user.id,
        }),
      });

      const { sessionId } = await response.json();

      if (sessionId) {
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
      }
    } catch (error) {
      console.error('Subscription error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPrice = (monthlyPrice: number, yearlyPrice?: number) => {
    if (isYearly && yearlyPrice) {
      return {
        amount: yearlyPrice,
        originalAmount: monthlyPrice,
        period: 'year',
        savings: Math.round((1 - yearlyPrice / (monthlyPrice * 12)) * 100),
      };
    }
    return {
      amount: monthlyPrice,
      period: 'month',
    };
  };

  const proPricing = getPrice(5, 50); // £5/month, £50/year
  const plusPricing = getPrice(15, 150); // £15/month, £150/year

  const yearlySavings = Math.round((1 - 50 / (5 * 12)) * 100); // Pro: £50 vs £60 (12*5)

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Choose Your Plan</h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8">
            Start free and upgrade as your habits grow
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isYearly ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              aria-label="Toggle yearly billing"
            />
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isYearly ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                Yearly
              </span>
              <Badge variant="secondary" className="text-xs">
                Save {yearlySavings}%
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Free</CardTitle>
              <CardDescription>Perfect for getting started</CardDescription>
              <div className="text-4xl font-bold">£0</div>
              <div className="text-sm text-muted-foreground">Forever free</div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {FREE_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button variant="outline" className="w-full" size="lg">
                Get Started Free
              </Button>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Pro</CardTitle>
              <CardDescription>Great for growing habits</CardDescription>
              <div className="space-y-2">
                <div className="text-4xl font-bold">
                  £{proPricing.amount}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{proPricing.period}
                  </span>
                </div>
                {proPricing.savings && (
                  <div className="text-sm text-green-600">
                    {proPricing.period === 'year'
                      ? `Save £${Math.round((proPricing.originalAmount! * 12 - proPricing.amount) * 100) / 100}/year`
                      : `Save £${(proPricing.originalAmount! - proPricing.amount).toFixed(2)}/month`
                    }
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {PRO_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                size="lg"
                onClick={() => handleSubscribe('price_pro_monthly', 'price_pro_yearly')}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Upgrade to Pro'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime • No setup fees
              </p>
            </CardContent>
          </Card>

          {/* Plus Plan */}
          <Card className="relative">
            <CardHeader className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Crown className="h-6 w-6 text-primary" />
                <CardTitle className="text-2xl">Plus</CardTitle>
              </div>
              <CardDescription>Perfect for unlimited habits</CardDescription>
              <div className="space-y-2">
                <div className="text-4xl font-bold">
                  £{plusPricing.amount}
                  <span className="text-lg font-normal text-muted-foreground">
                    /{plusPricing.period}
                  </span>
                </div>
                {plusPricing.savings && (
                  <div className="text-sm text-green-600">
                    {plusPricing.period === 'year'
                      ? `Save £${Math.round((plusPricing.originalAmount! * 12 - plusPricing.amount) * 100) / 100}/year`
                      : `Save £${(plusPricing.originalAmount! - plusPricing.amount).toFixed(2)}/month`
                    }
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {PLUS_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                size="lg"
                onClick={() => handleSubscribe('price_plus_monthly', 'price_plus_yearly')}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Upgrade to Plus'}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Cancel anytime • No setup fees
              </p>
            </CardContent>
          </Card>

        </div>

        {/* Stripe Climate */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 bg-green-600 rounded-sm flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span className="text-green-600 font-medium">Stripe Climate</span>
            </div>
            <span>•</span>
            <span>1% of revenue goes to carbon removal</span>
          </div>
        </div>

        <Separator className="my-16" />

        {/* FAQ Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-8">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I change plans anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens to my data if I downgrade?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Your data is always safe. If you exceed limits after downgrading, you'll need to reduce usage before creating new items.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer refunds?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes, we offer a 30-day money-back guarantee for all paid plans.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a discount for yearly billing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! Save 17% when you pay annually. That's 2 months free!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
