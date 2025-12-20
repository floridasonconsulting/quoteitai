import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useAI } from '@/hooks/useAI';
import { Quote, Customer } from '@/types';
import { toast } from 'sonner';
import { Loader2, Mail, Send, Sparkles, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FollowUpNotificationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    quote: Quote | null;
    customer: Customer | null;
}

export function FollowUpNotificationDialog({
    isOpen,
    onClose,
    quote,
    customer
}: FollowUpNotificationDialogProps) {
    const [message, setMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [greeting, setGreeting] = useState('');
    const [closingText, setClosingText] = useState('Best regards');
    const [includeQuoteReference, setIncludeQuoteReference] = useState(true);
    const [isSending, setIsSending] = useState(false);

    const { generate, isLoading } = useAI('followup_message', {
        onSuccess: (content) => {
            setMessage(content);
        }
    });

    useEffect(() => {
        if (isOpen && quote) {
            setSubject(`Following Up: ${quote.title}`);
            setGreeting(`Hi ${quote.customerName},`);
            if (!message && !isLoading) {
                handleGenerate();
            }
        }
    }, [isOpen, quote]);

    const handleGenerate = async () => {
        if (!quote) return;

        const prompt = `Generate a professional and friendly follow-up message for ${quote.customerName}. 
    Reference their quote: "${quote.title}" (#${quote.quoteNumber}) for $${quote.total.toLocaleString()}.
    
    Make it concise and helpful. Ask if they have any questions or need more information to move forward.
    
    Do NOT include subject lines or signatures, just the message body.`;

        await generate(prompt, {
            quoteId: quote.id,
            customerName: quote.customerName,
            total: quote.total,
            status: quote.status
        });
    };

    const handleSend = async () => {
        if (!quote || !message.trim()) return;

        setIsSending(true);
        try {
            // 1. Fetch company settings for branding
            const { data: settings } = await supabase
                .from('company_settings')
                .select('name, logo')
                .single();

            // 2. Build share link if needed
            let shareLink = undefined;
            if (includeQuoteReference && quote.shareToken) {
                shareLink = `${window.location.origin}/quote/view/${quote.shareToken}`;
            }

            // 3. Call edge function
            const { error: emailError } = await supabase.functions.invoke('send-follow-up-email', {
                body: {
                    customerEmail: customer?.email || '',
                    customerName: quote.customerName,
                    subject: subject,
                    greeting: greeting,
                    bodyText: message,
                    closingText: closingText,
                    companyName: settings?.name || 'Our Company',
                    companyLogo: settings?.logo,
                    includeQuoteReference: includeQuoteReference,
                    quoteNumber: quote.quoteNumber,
                    quoteTitle: quote.title,
                    quoteTotal: quote.total,
                    quoteShareLink: shareLink,
                }
            });

            if (emailError) throw emailError;

            // 4. Update quote with follow-up date
            const { error: updateError } = await supabase
                .from('quotes')
                .update({ follow_up_date: new Date().toISOString() })
                .eq('id', quote.id);

            if (updateError) throw updateError;

            toast.success('Follow-up message sent successfully');
            onClose();
            setMessage('');
        } catch (error) {
            console.error('Error sending follow-up:', error);
            toast.error('Failed to send follow-up message. Please try again or use the manual follow-up option.');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-blue-500" />
                        AI Follow-up Assistant
                    </DialogTitle>
                    <DialogDescription>
                        Draft a personalized follow-up for <strong>{quote?.customerName}</strong>.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label htmlFor="message">Message Body</Label>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isLoading}
                                className="h-8 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                                <RefreshCw className={`h-3 w-3 mr-1 ${isLoading ? 'animate-spin' : ''}`} />
                                {isLoading ? 'Generating...' : 'Regenerate'}
                            </Button>
                        </div>
                        {isLoading && !message ? (
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
                                <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
                                <p className="text-sm text-muted-foreground italic">Crafting personalized message...</p>
                            </div>
                        ) : (
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Type your follow-up message here..."
                                className="min-h-[200px] leading-relaxed font-sans"
                            />
                        )}
                    </div>

                    <div className="flex items-start space-x-2 border rounded-lg p-3 bg-muted/50">
                        <Checkbox
                            id="includeQuote"
                            checked={includeQuoteReference}
                            onCheckedChange={(checked) => setIncludeQuoteReference(checked as boolean)}
                            className="mt-1"
                        />
                        <div className="grid gap-1.5 leading-none">
                            <label
                                htmlFor="includeQuote"
                                className="text-sm font-medium cursor-pointer"
                            >
                                Include Quote Data
                            </label>
                            <p className="text-xs text-muted-foreground">
                                Adds quote details and a link to view the proposal online.
                            </p>
                        </div>
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

                <DialogFooter className="flex gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={onClose} disabled={isSending}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isLoading || isSending || !message.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isSending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Email
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
