import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Terms of Service</CardTitle>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Quote-it AI ("the Service"), you agree to be bound by these Terms of Service 
              ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
            <p>
              Quote-it AI is a mobile and web-based application that enables users to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create, manage, and send professional quotes</li>
              <li>Manage customer and item databases</li>
              <li>Generate PDF proposals</li>
              <li>Receive quote status notifications</li>
              <li>Access AI-powered features (with applicable subscription)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. Account Registration</h2>
            <p>To use the Service, you must:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your password</li>
              <li>Be at least 18 years old</li>
              <li>Have the legal capacity to enter into binding contracts</li>
            </ul>
            <p className="mt-2">
              You are responsible for all activities that occur under your account. Notify us immediately 
              of any unauthorized access or security breach.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Subscription Plans and Payments</h2>
            <h3 className="text-lg font-medium mt-3 mb-2">4.1 Free Tier</h3>
            <p>
              A limited free tier is available with basic features. We reserve the right to modify or 
              discontinue the free tier at any time.
            </p>
            
            <h3 className="text-lg font-medium mt-3 mb-2">4.2 Paid Subscriptions</h3>
            <p>Paid plans include Pro and Max AI tiers with additional features:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Subscriptions are billed monthly or annually via Stripe</li>
              <li>Prices are as displayed at time of purchase</li>
              <li>Subscriptions auto-renew unless cancelled</li>
              <li>Refunds are provided only as required by law or at our discretion</li>
            </ul>

            <h3 className="text-lg font-medium mt-3 mb-2">4.3 Cancellation</h3>
            <p>
              You may cancel your subscription at any time via the Subscription page. Cancellation takes 
              effect at the end of the current billing period. No partial refunds for unused time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Acceptable Use Policy</h2>
            <p>You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violate any laws or regulations</li>
              <li>Infringe on intellectual property rights</li>
              <li>Transmit malware, viruses, or harmful code</li>
              <li>Harass, abuse, or harm others</li>
              <li>Spam or send unsolicited communications</li>
              <li>Attempt to gain unauthorized access to systems</li>
              <li>Reverse engineer or decompile the Service</li>
              <li>Resell or redistribute the Service without authorization</li>
            </ul>
            <p className="mt-2">
              Violation of this policy may result in immediate account termination without refund.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Intellectual Property</h2>
            <h3 className="text-lg font-medium mt-3 mb-2">6.1 Our Rights</h3>
            <p>
              Quote-it AI, including all software, designs, trademarks, and content, is owned by us and 
              protected by copyright and trademark laws. You receive a limited, non-exclusive license to 
              use the Service.
            </p>

            <h3 className="text-lg font-medium mt-3 mb-2">6.2 Your Content</h3>
            <p>
              You retain ownership of all data you input (quotes, customers, items). By using the Service, 
              you grant us a license to process, store, and display your content solely to provide the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Data and Privacy</h2>
            <p>
              Your use of the Service is governed by our Privacy Policy. We collect and process data as 
              described in the Privacy Policy. By using the Service, you consent to such processing.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Service Availability</h2>
            <p>
              We strive for high availability but do not guarantee uninterrupted access. The Service may be 
              unavailable due to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Scheduled maintenance</li>
              <li>Technical difficulties</li>
              <li>Force majeure events</li>
              <li>Third-party service interruptions</li>
            </ul>
            <p className="mt-2">We are not liable for damages resulting from service unavailability.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Limitation of Liability</h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND</li>
              <li>WE ARE NOT LIABLE FOR INDIRECT, INCIDENTAL, OR CONSEQUENTIAL DAMAGES</li>
              <li>OUR TOTAL LIABILITY IS LIMITED TO AMOUNTS PAID BY YOU IN THE PAST 12 MONTHS</li>
              <li>WE ARE NOT RESPONSIBLE FOR THIRD-PARTY SERVICES (STRIPE, EMAIL PROVIDERS)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Indemnification</h2>
            <p>
              You agree to indemnify and hold us harmless from claims, damages, and expenses (including 
              legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of third-party rights</li>
              <li>Content you submit or transmit</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Termination</h2>
            <p>
              We may suspend or terminate your account at our discretion for:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms</li>
              <li>Fraudulent activity</li>
              <li>Non-payment of subscription fees</li>
              <li>Prolonged inactivity</li>
            </ul>
            <p className="mt-2">
              Upon termination, your right to use the Service ceases immediately. You may export your 
              data before termination via the app's export features.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">12. Dispute Resolution</h2>
            <h3 className="text-lg font-medium mt-3 mb-2">12.1 Governing Law</h3>
            <p>
              These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict 
              of law principles.
            </p>

            <h3 className="text-lg font-medium mt-3 mb-2">12.2 Arbitration</h3>
            <p>
              Disputes shall be resolved through binding arbitration, except where prohibited by law. 
              You waive the right to participate in class action lawsuits.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">13. Changes to Terms</h2>
            <p>
              We may modify these Terms at any time. Significant changes will be communicated via email 
              or in-app notification. Continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">14. Miscellaneous</h2>
            <h3 className="text-lg font-medium mt-3 mb-2">14.1 Entire Agreement</h3>
            <p>These Terms constitute the entire agreement between you and Quote-it AI.</p>

            <h3 className="text-lg font-medium mt-3 mb-2">14.2 Severability</h3>
            <p>If any provision is found invalid, the remaining provisions remain in effect.</p>

            <h3 className="text-lg font-medium mt-3 mb-2">14.3 Waiver</h3>
            <p>Failure to enforce any right does not constitute a waiver of that right.</p>

            <h3 className="text-lg font-medium mt-3 mb-2">14.4 Assignment</h3>
            <p>You may not assign these Terms without our consent. We may assign them at any time.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">15. Contact Information</h2>
            <p>
              For questions about these Terms, contact us at:
            </p>
            <p className="mt-2">
              <strong>Email:</strong> support@quoteit-ai.com<br />
              <strong>Address:</strong> [Your Company Address]
            </p>
          </section>

          <section className="border-t pt-4 mt-6">
            <p className="text-sm text-muted-foreground">
              By clicking "I Accept" during registration or by using the Service, you acknowledge that 
              you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
