import Link from "next/link";
import { ArrowLeft, Github, LifeBuoy, PenSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Contact Us",
  description: "Connect with the Z3st Habits team for support and contribute via GitHub issues.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="mb-10">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="text-center mb-14 space-y-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1 text-xs font-medium uppercase tracking-[0.2em] text-accent-foreground">
          We listen. We build together.
        </span>
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">How can we help?</h1>
        <p className="text-base text-muted-foreground md:text-lg">
          Need assistance or want to shape the roadmap? Reach out to our team, or open an issue on GitHub so the whole community benefits.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Github className="h-6 w-6" />
              GitHub Issues Hub
            </CardTitle>
            <CardDescription>
              Centralize your feedback with structured issues and stay informed on updates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Report bugs, request features, or follow progress in one place. Use the templates so we can act quickly.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button asChild>
                <Link href="https://github.com/danblock97/z3st-habits/issues/new?template=bug-report.yml" target="_blank" rel="noopener noreferrer">
                  Report a Bug
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="https://github.com/danblock97/z3st-habits/issues/new?template=feature-request.yml" target="_blank" rel="noopener noreferrer">
                  Request a Feature
                </Link>
              </Button>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="https://github.com/danblock97/z3st-habits/issues" target="_blank" rel="noopener noreferrer">
                Browse Existing Issues
              </Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LifeBuoy className="h-5 w-5" />
                Support Team
              </CardTitle>
              <CardDescription>Private help from the team within one business day.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Prefer a direct line? We respond within 24 hours during the work week.</p>
              <div className="grid gap-2">
                <Button asChild variant="outline">
                  <a href="mailto:support@z3st.app">support@z3st.app</a>
                </Button>
                <span className="text-xs text-muted-foreground/80">
                  For billing, account access, or anything you don&apos;t want public.
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PenSquare className="h-5 w-5" />
                Product Feedback
              </CardTitle>
              <CardDescription>Share input that guides our roadmap before it goes public.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>Want a private conversation? Email us and we&apos;ll loop in the product team.</p>
              <div className="grid gap-2">
                <Button asChild variant="secondary">
                  <a href="mailto:feedback@z3st.app">feedback@z3st.app</a>
                </Button>
                <span className="text-xs text-muted-foreground/80">
                  We&apos;ll triage and add ideas into GitHub when ready.
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="mt-10 border-dashed shadow-none">
        <CardHeader>
          <CardTitle>Partnerships & Press</CardTitle>
          <CardDescription>We&apos;re open to collaborations that help creators thrive.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>For sponsorships, media features, or other business inquiries.</p>
            <p>We aim to reply within two business days.</p>
          </div>
          <Button asChild variant="outline">
            <a href="mailto:business@z3st.app">business@z3st.app</a>
          </Button>
        </CardContent>
      </Card>

      <div className="mt-12 text-center text-sm text-muted-foreground">
        <p>Response time: Within 24 hours · Monday - Friday, 9 AM - 6 PM GMT</p>
        <p className="mt-2 text-xs text-muted-foreground/70">We monitor GitHub daily and triage requests twice a week.</p>
      </div>
    </div>
  );
}
