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
 * Maps proposal sections to slides with auto-generated category slides
 */
export function ProposalContentSlider({
  sections,
  onSlideChange,
  activeIndex = 0,
}: ProposalContentSliderProps) {
  const swiperRef = useRef<SwiperType | null>(null);
  const [currentIndex, setCurrentIndex] = useState(activeIndex);

  // Sync external navigation to swiper
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
        {sections.map((section, index) => (
          <SwiperSlide key={section.id}>
            <SlideContent section={section} isActive={index === currentIndex} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
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
        return <LineItemsSlide section={section} />;
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
      className="h-full w-full overflow-y-auto"
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
      className="h-full flex items-center justify-center p-8 md:p-16 relative"
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
      <div className="max-w-4xl mx-auto">
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
 * Slide Component: Line Items (Investment Summary)
 * IMPROVED: Better organization with grouped display and scrolling
 */
function LineItemsSlide({ section }: { section: ProposalSection }) {
  // Group items by category for better organization
  const itemsByCategory = section.items?.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof section.items>);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-8 md:p-12 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-3xl md:text-5xl font-bold text-gray-900 dark:text-white">
          {section.title || "Investment Summary"}
        </h2>
        <p className="text-lg text-muted-foreground mt-2">
          Complete breakdown of all items and services
        </p>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto p-8 md:p-12">
        <div className="max-w-5xl mx-auto space-y-8">
          {itemsByCategory && Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg overflow-hidden">
              {/* Category Header */}
              <div className="bg-gray-100 dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{category}</h3>
              </div>

              {/* Items List */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {items?.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="flex justify-between items-start p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0 pr-6">
                      <p className="font-semibold text-lg text-gray-900 dark:text-white mb-1">
                        {item.name}
                      </p>
                      <p className="text-sm text-muted-foreground mb-2">
                        {item.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity} {item.units || 'units'}</span>
                        {section.showPricing !== false && (
                          <>
                            <span>•</span>
                            <span>Unit: ${item.price.toLocaleString()}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {section.showPricing !== false && (
                      <div className="flex-shrink-0 text-right">
                        <p className="text-2xl font-bold text-primary">
                          ${item.total.toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Footer - Fixed */}
      {section.showPricing !== false && (
        <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-700 p-8 md:p-12">
          <div className="max-w-5xl mx-auto space-y-4">
            <div className="flex justify-between text-xl">
              <span className="font-medium text-gray-700 dark:text-gray-300">Subtotal</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                ${section.subtotal?.toLocaleString()}
              </span>
            </div>
            {section.tax && section.tax > 0 && (
              <div className="flex justify-between text-xl">
                <span className="font-medium text-gray-700 dark:text-gray-300">Tax</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${section.tax.toLocaleString()}
                </span>
              </div>
            )}
            <div className="flex justify-between text-3xl pt-4 border-t-2 border-gray-200 dark:border-gray-800">
              <span className="font-bold text-gray-900 dark:text-white">Total Investment</span>
              <span className="font-bold text-primary">
                ${section.total?.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Slide Component: Legal/Terms
 * IMPROVED: Better typography and readability
 */
function LegalSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto p-8 md:p-16">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900 dark:text-white">
            {section.title || "Terms & Conditions"}
          </h2>
          <div className="h-1 w-32 bg-primary rounded-full" />
        </div>

        {/* Content */}
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