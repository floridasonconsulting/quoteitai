import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";
import { Quote, CompanySettings } from "@/types";
import { transformQuoteToProposal } from "@/lib/proposal-transformation";
import { ProposalCover } from "./ProposalCover";
import { ProposalNavigation } from "./ProposalNavigation";
import { ProposalContentSlider } from "./ProposalContentSlider";
import { ProposalActionBar } from "./ProposalActionBar";
import { ProposalSuccessStates, SuccessType } from "./ProposalSuccessStates";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface ProposalViewerProps {
  quote: Quote;
  settings: CompanySettings;
  onAccept: () => Promise<void>;
  onDecline: () => Promise<void>;
  onComment: (comment: string) => Promise<void>;
  isReadOnly?: boolean;
}

export function ProposalViewer({
  quote,
  settings,
  onAccept,
  onDecline,
  onComment,
  isReadOnly = false
}: ProposalViewerProps) {
  // State
  const [stage, setStage] = useState<'cover' | 'content'>('cover');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [successState, setSuccessState] = useState<SuccessType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Data Transformation
  const proposalData = useMemo(() => {
    // Mock visuals for now - in real app this would come from DB
    const mockVisuals = {
      coverImage: quote.items.find(i => i.imageUrl)?.imageUrl, // Use first item image as fallback
      logo: settings.logo,
    };
    return transformQuoteToProposal(quote, settings, mockVisuals);
  }, [quote, settings]);

  // Theme handling
  const { setTheme } = useTheme();
  
  useEffect(() => {
    // Enforce light mode for proposal viewer by default unless specified
    setTheme('light');
  }, [setTheme]);

  // Navigation Items Generation
  const navigationItems = useMemo(() => {
    return proposalData.sections.map((section, index) => ({
      id: section.id,
      label: section.title || 'Untitled Section',
      index: index,
      type: (section.type === 'lineItems' ? 'summary' : 
             section.type === 'legal' ? 'terms' : 'category') as any
    }));
  }, [proposalData.sections]);

  // Handlers
  const handleAccept = async () => {
    setIsProcessing(true);
    try {
      await onAccept();
      setSuccessState('accepted');
    } catch (error) {
      console.error("Failed to accept:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    try {
      await onDecline();
      setSuccessState('declined');
    } catch (error) {
      console.error("Failed to decline:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleComment = async () => {
    // Simple prompt for MVP - replace with proper dialog later
    const comment = window.prompt("Please enter your feedback:");
    if (!comment) return;

    setIsProcessing(true);
    try {
      await onComment(comment);
      setSuccessState('commented');
    } catch (error) {
      console.error("Failed to send comment:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Render
  return (
    <div className="h-screen w-full bg-background overflow-hidden font-sans">
      <AnimatePresence mode="wait">
        {/* STAGE 1: COVER */}
        {stage === 'cover' && (
          <ProposalCover 
            key="cover"
            companyName={proposalData.sender?.company || "Company Name"}
            projectTitle={proposalData.sections.find(s => s.type === 'hero')?.title || "Project Proposal"}
            clientName={proposalData.client.name}
            coverImage={proposalData.visuals?.coverImage}
            onEnter={() => setStage('content')}
          />
        )}

        {/* STAGE 2: MAIN CONTENT */}
        {stage === 'content' && !successState && (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col md:flex-row relative"
          >
            {/* Mobile Navigation (Drawer) */}
            <div className="md:hidden absolute top-4 left-4 z-40">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-white/80 backdrop-blur">
                    <Menu className="w-5 h-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-64 p-0">
                  <ProposalNavigation 
                    sections={navigationItems}
                    activeIndex={activeSlideIndex}
                    onNavigate={setActiveSlideIndex}
                    className="h-full"
                  />
                </SheetContent>
              </Sheet>
            </div>

            {/* Desktop Navigation (Sidebar) */}
            <div className="hidden md:block w-64 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
              <div className="p-6">
                {settings.logo && (
                  <img src={settings.logo} alt="Logo" className="h-8 w-auto mb-8" />
                )}
              </div>
              <ProposalNavigation 
                sections={navigationItems}
                activeIndex={activeSlideIndex}
                onNavigate={setActiveSlideIndex}
              />
            </div>

            {/* Main Content Slider */}
            <div className="flex-1 h-full relative">
              <ProposalContentSlider 
                sections={proposalData.sections}
                activeIndex={activeSlideIndex}
                onSlideChange={setActiveSlideIndex}
              />
            </div>

            {/* Sticky Action Bar */}
            {!isReadOnly && (
              <ProposalActionBar 
                totalAmount={quote.total}
                currency={settings.currency || 'USD'}
                onAccept={handleAccept}
                onDecline={handleDecline}
                onComment={handleComment}
                isProcessing={isProcessing}
              />
            )}
          </motion.div>
        )}

        {/* STAGE 3: SUCCESS STATES */}
        {successState && (
          <ProposalSuccessStates 
            key="success"
            type={successState}
            salesRepName={settings.name}
            onReturn={() => setSuccessState(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}