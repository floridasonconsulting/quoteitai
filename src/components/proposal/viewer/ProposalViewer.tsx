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
  onSign?: (signature: string) =&gt; void;
}

export function ProposalViewer({ proposal, readOnly = false, onSign }: ProposalViewerProps) {
  const [activeTemplate, setActiveTemplate] = useState&lt;'sidebar' | 'deck'&gt;('sidebar');
  const [sectionTotals, setSectionTotals] = useState&lt;Record&lt;string, number&gt;&gt;({});
  const [totalValue, setTotalValue] = useState(0);
  const [currentSectionId, setCurrentSectionId] = useState(proposal.sections[0]?.id || "");
  const [showSignModal, setShowSignModal] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [signerName, setSignerName] = useState("");

  // Aggregator for totals from multiple sections
  const handleSectionTotalChange = useCallback((sectionId: string, value: number) =&gt; {
    setSectionTotals(prev =&gt; {
        if (prev[sectionId] === value) return prev;
        return { ...prev, [sectionId]: value };
    });
  }, []);

  // Recalculate Grand Total whenever section totals change
  useEffect(() =&gt; {
    const sum = Object.values(sectionTotals).reduce((a, b) =&gt; a + b, 0);
    setTotalValue(sum);
  }, [sectionTotals]);

  // Update active template from settings if changed
  useEffect(() =&gt; {
    if (proposal.settings.theme === 'presentation_deck') {
      setActiveTemplate('deck');
    } else {
      setActiveTemplate('sidebar');
    }
  }, [proposal.settings.theme]);

  // Handle PDF Download
  const handleDownloadPDF = () =&gt; {
    window.print();
  };

  // Scroll to Top Handler
  useEffect(() =&gt; {
    const handleScroll = () =&gt; {
        if (window.scrollY &gt; 400) {
            setShowBackToTop(true);
        } else {
            setShowBackToTop(false);
        }
    };
    window.addEventListener('scroll', handleScroll);
    return () =&gt; window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () =&gt; {
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavClick = (id: string) =&gt; {
    setCurrentSectionId(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const renderSectionContent = (section: ProposalSection) =&gt; {
    switch(section.type) {
        case 'hero': return &lt;HeroSection key={section.id} data={section} /&gt;;
        case 'text': return &lt;TextSection key={section.id} data={section} /&gt;;
        case 'line-items': return &lt;LineItemSection key={section.id} data={section} onTotalChange={handleSectionTotalChange} /&gt;;
        case 'pricing': return &lt;PricingSection key={section.id} data={section} onTotalChange={handleSectionTotalChange} currency={proposal.settings.currency} /&gt;;
        case 'legal': return &lt;LegalSection key={section.id} data={section} /&gt;;
        default: return null;
    }
  };

  const TemplateSwitcher = () =&gt; (
    &lt;div className="fixed bottom-4 left-4 z-50 flex gap-2 bg-black/80 p-2 rounded-lg backdrop-blur border border-white/10 template-switcher"&gt;
        &lt;button onClick={() =&gt; setActiveTemplate('sidebar')} className={`p-2 rounded ${activeTemplate === 'sidebar' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Corporate Sidebar"&gt;
            &lt;SidebarIcon className="w-4 h-4" /&gt;
        &lt;/button&gt;
        &lt;button onClick={() =&gt; setActiveTemplate('deck')} className={`p-2 rounded ${activeTemplate === 'deck' ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'}`} title="Presentation Deck"&gt;
            &lt;BookOpen className="w-4 h-4" /&gt;
        &lt;/button&gt;
        &lt;div className="w-px bg-white/20 mx-1"&gt;&lt;/div&gt;
        &lt;button onClick={handleDownloadPDF} className="p-2 rounded text-slate-400 hover:text-white hover:bg-white/10" title="Download/Print PDF"&gt;
             &lt;Printer className="w-4 h-4" /&gt;
        &lt;/button&gt;
    &lt;/div&gt;
  );

  return (
    &lt;div className="font-sans antialiased text-slate-900"&gt;
      &lt;PrintStyles /&gt;
      &lt;TemplateSwitcher /&gt;

      {activeTemplate === 'sidebar' ? (
        &lt;SidebarLayout 
            proposal={proposal}
            currentSectionId={currentSectionId}
            onNavClick={handleNavClick}
            totalValue={totalValue}
            onSign={() =&gt; setShowSignModal(true)}
            renderSection={renderSectionContent}
        /&gt;
      ) : (
        // Placeholder for Deck layout - defaulting to sidebar for now as per instructions to start with sidebar
        &lt;SidebarLayout 
            proposal={proposal}
            currentSectionId={currentSectionId}
            onNavClick={handleNavClick}
            totalValue={totalValue}
            onSign={() =&gt; setShowSignModal(true)}
            renderSection={renderSectionContent}
        /&gt;
      )}

       {/* Signature Modal */}
       {showSignModal &amp;&amp; (
        &lt;div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4 no-print"&gt;
          &lt;div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in-up"&gt;
            &lt;div className="flex justify-between items-center mb-6"&gt;
              &lt;h3 className="text-xl font-bold"&gt;Finalize Agreement&lt;/h3&gt;
              &lt;button onClick={() =&gt; setShowSignModal(false)}&gt;&lt;X className="text-slate-400 hover:text-slate-600" /&gt;&lt;/button&gt;
            &lt;/div&gt;
            
            &lt;div className="space-y-4 mb-6"&gt;
              &lt;div&gt;
                &lt;label className="block text-sm font-medium text-slate-700 mb-1"&gt;Full Name&lt;/label&gt;
                &lt;input 
                  type="text" 
                  className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-teal-500 outline-none" 
                  placeholder="John Doe" 
                  value={signerName}
                  onChange={(e) =&gt; setSignerName(e.target.value)}
                /&gt;
              &lt;/div&gt;
              &lt;div&gt;
                &lt;label className="block text-sm font-medium text-slate-700 mb-1"&gt;Project Total&lt;/label&gt;
                &lt;div className="text-3xl font-bold font-mono text-teal-700"&gt;${totalValue.toLocaleString()}&lt;/div&gt;
              &lt;/div&gt;
              &lt;div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500"&gt;
                By signing, you agree to the Terms &amp; Conditions and authorize {proposal.sender?.company} to begin procurement.
              &lt;/div&gt;
              &lt;div className="flex items-start gap-3 p-3 bg-slate-50 rounded border border-slate-200"&gt;
                &lt;input type="checkbox" className="mt-1" /&gt;
                &lt;p className="text-xs text-slate-500"&gt;I accept this proposal.&lt;/p&gt;
              &lt;/div&gt;
            &lt;/div&gt;

            &lt;button 
              onClick={() =&gt; { 
                setIsSigned(true); 
                setShowSignModal(false); 
                setShowSuccessModal(true); 
                if (onSign) onSign(signerName);
              }}
              disabled={readOnly}
              className="w-full bg-teal-600 hover:bg-teal-500 text-white py-3 rounded-lg font-bold shadow-lg shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            &gt;
              Sign &amp; Accept Proposal
            &lt;/button&gt;
          &lt;/div&gt;
        &lt;/div&gt;
      )}

      {/* POST-SIGN SUCCESS MODAL */}
      {showSuccessModal &amp;&amp; (
        &lt;div className="fixed inset-0 z-[101] flex items-center justify-center bg-slate-900/90 backdrop-blur p-4 no-print"&gt;
            &lt;div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-8 animate-fade-in-up text-center"&gt;
                &lt;div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"&gt;
                    &lt;Check className="w-8 h-8 text-green-600" /&gt;
                &lt;/div&gt;
                &lt;h2 className="text-2xl font-bold text-slate-900 mb-2"&gt;Proposal Accepted!&lt;/h2&gt;
                &lt;p className="text-slate-500 mb-8"&gt;We have recorded your signature. The project "{proposal.sections[0]?.title || 'Project'}" is now active.&lt;/p&gt;

                &lt;div className="grid grid-cols-1 gap-4 text-left"&gt;
                    &lt;div className="border border-slate-200 p-4 rounded-lg hover:border-teal-500 transition-colors cursor-pointer flex items-center gap-4 group"&gt;
                        &lt;div className="bg-teal-50 p-3 rounded group-hover:bg-teal-100"&gt;
                            &lt;Receipt className="w-6 h-6 text-teal-600" /&gt;
                        &lt;/div&gt;
                        &lt;div&gt;
                            &lt;div className="font-bold text-slate-800"&gt;Deposit Invoice&lt;/div&gt;
                            &lt;div className="text-xs text-slate-500"&gt;Download the 30% deposit invoice (${(totalValue * 0.3).toLocaleString()})&lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;

                    &lt;div className="border border-slate-200 p-4 rounded-lg hover:border-teal-500 transition-colors cursor-pointer flex items-center gap-4 group"&gt;
                        &lt;div className="bg-blue-50 p-3 rounded group-hover:bg-blue-100"&gt;
                            &lt;FileSignature className="w-6 h-6 text-blue-600" /&gt;
                        &lt;/div&gt;
                        &lt;div&gt;
                            &lt;div className="font-bold text-slate-800"&gt;Construction Contract&lt;/div&gt;
                            &lt;div className="text-xs text-slate-500"&gt;View and download the full legal agreement.&lt;/div&gt;
                        &lt;/div&gt;
                    &lt;/div&gt;
                &lt;/div&gt;

                &lt;button 
                    onClick={() =&gt; setShowSuccessModal(false)}
                    className="mt-8 text-slate-400 hover:text-slate-600 text-sm font-medium"
                &gt;
                    Close &amp; Return to Proposal
                &lt;/button&gt;
            &lt;/div&gt;
        &lt;/div&gt;
      )}

      {/* Back to Top Button */}
      {showBackToTop &amp;&amp; (
          &lt;button 
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-40 p-3 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-500 transition-all no-print animate-fade-in-up"
            title="Back to Top"
          &gt;
              &lt;ArrowUp className="w-5 h-5" /&gt;
          &lt;/button&gt;
      )}
    &lt;/div&gt;
  );
}
