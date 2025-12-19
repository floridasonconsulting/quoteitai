import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAI } from '@/hooks/useAI';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { AIButton } from './AIButton';
import { AIUpgradeDialog } from './AIUpgradeDialog';
import { FileText, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Quote } from '@/types';

interface SOWGeneratorAIProps {
    quote: Quote;
    companyName?: string;
    onSOWGenerated?: (sow: string) => void;
}

export function SOWGeneratorAI({ quote, companyName, onSOWGenerated }: SOWGeneratorAIProps) {
    const { userRole } = useAuth();
    const [additionalContext, setAdditionalContext] = useState('');
    const [generatedSOW, setGeneratedSOW] = useState<string | null>(null);
    const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

    const sowAI = useAI('sow_generation', {
        onSuccess: (content) => {
            // Clean up any markdown code blocks
            const cleanedContent = content
                .replace(/```markdown\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            setGeneratedSOW(cleanedContent);
            onSOWGenerated?.(cleanedContent);
            toast.success('Scope of Work generated successfully!');
        },
        onUpgradeRequired: () => {
            setShowUpgradeDialog(true);
        }
    });

    const handleGenerate = async () => {
        // SOW is a Business+ feature
        if (userRole !== 'business' && userRole !== 'max' && userRole !== 'admin') {
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

        const prompt = `Generate a professional Scope of Work (SOW) document for the following project:

PROJECT TITLE: ${quote.title}
CLIENT: ${quote.customerName}
COMPANY: ${companyName || 'Our Company'}

QUOTE SUMMARY:
- Total Value: $${quote.total.toLocaleString()}
- Number of Line Items: ${quote.items.length}

DETAILED LINE ITEMS:
${JSON.stringify(itemsBreakdown, null, 2)}

${additionalContext ? `ADDITIONAL CONTEXT FROM USER:\n${additionalContext}` : ''}

EXECUTIVE SUMMARY (if available):
${quote.executiveSummary || 'Not provided'}

---

Generate a comprehensive, professional Scope of Work document with the following sections:

1. **PROJECT OVERVIEW**
   - Brief project description
   - Client and contractor information
   - Project location/context

2. **SCOPE OF WORK**
   - Detailed breakdown of all work to be performed
   - Group by category when applicable
   - Include quantities and specifications

3. **DELIVERABLES**
   - List all tangible outputs/results
   - Measurable outcomes

4. **TIMELINE & MILESTONES**
   - Estimated project duration
   - Key phases and milestones
   - Dependencies

5. **ACCEPTANCE CRITERIA**
   - How work will be evaluated
   - Quality standards
   - Sign-off requirements

6. **EXCLUSIONS**
   - What is NOT included in this scope
   - Assumptions that must be true

7. **TERMS & CONDITIONS SUMMARY**
   - Reference to main contract
   - Change order process

Format this as a professional document using markdown. Use clear headings, bullet points, and proper formatting.`;

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
                        {userRole !== 'business' && userRole !== 'max' && userRole !== 'admin' && (
                            <span className="text-xs font-normal text-muted-foreground ml-2">(Business+)</span>
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
                        isLoading={sowAI.isLoading}
                        className="w-full"
                    >
                        Generate Scope of Work
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
                featureName="sow_generation"
                requiredTier="business"
            />
        </>
    );
}
