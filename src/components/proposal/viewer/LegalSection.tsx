import { ProposalSection } from '@/types/proposal';
import { CompanySettings } from '@/types';

interface LegalSectionProps {
  section: ProposalSection;
  companySettings?: CompanySettings;
}

export function LegalSection({ section, companySettings }: LegalSectionProps) {
  // Use content from section first, fallback to company settings
  const displayContent = section.content || companySettings?.terms;
  
  console.log('[LegalSection] Rendering with:', {
    hasContent: !!section.content,
    contentLength: section.content?.length || 0,
    hasCompanyTerms: !!companySettings?.terms,
    companyTermsLength: companySettings?.terms?.length || 0,
    displayContentLength: displayContent?.length || 0
  });

  return (
    <div className="py-12 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">
        {section.title || 'Terms & Conditions'}
      </h2>
      
      <div className="bg-gray-50 rounded-lg p-8">
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {displayContent || 'No terms and conditions specified.'}
        </div>
      </div>
    </div>
  );
}