import { ProposalData } from '@/types/proposal';
import { HeroSection } from './HeroSection';
import { TextSection } from './TextSection';
import { LineItemSection } from './LineItemSection';
import { PricingSection } from './PricingSection';
import { LegalSection } from './LegalSection';
import { SidebarLayout } from './SidebarLayout';
import { PrintStyles } from './PrintStyles';
import { ProposalActionBar } from './ProposalActionBar';

interface ActionBarProps {
  quoteId: string;
  total: number;
  status: 'draft' | 'sent' | 'accepted' | 'declined';
  userEmail: string;
  userName?: string;
  onAccept: () => Promise<void>;
  onReject: (reason?: string) => Promise<void>;
}

interface ProposalViewerProps {
  proposal: ProposalData;
  onSign?: (signature: string) => Promise<void>;
  readOnly?: boolean;
  actionBar?: ActionBarProps;
}

export function ProposalViewer({ proposal, onSign, readOnly = false, actionBar }: ProposalViewerProps) {
  const renderSection = (section: ProposalData['sections'][0]) => {
    switch (section.type) {
      case 'hero':
        return <HeroSection key={section.id} section={section} />;
      case 'text':
        return <TextSection key={section.id} section={section} />;
      case 'lineItems':
        return <LineItemSection key={section.id} section={section} />;
      case 'pricing':
        return <PricingSection key={section.id} section={section} onSign={onSign} readOnly={readOnly} />;
      case 'legal':
        return <LegalSection key={section.id} section={section} />;
      default:
        return null;
    }
  };

  return (
    <>
      <PrintStyles />
      <div className="min-h-screen bg-slate-50">
        <SidebarLayout proposal={proposal}>
          <div className="space-y-8 pb-24">
            {proposal.sections.map(renderSection)}
          </div>
        </SidebarLayout>
        
        {/* Action Bar */}
        {actionBar && (
          <ProposalActionBar
            quoteId={actionBar.quoteId}
            total={actionBar.total}
            status={actionBar.status}
            userEmail={actionBar.userEmail}
            userName={actionBar.userName}
            onAccept={actionBar.onAccept}
            onReject={actionBar.onReject}
          />
        )}
      </div>
    </>
  );
}
