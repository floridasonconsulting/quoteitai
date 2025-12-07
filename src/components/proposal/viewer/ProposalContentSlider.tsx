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
 * FIXED: All viewport handling issues, proper scrolling, no content hanging off
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
 * Slide Component: Investment Summary (Fancy Line Item Price Sheet)
 * FIXED: Large scrollbar, auto-scroll on hover, simple format with project total only
 */
function LineItemsSlide({ section }: { section: ProposalSection }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Auto-scroll effect when hovering in the scrollable area
  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer || !isScrolling) return;

    let animationFrameId: number;
    let scrollSpeed = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = scrollContainer.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const containerHeight = rect.height;
      
      // Calculate scroll speed based on cursor position
      if (y < containerHeight * 0.2) {
        // Near top - scroll up
        scrollSpeed = -2;
      } else if (y > containerHeight * 0.8) {
        // Near bottom - scroll down
        scrollSpeed = 2;
      } else {
        scrollSpeed = 0;
      }
    };

    const animate = () => {
      if (scrollSpeed !== 0 && scrollContainer) {
        scrollContainer.scrollTop += scrollSpeed;
      }
      animationFrameId = requestAnimationFrame(animate);
    };

    scrollContainer.addEventListener('mousemove', handleMouseMove);
    animate();

    return () => {
      scrollContainer.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isScrolling]);

  // Group items by category
  const itemsByCategory = section.items?.reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, typeof section.items>);

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 md:p-8 bg-white dark:bg-gray-900 border-b-2 border-gray-300 dark:border-gray-700">
        <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {section.title || "Investment Summary"}
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Complete project overview
        </p>
      </div>

      {/* FIXED: Large Scrollbar + Auto-Scroll on Hover */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-scroll relative scroll-smooth"
        style={{ maxHeight: 'calc(100vh - 300px)' }}
        onMouseEnter={() => setIsScrolling(true)}
        onMouseLeave={() => setIsScrolling(false)}
      >
        {/* Custom LARGE scrollbar styling */}
        <style>{`
          .flex-1.overflow-y-scroll::-webkit-scrollbar {
            width: 20px;
          }
          .flex-1.overflow-y-scroll::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.1);
            border-radius: 10px;
            margin: 8px;
          }
          .flex-1.overflow-y-scroll::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.3);
            border-radius: 10px;
            border: 3px solid rgba(255, 255, 255, 0.2);
          }
          .flex-1.overflow-y-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.5);
          }
        `}</style>
        
        <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-4">
          {itemsByCategory && Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="bg-white dark:bg-gray-900 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-800">
              {/* Category Header */}
              <div className="bg-gray-100 dark:bg-gray-800 px-5 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-base md:text-lg font-bold text-gray-900 dark:text-white">{category}</h3>
              </div>

              {/* Simple Line Items - NO PRICING (just names) */}
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {items?.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <p className="font-medium text-sm md:text-base text-gray-900 dark:text-white">
                      {item.name}
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mt-1 leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals Footer - Fixed - ONLY PROJECT TOTAL */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-900 border-t-2 border-gray-300 dark:border-gray-700 p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center text-2xl md:text-3xl">
            <span className="font-bold text-gray-900 dark:text-white">Total Project Investment</span>
            <span className="font-bold text-primary">
              ${section.total?.toLocaleString()}
            </span>
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