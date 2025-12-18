import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, Mousewheel } from "swiper/modules";
import { motion } from "framer-motion";
import type { Swiper as SwiperType } from "swiper";
import type { ProposalSection } from "@/types/proposal";
import { CategoryGroupSection } from "./CategoryGroupSection";

// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ProposalContentSliderProps {
  sections: ProposalSection[];
  onSlideChange: (index: number) => void;
  activeIndex?: number;
}

/**
 * Dynamic Swiper-based Content Slider
 * UPDATED: Professional investment summary with category subtotals only
 */
export function ProposalContentSlider({
  sections,
  onSlideChange,
  activeIndex = 0,
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

  // Auto-paginate categories with >10 items
  const processedSections = processSectionsForPagination(sections);

  return (
    <div className="h-full w-full">
      <Swiper
        modules={[Navigation, Pagination, Keyboard, Mousewheel]}
        direction="vertical"
        slidesPerView={1}
        spaceBetween={0}
        mousewheel={{
          releaseOnEdges: true,
          forceToAxis: true,
          sensitivity: 0.5,
          thresholdDelta: 50,
        }}
        keyboard={{ enabled: true }}
        pagination={{ clickable: true }}
        navigation={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={handleSlideChange}
        className="h-full w-full proposal-swiper"
      >
        {processedSections.map((section, index) => (
          <SwiperSlide key={`${section.id}-${index}`}>
            <SlideContent section={section} isActive={index === currentIndex} />
          </SwiperSlide>
        ))}
      </Swiper>
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
function SlideContent({ section, isActive }: { section: ProposalSection; isActive: boolean }) {
  const getSlideComponent = () => {
    switch (section.type) {
      case 'hero':
        return <HeroSlide section={section} />;
      case 'text':
        return <TextSlide section={section} />;
      case 'categoryGroup':
        return <CategorySlide section={section} />;
      case 'lineItems':
        return <InvestmentSummarySlide section={section} />;
      case 'legal':
        return <LegalSlide section={section} />;
      default:
        return <div>Unknown section type</div>;
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
function HeroSlide({ section }: { section: ProposalSection }) {
  return (
    <div
      className="h-full flex items-center justify-center p-8 md:p-16 relative overflow-y-auto"
      style={{
        backgroundImage: section.backgroundImage
          ? `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.6)), url(${section.backgroundImage})`
          : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', // Unified professional dark theme
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
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
function TextSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Consistent Header Banner */}
      <div className="relative w-full h-32 md:h-40 flex-shrink-0"
        style={{
          backgroundImage: section.backgroundImage
            ? `url(${section.backgroundImage})`
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
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
function CategorySlide({ section }: { section: ProposalSection }) {
  const categoryGroup = section.categoryGroups?.[0];

  if (!categoryGroup) return null;

  return (
    <CategoryGroupSection
      categoryGroup={categoryGroup}
      showPricing={section.showPricing}
      backgroundImage={section.backgroundImage}
    />
  );
}

/**
 * Slide Component: Investment Summary (Professional Format)
 * UPDATED: Tighter spacing, smaller text to minimize scrolling
 */
function InvestmentSummarySlide({ section }: { section: ProposalSection }) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Group items by category
  const itemsByCategory = section.items?.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate category subtotals
  const categorySubtotals = Object.entries(itemsByCategory || {}).map(([category, items]) => ({
    category,
    items: items || [],
    subtotal: (items || []).reduce((sum, item) => sum + item.total, 0)
  }));

  return (
    <div className="h-full flex flex-col bg-[#F8FAFC] dark:bg-gray-950 overflow-hidden">
      {/* Premium Header Banner */}
      <div className="relative w-full h-40 md:h-56 flex-shrink-0"
        style={{
          backgroundImage: section.backgroundImage
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${section.backgroundImage})`
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-white/70 font-bold mb-2 block">PROJECT OVERVIEW</span>
            <h2 className="text-3xl md:text-6xl font-black text-white tracking-tight leading-none uppercase drop-shadow-lg">
              {section.title || "Scope & Investment"}
            </h2>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto w-full custom-scrollbar">
        <div className="max-w-6xl mx-auto p-6 md:p-12 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

            {/* Left: Detailed Scope (Table Style) */}
            <div className="lg:col-span-2 space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-8 w-1 bg-primary rounded-full" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">Project Scope Breakdown</h3>
              </div>

              <div className="space-y-6">
                {categorySubtotals.map(({ category, items, subtotal }, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden"
                  >
                    <div className="bg-gray-50/50 dark:bg-gray-800/30 px-6 py-3 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                      <span className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{category}</span>
                      <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded uppercase">{items.length} Items</span>
                    </div>

                    <div className="p-6 space-y-4">
                      <table className="w-full text-left">
                        <thead className="hidden md:table-header-group">
                          <tr className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">
                            <th className="pb-3 pr-4">Description</th>
                            <th className="pb-3 text-right">Investment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                          {items.map((item, itemIdx) => (
                            <tr key={itemIdx} className="group">
                              <td className="py-3 pr-4">
                                <p className="text-sm md:text-base font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors line-clamp-1">{item.name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{item.enhancedDescription || item.description}</p>
                              </td>
                              <td className="py-3 text-right align-top">
                                <span className="text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
                                  {formatCurrency(item.total)}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="pt-4 flex justify-between items-center border-t border-gray-100 dark:border-gray-800">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{category} TOTAL</span>
                        <span className="text-lg font-black text-gray-900 dark:text-white">{formatCurrency(subtotal)}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Investment Summary Card */}
            <div className="lg:col-span-1">
              <div className="sticky top-0 space-y-6">
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-primary/20 shadow-2xl overflow-hidden">
                  <div className="bg-primary p-8 text-center text-white">
                    <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80 mb-2">Investment Total</p>
                    <h3 className="text-4xl md:text-5xl font-black">{formatCurrency(section.total || 0)}</h3>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Project Subtotal</span>
                        <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(section.subtotal || 0)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500 dark:text-gray-400 font-medium">Estimated Tax</span>
                        <span className="text-gray-900 dark:text-white font-bold">{formatCurrency(section.tax || 0)}</span>
                      </div>
                      <div className="h-px bg-gray-100 dark:bg-gray-800 w-full" />
                      <div className="flex justify-between items-center pt-2">
                        <span className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tighter">Total Amount</span>
                        <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(section.total || 0)}</span>
                      </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800/50">
                      <p className="text-[10px] leading-relaxed text-blue-700/80 dark:text-blue-300/80 italic text-center">
                        This investment summary represents the total scope of work outlined in the preceding sections.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] text-center">Flexible Financing Available</p>
                      <div className="flex justify-center gap-2">
                        <div className="h-1 w-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
                        <div className="h-1 w-8 bg-primary/40 rounded-full" />
                        <div className="h-1 w-8 bg-gray-200 dark:bg-gray-800 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-900 dark:bg-white rounded-2xl p-6 text-white dark:text-gray-900 shadow-xl">
                  <div className="flex items-center gap-4">
                    <div className="bg-white/10 dark:bg-gray-100 p-3 rounded-xl font-black text-xl">100%</div>
                    <div>
                      <p className="text-sm font-bold leading-tight">Price Protection Guaranteed</p>
                      <p className="text-[10px] opacity-70">Price locked for 30 days from proposal date.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Note */}
          <div className="mt-16 text-center border-t border-gray-200 dark:border-gray-800 pt-8">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">
              Acceptance of this proposal constitutes a binding agreement
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Slide Component: Legal/Terms
 */
function LegalSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Consistent Header Banner */}
      <div className="relative w-full h-32 md:h-40 flex-shrink-0"
        style={{
          backgroundImage: section.backgroundImage
            ? `url(${section.backgroundImage})`
            : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-2xl md:text-3xl font-bold text-white">{section.title || "Terms & Conditions"}</h2>
        </div>
      </div>

      <div className="flex-1 p-8 md:p-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto pb-24">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 md:p-12 border border-gray-100 dark:border-gray-800">
            <div className="prose prose-base dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700 dark:text-gray-300">
                {section.terms || section.content}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
