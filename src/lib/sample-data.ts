import { Quote, Customer } from '@/types';
import { getCustomers, getQuotes, saveQuotes, saveCustomers } from './storage';
import { generateQuoteNumber } from './quote-utils';

export const generateSampleData = () => {
  const existingCustomers = getCustomers();
  const existingQuotes = getQuotes();

  // Generate sample customers if none exist
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
  ];

  // Only add customers if we have fewer than 3
  const customersToUse = existingCustomers.length < 3 
    ? [...existingCustomers, ...sampleCustomers] 
    : existingCustomers;
  
  if (existingCustomers.length < 3) {
    saveCustomers(customersToUse);
  }

  // Generate sample quotes
  const sampleQuotes: Quote[] = [];
  const now = Date.now();

  // Fresh quotes (1-7 days old, status: sent)
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 7) + 1;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Website Redesign', 'Mobile App Development', 'Cloud Migration'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['Design Services', 'Development Work', 'Consulting'][i]}`,
          description: 'Professional services as discussed',
          quantity: 1,
          price: 5000 + Math.random() * 10000,
          total: 5000 + Math.random() * 10000,
        },
      ],
      subtotal: 5000 + Math.random() * 10000,
      tax: 0,
      total: 5000 + Math.random() * 10000,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Warm quotes (8-14 days old, status: sent)
  for (let i = 0; i < 4; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 7) + 8;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['SEO Optimization', 'Content Marketing', 'Brand Strategy', 'Market Research'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['SEO Package', 'Content Creation', 'Strategy Development', 'Research Services'][i]}`,
          description: 'Comprehensive service package',
          quantity: 1,
          price: 3000 + Math.random() * 8000,
          total: 3000 + Math.random() * 8000,
        },
      ],
      subtotal: 3000 + Math.random() * 8000,
      tax: 0,
      total: 3000 + Math.random() * 8000,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Aging quotes (15-30 days old, status: sent)
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 16) + 15;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Database Upgrade', 'Security Audit', 'Performance Optimization'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['Upgrade Services', 'Security Review', 'Performance Tuning'][i]}`,
          description: 'Technical services',
          quantity: 1,
          price: 4000 + Math.random() * 6000,
          total: 4000 + Math.random() * 6000,
        },
      ],
      subtotal: 4000 + Math.random() * 6000,
      tax: 0,
      total: 4000 + Math.random() * 6000,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Stale quotes (>30 days old, status: sent)
  for (let i = 0; i < 2; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const daysOld = Math.floor(Math.random() * 30) + 31;
    const sentDate = new Date(now - daysOld * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Legacy System Maintenance', 'Data Migration'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['Maintenance Package', 'Migration Services'][i]}`,
          description: 'Extended support services',
          quantity: 1,
          price: 6000 + Math.random() * 4000,
          total: 6000 + Math.random() * 4000,
        },
      ],
      subtotal: 6000 + Math.random() * 4000,
      tax: 0,
      total: 6000 + Math.random() * 4000,
      status: 'sent',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Draft quotes
  for (let i = 0; i < 3; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const createdDate = new Date(now - Math.floor(Math.random() * 10) * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Training Program', 'Documentation Services', 'Technical Support'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['Training Package', 'Documentation', 'Support Plan'][i]}`,
          description: 'To be finalized',
          quantity: 1,
          price: 2500 + Math.random() * 5000,
          total: 2500 + Math.random() * 5000,
        },
      ],
      subtotal: 2500 + Math.random() * 5000,
      tax: 0,
      total: 2500 + Math.random() * 5000,
      status: 'draft',
      createdAt: createdDate.toISOString(),
      updatedAt: createdDate.toISOString(),
    });
  }

  // Accepted quotes
  for (let i = 0; i < 2; i++) {
    const customer = customersToUse[i % customersToUse.length];
    const sentDate = new Date(now - Math.floor(Math.random() * 20 + 5) * 24 * 60 * 60 * 1000);
    
    sampleQuotes.push({
      id: crypto.randomUUID(),
      quoteNumber: generateQuoteNumber(),
      customerId: customer.id,
      customerName: customer.name,
      title: `${['Infrastructure Setup', 'API Development'][i]}`,
      items: [
        {
          itemId: crypto.randomUUID(),
          name: `${['Setup Services', 'API Development'][i]}`,
          description: 'Completed project',
          quantity: 1,
          price: 8000 + Math.random() * 7000,
          total: 8000 + Math.random() * 7000,
        },
      ],
      subtotal: 8000 + Math.random() * 7000,
      tax: 0,
      total: 8000 + Math.random() * 7000,
      status: 'accepted',
      sentDate: sentDate.toISOString(),
      createdAt: sentDate.toISOString(),
      updatedAt: sentDate.toISOString(),
    });
  }

  // Declined quote
  const declinedCustomer = customersToUse[0];
  const declinedSentDate = new Date(now - 25 * 24 * 60 * 60 * 1000);
  sampleQuotes.push({
    id: crypto.randomUUID(),
    quoteNumber: generateQuoteNumber(),
    customerId: declinedCustomer.id,
    customerName: declinedCustomer.name,
    title: 'Enterprise Solution',
    items: [
      {
        itemId: crypto.randomUUID(),
        name: 'Enterprise Package',
        description: 'Custom enterprise solution',
        quantity: 1,
        price: 25000,
        total: 25000,
      },
    ],
    subtotal: 25000,
    tax: 0,
    total: 25000,
    status: 'declined',
    sentDate: declinedSentDate.toISOString(),
    createdAt: declinedSentDate.toISOString(),
    updatedAt: declinedSentDate.toISOString(),
  });

  // Save all sample quotes
  saveQuotes([...existingQuotes, ...sampleQuotes]);

  return {
    customersAdded: existingCustomers.length < 3 ? sampleCustomers.length : 0,
    quotesAdded: sampleQuotes.length,
  };
};
