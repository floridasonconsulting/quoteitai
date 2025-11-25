
import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface TextSectionProps {
  data: ProposalSection;
}

export function TextSection({ data }: TextSectionProps) {
  const sectionRef = useRef&lt;HTMLElement&gt;(null);

  useEffect(() =&gt; {
    const observer = new IntersectionObserver(
      ([entry]) =&gt; {
        if (entry.isIntersecting) {
          // Tracking logic placeholder
        }
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () =&gt; observer.disconnect();
  }, []);

  return (
    &lt;section ref={sectionRef} className="py-20 px-6 md:px-12 bg-white h-full flex flex-col justify-center print:py-10"&gt;
      &lt;div className="max-w-4xl mx-auto w-full"&gt;
        &lt;h2 className="text-3xl font-bold text-slate-900 mb-8 border-l-4 border-teal-600 pl-4 print:border-black"&gt;{data.title}&lt;/h2&gt;
        {data.content &amp;&amp; (
          &lt;div 
            className="prose prose-lg text-slate-600 leading-relaxed break-words max-w-none" 
            dangerouslySetInnerHTML={{ __html: data.content }}
          &gt;&lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/section&gt;
  );
}
