
import { ProposalSection } from "@/types/proposal";
import { useEffect, useRef, useState } from "react";
import { Check, CheckCircle } from "lucide-react";

interface LineItemSectionProps {
  data: ProposalSection;
  onTotalChange: (sectionId: string, total: number) =&gt; void;
}

export function LineItemSection({ data, onTotalChange }: LineItemSectionProps) {
  const sectionRef = useRef&lt;HTMLElement&gt;(null);
  const [selectedOptionalItems, setSelectedOptionalItems] = useState&lt;string[]&gt;([]);
  const prevTotalRef = useRef&lt;number | null&gt;(null);

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

  // Calculate totals whenever selection changes
  useEffect(() =&gt; {
    if (!data.items) return;

    // 1. Sum fixed items
    const fixedTotal = data.items
        .filter(i =&gt; !i.optional)
        .reduce((sum, i) =&gt; sum + i.price, 0);
    
    // 2. Sum selected optional items
    const optionalTotal = selectedOptionalItems.reduce((sum, id) =&gt; {
        const item = data.items?.find(i =&gt; i.id === id);
        return sum + (item ? item.price : 0);
    }, 0);

    const newTotal = fixedTotal + optionalTotal;

    // Prevents infinite update loops by checking if the value actually changed
    if (prevTotalRef.current !== newTotal) {
        onTotalChange(data.id, newTotal);
        prevTotalRef.current = newTotal;
    }
  }, [selectedOptionalItems, data, onTotalChange]);

  const toggleItem = (id: string) =&gt; {
    if (selectedOptionalItems.includes(id)) {
        setSelectedOptionalItems(prev =&gt; prev.filter(x =&gt; x !== id));
    } else {
        setSelectedOptionalItems(prev =&gt; [...prev, id]);
    }
  };

  if (!data.items) return null;

  return (
    &lt;section ref={sectionRef} className="py-20 px-6 md:px-12 bg-slate-50 h-full flex flex-col justify-center print:py-10 print:bg-white"&gt;
      &lt;div className="max-w-5xl mx-auto w-full"&gt;
        &lt;h2 className="text-3xl font-bold text-slate-900 mb-8 text-center md:text-left"&gt;{data.title}&lt;/h2&gt;
        
        &lt;div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden print:border-slate-300 print:shadow-none"&gt;
            &lt;div className="overflow-x-auto"&gt;
                &lt;table className="w-full text-left border-collapse"&gt;
                    &lt;thead className="bg-slate-100 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold"&gt;
                        &lt;tr&gt;
                            &lt;th className="p-4 w-12 text-center"&gt;#&lt;/th&gt;
                            &lt;th className="p-4"&gt;Description&lt;/th&gt;
                            {data.showPrices &amp;&amp; &lt;th className="p-4 text-right w-32"&gt;Amount&lt;/th&gt;}
                            &lt;th className="p-4 text-center w-24"&gt;Select&lt;/th&gt;
                        &lt;/tr&gt;
                    &lt;/thead&gt;
                    &lt;tbody className="divide-y divide-slate-100"&gt;
                        {data.items.map((item, idx) =&gt; (
                            &lt;tr key={item.id} className={`hover:bg-slate-50 transition-colors ${item.optional ? 'bg-amber-50/30' : ''}`}&gt;
                                &lt;td className="p-4 text-center text-slate-400 text-sm"&gt;{idx + 1}&lt;/td&gt;
                                &lt;td className="p-4"&gt;
                                    &lt;div className="font-bold text-slate-800"&gt;{item.name}&lt;/div&gt;
                                    &lt;div className="text-sm text-slate-500"&gt;{item.desc}&lt;/div&gt;
                                    {item.optional &amp;&amp; &lt;span className="inline-block mt-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide"&gt;Optional Upgrade&lt;/span&gt;}
                                &lt;/td&gt;
                                {data.showPrices &amp;&amp; (
                                    &lt;td className="p-4 text-right font-mono text-slate-700"&gt;
                                        ${item.price.toLocaleString()}
                                    &lt;/td&gt;
                                )}
                                &lt;td className="p-4 text-center"&gt;
                                    {item.optional ? (
                                        &lt;button 
                                            onClick={() =&gt; toggleItem(item.id)}
                                            className={`w-6 h-6 rounded border flex items-center justify-center transition-all mx-auto ${selectedOptionalItems.includes(item.id) ? 'bg-teal-600 border-teal-600 text-white' : 'border-slate-300 bg-white hover:border-teal-400'}`}
                                        &gt;
                                            {selectedOptionalItems.includes(item.id) &amp;&amp; &lt;Check className="w-4 h-4" /&gt;}
                                        &lt;/button&gt;
                                    ) : (
                                        &lt;div className="w-6 h-6 mx-auto flex items-center justify-center"&gt;
                                            &lt;CheckCircle className="w-5 h-5 text-slate-300" /&gt;
                                        &lt;/div&gt;
                                    )}
                                &lt;/td&gt;
                            &lt;/tr&gt;
                        ))}
                    &lt;/tbody&gt;
                    &lt;tfoot className="bg-slate-50 border-t border-slate-200"&gt;
                        &lt;tr&gt;
                            &lt;td colSpan={data.showPrices ? 2 : 1} className="p-4 text-right font-bold text-slate-500 uppercase text-xs"&gt;Section Subtotal&lt;/td&gt;
                            {data.showPrices &amp;&amp; (
                                &lt;td className="p-4 text-right font-mono font-bold text-slate-900"&gt;
                                    {/* Real-time visual subtotal */}
                                    ${(
                                        data.items.filter(i =&gt; !i.optional || selectedOptionalItems.includes(i.id)).reduce((a, b) =&gt; a + b.price, 0)
                                    ).toLocaleString()}
                                &lt;/td&gt;
                            )}
                            &lt;td&gt;&lt;/td&gt;
                        &lt;/tr&gt;
                    &lt;/tfoot&gt;
                &lt;/table&gt;
            &lt;/div&gt;
        &lt;/div&gt;
        &lt;p className="mt-4 text-xs text-slate-400 italic text-center md:text-right"&gt;* Check the box next to optional items to include them in the total.&lt;/p&gt;
      &lt;/div&gt;
    &lt;/section&gt;
  );
}
