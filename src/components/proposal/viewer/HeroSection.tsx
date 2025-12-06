import { ProposalSection } from '@/types/proposal';

interface HeroSectionProps {
  section: ProposalSection;
}

export function HeroSection({ section }: HeroSectionProps) {
  console.log('[HeroSection] Rendering with data:', {
    hasLogo: !!section.backgroundImage,
    companyName: section.companyName,
    title: section.title,
    subtitle: section.subtitle
  });

  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-20">
      {/* Company Logo */}
      {section.backgroundImage && (
        <div className="w-32 h-32 mb-6">
          <img 
            src={section.backgroundImage} 
            alt="Company Logo" 
            className="w-full h-full object-contain"
            onLoad={() => console.log('[HeroSection] ✅ Logo loaded successfully')}
            onError={() => console.error('[HeroSection] ❌ Logo failed to load')}
          />
        </div>
      )}
      
      <div className="space-y-4">
        {/* Company Name */}
        {section.companyName && (
          <p className="text-xl font-medium text-muted-foreground uppercase tracking-wide">
            {section.companyName}
          </p>
        )}
        
        {/* Quote Title */}
        <h1 className="text-6xl font-bold tracking-tight">
          {section.title}
        </h1>
        
        {/* Customer Name */}
        {section.subtitle && (
          <p className="text-2xl text-muted-foreground">
            Prepared for: {section.subtitle}
          </p>
        )}
        
        {/* Current Date */}
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