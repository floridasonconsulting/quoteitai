
import { ProposalData } from '@/types/proposal';

interface PricingSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'pricing' }>;
}

export function PricingSection({ section }: PricingSectionProps) {
  return (
    <div 
      className="w-full py-12 px-4"
      style={{
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <div 
          className="rounded-2xl p-8"
          style={{
            backgroundColor: 'var(--theme-surface)',
            boxShadow: 'var(--theme-shadow-lg)',
            border: '1px solid var(--theme-border)',
          }}
        >
          <h2 
            className="text-3xl font-bold mb-6 text-center"
            style={{
              color: 'var(--theme-primary)',
              fontSize: 'var(--theme-font-size-h2, 2rem)',
              fontWeight: 'var(--theme-font-weight-heading, 700)',
            }}
          >
            Investment Summary
          </h2>

          <div className="space-y-4">
            <div 
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <span 
                className="text-lg"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Subtotal
              </span>
              <span 
                className="text-lg font-mono"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                ${section.subtotal.toLocaleString()}
              </span>
            </div>

            <div 
              className="flex justify-between py-3 border-b"
              style={{ borderColor: 'var(--theme-border)' }}
            >
              <span 
                className="text-lg"
                style={{ color: 'var(--theme-text-secondary)' }}
              >
                Tax
              </span>
              <span 
                className="text-lg font-mono"
                style={{ color: 'var(--theme-text-primary)' }}
              >
                ${section.tax.toLocaleString()}
              </span>
            </div>

            <div 
              className="flex justify-between py-4 border-t-2"
              style={{ borderColor: 'var(--theme-primary)' }}
            >
              <span 
                className="text-2xl font-bold"
                style={{ color: 'var(--theme-primary)' }}
              >
                Total
              </span>
              <span 
                className="text-2xl font-bold font-mono"
                style={{ color: 'var(--theme-primary)' }}
              >
                ${section.total.toLocaleString()}
              </span>
            </div>
          </div>

          {section.terms && (
            <div 
              className="mt-6 p-4 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--theme-background)',
                color: 'var(--theme-text-muted)',
                border: '1px solid var(--theme-border)',
              }}
            >
              <p className="font-semibold mb-2" style={{ color: 'var(--theme-text-secondary)' }}>
                Payment Terms
              </p>
              <p>{section.terms}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
