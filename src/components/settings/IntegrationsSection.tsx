import { SupabaseClient } from "@supabase/supabase-js";
import { QuickBooksSection } from "./QuickBooksSection";
import { StripeSection } from "./StripeSection";
import { CompanySettings } from "@/types";

export function IntegrationsSection({
  supabaseClient,
  isClientReady = true,
  settings
}: {
  supabaseClient?: SupabaseClient;
  isClientReady?: boolean;
  settings?: CompanySettings;
}) {
  return (
    <div className="space-y-6">
      <QuickBooksSection supabaseClient={supabaseClient} isClientReady={isClientReady} settings={settings} />
      <StripeSection supabaseClient={supabaseClient} isClientReady={isClientReady} settings={settings} />
    </div>
  );
}
