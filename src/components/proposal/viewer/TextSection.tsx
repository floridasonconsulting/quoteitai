import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface TextSectionProps {
  data: ProposalSection;
}

export function TextSection({ data }: TextSectionProps) {
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
    <section ref={sectionRef} className="py-20 px-6 md:px-12 bg-white h-full flex flex-col justify-center print:py-10">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 border-l-4 border-teal-600 pl-4 print:border-black">{data.title}</h2>
        {data.content && (
          <div 
            className="prose prose-lg text-slate-600 leading-relaxed break-words max-w-none" 
            dangerouslySetInnerHTML={{ __html: data.content }}
          ></div>
        )}
      </div>
    </section>
  );
}
