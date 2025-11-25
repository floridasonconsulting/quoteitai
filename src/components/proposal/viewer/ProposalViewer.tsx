import { useState, useEffect, useCallback } from 'react';
import { Check, X, Receipt, FileSignature, ArrowUp, Printer, BookOpen, Sidebar as SidebarIcon } from 'lucide-react';
import { ProposalData, ProposalSection } from '@/types/proposal';
import { SidebarLayout } from './SidebarLayout';
import { HeroSection } from './HeroSection';
import { TextSection } from './TextSection';
import { LineItemSection } from './LineItemSection';
import { PricingSection } from './PricingSection';
import { LegalSection } from './LegalSection';
import { PrintStyles } from './PrintStyles';

interface ProposalViewerProps {
  proposal: ProposalData;
  readOnly?: boolean; // If true, disables signing/interaction (good for preview mode)
  onSign?: (signature: string) => void;
}

export function ProposalViewer({ proposal, readOnly = false, onSign }: ProposalViewerProps) {
  const [activeTemplate, setActiveTemplate] = useState<'sidebar' | 'deck'>('sidebar');
  const [sectionTotals, setSectionTotals] = useState<Record<string, number>>({});
  const [totalValue, setTotalValue] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState(proposal.sections[0]?.id || "");
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [signerName, setSignerName] = useState("");

  // Aggregator for totals from multiple sections
  const handleSectionTotalChange = useCallback((sectionId: string, value: number) => {
    setSectionTotals(prev => {
        if (prev[sectionId] === value) return prev;
        return { ...prev, [sectionId]: value };
    });
  }, []);

  // Recalculate Grand Total whenever section totals change
  useEffect(() => {
    const sum = Object.values(sectionTotals).reduce((a, b) => a + b, 0);
    setTotalValue(sum);
  }, [sectionTotals]);

  // Update active template from settings if changed
  useEffect(() => {
    if (proposal.settings.theme === 'presentation_deck') {
      setActiveTemplate('deck');
    } else {
      setActiveTemplate('sidebar');
    }
  }, [proposal.settings.theme]);

  // Handle PDF Download
  const handleDownloadPDF = () => {
    window.print();
  };

  // Scroll to Top Handler
  useEffect(() => {
    const handleScroll = () => {
        if (window.scrollY > 400) {
            setShowBackToTop(true);
        } else {
            setShowBackToTop(false);
        }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (id: string) => {
    setCurrentSectionId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderSectionContent = (section: ProposalSection) => {
    switch(section.type) {
        case 'hero': return <HeroSection key={section.id} data={section} />;
        case 'text': return <TextSection key={section.id} data={section} />;
        case 'line-items': return <LineItemSection key={section.id} data={section} onTotalChange={handleSectionTotalChange} />;
        case 'pricing': return <PricingSection key={section.id} data={section} onTotalChange={handleSectionTotalChange} currency={proposal.settings.currency} />;
        case 'legal': return <LegalSection key={section.id} data={section} />;
        default: return null;
    }
  };

  const TemplateSwitcher = () => (
    <div className="fixed bottom-4 left-4 z-50 flex gap-2 bg-black/80 p-2 rounded-lg backdrop-blur border border-white/10 template-switcher">
        <button onClick={() => setActiveTemplate('sidebar')} className={`p-2 rounded ${activeTemplate === 'sidebar' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Corporate Sidebar">
            <SidebarIcon className="w-4 h-4" />
        </button>
        <button onClick={() => setActiveTemplate('deck')} className={`p-2 rounded ${activeTemplate === 'deck' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Presentation Deck">
            <BookOpen className="w-4 h-4" />
        </button>
        <div className="w-px bg-white/20 mx-1"></div>
        <button onClick={handleDownloadPDF} className="p-2 rounded text-slate-400 hover:text-white hover:bg-white/10" title="Download/Print PDF">
             <Printer className="w-4 h-4" />
        </button>
    </div>
  );

  return (
    <div className="font-sans antialiased text-slate-900">
      <PrintStyles />
      <TemplateSwitcher />

      {activeTemplate === 'sidebar' ? (
        <SidebarLayout 
            proposal={proposal}
            currentSectionId={currentSectionId}
            onNavClick={handleNavClick}
            totalValue={totalValue}
            onSign={() => setShowSignModal(true)}
            renderSection={renderSectionContent}
        />
      ) : (
        // Placeholder for Deck layout - defaulting to sidebar for now as per instructions to start with sidebar
        <SidebarLayout 
            proposal={proposal}
            currentSectionId={currentSectionId}
            onNavClick={handleNavClick}
            totalValue={totalValue}
            onSign={() => setShowSignModal(true)}
            renderSection={renderSectionContent}
        />
      )}

       {/* Signature Modal */}
       {showSignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 no-print">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Finalize Agreement</h3>
              <button onClick={() => setShowSignModal(false)}><X className="text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="John Doe" 
                  value={signerName}
                  onChange={(e) => setSignerName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Project Total</label>
                <div className="text-3xl font-bold font-mono text-teal-700">${totalValue.toLocaleString()}</div>
              </div>
              <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500">
                By signing, you agree to the Terms & Conditions and authorize {proposal.sender?.company} to begin procurement.
              </div>
              <div className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200">
                <input type="checkbox" className="mt-1" />
                <p className="text-xs text-slate-500">I accept this proposal.</p>
              </div>
            </div>

            <button 
              onClick={() => { 
                setIsSigned(true); 
                setShowSignModal(false); 
                setShowSuccessModal(true); 
                if (onSign) onSign(signerName);
              }}
              disabled={readOnly}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign & Accept Proposal
            </button>
          </div>
        </div>
      )}

      {/* POST-SIGN SUCCESS MODAL */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/90 backdrop-blur p-4 no-print">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-fade-in-up text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Proposal Accepted!</h2>
                <p className="text-slate-500 mb-8">We have recorded your signature. The project "{proposal.sections[0]?.title || 'Project'}" is now active.</p>

                <div className="grid grid-cols-1 gap-4 text-left">
                    <div className="border border-slate-200 p-4 rounded-lg hover:border-teal-500 transition-colors cursor-pointer flex items-center gap-4 group">
                        <div className="bg-teal-50 p-3 rounded group-hover:bg-teal-100">
                            <Receipt className="w-6 h-6 text-teal-600" />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">Deposit Invoice</div>
                            <div className="text-xs text-slate-500">Download the 30% deposit invoice (${(totalValue * 0.3).toLocaleString()})</div>
                        </div>
                    </div>

                    <div className="border border-slate-200 p-4 rounded-lg hover:border-teal-500 transition-colors cursor-pointer flex items-center gap-4 group">
                        <div className="bg-blue-50 p-3 rounded group-hover:bg-blue-100">
                            <FileSignature className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <div className="font-bold text-slate-800">Construction Contract</div>
                            <div className="text-xs text-slate-500">View and download the full legal agreement.</div>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => setShowSuccessModal(false)}
                    className="mt-8 text-slate-400 hover:text-slate-600 text-sm font-medium"
                >
                    Close & Return to Proposal
                </button>
            </div>
        </div>
      )}

      {/* Back to Top Button */}
      {showBackToTop && (
          <button 
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 p-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-500 transition-all no-print animate-fade-in-up"
            title="Back to Top"
          >
              <ArrowUp className="w-5 h-5" />
          </button>
      )}
    </div>
  );
}
