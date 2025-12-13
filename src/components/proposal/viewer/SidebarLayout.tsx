import { ReactNode } from "react";
import { ProposalData, ProposalSection } from "@/types/proposal";

interface SidebarLayoutProps {
  proposal: ProposalData;
  currentSectionId: string;
  onNavClick: (id: string) => void;
  totalValue: number;
  onSign: () => void;
  renderSection: (section: ProposalSection) => ReactNode;
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
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50 app-container relative">
      {/* Sticky Sidebar */}
      <div className="w-full md:w-64 bg-slate-900 text-white flex-shrink-0 flex flex-col fixed md:sticky md:top-0 h-16 md:h-screen z-40 border-r border-slate-800 sidebar-nav">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <img src={logoUrl} className="w-8 h-8 rounded" alt="Logo" />
          <span className="font-bold tracking-wide">{branding.company}</span>
        </div>
        <div className="flex-grow overflow-y-auto hidden md:block py-6">
          <div className="px-6 mb-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Sections</div>
          <div className="flex flex-col">
            {proposal.sections.map(sec => (
              <button 
                key={sec.id} 
                onClick={() => onNavClick(sec.id)}
                className={`text-left px-6 py-3 text-sm font-medium transition-colors border-l-2 ${
                  currentSectionId === sec.id ? 'border-teal-500 text-teal-400 bg-white/5' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>
        {/* Sign Button Pushed Up */}
        <div className="p-6 border-t border-slate-800 hidden md:block pb-24">
          <div className="text-xs text-slate-500 uppercase mb-1">Total Project Value</div>
          <div className="text-xl font-mono font-bold text-white mb-4">${totalValue.toLocaleString()}</div>
          <button onClick={onSign} className="w-full bg-teal-600 hover:bg-teal-500 text-white py-2 rounded font-bold text-sm shadow-lg shadow-teal-900/50">Accept & Sign</button>
        </div>
      </div>
      <div className="flex-grow pt-16 md:pt-0 min-w-0">
        {proposal.sections.map(section => (
          <div key={section.id} id={section.id}>
             {renderSection(section)}
          </div>
        ))}
        <footer className="py-12 text-center text-xs text-slate-400 border-t border-slate-200">
          Secured by {branding.company}
        </footer>
      </div>
    </div>
  );
}
