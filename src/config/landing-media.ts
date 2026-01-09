export interface MediaAsset {
  id: string;
  title: string;
  description: string;
  image: string; // Can be .png, .jpg, or .gif
  badge?: string;
  isGif?: boolean; // Flag to indicate animated content
  category?: "core" | "intelligence" | "mobile" | "analytics";
}

export const heroScreenshots: MediaAsset[] = [
  {
    id: "dashboard",
    title: "Smart Dashboard",
    description: "Track all your quotes and metrics in one place",
    image: "/screenshots/dashboard.png",
    badge: "Analytics",
    category: "analytics",
  },
  {
    id: "quote-detail",
    title: "Professional Quotes",
    description: "Create detailed quotes with intelligent assistance",
    image: "/screenshots/new-quote.png",
    badge: "Intelligent",
    category: "intelligence",
  },
  {
    id: "customers",
    title: "Customer Management",
    description: "Organize and manage all your contacts",
    image: "/screenshots/customers.png",
    badge: "CRM",
    category: "core",
  },
];

export const interactiveScreenshots: MediaAsset[] = [
  {
    id: "dashboard",
    title: "Dashboard",
    description: "Track quotes and performance",
    image: "/screenshots/dashboard.png",
    category: "analytics",
  },
  {
    id: "quotes",
    title: "Quotes",
    description: "Manage all your quotes",
    image: "/screenshots/quotes.png",
    category: "core",
  },
  {
    id: "new-quote",
    title: "New Quote",
    description: "Intelligent quote creation",
    image: "/screenshots/new-quote.png",
    badge: "Professional",
    category: "intelligence",
  },
  {
    id: "email-editor",
    title: "Email Editor",
    description: "Customize and preview professional emails",
    image: "/screenshots/email-editor.png",
    badge: "Pro Feature",
    category: "core",
  },
  {
    id: "customers",
    title: "Customers",
    description: "Customer management",
    image: "/screenshots/customers.png",
    category: "core",
  },
  {
    id: "items",
    title: "Items",
    description: "Product catalog",
    image: "/screenshots/items.png",
    category: "core",
  },
  {
    id: "mobile",
    title: "Mobile",
    description: "Native mobile app",
    image: "/screenshots/mobile.png",
    category: "mobile",
  },
];
