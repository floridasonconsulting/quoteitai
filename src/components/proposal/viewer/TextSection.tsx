
import { ProposalData } from '@/types/proposal';

interface TextSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'text' }>;
}

export function TextSection({ section }: TextSectionProps) {
  return (
    <div 
      className="w-full py-12 px-4"
      style={{
        fontFamily: 'var(--theme-font-body)',
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h2 
          className="text-3xl font-bold mb-6 border-l-4 pl-4"
          style={{
            color: 'var(--theme-text-primary)',
            borderColor: 'var(--theme-accent)',
            fontSize: 'var(--theme-font-size-h2, 2rem)',
            fontWeight: 'var(--theme-font-weight-heading, 700)',
          }}
        >
          {section.title}
        </h2>
        
        {section.content && (
          <div 
            className="prose prose-lg max-w-none leading-relaxed"
            style={{
              color: 'var(--theme-text-secondary)',
              lineHeight: 'var(--theme-line-height-body, 1.6)',
            }}
            dangerouslySetInnerHTML={{ __html: section.content }}
          />
        )}
      </div>
    </div>
  );
}
