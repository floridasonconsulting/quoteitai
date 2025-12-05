import { ProposalSection } from '@/types/proposal';

interface LegalSectionProps {
  section: ProposalSection;
}

export function LegalSection({ section }: LegalSectionProps) {
  return (
    <div className="py-12 max-w-3xl mx-auto">
      <h2 className="text-3xl font-bold mb-8 text-center">
        {section.title || 'Terms & Conditions'}
      </h2>
      
      <div className="bg-gray-50 rounded-lg p-8">
        <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
          {section.content}
        </div>
      </div>
    </div>
  );
}
