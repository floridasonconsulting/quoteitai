import { useState, useEffect, useMemo, useRef, useCallback } from "react";
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
import { Menu, Edit3, ScrollText, CheckCircle2 } from "lucide-react";
import { ImageEditDialog } from "./ImageEditDialog";
import { visualsService } from "@/lib/services/visuals-service";
import { useToast } from "@/hooks/use-toast";
import { ProposalVisuals, ProposalData } from "@/types/proposal";
import { getTheme, getThemeCSSVars } from "@/lib/proposal-themes";
import { useProposalTelemetry } from "@/hooks/useProposalTelemetry";
import { ProposalAssistant } from "./ProposalAssistant";
import { generateClassicPDF, generateModernPDF, generateDetailedPDF } from "@/lib/pdf-generator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SignatureCapture } from "./SignatureCapture";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { formatTermsContent } from "@/lib/json-terms-formatter";
import { clearInFlightRequests } from "@/lib/services/request-pool-service";

interface ProposalViewerProps {
  quote?: Quote;
  settings?: CompanySettings;
  proposal?: ProposalData;
  onAccept?: (signatureData?: string, signerName?: string) => Promise<void>;
  onDecline?: () => Promise<void>;
  onComment?: (comment: string) => Promise<void>;
  isReadOnly?: boolean;
  visuals?: ProposalVisuals;
}

export function ProposalViewer({
  quote: initialQuote,
  settings: initialSettings,
  proposal: directProposal,
  onAccept,
  onDecline,
  onComment,
  isReadOnly = false,
  visuals
}: ProposalViewerProps) {
  // Determine if this is a quote-based or direct proposal-based view
  const quote = directProposal ? null : initialQuote;
  const settings = (directProposal ? directProposal.settings as any : initialSettings) || initialSettings;

  // Note: isReadOnly=true usually means "the visitor" is viewing.
  // But wait! PublicQuoteView passes isOwner as isReadOnly.
  // If isOwner is true, they SHOULD be able to edit images.
  const isOwner = isReadOnly;
  // State
  const [stage, setStage] = useState<'cover' | 'content'>('cover');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [successState, setSuccessState] = useState<SuccessType | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editImageConfig, setEditImageConfig] = useState<{
    isOpen: boolean;
    type: 'cover' | 'section' | 'item';
    id: string; // sectionId or itemName
    currentImage?: string;
  }>({ isOpen: false, type: 'cover', id: '' });
  const [acceptDialog, setAcceptDialog] = useState({
    isOpen: false,
    signerName: '',
    agreedToTerms: false,
    signatureData: '',
    hasScrolledToBottom: false // Track if user scrolled through legal terms
  });

  // Ref for legal terms scroll container
  const legalTermsScrollRef = useRef<HTMLDivElement>(null);

  // Check if legal terms exist and need to be shown
  const hasLegalTerms = useMemo(() => {
    const legalTerms = settings?.legalTerms || (initialQuote as any)?.legalTerms;
    return legalTerms && legalTerms.trim().length > 0;
  }, [settings?.legalTerms, initialQuote]);

  // Get formatted legal terms
  const formattedLegalTerms = useMemo(() => {
    const legalTerms = settings?.legalTerms || (initialQuote as any)?.legalTerms || '';
    return formatTermsContent(legalTerms);
  }, [settings?.legalTerms, initialQuote]);

  // Handle scroll in legal terms container
  const handleLegalTermsScroll = useCallback(() => {
    const container = legalTermsScrollRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    // Consider "scrolled to bottom" when within 20px of bottom
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 20;

    if (isAtBottom && !acceptDialog.hasScrolledToBottom) {
      setAcceptDialog(prev => ({ ...prev, hasScrolledToBottom: true }));
    }
  }, [acceptDialog.hasScrolledToBottom]);

  const { toast } = useToast();

  // Data Transformation with null checks
  const proposalData = useMemo(() => {
    if (directProposal) return directProposal;
    if (!quote || !settings) return null;

    const activeVisuals = visuals || {
      logo: settings?.logo,
    };

    return transformQuoteToProposal(quote, settings, activeVisuals);
  }, [quote, settings, visuals, directProposal]);

  // Theme handling
  const { setTheme } = useTheme();

  useEffect(() => {
    // Enforce light mode for proposal viewer by default unless specified
    setTheme('light');

    // Cleanup on unmount
    return () => {
      console.debug('[ProposalViewer] Unmounting - Clearing in-flight requests');
      clearInFlightRequests();
    };
  }, [setTheme]);

  // Generate CSS Variables for the selected theme
  const themeVars = useMemo(() => {
    if (!proposalData) return {};
    const themeId = (settings?.proposalTheme as any) || 'modern-corporate';
    const themeDef = getTheme(themeId);
    return getThemeCSSVars(themeDef);
  }, [proposalData, settings?.proposalTheme]);

  // Telemetry: Track dwell time per section
  const activeSectionId = useMemo(() => {
    if (!proposalData) return 'loading';
    if (stage === 'cover') return 'cover';
    return proposalData.sections[activeSlideIndex]?.id || 'unknown';
  }, [stage, activeSlideIndex, proposalData]);

  useProposalTelemetry(quote?.id || directProposal?.id, activeSectionId, true, isOwner);

  // Navigation Items Generation
  const navigationItems = useMemo(() => {
    if (!proposalData) return [];
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
  }, [proposalData]);

  // Handlers
  const handleAccept = async () => {
    if (!onAccept) return;

    // If we have a signature, proceed. If not, open dialog.
    if (!acceptDialog.signatureData) {
      setAcceptDialog({ ...acceptDialog, isOpen: true });
      return;
    }

    setIsProcessing(true);
    try {
      await onAccept(acceptDialog.signatureData, acceptDialog.signerName);
      setSuccessState('accepted');
      setAcceptDialog({ ...acceptDialog, isOpen: false });
    } catch (error) {
      console.error("Failed to accept:", error);
      toast({
        title: "Error",
        description: "Failed to process acceptance. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
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

  const handleCommentInternal = async () => {
    if (!onComment) return;

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

  const handleDownloadPDF = async () => {
    if (!proposalData || !proposalData.settings) {
      toast({
        title: "Error",
        description: "Missing required data for PDF generation",
        variant: "destructive"
      });
      return;
    }

    try {
      if (!quote && !directProposal) {
        throw new Error("No source data available for PDF");
      }

      let pdfBlob;
      const template = settings?.proposalTemplate || 'classic';

      const sourceQuote = quote || (directProposal as any);
      const sourceCustomer = (quote as any)?.customer || proposalData.client;

      if (template === 'modern') {
        pdfBlob = generateModernPDF(sourceQuote, sourceCustomer as any, settings);
      } else if (template === 'detailed') {
        pdfBlob = generateDetailedPDF(sourceQuote, sourceCustomer as any, settings);
      } else {
        pdfBlob = generateClassicPDF(sourceQuote, sourceCustomer as any, settings);
      }

      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `Proposal-${proposalData.client.name.replace(/\s+/g, '-')}-${sourceQuote.quoteNumber || 'Draft'}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF generated successfully"
      });
    } catch (error) {
      console.error("PDF generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate PDF",
        variant: "destructive"
      });
    }
  };

  const handleUpdateImage = async (url: string) => {
    const quoteId = quote?.id || directProposal?.id;
    if (!quoteId) return;

    setIsProcessing(true);
    try {
      if (editImageConfig.type === 'cover') {
        await visualsService.saveCoverOverride(quoteId, url);
      } else if (editImageConfig.type === 'section') {
        await visualsService.saveSectionImageOverride(quoteId, editImageConfig.id, url);
      } else if (editImageConfig.type === 'item') {
        await visualsService.saveItemImageOverride(quoteId, editImageConfig.id, url);
      }

      toast({
        title: "Image updated",
        description: "The proposal visuals have been updated successfully.",
      });

      // Refresh page to show new visual state
      window.location.reload();
    } catch (error) {
      console.error("Failed to update image:", error);
      toast({
        title: "Update failed",
        description: "There was an error saving the image selection.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (!proposalData) {
    return (
      <div className="h-screen w-full flex items-center justify-center p-8 text-muted-foreground">
        Loading proposal data...
      </div>
    );
  }

  // Render
  return (
    <div className="h-screen w-full bg-background overflow-hidden font-sans" style={themeVars as any}>
      <AnimatePresence mode="wait">
        {/* STAGE 1: COVER */}
        {stage === 'cover' && (
          <ProposalCover
            key="cover"
            title={proposalData.sections.find(s => s.type === 'hero')?.title || "Project Proposal"}
            subtitle={proposalData.sections.find(s => s.type === 'hero')?.subtitle || ""}
            clientName={proposalData.client.name}
            coverImage={proposalData.visuals?.coverImage}
            companyLogo={settings?.logo}
            totalAmount={initialQuote?.total || directProposal?.total || 0}
            currency={settings?.currency || 'USD'}
            onEnter={() => setStage('content')}
            isOwner={isOwner}
            onEditImage={(url) => setEditImageConfig({
              isOpen: true,
              type: 'cover',
              id: 'cover',
              currentImage: url
            })}
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
            <div className="hidden md:block w-64 flex-shrink-0 h-full border-r border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 overflow-y-auto custom-scrollbar">
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
                  <div className="mt-3 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 rounded text-xs text-blue-700 dark:text-blue-300 text-center uppercase font-bold tracking-tight">
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

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 h-full flex flex-col relative overflow-hidden">
              <div className="flex-1 relative overflow-hidden">
                <ProposalContentSlider
                  sections={proposalData.sections}
                  activeIndex={activeSlideIndex}
                  onSlideChange={setActiveSlideIndex}
                  isOwner={isOwner}
                  onEditSectionImage={(id, url) => setEditImageConfig({
                    isOpen: true,
                    type: 'section',
                    id,
                    currentImage: url
                  })}
                  onEditItemImage={(name, url) => setEditImageConfig({
                    isOpen: true,
                    type: 'item',
                    id: name,
                    currentImage: url
                  })}
                  settings={proposalData.settings}
                />
              </div>

              {/* Sticky Action Bar */}
              {(onAccept || onDecline || onComment || true) && (
                <ProposalActionBar
                  totalAmount={(initialQuote?.total || directProposal?.total || 0)}
                  currency={settings?.currency || 'USD'}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  onComment={handleCommentInternal}
                  isProcessing={isProcessing}
                />
              )}
            </div>
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

      <ImageEditDialog
        isOpen={editImageConfig.isOpen}
        onClose={() => setEditImageConfig({ ...editImageConfig, isOpen: false })}
        onSelect={handleUpdateImage}
        title={`Change ${editImageConfig.type === 'item' ? 'Item' : 'Section'} Image`}
        currentImage={editImageConfig.currentImage}
      />

      {/* Proactive Support Widget */}
      {!isOwner && proposalData.id && (
        <ProposalAssistant
          quoteId={proposalData.id}
          organizationId={proposalData.organization_id || ''}
          currentSectionId={activeSectionId}
          sectionTitle={proposalData.sections[activeSlideIndex]?.title || 'Section'}
        />
      )}

      {/* e-Sign Acceptance Dialog */}
      <Dialog
        open={acceptDialog.isOpen}
        onOpenChange={(open) => {
          // Reset scroll state when dialog opens/closes
          setAcceptDialog({
            ...acceptDialog,
            isOpen: open,
            hasScrolledToBottom: !hasLegalTerms // If no legal terms, mark as already scrolled
          });
        }}
      >
        <DialogContent className={hasLegalTerms ? "sm:max-w-[650px] max-h-[90vh]" : "sm:max-w-[500px]"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {hasLegalTerms && !acceptDialog.hasScrolledToBottom ? (
                <>
                  <ScrollText className="w-5 h-5 text-amber-500" />
                  Review Legal Terms
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Sign & Accept Proposal
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {hasLegalTerms && !acceptDialog.hasScrolledToBottom
                ? "Please read through the legal terms below. Scroll to the bottom to proceed with signing."
                : "Please enter your name and provide a signature to accept this proposal."
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Legal Terms Section - Show if legal terms exist and not yet scrolled */}
            {hasLegalTerms && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <ScrollText className="w-4 h-4" />
                    Legal Terms & Conditions
                  </Label>
                  {acceptDialog.hasScrolledToBottom && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Reviewed
                    </span>
                  )}
                </div>
                <div
                  ref={legalTermsScrollRef}
                  onScroll={handleLegalTermsScroll}
                  className={`
                    border rounded-lg p-4 bg-muted/30
                    max-h-[250px] overflow-y-auto custom-scrollbar
                    text-sm whitespace-pre-wrap
                    ${!acceptDialog.hasScrolledToBottom ? 'ring-2 ring-amber-200' : 'ring-1 ring-green-200'}
                  `}
                >
                  {formattedLegalTerms || 'No legal terms provided.'}
                </div>
                {!acceptDialog.hasScrolledToBottom && (
                  <p className="text-xs text-amber-600 animate-pulse">
                    ↓ Scroll to the bottom to continue
                  </p>
                )}
              </div>
            )}

            {/* Signature Section - Disabled until legal terms are scrolled */}
            <div className={`space-y-4 ${hasLegalTerms && !acceptDialog.hasScrolledToBottom ? 'opacity-50 pointer-events-none' : ''}`}>
              <div className="space-y-2">
                <Label htmlFor="signerName">Full Name</Label>
                <Input
                  id="signerName"
                  placeholder="Enter your full name"
                  value={acceptDialog.signerName}
                  onChange={(e) => setAcceptDialog({ ...acceptDialog, signerName: e.target.value })}
                  disabled={hasLegalTerms && !acceptDialog.hasScrolledToBottom}
                />
              </div>

              <div className="space-y-2">
                <Label>Signature</Label>
                <SignatureCapture
                  onSave={(data) => setAcceptDialog({ ...acceptDialog, signatureData: data })}
                  onClear={() => setAcceptDialog({ ...acceptDialog, signatureData: '' })}
                />
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={acceptDialog.agreedToTerms}
                  onCheckedChange={(checked) => setAcceptDialog({ ...acceptDialog, agreedToTerms: checked === true })}
                  disabled={hasLegalTerms && !acceptDialog.hasScrolledToBottom}
                />
                <div className="grid gap-1.5 leading-none">
                  <label
                    htmlFor="terms"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Confirm acceptance of terms
                  </label>
                  <p className="text-xs text-muted-foreground">
                    By checking this, you agree to the terms and conditions outlined in this proposal.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setAcceptDialog({ ...acceptDialog, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleAccept}
              disabled={
                !acceptDialog.signerName ||
                !acceptDialog.signatureData ||
                !acceptDialog.agreedToTerms ||
                (hasLegalTerms && !acceptDialog.hasScrolledToBottom) ||
                isProcessing
              }
            >
              {isProcessing ? "Processing..." : "Sign & Accept"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 🖨️ Printable Version (Hidden on screen, shown in browser print) */}
      <div className="printable-only hidden print:block">
        {proposalData.sections.map((section, idx) => (
          <div
            key={section.id}
            id={section.id}
            className="print-section w-full border-b border-gray-100 dark:border-gray-800 last:border-0 p-8"
          >
            <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            {section.type === 'hero' && (
              <div className="whitespace-pre-wrap text-lg">{section.content}</div>
            )}
            {section.type === 'categoryGroup' && (
              <div className="space-y-4">
                {section.categoryGroups?.[0]?.items.map((item, i) => (
                  <div key={i} className="flex justify-between items-start border-b border-gray-50 pb-2">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-sm">{item.quantity} x {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.price)}</p>
                      <p className="font-bold">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.total)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {section.type === 'lineItems' && (
              <div className="space-y-2">
                {section.items?.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(item.total)}</span>
                  </div>
                ))}
                <div className="border-t pt-4 mt-4 flex justify-between font-bold text-xl">
                  <span>Total</span>
                  <span>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(section.total || 0)}</span>
                </div>
              </div>
            )}
            {(section.type === 'legal' || section.type === 'scopeOfWork') && (
              <div className="whitespace-pre-wrap text-sm leading-relaxed">{formatTermsContent(section.content || '')}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}