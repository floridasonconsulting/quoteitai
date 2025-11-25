import { ReactNode } from 'react';

interface ProposalEditorLayoutProps {
  builder: ReactNode;
  preview: ReactNode;
}

export function ProposalEditorLayout({ builder, preview }: ProposalEditorLayoutProps) {
  return (
    &lt;div className="flex h-screen overflow-hidden bg-slate-100"&gt;
      {/* Left Panel - Builder */}
      &lt;div className="w-full md:w-1/2 lg:w-[500px] bg-white border-r border-slate-200 flex flex-col h-full overflow-hidden shadow-xl z-10 relative"&gt;
        {builder}
      &lt;/div&gt;

      {/* Right Panel - Preview */}
      &lt;div className="flex-1 bg-slate-200 h-full overflow-hidden relative hidden md:block"&gt;
        &lt;div className="absolute inset-0 p-8 flex flex-col"&gt;
           &lt;div className="flex justify-between items-center mb-4 px-2"&gt;
              &lt;h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider"&gt;Live Client Preview&lt;/h2&gt;
              &lt;div className="flex gap-2"&gt;
                  &lt;div className="w-3 h-3 rounded-full bg-red-400"&gt;&lt;/div&gt;
                  &lt;div className="w-3 h-3 rounded-full bg-yellow-400"&gt;&lt;/div&gt;
                  &lt;div className="w-3 h-3 rounded-full bg-green-400"&gt;&lt;/div&gt;
              &lt;/div&gt;
           &lt;/div&gt;
           &lt;div className="flex-1 bg-white shadow-2xl rounded-lg overflow-hidden border border-slate-300/50 ring-4 ring-slate-300/20"&gt;
             {/* Wrapper to simulate browser window content area */}
             &lt;div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent"&gt;
               {preview}
             &lt;/div&gt;
           &lt;/div&gt;
        &lt;/div&gt;
      &lt;/div&gt;
    &lt;/div&gt;
  );
}
