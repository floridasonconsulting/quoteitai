import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, Mousewheel } from "swiper/modules";
import { motion } from "framer-motion";
import type { Swiper as SwiperType } from "swiper";
import type { ProposalSection } from "@/types/proposal";
import { CategoryGroupSection } from "./CategoryGroupSection";
import { ScopeOfWorkSlide } from "./ScopeOfWorkSlide";
import { Button } from "@/components/ui/button";
import { Edit3, ExternalLink } from "lucide-react";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ProposalContentSliderProps {
  sections: ProposalSection[];
  onSlideChange: (index: number) => void;
  activeIndex?: number;
  isOwner?: boolean;
  onEditSectionImage?: (sectionId: string, currentUrl?: string) => void;
  onEditItemImage?: (itemName: string, currentUrl?: string) => void;
  settings?: any;
}

/**
 * Dynamic Swiper-based Content Slider
 * UPDATED: Professional investment summary with category subtotals only
 */
export function ProposalContentSlider({
  sections,
  onSlideChange,
  activeIndex = 0,
  isOwner,
  onEditSectionImage,
  onEditItemImage,
  settings,
}: ProposalContentSliderProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(activeIndex);

  useEffect(() => {
    if (swiperRef.current && activeIndex !== currentIndex) {
      swiperRef.current.slideTo(activeIndex);
    }
  }, [activeIndex, currentIndex]);

  const handleSlideChange = (swiper: SwiperType) => {
    const newIndex = swiper.activeIndex;
    setCurrentIndex(newIndex);
    onSlideChange(newIndex);
  };

  // Detect Desktop View
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if window is defined (SSR safety)
    if (typeof window === 'undefined') return;

    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // Md breakpoint
    };

    // Initial check
    checkDesktop();

    // Listen
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Auto-paginate categories with >10 items
  const processedSections = processSectionsForPagination(sections);

  return (
    <div className="h-full w-full overflow-hidden">
      <Swiper
        modules={[Navigation, Pagination, Keyboard, Mousewheel]}
        direction="horizontal"
        slidesPerView={1}
        centeredSlides={true}
        spaceBetween={0}
        autoHeight={false}
        mousewheel={{
          thresholdDelta: 50,
          forceToAxis: true,
        }}
        keyboard={{ enabled: true }}
        pagination={{
          clickable: true,
          renderBullet: function (index, className) {
            return '<span class="' + className + ' w-2 h-2"></span>';
          }
        }}
        navigation={true}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          swiper.update();
        }}
        onSlideChange={handleSlideChange}
        className="h-full w-full proposal-swiper"
        style={{ height: '100%', width: '100%' }}
      >
        {processedSections.map((section, index) => (
          <SwiperSlide key={`${section.id}-${index}`}>
            <div className="w-full h-full relative flex flex-col">
              <SlideContent
                section={section}
                isActive={index === currentIndex}
                isOwner={isOwner}
                onEditSectionImage={onEditSectionImage}
                onEditItemImage={onEditItemImage}
                settings={settings}
              />

              {/* Desktop Visual Hints */}
              {isDesktop && (
                <div className="absolute bottom-6 right-16 z-40 bg-black/40 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-bold tracking-widest border border-white/10 pointer-events-none">
                  PAGE {index + 1} / {processedSections.length}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Global Custom Navigation Styling */}
      <style>{`
        .swiper-button-next, .swiper-button-prev {
            color: ${isDesktop ? 'hsl(var(--primary))' : 'white'} !important;
            background: ${isDesktop ? 'rgba(255,255,255,0.8)' : 'transparent'};
            width: 44px !important;
            height: 44px !important;
            border-radius: 50%;
            backdrop-filter: blur(4px);
            box-shadow: ${isDesktop ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'};
            transition: all 0.2s ease;
            margin-top: -22px !important;
        }
        .swiper-button-next:hover, .swiper-button-prev:hover {
            transform: scale(1.1);
            background: white;
            box-shadow: 0 6px 16px rgba(0,0,0,0.15);
        }
        .swiper-button-next::after, .swiper-button-prev::after {
            font-size: 18px !important;
            font-weight: 800 !important;
        }
        .swiper-pagination-bullet {
            width: 8px;
            height: 8px;
            transition: all 0.3s ease;
            background: rgba(0,0,0,0.2) !important;
            opacity: 1 !important;
        }
        .swiper-pagination-bullet-active {
            width: 24px;
            border-radius: 4px;
            background: hsl(var(--primary)) !important;
        }
      `}</style>
    </div>
  );
}

/**
 * Process sections to auto-paginate categories with >10 items
 */
function processSectionsForPagination(sections: ProposalSection[]): ProposalSection[] {
  const processed: ProposalSection[] = [];

  sections.forEach((section) => {
    if (section.type === 'categoryGroup' && section.categoryGroups?.[0]) {
      const categoryGroup = section.categoryGroups[0];
      const items = categoryGroup.items;

      // If category has >10 items, split into multiple slides
      if (items.length > 10) {
        const itemsPerPage = 10;
        const pageCount = Math.ceil(items.length / itemsPerPage);

        for (let i = 0; i < pageCount; i++) {
          const pageItems = items.slice(i * itemsPerPage, (i + 1) * itemsPerPage);
          const pageSubtotal = pageItems.reduce((sum, item) => sum + item.total, 0);

          processed.push({
            ...section,
            id: `${section.id}-page-${i + 1}`,
            title: `${section.title} (${i + 1} of ${pageCount})`,
            categoryGroups: [{
              ...categoryGroup,
              items: pageItems,
              subtotal: pageSubtotal
            }]
          });
        }
      } else {
        processed.push(section);
      }
    } else {
      processed.push(section);
    }
  });

  return processed;
}

/**
 * Individual Slide Content Renderer
 */
function SlideContent({
  section,
  isActive,
  isOwner,
  onEditSectionImage,
  onEditItemImage,
  settings,
}: {
  section: ProposalSection;
  isActive: boolean;
  isOwner?: boolean;
  onEditSectionImage?: (sectionId: string, currentUrl?: string) => void;
  onEditItemImage?: (itemName: string, currentUrl?: string) => void;
  settings?: any;
}) {
  const getSlideComponent = () => {
    switch (section.type) {
      case 'hero':
        return <HeroSlide section={section} isOwner={isOwner} onEditImage={(url) => onEditSectionImage?.(section.id, url)} />;
      case 'text':
        return <TextSlide section={section} isOwner={isOwner} onEditImage={(url) => onEditSectionImage?.(section.id, url)} />;
      case 'categoryGroup':
        return <CategorySlide
          section={section}
          isOwner={isOwner}
          onEditSectionImage={onEditSectionImage}
          onEditItemImage={onEditItemImage}
        />;
      case 'lineItems':
        return <InvestmentSummarySlide
          section={section}
          isOwner={isOwner}
          onEditImage={(url) => onEditSectionImage?.(section.id, url)}
          settings={settings}
        />;
      case 'legal':
        return <ScopeOfWorkSlide section={section} isOwner={isOwner} onEditImage={(url) => onEditSectionImage?.(section.id, url)} />;
      case 'scopeOfWork':
        return <ScopeOfWorkSlide section={section} isOwner={isOwner} onEditImage={(url) => onEditSectionImage?.(section.id, url)} />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isActive ? 1 : 0.7 }}
      transition={{ duration: 0.4 }}
      className="h-full w-full"
    >
      {getSlideComponent()}
    </motion.div>
  );
}

/**
 * Slide Component: Hero/Executive Summary
 */
function HeroSlide({
  section,
  isOwner,
  onEditImage
}: {
  section: ProposalSection,
  isOwner?: boolean,
  onEditImage?: (url?: string) => void
}) {
  return (
    <div
      className="h-full flex items-center justify-center p-8 md:p-16 relative overflow-y-auto"
      style={{
        backgroundImage: section.backgroundImage
          ? (section.backgroundImage.startsWith('linear-gradient') || section.backgroundImage.startsWith('radial-gradient') || section.backgroundImage.startsWith('conic-gradient') || section.backgroundImage.startsWith('url')
            ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), ${section.backgroundImage}`
            : `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${section.backgroundImage})`)
          : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)', // Use bold theme colors
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Owner Action */}
      {isOwner && (
        <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEditImage?.(section.backgroundImage)}
            className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
          >
            <Edit3 className="w-3 h-3 mr-2" />
            Edit Landing Image
          </Button>
        </div>
      )}
      <div className="max-w-4xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className={section.backgroundImage ? "text-white" : ""}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{section.title}</h1>
          {section.subtitle && (
            <p className="text-xl md:text-2xl mb-8 opacity-90">{section.subtitle}</p>
          )}
          {section.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          )}
          {section.total !== undefined && (
            <div className="mt-12 inline-block bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 md:p-8">
              <p className="text-white/60 text-sm uppercase tracking-widest font-medium mb-1">Total Investment</p>
              <p className="text-4xl md:text-5xl font-bold text-white">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: section.currency || 'USD',
                }).format(section.total)}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Slide Component: Text Section (Terms & Conditions)
 */
function TextSlide({
  section,
  isOwner,
  onEditImage
}: {
  section: ProposalSection,
  isOwner?: boolean,
  onEditImage?: (url?: string) => void
}) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Consistent Header Banner */}
      <div className="relative w-full h-32 md:h-40 flex-shrink-0"
        style={{
          backgroundImage: section.backgroundImage
            ? (section.backgroundImage.startsWith('linear-gradient') || section.backgroundImage.startsWith('radial-gradient') || section.backgroundImage.startsWith('conic-gradient') || section.backgroundImage.startsWith('url')
              ? section.backgroundImage
              : `url(${section.backgroundImage})`)
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        {/* Owner Action */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditImage?.(section.backgroundImage)}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
            >
              <Edit3 className="w-3 h-3 mr-2" />
              Edit Header Image
            </Button>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{section.title}</h2>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto pb-24">
          {section.subtitle && (
            <p className="text-lg text-muted-foreground mb-8">{section.subtitle}</p>
          )}
          {section.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-base leading-relaxed whitespace-pre-wrap">{section.content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Slide Component: Category Group (Magazine Style)
 */
function CategorySlide({
  section,
  isOwner,
  onEditSectionImage,
  onEditItemImage
}: {
  section: ProposalSection,
  isOwner?: boolean,
  onEditSectionImage?: (id: string, url?: string) => void,
  onEditItemImage?: (name: string, url?: string) => void
}) {
  const categoryGroup = section.categoryGroups?.[0];

  if (!categoryGroup) return null;

  return (
    <CategoryGroupSection
      categoryGroup={categoryGroup}
      showPricing={section.showPricing}
      pricingMode={section.pricingMode}
      backgroundImage={section.backgroundImage}
      isOwner={isOwner}
      onEditBackgroundImage={(url) => onEditSectionImage?.(section.id, url)}
      onEditItemImage={onEditItemImage}
    />
  );
}

/**
 * Slide Component: Investment Summary (Professional Format)
 * UPDATED: Tighter spacing, smaller text, and Pricing Display Modes
 */
function InvestmentSummarySlide({
  section,
  isOwner,
  onEditImage,
  settings
}: {
  section: ProposalSection,
  isOwner?: boolean,
  onEditImage?: (url?: string) => void,
  settings?: any
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const proposalSettings = settings;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    if (touchStartY.current === null) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;
    const { scrollTop, scrollHeight, clientHeight } = container;

    // Safety check for scroll dimensions
    if (scrollHeight <= clientHeight) return;

    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    // Use cancelable check if possible, or just swallow error if preventDefault fails
    // React synthetic events manage this, but logic here is stopPropagation
    if (diff > 0 && !isAtBottom) {
      e.stopPropagation();
    } else if (diff < 0 && !isAtTop) {
      e.stopPropagation();
    }
  };

  // Handle wheel events intelligently - only stop propagation when we can actually scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;

    const isAtTop = scrollTop === 0;
    const isAtBottom = Math.ceil(scrollTop + clientHeight) >= scrollHeight;

    // Only prevent Swiper navigation if we're scrolling within bounds
    if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
      e.stopPropagation();
    }
  };

  // Group items by category
  const itemsByCategory = section.items?.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Helper to ensure consistent category order
  const sortedCategories = Object.keys(itemsByCategory || {}).sort((a, b) => {
    // Prioritize specific categories if needed, otherwise alphabetical
    const priority = ['Pool', 'Spa', 'Decking', 'Equipment', 'Screen Enclosure'];
    const idxA = priority.indexOf(a);
    const idxB = priority.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const categorySubtotals = sortedCategories.map(category => ({
    category,
    items: itemsByCategory[category] || [],
    subtotal: (itemsByCategory[category] || []).reduce((sum: any, item: any) => sum + item.total, 0)
  }));

  // Determine active pricing mode from section data
  const pricingMode = section.pricingMode || 'category_total';

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] dark:bg-gray-950 overflow-hidden">
      {/* Header Banner */}
      <div className="relative w-full h-32 md:h-40 flex-shrink-0"
        style={{
          backgroundImage: section.backgroundImage
            ? (section.backgroundImage.startsWith('linear-gradient') || section.backgroundImage.startsWith('radial-gradient') || section.backgroundImage.startsWith('conic-gradient') || section.backgroundImage.startsWith('url')
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), ${section.backgroundImage}`
              : `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${section.backgroundImage})`)
            : 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />

        {/* Owner Action */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditImage?.(section.backgroundImage)}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
            >
              <Edit3 className="w-3 h-3 mr-2" />
              Edit Header Image
            </Button>
          </div>
        )}

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <span className="text-[10px] md:text-sm uppercase tracking-[0.3em] text-white/70 font-bold mb-1 block">PROJECT OVERVIEW</span>
            <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-lg">
              {section.title || "Scope & Investment"}
            </h2>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="flex-1 overflow-y-auto w-full custom-scrollbar touch-pan-y"
      >
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

            {/* Left: Detailed Scope (Table Style) */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-6 w-1 bg-primary rounded-full" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white uppercase tracking-wider">Project Scope Breakdown</h3>
              </div>

              <div className="space-y-4">
                {categorySubtotals.map(({ category, items, subtotal }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="mb-8 last:mb-0"
                  >
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b-2 border-gray-100 dark:border-gray-800 pb-2 mb-4">
                      <h4 className="text-sm font-black text-gray-900 dark:text-gray-100 uppercase tracking-widest">
                        {category}
                      </h4>
                      {pricingMode !== 'grand_total' && (
                        <span className="text-xs font-bold text-primary bg-primary/5 px-2 py-1 rounded">
                          {formatCurrency(subtotal)}
                        </span>
                      )}
                    </div>

                    {/* Items List */}
                    <div className="space-y-2 pl-2">
                      {items.map((item: any, itemIdx: number) => (
                        <div key={itemIdx} className="group flex justify-between items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                {item.name}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                                {item.description}
                              </p>
                            )}
                            {pricingMode === 'itemized' && item.quantity > 1 && (
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 rounded mt-1 inline-block">
                                Qty: {item.quantity}
                              </span>
                            )}
                          </div>

                          {/* Price Display (Only if Itemized) */}
                          {pricingMode === 'itemized' && (
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">
                              {formatCurrency(item.total)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Investment Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-0 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[1.5rem] border-2 border-primary/20 shadow-xl overflow-hidden">
                  <div className="bg-primary p-6 text-center text-white">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Investment Total</p>
                    <h3 className="text-3xl md:text-4xl font-black tracking-tighter">{formatCurrency(section.total || 0)}</h3>
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="space-y-3">
                      {section.tax > 0 ? (
                        <>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Project Subtotal</span>
                            <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(section.subtotal || 0)}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-medium tracking-tight">Estimated Tax</span>
                            <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(section.tax || 0)}</span>
                          </div>
                        </>
                      ) : null}

                      <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-base font-black text-gray-900 dark:text-white uppercase tracking-tighter">
                          {section.tax > 0 ? "Total Amount" : "Total Investment"}
                        </span>
                        <span className="text-xl font-black text-primary tracking-tighter">{formatCurrency(section.total || 0)}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
                      <p className="text-[10px] leading-relaxed text-blue-700/80 dark:text-blue-300/80 italic text-center">
                        This investment summary represents the total scope of work outlined in the preceding sections.
                      </p>
                    </div>

                    {proposalSettings?.showFinancing && (
                      <div className="space-y-3 pt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] text-center">
                          {proposalSettings.financingText || "Flexible Financing Available"}
                        </p>
                        {proposalSettings.financingLink && (
                          <div className="flex justify-center">
                            <a
                              href={proposalSettings.financingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] font-black text-primary hover:underline flex items-center gap-1 uppercase tracking-widest"
                            >
                              Apply Now <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        )}
                        <div className="flex justify-center gap-2">
                          <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                          <div className="h-0.5 w-6 bg-primary/40 rounded-full" />
                          <div className="h-0.5 w-6 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-900 dark:bg-white rounded-xl p-5 text-white dark:text-gray-900 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/10 dark:bg-gray-100 p-2.5 rounded-lg font-black text-lg">100%</div>
                    <div>
                      <p className="text-[11px] font-bold leading-tight">Price Protection Guaranteed</p>
                      <p className="text-[10px] opacity-70">Locked for 30 days from proposal date.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Acceptance of this proposal constitutes a binding agreement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
