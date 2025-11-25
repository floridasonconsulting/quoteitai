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
  const [aiLoading, setAiLoading] = useState&lt;string | null&gt;(null);

  const handleAddSection = (type: ProposalSection['type']) =&gt; {
    const newSection: ProposalSection = {
        id: crypto.randomUUID(),
        type,
        title: type === 'hero' ? 'New Cover Page' : type === 'line-items' ? 'Scope of Work' : type === 'pricing' ? 'Investment' : 'Section Title',
        content: type === 'text' ? '&lt;p&gt;Start typing here...&lt;/p&gt;' : '',
        items: type === 'line-items' ? [] : undefined,
        packages: type === 'pricing' ? [] : undefined,
    };
    addSection(newSection);
  };

  const handleGenerateAI = async (sectionId: string) =&gt; {
    setAiLoading(sectionId);
    // Mock API Call
    setTimeout(() =&gt; {
        updateSection(sectionId, { 
            content: `&lt;p&gt;&lt;strong&gt;AI Generated Content:&lt;/strong&gt; Based on your industry, we recommend focusing on value propositions here. This section has been populated with placeholder text that you can refine.&lt;/p&gt;`,
            subtitle: "AI Generated Subtitle for your proposal"
        });
        setAiLoading(null);
    }, 1500);
  };

  const handleAddItem = (sectionId: string) =&gt; {
    const section = proposal.sections.find(s =&gt; s.id === sectionId);
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

  const handleUpdateItem = (sectionId: string, itemId: string, updates: Partial&lt;ProposalItem&gt;) =&gt; {
    const section = proposal.sections.find(s =&gt; s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = section.items.map(item =&gt; 
        item.id === itemId ? { ...item, ...updates } : item
    );
    updateSection(sectionId, { items: newItems });
  };

  const handleRemoveItem = (sectionId: string, itemId: string) =&gt; {
    const section = proposal.sections.find(s =&gt; s.id === sectionId);
    if (!section || !section.items) return;

    const newItems = section.items.filter(item =&gt; item.id !== itemId);
    updateSection(sectionId, { items: newItems });
  };

  return (
    &lt;div className="space-y-6"&gt;
      &lt;Accordion type="single" collapsible className="w-full space-y-4"&gt;
        {proposal.sections.map((section, index) =&gt; (
            &lt;AccordionItem key={section.id} value={section.id} className="border rounded-lg bg-white shadow-sm px-2"&gt;
                &lt;div className="flex items-center gap-2 py-2"&gt;
                    &lt;GripVertical className="text-slate-400 cursor-grab w-4 h-4" /&gt;
                    &lt;AccordionTrigger className="flex-1 hover:no-underline py-2 text-sm font-semibold"&gt;
                        {section.title || "Untitled Section"} 
                        &lt;span className="ml-2 text-xs text-slate-400 font-normal uppercase px-2 py-0.5 bg-slate-100 rounded"&gt;{section.type}&lt;/span&gt;
                    &lt;/AccordionTrigger&gt;
                    &lt;Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500" onClick={() =&gt; removeSection(section.id)}&gt;
                        &lt;Trash2 className="w-4 h-4" /&gt;
                    &lt;/Button&gt;
                &lt;/div&gt;
                &lt;AccordionContent className="pt-4 border-t border-slate-100 space-y-4 px-2"&gt;
                    &lt;div className="space-y-2"&gt;
                        &lt;Label&gt;Section Title&lt;/Label&gt;
                        &lt;Input value={section.title} onChange={(e) =&gt; updateSection(section.id, { title: e.target.value })} /&gt;
                    &lt;/div&gt;

                    {/* TYPE SPECIFIC EDITORS */}
                    {section.type === 'hero' &amp;&amp; (
                        &lt;&gt;
                            &lt;div className="space-y-2"&gt;
                                &lt;Label&gt;Subtitle&lt;/Label&gt;
                                &lt;div className="flex gap-2"&gt;
                                    &lt;Input value={section.subtitle || ''} onChange={(e) =&gt; updateSection(section.id, { subtitle: e.target.value })} /&gt;
                                    &lt;Button variant="outline" size="icon" onClick={() =&gt; handleGenerateAI(section.id)} disabled={aiLoading === section.id}&gt;
                                        &lt;Sparkles className={`w-4 h-4 text-purple-500 ${aiLoading === section.id ? 'animate-spin' : ''}`} /&gt;
                                    &lt;/Button&gt;
                                &lt;/div&gt;
                            &lt;/div&gt;
                            &lt;div className="space-y-2"&gt;
                                &lt;Label&gt;Background Image URL&lt;/Label&gt;
                                &lt;Input value={section.backgroundImage || ''} onChange={(e) =&gt; updateSection(section.id, { backgroundImage: e.target.value })} /&gt;
                            &lt;/div&gt;
                        &lt;/&gt;
                    )}

                    {(section.type === 'text' || section.type === 'legal') &amp;&amp; (
                        &lt;div className="space-y-2"&gt;
                            &lt;Label&gt;Content (HTML Supported)&lt;/Label&gt;
                            &lt;div className="relative"&gt;
                                &lt;Textarea 
                                    value={section.content || ''} 
                                    onChange={(e) =&gt; updateSection(section.id, { content: e.target.value })} 
                                    className="min-h-[200px] font-mono text-xs"
                                /&gt;
                                &lt;Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="absolute top-2 right-2 h-6 text-xs bg-white border border-slate-200 shadow-sm text-purple-600 hover:text-purple-700"
                                    onClick={() =&gt; handleGenerateAI(section.id)}
                                    disabled={aiLoading === section.id}
                                &gt;
                                    &lt;Sparkles className="w-3 h-3 mr-1" /&gt; {aiLoading === section.id ? 'Generating...' : 'Generate with AI'}
                                &lt;/Button&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;
                    )}

                    {section.type === 'line-items' &amp;&amp; (
                        &lt;div className="space-y-4"&gt;
                            &lt;div className="flex items-center justify-between"&gt;
                                &lt;Label&gt;Show Prices Column&lt;/Label&gt;
                                &lt;Switch 
                                    checked={section.showPrices} 
                                    onCheckedChange={(checked) =&gt; updateSection(section.id, { showPrices: checked })} 
                                /&gt;
                            &lt;/div&gt;
                            
                            &lt;div className="space-y-3"&gt;
                                {section.items?.map((item, i) =&gt; (
                                    &lt;div key={item.id} className="p-3 border rounded bg-slate-50 space-y-3"&gt;
                                        &lt;div className="flex justify-between items-start gap-2"&gt;
                                            &lt;Input 
                                                value={item.name} 
                                                onChange={(e) =&gt; handleUpdateItem(section.id, item.id, { name: e.target.value })}
                                                placeholder="Item Name"
                                                className="font-semibold bg-white"
                                            /&gt;
                                            &lt;Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-500 hover:bg-red-50" onClick={() =&gt; handleRemoveItem(section.id, item.id)}&gt;
                                                &lt;Trash2 className="w-4 h-4" /&gt;
                                            &lt;/Button&gt;
                                        &lt;/div&gt;
                                        &lt;Textarea 
                                            value={item.desc} 
                                            onChange={(e) =&gt; handleUpdateItem(section.id, item.id, { desc: e.target.value })}
                                            placeholder="Description"
                                            className="h-16 text-xs bg-white"
                                        /&gt;
                                        &lt;div className="flex gap-3 items-center"&gt;
                                            &lt;div className="flex-1 relative"&gt;
                                                &lt;span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"&gt;$&lt;/span&gt;
                                                &lt;Input 
                                                    type="number" 
                                                    value={item.price} 
                                                    onChange={(e) =&gt; handleUpdateItem(section.id, item.id, { price: Number(e.target.value) })}
                                                    className="pl-6 bg-white"
                                                /&gt;
                                            &lt;/div&gt;
                                            &lt;div className="flex items-center gap-2"&gt;
                                                &lt;Switch 
                                                    id={`opt-${item.id}`}
                                                    checked={item.optional} 
                                                    onCheckedChange={(checked) =&gt; handleUpdateItem(section.id, item.id, { optional: checked })} 
                                                /&gt;
                                                &lt;Label htmlFor={`opt-${item.id}`} className="text-xs text-slate-500"&gt;Optional&lt;/Label&gt;
                                            &lt;/div&gt;
                                        &lt;/div&gt;
                                    &lt;/div&gt;
                                ))}
                                &lt;Button variant="outline" className="w-full border-dashed" onClick={() =&gt; handleAddItem(section.id)}&gt;
                                    &lt;Plus className="w-4 h-4 mr-2" /&gt; Add Line Item
                                &lt;/Button&gt;
                            &lt;/div&gt;
                        &lt;/div&gt;
                    )}
                &lt;/AccordionContent&gt;
            &lt;/AccordionItem&gt;
        ))}
      &lt;/Accordion&gt;

      &lt;div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-200"&gt;
        &lt;Button variant="outline" size="sm" onClick={() =&gt; handleAddSection('text')}&gt;&lt;Type className="w-4 h-4 mr-2"/&gt; Text&lt;/Button&gt;
        &lt;Button variant="outline" size="sm" onClick={() =&gt; handleAddSection('hero')}&gt;&lt;ImageIcon className="w-4 h-4 mr-2"/&gt; Hero&lt;/Button&gt;
        &lt;Button variant="outline" size="sm" onClick={() =&gt; handleAddSection('line-items')}&gt;&lt;List className="w-4 h-4 mr-2"/&gt; Items&lt;/Button&gt;
        &lt;Button variant="outline" size="sm" onClick={() =&gt; handleAddSection('pricing')}&gt;&lt;DollarSign className="w-4 h-4 mr-2"/&gt; Pricing&lt;/Button&gt;
        &lt;Button variant="outline" size="sm" onClick={() =&gt; handleAddSection('legal')}&gt;&lt;FileText className="w-4 h-4 mr-2"/&gt; Legal&lt;/Button&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}

// Helper icon component
function Sparkles({ className }: { className?: string }) {
    return (
        &lt;svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"&gt;
            &lt;path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /&gt;
            &lt;path d="M5 3v4" /&gt;
            &lt;path d="M9 5h4" /&gt;
            &lt;path d="M6 7v2" /&gt;
        &lt;/svg&gt;
    );
}
