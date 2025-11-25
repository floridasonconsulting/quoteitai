import { ProposalProvider, useProposal } from "@/contexts/ProposalContext";
import { ProposalEditorLayout } from "@/components/proposal/editor/ProposalEditorLayout";
import { ProposalBuilder } from "@/components/proposal/editor/ProposalBuilder";
import { ProposalViewer } from "@/components/proposal/viewer/ProposalViewer";
import { ProposalData } from "@/types/proposal";

// --- MOCK INITIAL DATA ---
const MOCK_INITIAL_DATA: ProposalData = {
  id: "prop_demo_123",
  status: "draft",
  settings: {
    theme: "corporate_sidebar",
    mode: "light",
    primaryColor: "#0f766e",
    currency: "$"
  },
  client: { name: "Acme Corp", email: "client@acme.com" },
  sender: {
    name: "John Builder",
    company: "Elite Constructions",
    logoUrl: "https://placehold.co/40x40/0f766e/ffffff?text=E"
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "sec_1",
      type: "hero",
      title: "Project Proposal",
      subtitle: "Custom Renovation Project • Q4 2025",
      backgroundImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2089&auto=format&fit=crop"
    },
    {
      id: "sec_2",
      type: "text",
      title: "Executive Summary",
      content: "<p>We are excited to present this proposal for your renovation project. Our team is dedicated to delivering high-quality craftsmanship and ensuring your vision comes to life.</p>"
    },
    {
      id: "sec_3",
      type: "line-items",
      title: "Scope of Work",
      showPrices: true,
      items: [
        { id: "item_1", name: "Demolition", desc: "Removal of existing fixtures and walls.", price: 2500, optional: false },
        { id: "item_2", name: "Framing", desc: "Structural framing for new layout.", price: 4000, optional: false },
        { id: "item_3", name: "Premium Fixtures", desc: "Upgrade to gold-plated fixtures.", price: 1500, optional: true }
      ]
    },
    {
      id: "sec_4",
      type: "pricing",
      title: "Investment Options",
      packages: [
        { id: "pkg_1", name: "Standard", price: 15000, features: ["Basic Materials", "Standard Warranty"], recommended: false },
        { id: "pkg_2", name: "Premium", price: 22000, features: ["High-end Materials", "Extended Warranty", "Priority Support"], recommended: true }
      ]
    },
    {
      id: "sec_5",
      type: "legal",
      title: "Terms & Conditions",
      content: "<p>Payment is due within 30 days of invoice. Work will commence upon receipt of deposit.</p>"
    }
  ]
};

function EditorContent() {
  const { proposal } = useProposal();
  
  return (
    <ProposalEditorLayout 
        builder={<ProposalBuilder />}
        preview={<ProposalViewer proposal={proposal} readOnly={true} />}
    />
  );
}

export default function ProposalEditor() {
  return (
    <ProposalProvider initialData={MOCK_INITIAL_DATA}>
        <EditorContent />
    </ProposalProvider>
  );
}
