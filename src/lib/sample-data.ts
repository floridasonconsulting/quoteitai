import { Quote, Customer, Item, CompanySettings } from '@/types';
import { getCustomers, getQuotes, saveQuotes, saveCustomers, getItems, saveItems } from './storage';
import { generateQuoteNumber } from './quote-utils';
import { saveSettings } from './db-service';

const sampleCompanySettings: CompanySettings = {
  name: 'Acme Professional Services',
  address: '456 Enterprise Boulevard',
  city: 'San Francisco',
  state: 'CA',
  zip: '94103',
  phone: '(555) 987-6543',
  email: 'info@acmepro.com',
  website: 'https://www.acmepro.com',
  license: 'LIC-123456',
  insurance: 'INS-789012',
  logoDisplayOption: 'both',
  terms: 'Payment due within 30 days. Late payments subject to 1.5% monthly interest. Thank you for your business!',
};

export const generateSampleData = async (
  userId: string | undefined,
  includeCompanySettings: boolean = false
) => {
  const existingCustomers = getCustomers();
  const existingQuotes = getQuotes();
  const existingItems = getItems();

  // Generate diverse sample customers (10-15)
  const sampleCustomers: Customer[] = [
    {
      id: crypto.randomUUID(),
      name: 'Acme Corporation',
      email: 'contact@acmecorp.com',
      phone: '(555) 123-4567',
      address: '123 Business Ave',
      city: 'New York',
      state: 'NY',
      zip: '10001',
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'TechStart Inc',
      email: 'info@techstart.io',
      phone: '(555) 234-5678',
      address: '456 Innovation Blvd',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Global Solutions LLC',
      email: 'hello@globalsolutions.com',
      phone: '(555) 345-6789',
      address: '789 Enterprise Dr',
      city: 'Chicago',
      state: 'IL',
      zip: '60601',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Creative Designs Studio',
      email: 'studio@creativedesigns.com',
      phone: '(555) 456-7890',
      address: '321 Design Lane',
      city: 'Austin',
      state: 'TX',
      zip: '73301',
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Premium Services Co',
      email: 'services@premium.com',
      phone: '(555) 567-8901',
      address: '654 Quality St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Healthcare Plus',
      email: 'admin@healthcareplus.com',
      phone: '(555) 678-9012',
      address: '987 Medical Center Dr',
      city: 'Boston',
      state: 'MA',
      zip: '02101',
      createdAt: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Retail Giant Inc',
      email: 'contact@retailgiant.com',
      phone: '(555) 789-0123',
      address: '246 Commerce Blvd',
      city: 'Los Angeles',
      state: 'CA',
      zip: '90001',
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Construction Masters',
      email: 'info@constructionmasters.com',
      phone: '(555) 890-1234',
      address: '135 Builder St',
      city: 'Denver',
      state: 'CO',
      zip: '80201',
      createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Digital Marketing Pro',
      email: 'hello@digitalmarketingpro.com',
      phone: '(555) 901-2345',
      address: '579 Media Ave',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Education Center',
      email: 'admin@educationcenter.org',
      phone: '(555) 012-3456',
      address: '864 Learning Ln',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Manufacturing Corp',
      email: 'contact@manufacturingcorp.com',
      phone: '(555) 123-7890',
      address: '753 Industrial Pkwy',
      city: 'Detroit',
      state: 'MI',
      zip: '48201',
      createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Financial Advisors Group',
      email: 'info@financialadvisors.com',
      phone: '(555) 234-8901',
      address: '951 Money St',
      city: 'Charlotte',
      state: 'NC',
      zip: '28201',
      createdAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  const newCustomers = [...existingCustomers, ...sampleCustomers];
  saveCustomers(newCustomers);

  // Generate diverse sample items (15-20)
  const sampleItems: Item[] = [
    {
      id: crypto.randomUUID(),
      name: 'Consulting Services',
      description: 'Professional consulting and advisory services',
      category: 'Consulting',
      basePrice: 150,
      markupType: 'percentage',
      markup: 30,
      finalPrice: 195,
      units: 'Hour',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Web Design Package',
      description: 'Complete website design and branding',
      category: 'Services',
      basePrice: 5000,
      markupType: 'fixed',
      markup: 1500,
      finalPrice: 6500,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Cloud Storage',
      description: 'Monthly cloud storage subscription',
      category: 'Services',
      basePrice: 50,
      markupType: 'percentage',
      markup: 20,
      finalPrice: 60,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Technical Support',
      description: 'On-demand technical support and troubleshooting',
      category: 'Services',
      basePrice: 100,
      markupType: 'percentage',
      markup: 25,
      finalPrice: 125,
      units: 'Hour',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Software License',
      description: 'Annual software license subscription',
      category: 'Products',
      basePrice: 1200,
      markupType: 'percentage',
      markup: 15,
      finalPrice: 1380,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Hardware Installation',
      description: 'Professional hardware setup and configuration',
      category: 'Labor',
      basePrice: 200,
      markupType: 'fixed',
      markup: 50,
      finalPrice: 250,
      units: 'Day',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Network Equipment',
      description: 'Enterprise-grade networking hardware',
      category: 'Equipment',
      basePrice: 800,
      markupType: 'percentage',
      markup: 35,
      finalPrice: 1080,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Training Session',
      description: 'On-site or remote training sessions',
      category: 'Services',
      basePrice: 300,
      markupType: 'percentage',
      markup: 20,
      finalPrice: 360,
      units: 'Day',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Security Audit',
      description: 'Comprehensive security assessment and report',
      category: 'Consulting',
      basePrice: 2500,
      markupType: 'fixed',
      markup: 500,
      finalPrice: 3000,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Data Migration',
      description: 'Secure data transfer and migration services',
      category: 'Services',
      basePrice: 1800,
      markupType: 'percentage',
      markup: 25,
      finalPrice: 2250,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Premium Materials',
      description: 'High-quality construction and building materials',
      category: 'Materials',
      basePrice: 500,
      markupType: 'percentage',
      markup: 40,
      finalPrice: 700,
      units: 'Set',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Project Management',
      description: 'Full-service project planning and execution',
      category: 'Consulting',
      basePrice: 180,
      markupType: 'percentage',
      markup: 30,
      finalPrice: 234,
      units: 'Hour',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Mobile App Development',
      description: 'Custom mobile application development',
      category: 'Services',
      basePrice: 15000,
      markupType: 'percentage',
      markup: 20,
      finalPrice: 18000,
      units: 'Each',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'SEO Services',
      description: 'Search engine optimization and content strategy',
      category: 'Services',
      basePrice: 800,
      markupType: 'percentage',
      markup: 25,
      finalPrice: 1000,
      units: 'Month',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Video Production',
      description: 'Professional video filming and editing',
      category: 'Services',
      basePrice: 2000,
      markupType: 'fixed',
      markup: 800,
      finalPrice: 2800,
      units: 'Day',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Database Administration',
      description: 'Database setup, maintenance, and optimization',
      category: 'Services',
      basePrice: 175,
      markupType: 'percentage',
      markup: 30,
      finalPrice: 228,
      units: 'Hour',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Graphic Design',
      description: 'Custom graphic design and branding work',
      category: 'Services',
      basePrice: 125,
      markupType: 'percentage',
      markup: 35,
      finalPrice: 169,
      units: 'Hour',
      createdAt: new Date().toISOString(),
    },
    {
      id: crypto.randomUUID(),
      name: 'Server Hosting',
      description: 'Dedicated server hosting and management',
      category: 'Services',
      basePrice: 250,
      markupType: 'percentage',
      markup: 20,
      finalPrice: 300,
      units: 'Month',
      createdAt: new Date().toISOString(),
    },
  ];

  const newItems = [...existingItems, ...sampleItems];
  saveItems(newItems);

  // Generate diverse sample quotes (20-25)
  const sampleQuotes: Quote[] = [];
  const now = Date.now();
  const customersToUse = newCustomers;
  const itemsToUse = newItems;

  // Fresh quotes (1-7 days old, status: sent) - 3 quotes
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 7) + 1;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice(i * 2, i * 2 + 3);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 5) + 1,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 5) + 1),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Website Redesign Project', 'Mobile App Development', 'Cloud Migration Strategy'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Warm quotes (8-14 days old, status: sent) - 4 quotes
  for (let i = 0; i < 4; i++) {
    const customer = customersToUse[(i + 3) % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 7) + 8;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice((i + 3) * 2, (i + 3) * 2 + 2);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 4) + 1,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 4) + 1),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['SEO Optimization Package', 'Content Marketing Campaign', 'Brand Strategy Development', 'Market Research Analysis'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Aging quotes (15-30 days old, status: sent) - 4 quotes
  for (let i = 0; i < 4; i++) {
    const customer = customersToUse[(i + 7) % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 16) + 15;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice((i + 7) * 2, (i + 7) * 2 + 3);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 3) + 1),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Database Upgrade Service', 'Security Audit Comprehensive', 'Performance Optimization', 'Infrastructure Assessment'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Stale quotes (>30 days old, status: sent) - 3 quotes
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[(i + 11) % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 30) + 31;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice((i + 11) * 2, (i + 11) * 2 + 2);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 2) + 1,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 2) + 1),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Legacy System Maintenance', 'Data Migration Project', 'Network Upgrade'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Draft quotes - 4 quotes
  for (let i = 0; i < 4; i++) {
    const customer = customersToUse[(i + 14) % customersToUse.length];
    const createdDate = new Date(now - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice(i * 3, i * 3 + 2);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 3) + 1,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 3) + 1),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Training Program Development', 'Documentation Services', 'Technical Support Plan', 'Consulting Retainer'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'draft',
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
    });
  }

  // Accepted quotes - 3 quotes
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[(i + 18) % customersToUse.length];
    const sentDate = new Date(now - Math.floor(Math.random() * 20 + 5) * 24 * 60 * 60 * 1000);
    const randomItems = itemsToUse.slice((i + 14) * 2, (i + 14) * 2 + 4);
    const quoteItems = randomItems.map((item) => ({
      itemId: item.id,
      name: item.name,
      description: item.description,
      quantity: Math.floor(Math.random() * 5) + 2,
      price: item.finalPrice,
      total: item.finalPrice * (Math.floor(Math.random() * 5) + 2),
    }));
    const subtotal = quoteItems.reduce((sum, item) => sum + item.total, 0);

    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Infrastructure Setup Complete', 'API Development Project', 'E-commerce Platform'][i]}`,
      items: quoteItems,
      subtotal,
      tax: 0,
      total: subtotal,
      status: 'accepted',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Declined quote - 1 quote
  const declinedCustomer = customersToUse[0];
  const declinedSentDate = new Date(now - 25 * 24 * 60 * 60 * 1000);
  const declinedItems = itemsToUse.slice(0, 3);
  const declinedQuoteItems = declinedItems.map((item) => ({
    itemId: item.id,
    name: item.name,
    description: item.description,
    quantity: 10,
    price: item.finalPrice,
    total: item.finalPrice * 10,
  }));
  const declinedSubtotal = declinedQuoteItems.reduce((sum, item) => sum + item.total, 0);

  sampleQuotes.push({
    id: crypto.randomUUID(),
    quoteNumber: generateQuoteNumber(),
    customerId: declinedCustomer.id,
    customerName: declinedCustomer.name,
    title: 'Enterprise Solution Package',
    items: declinedQuoteItems,
    subtotal: declinedSubtotal,
    tax: 0,
    total: declinedSubtotal,
    status: 'declined',
    sentDate: declinedSentDate.toISOString(),
    createdAt: declinedSentDate.toISOString(),
    updatedAt: declinedSentDate.toISOString(),
  });

  // Save all sample quotes
  saveQuotes([...existingQuotes, ...sampleQuotes]);

  // Save company settings if requested
  let companySettingsAdded = false;
  if (includeCompanySettings) {
    await saveSettings(userId, sampleCompanySettings, () => {});
    companySettingsAdded = true;
  }

  return {
    customersAdded: sampleCustomers.length,
    itemsAdded: sampleItems.length,
    quotesAdded: sampleQuotes.length,
    companySettingsAdded,
  };
};
