import { useProposal } from "@/contexts/ProposalContext";
import { Button } from "@/components/ui/button";
import { GripVertical, Trash2, Plus, Image as ImageIcon, Type, List, DollarSign, FileText } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ProposalSection, ProposalItem } from "@/types/proposal";
import { useState } from "react";

export function SectionList() {
  const { proposal, updateSection, removeSection, addSection } = useProposal();
  const [aiLoading, setAiLoading] = useState<string | null>(null);

  const handleAddSection = (type: ProposalSection['type']) => {
    const newSection: ProposalSection = {
        id: crypto.randomUUID(),
        type,
        title: type === 'hero' ? 'New Cover Page' : type === 'line-items' ? 'Scope of Work' : type === 'pricing' ? 'Investment' : 'Section Title',
        content: type === 'text' ? '<p>Start typing here...</p>' : '',
        items: type === 'line-items' ? [] : undefined,
        packages: type === 'pricing' ? [] : undefined,
    };
    addSection(newSection);
  };

  const handleGenerateAI = async (sectionId: string) => {
    setAiLoading(sectionId);
    // Mock API Call
    setTimeout(() => {
        updateSection(sectionId, { 
            content: `<p><strong>AI Generated Content:</strong> Based on your industry, we recommend focusing on value propositions here. This section has been populated with placeholder text that you can refine.</p>`,
            subtitle: "AI Generated Subtitle for your proposal"
        });
        setAiLoading(null);
    }, 1500);
  };

  const handleAddItem = (sectionId: string) => {
    const section = proposal.sections.find(s => s.id === sectionId);
    if (!section) return;
    
    const newItem: ProposalItem = {
        id: crypto.randomUUID(),
        name: 'New Item',
        desc: 'Description',
        price: 0,
        optional: false
    };
    
    updateSection(sectionId, { items: [...(section.items || []), newItem] });
  };

  const handleUpdateItem = (sectionId: string, itemId: string, updates: Partial<ProposalItem>) => {
    const section = proposal.sections.find(s => s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = section.items.map(item => 
        item.id === itemId ? { ...item, ...updates } : item
    );
    updateSection(sectionId, { items: newItems });
  };

  const handleRemoveItem = (sectionId: string, itemId: string) => {
    const section = proposal.sections.find(s => s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = section.items.filter(item => item.id !== itemId);
    updateSection(sectionId, { items: newItems });
  };

  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full space-y-4">
        {proposal.sections.map((section, index) => (
            <AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-white shadow-sm px-2">
                <div className="flex items-center gap-2 py-2">
                    <GripVertical className="text-slate-400 cursor-grab w-4 h-4" />
                    <AccordionTrigger className="flex-1 hover:no-underline py-2 text-sm font-semibold">
                        {section.title || "Untitled Section"} 
                        <span className="ml-2 text-xs text-slate-400 font-normal uppercase px-2 py-0.5 bg-slate-100 rounded">{section.type}</span>
                    </AccordionTrigger>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() => removeSection(section.id)}>
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
                <AccordionContent className="pt-4 border-t border-slate-100 space-y-4 px-2">
                    <div className="space-y-2">
                        <Label>Section Title</Label>
                        <Input value={section.title} onChange={(e) => updateSection(section.id, { title: e.target.value })} />
                    </div>

                    {/* TYPE SPECIFIC EDITORS */}
                    {section.type === 'hero' && (
                        <>
                            <div className="space-y-2">
                                <Label>Subtitle</Label>
                                <div className="flex gap-2">
                                    <Input value={section.subtitle || ''} onChange={(e) => updateSection(section.id, { subtitle: e.target.value })} />
                                    <Button variant="outline" size="icon" onClick={() => handleGenerateAI(section.id)} disabled={aiLoading === section.id}>
                                        <Sparkles className={`w-4 h-4 text-purple-500 ${aiLoading === section.id ? 'animate-spin' : ''}`} />
                                    </Button>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Background Image URL</Label>
                                <Input value={section.backgroundImage || ''} onChange={(e) => updateSection(section.id, { backgroundImage: e.target.value })} />
                            </div>
                        </>
                    )}

                    {(section.type === 'text' || section.type === 'legal') && (
                        <div className="space-y-2">
                            <Label>Content (HTML Supported)</Label>
                            <div className="relative">
                                <Textarea 
                                    value={section.content || ''} 
                                    onChange={(e) => updateSection(section.id, { content: e.target.value })} 
                                    className="min-h-[200px] font-mono text-xs"
                                />
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute top-2 right-2 h-6 text-xs bg-white border border-slate-200 shadow-sm text-purple-600 hover:text-purple-700"
                                    onClick={() => handleGenerateAI(section.id)}
                                    disabled={aiLoading === section.id}
                                >
                                    <Sparkles className="w-3 h-3 mr-1" /> {aiLoading === section.id ? 'Generating...' : 'Generate with AI'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {section.type === 'line-items' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label>Show Prices Column</Label>
                                <Switch 
                                    checked={section.showPrices} 
                                    onCheckedChange={(checked) => updateSection(section.id, { showPrices: checked })} 
                                />
                            </div>
                            
                            <div className="space-y-3">
                                {section.items?.map((item, i) => (
                                    <div key={item.id} className="p-3 border rounded bg-slate-50 space-y-3">
                                        <div className="flex justify-between items-start gap-2">
                                            <Input 
                                                value={item.name} 
                                                onChange={(e) => handleUpdateItem(section.id, item.id, { name: e.target.value })}
                                                placeholder="Item Name"
                                                className="font-semibold bg-white"
                                            />
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() => handleRemoveItem(section.id, item.id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                        <Textarea 
                                            value={item.desc} 
                                            onChange={(e) => handleUpdateItem(section.id, item.id, { desc: e.target.value })}
                                            placeholder="Description"
                                            className="h-16 text-xs bg-white"
                                        />
                                        <div className="flex gap-3 items-center">
                                            <div className="flex-1 relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">$</span>
                                                <Input 
                                                    type="number" 
                                                    value={item.price} 
                                                    onChange={(e) => handleUpdateItem(section.id, item.id, { price: Number(e.target.value) })}
                                                    className="pl-6 bg-white"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Switch 
                                                    id={`opt-${item.id}`}
                                                    checked={item.optional} 
                                                    onCheckedChange={(checked) => handleUpdateItem(section.id, item.id, { optional: checked })} 
                                                />
                                                <Label htmlFor={`opt-${item.id}`} className="text-xs text-slate-500">Optional</Label>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                <Button variant="outline" className="w-full border-dashed" onClick={() => handleAddItem(section.id)}>
                                    <Plus className="w-4 h-4 mr-2" /> Add Line Item
                                </Button>
                            </div>
                        </div>
                    )}
                </AccordionContent>
            </AccordionItem>
        ))}
      </Accordion>

      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200">
        <Button variant="outline" size="sm" onClick={() => handleAddSection('text')}><Type className="w-4 h-4 mr-2"/> Text</Button>
        <Button variant="outline" size="sm" onClick={() => handleAddSection('hero')}><ImageIcon className="w-4 h-4 mr-2"/> Hero</Button>
        <Button variant="outline" size="sm" onClick={() => handleAddSection('line-items')}><List className="w-4 h-4 mr-2"/> Items</Button>
        <Button variant="outline" size="sm" onClick={() => handleAddSection('pricing')}><DollarSign className="w-4 h-4 mr-2"/> Pricing</Button>
        <Button variant="outline" size="sm" onClick={() => handleAddSection('legal')}><FileText className="w-4 h-4 mr-2"/> Legal</Button>
      </div>
    </div>
  );
}

// Helper icon component
function Sparkles({ className }: { className?: string }) {
    return (
        <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" />
            <path d="M9 5h4" />
            <path d="M6 7v2" />
        </svg>
    );
}
