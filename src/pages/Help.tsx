import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Search,
  BookOpen,
  FileText,
  Users,
  Package,
  BarChart3,
  Sparkles,
  Settings,
  CreditCard,
  HelpCircle,
  Home,
  Smartphone,
  Cloud
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const helpCategories = [
  {
    id: "getting-started",
    icon: BookOpen,
    title: "Getting Started",
    description: "Quick start guide and first steps",
    articles: [
      {
        title: "Welcome & Quick Tour",
        content: "Welcome to Sellegance! This guide will help you get started with creating professional proposals in minutes. The dashboard shows all your quotes, customers, and items in one place. Navigate using the sidebar to access different sections of the app."
      },
      {
        title: "Creating Your First Quote",
        content: "To create a quote: 1) Click 'New Quote' from the dashboard or quotes page. 2) Fill in the quote title and select a customer (or create a new one). 3) Add items from your catalog or create custom items. 4) Review pricing and add any notes. 5) Save as draft or mark as sent. The quote number is automatically generated."
      },
      {
        title: "Setting Up Your Company Profile",
        content: "Go to Settings to configure your company information. Add your business name, address, contact details, and logo. This information appears on all your generated quote PDFs. You can also customize payment terms and display preferences."
      }
    ]
  },
  {
    id: "quotes",
    icon: FileText,
    title: "Quote Management",
    description: "Creating and managing quotes",
    articles: [
      {
        title: "Quote Status Tracking",
        content: "Quotes can have four statuses: Draft (not sent yet), Sent (delivered to customer), Accepted (customer approved), and Declined (customer rejected). Update status by editing any quote. The dashboard shows counts for each status."
      },
      {
        title: "Understanding Quote Aging",
        content: "Quote aging helps you follow up at the right time. Fresh (0-7 days) = green, Warm (8-14 days) = yellow, Aging (15-30 days) = orange, Stale (30+ days) = red. Follow up on aging quotes to improve win rates."
      },
      {
        title: "Adding Items to Quotes",
        content: "You can add items two ways: 1) From your pre-configured item catalog (faster), or 2) Create custom items directly in the quote. Items include name, description, base price, markup, and quantity. Total is calculated automatically."
      },
      {
        title: "Generating PDF Quotes",
        content: "Click 'Download PDF' on any quote detail page to generate a professional PDF. The PDF includes your company logo, customer information, itemized pricing, subtotal, tax, total, and payment terms."
      },
      {
        title: "Interactive Proposals",
        content: "Share quotes as interactive proposals using the 'Share Link' button. Customers receive an OTP code via email to securely view. The proposal viewer features magazine-style swipe navigation, category sections with images, investment summary, and accept/decline buttons. Customers can leave comments too!"
      },
      {
        title: "Scope of Work in Proposals",
        content: "Generate a Professional Scope of Work from the quote detail page and click 'Add to Proposal'. The SOW appears as a dedicated slide before the Investment Summary, presenting project details, deliverables, timeline, and acceptance criteria in a professional format."
      },
      {
        title: "Pricing Display Modes",
        content: "Control how pricing appears in proposals: Itemized (shows all line item prices), Category Totals (shows subtotal per category), or Grand Total Only (hides individual prices, shows only the total). Set this per quote when editing."
      }
    ]
  },
  {
    id: "customers",
    icon: Users,
    title: "Customer Management",
    description: "Managing your customer database",
    articles: [
      {
        title: "Adding and Editing Customers",
        content: "Navigate to Customers page and click 'Add Customer'. Fill in name (required), email (required), phone, address, city, state, and zip. Edit any customer by clicking on their card. Customers are used when creating quotes."
      },
      {
        title: "Importing Customers via CSV",
        content: "On the Customers page, click 'Import CSV' to bulk import customers. Your CSV should have columns: name, email, phone, address, city, state, zip. Download the sample CSV template for the correct format."
      },
      {
        title: "Exporting Customer Data",
        content: "Click 'Export CSV' on the Customers page to download all your customers as a CSV file. This is useful for backups or importing into other systems."
      }
    ]
  },
  {
    id: "items",
    icon: Package,
    title: "Item Catalog",
    description: "Managing your product/service catalog",
    articles: [
      {
        title: "Creating Items",
        content: "Go to Items page and click 'Add Item'. Enter item name, description, category, base price, markup type (percentage or fixed), markup amount, and units. Final price is calculated automatically based on base price and markup."
      },
      {
        title: "Understanding Markup Calculations",
        content: "Markup can be percentage or fixed amount. Percentage markup: final_price = base_price × (1 + markup/100). Fixed markup: final_price = base_price + markup. Choose the method that works best for your pricing model."
      },
      {
        title: "Using Categories",
        content: "Organize items with categories like 'Materials', 'Labor', 'Equipment', etc. Categories help you find items quickly when creating quotes and provide better organization for large catalogs."
      }
    ]
  },
  {
    id: "dashboard",
    icon: BarChart3,
    title: "Dashboard & Analytics",
    description: "Understanding your metrics",
    articles: [
      {
        title: "Dashboard Metrics Explained",
        content: "Total Revenue: sum of all accepted quotes. Pending Value: total value of sent quotes awaiting decision. Win Rate: percentage of sent quotes that were accepted. Active Quotes: total number of draft and sent quotes."
      },
      {
        title: "Quote Aging Chart",
        content: "The aging chart shows how many quotes fall into each aging category (Fresh, Warm, Aging, Stale). Use this to prioritize which quotes need follow-up attention."
      },
      {
        title: "Filtering and Search",
        content: "Use the search bar to find quotes by number, customer name, or title. Filter by status (All, Draft, Sent, Accepted, Declined) to focus on specific quote stages."
      }
    ]
  },
  {
    id: "ai",
    icon: Sparkles,
    title: "Intelligence Features",
    description: "Using intelligent assistance",
    articles: [
      {
        title: "Intelligent Title Suggestions",
        content: "When creating or editing a quote, click the assist button next to the title field. The platform analyzes your customer and items to suggest relevant, professional quote titles. Available on Pro and Enterprise plans."
      },
      {
        title: "Simplified Quote Generation",
        content: "On the New Quote page, describe your project in plain language (e.g., 'I'm at the Johnson residence and we will be installing new equipment...'). Sellegance generates the title, suggests items from your catalog, writes the executive summary, and even extracts the customer name. Tip: Start with 'Customer is [Name]' or 'I'm at the [Name] home' for automatic customer matching. Enterprise plan feature."
      },
      {
        title: "Professional Scope of Work Generator",
        content: "On any quote detail page, find the 'Scope of Work Generator' section. Click 'Generate Scope of Work' to create a comprehensive SOW document. Once generated, click 'Add to Proposal' to include it as a dedicated slide in your proposal. The SOW appears before the Investment Summary. Business+ plan feature."
      },
      {
        title: "AI Follow-up Messages",
        content: "The AI generates personalized follow-up emails based on quote staleness. Fresh quotes (0-3 days) get friendly check-ins, warm quotes (4-7 days) address concerns, aging quotes (8-14 days) create urgency, and stale quotes (15+ days) get final outreach with incentives. You can edit the message before sending."
      },
      {
        title: "AI Terms & Conditions",
        content: "Click 'Generate' in the terms section to have AI create customized payment terms and conditions based on your quote details. This ensures professional, comprehensive terms. Max AI plan feature."
      },
      {
        title: "AI Usage Limits",
        content: "Free plan: limited AI features. Pro plan: 50 AI requests per month. Business/Max AI plan: unlimited AI requests. Usage resets monthly. Upgrade in Settings > Subscription to increase your limit."
      }
    ]
  },
  {
    id: "sync",
    icon: Cloud,
    title: "Syncing & Mobile",
    description: "Cross-device functionality",
    articles: [
      {
        title: "How Cloud Sync Works",
        content: "All your data automatically syncs to the cloud. Changes made on any device appear on all your other devices within seconds. The sync indicator in the top corner shows sync status (synced, syncing, or offline)."
      },
      {
        title: "Manual Sync",
        content: "Data syncs automatically, but you can force a sync by clicking the sync indicator icon. This is useful after making multiple changes or if you've been offline and just reconnected."
      },
      {
        title: "Mobile App Setup",
        content: "Sellegance supports native Android and iOS apps. See MOBILE_DEPLOYMENT.md in the documentation for detailed instructions on building and deploying mobile apps using Capacitor."
      },
      {
        title: "Offline Mode",
        content: "The app works offline! Create and edit quotes, customers, and items without internet. Changes are saved locally and automatically sync when you reconnect. Offline data is stored securely on your device."
      }
    ]
  },
  {
    id: "settings",
    icon: Settings,
    title: "Settings & Customization",
    description: "Personalizing your experience",
    articles: [
      {
        title: "Company Information",
        content: "Update your business name, address, phone, email, website, license, and insurance information in Settings. This appears on all your quote PDFs and helps establish credibility with clients."
      },
      {
        title: "Logo Management",
        content: "Upload your company logo in Settings. Choose where it appears: quote headers, PDF documents, or both. Supports PNG, JPG formats. Recommended size: 200x200 pixels or similar aspect ratio."
      },
      {
        title: "Default Terms & Conditions",
        content: "Set default payment terms in Settings that automatically apply to new quotes. You can customize terms per-quote or let AI generate them. Common terms include payment due dates, accepted methods, and warranties."
      }
    ]
  },
  {
    id: "subscription",
    icon: CreditCard,
    title: "Subscription & Billing",
    description: "Managing your plan",
    articles: [
      {
        title: "Plan Comparison",
        content: "Free: Basic features, limited quotes. Pro ($9.99/month): 50 quotes/month, basic AI. Max AI ($19.99/month): Unlimited quotes and AI. Annual plans save 17%. All plans include customer management, item catalog, PDF export, and cloud sync."
      },
      {
        title: "Upgrading Your Plan",
        content: "Go to Settings > Subscription to upgrade. Choose monthly or annual billing. Payment is processed securely via Stripe. Your upgrade takes effect immediately, and you get access to all plan features."
      },
      {
        title: "Cancellation Policy",
        content: "Cancel anytime from Settings > Subscription > Manage Subscription. Monthly plans: access until end of billing period. Annual plans: pro-rated refund available. Free plan users: your data is never deleted."
      }
    ]
  },
  {
    id: "troubleshooting",
    icon: HelpCircle,
    title: "Troubleshooting",
    description: "Common issues and solutions",
    articles: [
      {
        title: "Data Not Syncing",
        content: "If data isn't syncing: 1) Check internet connection. 2) Click the sync indicator to force sync. 3) Sign out and sign back in. 4) Check browser console for errors. Contact support if issues persist."
      },
      {
        title: "Sign-in Issues",
        content: "Can't sign in? 1) Verify email and password are correct. 2) Check for confirmation email if just signed up. 3) Try password reset. 4) Clear browser cache and cookies. 5) Try a different browser."
      },
      {
        title: "PDF Generation Problems",
        content: "PDF not generating? 1) Ensure quote has at least one item. 2) Check company information is filled out. 3) Try a different browser. 4) Disable browser popup blockers. 5) Check browser console for errors."
      },
      {
        title: "Mobile App Issues",
        content: "Mobile app not working? 1) Ensure you're running the latest version. 2) Check internet connection. 3) Try force-closing and reopening. 4) Clear app data (Settings > Apps > Sellegance). 5) Reinstall the app if needed."
      }
    ]
  }
];

const faqs = [
  {
    question: "Is my data secure?",
    answer: "Yes! All data is encrypted in transit and at rest. We use Supabase's enterprise-grade infrastructure with Row Level Security (RLS) policies ensuring you can only access your own data. We never share your data with third parties."
  },
  {
    question: "Can I use Sellegance offline?",
    answer: "Yes! The app works fully offline. All changes are saved locally and automatically sync when you reconnect to the internet. This is perfect for working in areas with poor connectivity."
  },
  {
    question: "What AI models do you use?",
    answer: "We use Google Gemini and OpenAI GPT models through Lovable AI gateway. These provide the best balance of quality, speed, and cost. Your AI requests are processed securely and we don't store AI request content."
  },
  {
    question: "Can I export my data?",
    answer: "Yes! You can export customers and items as CSV files. Quotes can be downloaded as PDFs. You own your data and can export it anytime, even on the free plan."
  },
  {
    question: "Do you offer refunds?",
    answer: "Yes. If you're not satisfied within 30 days, contact support for a full refund. Annual plans receive pro-rated refunds if cancelled after 30 days."
  },
  {
    question: "How do I get support?",
    answer: "Free users: email support and help center. Pro users: priority email support. Max AI users: dedicated support with faster response times. We typically respond within 24 hours."
  }
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  // Smooth scroll to category section
  const scrollToCategory = (categoryId: string) => {
    const element = document.getElementById(categoryId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  // Filter articles based on search
  const filteredCategories = helpCategories.map(category => ({
    ...category,
    articles: category.articles.filter(article =>
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.content.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.articles.length > 0 || searchQuery === "");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(user ? '/dashboard' : '/')}>
              <Home className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">Help Center</span>
            </div>
          </div>
          {!user && (
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-lg text-muted-foreground mb-8">
              Search our knowledge base or browse by category
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help articles..."
                className="pl-10 py-6 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <Tabs defaultValue="browse" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="browse">Browse by Category</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="browse">
              {searchQuery === "" ? (
                // Category Grid View
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {helpCategories.map((category) => (
                    <Card
                      key={category.id}
                      className="hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => scrollToCategory(category.id)}
                    >
                      <CardHeader>
                        <category.icon className="h-10 w-10 text-primary mb-2" />
                        <CardTitle>{category.title}</CardTitle>
                        <CardDescription>{category.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">
                          {category.articles.length} articles
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                // Search Results View
                <div className="space-y-8">
                  {filteredCategories.length > 0 ? (
                    filteredCategories.map((category) => (
                      <div key={category.id}>
                        <div className="flex items-center gap-2 mb-4">
                          <category.icon className="h-6 w-6 text-primary" />
                          <h2 className="text-2xl font-bold">{category.title}</h2>
                        </div>
                        <Accordion type="single" collapsible className="space-y-2">
                          {category.articles.map((article, idx) => (
                            <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                              <AccordionTrigger className="text-left">
                                {article.title}
                              </AccordionTrigger>
                              <AccordionContent className="text-muted-foreground">
                                {article.content}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </div>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <p className="text-muted-foreground">
                          No articles found matching "{searchQuery}". Try different keywords or browse by category.
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* All Articles Accordion (when not searching) */}
              {searchQuery === "" && (
                <div className="mt-12 space-y-8">
                  <h2 className="text-3xl font-bold text-center mb-8">All Articles</h2>
                  {helpCategories.map((category) => (
                    <div key={category.id} id={category.id}>
                      <div className="flex items-center gap-2 mb-4">
                        <category.icon className="h-6 w-6 text-primary" />
                        <h3 className="text-2xl font-bold">{category.title}</h3>
                      </div>
                      <Accordion type="single" collapsible className="space-y-2">
                        {category.articles.map((article, idx) => (
                          <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                            <AccordionTrigger className="text-left">
                              {article.title}
                            </AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                              {article.content}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="faq">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">Frequently Asked Questions</CardTitle>
                  <CardDescription>Quick answers to common questions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="space-y-2">
                    {faqs.map((faq, idx) => (
                      <AccordionItem key={idx} value={`faq-${idx}`}>
                        <AccordionTrigger className="text-left">
                          {faq.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-muted-foreground">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="py-12 bg-muted/30">
        <div className="container mx-auto px-4">
          <Card className="max-w-2xl mx-auto text-center">
            <CardHeader>
              <CardTitle className="text-2xl">Still need help?</CardTitle>
              <CardDescription>Our support team is here to assist you</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Can't find what you're looking for? Contact our support team and we'll get back to you within 24 hours.
              </p>
              <Button size="lg" onClick={() => window.location.href = 'mailto:hello@sellegance.com'}>
                Contact Support
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
