import jsPDF from 'jspdf';
import { Quote, Customer, CompanySettings } from '@/types';
import { formatCurrency } from '@/lib/utils';

const MARGIN = 20;
const LINE_HEIGHT = 5;
const SECTION_GAP = 8;

// Classic Template (Original Design)
export async function generateClassicPDF(quote: Quote, customer: Customer | null, settings: CompanySettings) {
  const pdf = new jsPDF();
  const displayOption = settings.logoDisplayOption || 'both';
  let yPos = MARGIN;
  
  // Header Section - Logo and/or Company Name (vertical stack)
  const showLogo = (displayOption === 'logo' || displayOption === 'both') && settings.logo;
  const showName = displayOption === 'name' || displayOption === 'both';
  
  if (showLogo) {
    try {
      pdf.addImage(settings.logo!, 'PNG', MARGIN, yPos, 40, 20);
      yPos += 23;
      
      if (showName) {
        pdf.setFontSize(16);
        pdf.setFont(undefined, 'bold');
        pdf.text(settings.name || 'Your Company', MARGIN, yPos);
        yPos += 8;
      }
    } catch (e) {
      console.error('Error adding logo:', e);
      if (showName) {
        pdf.setFontSize(20);
        pdf.setFont(undefined, 'bold');
        pdf.text(settings.name || 'Your Company', MARGIN, yPos);
        yPos += 8;
      }
    }
  } else if (showName) {
    pdf.setFontSize(20);
    pdf.setFont(undefined, 'bold');
    pdf.text(settings.name || 'Your Company', MARGIN, yPos);
    yPos += 8;
  }
  
  // Company Contact Info
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  if (settings.address) {
    pdf.text(settings.address, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (settings.city || settings.state || settings.zip) {
    const cityStateZip = `${settings.city || ''}${settings.city && settings.state ? ', ' : ''}${settings.state || ''} ${settings.zip || ''}`.trim();
    if (cityStateZip) {
      pdf.text(cityStateZip, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
  }
  if (settings.phone || settings.email) {
    const contact = [settings.phone, settings.email].filter(Boolean).join(' | ');
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
  
  // Quote Info (top right)
  let rightYPos = MARGIN;
  pdf.setFontSize(18);
  pdf.setFont(undefined, 'bold');
  pdf.text('PROPOSAL', 150, rightYPos);
  rightYPos += 8;
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(`Quote #: ${quote.quoteNumber}`, 150, rightYPos);
  rightYPos += LINE_HEIGHT + 1;
  pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 150, rightYPos);
  
  yPos = Math.max(yPos, rightYPos) + SECTION_GAP;
  
  // Separator line
  pdf.line(MARGIN, yPos, 190, yPos);
  yPos += SECTION_GAP + 2;
  
  // Customer Info
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  pdf.text('Prepared For:', MARGIN, yPos);
  yPos += 7;
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'normal');
  pdf.text(quote.customerName, MARGIN, yPos);
  yPos += LINE_HEIGHT;
  
  if (customer?.address) {
    pdf.text(customer.address, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (customer?.city || customer?.state || customer?.zip) {
    const custCityStateZip = `${customer.city || ''}${customer.city && customer.state ? ', ' : ''}${customer.state || ''} ${customer.zip || ''}`.trim();
    if (custCityStateZip) {
      pdf.text(custCityStateZip, MARGIN, yPos);
      yPos += LINE_HEIGHT;
    }
  }
  if (customer?.phone) {
    pdf.text(customer.phone, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  
  yPos += SECTION_GAP;
  
  // Quote Title
  pdf.setFontSize(14);
  pdf.setFont(undefined, 'bold');
  const titleLines = pdf.splitTextToSize(quote.title, 170);
  pdf.text(titleLines, MARGIN, yPos);
  yPos += titleLines.length * 6 + SECTION_GAP;
  
  // Items Header
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(MARGIN, yPos - 2, 170, 8, 'F');
  pdf.text('Description', MARGIN + 2, yPos + 3);
  yPos += 10;
  
  // Items List
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(9);
  
  quote.items.forEach((item) => {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    const itemDescription = item.name + (item.description ? ` - ${item.description}` : '');
    const itemLines = pdf.splitTextToSize(itemDescription, 165);
    
    pdf.text(itemLines, MARGIN + 2, yPos);
    yPos += itemLines.length * LINE_HEIGHT + 4;
  });
  
  if (yPos > 250) {
    pdf.addPage();
    yPos = MARGIN;
  }
  
  yPos += 5;
  
  // Total Section
  pdf.line(MARGIN, yPos, 190, yPos);
  yPos += 8;
  
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(12);
  pdf.text('TOTAL:', 120, yPos);
  pdf.text(formatCurrency(quote.total), 185, yPos, { align: 'right' });
  
  yPos += 12;
  
  // Terms & Conditions Section
  if (settings.terms || quote.notes) {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    // Company Terms
    if (settings.terms) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);
      pdf.text('Terms & Conditions:', MARGIN, yPos);
      yPos += 6;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const termsLines = pdf.splitTextToSize(settings.terms, 170);
      pdf.text(termsLines, MARGIN, yPos);
      yPos += termsLines.length * 4 + 8;
    }
    
    // Quote-Specific Notes/Terms with page break handling
    if (quote.notes) {
      if (yPos > 260) {
        pdf.addPage();
        yPos = MARGIN;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);
      pdf.text('Additional Terms & Notes:', MARGIN, yPos);
      yPos += 6;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const notesLines = pdf.splitTextToSize(quote.notes, 170);
      
      // Render line by line with page break handling
      notesLines.forEach((line: string) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = MARGIN;
        }
        pdf.text(line, MARGIN, yPos);
        yPos += 4;
      });
    }
  }
  
  pdf.save(`quote-${quote.quoteNumber}.pdf`);
}

// Modern Template (Clean & Minimal)
export async function generateModernPDF(quote: Quote, customer: Customer | null, settings: CompanySettings) {
  const pdf = new jsPDF();
  const displayOption = settings.logoDisplayOption || 'both';
  let yPos = MARGIN;
  
  // Centered logo/name
  const showLogo = (displayOption === 'logo' || displayOption === 'both') && settings.logo;
  const showName = displayOption === 'name' || displayOption === 'both';
  
  if (showLogo) {
    try {
      pdf.addImage(settings.logo!, 'PNG', 85, yPos, 40, 20);
      yPos += 23;
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }
  
  if (showName) {
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(settings.name || 'Your Company', 105, yPos, { align: 'center' });
    yPos += 8;
  }
  
  // Company credentials (license/insurance) centered below name
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'normal');
  const credentials = [];
  if (settings.license) credentials.push(`License: ${settings.license}`);
  if (settings.insurance) credentials.push(`Insurance: ${settings.insurance}`);
  if (credentials.length > 0) {
    pdf.text(credentials.join(' | '), 105, yPos, { align: 'center' });
    yPos += 5;
  }
  
  yPos += 5;
  
  // Modern accent bar with gradient effect (using overlapping bars)
  pdf.setFillColor(59, 130, 246); // Blue-500
  pdf.rect(0, yPos, 210, 3, 'F');
  pdf.setFillColor(37, 99, 235); // Blue-600
  pdf.rect(0, yPos + 1, 210, 2, 'F');
  yPos += 10;
  
  // Quote number centered
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text(`PROPOSAL #${quote.quoteNumber}`, 105, yPos, { align: 'center' });
  yPos += 10;
  
  // Two-column layout
  const leftCol = MARGIN;
  const rightCol = 110;
  let leftYPos = yPos;
  let rightYPos = yPos;
  
  // Left: Customer Info
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');
  pdf.text('Prepared For:', leftCol, leftYPos);
  leftYPos += 6;
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(9);
  pdf.text(quote.customerName, leftCol, leftYPos);
  leftYPos += LINE_HEIGHT;
  if (customer?.address) {
    pdf.text(customer.address, leftCol, leftYPos);
    leftYPos += LINE_HEIGHT;
  }
  if (customer?.city || customer?.state) {
    pdf.text(`${customer.city || ''}, ${customer.state || ''} ${customer.zip || ''}`.trim(), leftCol, leftYPos);
    leftYPos += LINE_HEIGHT;
  }
  if (customer?.phone) {
    pdf.text(customer.phone, leftCol, leftYPos);
    leftYPos += LINE_HEIGHT;
  }
  
  // Right: Quote Details
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(10);
  pdf.text('Quote Details:', rightCol, rightYPos);
  rightYPos += 6;
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(9);
  pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, rightCol, rightYPos);
  rightYPos += LINE_HEIGHT;
  pdf.text(`Status: ${quote.status}`, rightCol, rightYPos);
  rightYPos += LINE_HEIGHT;
  
  yPos = Math.max(leftYPos, rightYPos) + 10;
  
  // Title
  pdf.setFontSize(12);
  pdf.setFont(undefined, 'bold');
  const titleLines = pdf.splitTextToSize(quote.title, 170);
  pdf.text(titleLines, MARGIN, yPos);
  yPos += titleLines.length * 6 + SECTION_GAP;
  
  // Items table with pricing
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'bold');
  pdf.setFillColor(240, 240, 240);
  pdf.rect(MARGIN, yPos - 2, 170, 8, 'F');
  pdf.text('Item', MARGIN + 2, yPos + 3);
  pdf.text('Qty', 120, yPos + 3);
  pdf.text('Price', 145, yPos + 3);
  pdf.text('Total', 185, yPos + 3, { align: 'right' });
  yPos += 10;
  
  pdf.setFont(undefined, 'normal');
  
  quote.items.forEach((item) => {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    const itemName = pdf.splitTextToSize(item.name, 100);
    pdf.text(itemName, MARGIN + 2, yPos);
    pdf.text(item.quantity.toString(), 120, yPos);
    pdf.text(formatCurrency(item.price), 145, yPos);
    pdf.text(formatCurrency(item.total), 185, yPos, { align: 'right' });
    yPos += Math.max(itemName.length * LINE_HEIGHT, LINE_HEIGHT) + 3;
  });
  
  yPos += 5;
  
  // Totals section
  pdf.setFont(undefined, 'normal');
  pdf.text('Subtotal:', 150, yPos);
  pdf.text(formatCurrency(quote.subtotal), 185, yPos, { align: 'right' });
  yPos += 6;
  
  if (quote.tax > 0) {
    pdf.text('Tax:', 150, yPos);
    pdf.text(formatCurrency(quote.tax), 185, yPos, { align: 'right' });
    yPos += 6;
  }
  
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(12);
  pdf.text('Grand Total:', 130, yPos);
  pdf.text(formatCurrency(quote.total), 185, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Terms & Conditions Section (Modern)
  if (settings.terms || quote.notes) {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    // Company Terms
    if (settings.terms) {
      pdf.setFillColor(249, 250, 251); // Light gray background
      pdf.rect(MARGIN, yPos - 3, 170, 6, 'F');
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);
      pdf.text('Terms & Conditions', MARGIN + 2, yPos);
      yPos += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const termsLines = pdf.splitTextToSize(settings.terms, 170);
      pdf.text(termsLines, MARGIN, yPos);
      yPos += termsLines.length * 4 + 8;
    }
    
    // Quote-Specific Notes/Terms with page break handling
    if (quote.notes) {
      if (yPos > 260) {
        pdf.addPage();
        yPos = MARGIN;
      }
      
      pdf.setFillColor(249, 250, 251);
      pdf.rect(MARGIN, yPos - 3, 170, 6, 'F');
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(9);
      pdf.text('Additional Terms & Notes', MARGIN + 2, yPos);
      yPos += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const notesLines = pdf.splitTextToSize(quote.notes, 170);
      
      // Render line by line with page break handling
      notesLines.forEach((line: string) => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = MARGIN;
        }
        pdf.text(line, MARGIN, yPos);
        yPos += 4;
      });
    }
  }
  
  pdf.save(`quote-${quote.quoteNumber}.pdf`);
}

// Detailed Template (Comprehensive)
export async function generateDetailedPDF(quote: Quote, customer: Customer | null, settings: CompanySettings) {
  const pdf = new jsPDF();
  const displayOption = settings.logoDisplayOption || 'both';
  let yPos = MARGIN;
  
  // Full company header
  const showLogo = (displayOption === 'logo' || displayOption === 'both') && settings.logo;
  const showName = displayOption === 'name' || displayOption === 'both';
  
  if (showLogo) {
    try {
      pdf.addImage(settings.logo!, 'PNG', MARGIN, yPos, 40, 20);
      yPos += 23;
    } catch (e) {
      console.error('Error adding logo:', e);
    }
  }
  
  if (showName) {
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text(settings.name || 'Your Company', MARGIN, yPos);
    yPos += 8;
  }
  
  // Company details prominent
  pdf.setFontSize(9);
  pdf.setFont(undefined, 'normal');
  if (settings.address) {
    pdf.text(settings.address, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (settings.city || settings.state) {
    pdf.text(`${settings.city || ''}, ${settings.state || ''} ${settings.zip || ''}`.trim(), MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (settings.phone) {
    pdf.text(`Phone: ${settings.phone}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (settings.email) {
    pdf.text(`Email: ${settings.email}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
  }
  if (settings.license) {
    pdf.setFont(undefined, 'bold');
    pdf.text(`License: ${settings.license}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
    pdf.setFont(undefined, 'normal');
  }
  if (settings.insurance) {
    pdf.setFont(undefined, 'bold');
    pdf.text(`Insurance: ${settings.insurance}`, MARGIN, yPos);
    yPos += LINE_HEIGHT;
    pdf.setFont(undefined, 'normal');
  }
  
  yPos += SECTION_GAP;
  
  // Proposal header
  pdf.setFontSize(16);
  pdf.setFont(undefined, 'bold');
  pdf.text('DETAILED PROPOSAL', 105, yPos, { align: 'center' });
  yPos += 10;
  
  // Customer info in bordered box
  pdf.setFillColor(245, 245, 245);
  pdf.rect(MARGIN, yPos, 170, 30, 'F');
  pdf.rect(MARGIN, yPos, 170, 30, 'S');
  yPos += 5;
  
  pdf.setFontSize(10);
  pdf.setFont(undefined, 'bold');
  pdf.text('Customer Information', MARGIN + 3, yPos);
  yPos += 6;
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(9);
  pdf.text(quote.customerName, MARGIN + 3, yPos);
  yPos += LINE_HEIGHT;
  if (customer?.address) {
    pdf.text(customer.address, MARGIN + 3, yPos);
    yPos += LINE_HEIGHT;
  }
  if (customer?.city) {
    pdf.text(`${customer.city}, ${customer.state} ${customer.zip}`.trim(), MARGIN + 3, yPos);
    yPos += LINE_HEIGHT;
  }
  if (customer?.phone) {
    pdf.text(`Phone: ${customer.phone}`, MARGIN + 3, yPos);
    yPos += LINE_HEIGHT;
  }
  
  yPos += 8;
  
  // Quote metadata
  pdf.setFont(undefined, 'bold');
  pdf.text(`Quote #: ${quote.quoteNumber}`, MARGIN, yPos);
  pdf.text(`Date: ${new Date(quote.createdAt).toLocaleDateString()}`, 150, yPos);
  yPos += 10;
  
  // Title
  pdf.setFontSize(12);
  const titleLines = pdf.splitTextToSize(quote.title, 170);
  pdf.text(titleLines, MARGIN, yPos);
  yPos += titleLines.length * 6 + SECTION_GAP;
  
  // Detailed items table
  pdf.setFontSize(8);
  pdf.setFont(undefined, 'bold');
  pdf.setFillColor(220, 220, 220);
  pdf.rect(MARGIN, yPos - 2, 170, 8, 'F');
  pdf.text('Qty', MARGIN + 2, yPos + 3);
  pdf.text('Description', MARGIN + 15, yPos + 3);
  pdf.text('Unit', 110, yPos + 3);
  pdf.text('Unit Price', 135, yPos + 3);
  pdf.text('Total', 185, yPos + 3, { align: 'right' });
  yPos += 10;
  
  pdf.setFont(undefined, 'normal');
  
  quote.items.forEach((item) => {
    if (yPos > 240) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    pdf.text(item.quantity.toString(), MARGIN + 2, yPos);
    const descLines = pdf.splitTextToSize(item.name + (item.description ? ` - ${item.description}` : ''), 70);
    pdf.text(descLines, MARGIN + 15, yPos);
    pdf.text(item.units || 'ea', 110, yPos);
    pdf.text(formatCurrency(item.price), 135, yPos);
    pdf.text(formatCurrency(item.total), 185, yPos, { align: 'right' });
    
    yPos += Math.max(descLines.length * 4, 6) + 2;
  });
  
  yPos += 5;
  pdf.line(120, yPos, 190, yPos);
  yPos += 6;
  
  // Totals
  pdf.text('Subtotal:', 150, yPos);
  pdf.text(formatCurrency(quote.subtotal), 185, yPos, { align: 'right' });
  yPos += 6;
  
  if (quote.tax > 0) {
    pdf.text(`Tax (${((quote.tax / quote.subtotal) * 100).toFixed(1)}%):`, 150, yPos);
    pdf.text(formatCurrency(quote.tax), 185, yPos, { align: 'right' });
    yPos += 6;
  }
  
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(11);
  pdf.text('TOTAL:', 150, yPos);
  pdf.text(formatCurrency(quote.total), 185, yPos, { align: 'right' });
  
  yPos += 15;
  
  // Terms & Conditions Section (Detailed with borders)
  if (settings.terms || quote.notes) {
    if (yPos > 230) {
      pdf.addPage();
      yPos = MARGIN;
    }
    
    // Company Terms in bordered box
    if (settings.terms) {
      pdf.setDrawColor(200, 200, 200);
      pdf.setFillColor(250, 250, 250);
      const termsBoxHeight = 40;
      pdf.rect(MARGIN, yPos, 170, termsBoxHeight, 'FD');
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Terms & Conditions:', MARGIN + 3, yPos + 5);
      yPos += 10;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const termsLines = pdf.splitTextToSize(settings.terms, 164);
      pdf.text(termsLines, MARGIN + 3, yPos);
      yPos += termsBoxHeight + 5;
    }
    
    // Quote-Specific Notes/Terms in bordered boxes with page break handling
    if (quote.notes) {
      if (yPos > 250) {
        pdf.addPage();
        yPos = MARGIN;
      }
      
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(10);
      pdf.text('Additional Terms & Notes:', MARGIN, yPos);
      yPos += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(8);
      const notesLines = pdf.splitTextToSize(quote.notes, 164);
      
      // Calculate if we need multiple bordered sections across pages
      const maxLinesPerPage = Math.floor((280 - yPos) / 4);
      let currentLine = 0;
      
      while (currentLine < notesLines.length) {
        const linesThisPage = Math.min(maxLinesPerPage, notesLines.length - currentLine);
        const boxHeight = linesThisPage * 4 + 8;
        
        // Draw box for this page's content
        pdf.setDrawColor(200, 200, 200);
        pdf.setFillColor(250, 250, 250);
        pdf.rect(MARGIN, yPos - 5, 170, boxHeight, 'FD');
        
        // Render lines for this page
        for (let i = 0; i < linesThisPage; i++) {
          pdf.text(notesLines[currentLine + i], MARGIN + 3, yPos);
          yPos += 4;
        }
        
        currentLine += linesThisPage;
        
        // Add new page if more content remains
        if (currentLine < notesLines.length) {
          pdf.addPage();
          yPos = MARGIN;
        } else {
          yPos += 10;
        }
      }
    }
  }
  
  // Signature blocks
  if (yPos > 240) {
    pdf.addPage();
    yPos = MARGIN;
  }
  
  pdf.setFont(undefined, 'bold');
  pdf.setFontSize(9);
  pdf.text('Customer Signature:', MARGIN, yPos);
  pdf.text('Contractor:', 110, yPos);
  yPos += 15;
  
  pdf.line(MARGIN, yPos, 90, yPos);
  pdf.line(110, yPos, 190, yPos);
  yPos += 5;
  
  pdf.setFont(undefined, 'normal');
  pdf.setFontSize(8);
  pdf.text('Date:', MARGIN, yPos);
  pdf.text('Date:', 110, yPos);
  
  pdf.save(`quote-${quote.quoteNumber}.pdf`);
}
