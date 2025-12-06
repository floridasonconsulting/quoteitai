import { useState } from 'react';
import { CompanySettings, Quote, Customer } from "@/types";
import { getTheme, getThemeCSSVars } from "@/lib/proposal-themes";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCube, Keyboard, Mousewheel } from 'swiper/modules';
import { ProposalSuccessState } from './ProposalSuccessStates';
import { transformQuoteToProposal } from '@/lib/proposal-transformation';
import { HeroSection } from './HeroSection';
import { TextSection } from './TextSection';
import { CategoryGroupSection } from './CategoryGroupSection';
import { PricingSection } from './PricingSection';
import { LegalSection } from './LegalSection';
import { ProposalActionBar } from './ProposalActionBar';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';

type SuccessStateType = 'accepted' | 'declined' | 'commented' | null;

interface ProposalViewerProps {
  quote: Quote;
  companySettings: CompanySettings;
  customer?: Customer;
  isPreview?: boolean;
  actionBar?: {
    quoteId: string;
    total: number;
    status: 'draft' | 'sent' | 'accepted' | 'declined';
    userEmail: string;
    userName?: string;
    onAccept: () => Promise<void>;
    onReject: (reason?: string) => Promise<void>;
  };
}

export function ProposalViewer({ quote, companySettings, customer, isPreview = false, actionBar }: ProposalViewerProps) {
  const [successState, setSuccessState] = useState<SuccessStateType>(null);

  // Defensive checks
  if (!quote) {
    console.error('[ProposalViewer] No quote data provided');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error: Quote data is missing</p>
      </div>
    );
  }

  if (!companySettings) {
    console.error('[ProposalViewer] No company settings provided');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Error: Company settings are missing</p>
      </div>
    );
  }

  console.log('[ProposalViewer] Rendering with:', {
    quoteId: quote.id,
    showPricing: quote.showPricing,
    hasCustomer: !!customer,
    companyName: companySettings.name,
    termsLength: companySettings.terms?.length || 0,
    hasActionBar: !!actionBar,
    isPreview
  });

  // Transform quote to proposal structure with grouped categories
  const proposalData = transformQuoteToProposal(quote, customer, companySettings);
  
  const theme = getTheme(companySettings.proposalTheme || "modern-corporate");
  const themeCSSVars = getThemeCSSVars(theme);

  // Handle action bar events
  const handleAccept = async () => {
    if (!actionBar) return;
    await actionBar.onAccept();
    setSuccessState('accepted');
  };

  const handleReject = async (reason?: string) => {
    if (!actionBar) return;
    await actionBar.onReject(reason);
    setSuccessState('declined');
  };

  const handleComment = () => {
    setSuccessState('commented');
  };

  // Show success state if action completed
  if (successState) {
    return (
      <ProposalSuccessState
        type={successState}
        salesRepName={companySettings.name}
        onClose={() => window.close()}
      />
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{
        ...themeCSSVars,
        background: theme.colors.background,
        color: theme.colors.text.primary,
        fontFamily: theme.typography.fontFamily.body
      }}
    >
      <Swiper
        modules={[Navigation, Pagination, EffectCube, Keyboard, Mousewheel]}
        spaceBetween={0}
        slidesPerView={1}
        navigation
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        keyboard={{
          enabled: true,
        }}
        mousewheel={{
          forceToAxis: true,
          sensitivity: 1,
        }}
        effect="cube"
        cubeEffect={{
          shadow: true,
          slideShadows: true,
          shadowOffset: 20,
          shadowScale: 0.94,
        }}
        className="h-screen"
        style={{
          '--swiper-pagination-color': theme.swiper.paginationColor,
          '--swiper-navigation-color': theme.swiper.navigationColor,
        } as React.CSSProperties}
      >
        {proposalData.sections.map((section) => (
          <SwiperSlide key={section.id} className="overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-5xl">
              <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                {section.type === 'hero' && (
                  <HeroSection 
                    section={section}
                    companySettings={companySettings}
                  />
                )}
                {section.type === 'text' && <TextSection section={section} />}
                {section.type === 'categoryGroup' && (
                  <CategoryGroupSection 
                    section={section}
                    theme={theme}
                  />
                )}
                {section.type === 'pricing' && (
                  <PricingSection 
                    section={section}
                    companySettings={companySettings}
                  />
                )}
                {section.type === 'legal' && (
                  <LegalSection 
                    section={section}
                    companySettings={companySettings}
                  />
                )}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Interactive Action Bar - Only show if not preview and actionBar provided */}
      {!isPreview && actionBar && (
        <ProposalActionBar
          quoteId={actionBar.quoteId}
          total={actionBar.total}
          status={actionBar.status}
          userEmail={actionBar.userEmail}
          userName={actionBar.userName}
          onAccept={handleAccept}
          onReject={handleReject}
          onComment={handleComment}
          className="z-[60]"
        />
      )}
    </div>
  );
}