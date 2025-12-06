import { ProposalSection } from '@/types/proposal';
import { CompanySettings } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface PricingSectionProps {
  section: ProposalSection;
  companySettings?: CompanySettings;
}

export function PricingSection({ section, companySettings }: PricingSectionProps) {
  console.log('[PricingSection] Rendering with:', {
    subtotal: section.subtotal,
    tax: section.tax,
    total: section.total,
    hasTerms: !!section.terms,
    terms: section.terms?.substring(0, 100),
    companySettingsTerms: companySettings?.terms?.substring(0, 100)
  });

  // Use terms from section first, fallback to company settings
  const displayTerms = section.terms || companySettings?.terms;

  return (
    <div className="py-12 space-y-8">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold mb-4">
          {section.title || 'Investment Summary'}
        </h2>
        <p className="text-lg text-muted-foreground">
          Complete project breakdown
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 space-y-4">
        {section.subtotal !== undefined && (
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">{formatCurrency(section.subtotal)}</span>
          </div>
        )}

        {section.tax !== undefined && section.tax > 0 && (
          <div className="flex justify-between text-lg">
            <span className="text-gray-600">Tax</span>
            <span className="font-semibold">{formatCurrency(section.tax)}</span>
          </div>
        )}

        <Separator className="my-4" />

        <div className="flex justify-between items-center pt-4">
          <span className="text-2xl font-bold">Total Investment</span>
          <span className="text-3xl font-bold text-primary">
            {formatCurrency(section.total || 0)}
          </span>
        </div>

        {displayTerms && (
          <div className="mt-8 pt-6 border-t">
            <h3 className="text-lg font-semibold mb-3">Payment Terms</h3>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
              {displayTerms}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}