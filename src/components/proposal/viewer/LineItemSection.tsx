import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle } from "lucide-react";

interface LineItemSectionProps {
  data: ProposalSection;
  onTotalChange: (sectionId: string, total: number) => void;
}

export function LineItemSection({ data, onTotalChange }: LineItemSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [selectedOptionalItems, setSelectedOptionalItems] = useState<string[]>([]);
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

  // Calculate totals whenever selection changes
  useEffect(() => {
    if (!data.items) return;

    // 1. Sum fixed items
    const fixedTotal = data.items
        .filter(i => !i.optional)
        .reduce((sum, i) => sum + i.price, 0);
    
    // 2. Sum selected optional items
    const optionalTotal = selectedOptionalItems.reduce((sum, id) => {
        const item = data.items?.find(i => i.id === id);
        return sum + (item ? item.price : 0);
    }, 0);

    const newTotal = fixedTotal + optionalTotal;

    // Prevents infinite update loops by checking if the value actually changed
    if (prevTotalRef.current !== newTotal) {
        onTotalChange(data.id, newTotal);
        prevTotalRef.current = newTotal;
    }
  }, [selectedOptionalItems, data, onTotalChange]);

  const toggleItem = (id: string) => {
    if (selectedOptionalItems.includes(id)) {
        setSelectedOptionalItems(prev => prev.filter(x => x !== id));
    } else {
        setSelectedOptionalItems(prev => [...prev, id]);
    }
  };

  if (!data.items) return null;

  return (
    <section ref={sectionRef} className="py-20 px-6 md:px-12 bg-slate-50 h-full flex flex-col justify-center print:py-10 print:bg-white">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center md:text-left">{data.title}</h2>
        
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-slate-300 print:shadow-none">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                            <th className="p-4 w-12 text-center">#</th>
                            <th className="p-4">Description</th>
                            {data.showPrices && <th className="p-4 text-right w-32">Amount</th>}
                            <th className="p-4 text-center w-24">Select</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {data.items.map((item, idx) => (
                            <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.optional ? 'bg-amber-50/30' : ''}`}>
                                <td className="p-4 text-center text-slate-400 text-sm">{idx + 1}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{item.name}</div>
                                    <div className="text-sm text-slate-500">{item.desc}</div>
                                    {item.optional && <span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">Optional Upgrade</span>}
                                </td>
                                {data.showPrices && (
                                    <td className="p-4 text-right font-mono text-slate-700">
                                        ${item.price.toLocaleString()}
                                    </td>
                                )}
                                <td className="p-4 text-center">
                                    {item.optional ? (
                                        <button 
                                            onClick={() => toggleItem(item.id)}
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto ${selectedOptionalItems.includes(item.id) ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                                        >
                                            {selectedOptionalItems.includes(item.id) && <Check className="w-4 h-4" />}
                                        </button>
                                    ) : (
                                        <div className="w-6 h-6 mx-auto flex items-center justify-center">
                                            <CheckCircle className="w-5 h-5 text-slate-300" />
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-200">
                        <tr>
                            <td colSpan={data.showPrices ? 2 : 1} className="p-4 text-right font-bold text-slate-500 uppercase text-xs">Section Subtotal</td>
                            {data.showPrices && (
                                <td className="p-4 text-right font-mono font-bold text-slate-900">
                                    {/* Real-time visual subtotal */}
                                    ${(
                                        data.items.filter(i => !i.optional || selectedOptionalItems.includes(i.id)).reduce((a, b) => a + b.price, 0)
                                    ).toLocaleString()}
                                </td>
                            )}
                            <td></td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 italic text-center md:text-right">* Check the box next to optional items to include them in the total.</p>
      </div>
    </section>
  );
}
