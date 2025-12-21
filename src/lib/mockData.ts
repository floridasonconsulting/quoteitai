import { Quote, Customer, Item } from '@/types';

// ============================================================================
// MOCK CUSTOMERS (Multi-Industry)
// ============================================================================

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'cust-hvac-1',
        userId: 'demo-user',
        name: 'Apex Property Management',
        email: 'facilities@apexpm.com',
        phone: '(555) 123-0001',
        address: '888 Skyline Way',
        city: 'Denver',
        state: 'CO',
        zip: '80202',
        createdAt: new Date('2025-09-15').toISOString(),
    },
    {
        id: 'cust-solar-1',
        userId: 'demo-user',
        name: 'Eco-Living Communities',
        email: 'projects@ecoliving.org',
        phone: '(555) 123-0002',
        address: '42 Sunstone Drive',
        city: 'Phoenix',
        state: 'AZ',
        zip: '85001',
        createdAt: new Date('2025-09-20').toISOString(),
    },
    {
        id: 'cust-land-1',
        userId: 'demo-user',
        name: 'Heritage Estate Gardens',
        email: 'concierge@heritageestates.com',
        phone: '(555) 123-0003',
        address: '101 Rolling Oaks',
        city: 'Austin',
        state: 'TX',
        zip: '78701',
        createdAt: new Date('2025-09-25').toISOString(),
    },
    {
        id: 'cust-elec-1',
        userId: 'demo-user',
        name: 'Metro EV Solutions',
        email: 'fleet@metroev.com',
        phone: '(555) 123-0004',
        address: '500 Tech Plaza',
        city: 'Seattle',
        state: 'WA',
        zip: '98101',
        createdAt: new Date('2025-10-01').toISOString(),
    },
    {
        id: 'cust-gen-1',
        userId: 'demo-user',
        name: 'The Harrison Residence',
        email: 'm.harrison@email.com',
        phone: '(555) 123-0005',
        address: '742 Generic Lane',
        city: 'San Francisco',
        state: 'CA',
        zip: '94103',
        createdAt: new Date('2025-10-05').toISOString(),
    }
];

// ============================================================================
// MOCK ITEMS (Professional Service Items)
// ============================================================================

export const MOCK_ITEMS: Item[] = [
    // HVAC / Energy
    {
        id: 'item-hvac-1',
        name: 'High-Efficiency SEER2 Condenser',
        description: 'Multi-stage cooling unit with optional smart integration.',
        category: 'Equipment',
        basePrice: 4200.00,
        markupType: 'percentage',
        markup: 40,
        finalPrice: 5880.00,
        units: 'unit',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'item-hvac-2',
        name: 'Professional Installation Labor',
        description: 'Certified installer site preparation and system integration.',
        category: 'Labor',
        basePrice: 1200.00,
        markupType: 'fixed',
        markup: 800.00,
        finalPrice: 2000.00,
        units: 'job',
        createdAt: new Date().toISOString(),
    },
    // Solar
    {
        id: 'item-solar-1',
        name: 'Monocrystalline Solar Panel (400W)',
        description: 'High-yield residential/commercial panel with 25-year warranty.',
        category: 'Equipment',
        basePrice: 280.00,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 378.00,
        units: 'panel',
        createdAt: new Date().toISOString(),
    },
    // Electrical
    {
        id: 'item-elec-1',
        name: 'Level 2 EV Charging Station',
        description: 'Universal smart charger with WiFi connectivity.',
        category: 'Equipment',
        basePrice: 850.00,
        markupType: 'fixed',
        markup: 350.00,
        finalPrice: 1200.00,
        units: 'unit',
        createdAt: new Date().toISOString(),
    },
    // Landscaping/General
    {
        id: 'item-land-1',
        name: 'Natural Stone Hardscaping',
        description: 'Premium flagstone or pavers with reinforced concrete base.',
        category: 'Materials',
        basePrice: 15.00,
        markupType: 'percentage',
        markup: 100,
        finalPrice: 30.00,
        units: 'sq ft',
        createdAt: new Date().toISOString(),
    }
];

// ============================================================================
// MOCK QUOTES (3-Month Historical Generation)
// ============================================================================

const generateMockQuotes = (): Quote[] => {
    const quotes: Quote[] = [];
    const statuses: Quote['status'][] = ['accepted', 'sent', 'draft', 'declined'];
    const customers = MOCK_CUSTOMERS;

    // Oct 2025 Generation (15 quotes)
    for (let i = 1; i <= 15; i++) {
        const cust = customers[i % customers.length];
        const status = i < 12 ? 'accepted' : statuses[i % 4];
        const date = new Date(2025, 9, i); // Oct 1-15

        quotes.push({
            id: `q-oct-${i}`,
            userId: 'demo-user',
            quoteNumber: `Q-25-10-${i.toString().padStart(3, '0')}`,
            customerId: cust.id,
            customerName: cust.name,
            title: `${cust.name} - System Optimization`,
            status,
            items: [
                {
                    itemId: MOCK_ITEMS[0].id,
                    name: MOCK_ITEMS[0].name,
                    description: MOCK_ITEMS[0].description,
                    category: MOCK_ITEMS[0].category,
                    quantity: 1,
                    price: MOCK_ITEMS[0].finalPrice,
                    total: MOCK_ITEMS[0].finalPrice,
                }
            ],
            subtotal: MOCK_ITEMS[0].finalPrice,
            tax: MOCK_ITEMS[0].finalPrice * 0.07,
            total: MOCK_ITEMS[0].finalPrice * 1.07,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            showPricing: true,
            executiveSummary: "Strategic efficiency overhaul focused on long-term operational savings and system reliability."
        });
    }

    // Nov 2025 Generation (12 quotes)
    for (let i = 1; i <= 12; i++) {
        const cust = customers[(i + 2) % customers.length];
        const status = i < 8 ? 'accepted' : statuses[i % 4];
        const date = new Date(2025, 10, i); // Nov 1-12

        quotes.push({
            id: `q-nov-${i}`,
            userId: 'demo-user',
            quoteNumber: `Q-25-11-${i.toString().padStart(3, '0')}`,
            customerId: cust.id,
            customerName: cust.name,
            title: `${cust.name} - Infrastructure Upgrade`,
            status,
            items: [
                {
                    itemId: MOCK_ITEMS[2].id,
                    name: MOCK_ITEMS[2].name,
                    description: MOCK_ITEMS[2].description,
                    category: MOCK_ITEMS[2].category,
                    quantity: 20,
                    price: MOCK_ITEMS[2].finalPrice,
                    total: MOCK_ITEMS[2].finalPrice * 20,
                }
            ],
            subtotal: MOCK_ITEMS[2].finalPrice * 20,
            tax: (MOCK_ITEMS[2].finalPrice * 20) * 0.07,
            total: (MOCK_ITEMS[2].finalPrice * 20) * 1.07,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            showPricing: true,
            executiveSummary: "Comprehensive infrastructure modernization project designed to meet increased capacity demands."
        });
    }

    // Dec 2025 Generation (Current - 10 quotes)
    for (let i = 1; i <= 10; i++) {
        const cust = customers[(i + 4) % customers.length];
        const status = i < 5 ? 'sent' : 'draft';
        const date = new Date(2025, 11, i); // Dec 1-10

        quotes.push({
            id: `q-dec-${i}`,
            userId: 'demo-user',
            quoteNumber: `Q-25-12-${i.toString().padStart(3, '0')}`,
            customerId: cust.id,
            customerName: cust.name,
            title: `${cust.name} - Year-End Project Baseline`,
            status,
            items: [
                {
                    itemId: MOCK_ITEMS[4].id,
                    name: MOCK_ITEMS[4].name,
                    description: MOCK_ITEMS[4].description,
                    category: MOCK_ITEMS[4].category,
                    quantity: 500,
                    price: MOCK_ITEMS[4].finalPrice,
                    total: MOCK_ITEMS[4].finalPrice * 500,
                }
            ],
            subtotal: MOCK_ITEMS[4].finalPrice * 500,
            tax: (MOCK_ITEMS[4].finalPrice * 500) * 0.07,
            total: (MOCK_ITEMS[4].finalPrice * 500) * 1.07,
            createdAt: date.toISOString(),
            updatedAt: date.toISOString(),
            showPricing: true,
            executiveSummary: "Strategic material procurement and site preparation for Q1 execution. Focuses on premium stone finishes."
        });
    }

    return quotes;
};

export const MOCK_QUOTES = generateMockQuotes();

export const MOCK_SOW_TEMPLATE = `Title: Strategic Scope of Work: [Project Name]
Document ID: SOW-2025-[ID]
Prepared by: Quote-it AI Intelligence Engine

1. Project Executive Summary
Comprehensive professional service delivery for [Project Name], focusing on high-efficiency output, operational excellence, and premium quality assurance. This project aims to achieve defined business objectives through rigorous implementation standards.

2. Work Breakdown Structure (WBS)
Phase 1: Mobilization & Strategy (Days 1-5)
• Strategic alignment and site resource allocation.
• Deployment of core infrastructure and safety protocols.

Phase 2: Execution Phase (Days 6-20)
• Multi-layered implementation of project components.
• Integrated quality control and milestone verification.

Phase 3: Integration & Handover (Days 21-25)
• System calibration and verification testing.
• Final documentation delivery and project close-out.

3. Key Deliverables
Deliverable A: Fully operational [System/Service] meeting all performance benchmarks.
Deliverable B: Technical documentation and operational maintenance roadmap.
Deliverable C: Post-implementation review and performance reporting.

4. Performance Criteria
• All work must adhere to national standards and local regulatory requirements.
• Verified performance metrics must meet or exceed baseline projections.
• Site integrity must be maintained throughout the engagement.`;
