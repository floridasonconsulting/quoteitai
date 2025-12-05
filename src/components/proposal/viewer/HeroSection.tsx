import { ProposalSection } from '@/types/proposal';

interface HeroSectionProps {
  section: ProposalSection;
}

export function HeroSection({ section }: HeroSectionProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-20">
      {section.backgroundImage && (
        <div className="w-32 h-32 mb-6">
          <img 
            src={section.backgroundImage} 
            alt="Company Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      )}
      
      <div className="space-y-4">
        <h1 className="text-6xl font-bold tracking-tight">
          {section.title}
        </h1>
        
        {section.subtitle && (
          <p className="text-2xl text-muted-foreground">
            {section.subtitle}
          </p>
        )}
        
        <p className="text-lg text-muted-foreground mt-6">
          {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
}
