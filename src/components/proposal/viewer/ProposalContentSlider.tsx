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
        mousewheel={true}
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
          : undefined,
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
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Slide Component: Text Section
 */
function TextSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full p-8 md:p-16 overflow-y-auto">
      <div className="max-w-4xl mx-auto pb-24">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">{section.title}</h2>
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
 * NEW DESIGN: Category subtotals only, single page, print-ready
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
  }, {} as Record<string, typeof section.items>);

  // Calculate category subtotals
  const categorySubtotals = Object.entries(itemsByCategory || {}).map(([category, items]) => ({
    category,
    items: items || [],
    subtotal: (items || []).reduce((sum, item) => sum + item.total, 0)
  }));

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-950 overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full p-8 md:p-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {section.title || "Investment Summary"}
          </h2>
          <div className="h-1 w-24 bg-primary mx-auto rounded-full" />
        </div>

        {/* Professional Line Item Format */}
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-8 space-y-6">
          {categorySubtotals.map(({ category, items, subtotal }, idx) => (
            <div key={idx} className="space-y-2">
              {/* Category Header */}
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
                {category}
              </h3>

              {/* Items (no pricing) */}
              <div className="space-y-1 pl-4">
                {items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <span className="text-primary mt-1">•</span>
                    <span>{item.name}</span>
                  </div>
                ))}
              </div>

              {/* Category Subtotal with Dotted Leader */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Subtotal
                </span>
                <div className="flex-1 mx-4 border-b border-dotted border-gray-300 dark:border-gray-600" />
                <span className="text-base font-bold text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>
          ))}

          {/* Total Investment */}
          <div className="pt-6 mt-6 border-t-2 border-gray-900 dark:border-white">
            <div className="flex items-center justify-between">
              <span className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                Total Investment
              </span>
              <div className="flex-1 mx-6 border-b-2 border-dotted border-gray-400 dark:border-gray-500" />
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {formatCurrency(section.total || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            All pricing subject to terms and conditions outlined in this proposal
          </p>
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
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-8 md:p-16 pb-24">
        <div className="mb-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {section.title || "Terms & Conditions"}
          </h2>
          <div className="h-1 w-32 bg-primary rounded-full" />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-8 md:p-12">
          <div className="prose prose-base dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-base leading-relaxed text-gray-700 dark:text-gray-300">
              {section.terms || section.content}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}