import { ProposalData } from '@/types/proposal';

interface HeroSectionProps {
  section: Extract<ProposalData['sections'][0], { type: 'hero' }>;
}

export function HeroSection({ section }: HeroSectionProps) {
  return (
    <div className="w-full text-center space-y-8 py-12">
      {section.data.logo && (
        <div className="flex justify-center">
          <img 
            src={section.data.logo} 
            alt={section.data.companyName}
            className="h-16 md:h-20 object-contain"
          />
        </div>
      )}
      
      <div className="space-y-4">
        {section.data.companyName && (
          <h1 className="text-3xl md:text-5xl font-bold text-foreground">
            {section.data.companyName}
          </h1>
        )}
        
        {section.data.title && (
          <h2 className="text-2xl md:text-4xl font-semibold text-muted-foreground">
            {section.data.title}
          </h2>
        )}
        
        {section.data.subtitle && (
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {section.data.subtitle}
          </p>
        )}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
        {section.data.date && (
          <div>
            <span className="font-medium">Date:</span> {section.data.date}
          </div>
        )}
        
        {section.data.validUntil && (
          <div>
            <span className="font-medium">Valid Until:</span> {section.data.validUntil}
          </div>
        )}
        
        {section.data.proposalNumber && (
          <div>
            <span className="font-medium">Proposal #:</span> {section.data.proposalNumber}
          </div>
        )}
      </div>
    </div>
  );
}
