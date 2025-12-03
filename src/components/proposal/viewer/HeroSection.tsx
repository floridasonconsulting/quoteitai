
import { ProposalData } from '@/types/proposal';

interface HeroSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'hero' }>;
}

export function HeroSection({ section }: HeroSectionProps) {
  return (
    <div 
      className="w-full text-center space-y-8 py-12"
      style={{
        fontFamily: 'var(--theme-font-heading)',
      }}
    >
      {section.backgroundImage && (
        <div className="flex justify-center">
          <img 
            src={section.backgroundImage} 
            alt="Company Logo"
            className="h-16 md:h-20 object-contain"
            style={{
              filter: 'drop-shadow(var(--theme-shadow-md))'
            }}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {section.title && (
          <h1 
            className="text-4xl md:text-6xl font-bold"
            style={{
              color: 'var(--theme-primary)',
              fontSize: 'var(--theme-font-size-hero, 3.5rem)',
              fontWeight: 'var(--theme-font-weight-heading, 700)',
              lineHeight: 'var(--theme-line-height-heading, 1.2)',
            }}
          >
            {section.title}
          </h1>
        )}
        
        {section.subtitle && (
          <h2 
            className="text-2xl md:text-4xl font-semibold"
            style={{
              color: 'var(--theme-text-secondary)',
              fontSize: 'var(--theme-font-size-h1, 2.5rem)',
            }}
          >
            {section.subtitle}
          </h2>
        )}
      </div>

      <div 
        className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm"
        style={{
          color: 'var(--theme-text-muted)',
          fontFamily: 'var(--theme-font-body)',
        }}
      >
        <div className="text-center">
          <span 
            className="font-medium" 
            style={{ color: 'var(--theme-text-secondary)' }}
          >
            Prepared For
          </span>
        </div>
      </div>
    </div>
  );
}
