import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIButton } from '@/components/AIButton';
import { useAI } from '@/hooks/useAI';
import { useAuth } from '@/contexts/AuthContext';
import { AIUpgradeDialog } from '@/components/AIUpgradeDialog';
import { Quote, Customer } from '@/types';
import { MessageSquare, Copy, Mail } from 'lucide-react';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpMessageAIProps {
  quote: Quote;
  customer: Customer | null;
}

export function FollowUpMessageAI({ quote, customer }: FollowUpMessageAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(`Following Up: ${quote.title}`);
  const [greeting, setGreeting] = useState(`Hi ${customer?.name || 'there'},`);
  const [closingText, setClosingText] = useState('Best regards');
  const [includeQuoteReference, setIncludeQuoteReference] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [requiredTier, setRequiredTier] = useState<'pro' | 'max'>('pro');
  const { userRole } = useAuth();

  const messageAI = useAI('followup_message', {
    onSuccess: (content) => {
      setMessage(content);
    },
    onUpgradeRequired: (tier) => {
      setRequiredTier(tier);
      setShowUpgradeDialog(true);
    },
  });

  const generateFollowUp = async () => {
    if (!customer) {
      toast.error('Customer information required');
      return;
    }

    // Client-side tier check for instant feedback
    if (userRole === 'free') {
      setRequiredTier('pro');
      setShowUpgradeDialog(true);
      return;
    }

    // Determine the best name to use for personalization
    const contactFirstName = customer.contactFirstName;
    const contactLastName = customer.contactLastName;
    const businessName = customer.name;
    
    // Use first name if available, otherwise last name with title, otherwise business name
    const personalizedGreeting = contactFirstName 
      ? contactFirstName
      : contactLastName 
      ? `Mr./Ms. ${contactLastName}`
      : businessName;

    const daysSinceSent = quote.sentDate 
      ? Math.floor((Date.now() - new Date(quote.sentDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    const sanitizedGreeting = sanitizeForAI(personalizedGreeting, 100);
    const sanitizedTitle = sanitizeForAI(quote.title, 200);
    const total = sanitizeNumber(quote.total);

    const context = {
      customerName: sanitizedGreeting,
      quoteNumber: quote.quoteNumber,
      quoteTitle: sanitizedTitle,
      status: quote.status,
      daysSinceSent,
      total,
      itemCount: quote.items.length,
    };

    const prompt = `Generate a personalized follow-up message for this quote:

Customer Contact: ${sanitizedGreeting}
Quote: #${quote.quoteNumber} - ${sanitizedTitle}
Status: ${quote.status}
Days Since Sent: ${daysSinceSent}
Total: $${total}
Items: ${quote.items.length}

Create a warm, professional follow-up that references the quote and encourages action. Address the customer by name in the greeting.`;

    const result = await messageAI.generate(prompt, context);
    
    // Check if upgrade is required
    if (result && typeof result === 'object' && 'needsUpgrade' in result) {
      setRequiredTier(result.requiredTier);
      setShowUpgradeDialog(true);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  };

  const handleEmail = async () => {
    if (!customer?.email) {
      toast.error('Customer email not available');
      return;
    }

    if (!message.trim()) {
      toast.error('Please generate a message first');
      return;
    }

    setIsSending(true);

    try {
      // Fetch company settings for branding
      const { data: settings } = await supabase
        .from('company_settings')
        .select('*')
        .single();

      const companyName = settings?.name || 'Our Company';
      const companyLogo = settings?.logo;

      // Build share link if quote reference is included
      let shareLink = undefined;
      if (includeQuoteReference && quote.shareToken) {
        shareLink = `${window.location.origin}/quote/view/${quote.shareToken}`;
      }

      // Call edge function
      const { data, error } = await supabase.functions.invoke('send-follow-up-email', {
        body: {
          customerEmail: customer.email,
          customerName: customer.name,
          subject: subject,
          greeting: greeting,
          bodyText: message,
          closingText: closingText,
          companyName: companyName,
          companyLogo: companyLogo,
          includeQuoteReference: includeQuoteReference,
          quoteNumber: quote.quoteNumber,
          quoteTitle: quote.title,
          quoteTotal: quote.total,
          quoteShareLink: shareLink,
        }
      });

      if (error) throw error;

      toast.success('Follow-up email sent successfully!');
      setIsOpen(false);
    } catch (error: any) {
      console.error('Error sending follow-up email:', error);
      
      // Fallback to mailto if edge function fails
      toast.error('Failed to send email via server. Opening email client as fallback...');
      const mailtoLink = `mailto:${customer.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${greeting}\n\n${message}\n\n${closingText}`)}`;
      window.location.href = mailtoLink;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            AI Follow-up Message
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>AI Follow-Up Message</DialogTitle>
            <DialogDescription>
              Generate and customize a personalized follow-up message for this quote
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {!message ? (
              <div className="text-center py-8">
                <AIButton
                  onClick={generateFollowUp}
                  isLoading={messageAI.isLoading}
                  size="lg"
                  className="w-full max-w-md"
                >
                  Generate Follow-up Message
                </AIButton>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject Line</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="greeting">Greeting</Label>
                    <Input
                      id="greeting"
                      value={greeting}
                      onChange={(e) => setGreeting(e.target.value)}
                      placeholder="Hi there,"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Message</Label>
                      <Button
                        onClick={generateFollowUp}
                        variant="ghost"
                        size="sm"
                        disabled={messageAI.isLoading}
                      >
                        {messageAI.isLoading ? 'Regenerating...' : '🔄 Regenerate'}
                      </Button>
                    </div>
                    <Textarea
                      id="message"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={10}
                      className="font-mono text-sm"
                      placeholder="AI-generated follow-up message will appear here..."
                    />
                  </div>

                  <div className="flex items-center space-x-2 border rounded-lg p-3 bg-muted/50">
                    <Checkbox
                      id="includeQuote"
                      checked={includeQuoteReference}
                      onCheckedChange={(checked) => setIncludeQuoteReference(checked as boolean)}
                    />
                    <label
                      htmlFor="includeQuote"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Include quote reference (shows quote details and link to view online)
                    </label>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="closing">Closing</Label>
                    <Input
                      id="closing"
                      value={closingText}
                      onChange={(e) => setClosingText(e.target.value)}
                      placeholder="Best regards"
                    />
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t">
                  <Button
                    onClick={handleCopy}
                    variant="outline"
                    size="sm"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy to Clipboard
                  </Button>

                  <Button
                    onClick={handleEmail}
                    variant="default"
                    size="sm"
                    disabled={!customer?.email || isSending}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {isSending ? 'Sending...' : 'Send Email'}
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AIUpgradeDialog
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        featureName="followup_message"
        requiredTier={requiredTier}
      />
    </>
  );
}
