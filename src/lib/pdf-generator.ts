import jsPDF from "jspdf";
import autoTable, { UserOptions } from "jspdf-autotable";
import { Quote, Customer, CompanySettings } from "@/types";

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
  pdf.text(quote.customerName, MARGIN, yPos);
  yPos += LINE_HEIGHT;

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
    const termsLines = pdf.splitTextToSize(settings.terms, 170);
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
  pdf.text(`Quote #${quote.id}`, MARGIN, yPos);
  yPos += 8;

  const tableHeaders = [["Item", "Description", "Qty", "Price", "Total"]];
  const tableData = quote.items.map(item => [
    item.name,
    item.description,
    item.quantity.toString(),
    formatCurrency(item.price, settings.currency),
    formatCurrency(item.quantity * item.price, settings.currency),
  ]);

  autoTable(pdf, {
    startY: yPos,
    head: tableHeaders,
    body: tableData,
    theme: "striped",
    headStyles: { fillColor: [22, 160, 133] },
  } as UserOptions);

  yPos = pdf.lastAutoTable.finalY + SECTION_GAP * 2;

  pdf.setFontSize(12);
  pdf.setFont(undefined, "bold");
  pdf.text(`Total: ${formatCurrency(quote.total, settings.currency)}`, 190 - MARGIN, yPos, { align: 'right' });
  yPos += SECTION_GAP * 2;
  
  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);

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
  pdf.text(`#${quote.id}`, 190, MARGIN + 15, { align: 'right' });

  yPos = Math.max(yPos, MARGIN + 20);

  yPos = renderCompanyContact(pdf, settings, yPos);
  yPos += SECTION_GAP;
  
  yPos = renderCustomerInfo(pdf, quote, customer, yPos);
  yPos += SECTION_GAP * 2;

  autoTable(pdf, {
    startY: yPos,
    head: [["Item", "Description", "Quantity", "Unit Price", "Line Total"]],
    body: quote.items.map(item => [
      item.name,
      item.description,
      item.quantity,
      formatCurrency(item.price, settings.currency),
      formatCurrency(item.quantity * item.price, settings.currency),
    ]),
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  } as UserOptions);
  
  yPos = pdf.lastAutoTable.finalY + SECTION_GAP * 2;

  pdf.setFontSize(14);
  pdf.setFont(undefined, "bold");
  pdf.text(`Total: ${formatCurrency(quote.total, settings.currency)}`, 190 - MARGIN, yPos, { align: 'right' });
  yPos += SECTION_GAP * 2;

  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);

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
  pdf.text(`Detailed Quote #${quote.id}`, MARGIN, yPos);
  yPos += 8;

  autoTable(pdf, {
    startY: yPos,
    head: [["Item", "Description", "Qty", "Price", "Total"]],
    body: quote.items.map(item => [
      item.name,
      item.description,
      item.quantity.toString(),
      formatCurrency(item.price, settings.currency),
      formatCurrency(item.quantity * item.price, settings.currency),
    ]),
    theme: "plain",
  } as UserOptions);

  yPos = pdf.lastAutoTable.finalY + SECTION_GAP;

  const subtotal = quote.total;
  const taxRate = settings.taxRate || 0;
  const tax = subtotal * (taxRate / 100);
  const finalTotal = subtotal + tax;

  pdf.text(`Subtotal:`, 150, yPos, { align: "right" });
  pdf.text(formatCurrency(subtotal, settings.currency), 190, yPos, { align: "right" });
  yPos += LINE_HEIGHT;

  if (taxRate > 0) {
    pdf.text(`Tax (${taxRate}%):`, 150, yPos, { align: "right" });
    pdf.text(formatCurrency(tax, settings.currency), 190, yPos, { align: "right" });
    yPos += LINE_HEIGHT;
  }
  
  yPos += 2;
  pdf.setFont(undefined, "bold");
  pdf.text(`Total:`, 150, yPos, { align: "right" });
  pdf.text(formatCurrency(finalTotal, settings.currency), 190, yPos, { align: "right" });
  yPos += SECTION_GAP * 2;
  
  yPos = renderTermsAndNotes(pdf, quote, settings, yPos);

  return pdf.output("blob");
}
