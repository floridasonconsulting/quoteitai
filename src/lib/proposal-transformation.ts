import { Quote, Customer, Item, CompanySettings } from "@/types";
import { ProposalData, ProposalSection, ProposalItem } from "@/types/proposal";

export function transformQuoteToProposal(
  quote: Quote,
  customer?: Customer,
  settings?: CompanySettings
): ProposalData {
  // Default to branding from settings or generic fallback
  const primaryColor = settings?.primaryColor || "#0f766e";
  const currency = "$"; // Could be pulled from settings if available

  // 1. Transform Items to Proposal Items
  const proposalItems: ProposalItem[] = quote.items.map(item => ({
    id: item.itemId || crypto.randomUUID(),
    name: item.name,
    desc: item.description || "",
    price: item.price,
    quantity: item.quantity,
    units: item.units,
    optional: false, // Default existing items to required
  }));

  // 2. Build Sections
  const sections: ProposalSection[] = [];

  // Hero Section
  sections.push({
    id: "hero",
    type: "hero",
    title: quote.title,
    subtitle: `Quote #${quote.quoteNumber} • ${new Date(quote.createdAt).toLocaleDateString()}`,
    backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80", // Default professional background
  });

  // Executive Summary (if exists)
  if (quote.executiveSummary) {
    sections.push({
      id: "summary",
      type: "text",
      title: "Executive Summary",
      content: quote.executiveSummary,
    });
  }

  // Line Items
  if (proposalItems.length > 0) {
    sections.push({
      id: "items",
      type: "line-items",
      title: "Schedule of Values",
      showPrices: true,
      items: proposalItems,
    });
  }

  // Notes / Terms
  if (quote.notes) {
    sections.push({
      id: "notes",
      type: "text",
      title: "Notes",
      content: quote.notes.replace(/\n/g, "<br/>"),
    });
  }

  // Legal / Terms from Settings
  if (settings?.terms) {
    sections.push({
      id: "terms",
      type: "legal",
      title: "Terms & Conditions",
      content: settings.terms.replace(/\n/g, "<br/>"),
    });
  }

  return {
    id: quote.id,
    status: quote.status as any, // Cast status to match if close enough
    settings: {
      theme: (settings?.proposalTemplate as any) === "presentation_deck" ? "presentation_deck" : "corporate_sidebar",
      mode: "light",
      primaryColor: primaryColor,
      currency: currency,
    },
    client: {
      name: quote.customerName,
      email: customer?.email || "",
      address: customer?.address || "",
      company: customer?.name, // Assuming customer name might be company name
    },
    sender: {
      name: settings?.name || "Sales Team",
      company: settings?.name || "Our Company",
      logoUrl: settings?.logo || undefined,
    },
    sections: sections,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
  };
}
