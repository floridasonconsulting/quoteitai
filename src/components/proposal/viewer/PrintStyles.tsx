export const PrintStyles = () =&gt; (
  &lt;style&gt;{`
    @media print {
      @page { margin: 0; size: auto; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print, nav, .template-switcher, .floating-controls, button, .sidebar-nav { display: none !important; }
      .app-container { display: block !important; height: auto !important; overflow: visible !important; background: white !important; }
      section { page-break-inside: avoid; break-inside: avoid; padding: 2rem !important; height: auto !important; min-height: 0 !important; }
      .print-hero { height: 400px !important; color: black !important; }
      .print-hero-overlay { display: none !important; }
      .print-hero-text { color: white !important; text-shadow: 0 2px 10px rgba(0,0,0,0.5); }
      .bg-slate-900 { background-color: white !important; color: black !important; border: 1px solid #e2e8f0; }
      .text-white { color: #0f172a !important; }
      .text-slate-300, .text-slate-400 { color: #475569 !important; }
      .border-slate-700 { border-color: #cbd5e1 !important; }
      h1, h2, h3 { color: #0f172a !important; }
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { border: 1px solid #e2e8f0 !important; padding: 8px !important; }
    }
  `}&lt;/style&gt;
);
