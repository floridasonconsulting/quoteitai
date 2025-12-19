import { motion } from "framer-motion";
import { CategoryGroup, ProposalItem } from "@/types/proposal";
import { cn } from "@/lib/utils";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Edit3, ImageOff } from "lucide-react";
import { useState } from "react";

// Helper to generate consistent colors from strings
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function ItemImage({ item, isOwner, onEdit }: { item: ProposalItem, isOwner?: boolean, onEdit: () => void }) {
  const [hasError, setHasError] = useState(false);
  const showFallback = hasError || !item.imageUrl?.startsWith('http');

  return (
    <div className="flex-shrink-0 w-full md:w-32 h-32 md:h-32 relative group/img">
      {!showFallback ? (
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-full h-full object-cover rounded-lg shadow-sm"
          loading="lazy"
          onError={() => setHasError(true)}
        />
      ) : (
        <div
          className="w-full h-full rounded-lg shadow-sm flex items-center justify-center bg-gray-100 dark:bg-gray-800"
          style={{
            background: item.imageUrl && (item.imageUrl.includes('gradient') || item.imageUrl.startsWith('#'))
              ? item.imageUrl
              : `linear-gradient(135deg, ${stringToColor(item.name)}40 0%, ${stringToColor(item.name)}10 100%)`
          }}
        >
          {!item.imageUrl?.includes('gradient') && (
            <span className="text-2xl font-bold opacity-30 uppercase">
              {item.name.substring(0, 2)}
            </span>
          )}
        </div>
      )}

      {isOwner && (
        <button
          onClick={onEdit}
          className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
        >
          <Edit3 className="w-5 h-5 text-white" />
        </button>
      )}
    </div>
  );
}

interface CategoryGroupSectionProps {
  categoryGroup: CategoryGroup;
  backgroundImage?: string;
  showPricing?: boolean;
  isOwner?: boolean;
  onEditBackgroundImage?: (url?: string) => void;
  onEditItemImage?: (itemName: string, url?: string) => void;
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
  backgroundImage,
  showPricing = true,
  isOwner,
  onEditBackgroundImage,
  onEditItemImage,
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
  });

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

    // If scrolling down (content moving up) AND not at bottom -> Stop Swiper
    if (diff > 0 && !isAtBottom) {
      e.stopPropagation();
    }
    // If scrolling up (content moving down) AND not at top -> Stop Swiper
    else if (diff < 0 && !isAtTop) {
      e.stopPropagation();
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Hero Title Banner - REDUCED HEIGHT */}
      <div
        className="relative h-32 md:h-40 flex items-center justify-center overflow-hidden flex-shrink-0"
        style={{
          backgroundImage: backgroundImage
            ? (backgroundImage.startsWith('linear-gradient') || backgroundImage.startsWith('radial-gradient') || backgroundImage.startsWith('conic-gradient') || backgroundImage.startsWith('url')
              ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), ${backgroundImage}`
              : `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.6)), url(${backgroundImage})`)
            : "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--secondary)) 100%)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Owner Action */}
        {isOwner && (
          <div className="absolute top-4 right-4 z-50">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEditBackgroundImage?.(backgroundImage)}
              className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 rounded-full font-bold uppercase tracking-wider text-[10px]"
            >
              <Edit3 className="w-3 h-3 mr-2" />
              Edit Header Image
            </Button>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6 }}
              className="space-y-2"
            >
              <span className="text-xs md:text-sm uppercase tracking-[0.3em] text-white/70 font-bold">SECTION</span>
              <h2 className="text-2xl md:text-4xl font-black text-white tracking-tight uppercase drop-shadow-lg">
                {categoryGroup.displayName || categoryGroup.category}
              </h2>
              {categoryGroup.description && (
                <div className="h-1 w-12 bg-primary mx-auto my-4 rounded-full" />
              )}
              {categoryGroup.description && (
                <p className="text-sm md:text-lg text-white/90 max-w-2xl mx-auto font-medium leading-relaxed italic opacity-80 decoration-primary/30">
                  {categoryGroup.description}
                </p>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar touch-pan-y"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-16">
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
                {item.imageUrl && (
                  <ItemImage item={item} isOwner={isOwner} onEdit={() => onEditItemImage?.(item.name, item.imageUrl)} />
                )}



                {/* If no image and is owner, show a placeholder edit trigger */}
                {!item.imageUrl && isOwner && (
                  <div className="flex-shrink-0 w-full md:w-12 h-12 md:h-32 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => onEditItemImage?.(item.name)}
                  >
                    <Edit3 className="w-4 h-4 text-gray-400" />
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
    </div >
  );
}