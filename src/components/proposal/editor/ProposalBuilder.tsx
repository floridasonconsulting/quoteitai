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

  const handleSave = () =&gt; {
    // In a real app, this would save to the backend
    console.log("Saving proposal:", proposal);
    toast.success("Proposal saved successfully!");
  };

  return (
    &lt;div className="flex flex-col h-full"&gt;
      &lt;div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50"&gt;
        &lt;div className="flex items-center gap-2"&gt;
            &lt;Button variant="ghost" size="icon" onClick={() =&gt; navigate('/quotes')}&gt;
                &lt;ArrowLeft className="w-4 h-4" /&gt;
            &lt;/Button&gt;
            &lt;div&gt;
                &lt;h1 className="font-bold text-slate-800 leading-tight"&gt;Editor&lt;/h1&gt;
                &lt;p className="text-[10px] text-slate-500 font-mono"&gt;{proposal.id}&lt;/p&gt;
            &lt;/div&gt;
        &lt;/div&gt;
        &lt;Button size="sm" className="gap-2" onClick={handleSave}&gt;
            &lt;Save className="w-4 h-4" /&gt; Save
        &lt;/Button&gt;
      &lt;/div&gt;

      &lt;Tabs defaultValue="sections" className="flex-1 flex flex-col overflow-hidden"&gt;
        &lt;div className="px-4 pt-4 bg-white"&gt;
            &lt;TabsList className="w-full grid grid-cols-3 bg-slate-100"&gt;
                &lt;TabsTrigger value="settings"&gt;Settings&lt;/TabsTrigger&gt;
                &lt;TabsTrigger value="sections"&gt;Sections&lt;/TabsTrigger&gt;
                &lt;TabsTrigger value="client"&gt;Client&lt;/TabsTrigger&gt;
            &lt;/TabsList&gt;
        &lt;/div&gt;

        &lt;div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-slate-200"&gt;
            &lt;TabsContent value="settings" className="mt-0 h-full"&gt;
                &lt;GlobalSettingsForm /&gt;
            &lt;/TabsContent&gt;
            &lt;TabsContent value="sections" className="mt-0 h-full pb-20"&gt;
                &lt;SectionList /&gt;
            &lt;/TabsContent&gt;
            &lt;TabsContent value="client" className="mt-0 h-full"&gt;
                &lt;div className="p-8 text-center border-2 border-dashed rounded-lg text-slate-400"&gt;
                    &lt;p&gt;Client details form coming soon.&lt;/p&gt;
                    &lt;p className="text-xs mt-2"&gt;Configured in main quote settings currently.&lt;/p&gt;
                &lt;/div&gt;
            &lt;/TabsContent&gt;
        &lt;/div&gt;
      &lt;/Tabs&gt;
    &lt;/div&gt;
  );
}
