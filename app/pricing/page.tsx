"use client";

import { useState, useEffect } from "react";
import { Check, Crown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [currentTier, setCurrentTier] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserTier = async () => {
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) return;

        const response = await fetch('/api/test-entitlements');
        const data = await response.json();
        setCurrentTier(data.currentEntitlements?.tier || 'free');
      } catch (error) {
        console.error('Error fetching user tier:', error);
        setCurrentTier('free');
      }
    };

    // Check for plan parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const planParam = urlParams.get('plan');
    if (planParam) {
      setSelectedPlan(planParam);
    }

    fetchUserTier();
  }, []);

  const renderPlanButton = (targetTier: string, planType: string) => {
    // Determine button text based on target tier and current tier
    let buttonText = 'Get Started';
    let isDisabled = false;
    let buttonVariant: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link" = 'default';
    let buttonClass = `w-full ${targetTier === 'pro'
      ? 'bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'
      : 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600'
    }`;

    // If user is not signed in (currentTier is null), show get started options
    if (currentTier === null) {
      if (targetTier === 'pro') {
        buttonText = 'Create Account & Start Pro';
        buttonVariant = 'default';
      } else if (targetTier === 'plus') {
        buttonText = 'Create Account & Start Plus';
        buttonVariant = 'default';
      } else {
        buttonText = 'Get Started Free';
        buttonVariant = 'outline';
      }
    } else if (currentTier === targetTier) {
      buttonText = 'Current Plan';
      isDisabled = true;
      buttonVariant = 'outline';
      buttonClass = 'w-full';
    } else if (targetTier === 'pro') {
      if (currentTier === 'free') {
        buttonText = 'Upgrade to Pro';
        buttonVariant = 'default';
      } else {
        buttonText = 'Downgrade to Pro';
        isDisabled = true;
        buttonVariant = 'outline';
        buttonClass = 'w-full';
      }
    } else if (targetTier === 'plus') {
      if (currentTier === 'pro') {
        // If user is on Pro, don't allow direct upgrade to Plus from pricing page
        buttonText = 'Upgrade to Plus';
        isDisabled = true;
        buttonVariant = 'outline';
        buttonClass = 'w-full';
      } else {
        buttonText = 'Upgrade to Plus';
        buttonVariant = 'default';
      }
    }

    return (
      <div className={`${isDisabled ? 'h-32' : 'h-12'} flex flex-col items-center justify-center`}>
        <Button
          variant={buttonVariant}
          className={buttonClass}
          size="lg"
          onClick={isDisabled ? undefined : () => handleSubscribe(planType)}
          disabled={isDisabled || isLoading}
        >
          {isLoading ? 'Processing...' : buttonText}
        </Button>
        {isDisabled && (
          <Alert className="border-blue-200 bg-blue-50 mt-2">
            <AlertDescription className="text-blue-800 text-sm">
              To upgrade or manage your subscription, visit{' '}
              <a href="/app/me" className="font-medium underline hover:no-underline">
                your account settings
              </a>
              {' '}for proper prorated billing.
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const handleSubscribe = async (planType: string) => {
    setIsLoading(true);
    try {

      // Get user ID from Supabase (client-side)
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) {
        // Redirect to login with plan type in URL for post-login redirect
        const loginUrl = new URL('/login', window.location.origin);
        loginUrl.searchParams.set('redirectTo', `/pricing?plan=${planType}`);
        window.location.href = loginUrl.toString();
        return;
      }

      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          planType,
          successUrl: `${window.location.origin}/app/habits?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
          userId: session.user.id,
        }),
      });

      const { sessionId, url, error, details } = await response.json();

      if (error) {
        console.error('Checkout creation failed:', { error, details });
        alert(`Checkout failed: ${details || error}`);
        return;
      }

      if (sessionId && url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else if (sessionId) {
        // Fallback to manual URL construction
        window.location.href = `https://checkout.stripe.com/c/pay/${sessionId}`;
      } else {
        console.error('No sessionId or url returned');
        alert('Failed to create checkout session. Check console for details.');
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
            {selectedPlan && (
              <div className="mb-4 p-4 bg-primary/10 border border-primary/20 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Welcome back! You were trying to get started with{' '}
                  {selectedPlan === 'pro-monthly' || selectedPlan === 'pro-yearly' ? 'Pro' : 'Plus'}.
                </p>
              </div>
            )}

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
              <div className="h-12 flex items-center justify-center">
                <Button
                  variant="outline"
                  className="w-full"
                  size="lg"
                  onClick={() => window.location.href = '/login'}
                >
                  Get Started Free
                </Button>
              </div>
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
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {PRO_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {renderPlanButton('pro', isYearly ? 'pro-yearly' : 'pro-monthly')}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">
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
            <CardContent className="space-y-6">
              <ul className="space-y-3">
                {PLUS_FEATURES.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {renderPlanButton('plus', isYearly ? 'plus-yearly' : 'plus-monthly')}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-4">
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
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-zest-800 to-zest-600 bg-clip-text text-transparent mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground text-lg">
              Everything you need to know about Z3st Habits
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  Can I change plans anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! You can upgrade or downgrade your plan at any time. All plan changes take effect immediately, 
                  so you can start using new features right away.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  What happens to my data if I downgrade?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Your data is always safe! If you exceed the limits of your new plan, you&apos;ll need to 
                  reduce usage to fit within the new tier limits before creating new habits or groups.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  Is there a discount for yearly billing?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! Save 17% when you pay annually. That&apos;s 2 months free and better value 
                  for your habit-building journey.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  How does the free plan work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  The free plan includes 3 habits, basic analytics, and core features. 
                  Perfect for getting started with habit tracking!
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  Can I cancel anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Absolutely! You can cancel your subscription anytime from your account settings. 
                  You&apos;ll retain access until the end of your billing period.
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/60 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 hover:shadow-lg">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-zest-500"></div>
                  Is my data secure?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  Yes! Your data is encrypted and stored securely. We use industry-standard security 
                  practices and never share your personal information.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
