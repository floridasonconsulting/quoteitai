import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface LegalSectionProps {
  data: ProposalSection;
}

export function LegalSection({ data }: LegalSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Tracking logic placeholder
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 px-6 md:px-12 bg-white border-t border-slate-100 h-full flex flex-col justify-center print:py-10">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-xl font-bold text-slate-800 mb-6">{data.title}</h2>
        {data.content && (
          <div className="p-6 bg-slate-50 rounded text-sm text-slate-500 font-mono leading-relaxed border border-slate-200 break-words print:bg-white print:border-slate-300 print:text-black">
            <div dangerouslySetInnerHTML={{ __html: data.content }}></div>
          </div>
        )}
      </div>
    </section>
  );
}
