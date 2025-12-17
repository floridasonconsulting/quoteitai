import { motion } from "framer-motion";
import { CategoryGroup } from "@/types/proposal";
import { cn } from "@/lib/utils";
import { useRef } from "react";

interface CategoryGroupSectionProps {
  categoryGroup: CategoryGroup;
  showPricing?: boolean;
  backgroundImage?: string;
}

/**
 * Magazine-Style Category Section
 * UNIVERSAL: Works for ANY industry with smart image fallbacks
 * FIXED: Proper viewport handling, no content hanging off
 * FIXED: Correct pricing visibility logic
 * FIXED: Scroll boundary detection to prevent unwanted slide navigation
 */
export function CategoryGroupSection({
  categoryGroup,
  showPricing = true,
  backgroundImage,
}: CategoryGroupSectionProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Handle wheel events intelligently - only stop propagation when we can actually scroll
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;

    const isAtTop = scrollTop === 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1; // -1 for rounding

    // Only prevent Swiper navigation if we're scrolling within bounds
    if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
      e.stopPropagation();
    }
    // If at top and scrolling up, or at bottom and scrolling down, allow Swiper to take over
  };

  console.log('[CategoryGroupSection] Rendering:', {
    category: categoryGroup.category,
    itemCount: categoryGroup.items.length,
    backgroundImage,
    showPricing,
    itemsWithImages: categoryGroup.items.filter(i => i.imageUrl).length,
    itemsDebug: categoryGroup.items.map(item => ({
      name: item.name,
      hasImageUrl: !!item.imageUrl,
      imageUrl: item.imageUrl,
      imageUrlValid: item.imageUrl && item.imageUrl.startsWith('http')
    }))
  });

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Hero Title Banner - REDUCED HEIGHT */}
      {backgroundImage && (
        <div
          className="relative w-full h-32 md:h-40 flex-shrink-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/60" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-2xl md:text-4xl font-bold text-white mb-1"
              >
                {categoryGroup.displayName}
              </motion.h2>
              {categoryGroup.description && (
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className="text-sm md:text-base text-white/90 max-w-2xl mx-auto line-clamp-1"
                >
                  {categoryGroup.description}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar"
        onWheel={handleWheel}
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-16">
          {/* Category Header - Only show if no background image */}
          {!backgroundImage && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <h2 className="text-3xl md:text-5xl font-bold mb-3 text-gray-900 dark:text-white">
                {categoryGroup.displayName}
              </h2>
              {categoryGroup.description && (
                <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
                  {categoryGroup.description}
                </p>
              )}
              <div className="mt-4 h-1 w-24 bg-primary rounded-full" />
            </motion.div>
          )}

          {/* Items Grid - TIGHTER SPACING */}
          <div className="space-y-4 mb-6">
            {categoryGroup.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05, duration: 0.4 }}
                className={cn(
                  "flex flex-col gap-3 bg-gray-50 dark:bg-gray-900 p-4 md:p-5 rounded-xl shadow-sm",
                  "hover:shadow-md transition-shadow duration-300 border border-gray-200 dark:border-gray-800",
                  item.imageUrl ? "md:flex-row" : ""
                )}
              >
                {/* Item Image - REDUCED SIZE */}
                {item.imageUrl && item.imageUrl.startsWith('http') && (
                  <div className="flex-shrink-0 w-full md:w-32 h-32 md:h-32">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        console.error('[CategoryGroupSection] Image failed to load:', {
                          itemName: item.name,
                          imageUrl: item.imageUrl,
                          error: 'Load failed'
                        });
                        // Hide broken image gracefully
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-1 text-gray-900 dark:text-white leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 dark:text-gray-300 mb-2 leading-snug">
                      {item.enhancedDescription || item.description}
                    </p>
                  </div>

                  {/* FIXED: Pricing Info - Conditional display based on showPricing */}
                  {showPricing ? (
                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-baseline gap-2 text-[10px] md:text-xs text-muted-foreground">
                        <span>Qty: {item.quantity} {item.units || "units"}</span>
                        <span>•</span>
                        <span>Unit: {formatCurrency(item.price)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-base md:text-lg font-bold text-primary">
                          {formatCurrency(item.total)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    /* When pricing is hidden: Show NOTHING (no qty, no unit price, no total) */
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-muted-foreground italic">
                        Pricing available in investment summary
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Category Subtotal - ALWAYS SHOW (even when individual pricing is hidden) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-6 border-t-2 border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 p-6 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <span className="text-xl md:text-2xl font-semibold text-gray-700 dark:text-gray-300">
                {categoryGroup.displayName} Subtotal
              </span>
              <span className="text-2xl md:text-3xl font-bold text-primary">
                {formatCurrency(categoryGroup.subtotal)}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}