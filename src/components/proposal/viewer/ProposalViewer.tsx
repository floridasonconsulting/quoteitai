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
  
  // Debug logging for company info
  console.log('[ProposalViewer] Settings received:', {
    hasSettings: !!settings,
    settingsName: settings?.name,
    settingsLogo: settings?.logo,
    settingsEmail: settings?.email,
    settingsPhone: settings?.phone,
    settingsAddress: settings?.address
  });
  
  console.log('[ProposalViewer] Quote data:', {
    quoteId: quote.id,
    itemCount: quote.items.length,
    firstItemHasImage: !!quote.items[0]?.imageUrl,
    firstItemImageUrl: quote.items[0]?.imageUrl,
    allItemImages: quote.items.map(i => ({ name: i.name, imageUrl: i.imageUrl, hasImage: !!i.imageUrl })),
    sampleItem: quote.items[0] ? {
      name: quote.items[0].name,
      imageUrl: quote.items[0].imageUrl,
      enhancedDescription: quote.items[0].enhancedDescription
    } : null
  });
  
  // Data Transformation with null checks
  const proposalData = useMemo(() => {
    // Improved Visuals Logic with Fallback
    const mockVisuals = {
      coverImage: quote.items.find(i => i.imageUrl)?.imageUrl || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80',
      logo: settings?.logo,
    };
    
    console.log('[ProposalViewer] Transforming quote:', quote.id);
    console.log('[ProposalViewer] Using visuals:', mockVisuals);
    console.log('[ProposalViewer] Using settings:', settings);
    console.log('[ProposalViewer] Settings name:', settings?.name);
    console.log('[ProposalViewer] Settings logo:', settings?.logo);

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
    return proposalData.sections.map((section, index) => {
      let type: 'summary' | 'category' | 'terms' = 'category';
      
      if (section.type === 'lineItems') type = 'summary';
      else if (section.type === 'legal') type = 'terms';
      
      return {
        id: section.id,
        label: section.title || 'Untitled Section',
        index: index,
        type
      };
    });
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
            <div className="hidden md:block w-64 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto">
              {/* Company Info Header */}
              <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                {settings?.logo ? (
                  <div className="mb-4">
                    <img 
                      src={settings.logo} 
                      alt={settings.name || "Company Logo"} 
                      className="h-12 w-auto object-contain"
                      onError={(e) => {
                        console.error('[ProposalViewer] Logo failed to load:', settings.logo);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                ) : null}
                {settings?.name ? (
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {settings.name}
                  </h3>
                ) : (
                  <h3 className="text-lg font-semibold text-gray-500 dark:text-gray-400 italic">
                    Company Name Not Set
                  </h3>
                )}
                {isReadOnly && (
                  <div className="mt-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300 text-center">
                    Owner Preview Mode
                  </div>
                )}
              </div>
              
              {/* Navigation Links */}
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
                currency={settings?.currency || 'USD'}
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
            salesRepName={settings?.name || "Your Sales Representative"}
            onReturn={() => setSuccessState(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}