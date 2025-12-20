
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getQuote } from "@/lib/services/quote-service";
import { getSettings } from "@/lib/db-service";
import { Quote, CompanySettings } from "@/types";
import { ProposalViewer } from "@/components/proposal/viewer/ProposalViewer";
import { LoadingFallback } from "@/components/LoadingFallback";
import { useAuth } from "@/contexts/AuthContext";
import { visualsService } from "@/lib/services/visuals-service";
import { ProposalVisuals } from "@/types/proposal";

export default function QuotePreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, organizationId } = useAuth();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visuals, setVisuals] = useState<ProposalVisuals | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!id || !user?.id) {
        console.error("[QuotePreview] Missing ID or User ID:", { id, userId: user?.id });
        setError("Invalid quote ID or user not authenticated");
        setLoading(false);
        return;
      }

      try {
        console.log("[QuotePreview] Loading quote:", id);

        // Load quote and settings in parallel
        const [quoteData, settingsData] = await Promise.all([
          getQuote(user.id, id),
          getSettings(user.id, organizationId)
        ]);

        if (!quoteData) {
          setError("Quote not found");
          setLoading(false);
          return;
        }

        console.log("[QuotePreview] Quote loaded successfully");
        setQuote(quoteData);
        setSettings(settingsData);

        // Fetch visuals
        console.log("[QuotePreview] 🖼️ Fetching visuals for quote:", id);
        try {
          const visualsData = await visualsService.getVisuals(id);
          if (visualsData) {
            console.log("[QuotePreview] ✅ Visuals loaded:", visualsData);
            setVisuals(visualsData);
          }
        } catch (visualsError) {
          console.warn("[QuotePreview] ⚠️ Could not fetch visuals:", visualsError);
        }

        // 🚀 NEW: Fetch fresh items data for enrichment (similar to PublicQuoteView)
        console.log("[QuotePreview] 🔄 Fetching fresh items table data for enrichment...");
        const { supabase } = await import("@/integrations/supabase/client");
        const { data: itemsData, error: itemsError } = await supabase
          .from('items')
          .select('name, image_url, enhanced_description, category')
          .eq('user_id', user.id);

        if (itemsError) {
          console.warn("[QuotePreview] ⚠️ Could not fetch items table:", itemsError);
          setQuote(quoteData); // Use minimal data if enrichment fails
        } else if (itemsData) {
          // Create lookup map
          const itemsLookup = new Map();
          itemsData.forEach(item => {
            itemsLookup.set(item.name, {
              imageUrl: item.image_url,
              enhancedDescription: item.enhanced_description,
              category: item.category
            });
          });

          // Enrich items
          const enrichedItems = quoteData.items.map(quoteItem => {
            const freshData = itemsLookup.get(quoteItem.name);
            if (freshData) {
              return {
                ...quoteItem,
                imageUrl: freshData.imageUrl || quoteItem.imageUrl,
                enhancedDescription: freshData.enhancedDescription || quoteItem.enhancedDescription,
                category: freshData.category || quoteItem.category
              };
            }
            return quoteItem;
          });

          setQuote({ ...quoteData, items: enrichedItems });
        } else {
          setQuote(quoteData);
        }
      } catch (err) {
        console.error("[QuotePreview] Error loading data:", err);
        setError(err instanceof Error ? err.message : "Failed to load quote");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, user?.id]);

  if (loading) {
    return <LoadingFallback />;
  }

  if (error || !quote || !settings) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription>
              {error || "Quote not found"}
            </AlertDescription>
          </Alert>
          <Button onClick={() => navigate("/quotes")} className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Quotes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Preview Header Banner */}
      <div className="sticky top-0 z-50 bg-amber-500/95 backdrop-blur-sm border-b border-amber-600 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-amber-600 text-white border-amber-700 font-semibold">
              PREVIEW MODE
            </Badge>
            <p className="text-sm font-medium text-amber-950 hidden sm:block">
              This is how your proposal will appear to customers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/quotes/${id}`)}
              className="bg-white/90 hover:bg-white border-amber-600 text-amber-900"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Back to Edit</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/quotes/public/${id}`, "_blank")}
              className="bg-white/90 hover:bg-white border-amber-600 text-amber-900"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">View Public Link</span>
              <span className="sm:hidden">Public</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Proposal Content */}
      <div className="container mx-auto px-4 py-8">
        <ProposalViewer
          quote={quote}
          settings={settings}
          isReadOnly={true}
          onAccept={async () => { }}
          onDecline={async () => { }}
          onComment={async () => { }}
          visuals={visuals || undefined}
        />
      </div>

      {/* Preview Footer Note */}
      <div className="container mx-auto px-4 pb-8">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertDescription className="text-amber-900">
            💡 <strong>Preview Mode:</strong> This view shows how your proposal appears to customers.
            The public link requires email verification for security. Use the "View Public Link" button above to test the full customer experience.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
