import { ProposalSection } from '@/types/proposal';
import { Building2, Mail, Phone, Globe } from 'lucide-react';

interface HeroSectionProps {
  section: ProposalSection;
}

export function HeroSection({ section }: HeroSectionProps) {
  console.log('[HeroSection] Rendering with data:', {
    hasLogo: !!section.backgroundImage,
    companyName: section.companyName,
    companyEmail: section.companyEmail,
    companyPhone: section.companyPhone,
    companyAddress: section.companyAddress,
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
      
      {/* Company Information */}
      {section.companyName && (
        <div className="space-y-4 mb-8">
          <h2 className="text-2xl font-bold text-primary uppercase tracking-wide flex items-center justify-center gap-2">
            <Building2 className="h-6 w-6" />
            {section.companyName}
          </h2>
          
          {/* Company Contact Details */}
          <div className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
            {section.companyAddress && (
              <p>
                {section.companyAddress}
                {section.companyCity && `, ${section.companyCity}`}
                {section.companyState && `, ${section.companyState}`}
                {section.companyZip && ` ${section.companyZip}`}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 justify-center">
              {section.companyPhone && (
                <p className="flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  {section.companyPhone}
                </p>
              )}
              
              {section.companyEmail && (
                <p className="flex items-center gap-1">
                  <Mail className="h-4 w-4" />
                  {section.companyEmail}
                </p>
              )}
              
              {section.companyWebsite && (
                <p className="flex items-center gap-1">
                  <Globe className="h-4 w-4" />
                  {section.companyWebsite}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Quote Title */}
        <h1 className="text-6xl font-bold tracking-tight">
          {section.title}
        </h1>
        
        {/* Customer Name */}
        {section.subtitle && (
          <p className="text-2xl text-muted-foreground">
            Prepared for: <span className="font-semibold">{section.subtitle}</span>
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