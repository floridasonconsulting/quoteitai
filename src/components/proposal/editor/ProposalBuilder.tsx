import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProposal } from "@/contexts/ProposalContext";
import { GlobalSettingsForm } from "./GlobalSettingsForm";
import { SectionList } from "./SectionList";
import { Button } from "@/components/ui/button";
import { Save, ArrowLeft, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ProposalBuilder() {
  const { proposal } = useProposal();
  const navigate = useNavigate();

  const handleSave = () => {
    // In a real app, this would save to the backend
    console.log("Saving proposal:", proposal);
    toast.success("Proposal saved successfully!");
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/quotes')}>
                <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
                <h1 className="font-bold text-slate-800 leading-tight">Editor</h1>
                <p className="text-[10px] text-slate-500 font-mono">{proposal.id}</p>
            </div>
        </div>
        <Button size="sm" className="gap-2" onClick={handleSave}>
            <Save className="w-4 h-4" /> Save
        </Button>
      </div>

      <Tabs defaultValue="sections" className="flex-1 flex flex-col overflow-hidden">
        <div className="px-4 pt-4 bg-white">
            <TabsList className="w-full grid grid-cols-3 bg-slate-100">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="sections">Sections</TabsTrigger>
                <TabsTrigger value="client">Client</TabsTrigger>
            </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200">
            <TabsContent value="settings" className="mt-0 h-full">
                <GlobalSettingsForm />
            </TabsContent>
            <TabsContent value="sections" className="mt-0 h-full pb-20">
                <SectionList />
            </TabsContent>
            <TabsContent value="client" className="mt-0 h-full">
                <div className="p-8 text-center border-2 border-dashed rounded-lg text-slate-400">
                    <p>Client details form coming soon.</p>
                    <p className="text-xs mt-2">Configured in main quote settings currently.</p>
                </div>
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
