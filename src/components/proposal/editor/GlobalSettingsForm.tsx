import { useProposal } from "@/contexts/ProposalContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";

export function GlobalSettingsForm() {
  const { proposal, updateSettings } = useProposal();
  const { settings } = proposal;

  return (
    &lt;div className="space-y-6 p-1"&gt;
      &lt;div className="space-y-4"&gt;
        &lt;h3 className="font-semibold text-lg flex items-center gap-2"&gt;
            &lt;Palette className="w-4 h-4 text-teal-600" /&gt; Look &amp; Feel
        &lt;/h3&gt;
        
        &lt;div className="space-y-2"&gt;
            &lt;Label&gt;Theme Layout&lt;/Label&gt;
            &lt;Select 
                value={settings.theme} 
                onValueChange={(val: any) =&gt; updateSettings({ theme: val })}
            &gt;
                &lt;SelectTrigger&gt;
                    &lt;SelectValue /&gt;
                &lt;/SelectTrigger&gt;
                &lt;SelectContent&gt;
                    &lt;SelectItem value="corporate_sidebar"&gt;Corporate Sidebar (Sticky Nav)&lt;/SelectItem&gt;
                    &lt;SelectItem value="modern_scroll"&gt;Modern Scroll (Single Page)&lt;/SelectItem&gt;
                    &lt;SelectItem value="presentation_deck"&gt;Presentation Deck (Slides)&lt;/SelectItem&gt;
                &lt;/SelectContent&gt;
            &lt;/Select&gt;
        &lt;/div&gt;

        &lt;div className="space-y-2"&gt;
            &lt;Label&gt;Color Mode&lt;/Label&gt;
            &lt;div className="grid grid-cols-3 gap-2"&gt;
                &lt;Button 
                    variant={settings.mode === 'light' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() =&gt; updateSettings({ mode: 'light' })}
                &gt;
                    &lt;Sun className="w-4 h-4 mr-2" /&gt; Clean
                &lt;/Button&gt;
                &lt;Button 
                    variant={settings.mode === 'dark' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() =&gt; updateSettings({ mode: 'dark' })}
                &gt;
                    &lt;Moon className="w-4 h-4 mr-2" /&gt; Dark
                &lt;/Button&gt;
                &lt;Button 
                    variant={settings.mode === 'vibrant' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() =&gt; updateSettings({ mode: 'vibrant' })}
                &gt;
                    &lt;Palette className="w-4 h-4 mr-2" /&gt; Vibrant
                &lt;/Button&gt;
            &lt;/div&gt;
        &lt;/div&gt;

        &lt;div className="grid grid-cols-2 gap-4"&gt;
            &lt;div className="space-y-2"&gt;
                &lt;Label&gt;Primary Color&lt;/Label&gt;
                &lt;div className="flex gap-2"&gt;
                    &lt;div className="w-8 h-8 rounded border border-slate-200" style={{ backgroundColor: settings.primaryColor }}&gt;&lt;/div&gt;
                    &lt;Input 
                        value={settings.primaryColor} 
                        onChange={(e) =&gt; updateSettings({ primaryColor: e.target.value })} 
                        className="font-mono"
                    /&gt;
                &lt;/div&gt;
            &lt;/div&gt;
            &lt;div className="space-y-2"&gt;
                &lt;Label&gt;Currency Symbol&lt;/Label&gt;
                &lt;Input 
                    value={settings.currency} 
                    onChange={(e) =&gt; updateSettings({ currency: e.target.value })} 
                    className="font-mono"
                    maxLength={3}
                /&gt;
            &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
