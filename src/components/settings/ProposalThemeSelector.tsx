import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { CompanySettings } from "@/types";
import { getAllThemes, ProposalTheme } from "@/lib/proposal-themes";

interface ProposalThemeSelectorProps {
  settings: CompanySettings;
  onUpdate: (updates: Partial<CompanySettings>) => Promise<void>;
}

const themes = getAllThemes();

export function ProposalThemeSelector({ settings, onUpdate }: ProposalThemeSelectorProps) {
  const { isProTier, isBusinessTier, loading: authLoading } = useAuth();
  const currentTheme = settings.proposalTheme || "modern-corporate";

  // Tier Locking Configuration
  const THEME_TIERS: Record<string, 'free' | 'pro' | 'business'> = {
    "modern-corporate": "free",
    "minimalist": "free",
    "creative-studio": "pro",
    "elegant-serif": "pro",
    "bold-impact": "business",
    "tech-future": "business"
  };

  const isLocked = (themeId: string) => {
    if (authLoading) return false; // Optimistic unlock
    const tier = THEME_TIERS[themeId];
    if (tier === 'business' && !isBusinessTier) return true;
    if (tier === 'pro' && !isProTier) return true;
    return false;
  };

  const handleThemeSelect = async (themeId: ProposalTheme) => {
    if (isLocked(themeId)) {
      toast.error(`This theme requires the ${THEME_TIERS[themeId]} plan`, {
        description: "Upgrade to unlock premium proposal themes.",
        action: {
          label: "View Plans",
          onClick: () => window.location.href = '/settings?tab=subscription'
        }
      });
      return;
    }

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
        {themes.map((theme) => {
          const locked = isLocked(theme.id);
          const tier = THEME_TIERS[theme.id];

          return (
            <Card
              key={theme.id}
              className={`relative cursor-pointer transition-all ${currentTheme === theme.id
                ? "ring-2 ring-primary shadow-lg"
                : locked
                  ? "opacity-75 grayscale-[0.5]"
                  : "hover:border-primary/50 hover:shadow-lg"
                }`}
              onClick={() => handleThemeSelect(theme.id)}
            >
              <div className="relative">
                {/* Lock Overlay */}
                {locked && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/10 backdrop-blur-[1px]">
                    <Badge variant="secondary" className="bg-background/80 shadow-sm border-primary/20 backdrop-blur-md">
                      <Lock className="w-3 h-3 mr-1" />
                      {tier === 'business' ? 'Business' : 'Pro'}
                    </Badge>
                  </div>
                )}

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
                          className="w-8 h-8 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.colors.primary }}
                        />
                        <div
                          className="w-8 h-8 rounded-full shadow-sm"
                          style={{ backgroundColor: theme.colors.secondary }}
                        />
                        <div
                          className="w-8 h-8 rounded-full shadow-sm"
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
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base">{theme.name}</CardTitle>
                    {!locked && tier !== 'free' && (
                      <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-primary/20 text-primary capitalize">
                        {tier}
                      </Badge>
                    )}
                  </div>
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
          );
        })}
      </div>

      {!isBusinessTier && (
        <div className="rounded-lg bg-primary/5 border border-primary/10 p-4">
          <p className="text-sm text-primary/80 flex items-center gap-2">
            <Lock className="w-4 h-4" />
            Upgrade to <strong>Business</strong> to unlock Cinematic and Dynamic themes.
          </p>
        </div>
      )}
    </div>
  );
}
