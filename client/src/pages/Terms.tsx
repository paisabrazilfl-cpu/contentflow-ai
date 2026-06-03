import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Terms() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 3, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p>By accessing or using ContentFlow AI ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. The Service is provided by ContentFlow AI and is intended for business use in content creation, scheduling, and publishing automation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Description of Service</h2>
            <p>ContentFlow AI provides AI-powered content generation, scheduling, and multi-platform publishing services. The Service includes automated content creation using artificial intelligence, scheduling and publishing to connected third-party platforms, analytics and performance tracking, and AI visibility scoring. We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. User Accounts</h2>
            <p>You must provide accurate and complete information when creating an account. You are responsible for maintaining the security of your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. Each account represents one business entity; multi-tenant access is provided through team member invitations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Subscription and Billing</h2>
            <p>The Service offers subscription plans (Starter at $97/month, Pro at $197/month, Enterprise at $497/month). Subscriptions are billed monthly in advance. You may cancel at any time; access continues until the end of the current billing period. Refunds are not provided for partial months. We reserve the right to change pricing with 30 days notice.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Content Ownership</h2>
            <p>You retain full ownership of all content generated through the Service. ContentFlow AI does not claim any intellectual property rights over content created for your business. You grant us a limited license to process, store, and transmit your content solely for the purpose of providing the Service. AI-generated content is provided "as-is" and you are responsible for reviewing content before publication.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Platform Integrations</h2>
            <p>The Service connects to third-party platforms (Google, Meta, TikTok, YouTube, Reddit, WordPress) via OAuth. You authorize us to publish content on your behalf to connected platforms. You are responsible for complying with each platform's terms of service. We are not liable for actions taken by third-party platforms regarding your content or account.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Acceptable Use</h2>
            <p>You agree not to use the Service to: generate or publish illegal, harmful, or misleading content; violate any third-party intellectual property rights; spam or engage in deceptive practices; attempt to reverse-engineer or exploit the Service; share account credentials with unauthorized parties. Violation may result in immediate account termination.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Limitation of Liability</h2>
            <p>The Service is provided "as is" without warranties of any kind. ContentFlow AI shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service. Our total liability shall not exceed the amount paid by you in the 12 months preceding the claim. We are not responsible for content published to third-party platforms or any resulting consequences.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Data and Privacy</h2>
            <p>Your use of the Service is also governed by our Privacy Policy. We process your data in accordance with applicable data protection laws. You may export or delete your data at any time through the Settings page.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Termination</h2>
            <p>Either party may terminate this agreement at any time. Upon termination, your access to the Service will cease and your data will be retained for 30 days before permanent deletion, unless you request immediate deletion through the GDPR data export/deletion feature in Settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Governing Law</h2>
            <p>These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to conflict of law principles. Any disputes shall be resolved through binding arbitration.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">12. Contact</h2>
            <p>For questions about these Terms, contact us at legal@contentflow.ai.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
