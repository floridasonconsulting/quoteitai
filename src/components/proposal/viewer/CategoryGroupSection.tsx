import { ProposalSection } from '@/types/proposal';
import { formatCurrency } from '@/lib/utils';
import { Package } from 'lucide-react';

interface CategoryGroupSectionProps {
  section: ProposalSection;
  theme: {
    colors: {
      primary: string;
      accent: string;
      text: { primary: string; secondary: string };
    };
    typography: {
      fontFamily: { heading: string };
    };
  };
}

export function CategoryGroupSection({ section, theme }: CategoryGroupSectionProps) {
  if (!section.categoryGroups || section.categoryGroups.length === 0) {
    return null;
  }

  const categoryGroup = section.categoryGroups[0];
  const showPricing = section.showPricing === true;

  console.log('[CategoryGroupSection] Rendering:', {
    category: categoryGroup.category,
    displayName: categoryGroup.displayName,
    showPricing,
    itemCount: categoryGroup.items.length,
    items: categoryGroup.items.map(i => ({
      name: i.name,
      hasImage: !!i.imageUrl,
      imageUrl: i.imageUrl ? i.imageUrl.substring(0, 80) + '...' : 'none'
    }))
  });

  return (
    <div className="w-full space-y-8 py-8">
      {/* Category Header */}
      <div 
        className="border-l-4 pl-6 py-4"
        style={{ 
          borderColor: theme.colors.primary,
          fontFamily: theme.typography.fontFamily.heading 
        }}
      >
        <h2 className="text-4xl font-bold mb-4" style={{ color: theme.colors.primary }}>
          {categoryGroup.displayName}
        </h2>
        
        {categoryGroup.description && (
          <p className="text-lg leading-relaxed mb-4" style={{ color: theme.colors.text.secondary }}>
            {categoryGroup.description}
          </p>
        )}
        
        <p className="text-lg" style={{ color: theme.colors.text.secondary }}>
          {categoryGroup.items.length} {categoryGroup.items.length === 1 ? 'Item' : 'Items'}
        </p>
      </div>

      {/* Magazine-Style Item Grid */}
      <div className="grid gap-6">
        {categoryGroup.items.map((item, index) => {
          const hasImage = !!(item.imageUrl && item.imageUrl.trim().length > 0);
          
          console.log(`[CategoryGroupSection] Rendering item "${item.name}":`, {
            index,
            hasImageUrl: hasImage,
            imageUrl: hasImage ? item.imageUrl : 'none',
            showPricing
          });
          
          return (
            <div 
              key={item.itemId || index}
              className="flex gap-6 p-6 bg-white rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
            >
              {/* Item Image */}
              {hasImage ? (
                <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg overflow-hidden">
                  <img 
                    src={item.imageUrl} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    onLoad={() => console.log(`[CategoryGroupSection] ✅ Image loaded: ${item.name}`)}
                    onError={(e) => {
                      console.error(`[CategoryGroupSection] ❌ Image failed: ${item.name}`, item.imageUrl);
                      const target = e.currentTarget;
                      const parent = target.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-100">
                            <svg class="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex-shrink-0 w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-12 h-12 text-gray-400" />
                </div>
              )}

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {item.name}
                  </h3>
                  {/* Only show pricing if enabled */}
                  {showPricing && (
                    <div className="text-right ml-4">
                      <p className="text-sm text-gray-500">
                        {item.quantity} {item.units || 'unit'}{item.quantity > 1 ? 's' : ''} × {formatCurrency(item.price)}
                      </p>
                      <p className="text-xl font-bold" style={{ color: theme.colors.primary }}>
                        {formatCurrency(item.total)}
                      </p>
                    </div>
                  )}
                </div>
                
                {item.description && (
                  <p className="text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Category Subtotal - Only show if pricing is enabled */}
      {showPricing && (
        <div 
          className="flex justify-between items-center pt-6 border-t-2"
          style={{ borderColor: theme.colors.primary }}
        >
          <span className="text-lg font-semibold text-gray-700">
            {categoryGroup.displayName} Subtotal
          </span>
          <span className="text-2xl font-bold" style={{ color: theme.colors.primary }}>
            {formatCurrency(categoryGroup.subtotal)}
          </span>
        </div>
      )}
    </div>
  );
}