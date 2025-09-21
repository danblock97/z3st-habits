import Link from "next/link";
import { ArrowLeft, Mail, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata = {
  title: "Contact Us",
  description: "Get in touch with the Z3st Habits team for support, feedback, bug reports, or view our roadmap.",
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl">
      <div className="mb-8">
        <Button asChild variant="ghost" size="sm">
          <Link href="/">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">Get in Touch</h1>
        <p className="text-lg text-muted-foreground">
          We&apos;d love to hear from you. Send us a message and we&apos;ll respond as soon as possible.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Support
            </CardTitle>
            <CardDescription>
              For technical issues, account problems, or general questions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Our support team typically responds within 24 hours during business days.
            </p>
            <Button asChild className="w-full">
              <a href="mailto:support@z3st.app">
                support@z3st.app
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Feature Requests
            </CardTitle>
            <CardDescription>
              Have an idea for a new feature or improvement?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              We love hearing about features that would make Z3st even better for creators.
            </p>
            <Button asChild variant="outline" className="w-full">
              <a href="mailto:feedback@z3st.app">
                feedback@z3st.app
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Other Ways to Reach Us</CardTitle>
            <CardDescription>
              We&apos;re here to help with whatever you need
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-semibold mb-2">Business Inquiries</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  For partnerships, press, or business opportunities
                </p>
                <a href="mailto:business@z3st.app" className="text-primary hover:underline">
                  business@z3st.app
                </a>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bug Reports</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Found something not working as expected?
                </p>
                <Button asChild variant="outline" size="sm">
                  <a href="https://roomy-pick-4e2.notion.site/27505d85e58381cfab76cefbd1c2a6ab?pvs=105" target="_blank" rel="noopener noreferrer">
                    Report Bug
                  </a>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Roadmap & Feature Voting</CardTitle>
            <CardDescription>
              See what we&apos;re working on and vote on upcoming features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Check out our public roadmap, see what features are planned, and vote on what you&apos;d like to see next.
            </p>
            <Button asChild className="w-full">
              <a href="https://roomy-pick-4e2.notion.site/27505d85e58381cfab76cefbd1c2a6ab?pvs=105" target="_blank" rel="noopener noreferrer">
                View Roadmap & Vote
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-muted-foreground">
          Response time: Usually within 24 hours<br />
          Business days: Monday - Friday, 9 AM - 6 PM GMT
        </p>
      </div>
    </div>
  );
}
