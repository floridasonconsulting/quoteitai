import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center rounded-lg border-2 border-dashed">
      <div className="rounded-full bg-primary/10 p-6 mb-4">
        <Icon className="h-12 w-12 text-primary" />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-md">{description}</p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        {action && (
          <Button size="lg" onClick={action.onClick} data-demo="empty-state-primary-action">
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick} data-demo="empty-state-secondary-action">
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
