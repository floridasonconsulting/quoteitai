import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Quote, Customer, CompanySettings } from "@/types";
import { normalizeCategory } from "./proposal-categories";
import { formatTermsContent } from "./json-terms-formatter";
import { getTheme, ProposalTheme } from "./proposal-themes";

/**
 * Convert hex color to RGB array for jsPDF
 */
function hexToRgb(hex: string): [number, number, number] {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;

  return [r, g, b];
}

/**
 * Get theme color for PDF tables based on company settings
 */
function getThemeTableColor(settings: CompanySettings): [number, number, number] {
  const themeId = (settings.proposalTheme as ProposalTheme) || 'modern-corporate';
  const theme = getTheme(themeId);
  return hexToRgb(theme.colors.primary);
}

// Helper function to format currency, assuming it's in utils
// If not, we might need to create it. For now, assuming it exists.
export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
};


// Shared PDF generation constants
const MARGIN = 20;
const LINE_HEIGHT = 5;
const SECTION_GAP = 8;

// Extend jsPDF interface to include autoTable properties
interface jsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Common PDF header rendering
export function renderCompanyHeader(
  pdf: jsPDF,
  settings: CompanySettings,
  yPos: number
): number {
  const displayOption = settings.logoDisplayOption || "both";
  const showLogo = (displayOption === "logo" || displayOption === "both") && settings.logo;
  const showName = displayOption === "name" || displayOption === "both";

  if (showLogo) {
    try {
      pdf.addImage(settings.logo!, "PNG", MARGIN, yPos, 40, 20);
      yPos += 23;
    } catch (e) {
      console.error("Error adding logo:", e);
    }
  }

  if (showName) {
    pdf.setFontSize(showLogo ? 16 : 20);
    pdf.setFont(undefined, "bold");
    pdf.text(settings.name || "Your Company", MARGIN, yPos);
    yPos += 8;
  }

  return yPos;
}

// Common company contact info rendering
export function renderCompanyContact(
  pdf: jsPDF,
  settings: CompanySettings,
  yPos: number
): number {
  pdf.setFontSize(9);
  pdf.setFont(undefined, "normal");

  if (settings.address) {
    pdf.text(settings.address, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  if (settings.city || settings.state || settings.zip) {
    const cityStateZip = `${settings.city || ""}${settings.city && settings.state ? ", " : ""}${settings.state || ""} ${settings.zip || ""}`.trim();
    if (cityStateZip) {
      pdf.text(cityStateZip, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
  }

  if (settings.phone || settings.email) {
    const contact = [settings.phone, settings.email].filter(Boolean).join(" | ");
    pdf.text(contact, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  if (settings.license) {
    pdf.text(`License: ${settings.license}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  if (settings.insurance) {
    pdf.text(`Insurance: ${settings.insurance}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  return yPos;
}

// Common customer info rendering
export function renderCustomerInfo(
  pdf: jsPDF,
  quote: Quote,
  customer: Customer | null,
  yPos: number
): number {
  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text("Prepared For:", MARGIN, yPos);
  yPos += 7;

  pdf.setFontSize(10);
  pdf.setFont(undefined, "normal");

  // Prioritize Contact Name, but show business as reference if present
  const hasContact = customer?.contactFirstName || customer?.contactLastName;
  const contactName = hasContact
    ? `${customer?.contactFirstName || ''} ${customer?.contactLastName || ''}`.trim()
    : quote.customerName; // Fallback to business name if no contact explicitly set

  pdf.text(contactName, MARGIN, yPos);
  yPos += LINE_HEIGHT;

  // Show Business Name if it differs and is present
  if (hasContact && quote.customerName && quote.customerName !== contactName) {
    pdf.setFontSize(8);
    pdf.setFont(undefined, "italic");
    pdf.text(quote.customerName, MARGIN, yPos);
    yPos += LINE_HEIGHT;
    pdf.setFontSize(10);
    pdf.setFont(undefined, "normal");
  }

  if (customer?.address) {
    pdf.text(customer.address, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  if (customer?.city || customer?.state || customer?.zip) {
    const custCityStateZip = `${customer.city || ""}${customer.city && customer.state ? ", " : ""}${customer.state || ""} ${customer.zip || ""}`.trim();
    if (custCityStateZip) {
      pdf.text(custCityStateZip, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
  }

  if (customer?.phone) {
    pdf.text(customer.phone, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }

  return yPos;
}

// Common terms rendering with page break handling
export function renderTermsAndNotes(
  pdf: jsPDF,
  quote: Quote,
  settings: CompanySettings,
  yPos: number
): number {
  if (!settings.terms && !quote.notes) {
    return yPos;
  }

  // Company Terms
  if (settings.terms) {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }

    pdf.setFont(undefined, "bold");
    pdf.setFontSize(9);
    pdf.text("Terms & Conditions:", MARGIN, yPos);
    yPos += 6;

    pdf.setFont(undefined, "normal");
    pdf.setFontSize(8);

    // Use shared formatter to convert JSON to readable text
    const termsText = formatTermsContent(settings.terms);

    const termsLines = pdf.splitTextToSize(termsText, 170);
    pdf.text(termsLines, MARGIN, yPos);
    yPos += termsLines.length * 4 + 8;
  }

  // Quote-Specific Notes with page break handling
  if (quote.notes) {
    if (yPos > 260) {
      pdf.addPage();
      yPos = MARGIN;
    }

    pdf.setFont(undefined, "bold");
    pdf.setFontSize(9);
    pdf.text("Additional Terms & Notes:", MARGIN, yPos);
    yPos += 6;

    pdf.setFont(undefined, "normal");
    pdf.setFontSize(8);
    const notesLines = pdf.splitTextToSize(quote.notes, 170);

    notesLines.forEach((line: string) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = MARGIN;
      }
      pdf.text(line, MARGIN, yPos);
      yPos += 4;
    });
  }

  return yPos;
}

// Common signature rendering
export function renderSignature(
  pdf: jsPDF,
  quote: Quote,
  yPos: number
): number {
  if (!quote.signatureData) {
    return yPos;
  }

  if (yPos > 240) {
    pdf.addPage();
    yPos = MARGIN;
  }

  yPos += SECTION_GAP;
  pdf.setFont(undefined, "bold");
  pdf.setFontSize(10);
  pdf.text("Client Acceptance:", MARGIN, yPos);
  yPos += 5;

  try {
    // Add signature image
    pdf.addImage(quote.signatureData, "PNG", MARGIN, yPos, 50, 20);
    yPos += 22;
  } catch (e) {
    console.error("Error adding signature image to PDF:", e);
    pdf.setFont(undefined, "italic");
    pdf.text("[Signature Image]", MARGIN, yPos);
    yPos += 5;
  }

  pdf.setFontSize(9);
  pdf.setFont(undefined, "normal");
  pdf.text(`Digitally signed by ${quote.signedByName || 'Client'}`, MARGIN, yPos);
  yPos += 4;

  if (quote.signedAt) {
    const signedDate = new Date(quote.signedAt).toLocaleString();
    pdf.text(`Date: ${signedDate}`, MARGIN, yPos);
    yPos += 5;
  }

  return yPos;
}

// Exports for use in proposal-templates.ts
export { MARGIN, LINE_HEIGHT, SECTION_GAP };

// --- IMPLEMENT PDF GENERATION FUNCTIONS ---

export function generateClassicPDF(
  quote: Quote,
  customer: Customer | null,
  settings: CompanySettings
): Blob {
  const pdf = new jsPDF() as jsPDFWithAutoTable;
  let yPos = MARGIN;

  yPos = renderCompanyHeader(pdf, settings, yPos);
  yPos = renderCompanyContact(pdf, settings, yPos);
  yPos += SECTION_GAP * 2;

  yPos = renderCustomerInfo(pdf, quote, customer, yPos);
  yPos += SECTION_GAP * 2;

  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  // Use quoteNumber for display, fallback to truncated ID
  const displayQuoteNumber = quote.quoteNumber || `Q-${quote.id.substring(0, 8)}`;
  pdf.text(`Quote #${displayQuoteNumber}`, MARGIN, yPos);
  yPos += 8;

  const pricingMode = (quote as any).pricingMode || 'itemized';

  let tableHeaders;
  let tableData;

  if (pricingMode === 'itemized') {
    tableHeaders = [["Item", "Description", "Qty", "Price", "Total"]];
    tableData = quote.items.map(item => [
      item.name,
      item.description,
      item.quantity.toString(),
      formatCurrency(item.price, settings.currency),
      formatCurrency(item.quantity * item.price, settings.currency),
    ]);
  } else {
    // Group by category for 'category_total' mode
    console.log('[PDF] Grouping items by category. Total items:', quote.items.length);
    const categories = Array.from(new Set(quote.items.map(i => normalizeCategory(i.category, i.name))));
    console.log('[PDF] Found categories:', categories);
    tableHeaders = [["Category", "Items", "Total"]];
    tableData = categories.map(cat => {
      const catItems = quote.items.filter(i => normalizeCategory(i.category, i.name) === cat);
      const catTotal = catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return [
        cat,
        catItems.map(i => i.name).join("\n"),
        formatCurrency(catTotal, settings.currency)
      ];
    });
  }

  // Get theme color for table header
  const themeColor = getThemeTableColor(settings);

  autoTable(pdf, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: themeColor },
  } as UserOptions);

  yPos = pdf.lastAutoTable.finalY + SECTION_GAP * 2;

  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text(`Total: ${formatCurrency(quote.total, settings.currency)}`, 190 - MARGIN, yPos, { align: 'right' });
  yPos += SECTION_GAP * 2;

  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);
  yPos = renderSignature(pdf, quote, yPos);

  return pdf.output("blob");
}

export function generateModernPDF(
  quote: Quote,
  customer: Customer | null,
  settings: CompanySettings
): Blob {
  const pdf = new jsPDF() as jsPDFWithAutoTable;
  let yPos = MARGIN;

  yPos = renderCompanyHeader(pdf, settings, yPos);
  yPos += SECTION_GAP;

  pdf.setFontSize(22);
  pdf.setFont(undefined, "bold");
  pdf.text(`QUOTE`, 190, MARGIN + 10, { align: 'right' });
  pdf.setFontSize(10);
  // Use quoteNumber for display, fallback to truncated ID
  const displayQuoteNumber = quote.quoteNumber || `Q-${quote.id.substring(0, 8)}`;
  pdf.text(`#${displayQuoteNumber}`, 190, MARGIN + 15, { align: 'right' });

  yPos = Math.max(yPos, MARGIN + 20);

  yPos = renderCompanyContact(pdf, settings, yPos);
  yPos += SECTION_GAP;

  yPos = renderCustomerInfo(pdf, quote, customer, yPos);
  yPos += SECTION_GAP * 2;

  const pricingMode = (quote as any).pricingMode || 'itemized';
  let tableHeaders;
  let tableData;

  if (pricingMode === 'itemized') {
    tableHeaders = [["Item", "Description", "Quantity", "Unit Price", "Line Total"]];
    tableData = quote.items.map(item => [
      item.name,
      item.description,
      item.quantity,
      formatCurrency(item.price, settings.currency),
      formatCurrency(item.quantity * item.price, settings.currency),
    ]);
  } else {
    const categories = Array.from(new Set(quote.items.map(i => normalizeCategory(i.category, i.name))));
    tableHeaders = [["Category", "Included Items", "Total"]];
    tableData = categories.map(cat => {
      const catItems = quote.items.filter(i => normalizeCategory(i.category, i.name) === cat);
      const catTotal = catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return [
        cat,
        catItems.map(i => i.name).join("\n"),
        formatCurrency(catTotal, settings.currency)
      ];
    });
  }

  // Get theme color for table header
  const themeColor = getThemeTableColor(settings);

  autoTable(pdf, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: "grid",
    headStyles: { fillColor: themeColor },
  } as UserOptions);

  yPos = pdf.lastAutoTable.finalY + SECTION_GAP * 2;

  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text(`Total: ${formatCurrency(quote.total, settings.currency)}`, 190 - MARGIN, yPos, { align: 'right' });
  yPos += SECTION_GAP * 2;

  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);
  yPos = renderSignature(pdf, quote, yPos);

  return pdf.output("blob");
}

export function generateDetailedPDF(
  quote: Quote,
  customer: Customer | null,
  settings: CompanySettings
): Blob {
  const pdf = new jsPDF() as jsPDFWithAutoTable;
  let yPos = MARGIN;

  yPos = renderCompanyHeader(pdf, settings, yPos);
  yPos = renderCompanyContact(pdf, settings, yPos);
  yPos += SECTION_GAP * 2;

  yPos = renderCustomerInfo(pdf, quote, customer, yPos);
  yPos += SECTION_GAP * 2;

  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  // Use quoteNumber for display, fallback to truncated ID
  const displayQuoteNumber = quote.quoteNumber || `Q-${quote.id.substring(0, 8)}`;
  pdf.text(`Detailed Quote #${displayQuoteNumber}`, MARGIN, yPos);
  yPos += 8;

  const quoteData = quote as any;
  const subtotal = quoteData.subtotal || 0;
  const tax = quoteData.tax || 0;
  const total = quoteData.total || 0;

  const pricingMode = (quote as any).pricingMode || 'itemized';
  let tableHeaders;
  let tableData;

  if (pricingMode === 'itemized') {
    tableHeaders = [["Item", "Description", "Qty", "Price", "Total"]];
    tableData = quote.items.map(item => [
      item.name,
      item.description,
      item.quantity.toString(),
      formatCurrency(item.price, settings.currency),
      formatCurrency(item.quantity * item.price, settings.currency),
    ]);
  } else {
    const categories = Array.from(new Set(quote.items.map(i => normalizeCategory(i.category, i.name))));
    tableHeaders = [["Category", "Items", "TotalValue"]];
    tableData = categories.map(cat => {
      const catItems = quote.items.filter(i => normalizeCategory(i.category, i.name) === cat);
      const catTotal = catItems.reduce((sum, i) => sum + (i.price * i.quantity), 0);
      return [
        cat,
        catItems.map(i => i.name).join("\n"),
        formatCurrency(catTotal, settings.currency)
      ];
    });
  }

  autoTable(pdf, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: "plain",
  } as UserOptions);

  yPos = pdf.lastAutoTable.finalY + SECTION_GAP;

  pdf.text(`Subtotal:`, 150, yPos, { align: "right" });
  pdf.text(formatCurrency(subtotal, settings.currency), 190, yPos, { align: "right" });
  yPos += LINE_HEIGHT;

  if (tax > 0) {
    const taxRate = Math.round((tax / subtotal) * 100);
    pdf.text(`Tax (${taxRate}%):`, 150, yPos, { align: "right" });
    pdf.text(formatCurrency(tax, settings.currency), 190, yPos, { align: "right" });
    yPos += LINE_HEIGHT;
  }

  pdf.setFont(undefined, "bold");
  pdf.text(`Total:`, 150, yPos, { align: "right" });
  pdf.text(formatCurrency(total, settings.currency), 190, yPos, { align: "right" });
  yPos += SECTION_GAP * 2;

  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);
  yPos = renderSignature(pdf, quote, yPos);

  return pdf.output("blob");
}
