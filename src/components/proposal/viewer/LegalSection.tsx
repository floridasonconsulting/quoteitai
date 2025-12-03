
import { ProposalData } from '@/types/proposal';

interface LegalSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'legal' }>;
}

export function LegalSection({ section }: LegalSectionProps) {
  return (
    <div 
      className="w-full py-12 px-4"
      style={{
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="max-w-3xl mx-auto">
        <h2 
          className="text-xl font-bold mb-6"
          style={{
            color: 'var(--theme-text-primary)',
            fontSize: 'var(--theme-font-size-h3, 1.5rem)',
            fontWeight: 'var(--theme-font-weight-heading, 700)',
          }}
        >
          {section.title}
        </h2>
        
        {section.content && (
          <div 
            className="p-6 rounded-lg text-sm leading-relaxed"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-text-muted)',
              border: '1px solid var(--theme-border)',
              fontFamily: 'var(--theme-font-body)',
            }}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
      </div>
    </div>
  );
}
