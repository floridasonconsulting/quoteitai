import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
    title: string;
    description: string;
    tier: "Pro" | "Business";
    className?: string;
}

export function UpgradePrompt({ title, description, tier, className }: UpgradePromptProps) {
    const navigate = useNavigate();

    return (
        <div className={`p-6 border-2 border-dashed rounded-xl bg-muted/30 text-center space-y-4 ${className}`}>
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Lock className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-1">
                <h3 className="font-bold text-lg">{title}</h3>
                <p className="text-muted-foreground text-sm max-w-md mx-auto">
                    {description}
                </p>
            </div>
            <Button
                onClick={() => navigate("/settings")}
                variant="default"
                className="font-bold"
            >
                Upgrade to {tier}
            </Button>
        </div>
    );
}
