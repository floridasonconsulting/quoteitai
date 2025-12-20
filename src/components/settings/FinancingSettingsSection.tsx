import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CompanySettings } from "@/types";
import { CreditCard, ExternalLink } from "lucide-react";

interface FinancingSettingsSectionProps {
    settings: CompanySettings;
    onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function FinancingSettingsSection({ settings, onUpdate }: FinancingSettingsSectionProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-primary" />
                    Financing Options
                </CardTitle>
                <CardDescription>
                    Configure financing information to be displayed on your proposals
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                        <Label htmlFor="show-financing">Show Financing Info</Label>
                        <p className="text-sm text-muted-foreground">
                            Display a financing call-to-action on the investment summary page
                        </p>
                    </div>
                    <Switch
                        id="show-financing"
                        checked={settings.showFinancing || false}
                        onCheckedChange={(checked) => onUpdate({ showFinancing: checked })}
                    />
                </div>

                {settings.showFinancing && (
                    <div className="space-y-4 pt-4 border-t">
                        <div className="space-y-2">
                            <Label htmlFor="financing-text">Financing Text</Label>
                            <Input
                                id="financing-text"
                                placeholder="e.g. Flexible financing available through our partners"
                                value={settings.financingText || ""}
                                onChange={(e) => onUpdate({ financingText: e.target.value })}
                            />
                            <p className="text-xs text-muted-foreground">
                                This text will appear above the financing link on the proposal
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="financing-link">Financing URL</Label>
                            <div className="relative">
                                <ExternalLink className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="financing-link"
                                    className="pl-10"
                                    placeholder="https://your-financing-partner.com"
                                    type="url"
                                    value={settings.financingLink || ""}
                                    onChange={(e) => onUpdate({ financingLink: e.target.value })}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The website where clients can apply for or learn about financing
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
