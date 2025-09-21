import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Z3st Habits - Your agreement when using our habit tracking platform.",
};

export default function TermsPage() {
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
        <h1>Terms of Service</h1>
        <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

        <h2>Agreement to Terms</h2>
        <p>
          By accessing and using Z3st Habits (&quot;the Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you do not agree to these Terms, please do not use the Service.
        </p>

        <h2>Description of Service</h2>
        <p>
          Z3st Habits is a habit tracking and productivity platform that helps users build and maintain sustainable routines. The Service includes habit creation, progress tracking, social features, and premium subscription options.
        </p>

        <h2>User Accounts</h2>

        <h3>Account Creation</h3>
        <ul>
          <li>You must provide accurate and complete information when creating an account</li>
          <li>You are responsible for maintaining the confidentiality of your account credentials</li>
          <li>You must notify us immediately of any unauthorized use of your account</li>
          <li>You must be at least 13 years old to use the Service</li>
        </ul>

        <h3>Account Responsibilities</h3>
        <ul>
          <li>You are responsible for all activities that occur under your account</li>
          <li>You may not transfer, sell, or assign your account to another person</li>
          <li>We reserve the right to suspend or terminate accounts that violate these Terms</li>
        </ul>

        <h2>Acceptable Use</h2>

        <h3>Prohibited Activities</h3>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any illegal or unauthorized purpose</li>
          <li>Violate any applicable laws or regulations</li>
          <li>Interfere with or disrupt the Service or servers</li>
          <li>Attempt to gain unauthorized access to any part of the Service</li>
          <li>Use the Service to transmit harmful code, viruses, or malware</li>
          <li>Engage in any form of harassment, abuse, or harmful behavior</li>
          <li>Share inappropriate, offensive, or harmful content</li>
        </ul>

        <h3>Content Guidelines</h3>
        <ul>
          <li>Your content must not violate intellectual property rights</li>
          <li>Content must not contain hate speech or discriminatory material</li>
          <li>You retain ownership of your content but grant us a license to use it</li>
          <li>We reserve the right to remove content that violates these Terms</li>
        </ul>

        <h2>Subscription and Payment</h2>

        <h3>Free and Paid Plans</h3>
        <ul>
          <li>The Service offers both free and paid subscription tiers</li>
          <li>Paid features are clearly marked and require a valid payment method</li>
          <li>Subscription fees are billed in advance on a monthly or yearly basis</li>
        </ul>

        <h3>Billing and Cancellation</h3>
        <ul>
          <li>You may cancel your subscription at any time from your account settings</li>
          <li>Cancellation takes effect at the end of your current billing period</li>
          <li>No refunds for partial billing periods except as required by law</li>
          <li>Price changes will be communicated at least 30 days in advance</li>
        </ul>

        <h2>Privacy and Data</h2>

        <h3>Data Protection</h3>
        <ul>
          <li>Your privacy is important to us - see our Privacy Policy for details</li>
          <li>We implement reasonable security measures to protect your information</li>
          <li>You own your data and can export or delete it at any time</li>
        </ul>

        <h3>Data Usage</h3>
        <ul>
          <li>We may use aggregated, anonymized data to improve the Service</li>
          <li>Individual user data is never sold to third parties</li>
          <li>We may share data with service providers necessary for operation</li>
        </ul>

        <h2>Intellectual Property</h2>

        <h3>Our Rights</h3>
        <ul>
          <li>The Service, including software, design, and content, is owned by Z3st</li>
          <li>All rights not expressly granted are reserved</li>
          <li>Trademarks, logos, and branding remain our property</li>
        </ul>

        <h3>Your Content</h3>
        <ul>
          <li>You retain ownership of content you create in the Service</li>
          <li>You grant us a license to use, display, and distribute your content</li>
          <li>You are responsible for ensuring you have rights to share your content</li>
        </ul>

        <h2>Service Availability</h2>

        <h3>Uptime and Reliability</h3>
        <ul>
          <li>We strive for high availability but do not guarantee uninterrupted service</li>
          <li>We may perform maintenance that temporarily affects availability</li>
          <li>Emergency maintenance may be performed without advance notice</li>
        </ul>

        <h3>Disclaimers</h3>
        <ul>
          <li>The Service is provided &quot;as is&quot; without warranties of any kind</li>
          <li>We do not guarantee specific results from using the Service</li>
          <li>Use of the Service is at your own risk</li>
        </ul>

        <h2>Limitation of Liability</h2>

        <h3>General Limitation</h3>
        <ul>
          <li>Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim</li>
          <li>We are not liable for indirect, incidental, or consequential damages</li>
          <li>Some jurisdictions may not allow these limitations</li>
        </ul>

        <h3>Exclusions</h3>
        <p>We are not liable for damages arising from:</p>
        <ul>
          <li>Your use or inability to use the Service</li>
          <li>Any unauthorized access to or alteration of your data</li>
          <li>Statements or conduct of any third party using the Service</li>
          <li>Any other matter relating to the Service</li>
        </ul>

        <h2>Termination</h2>

        <h3>Account Termination</h3>
        <ul>
          <li>You may delete your account at any time from your settings</li>
          <li>We may suspend or terminate accounts that violate these Terms</li>
          <li>Upon termination, your right to use the Service immediately ceases</li>
          <li>Provisions regarding data, liability, and indemnification survive termination</li>
        </ul>

        <h2>Changes to Terms</h2>
        <p>
          We may update these Terms from time to time. We will notify users of material changes via email or through the Service. Continued use after changes constitutes acceptance of the new Terms.
        </p>

        <h2>Governing Law</h2>
        <p>
          These Terms are governed by and construed in accordance with the laws of [Jurisdiction], without regard to conflict of law principles. Any disputes will be resolved in the courts of [Jurisdiction].
        </p>

        <h2>Contact Information</h2>
        <p>
          If you have questions about these Terms of Service, please contact us at legal@z3st.app.
        </p>

        <h2>Entire Agreement</h2>
        <p>
          These Terms, together with our Privacy Policy, constitute the entire agreement between you and Z3st regarding the Service.
        </p>
      </div>
    </div>
  );
}
