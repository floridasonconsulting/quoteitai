import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ProposalProvider, useProposal } from "@/contexts/ProposalContext";
import { ProposalEditorLayout } from "@/components/proposal/editor/ProposalEditorLayout";
import { ProposalBuilder } from "@/components/proposal/editor/ProposalBuilder";
import { ProposalViewer } from "@/components/proposal/viewer/ProposalViewer";
import { ProposalData } from "@/types/proposal";
import { Loader2 } from "lucide-react";

// Fallback data if no quote is passed
const DEFAULT_PROPOSAL: ProposalData = {
  id: "new_proposal",
  status: "draft",
  settings: {
    theme: "corporate_sidebar",
    mode: "light",
    primaryColor: "#0f766e",
    currency: "$"
  },
  client: { name: "", email: "" },
  sender: {
    name: "",
    company: "My Company",
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sections: [
    {
      id: "hero_default",
      type: "hero",
      title: "New Proposal",
      subtitle: "Created on " + new Date().toLocaleDateString(),
      backgroundImage: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80"
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
  const location = useLocation();
  const navigate = useNavigate();
  const [initialData, setInitialData] = useState<ProposalData | null>(null);

  useEffect(() => {
    // Check if proposal data was passed via navigation state
    if (location.state && location.state.proposalData) {
      setInitialData(location.state.proposalData);
    } else {
      // If accessed directly without state, redirect or show default
      // For now, we'll just use default but warn
      console.warn("No proposal data found in state, using default template.");
      setInitialData(DEFAULT_PROPOSAL);
    }
  }, [location.state, navigate]);

  if (!initialData) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  return (
    <ProposalProvider initialData={initialData}>
        <EditorContent />
    </ProposalProvider>
  );
}
