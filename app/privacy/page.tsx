import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Z3st Habits - How we protect and handle your personal data.",
};

export default function PrivacyPage() {
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

      <div className="prose prose-gray max-w-none">
        <h1>Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Introduction</h2>
        <p>
          At Z3st Habits (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;), we are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our habit tracking application and services.
        </p>

        <h2>Information We Collect</h2>

        <h3>Information You Provide</h3>
        <ul>
          <li><strong>Account Information:</strong> Email address, password, and profile information when you create an account</li>
          <li><strong>Habit Data:</strong> Information about your habits, routines, and progress tracking</li>
          <li><strong>Usage Data:</strong> How you interact with our application features</li>
          <li><strong>Communication:</strong> Messages you send to us through support channels</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <ul>
          <li><strong>Device Information:</strong> IP address, browser type, operating system, and device identifiers</li>
          <li><strong>Usage Analytics:</strong> Pages visited, features used, and time spent in the application</li>
          <li><strong>Performance Data:</strong> Application performance metrics and error reports</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the collected information to:</p>
        <ul>
          <li>Provide and maintain our habit tracking services</li>
          <li>Personalize your experience and adapt habit recommendations</li>
          <li>Improve our application and develop new features</li>
          <li>Send you important updates and security notifications</li>
          <li>Provide customer support and respond to your inquiries</li>
          <li>Analyze usage patterns to improve our services</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures to protect your personal information:
        </p>
        <ul>
          <li>End-to-end encryption for sensitive data transmission</li>
          <li>Row-level security policies in our database</li>
          <li>Regular security audits and penetration testing</li>
          <li>Secure authentication using Supabase Auth</li>
          <li>Automatic session management and token rotation</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>
          We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
        </p>
        <ul>
          <li><strong>With Your Consent:</strong> When you explicitly agree to share information</li>
          <li><strong>Service Providers:</strong> With trusted third-party services that help us operate our application (e.g., Supabase for database, Stripe for payments)</li>
          <li><strong>Legal Requirements:</strong> When required by law or to protect our rights and safety</li>
          <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
        </ul>

        <h2>Your Rights</h2>
        <p>You have the following rights regarding your personal information:</p>
        <ul>
          <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
          <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
          <li><strong>Deletion:</strong> Request deletion of your personal information</li>
          <li><strong>Portability:</strong> Request your data in a portable format</li>
          <li><strong>Restriction:</strong> Request restriction of how we process your information</li>
          <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
        </ul>

        <h2>Data Retention</h2>
        <p>
          We retain your personal information only as long as necessary to provide our services and fulfill the purposes outlined in this policy. When you delete your account, we permanently delete your personal information within 30 days, except where retention is required by law.
        </p>

        <h2>Cookies and Tracking</h2>
        <p>
          We use cookies and similar tracking technologies to enhance your experience:
        </p>
        <ul>
          <li><strong>Essential Cookies:</strong> Required for basic application functionality</li>
          <li><strong>Analytics Cookies:</strong> Help us understand how you use our application</li>
          <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
        </ul>
        <p>You can control cookie settings through your browser preferences.</p>

        <h2>Third-Party Services</h2>
        <p>
          Our application integrates with trusted third-party services:
        </p>
        <ul>
          <li><strong>Supabase:</strong> Database and authentication services</li>
          <li><strong>Stripe:</strong> Payment processing for premium subscriptions</li>
          <li><strong>Vercel:</strong> Application hosting and deployment</li>
        </ul>

        <h2>International Data Transfers</h2>
        <p>
          Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your information during international transfers.
        </p>

        <h2>Children&apos;s Privacy</h2>
        <p>
          Our services are not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.
        </p>

        <h2>Changes to This Policy</h2>
        <p>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through our application. Your continued use of our services after changes become effective constitutes acceptance of the updated policy.
        </p>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy or our privacy practices, please contact us at privacy@z3st.app.
        </p>

        <h2>GDPR Compliance</h2>
        <p>
          For users in the European Union, we comply with the General Data Protection Regulation (GDPR). This includes providing you with control over your personal data and ensuring lawful processing.
        </p>
      </div>
    </div>
  );
}
