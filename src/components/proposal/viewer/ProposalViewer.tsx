import { ProposalData } from '@/types/proposal';
import { HeroSection } from './HeroSection';
import { TextSection } from './TextSection';
import { LineItemSection } from './LineItemSection';
import { PricingSection } from './PricingSection';
import { LegalSection } from './LegalSection';
import { ProposalActionBar } from './ProposalActionBar';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, EffectCube, Keyboard, Mousewheel } from 'swiper/modules';
import { useRef } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import { CompanySettings, Quote } from "@/types";
import { getTheme, getThemeCSSVars } from "@/lib/proposal-themes";

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';

interface ProposalViewerProps {
  quote: Quote;
  companySettings: CompanySettings;
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

export function ProposalViewer({ quote, companySettings, isPreview = false, actionBar }: ProposalViewerProps) {
  // CRITICAL: Guard against undefined props
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

  const theme = getTheme(companySettings.proposalTheme || "modern-corporate");
  const themeCSSVars = getThemeCSSVars(theme);
  
  const swiperRef = useRef<SwiperType>();

  // Create proposal data from quote for section rendering
  const proposalData: ProposalData = {
    id: quote.id,
    quoteId: quote.id,
    theme: companySettings.proposalTheme || "modern-corporate",
    sections: [
      // Hero section
      {
        id: 'hero',
        type: 'hero' as const,
        title: quote.title,
        subtitle: companySettings.name,
        backgroundImage: companySettings.logo || undefined,
      },
      // Executive summary if exists
      ...(quote.executiveSummary ? [{
        id: 'summary',
        type: 'text' as const,
        title: 'Executive Summary',
        content: quote.executiveSummary,
      }] : []),
      // Line items
      {
        id: 'items',
        type: 'lineItems' as const,
        title: 'Project Scope',
        items: quote.items.map(item => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        }))
      },
      // Pricing
      {
        id: 'pricing',
        type: 'pricing' as const,
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        terms: companySettings.terms || "Payment due within 30 days"
      },
      // Legal/Terms
      {
        id: 'legal',
        type: 'legal' as const,
        title: 'Terms & Conditions',
        content: companySettings.terms || "Standard terms and conditions apply."
      }
    ],
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt
  };

  const renderSection = (section: ProposalData['sections'][0]) => {
    switch (section.type) {
      case 'hero':
        return <HeroSection section={section} />;
      case 'text':
        return <TextSection section={section} />;
      case 'lineItems':
        return <LineItemSection section={section} />;
      case 'pricing':
        return <PricingSection section={section} />;
      case 'legal':
        return <LegalSection section={section} />;
      default:
        return null;
    }
  };

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
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        className="h-screen"
        style={{
          '--swiper-pagination-color': theme.swiper.paginationColor,
          '--swiper-navigation-color': theme.swiper.navigationColor,
        } as React.CSSProperties}
      >
        {proposalData.sections.map((section) => (
          <SwiperSlide key={section.id} className="overflow-y-auto">
            <div className="container mx-auto px-4 py-8 max-w-4xl">
              <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                {renderSection(section)}
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Action Bar - Fixed at bottom, sits above Swiper pagination */}
      {actionBar && (
        <ProposalActionBar
          quoteId={actionBar.quoteId}
          total={actionBar.total}
          status={actionBar.status}
          userEmail={actionBar.userEmail}
          userName={actionBar.userName}
          onAccept={actionBar.onAccept}
          onReject={actionBar.onReject}
          className="z-[60]"
        />
      )}
    </div>
  );
}
