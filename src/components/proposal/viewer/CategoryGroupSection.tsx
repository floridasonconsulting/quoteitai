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
 * Displays items in a category with rich visuals and enhanced descriptions
 * Hero image now displays as a title banner at the top
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

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Hero Title Banner - NEW LAYOUT */}
      {backgroundImage && (
        <div 
          className="relative w-full h-64 md:h-80 overflow-hidden"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />
          
          {/* Category Title Overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center px-6">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-4xl md:text-6xl font-bold text-white mb-4"
              >
                {categoryGroup.displayName}
              </motion.h2>
              {categoryGroup.description && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="text-lg md:text-xl text-white/90 max-w-3xl mx-auto"
                >
                  {categoryGroup.description}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content Area - Clean white background */}
      <div className="max-w-6xl mx-auto p-8 md:p-16">
        {/* Category Header - Only show if no background image */}
        {!backgroundImage && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-4 text-gray-900 dark:text-white">
              {categoryGroup.displayName}
            </h2>
            {categoryGroup.description && (
              <p className="text-lg md:text-xl text-muted-foreground max-w-3xl">
                {categoryGroup.description}
              </p>
            )}
            <div className="mt-6 h-1 w-32 bg-primary rounded-full" />
          </motion.div>
        )}

        {/* Items Grid */}
        <div className="space-y-8 mb-12">
          {categoryGroup.items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={cn(
                "flex flex-col gap-6 bg-gray-50 dark:bg-gray-900 p-6 md:p-8 rounded-2xl shadow-lg",
                "hover:shadow-xl transition-shadow duration-300 border border-gray-200 dark:border-gray-800",
                item.imageUrl ? "md:flex-row" : ""
              )}
            >
              {/* Item Image - Only show if imageUrl exists */}
              {item.imageUrl && (
                <div className="flex-shrink-0 w-full md:w-80 h-64 md:h-72">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl shadow-md"
                    loading="lazy"
                    onError={(e) => {
                      // Hide image if it fails to load
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Item Details */}
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div>
                  <h3 className="text-2xl md:text-3xl font-semibold mb-3 text-gray-900 dark:text-white">
                    {item.name}
                  </h3>
                  <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
                    {item.enhancedDescription || item.description}
                  </p>
                </div>

                {/* Pricing Info */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-baseline gap-3">
                    <span className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} {item.units || "units"}
                    </span>
                    {showPricing && (
                      <>
                        <span className="text-sm text-muted-foreground">•</span>
                        <span className="text-sm text-muted-foreground">
                          Unit Price: {formatCurrency(item.price)}
                        </span>
                      </>
                    )}
                  </div>
                  {showPricing && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="text-2xl md:text-3xl font-bold text-primary">
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Category Subtotal */}
        {showPricing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8 border-t-2 border-gray-300 dark:border-gray-700"
          >
            <div className="flex justify-between items-center">
              <span className="text-2xl md:text-3xl font-semibold text-gray-700 dark:text-gray-300">
                {categoryGroup.displayName} Subtotal
              </span>
              <span className="text-3xl md:text-4xl font-bold text-primary">
                {formatCurrency(categoryGroup.subtotal)}
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}