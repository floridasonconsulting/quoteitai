import { Quote, Customer, CompanySettings } from "@/types";
import { generateClassicPDF, generateModernPDF, generateDetailedPDF } from "./pdf-generator";

export async function generatePDF(
  quote: Quote,
  customer: Customer | null,
  settings: CompanySettings,
  template: "classic" | "modern" | "detailed" = "classic"
) {
  switch (template) {
    case "modern":
      return generateModernPDF(quote, customer, settings);
    case "detailed":
      return generateDetailedPDF(quote, customer, settings);
    case "classic":
    default:
      return generateClassicPDF(quote, customer, settings);
  }
}

// Re-export individual generators for backwards compatibility
export { generateClassicPDF, generateModernPDF, generateDetailedPDF } from "./pdf-generator";
