import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { FileText, CheckCircle2, AlertCircle } from "lucide-react";

interface NavigationSection {
  id: string;
  label: string;
  index: number;
  type: 'summary' | 'category' | 'terms';
}

interface ProposalNavigationProps {
  sections: NavigationSection[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  className?: string;
}

/**
 * Sidebar Navigation for Proposal Sections
 * Desktop: Fixed sidebar | Mobile: Drawer/Sheet
 */
export function ProposalNavigation({
  sections,
  activeIndex,
  onNavigate,
  className,
}: ProposalNavigationProps) {
  const getIcon = (type: NavigationSection['type']) => {
    switch (type) {
      case 'summary':
        return <FileText className="w-4 h-4" />;
      case 'terms':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <CheckCircle2 className="w-4 h-4" />;
    }
  };

  return (
    <nav className={cn("flex flex-col gap-2 p-4", className)}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          Proposal Sections
        </h2>
        <p className="text-xs text-muted-foreground">
          Navigate through the proposal
        </p>
      </div>

      {/* Navigation Links */}
      <div className="space-y-1">
        {sections.map((section) => {
          const isActive = activeIndex === section.index;

          return (
            <motion.button
              key={section.id}
              onClick={() => onNavigate(section.index)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200",
                "hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
              style={isActive ? {
                backgroundColor: 'var(--theme-primary)',
                color: 'white'
              } : {}}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
            >
              <span className="flex-shrink-0" style={{ color: isActive ? 'white' : undefined }}>
                {getIcon(section.type)}
              </span>
              <span className="text-sm font-medium" style={{ color: isActive ? 'white' : undefined }}>
                {section.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}