import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { CompanySettings } from "@/types";
import { getAllThemes, ProposalTheme } from "@/lib/proposal-themes";

interface ProposalThemeSelectorProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

const themes = getAllThemes();

export function ProposalThemeSelector({ settings, onUpdate }: ProposalThemeSelectorProps) {
  const currentTheme = settings.proposalTheme || "modern-corporate";

  const handleThemeSelect = async (themeId: ProposalTheme) => {
    try {
      await onUpdate({ proposalTheme: themeId });
    } catch (error) {
      console.error("[ProposalThemeSelector] Failed to update theme:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold">Proposal Visual Theme</h3>
        <p className="text-sm text-muted-foreground">
          Choose how your proposals appear to customers. Each theme provides a unique visual experience while maintaining professionalism.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map((theme) => (
          <Card
            key={theme.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              currentTheme === theme.id
                ? "ring-2 ring-primary shadow-lg"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleThemeSelect(theme.id)}
          >
            <div className="relative">
              {/* Theme Preview with Color Sample */}
              <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                {/* Color preview based on theme */}
                <div 
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ 
                    background: theme.colors.background,
                    fontFamily: theme.typography.fontFamily.heading
                  }}
                >
                  <div className="text-center space-y-2 p-4">
                    <div 
                      className="text-2xl font-bold"
                      style={{ color: theme.colors.primary }}
                    >
                      {theme.name}
                    </div>
                    <div className="flex gap-2 justify-center">
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: theme.colors.secondary }}
                      />
                      <div 
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: theme.colors.accent }}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Selection Badge */}
                {currentTheme === theme.id && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-primary text-primary-foreground flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Active
                    </Badge>
                  </div>
                )}
              </div>

              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base">{theme.name}</CardTitle>
                <CardDescription className="text-xs">
                  {theme.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 pt-2">
                <ul className="space-y-1">
                  {theme.features.map((feature, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="text-primary">•</span>
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </div>
          </Card>
        ))}
      </div>

      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          💡 <strong>Tip:</strong> Preview your proposal before sending to see how it appears with the selected theme. 
          Use the internal preview from the quote detail page to test different themes.
        </p>
      </div>
    </div>
  );
}
