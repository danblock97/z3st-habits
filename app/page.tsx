import Link from "next/link";
import {
  ArrowRight,
  Check,
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
    badge: "Smart habits",
    title: "Routines that adapt to your life",
    description:
      "Create habits with flexible targets that adjust to your schedule and energy levels.",
    icon: Sparkles,
    points: [
      "Daily, weekly, or custom schedules to fit your lifestyle",
      "Progress tracking with visual completion indicators",
      "Automatic streak calculation and habit insights",
    ],
  },
  {
    badge: "Progress insights",
    title: "See your improvement over time",
    description:
      "Detailed analytics and charts show how your habits are improving and where you can focus.",
    icon: LineChart,
    points: [
      "Visual progress charts and habit completion trends",
      "Streak tracking with longest streak records",
      "Personal habit analytics dashboard",
    ],
  },
  {
    badge: "Group motivation",
    title: "Build habits together",
    description:
      "Create groups with friends to share progress, compete on leaderboards, and stay accountable.",
    icon: Medal,
    points: [
      "Create or join groups for shared habit challenges",
      "Leaderboards to see how you stack up against friends",
      "Share achievements and celebrate wins together",
    ],
  },
  {
    badge: "Private & secure",
    title: "Your data stays yours",
    description:
      "Industry-standard security ensures your personal habit data is protected and private.",
    icon: ShieldCheck,
    points: [
      "End-to-end encrypted data storage",
      "Share only what you want with your groups",
      "Easy data export and deletion options",
    ],
  },
];

const socialProofItems = [
  {
    icon: Users,
    title: "Create any habit",
    description: "From daily meditation to weekly gym visits, track whatever habits matter most to you.",
  },
  {
    icon: TrendingUp,
    title: "Join groups",
    description: "Create or join groups with friends to share progress and stay motivated together.",
  },
  {
    icon: Target,
    title: "Track progress",
    description: "See your streaks grow, view detailed analytics, and compete on group leaderboards.",
  },
];

const faqItems = [
  {
    question: "How is Z3st different from other habit apps?",
    answer: "Z3st focuses on social habit building. You can create groups with friends, compete on leaderboards, and share your progress to stay motivated. Plus, our beautiful streak tracking and detailed analytics help you see your real progress over time.",
  },
  {
    question: "Do I need to check in every day?",
    answer: "Only if you want to! Z3st is flexible - you can set daily, weekly, or custom schedules for your habits. The app will track your streaks automatically, but you only need to check in when you complete your habit.",
  },
  {
    question: "What happens if I miss a day?",
    answer: "Missing days happens to everyone! Z3st shows you exactly when your streak might be at risk and helps you get back on track. The focus is on building sustainable habits, not perfection.",
  },
  {
    question: "Can I share my progress with others?",
    answer: "Absolutely! Create groups with friends or family, compete on leaderboards, and celebrate wins together. You can also share your achievements and progress snapshots to stay accountable and motivated.",
  },
  {
    question: "Is my data private and secure?",
    answer: "Yes, your data is completely private and secure. We use industry-standard encryption and security practices. You control what you share - only share your progress with groups you choose to join.",
  },
  {
    question: "What subscription plans are available?",
    answer: "We offer a free plan to get started, plus paid plans with additional features like advanced analytics, unlimited groups, and priority support. You can upgrade or cancel anytime from your account settings.",
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
              Build habits that actually stick.
            </Badge>
          </div>
          <div className="max-w-4xl">
            <div className="space-y-6 text-center lg:text-left">
              <h1 className="text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                Track habits, build streaks, share victories.
              </h1>
              <p className="mx-auto max-w-2xl text-balance text-lg text-foreground/70 lg:mx-0">
                Create meaningful habits, track your progress with beautiful streaks, join groups with friends, and celebrate your wins together. Simple, social, and designed to help you build lasting positive change.
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
                  <p className="text-xs uppercase text-muted-foreground">Today's habit</p>
                  <p className="mt-1 text-xl font-semibold">Evening walk</p>
                </div>
              </div>
            </div>
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
              Whether you&apos;re building personal routines, staying accountable with friends, or competing on leaderboards, Z3st makes habit formation social, visual, and motivating.
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
              Simple tools for lasting change
            </h2>
            <p className="text-lg text-foreground/70">
              Create habits, track your streaks, join groups with friends, and watch your progress grow. Everything you need to build positive routines that actually stick.
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
            Join thousands of people building positive routines with friends and tracking their progress together.
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
