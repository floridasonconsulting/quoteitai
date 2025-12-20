import { Quote, Customer, Item, CompanySettings, QuoteItem } from '@/types';
import { addCustomer, addItem, addQuote, getCustomers, getItems, saveSettings } from './db-service';
import { generateQuoteNumber } from './quote-utils';

// Helper to calculate date X days ago
const daysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

const sampleCompanySettings: CompanySettings = {
  name: 'ProField Services',
  address: '456 Trade Street',
  city: 'Denver',
  state: 'CO',
  zip: '80201',
  phone: '(555) 987-6543',
  email: 'info@profield.com',
  website: 'https://www.profield.com',
  license: 'LIC-987654',
  insurance: 'GL-123456 / WC-789012',
  logoDisplayOption: 'both',
  terms: 'Payment due upon completion. We accept cash, check, credit cards, and mobile payments. All work guaranteed for 90 days. Thank you for choosing us!',
  proposalTemplate: 'classic',
};

export const generateSampleData = async (
  userId: string | undefined,
  includeCompanySettings: boolean = false
) => {
  if (!userId) {
    console.error('Sample data generation failed: No user ID provided');
    throw new Error('You must be logged in to generate sample data. Please sign in first.');
  }

  console.log('🚨 GENERATE SAMPLE DATA TRIGGERED 🚨');
  console.log('User ID:', userId);
  console.trace('Sample Data Generation Trace');

  let customersAddedToDb = 0;
  let customersFailedToDb = 0;
  let itemsAddedToDb = 0;
  let itemsFailedToDb = 0;
  let quotesAdded = 0;

  try {
    // Generate field worker customers
    const sampleCustomers: Omit<Customer, 'id' | 'createdAt'>[] = [
      {
        userId,
        name: 'The Johnson Family',
        email: 'sarah.johnson@email.com',
        phone: '(555) 123-4567',
        address: '1234 Oak Street',
        city: 'Denver',
        state: 'CO',
        zip: '80202',
      },
      {
        userId,
        name: 'Martinez Property Management',
        email: 'david@martinezpm.com',
        phone: '(555) 234-5678',
        address: '5678 Pine Avenue',
        city: 'Aurora',
        state: 'CO',
        zip: '80012',
      },
      {
        userId,
        name: 'Highland Realty Group',
        email: 'info@highlandrealty.com',
        phone: '(555) 345-6789',
        address: '9012 Mountain View Blvd',
        city: 'Lakewood',
        state: 'CO',
        zip: '80226',
      },
      {
        userId,
        name: 'The Chen Residence',
        email: 'mchen@email.com',
        phone: '(555) 456-7890',
        address: '3456 Maple Drive',
        city: 'Boulder',
        state: 'CO',
        zip: '80301',
      },
      {
        userId,
        name: 'Westside Apartments LLC',
        email: 'management@westsideapts.com',
        phone: '(555) 567-8901',
        address: '7890 Westside Parkway',
        city: 'Denver',
        state: 'CO',
        zip: '80204',
      },
      {
        userId,
        name: 'Thompson Home Renovations',
        email: 'john@thompsonreno.com',
        phone: '(555) 678-9012',
        address: '2345 Cedar Lane',
        city: 'Littleton',
        state: 'CO',
        zip: '80120',
      },
      {
        userId,
        name: 'Garcia Family Home',
        email: 'garcia.family@email.com',
        phone: '(555) 789-0123',
        address: '6789 Elm Street',
        city: 'Arvada',
        state: 'CO',
        zip: '80002',
      },
      {
        userId,
        name: 'Summit Commercial Properties',
        email: 'contact@summitcommercial.com',
        phone: '(555) 890-1234',
        address: '1357 Business Park Drive',
        city: 'Denver',
        state: 'CO',
        zip: '80203',
      },
      {
        userId,
        name: 'The Anderson Estate',
        email: 'anderson.estate@email.com',
        phone: '(555) 901-2345',
        address: '9753 Heritage Hills',
        city: 'Greenwood Village',
        state: 'CO',
        zip: '80111',
      },
      {
        userId,
        name: 'Downtown Retail Center',
        email: 'facilities@dtretail.com',
        phone: '(555) 012-3456',
        address: '4682 Market Street',
        city: 'Denver',
        state: 'CO',
        zip: '80202',
      },
      {
        userId,
        name: 'Riverside Townhomes HOA',
        email: 'hoa@riversidetownhomes.com',
        phone: '(555) 123-7890',
        address: '8520 Riverside Drive',
        city: 'Thornton',
        state: 'CO',
        zip: '80229',
      },
      {
        userId,
        name: 'Miller Small Business',
        email: 'owner@millersb.com',
        phone: '(555) 234-8901',
        address: '3698 Commerce Way',
        city: 'Westminster',
        state: 'CO',
        zip: '80030',
      },
    ];

    // Insert customers into database
    const customerInserts = sampleCustomers.map(async (customer) => {
      try {
        await addCustomer(userId, null, customer as Customer);
        customersAddedToDb++;
      } catch (error) {
        customersFailedToDb++;
      }
    });
    await Promise.all(customerInserts);

    // Generate field worker service items
    const sampleItems: Omit<Item, 'id' | 'createdAt'>[] = [
      {
        userId,
        name: 'Drain Cleaning',
        description: 'Professional drain cleaning and unclogging',
        category: 'Plumbing',
        basePrice: 120,
        markupType: 'percentage',
        markup: 25,
        finalPrice: 150,
        units: 'Service Call',
      },
      {
        userId,
        name: 'Pipe Repair',
        description: 'Repair leaking or damaged pipes',
        category: 'Plumbing',
        basePrice: 200,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 260,
        units: 'Hour',
      },
      {
        userId,
        name: 'Fixture Installation',
        description: 'Install sinks, faucets, toilets, or showers',
        category: 'Plumbing',
        basePrice: 150,
        markupType: 'fixed',
        markup: 50,
        finalPrice: 200,
        units: 'Each',
      },
      {
        userId,
        name: 'Water Heater Service',
        description: 'Water heater repair, maintenance, or replacement',
        category: 'Plumbing',
        basePrice: 300,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 405,
        units: 'Service Call',
      },
      {
        userId,
        name: 'Outlet Installation',
        description: 'Install new electrical outlets or replace existing',
        category: 'Electrical',
        basePrice: 100,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 130,
        units: 'Each',
      },
      {
        userId,
        name: 'Panel Upgrade',
        description: 'Upgrade electrical panel for increased capacity',
        category: 'Electrical',
        basePrice: 800,
        markupType: 'fixed',
        markup: 400,
        finalPrice: 1200,
        units: 'Project',
      },
      {
        userId,
        name: 'Lighting Installation',
        description: 'Install interior or exterior lighting fixtures',
        category: 'Electrical',
        basePrice: 120,
        markupType: 'percentage',
        markup: 25,
        finalPrice: 150,
        units: 'Hour',
      },
      {
        userId,
        name: 'Circuit Breaker Repair',
        description: 'Diagnose and repair circuit breaker issues',
        category: 'Electrical',
        basePrice: 150,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 195,
        units: 'Service Call',
      },
      {
        userId,
        name: 'Drywall Repair',
        description: 'Patch and repair drywall holes and damage',
        category: 'Handyman',
        basePrice: 100,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 135,
        units: 'Hour',
      },
      {
        userId,
        name: 'Interior Painting',
        description: 'Professional interior painting services',
        category: 'Handyman',
        basePrice: 45,
        markupType: 'percentage',
        markup: 40,
        finalPrice: 63,
        units: 'Hour',
      },
      {
        userId,
        name: 'Carpentry Services',
        description: 'Custom carpentry and trim work',
        category: 'Handyman',
        basePrice: 60,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 81,
        units: 'Hour',
      },
      {
        userId,
        name: 'Door/Window Installation',
        description: 'Install or replace doors and windows',
        category: 'Handyman',
        basePrice: 200,
        markupType: 'fixed',
        markup: 100,
        finalPrice: 300,
        units: 'Each',
      },
      {
        userId,
        name: 'Deck Repair',
        description: 'Repair and maintain wooden decks',
        category: 'Handyman',
        basePrice: 75,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 98,
        units: 'Hour',
      },
      {
        userId,
        name: 'Laminate Flooring',
        description: 'Premium laminate flooring materials',
        category: 'Materials',
        basePrice: 3.50,
        markupType: 'percentage',
        markup: 45,
        finalPrice: 5.08,
        units: 'Sq Ft',
      },
      {
        userId,
        name: 'Kitchen Countertops',
        description: 'Granite or quartz countertop materials',
        category: 'Materials',
        basePrice: 60,
        markupType: 'percentage',
        markup: 50,
        finalPrice: 90,
        units: 'Sq Ft',
      },
      {
        userId,
        name: 'Cabinet Refacing Kit',
        description: 'Complete cabinet refacing materials',
        category: 'Materials',
        basePrice: 800,
        markupType: 'fixed',
        markup: 300,
        finalPrice: 1100,
        units: 'Set',
      },
      {
        userId,
        name: 'Light Fixtures',
        description: 'Modern residential light fixtures',
        category: 'Materials',
        basePrice: 80,
        markupType: 'percentage',
        markup: 40,
        finalPrice: 112,
        units: 'Each',
      },
      {
        userId,
        name: 'General Labor',
        description: 'General handyman and helper services',
        category: 'Labor',
        basePrice: 40,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 54,
        units: 'Hour',
      },
      {
        userId,
        name: 'Project Consultation',
        description: 'On-site consultation and estimate',
        category: 'Consulting',
        basePrice: 75,
        markupType: 'percentage',
        markup: 30,
        finalPrice: 98,
        units: 'Hour',
      },
      {
        userId,
        name: 'Emergency Call-Out',
        description: 'After-hours or emergency service call',
        category: 'Services',
        basePrice: 150,
        markupType: 'percentage',
        markup: 50,
        finalPrice: 225,
        units: 'Service Call',
      },
    ];

    // Insert items into database
    const itemInserts = sampleItems.map(async (item) => {
      try {
        await addItem(userId, null, item as Item);
        itemsAddedToDb++;
      } catch (error) {
        itemsFailedToDb++;
      }
    });
    await Promise.all(itemInserts);

    // Fetch inserted customers and items to get their IDs
    const insertedCustomers = await getCustomers(userId);
    const insertedItems = await getItems(userId);

    if (insertedCustomers.length === 0 || insertedItems.length === 0) {
      console.warn('No customers or items found - skipping quote generation');
    } else {
      const quoteResults = {
        fresh: 0,
        warm: 0,
        aging: 0,
        stale: 0,
        draft: 0,
        failed: 0,
      };

      // Helper to create quote items
      const createQuoteItems = (itemNames: string[], quantities: number[]) => {
        return itemNames.map((name, idx) => {
          const item = insertedItems.find(i => i.name === name);
          if (!item) return null;
          const qty = quantities[idx] || 1;
          return {
            itemId: item.id,
            name: item.name,
            description: item.description,
            quantity: qty,
            price: item.finalPrice,
            total: qty * item.finalPrice,
          } as QuoteItem;
        }).filter(Boolean) as QuoteItem[];
      };

      // Fresh quotes
      const freshQuotes = [
        {
          customerName: 'The Johnson Family',
          title: 'Plumbing Emergency Repair',
          items: createQuoteItems(['Drain Cleaning', 'Pipe Repair'], [1, 2]),
          daysAgo: 2,
          status: 'sent' as const,
        },
        {
          customerName: 'Martinez Property Management',
          title: 'Electrical Panel Upgrade',
          items: createQuoteItems(['Panel Upgrade', 'Circuit Breaker Repair'], [1, 1]),
          daysAgo: 4,
          status: 'sent' as const,
        },
      ];

      // Warm quotes
      const warmQuotes = [
        {
          customerName: 'Highland Realty Group',
          title: 'HVAC Service Call',
          items: createQuoteItems(['Emergency Call-Out', 'General Labor'], [1, 2]),
          daysAgo: 9,
          status: 'sent' as const,
        },
      ];

      // Aging quotes
      const agingQuotes = [
        {
          customerName: 'Downtown Retail Center',
          title: 'Fence Repair',
          items: createQuoteItems(['Carpentry Services', 'General Labor'], [8, 4]),
          daysAgo: 18,
          status: 'sent' as const,
        },
      ];

      // Stale quotes
      const staleQuotes = [
        {
          customerName: 'Highland Realty Group',
          title: 'Roof Inspection',
          items: createQuoteItems(['Project Consultation', 'General Labor'], [2, 4]),
          daysAgo: 35,
          status: 'sent' as const,
        },
      ];

      // Draft quotes
      const draftQuotes = [
        {
          customerName: 'The Chen Residence',
          title: 'Bathroom Renovation',
          items: createQuoteItems(['Fixture Installation', 'Drywall Repair', 'Interior Painting', 'Light Fixtures'], [3, 8, 12, 2]),
          daysAgo: null,
          status: 'draft' as const,
        },
      ];

      const allQuoteGroups = [
        { quotes: freshQuotes, category: 'fresh' },
        { quotes: warmQuotes, category: 'warm' },
        { quotes: agingQuotes, category: 'aging' },
        { quotes: staleQuotes, category: 'stale' },
        { quotes: draftQuotes, category: 'draft' },
      ];

      for (const group of allQuoteGroups) {
        for (const quoteData of group.quotes) {
          try {
            const customer = insertedCustomers.find(c => c.name === quoteData.customerName);
            if (!customer || !quoteData.items || quoteData.items.length === 0) {
              quoteResults.failed++;
              continue;
            }

            const subtotal = quoteData.items.reduce((sum, item) => sum + item.total, 0);
            const tax = subtotal * 0.08;
            const total = subtotal + tax;

            const quote: Omit<Quote, 'id' | 'createdAt'> = {
              userId,
              quoteNumber: generateQuoteNumber(),
              customerId: customer.id,
              customerName: customer.name,
              title: quoteData.title,
              items: quoteData.items,
              subtotal,
              tax,
              total,
              status: quoteData.status,
              sentDate: quoteData.daysAgo !== null ? daysAgo(quoteData.daysAgo as number) : undefined,
              followUpDate: undefined,
              notes: '',
              updatedAt: new Date().toISOString(),
            };

            await addQuote(userId, null, quote as Quote);
            (quoteResults as Record<string, number>)[group.category]++;
          } catch (error) {
            console.error(`Failed to create ${group.category} quote:`, error);
            quoteResults.failed++;
          }
        }
      }

      quotesAdded = quoteResults.fresh + quoteResults.warm + quoteResults.aging + quoteResults.stale + quoteResults.draft;
    }

  } catch (error) {
    console.error('Error generating sample data:', error);
    throw error;
  }

  // Save company settings if requested
  let companySettingsAdded = false;
  if (includeCompanySettings) {
    await saveSettings(userId, null, sampleCompanySettings, () => { });
    companySettingsAdded = true;
  }

  return {
    customersAddedToDb,
    customersFailedToDb,
    itemsAddedToDb,
    itemsFailedToDb,
    quotesAdded,
    companySettingsAdded,
  };
};
