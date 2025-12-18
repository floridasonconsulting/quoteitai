import { useState } from 'react';
import { Calendar as CalendarIcon, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Quote, Customer } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { getQuotes } from '@/lib/storage';
import { toast } from 'sonner';
import { scheduleFollowUpNotification, requestNotificationPermission } from '@/lib/notifications';

interface FollowUpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: Quote;
  customer: Customer | null;
}

const MESSAGE_TEMPLATES = {
  checking_in: 'Hi {customerName},\n\nI wanted to follow up on the quote ({quoteNumber}) I sent for {quoteTitle}. Have you had a chance to review it?\n\nPlease let me know if you have any questions!\n\nBest regards',
  price_valid: 'Hi {customerName},\n\nJust a friendly reminder that the pricing in quote {quoteNumber} for {quoteTitle} remains valid. The total is {quoteTotal}.\n\nLet me know if you\'d like to move forward!\n\nBest regards',
  questions: 'Hi {customerName},\n\nI wanted to reach out regarding quote {quoteNumber} for {quoteTitle}. Do you have any questions or need any clarifications?\n\nI\'m here to help!\n\nBest regards',
};

export function FollowUpDialog({ open, onOpenChange, quote, customer }: FollowUpDialogProps) {
  const [followUpDate, setFollowUpDate] = useState<Date | undefined>(
    quote.followUpDate ? new Date(quote.followUpDate) : undefined
  );
  const [messageTemplate, setMessageTemplate] = useState<string>('checking_in');
  const [customMessage, setCustomMessage] = useState<string>('');

  const handleScheduleFollowUp = async () => {
    if (!followUpDate) {
      toast.error('Please select a follow-up date');
      return;
    }

    const quotes = getQuotes();
    const updatedQuotes = quotes.map(q =>
      q.id === quote.id
        ? { ...q, followUpDate: followUpDate.toISOString() }
        : q
    );
    localStorage.setItem('quotes', JSON.stringify(updatedQuotes));

    // Schedule notification
    scheduleFollowUpNotification(
      quote.id,
      quote.quoteNumber,
      quote.customerName,
      followUpDate.toISOString()
    );

    // Request notification permission if not already granted
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      toast.success(`Follow-up scheduled for ${format(followUpDate, 'PPP')} with notification reminder`);
    } else {
      toast.success(`Follow-up scheduled for ${format(followUpDate, 'PPP')} (enable notifications in Settings for reminders)`);
    }

    onOpenChange(false);
  };

  const getTemplateMessage = () => {
    // Determine the best greeting name
    const greetingName = customer?.contactFirstName
      ? customer.contactFirstName
      : customer?.contactLastName
        ? `Mr./Ms. ${customer.contactLastName}`
        : customer?.name || quote.customerName;

    const template = MESSAGE_TEMPLATES[messageTemplate as keyof typeof MESSAGE_TEMPLATES] || '';
    return template
      .replace('{customerName}', greetingName)
      .replace('{quoteNumber}', quote.quoteNumber)
      .replace('{quoteTitle}', quote.title)
      .replace('{quoteTotal}', formatCurrency(quote.total));
  };

  const handleSendEmail = () => {
    if (!customer?.email) {
      toast.error('Customer email address is missing');
      return;
    }

    const message = customMessage || getTemplateMessage();
    const subject = encodeURIComponent(`Follow-up: Quote ${quote.quoteNumber}`);
    const body = encodeURIComponent(message);
    const to = encodeURIComponent(customer.email);

    window.open(`mailto:${to}?subject=${subject}&body=${body}`, '_blank');
    toast.success('Email client opened');
    onOpenChange(false);
  };

  const handleSendSMS = () => {
    if (!customer?.phone) {
      toast.error('Customer phone number is missing');
      return;
    }

    const message = customMessage || getTemplateMessage();
    const body = encodeURIComponent(message.substring(0, 160)); // SMS limit

    window.open(`sms:${customer.phone}?body=${body}`, '_blank');
    toast.success('SMS app opened');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Follow Up on Quote</DialogTitle>
          <DialogDescription>
            Schedule a reminder or send an immediate follow-up to {customer?.name || quote.customerName}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="schedule" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="send">Send Now</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="space-y-4">
            <div className="space-y-2">
              <Label>Follow-Up Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !followUpDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {followUpDate ? format(followUpDate, 'PPP') : 'Pick a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={followUpDate}
                    onSelect={setFollowUpDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-muted-foreground">
                Set a reminder to follow up with this customer
              </p>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleFollowUp}>
                Schedule Follow-Up
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="send" className="space-y-4">
            <div className="space-y-2">
              <Label>Message Template</Label>
              <Select value={messageTemplate} onValueChange={setMessageTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking_in">Checking In</SelectItem>
                  <SelectItem value="price_valid">Price Still Valid</SelectItem>
                  <SelectItem value="questions">Any Questions?</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Custom Message (Optional)</Label>
              <Textarea
                placeholder={getTemplateMessage()}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={6}
                className="resize-none"
              />
              {!customMessage && (
                <p className="text-sm text-muted-foreground">
                  Using template message (shown above)
                </p>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSendSMS}
                disabled={!customer?.phone}
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Send SMS
              </Button>
              <Button onClick={handleSendEmail} disabled={!customer?.email}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
export default FollowUpDialog;
