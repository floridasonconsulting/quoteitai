import { QuickBooksSection } from "./QuickBooksSection";
import { StripeSection } from "./StripeSection";

export function IntegrationsSection() {
  return (
    <div className="space-y-6">
      <QuickBooksSection />
      <StripeSection />
    </div>
  );
}
