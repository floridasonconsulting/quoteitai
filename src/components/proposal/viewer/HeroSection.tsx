import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface HeroSectionProps {
  data: ProposalSection;
}

export function HeroSection({ data }: HeroSectionProps) {
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
    &lt;section 
      ref={sectionRef} 
      className="relative h-full min-h-[500px] print-hero flex items-center justify-center text-white overflow-hidden group print:break-after-page"
    &gt;
      &lt;div className="absolute inset-0 bg-slate-900/40 z-10 print-hero-overlay"&gt;&lt;/div&gt;
      {data.backgroundImage &amp;&amp; (
        &lt;img 
          src={data.backgroundImage} 
          alt="Cover" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
        /&gt;
      )}
      &lt;div className="relative z-20 text-center max-w-4xl px-6 animate-fade-in-up print-hero-text"&gt;
        &lt;div className="inline-block px-4 py-1 mb-6 border border-teal-400/50 rounded-full bg-teal-500/20 text-teal-100 text-sm font-semibold tracking-wider uppercase backdrop-blur-sm print:border-white print:text-white print:bg-transparent"&gt;
          Proposal
        &lt;/div&gt;
        &lt;h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display"&gt;{data.title}&lt;/h1&gt;
        {data.subtitle &amp;&amp; (
          &lt;p className="text-xl md:text-2xl text-slate-100 font-light"&gt;{data.subtitle}&lt;/p&gt;
        )}
      &lt;/div&gt;
    &lt;/section&gt;
  );
}
