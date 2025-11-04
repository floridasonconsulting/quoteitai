import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AIButton } from '@/components/AIButton';
import { useAI } from '@/hooks/useAI';
import { Quote, Customer } from '@/types';
import { MessageSquare, Copy, Mail } from 'lucide-react';
import { sanitizeForAI, sanitizeNumber } from '@/lib/input-sanitization';
import { toast } from 'sonner';

interface FollowUpMessageAIProps {
  quote: Quote;
  customer: Customer | null;
}

export function FollowUpMessageAI({ quote, customer }: FollowUpMessageAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  const messageAI = useAI('followup_message', {
    onSuccess: (content) => {
      setMessage(content);
    },
  });

  const generateFollowUp = () => {
    if (!customer) {
      toast.error('Customer information required');
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

    messageAI.generate(prompt, context);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    toast.success('Message copied to clipboard');
  };

  const handleEmail = () => {
    if (!customer?.email) {
      toast.error('Customer email not available');
      return;
    }

    const subject = encodeURIComponent(`Following up on Quote #${quote.quoteNumber}`);
    const body = encodeURIComponent(message);
    window.open(`mailto:${customer.email}?subject=${subject}&body=${body}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MessageSquare className="h-4 w-4 mr-2" />
          AI Follow-up Message
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Generate Follow-up Message</DialogTitle>
          <DialogDescription>
            Create a personalized follow-up message based on quote status and timing
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
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={10}
                className="resize-none"
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateFollowUp}
                  disabled={messageAI.isLoading}
                >
                  Regenerate
                </Button>
                <Button variant="outline" size="sm" onClick={handleCopy}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button size="sm" onClick={handleEmail}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
