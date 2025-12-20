import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Send, Edit3, Clock, AlertCircle } from 'lucide-react';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';
import { Quote } from '@/types';

interface FollowUpNotificationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    quote: Quote;
    companyName?: string;
    customerEmail?: string;
    onSend: (subject: string, message: string) => Promise<void>;
}

type QuoteStaleness = 'fresh' | 'warm' | 'aging' | 'stale';

function getQuoteStaleness(quote: Quote): { status: QuoteStaleness; daysSince: number } {
    const sentDate = quote.sentDate ? new Date(quote.sentDate) : new Date(quote.createdAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - sentDate.getTime()) / (1000 * 60 * 60 * 24));

    if (daysSince <= 3) return { status: 'fresh', daysSince };
    if (daysSince <= 7) return { status: 'warm', daysSince };
    if (daysSince <= 14) return { status: 'aging', daysSince };
    return { status: 'stale', daysSince };
}

const STALENESS_CONFIG: Record<QuoteStaleness, { label: string; color: string; tone: string }> = {
    fresh: {
        label: 'Fresh',
        color: 'bg-green-500',
        tone: 'friendly check-in with value reminder'
    },
    warm: {
        label: 'Warm',
        color: 'bg-yellow-500',
        tone: 'professional follow-up addressing potential concerns'
    },
    aging: {
        label: 'Aging',
        color: 'bg-orange-500',
        tone: 'creating urgency with limited availability messaging'
    },
    stale: {
        label: 'Stale',
        color: 'bg-red-500',
        tone: 'final outreach with deadline and potential incentive'
    }
};

export function FollowUpNotificationDialog({
    isOpen,
    onClose,
    quote,
    companyName,
    customerEmail,
    onSend
}: FollowUpNotificationDialogProps) {
    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [isSending, setIsSending] = useState(false);

    const stalenessInfo = getQuoteStaleness(quote);
    const config = STALENESS_CONFIG[stalenessInfo.status];

    const followUpAI = useAI('followup_message', {
        onSuccess: (content) => {
            // Parse subject and message from AI response
            const lines = content.split('\n');
            let parsedSubject = '';
            let parsedMessage = '';
            let inMessage = false;

            for (const line of lines) {
                if (line.toLowerCase().startsWith('subject:')) {
                    parsedSubject = line.replace(/^subject:\s*/i, '').trim();
                } else if (line.toLowerCase().startsWith('message:') || inMessage) {
                    inMessage = true;
                    if (line.toLowerCase().startsWith('message:')) {
                        parsedMessage = line.replace(/^message:\s*/i, '').trim() + '\n';
                    } else {
                        parsedMessage += line + '\n';
                    }
                }
            }

            // Fallback parsing
            if (!parsedSubject && !parsedMessage) {
                const parts = content.split('\n\n');
                parsedSubject = parts[0]?.replace(/^subject:\s*/i, '').trim() || 'Following Up on Your Quote';
                parsedMessage = parts.slice(1).join('\n\n').trim() || content;
            }

            setSubject(parsedSubject || 'Following Up on Your Quote');
            setMessage(parsedMessage.trim() || content);
        },
        onUpgradeRequired: () => {
            toast.error('AI follow-up generation requires a paid plan');
        }
    });

    useEffect(() => {
        if (isOpen && !message) {
            generateAIMessage();
        }
    }, [isOpen]);

    const generateAIMessage = async () => {
        const prompt = `Generate a professional follow-up email for a ${stalenessInfo.status} quote.

CONTEXT:
- Quote Title: ${quote.title}
- Customer: ${quote.customerName}
- Total Value: $${quote.total.toLocaleString()}
- Days Since Sent: ${stalenessInfo.daysSince}
- Quote Status: ${quote.status}
- Company Name: ${companyName || 'Our Company'}

TONE REQUIREMENT: ${config.tone}

STALENESS STRATEGY:
${stalenessInfo.status === 'fresh' ? '- Friendly, casual check-in\n- Remind of key benefits\n- Offer to answer questions' : ''}
${stalenessInfo.status === 'warm' ? '- Show understanding they may be busy\n- Address common objections\n- Highlight unique value proposition' : ''}
${stalenessInfo.status === 'aging' ? '- Create subtle urgency\n- Mention limited availability/capacity\n- Offer to schedule a quick call' : ''}
${stalenessInfo.status === 'stale' ? '- Final professional outreach\n- Consider offering a small incentive\n- Set a soft deadline\n- Leave door open for future' : ''}

Generate in this EXACT format:
Subject: [compelling subject line]
Message: [professional email body with greeting, 2-3 paragraphs, and sign-off]

The message should be warm but professional, not pushy. Goal: help close the deal.`;

        await followUpAI.generate(prompt, { quote, staleness: stalenessInfo });
    };

    const handleSend = async () => {
        if (!subject.trim() || !message.trim()) {
            toast.error('Please provide both subject and message');
            return;
        }

        setIsSending(true);
        try {
            await onSend(subject, message);
            toast.success('Follow-up sent successfully!');
            onClose();
        } catch (error) {
            toast.error('Failed to send follow-up');
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-blue-500" />
                        Time to Follow Up!
                    </DialogTitle>
                    <DialogDescription>
                        AI has generated a personalized message based on the quote's staleness
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Quote Info Bar */}
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div>
                            <p className="font-medium">{quote.title}</p>
                            <p className="text-sm text-muted-foreground">{quote.customerName}</p>
                        </div>
                        <div className="text-right">
                            <Badge className={`${config.color} text-white`}>
                                {config.label} ({stalenessInfo.daysSince} days)
                            </Badge>
                            <p className="text-sm font-semibold mt-1">${quote.total.toLocaleString()}</p>
                        </div>
                    </div>

                    {/* AI Loading State */}
                    {followUpAI.isLoading && (
                        <div className="flex items-center justify-center p-8">
                            <Sparkles className="h-6 w-6 text-purple-500 animate-pulse mr-2" />
                            <span className="text-muted-foreground">AI is crafting your message...</span>
                        </div>
                    )}

                    {/* Subject & Message */}
                    {!followUpAI.isLoading && (
                        <>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="subject">Subject Line</Label>
                                    {!isEditing && (
                                        <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                                            <Edit3 className="h-3 w-3 mr-1" />
                                            Edit
                                        </Button>
                                    )}
                                </div>
                                <Input
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    disabled={!isEditing}
                                    className={!isEditing ? 'bg-muted' : ''}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Message</Label>
                                <Textarea
                                    id="message"
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    disabled={!isEditing}
                                    rows={8}
                                    className={!isEditing ? 'bg-muted' : ''}
                                />
                            </div>

                            {customerEmail && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <AlertCircle className="h-4 w-4" />
                                    Will be sent to: {customerEmail}
                                </div>
                            )}
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={() => generateAIMessage()} disabled={followUpAI.isLoading}>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Regenerate
                    </Button>
                    <Button variant="outline" onClick={onClose}>
                        Later
                    </Button>
                    <Button
                        onClick={handleSend}
                        disabled={isSending || followUpAI.isLoading || !message}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <Send className="h-4 w-4 mr-2" />
                        {isSending ? 'Sending...' : 'Send Now'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
