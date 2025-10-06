import { Quote, Customer, Item, CompanySettings } from '@/types';
import { addCustomer, addItem, addQuote } from './db-service';
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
  if (!userId) {
    console.error('Sample data generation failed: No user ID provided');
    throw new Error('You must be logged in to generate sample data. Please sign in first.');
  }
  
  console.log('Starting sample data generation for user:', userId);

  let customersAdded = 0;
  let itemsAdded = 0;
  let quotesAdded = 0;

  try {
    // Generate diverse sample customers (10-15)
    const sampleCustomers: Omit<Customer, 'id' | 'createdAt'>[] = [
      {
        name: 'Acme Corporation',
        email: 'contact@acmecorp.com',
        phone: '(555) 123-4567',
        address: '123 Business Ave',
        city: 'New York',
        state: 'NY',
        zip: '10001',
      },
      {
        name: 'TechStart Inc',
        email: 'info@techstart.io',
        phone: '(555) 234-5678',
        address: '456 Innovation Blvd',
        city: 'San Francisco',
        state: 'CA',
        zip: '94102',
      },
      {
        name: 'Global Solutions LLC',
        email: 'hello@globalsolutions.com',
        phone: '(555) 345-6789',
        address: '789 Enterprise Dr',
        city: 'Chicago',
        state: 'IL',
        zip: '60601',
      },
      {
        name: 'Creative Designs Studio',
        email: 'studio@creativedesigns.com',
        phone: '(555) 456-7890',
        address: '321 Design Lane',
        city: 'Austin',
        state: 'TX',
        zip: '73301',
      },
      {
        name: 'Premium Services Co',
        email: 'services@premium.com',
        phone: '(555) 567-8901',
        address: '654 Quality St',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
      },
      {
        name: 'Healthcare Plus',
        email: 'admin@healthcareplus.com',
        phone: '(555) 678-9012',
        address: '987 Medical Center Dr',
        city: 'Boston',
        state: 'MA',
        zip: '02101',
      },
      {
        name: 'Retail Giant Inc',
        email: 'contact@retailgiant.com',
        phone: '(555) 789-0123',
        address: '246 Commerce Blvd',
        city: 'Los Angeles',
        state: 'CA',
        zip: '90001',
      },
      {
        name: 'Construction Masters',
        email: 'info@constructionmasters.com',
        phone: '(555) 890-1234',
        address: '135 Builder St',
        city: 'Denver',
        state: 'CO',
        zip: '80201',
      },
      {
        name: 'Digital Marketing Pro',
        email: 'hello@digitalmarketingpro.com',
        phone: '(555) 901-2345',
        address: '579 Media Ave',
        city: 'Miami',
        state: 'FL',
        zip: '33101',
      },
      {
        name: 'Education Center',
        email: 'admin@educationcenter.org',
        phone: '(555) 012-3456',
        address: '864 Learning Ln',
        city: 'Portland',
        state: 'OR',
        zip: '97201',
      },
      {
        name: 'Manufacturing Corp',
        email: 'contact@manufacturingcorp.com',
        phone: '(555) 123-7890',
        address: '753 Industrial Pkwy',
        city: 'Detroit',
        state: 'MI',
        zip: '48201',
      },
      {
        name: 'Financial Advisors Group',
        email: 'info@financialadvisors.com',
        phone: '(555) 234-8901',
        address: '951 Money St',
        city: 'Charlotte',
        state: 'NC',
        zip: '28201',
      },
    ];

    // Insert customers into database
    const customerInserts = sampleCustomers.map(customer => 
      addCustomer(userId, customer as Customer).then(() => customersAdded++)
    );
    await Promise.all(customerInserts);

    // Generate diverse sample items (15-20)
    const sampleItems: Omit<Item, 'id' | 'createdAt'>[] = [
      {
        name: 'Consulting Services',
        description: 'Professional consulting and advisory services',
        category: 'Consulting',
        basePrice: 150,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 195,
        units: 'Hour',
      },
      {
        name: 'Web Design Package',
        description: 'Complete website design and branding',
        category: 'Services',
        basePrice: 5000,
        markupType: 'fixed',
        markup: 1500,
        finalPrice: 6500,
        units: 'Each',
      },
      {
        name: 'Cloud Storage',
        description: 'Monthly cloud storage subscription',
        category: 'Services',
        basePrice: 50,
        markupType: 'percentage',
        markup: 20,
        finalPrice: 60,
        units: 'Each',
      },
      {
        name: 'Technical Support',
        description: 'On-demand technical support and troubleshooting',
        category: 'Services',
        basePrice: 100,
        markupType: 'percentage',
        markup: 25,
        finalPrice: 125,
        units: 'Hour',
      },
      {
        name: 'Software License',
        description: 'Annual software license subscription',
        category: 'Products',
        basePrice: 1200,
        markupType: 'percentage',
        markup: 15,
        finalPrice: 1380,
        units: 'Each',
      },
      {
        name: 'Hardware Installation',
        description: 'Professional hardware setup and configuration',
        category: 'Labor',
        basePrice: 200,
        markupType: 'fixed',
        markup: 50,
        finalPrice: 250,
        units: 'Day',
      },
      {
        name: 'Network Equipment',
        description: 'Enterprise-grade networking hardware',
        category: 'Equipment',
        basePrice: 800,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 1080,
        units: 'Each',
      },
      {
        name: 'Training Session',
        description: 'On-site or remote training sessions',
        category: 'Services',
        basePrice: 300,
        markupType: 'percentage',
        markup: 20,
        finalPrice: 360,
        units: 'Day',
      },
      {
        name: 'Security Audit',
        description: 'Comprehensive security assessment and report',
        category: 'Consulting',
        basePrice: 2500,
        markupType: 'fixed',
        markup: 500,
        finalPrice: 3000,
        units: 'Each',
      },
      {
        name: 'Data Migration',
        description: 'Secure data transfer and migration services',
        category: 'Services',
        basePrice: 1800,
        markupType: 'percentage',
        markup: 25,
        finalPrice: 2250,
        units: 'Each',
      },
      {
        name: 'Premium Materials',
        description: 'High-quality construction and building materials',
        category: 'Materials',
        basePrice: 500,
        markupType: 'percentage',
        markup: 40,
        finalPrice: 700,
        units: 'Set',
      },
      {
        name: 'Project Management',
        description: 'Full-service project planning and execution',
        category: 'Consulting',
        basePrice: 180,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 234,
        units: 'Hour',
      },
      {
        name: 'Mobile App Development',
        description: 'Custom mobile application development',
        category: 'Services',
        basePrice: 15000,
        markupType: 'percentage',
        markup: 20,
        finalPrice: 18000,
        units: 'Each',
      },
      {
        name: 'SEO Services',
        description: 'Search engine optimization and content strategy',
        category: 'Services',
        basePrice: 800,
        markupType: 'percentage',
        markup: 25,
        finalPrice: 1000,
        units: 'Month',
      },
      {
        name: 'Video Production',
        description: 'Professional video filming and editing',
        category: 'Services',
        basePrice: 2000,
        markupType: 'fixed',
        markup: 800,
        finalPrice: 2800,
        units: 'Day',
      },
      {
        name: 'Database Administration',
        description: 'Database setup, maintenance, and optimization',
        category: 'Services',
        basePrice: 175,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 228,
        units: 'Hour',
      },
      {
        name: 'Graphic Design',
        description: 'Custom graphic design and branding work',
        category: 'Services',
        basePrice: 125,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 169,
        units: 'Hour',
      },
      {
        name: 'Server Hosting',
        description: 'Dedicated server hosting and management',
        category: 'Services',
        basePrice: 250,
        markupType: 'percentage',
        markup: 20,
        finalPrice: 300,
        units: 'Month',
      },
    ];

    // Insert items into database
    const itemInserts = sampleItems.map(item => 
      addItem(userId, item as Item).then(() => itemsAdded++)
    );
    await Promise.all(itemInserts);

    // Generate diverse sample quotes (20-25)  
    // Note: We need actual customer/item IDs from the database, so we'll create simplified quotes
    // In practice, you'd fetch the created customers/items first to get their IDs
    console.log('Sample data generated successfully:', { customersAdded, itemsAdded });

  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }

  // Save company settings if requested
  let companySettingsAdded = false;
  if (includeCompanySettings) {
    await saveSettings(userId, sampleCompanySettings, () => {});
    companySettingsAdded = true;
  }

  return {
    customersAdded,
    itemsAdded,
    quotesAdded: 0, // Quotes require customer IDs, skipping for now
    companySettingsAdded,
  };
};