import { Quote, Customer, Item } from '@/types';

export const MOCK_CUSTOMERS: Customer[] = [
    {
        id: 'demo-cust-1',
        userId: 'demo-user',
        name: 'Luxury Estates Management',
        email: 'contact@luxuryestates.com',
        phone: '(555) 123-4567',
        address: '123 Ocean Drive',
        city: 'Miami',
        state: 'FL',
        zip: '33139',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo-cust-2',
        userId: 'demo-user',
        name: 'Coastal Resorts & Spas',
        email: 'info@coastalresorts.com',
        phone: '(555) 987-6543',
        address: '456 Beach Blvd',
        city: 'Santa Monica',
        state: 'CA',
        zip: '90401',
        createdAt: new Date().toISOString(),
    }
];

export const MOCK_ITEMS: Item[] = [
    {
        id: 'demo-item-1',
        name: 'Smart Pool Automation System',
        description: 'Complete Hayward OmniLogic automation with salt chlorination and mobile control.',
        enhancedDescription: 'The ultimate pool automation system. Control your heater, lighting, water features, and chemistry from your smartphone. Includes a 3-year warranty and professional installation.',
        category: 'Equipment',
        basePrice: 2850.00,
        markupType: 'percentage',
        markup: 35,
        finalPrice: 3847.50,
        units: 'unit',
        imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
    },
    {
        id: 'demo-item-2',
        name: 'Premium Travertine Paver Installation',
        description: 'Large format Turkish Silver Travertine with sand-set base.',
        enhancedDescription: 'Elegant, cool-to-the-touch natural stone pavers. Our installation includes a 6-inch compacted base and polymeric sand joints for maximum durability and weed prevention.',
        category: 'Hardscape',
        basePrice: 18.00,
        markupType: 'fixed',
        markup: 12.00,
        finalPrice: 30.00,
        units: 'sq ft',
        imageUrl: 'https://images.unsplash.com/photo-1590483736622-39da4378b908?q=80&w=2070&auto=format&fit=crop',
        createdAt: new Date().toISOString(),
    }
];

export const MOCK_QUOTES: Quote[] = [
    {
        id: 'demo-quote-1',
        userId: 'demo-user',
        quoteNumber: 'Q-2024-001',
        customerId: 'demo-cust-1',
        customerName: 'Luxury Estates Management',
        title: 'Modern Backyard Oasis Transformation',
        status: 'accepted',
        items: [
            {
                itemId: 'demo-item-1',
                name: 'Smart Pool Automation System',
                description: 'Complete Hayward OmniLogic automation',
                enhancedDescription: 'The ultimate pool automation system...',
                category: 'Equipment',
                quantity: 1,
                price: 3847.50,
                total: 3847.50,
                imageUrl: 'https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?q=80&w=2070&auto=format&fit=crop'
            },
            {
                itemId: 'demo-item-2',
                name: 'Premium Travertine Paver Installation',
                description: 'Turkish Silver Travertine',
                category: 'Hardscape',
                quantity: 850,
                price: 30.00,
                total: 25500.00,
                imageUrl: 'https://images.unsplash.com/photo-1590483736622-39da4378b908?q=80&w=2070&auto=format&fit=crop'
            }
        ],
        subtotal: 29347.50,
        tax: 2054.33,
        total: 31401.83,
        executiveSummary: 'This proposal outlines a complete backyard renovation, integrating state-of-the-art pool automation with premium hardscape materials to create a world-class outdoor living space.',
        scopeOfWork: '## Project Overview\nComplete backyard renovation for Luxury Estates.\n\n## Deliverables\n- Installed Hayward OmniLogic System\n- 850 Sq Ft Travertine Patio\n\n## Timeline\n3-4 Weeks from permit approval.',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        sentDate: new Date().toISOString(),
        sharedAt: new Date().toISOString(),
        viewedAt: new Date().toISOString(),
        shareToken: 'demo-token-1',
        showPricing: true,
    },
    {
        id: 'demo-quote-2',
        userId: 'demo-user',
        quoteNumber: 'Q-2024-002',
        customerId: 'demo-cust-2',
        customerName: 'Coastal Resorts & Spas',
        title: 'Pool Equipment Upgrade & Automation',
        status: 'sent',
        items: [
            {
                itemId: 'demo-item-1',
                name: 'Smart Pool Automation System',
                description: 'Hayward OmniLogic',
                category: 'Equipment',
                quantity: 1,
                price: 3847.50,
                total: 3847.50,
            }
        ],
        subtotal: 3847.50,
        tax: 269.33,
        total: 4116.83,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        showPricing: true,
    },
    {
        id: 'demo-quote-3',
        userId: 'demo-user',
        quoteNumber: 'Q-2024-003',
        customerId: 'demo-cust-1',
        customerName: 'Luxury Estates Management',
        title: 'Monthly Maintenance Contract',
        status: 'accepted',
        items: [
            {
                itemId: 'demo-item-3',
                name: 'Premium Weekly Service',
                description: 'Full chemical and cleaning service',
                category: 'Service',
                quantity: 12,
                price: 250.00,
                total: 3000.00,
            }
        ],
        subtotal: 3000.00,
        tax: 0,
        total: 3000.00,
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
        showPricing: true,
    },
    {
        id: 'demo-quote-4',
        userId: 'demo-user',
        quoteNumber: 'Q-2024-004',
        customerId: 'demo-cust-2',
        customerName: 'Coastal Resorts & Spas',
        title: 'New Filtration System',
        status: 'draft',
        items: [
            {
                itemId: 'demo-item-4',
                name: 'High-Efficiency Sand Filter',
                description: 'Triton II with ClearPro',
                category: 'Equipment',
                quantity: 1,
                price: 1250.00,
                total: 1250.00,
            }
        ],
        subtotal: 1250.00,
        tax: 87.50,
        total: 1337.50,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        showPricing: true,
    },
    {
        id: 'demo-quote-5',
        userId: 'demo-user',
        quoteNumber: 'Q-2024-005',
        customerId: 'demo-cust-1',
        customerName: 'Luxury Estates Management',
        title: 'Landscape Lighting Package',
        status: 'declined',
        items: [
            {
                itemId: 'demo-item-5',
                name: 'LED Path Light Kit',
                description: '12-piece low voltage set',
                category: 'Lighting',
                quantity: 2,
                price: 450.00,
                total: 900.00,
            }
        ],
        subtotal: 900.00,
        tax: 63.00,
        total: 963.00,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        showPricing: true,
    }
];

export const MOCK_SOW_TEMPLATE = `Title: Project Scope of Work: [Project Name]
Document ID: SOW-2025-001
Prepared by: Quote-it AI Intelligence Engine

1. Project Executive Summary
Comprehensive professional services for [Project Name], focusing on high-efficiency delivery, regulatory compliance, and premium craftsmanship. This project aims to [Business Objective] within the defined budgetary and timeline constraints.

2. Work Breakdown Structure (WBS)
Phase 1: Mobilization & Site Prep (Days 1-3)
• Safety assessment and perimeter establishment.
• Initial material procurement and staging.

Phase 2: Core Execution (Days 4-12)
• Primary installation/implementation of [Core Service].
• Mid-point quality assurance check.

Phase 3: Integration & Finalization (Days 13-15)
• System testing and final walk-through.
• Site cleanup and handover of documentation.

3. Key Deliverables
Deliverable A: Fully operational [System/Service] meeting all [Standard] specifications.
Deliverable B: Comprehensive maintenance and warranty documentation.
Deliverable C: 30-day post-execution performance review.

4. Acceptance Criteria
• Work must meet or exceed [Local Code/Industry Standard] requirements.
• All client-specified customizations must be verified and signed off.
• Site must be returned to original or improved condition.`;
