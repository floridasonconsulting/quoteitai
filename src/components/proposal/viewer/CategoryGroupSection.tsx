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
    <div 
      className="min-h-screen p-8 md:p-16"
      style={{
        backgroundImage: backgroundImage 
          ? `linear-gradient(rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.95)), url(${backgroundImage})`
          : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Category Header */}
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

        {/* Items Grid */}
        <div className="space-y-8 mb-12">
          {categoryGroup.items.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.5 }}
              className={cn(
                "flex flex-col md:flex-row gap-6 bg-white/80 dark:bg-gray-900/80 p-6 md:p-8 rounded-2xl shadow-lg backdrop-blur-sm",
                "hover:shadow-xl transition-shadow duration-300"
              )}
            >
              {/* Item Image */}
              {item.imageUrl && (
                <div className="flex-shrink-0 w-full md:w-64 h-48 md:h-auto">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-full h-full object-cover rounded-xl"
                    loading="lazy"
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