import { ReactNode } from 'react';

interface ProposalEditorLayoutProps {
  builder: ReactNode;
  preview: ReactNode;
}

export function ProposalEditorLayout({ builder, preview }: ProposalEditorLayoutProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Left Panel - Builder */}
      <div className="w-full md:w-1/2 lg:w-[500px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-xl z-10 relative">
        {builder}
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 bg-slate-200 h-full overflow-hidden relative hidden md:block">
        <div className="absolute inset-0 p-8 flex flex-col">
           <div className="flex justify-between items-center mb-4 px-2">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Live Client Preview</h2>
              <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
              </div>
           </div>
           <div className="flex-1 bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-300/50 ring-4 ring-slate-300/20">
             {/* Wrapper to simulate browser window content area */}
             <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
               {preview}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
