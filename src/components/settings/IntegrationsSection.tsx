import { SupabaseClient } from "@supabase/supabase-js";
import { QuickBooksSection } from "./QuickBooksSection";
import { StripeSection } from "./StripeSection";

export function IntegrationsSection({
  supabaseClient,
  isClientReady = true
}: {
  supabaseClient?: SupabaseClient;
  isClientReady?: boolean;
}) {
  return (
    <div className="space-y-6">
      <QuickBooksSection supabaseClient={supabaseClient} isClientReady={isClientReady} />
      <StripeSection supabaseClient={supabaseClient} isClientReady={isClientReady} />
    </div>
  );
}
