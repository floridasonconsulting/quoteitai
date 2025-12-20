import { useRef } from 'react';
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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return;
    if (touchStartY.current === null) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const currentY = e.touches[0].clientY;
    const diff = touchStartY.current - currentY;
    const { scrollTop, scrollHeight, clientHeight } = container;

    if (scrollHeight <= clientHeight) return;

    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if (diff > 0 && !isAtBottom) {
      e.stopPropagation();
    } else if (diff < 0 && !isAtTop) {
      e.stopPropagation();
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isScrollingUp = e.deltaY < 0;
    const isScrollingDown = e.deltaY > 0;

    const isAtTop = scrollTop <= 0;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;

    if ((isScrollingDown && !isAtBottom) || (isScrollingUp && !isAtTop)) {
      e.stopPropagation();
    }
  };

  return (
    <div
      ref={scrollContainerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      className="h-full overflow-y-auto py-12 px-6 touch-pan-y"
    >
      <div className="max-w-3xl mx-auto pb-24">
        <h2 className="text-3xl font-bold mb-8 text-center text-gray-900">
          {section.title || 'Terms & Conditions'}
        </h2>

        <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm">
          <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
            {displayContent || 'No terms and conditions specified.'}
          </div>
        </div>
      </div>
    </div>
  );
}