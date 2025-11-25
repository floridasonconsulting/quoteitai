import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle } from "lucide-react";

interface PricingSectionProps {
  data: ProposalSection;
  onTotalChange: (sectionId: string, total: number) => void;
  currency?: string;
}

export function PricingSection({ data, onTotalChange, currency = "$" }: PricingSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<string>(
    data.packages?.find(o => o.recommended)?.id || data.packages?.[0]?.id || ""
  );
  const prevTotalRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!data.packages) return;
    
    const planPrice = data.packages.find(o => o.id === selectedPlan)?.price || 0;
    
    // Prevents infinite update loops
    if (prevTotalRef.current !== planPrice) {
        onTotalChange(data.id, planPrice);
        prevTotalRef.current = planPrice;
    }
  }, [selectedPlan, data, onTotalChange]);

  if (!data.packages) return null;

  return (
    <section ref={sectionRef} className="py-20 px-6 md:px-12 bg-slate-900 text-white h-full flex flex-col justify-center print:bg-white print:text-black print:py-10">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-white mb-4 text-center print:text-black">{data.title}</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8 print:grid-cols-2">
          {data.packages.map(plan => (
            <div 
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`relative p-6 rounded-2xl border-2 cursor-pointer transition-all min-w-0 print:border-slate-300 print:bg-white print:text-black ${
                selectedPlan === plan.id 
                ? 'border-teal-500 bg-slate-800 shadow-2xl shadow-teal-900/20 z-10' 
                : 'border-slate-700 bg-slate-800/50 opacity-80'
              }`}
            >
              <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h3 className="text-xl font-bold truncate">{plan.name}</h3>
                {selectedPlan === plan.id && <CheckCircle className="text-teal-400 shrink-0 print:text-black" />}
              </div>
              <div className="text-3xl font-bold mb-4">{currency}{plan.price.toLocaleString()}</div>
              <ul className="space-y-2">
                {plan.features.map((feat, i) => (
                  <li key={i} className="flex items-start text-slate-300 text-sm print:text-slate-600">
                    <Check className="w-3 h-3 text-teal-400 mr-2 mt-1 shrink-0 print:text-black" /> 
                    <span className="break-words">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
