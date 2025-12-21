export const PrintStyles = () => (
  <style>{`
    @media print {
      @page { 
        margin: 1cm; 
        size: letter; 
      }
      
      body { 
        -webkit-print-color-adjust: exact !important; 
        print-color-adjust: exact !important;
        background: white !important;
      }

      /* Hide UI elements */
      .no-print, 
      nav, 
      .template-switcher, 
      .floating-controls, 
      button, 
      .sidebar-nav,
      .swiper-button-next,
      .swiper-button-prev,
      .swiper-pagination,
      .ProposalActionBar,
      .fixed,
      .ProposalAssistant { 
        display: none !important; 
      }

      /* Reset layout for print */
      .app-container,
      .ProposalViewer-container { 
        display: block !important; 
        height: auto !important; 
        overflow: visible !important; 
        background: white !important;
        position: static !important;
      }

      /* Printable container logic */
      .printable-content {
        display: block !important;
        width: 100% !important;
      }

      .print-section {
        display: block !important;
        page-break-after: always !important;
        break-after: page !important;
        position: relative !important;
        width: 100% !important;
        min-height: 100vh !important;
      }

      /* Slide specific print adjustments */
      .h-full { height: auto !important; }
      .w-full { width: 100% !important; }
      .overflow-hidden { overflow: visible !important; }
      .overflow-y-auto { overflow: visible !important; }

      /* Force standard colors */
      .bg-slate-900, .bg-gray-950 { background-color: #0f172a !important; color: white !important; }
      .text-white { color: white !important; }
      .text-slate-300, .text-slate-400 { color: #cbd5e1 !important; }
      
      /* Ensure category sections are readable */
      .CategoryGroupSection {
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Prevent text cropping */
      p, h1, h2, h3, h4 {
        orphans: 3;
        widows: 3;
      }

      /* Table adjustments */
      table { width: 100% !important; border-collapse: collapse !important; }
      th, td { border-bottom: 1px solid #e2e8f0 !important; padding: 12px 8px !important; }
      
      /* Special handling for the slider which we'll hide in favor of the flat container */
      .proposal-swiper { display: none !important; }
      .printable-only { display: block !important; }
    }

    @media screen {
      .printable-only { display: none !important; }
    }
  `}</style>
);
