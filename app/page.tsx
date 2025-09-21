import Link from "next/link";
import {
  ArrowRight,
  Check,
  LayoutDashboard,
  LineChart,
  ListChecks,
  Medal,
  ShieldCheck,
  Sparkles,
  Users,
  TrendingUp,
  Target,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { createServerClient } from "@/lib/supabase/server";

const featureCards = [
  {
    badge: "Adaptive loops",
    title: "Routines that flex with your energy",
    description:
      "Let Z3st auto-adjust daily targets based on your energy score, calendar load, and streak health.",
    icon: Sparkles,
    points: [
      "Server Actions personalize each plan with secure data handling",
      "Energy check-ins stay under 30 seconds with predictive defaults",
      "Suggested resets keep momentum when life gets messy",
    ],
  },
  {
    badge: "Realtime clarity",
    title: "Telemetry that highlights the right next move",
    description:
      "Live dashboards show habit velocity, compounding streaks, and attention leaks so you can course correct fast.",
    icon: LineChart,
    points: [
      "Real-time sync keeps your progress updated across all devices instantly",
      "Tabs let you flip between streaks, energy, and focus arenas",
      "Progress indicators highlight where you're trending ahead",
    ],
  },
  {
    badge: "Playful accountability",
    title: "Celebrate wins with your citrus crew",
    description:
      "Drop progress snapshots, unlock badges, and share zest checks that keep your team inspired.",
    icon: Medal,
    points: [
      "Dialog flows make sharing highlights frictionless",
      "Habit badges evolve from lime to blood orange as you grow",
      "Dropdown menus give quick access to share, snooze, or duplicate",
    ],
  },
  {
    badge: "Secure by default",
    title: "Privacy-first with enterprise-grade security",
    description:
      "Your rituals stay yours. Z3st uses industry-standard security with encrypted storage and secure data handling.",
    icon: ShieldCheck,
    points: [
      "Automatic session rotation keeps tokens fresh",
      "Sheet layouts surface settings without losing context",
      "Explicit consent flows make exporting or deleting data simple",
    ],
  },
];

const socialProofItems = [
  {
    icon: Users,
    title: "Track any habit",
    description: "From morning routines to evening wind-downs, build consistency in whatever matters most to you.",
  },
  {
    icon: TrendingUp,
    title: "Build with others",
    description: "Create groups, share progress, and stay accountable together with friends and communities.",
  },
  {
    icon: Target,
    title: "See your progress",
    description: "Detailed analytics and leaderboards show your improvement over time and how you stack up.",
  },
];

const faqItems = [
  {
    question: "How is Z3st different from other habit apps?",
    answer: "Z3st treats habits as a system, not individual tasks. It connects your energy levels, calendar events, and streak health to automatically adjust your daily targets. Instead of rigid checklists, you get adaptive routines that flex with your life.",
  },
  {
    question: "Do I need to check in every day?",
    answer: "Not at all! Z3st is designed for busy creators. Most check-ins take under 30 seconds with predictive defaults. The app learns your patterns and suggests the right actions at the right time.",
  },
  {
    question: "What happens if I miss a day?",
    answer: "Missing days happens to everyone. Z3st suggests gentle resets rather than breaking streaks entirely. The focus is on building sustainable momentum, not perfection.",
  },
  {
    question: "Can I share my progress with others?",
    answer: "Yes! Z3st includes playful accountability features where you can share progress snapshots, unlock achievement badges, and celebrate wins with your community. It's designed to make habit building more fun and social.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Absolutely. Z3st uses Supabase's enterprise-grade security with row-level security policies. Your personal rituals and progress data stay yours, protected with the same standards used by major tech companies.",
  },
  {
    question: "What if I need to change my subscription?",
    answer: "You can upgrade, downgrade, or cancel at any time from your account settings. Changes take effect immediately, and we'll handle prorated billing automatically.",
  },
];


export default async function Home() {
  const supabase = await createServerClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthenticated = Boolean(session);
  const primaryCta = isAuthenticated ? {
    text: "Go to Dashboard",
    href: "/app",
  } : {
    text: "Get Started Free",
    href: "/login",
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 -top-48 h-[420px] bg-[radial-gradient(circle_at_top,_rgba(255,180,0,0.18),_transparent_65%)]" />
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-16 pt-20 sm:gap-12 sm:pb-24 sm:pt-24">
          <div className="flex justify-center lg:justify-start">
            <Badge className="border border-border/60 bg-secondary/50 text-secondary-foreground">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Systems that energize, not exhaust.
            </Badge>
          </div>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_0.9fr] lg:items-center">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Habits that taste like victory, every single day.
              </h1>
              <p className="mx-auto max-w-2xl text-balance text-lg text-foreground/70 lg:mx-0">
                Z3st Habits blends ritual design, realtime feedback, and playful accountability so you can keep momentum without burning out. Plan once, and let the system energize the rest of your week.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center lg:justify-start">
                <Button asChild size="lg">
                  <Link href={primaryCta.href}>
                    {primaryCta.text}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#features">See Features</Link>
                </Button>
              </div>
              <div className="grid gap-3 text-left text-sm text-foreground/80 sm:grid-cols-3">
                <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
                  <p className="text-xs uppercase text-muted-foreground">Habit streak</p>
                  <p className="mt-1 text-xl font-semibold">12 days on track</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
                  <p className="text-xs uppercase text-muted-foreground">Energy trend</p>
                  <p className="mt-1 text-xl font-semibold">+18% vs last week</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/60 p-4 shadow-sm">
                  <p className="text-xs uppercase text-muted-foreground">Upcoming focus</p>
                  <p className="mt-1 text-xl font-semibold">Deep work sprint</p>
                </div>
              </div>
            </div>
            <Card className="hidden border-none bg-card/80 shadow-xl shadow-primary/20 backdrop-blur lg:flex">
              <CardHeader className="px-6">
                <Badge
                  variant="secondary"
                  className="w-fit border border-border/60 bg-secondary/60 text-secondary-foreground"
                >
                  <LayoutDashboard className="h-3.5 w-3.5" aria-hidden="true" />
                  Morning momentum
                </Badge>
                <CardTitle className="text-2xl">Your citrus control center</CardTitle>
                <CardDescription>
                  One glance shows streak strength, energy, and where to pour focus next.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-6 px-6 pb-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Energy today</span>
                    <span className="font-semibold text-foreground">84%</span>
                  </div>
                  <Progress value={84} aria-label="Energy completeness" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Focus arena</span>
                    <span className="font-semibold text-foreground">Deep Work</span>
                  </div>
                  <div className="grid gap-2 text-sm">
                    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/80 p-3">
                      <ListChecks className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Sprint rituals</p>
                        <p className="text-muted-foreground">
                          Two focus blocks scheduled and synced to your calendar.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3 rounded-lg border border-border/60 bg-background/80 p-3">
                      <LineChart className="mt-0.5 h-5 w-5 text-primary" aria-hidden="true" />
                      <div>
                        <p className="font-medium">Trend insight</p>
                        <p className="text-muted-foreground">
                          Streak velocity is up 18% since last week. Keep the zest flowing!
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-background/80 p-3 text-sm">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  <p className="text-muted-foreground">
                    Protected with enterprise-grade security and real-time sync.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="border-t border-border/60 bg-card/30 py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
            <Badge
              variant="outline"
              className="mx-auto border-primary/40 text-foreground"
            >
              Simple habit tracking for everyone
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Build better habits, together
            </h2>
            <p className="text-lg text-foreground/70">
              Whether you&apos;re tracking personal goals, building routines with friends, or competing on leaderboards, Z3st makes habit formation social, insightful, and sustainable.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {socialProofItems.map((item) => (
              <Card key={item.title} className="bg-background/80 text-center">
                <CardHeader>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <item.icon className="h-6 w-6 text-primary" aria-hidden="true" />
                  </div>
                  <CardTitle className="text-xl">{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{item.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="border-t border-border/60 bg-background py-16 sm:py-20"
      >
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
            <Badge
              variant="outline"
              className="mx-auto border-primary/40 text-foreground"
            >
              Everything you need to build habits
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Make momentum your default state
            </h2>
            <p className="text-lg text-foreground/70">
              Z3st Habits connects cues, rituals, and reflections into one seamless system. No more scattered trackers or forgotten goals—just consistent progress and lasting change.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {featureCards.map((feature) => (
              <Card key={feature.title} className="bg-card/80">
                <CardHeader className="flex flex-col gap-3">
                  <Badge
                    variant="secondary"
                    className="w-fit border border-border/60 bg-secondary/60 text-secondary-foreground"
                  >
                    <feature.icon className="h-3.5 w-3.5" aria-hidden="true" />
                    {feature.badge}
                  </Badge>
                  <CardTitle className="text-2xl leading-tight">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent className="px-6 pb-6">
                  <ul className="space-y-3 text-sm text-foreground/70">
                    {feature.points.map((point) => (
                      <li key={point} className="flex items-start gap-2">
                        <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* FAQ Section */}
      <section className="border-t border-border/60 bg-card/30 py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4">
          <div className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
            <Badge
              variant="outline"
              className="mx-auto border-primary/40 text-foreground"
            >
              Common questions
            </Badge>
            <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to know
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {faqItems.map((faq) => (
              <Card key={faq.question} className="bg-background/80">
                <CardHeader>
                  <CardTitle className="text-lg leading-tight">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="border-t border-border/60 bg-gradient-to-b from-background to-card/40 py-16 sm:py-20">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Ready to build habits that actually stick?
          </h2>
          <p className="text-lg text-foreground/70">
            Start your habit-building journey today with Z3st&apos;s simple, effective system.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <Button asChild size="lg">
              <Link href={primaryCta.href}>
                {primaryCta.text}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="#features">See Features</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
