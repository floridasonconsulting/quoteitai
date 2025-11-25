
import { ReactNode } from "react";
import { ProposalData, ProposalSection } from "@/types/proposal";

interface SidebarLayoutProps {
  proposal: ProposalData;
  currentSectionId: string;
  onNavClick: (id: string) =&gt; void;
  totalValue: number;
  onSign: () =&gt; void;
  renderSection: (section: ProposalSection) =&gt; ReactNode;
}

export function SidebarLayout({ 
  proposal, 
  currentSectionId, 
  onNavClick, 
  totalValue, 
  onSign, 
  renderSection 
}: SidebarLayoutProps) {
  const branding = proposal.sender || { name: 'Company', company: 'Company Name' };
  const logoUrl = branding.logoUrl || "https://placehold.co/40x40/0f766e/ffffff?text=P";

  return (
    &lt;div className="flex flex-col md:flex-row min-h-screen bg-slate-50 app-container relative"&gt;
      {/* Sticky Sidebar */}
      &lt;div className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col fixed md:sticky md:top-0 h-16 md:h-screen z-40 border-r border-slate-800 sidebar-nav"&gt;
        &lt;div className="p-6 flex items-center gap-3 border-b border-slate-800"&gt;
          &lt;img src={logoUrl} className="w-8 h-8 rounded" alt="Logo" /&gt;
          &lt;span className="font-bold tracking-wide"&gt;{branding.company}&lt;/span&gt;
        &lt;/div&gt;
        &lt;div className="flex-grow overflow-y-auto hidden md:block py-6"&gt;
          &lt;div className="px-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider"&gt;Sections&lt;/div&gt;
          &lt;div className="flex flex-col"&gt;
            {proposal.sections.map(sec =&gt; (
              &lt;button 
                key={sec.id} 
                onClick={() =&gt; onNavClick(sec.id)}
                className={`text-left px-6 py-3 text-sm font-medium transition-colors border-l-2 ${
                  currentSectionId === sec.id ? 'border-teal-500 text-teal-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              &gt;
                {sec.title}
              &lt;/button&gt;
            ))}
          &lt;/div&gt;
        &lt;/div&gt;
        {/* Sign Button Pushed Up */}
        &lt;div className="p-6 border-t border-slate-800 hidden md:block pb-24"&gt;
          &lt;div className="text-xs text-slate-500 uppercase mb-1"&gt;Total Project Value&lt;/div&gt;
          &lt;div className="text-xl font-mono font-bold text-white mb-4"&gt;${totalValue.toLocaleString()}&lt;/div&gt;
          &lt;button onClick={onSign} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-bold text-sm shadow-lg shadow-teal-900/50"&gt;Accept &amp; Sign&lt;/button&gt;
        &lt;/div&gt;
      &lt;/div&gt;
      &lt;div className="flex-grow pt-16 md:pt-0 min-w-0"&gt;
        {proposal.sections.map(section =&gt; (
          &lt;div key={section.id} id={section.id}&gt;
             {renderSection(section)}
          &lt;/div&gt;
        ))}
        &lt;footer className="py-12 text-center text-xs text-slate-400 border-t border-slate-200"&gt;
          Secured by {branding.company}
        &lt;/footer&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
