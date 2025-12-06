import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Keyboard, Mousewheel } from "swiper/modules";
import { motion } from "framer-motion";
import type { Swiper as SwiperType } from "swiper";
import type { ProposalSection, CategoryGroup } from "@/types/proposal";
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
    <div className="h-full flex items-center justify-center p-8 md:p-16">
      <div className="max-w-4xl">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-4xl md:text-6xl font-bold mb-6">{section.title}</h1>
          {section.subtitle && (
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">{section.subtitle}</p>
          )}
          {section.content && (
            <div className="prose prose-lg dark:prose-invert max-w-none">
              <p className="text-lg leading-relaxed">{section.content}</p>
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
 * Slide Component: Line Items (Legacy)
 */
function LineItemsSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full p-8 md:p-16 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">{section.title || "Investment Breakdown"}</h2>
        
        <div className="space-y-4">
          {section.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between items-start p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              {section.showPricing !== false && (
                <p className="font-semibold ml-4">${item.total.toLocaleString()}</p>
              )}
            </div>
          ))}
        </div>

        {section.showPricing !== false && (
          <div className="mt-8 space-y-2 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex justify-between text-lg">
              <span>Subtotal</span>
              <span>${section.subtotal?.toLocaleString()}</span>
            </div>
            {section.tax && section.tax > 0 && (
              <div className="flex justify-between text-lg">
                <span>Tax</span>
                <span>${section.tax.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-2xl font-bold pt-4 border-t border-gray-200 dark:border-gray-800">
              <span>Total</span>
              <span>${section.total?.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Slide Component: Legal/Terms
 */
function LegalSlide({ section }: { section: ProposalSection }) {
  return (
    <div className="h-full p-8 md:p-16 overflow-y-auto bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8">{section.title || "Terms & Conditions"}</h2>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{section.terms || section.content}</p>
        </div>
      </div>
    </div>
  );
}