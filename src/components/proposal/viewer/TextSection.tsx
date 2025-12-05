import { ProposalSection } from '@/types/proposal';

interface TextSectionProps {
  section: ProposalSection;
}

export function TextSection({ section }: TextSectionProps) {
  return (
    <div className="prose prose-lg max-w-none py-12">
      {section.title && (
        <h2 className="text-4xl font-bold mb-6">
          {section.title}
        </h2>
      )}
      
      {section.content && (
        <div className="text-lg leading-relaxed whitespace-pre-wrap text-muted-foreground">
          {section.content}
        </div>
      )}
    </div>
  );
}
