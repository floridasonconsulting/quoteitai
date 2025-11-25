import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef } from "react";

interface HeroSectionProps {
  data: ProposalSection;
}

export function HeroSection({ data }: HeroSectionProps) {
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
    <section 
      ref={sectionRef} 
      className="relative h-full min-h-[500px] print-hero flex items-center justify-center text-white overflow-hidden group print:break-after-page"
    >
      <div className="absolute inset-0 bg-slate-900/40 z-10 print-hero-overlay"></div>
      {data.backgroundImage && (
        <img 
          src={data.backgroundImage} 
          alt="Cover" 
          className="absolute inset-0 w-full h-full object-cover z-0" 
        />
      )}
      <div className="relative z-20 text-center max-w-4xl px-6 animate-fade-in-up print-hero-text">
        <div className="inline-block px-4 py-1 mb-6 border border-teal-400/50 rounded-full bg-teal-500/20 text-teal-100 text-sm font-semibold tracking-wider uppercase backdrop-blur-sm print:border-white print:text-white print:bg-transparent">
          Proposal
        </div>
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight font-display">{data.title}</h1>
        {data.subtitle && (
          <p className="text-xl md:text-2xl text-slate-100 font-light">{data.subtitle}</p>
        )}
      </div>
    </section>
  );
}
