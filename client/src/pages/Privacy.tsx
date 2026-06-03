import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Privacy() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Button variant="ghost" size="sm" className="mb-6" onClick={() => navigate("/")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
        </Button>

        <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: June 3, 2026</p>

        <div className="prose prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Information We Collect</h2>
            <p>We collect information you provide directly: account information (name, email), business information (business name, industry, website URL), content you create or generate through the Service, platform connection credentials (OAuth tokens), and payment information (processed by Stripe). We also collect usage data: pages visited, features used, content generated, publishing activity, and performance analytics.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. How We Use Your Information</h2>
            <p>We use your information to: provide and improve the Service, generate AI content tailored to your business, publish content to your connected platforms, provide analytics and performance insights, process payments, send service notifications (content published, failures, weekly reports), and comply with legal obligations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Data Storage and Security</h2>
            <p>Your data is stored in encrypted databases. OAuth tokens are stored securely and used only to publish content on your behalf. We implement industry-standard security measures including encryption in transit (TLS) and at rest, access controls, and regular security audits. We do not sell your data to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Third-Party Services</h2>
            <p>We integrate with third-party services to provide the Service: Google (Business Profile, YouTube, Search Console), Meta (Instagram, Facebook), TikTok, Reddit, WordPress, Stripe (payments), and AI providers (for content generation). Each third-party service has its own privacy policy. We only share the minimum data necessary for each integration to function.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Your Rights (GDPR/CCPA)</h2>
            <p>You have the right to: access your personal data (available via Settings → Export), correct inaccurate data, delete your data (available via Settings → Delete Account), export your data in a machine-readable format (JSON), object to processing, and withdraw consent at any time. To exercise these rights, use the Data Management section in Settings or contact privacy@contentflow.ai.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. After account deletion, we permanently remove all personal data within 30 days. Anonymized analytics data may be retained for service improvement. Billing records are retained as required by law (typically 7 years).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Cookies and Tracking</h2>
            <p>We use essential cookies for authentication and session management. We use analytics to understand how the Service is used. We do not use third-party advertising cookies. You can manage cookie preferences in your browser settings.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Email Communications</h2>
            <p>We send transactional emails (welcome, content published, failure alerts) and optional marketing emails (weekly performance reports). You can manage email preferences in Settings → Notifications. You can unsubscribe from non-essential emails at any time.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">9. Children's Privacy</h2>
            <p>The Service is not intended for users under 18 years of age. We do not knowingly collect information from children.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of material changes via email or in-app notification. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">11. Contact</h2>
            <p>For privacy-related questions or to exercise your data rights, contact us at privacy@contentflow.ai or use the data management tools in Settings.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
