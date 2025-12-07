import { motion } from "framer-motion";
import { CategoryGroup } from "@/types/proposal";
import { cn } from "@/lib/utils";

interface CategoryGroupSectionProps {
  categoryGroup: CategoryGroup;
  showPricing?: boolean;
  backgroundImage?: string;
}

/**
 * Magazine-Style Category Section
 * FIXED: Proper viewport handling, no content hanging off
 * FIXED: Correct pricing visibility logic (hides qty + unit price when showPricing=false)
 */
export function CategoryGroupSection({
  categoryGroup,
  showPricing = true,
  backgroundImage,
}: CategoryGroupSectionProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };
  
  console.log('[CategoryGroupSection] Rendering:', {
    category: categoryGroup.category,
    itemCount: categoryGroup.items.length,
    backgroundImage,
    showPricing,
    firstItemImage: categoryGroup.items[0]?.imageUrl,
    sampleItem: categoryGroup.items[0]
  });

  return (
    <div className="h-full w-full flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      {/* Hero Title Banner */}
      {backgroundImage && (
        <div 
          className="relative w-full h-48 md:h-64 flex-shrink-0"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-3xl md:text-5xl font-bold text-white mb-2"
              >
                {categoryGroup.displayName}
              </motion.h2>
              {categoryGroup.description && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-base md:text-lg text-white/90 max-w-2xl mx-auto"
                >
                  {categoryGroup.description}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FIXED: Scrollable Content Area with proper height constraints */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto p-6 md:p-12 pb-24">
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

          {/* Items Grid */}
          <div className="space-y-6 mb-8">
            {categoryGroup.items.map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className={cn(
                  "flex flex-col gap-4 bg-gray-50 dark:bg-gray-900 p-5 md:p-6 rounded-xl shadow-md",
                  "hover:shadow-lg transition-shadow duration-300 border border-gray-200 dark:border-gray-800",
                  item.imageUrl ? "md:flex-row" : ""
                )}
              >
                {/* Item Image - Only show if imageUrl exists */}
                {item.imageUrl && (
                  <div className="flex-shrink-0 w-full md:w-64 h-48 md:h-56">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg shadow-sm"
                      loading="lazy"
                      onError={(e) => {
                        console.error('[CategoryGroupSection] Image failed to load:', item.imageUrl);
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}

                {/* Item Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl md:text-2xl font-semibold mb-2 text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-3 leading-relaxed">
                      {item.enhancedDescription || item.description}
                    </p>
                  </div>

                  {/* FIXED: Pricing Info - Conditional display based on showPricing */}
                  {showPricing ? (
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-baseline gap-2 text-sm text-muted-foreground">
                        <span>Qty: {item.quantity} {item.units || "units"}</span>
                        <span>•</span>
                        <span>Unit: {formatCurrency(item.price)}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground mb-1">Total</p>
                        <p className="text-xl md:text-2xl font-bold text-primary">
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