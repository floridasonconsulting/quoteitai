import jsPDF from "jspdf";
import { Quote, Customer, CompanySettings } from "@/types";
import { formatCurrency } from "./utils";

// Shared PDF generation constants
const MARGIN = 20;
const LINE_HEIGHT = 5;
const SECTION_GAP = 8;

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
export { MARGIN, LINE_HEIGHT, SECTION_GAP, formatCurrency };
