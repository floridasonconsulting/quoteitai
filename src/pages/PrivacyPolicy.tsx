import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? '/dashboard' : '/')}>
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Privacy Policy</span>
            </div>
          </div>
          {!user && (
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>
      </header>

      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none space-y-6">
            <section>
              <h2 className="text-xl font-semibold mb-3">1. Information We Collect</h2>
              <p>
                Sellegance collects information necessary to provide our quote management services:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Account Information:</strong> Email address, password (encrypted), and subscription status</li>
                <li><strong>Business Data:</strong> Company settings, customer information, items/services, and quotes you create</li>
                <li><strong>Usage Data:</strong> App interactions, feature usage, and performance metrics</li>
                <li><strong>Device Information:</strong> Device type, operating system, and app version for troubleshooting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">2. How We Use Your Information</h2>
              <p>We use collected information to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide and maintain the Sellegance service</li>
                <li>Process your quotes and manage customer data</li>
                <li>Send quote notifications and status updates</li>
                <li>Process payments and manage subscriptions via Stripe</li>
                <li>Improve app functionality and user experience</li>
                <li>Provide customer support</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">3. Data Storage and Security</h2>
              <p>
                Your data is stored securely using industry-standard encryption:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Local Storage:</strong> Data is stored on your device using encrypted local databases for offline access</li>
                <li><strong>Cloud Backup:</strong> Data syncs to secure cloud servers with encryption in transit and at rest</li>
                <li><strong>Password Security:</strong> Passwords are hashed using bcrypt and never stored in plain text</li>
                <li><strong>Access Control:</strong> Row-level security ensures users can only access their own data</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">4. Third-Party Services</h2>
              <p>We integrate with the following trusted third-party services:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li><strong>Stripe:</strong> Payment processing and subscription management (see Stripe's privacy policy)</li>
                <li><strong>Email Service:</strong> Transactional emails for quote notifications</li>
                <li><strong>AI Services:</strong> Optional AI features for quote generation (data is not used for training)</li>
              </ul>
              <p className="mt-2">
                We do not sell your data to third parties. Service providers are contractually obligated to protect your data.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">5. Data Retention</h2>
              <p>
                We retain your data for as long as your account is active. Upon account deletion:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Personal data is deleted within 30 days</li>
                <li>Backup copies are removed within 90 days</li>
                <li>Transaction records may be retained longer for legal/accounting requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Access your personal data</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to data processing</li>
              </ul>
              <p className="mt-2">
                To exercise these rights, contact us at hello@sellegance.com
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">7. Children's Privacy</h2>
              <p>
                Sellegance is not intended for users under 18 years of age. We do not knowingly collect
                data from children. If we discover we have collected data from a child, we will delete it immediately.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">8. International Users</h2>
              <p>
                Your data may be processed in countries where our service providers operate. By using Sellegance,
                you consent to the transfer of your data to these locations, which may have different data protection
                laws than your country.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">9. Changes to Privacy Policy</h2>
              <p>
                We may update this policy periodically. We will notify you of significant changes via email or
                in-app notification. Continued use after changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">10. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy or our data practices, contact us at:
              </p>
              <p className="mt-2">
                <strong>Email:</strong> hello@sellegance.com<br />
                <strong>Address:</strong> Florida, USA
              </p>
            </section>

            <section className="border-t pt-4 mt-6">
              <p className="text-sm text-muted-foreground">
                <strong>GDPR & CCPA Compliance:</strong> We comply with GDPR (for EU users) and CCPA (for California residents).
                You have additional rights under these regulations. Contact us for details.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
