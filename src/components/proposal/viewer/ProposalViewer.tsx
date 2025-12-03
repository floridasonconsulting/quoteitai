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

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/effect-cube';

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
  quote: Quote;
  companySettings: CompanySettings;
  isPreview?: boolean;
}

export function ProposalViewer({ quote, companySettings, isPreview = false }: ProposalViewerProps) {
  const theme = companySettings.proposalTheme || "modern-corporate";
  
  // Theme-specific styling classes
  const themeClasses = {
    "modern-corporate": "bg-white text-slate-900",
    "creative-studio": "bg-gradient-to-br from-purple-50 to-pink-50 text-slate-900",
    "minimalist": "bg-stone-50 text-stone-900"
  };

  const containerClass = themeClasses[theme];

  const swiperRef = useRef<SwiperType>();

  const renderSection = (section: ProposalData['sections'][0]) => {
    switch (section.type) {
      case 'hero':
        return <HeroSection section={section} />;
      case 'text':
        return <TextSection section={section} />;
      case 'lineItems':
        return <LineItemSection section={section} />;
      case 'pricing':
        return <PricingSection section={section} onSign={onSign} readOnly={readOnly} />;
      case 'legal':
        return <LegalSection section={section} />;
      default:
        return null;
    }
  };

  // Apply theme-based colors
  const getThemeColors = () => {
    switch (proposal.theme) {
      case 'modern':
        return {
          background: 'bg-gradient-to-br from-blue-50 via-white to-purple-50',
          pagination: '#6366f1',
          navigation: '#4f46e5'
        };
      case 'creative':
        return {
          background: 'bg-gradient-to-br from-pink-50 via-white to-orange-50',
          pagination: '#f43f5e',
          navigation: '#e11d48'
        };
      case 'minimalist':
        return {
          background: 'bg-white',
          pagination: '#000000',
          navigation: '#000000'
        };
      default:
        return {
          background: 'bg-slate-50',
          pagination: '#64748b',
          navigation: '#475569'
        };
    }
  };

  const themeColors = getThemeColors();

  return (
    <div className={`min-h-screen ${containerClass}`}>
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
          '--swiper-pagination-color': themeColors.pagination,
          '--swiper-navigation-color': themeColors.navigation,
        } as React.CSSProperties}
      >
        {proposal.sections.map((section) => (
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
