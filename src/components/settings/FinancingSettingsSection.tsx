import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CompanySettings } from "@/types";
import { CreditCard, ExternalLink } from "lucide-react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FinancingSettingsSectionProps {
    settings: CompanySettings;
    onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

export function FinancingSettingsSection({ settings, onUpdate }: FinancingSettingsSectionProps) {
    const [financingText, setFinancingText] = useState(settings.financingText || "");
    const [financingLink, setFinancingLink] = useState(settings.financingLink || "");
    const [isSaving, setIsSaving] = useState(false);

    // Sync with settings when they change externally
    useEffect(() => {
        setFinancingText(settings.financingText || "");
        setFinancingLink(settings.financingLink || "");
    }, [settings.financingText, settings.financingLink]);

    const hasChanges = financingText !== (settings.financingText || "") ||
        financingLink !== (settings.financingLink || "");

    const handleSave = async () => {
        try {
            setIsSaving(true);
            await onUpdate({
                financingText: financingText,
                financingLink: financingLink
            });
            toast.success("Financing settings saved");
        } catch (error) {
            console.error("Failed to save financing settings:", error);
            toast.error("Failed to save financing settings");
        } finally {
            setIsSaving(false);
        }
    };
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
                                value={financingText}
                                onChange={(e) => setFinancingText(e.target.value)}
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
                                    value={financingLink}
                                    onChange={(e) => setFinancingLink(e.target.value)}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                The website where clients can apply for or learn about financing
                            </p>
                        </div>

                        {hasChanges && (
                            <div className="flex justify-end pt-2">
                                <Button
                                    size="sm"
                                    onClick={handleSave}
                                    disabled={isSaving}
                                >
                                    {isSaving ? "Saving..." : "Save Financing Info"}
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
