import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface LegalSectionProps {
  data: ProposalSection;
}

export function LegalSection({ data }: LegalSectionProps) {
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
    &lt;section ref={sectionRef} className="py-20 px-6 md:px-12 bg-white border-t border-slate-100 h-full flex flex-col justify-center print:py-10"&gt;
      &lt;div className="max-w-3xl mx-auto w-full"&gt;
        &lt;h2 className="text-xl font-bold text-slate-800 mb-6"&gt;{data.title}&lt;/h2&gt;
        {data.content &amp;&amp; (
          &lt;div className="p-6 bg-slate-50 rounded text-sm text-slate-500 font-mono leading-relaxed border border-slate-200 break-words print:bg-white print:border-slate-300 print:text-black"&gt;
            &lt;div dangerouslySetInnerHTML={{ __html: data.content }}&gt;&lt;/div&gt;
          &lt;/div&gt;
        )}
      &lt;/div&gt;
    &lt;/section&gt;
  );
}
