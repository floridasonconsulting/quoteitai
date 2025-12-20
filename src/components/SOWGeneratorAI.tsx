import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { useDemoMode } from '@/contexts/DemoContext';
import { MOCK_SOW_TEMPLATE } from '@/lib/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { FileText, Copy, Download, PlusCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Quote } from '@/types';

interface SOWGeneratorAIProps {
    quote: Quote;
    companyName?: string;
    onSaveToQuote?: (content: string) => void | Promise<void>;
    onSuccess?: (content: string) => void;
}

export function SOWGeneratorAI({ quote, companyName, onSaveToQuote, onSuccess }: SOWGeneratorAIProps) {
    const { userRole } = useAuth();
    const { isDemoMode } = useDemoMode();
    const [generatedSOW, setGeneratedSOW] = useState<string | null>(null);
    const [additionalContext, setAdditionalContext] = useState('');
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const normalizedRole = userRole?.toLowerCase();
    const sowAI = useAI('scope_of_work', {
        onSuccess: (content) => {
            // Clean up any markdown code blocks
            const cleanedContent = content
                .replace(/```markdown\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            setGeneratedSOW(cleanedContent);
            onSuccess?.(cleanedContent); // Call parent handler
            toast.success('Scope of Work generated successfully!');
        },
        onUpgradeRequired: () => {
            // If user is admin/max but backend says upgrade, it's a limit/service issue, not a tier issue
            if (normalizedRole === 'admin' || normalizedRole === 'max' || normalizedRole === 'business' || normalizedRole === 'max_ai') {
                console.warn('[SOW] Backend requested upgrade for authorized user:', normalizedRole);
                toast.error('Generation blocked by service limits', {
                    description: 'As an authorized user, you should not see this. Please check system status.'
                });
                return;
            }
            setShowUpgradeDialog(true);
        }
    });

    const handleGenerate = async () => {
        // SOW is a Business+ feature
        // Case-insensitive check for robustness

        console.log('[SOWUserCheck] Current role:', normalizedRole);

        if (isDemoMode) {
            setIsTyping(true);
            setGeneratedSOW('');

            const template = MOCK_SOW_TEMPLATE.replace(/\[Project Name\]/g, quote.title);
            let i = 0;
            const interval = setInterval(() => {
                setGeneratedSOW(prev => template.slice(0, i + 1));
                i++;
                if (i >= template.length) {
                    clearInterval(interval);
                    setIsTyping(false);
                    toast.success('Professional SOW Generated!');
                    onSuccess?.(template);
                }
            }, 20); // ~50 chars per second
            return;
        }

        if (normalizedRole !== 'max' && normalizedRole !== 'admin' && normalizedRole !== 'business' && normalizedRole !== 'max_ai') {
            console.log('[SOWUserCheck] Role insufficient, showing upgrade dialog');
            setShowUpgradeDialog(true);
            return;
        }

        const itemsBreakdown = quote.items.map(item => ({
            name: item.name,
            description: item.description || item.enhancedDescription || '',
            category: item.category || 'General',
            quantity: item.quantity,
            units: item.units || 'units'
        }));

        const prompt = `Generate a professional, HUMAN-READABLE Scope of Work (SOW) document for the following project.

CRITICAL: Output ONLY clean, professionally formatted text. Do NOT use JSON, code blocks, or any structured data format. Write it as you would a professional business document.

PROJECT TITLE: ${quote.title}
CLIENT: ${quote.customerName}
COMPANY: ${companyName || 'Our Company'}

QUOTE SUMMARY:
- Total Value: $${quote.total.toLocaleString()}
- Number of Line Items: ${quote.items.length}

LINE ITEMS TO INCLUDE:
${itemsBreakdown.map(item => `• ${item.name} (Qty: ${item.quantity} ${item.units}) - ${item.description}`).join('\n')}

${additionalContext ? `ADDITIONAL CONTEXT:\n${additionalContext}` : ''}

EXECUTIVE SUMMARY (if available):
${quote.executiveSummary || 'Not provided'}

---

Generate a comprehensive Scope of Work with these sections:

## Project Overview
Brief description, client info, and project context.

## Scope of Work
Detailed breakdown of all work to be performed, grouped by category.

## Deliverables
List of tangible outputs and measurable outcomes.

## Timeline & Milestones
Estimated duration, key phases, and milestones.

## Acceptance Criteria
How work will be evaluated and quality standards.

## Exclusions
What is NOT included in this scope.

FORMATTING RULES:
- Use "## " for section headers (exactly as shown above)
- Use bullet points (• or -) for lists
- Write in complete, professional sentences
- NO JSON, NO code blocks, NO technical formatting
- Write as a READABLE BUSINESS DOCUMENT`;

        await sowAI.generate(prompt, { quote, additionalContext });
    };

    const handleCopySOW = () => {
        if (generatedSOW) {
            navigator.clipboard.writeText(generatedSOW);
            toast.success('SOW copied to clipboard');
        }
    };

    const handleDownloadSOW = () => {
        if (!generatedSOW) return;

        const blob = new Blob([generatedSOW], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SOW-${quote.quoteNumber || quote.id.slice(0, 8)}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success('SOW downloaded');
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        AI Scope of Work Generator
                        {normalizedRole !== 'max' && normalizedRole !== 'admin' && normalizedRole !== 'business' && normalizedRole !== 'max_ai' && (
                            <span className="text-xs font-normal text-muted-foreground ml-2">(Business AI)</span>
                        )}
                    </CardTitle>
                    <CardDescription>
                        Generate a professional Scope of Work document based on this quote
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Additional Context (Optional)</Label>
                        <Textarea
                            value={additionalContext}
                            onChange={(e) => setAdditionalContext(e.target.value)}
                            placeholder="Add any specific requirements, timeline notes, or special conditions..."
                            rows={3}
                        />
                    </div>

                    <AIButton
                        onClick={handleGenerate}
                        isLoading={sowAI.isLoading || isTyping}
                        className="w-full"
                    >
                        {isTyping ? 'AI Intelligence Engine Drafting...' : 'Generate Scope of Work'}
                    </AIButton>

                    {generatedSOW && (
                        <div className="mt-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <Label>Generated SOW</Label>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={handleCopySOW}>
                                        <Copy className="h-4 w-4 mr-1" />
                                        Copy
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={handleDownloadSOW}>
                                        <Download className="h-4 w-4 mr-1" />
                                        Download
                                    </Button>
                                    {onSaveToQuote && (
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                if (!generatedSOW) return;
                                                setIsSaving(true);
                                                try {
                                                    await onSaveToQuote?.(generatedSOW);
                                                    toast.success('SOW added to proposal!');
                                                } catch (e) {
                                                    toast.error('Failed to save SOW');
                                                } finally {
                                                    setIsSaving(false);
                                                }
                                            }}
                                            disabled={isSaving}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <PlusCircle className="h-4 w-4 mr-1" />
                                            {isSaving ? 'Saving...' : 'Add to Proposal'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                            <div className="bg-muted/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                                <pre className="whitespace-pre-wrap text-sm font-sans">
                                    {generatedSOW}
                                </pre>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <AIUpgradeDialog
                isOpen={showUpgradeDialog}
                onClose={() => setShowUpgradeDialog(false)}
                featureName="scope_of_work"
                requiredTier="business"
            />
        </>
    );
}
