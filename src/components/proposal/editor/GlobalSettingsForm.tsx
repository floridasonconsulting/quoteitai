import { useProposal } from "@/contexts/ProposalContext";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Palette } from "lucide-react";
import { ProposalTheme } from "@/types/proposal";

export function GlobalSettingsForm() {
  const { proposal, updateSettings } = useProposal();
  const { settings } = proposal;

  return (
    <div className="space-y-6 p-1">
      <div className="space-y-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
            <Palette className="w-4 h-4 text-teal-600" /> Look & Feel
        </h3>
        
        <div className="space-y-2">
            <Label>Theme Layout</Label>
            <Select 
                value={settings.theme} 
                onValueChange={(val) => updateSettings({ theme: val as ProposalTheme })}
            >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="corporate_sidebar">Corporate Sidebar (Sticky Nav)</SelectItem>
                    <SelectItem value="modern_scroll">Modern Scroll (Single Page)</SelectItem>
                    <SelectItem value="presentation_deck">Presentation Deck (Slides)</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="space-y-2">
            <Label>Color Mode</Label>
            <div className="grid grid-cols-3 gap-2">
                <Button 
                    variant={settings.mode === 'light' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => updateSettings({ mode: 'light' })}
                >
                    <Sun className="w-4 h-4 mr-2" /> Clean
                </Button>
                <Button 
                    variant={settings.mode === 'dark' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => updateSettings({ mode: 'dark' })}
                >
                    <Moon className="w-4 h-4 mr-2" /> Dark
                </Button>
                <Button 
                    variant={settings.mode === 'vibrant' ? 'default' : 'outline'} 
                    className="justify-start"
                    onClick={() => updateSettings({ mode: 'vibrant' })}
                >
                    <Palette className="w-4 h-4 mr-2" /> Vibrant
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                    <div className="w-8 h-8 rounded border border-slate-200" style={{ backgroundColor: settings.primaryColor }}></div>
                    <Input 
                        value={settings.primaryColor} 
                        onChange={(e) => updateSettings({ primaryColor: e.target.value })} 
                        className="font-mono"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Currency Symbol</Label>
                <Input 
                    value={settings.currency} 
                    onChange={(e) => updateSettings({ currency: e.target.value })} 
                    className="font-mono"
                    maxLength={3}
                />
            </div>
        </div>
      </div>
    </div>
  );
}
