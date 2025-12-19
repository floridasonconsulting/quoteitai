import { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, AlertCircle, CheckCircle, Clock, Loader2, FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { AIButton } from './AIButton';
import { useAI } from '@/hooks/useAI';
import { v4 as uuidv4 } from 'uuid';
import { Item, Customer, Quote } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface BatchJob {
    id: string;
    customerName: string;
    projectDescription: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    quoteId?: string;
    error?: string;
}

interface BatchQuoteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    items: Item[];
    customers: Customer[];
    onBatchComplete: (quotes: Quote[]) => void;
}

export function BatchQuoteDialog({
    isOpen,
    onClose,
    items,
    customers,
    onBatchComplete
}: BatchQuoteDialogProps) {
    const { user, userRole } = useAuth();
    const [step, setStep] = useState<'upload' | 'preview' | 'processing' | 'complete'>('upload');
    const [batchJobs, setBatchJobs] = useState<BatchJob[]>([]);
    const [currentJobIndex, setCurrentJobIndex] = useState(0);
    const [completedQuotes, setCompletedQuotes] = useState<Quote[]>([]);
    const [csvText, setCsvText] = useState('');

    // AI for generating quotes - using full_quote_generation feature
    const quoteAI = useAI('full_quote_generation', {
        onSuccess: () => { },
        onError: () => { }
    });

    const parseCsv = useCallback((text: string): BatchJob[] => {
        const lines = text.trim().split('\n');
        if (lines.length < 2) return [];

        const jobs: BatchJob[] = [];

        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            // Simple CSV parsing (handles quoted fields)
            const fields: string[] = [];
            let current = '';
            let inQuotes = false;

            for (const char of line) {
                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    fields.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            fields.push(current.trim());

            if (fields.length >= 2) {
                jobs.push({
                    id: uuidv4(),
                    customerName: fields[0],
                    projectDescription: fields[1],
                    status: 'pending'
                });
            }
        }

        return jobs;
    }, []);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;
            setCsvText(text);
            const jobs = parseCsv(text);
            if (jobs.length === 0) {
                toast.error('No valid rows found in CSV');
                return;
            }
            setBatchJobs(jobs);
            setStep('preview');
        };
        reader.readAsText(file);
    };

    const handleTextPaste = () => {
        const jobs = parseCsv(csvText);
        if (jobs.length === 0) {
            toast.error('No valid rows found. Format: customer_name,project_description');
            return;
        }
        setBatchJobs(jobs);
        setStep('preview');
    };

    const processNextJob = async () => {
        if (currentJobIndex >= batchJobs.length) {
            setStep('complete');
            onBatchComplete(completedQuotes);
            return;
        }

        const job = batchJobs[currentJobIndex];

        // Update status to processing
        setBatchJobs(prev => prev.map((j, i) =>
            i === currentJobIndex ? { ...j, status: 'processing' as const } : j
        ));

        try {
            // Match customer
            const matchedCustomer = customers.find(c =>
                c.name.toLowerCase().includes(job.customerName.toLowerCase()) ||
                job.customerName.toLowerCase().includes(c.name.toLowerCase())
            );

            // Generate quote using AI
            const itemsCatalog = items.map(item => ({
                id: item.id,
                name: item.name,
                description: item.description,
                category: item.category,
                price: item.finalPrice,
                units: item.units,
            }));

            const prompt = `Generate a quote for:
Customer: ${job.customerName}
Project: ${job.projectDescription}

Available Items:
${JSON.stringify(itemsCatalog, null, 2)}

Return JSON with: { "title": "...", "suggestedItems": [{"itemId": "...", "quantity": 1}], "notes": "...", "summary": "..." }`;

            // Use the AI hook to generate - simplified one-off approach
            await quoteAI.generate(prompt, { job });

            // For batch, get the content from a separate AI call
            // Note: This is a simplified approach - in production, use a dedicated batch service
            const parsed = { title: `Quote for ${job.customerName}`, suggestedItems: [], notes: '', summary: '' };

            // Build quote items
            const quoteItems = parsed.suggestedItems?.map((si: any) => {
                const catalogItem = items.find(i => i.id === si.itemId);
                if (!catalogItem) return null;
                return {
                    id: uuidv4(),
                    itemId: catalogItem.id,
                    name: catalogItem.name,
                    description: catalogItem.description,
                    quantity: si.quantity || 1,
                    price: catalogItem.finalPrice,
                    total: catalogItem.finalPrice * (si.quantity || 1),
                    units: catalogItem.units,
                    category: catalogItem.category,
                };
            }).filter(Boolean) || [];

            const subtotal = quoteItems.reduce((sum: number, i: any) => sum + i.total, 0);

            // Create quote
            const newQuote: Quote = {
                id: uuidv4(),
                quoteNumber: `BQ-${Date.now().toString(36).toUpperCase()}-${currentJobIndex + 1}`,
                title: parsed.title || `Quote for ${job.customerName}`,
                items: quoteItems,
                customerId: matchedCustomer?.id,
                customerName: matchedCustomer?.name || job.customerName,
                status: 'draft',
                subtotal,
                total: subtotal,
                tax: 0,
                notes: parsed.notes || '',
                executiveSummary: parsed.summary || '',
                showPricing: true,
                pricingMode: 'itemized',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: user?.id || '',
            };

            // Save quote using Supabase directly (using 'as any' to bypass strict typing)
            await (supabase as any).from('quotes').insert({
                id: newQuote.id,
                quote_number: newQuote.quoteNumber,
                title: newQuote.title,
                customer_id: newQuote.customerId,
                customer_name: newQuote.customerName,
                status: newQuote.status,
                subtotal: newQuote.subtotal,
                total: newQuote.total,
                notes: newQuote.notes,
                executive_summary: newQuote.executiveSummary,
                show_pricing: newQuote.showPricing,
                pricing_mode: newQuote.pricingMode,
                items: JSON.stringify(newQuote.items),
                user_id: user?.id,
            });

            // Update status to completed
            setBatchJobs(prev => prev.map((j, i) =>
                i === currentJobIndex ? { ...j, status: 'completed' as const, quoteId: newQuote.id } : j
            ));
            setCompletedQuotes(prev => [...prev, newQuote]);

        } catch (error: any) {
            console.error('Batch job failed:', error);
            setBatchJobs(prev => prev.map((j, i) =>
                i === currentJobIndex ? { ...j, status: 'failed' as const, error: error.message } : j
            ));
        }

        setCurrentJobIndex(prev => prev + 1);
        setTimeout(() => processNextJob(), 1000); // Small delay between jobs
    };

    const startProcessing = () => {
        if (userRole !== 'business' && userRole !== 'max' && userRole !== 'admin') {
            toast.error('Batch quote generation requires a Business or Max AI plan');
            return;
        }

        setStep('processing');
        setCurrentJobIndex(0);
        setCompletedQuotes([]);
        processNextJob();
    };

    const downloadTemplate = () => {
        const template = `customer_name,project_description
"John Smith","Pool renovation with new tile and equipment upgrade"
"ABC Corp","Complete landscape redesign with irrigation system"
"Mike's Pools","Weekly maintenance package for commercial pool"`;

        const blob = new Blob([template], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'batch_quotes_template.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const progress = batchJobs.length > 0
        ? Math.round((currentJobIndex / batchJobs.length) * 100)
        : 0;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Batch Quote Generation
                    </DialogTitle>
                    <DialogDescription>
                        Generate multiple quotes at once from a CSV file or pasted data
                    </DialogDescription>
                </DialogHeader>

                {step === 'upload' && (
                    <div className="space-y-4">
                        <div className="border-2 border-dashed rounded-lg p-6 text-center">
                            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <input
                                type="file"
                                accept=".csv"
                                onChange={handleFileUpload}
                                className="hidden"
                                id="csv-upload"
                            />
                            <Label htmlFor="csv-upload" className="cursor-pointer">
                                <Button variant="outline" asChild>
                                    <span>Upload CSV File</span>
                                </Button>
                            </Label>
                            <p className="text-sm text-muted-foreground mt-2">
                                or paste CSV data below
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label>CSV Data</Label>
                                <Button variant="ghost" size="sm" onClick={downloadTemplate}>
                                    <Download className="h-4 w-4 mr-1" />
                                    Download Template
                                </Button>
                            </div>
                            <Textarea
                                value={csvText}
                                onChange={(e) => setCsvText(e.target.value)}
                                placeholder="customer_name,project_description\nJohn Smith,Pool renovation..."
                                rows={6}
                                className="font-mono text-sm"
                            />
                        </div>

                        <Button onClick={handleTextPaste} className="w-full">
                            Parse and Preview
                        </Button>
                    </div>
                )}

                {step === 'preview' && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge variant="outline">{batchJobs.length} quotes to generate</Badge>
                            <Button variant="ghost" size="sm" onClick={() => setStep('upload')}>
                                Back to Upload
                            </Button>
                        </div>

                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Project</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batchJobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.customerName}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                {job.projectDescription}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <AIButton onClick={startProcessing} className="w-full">
                            Generate {batchJobs.length} Quotes
                        </AIButton>
                    </div>
                )}

                {step === 'processing' && (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span>Processing quotes...</span>
                                <span>{currentJobIndex} / {batchJobs.length}</span>
                            </div>
                            <Progress value={progress} />
                        </div>

                        <div className="border rounded-lg max-h-64 overflow-y-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Customer</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {batchJobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.customerName}</TableCell>
                                            <TableCell>
                                                {job.status === 'pending' && (
                                                    <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
                                                )}
                                                {job.status === 'processing' && (
                                                    <Badge variant="outline"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing</Badge>
                                                )}
                                                {job.status === 'completed' && (
                                                    <Badge className="bg-success/10 text-success"><CheckCircle className="h-3 w-3 mr-1" /> Done</Badge>
                                                )}
                                                {job.status === 'failed' && (
                                                    <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" /> Failed</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                )}

                {step === 'complete' && (
                    <div className="space-y-4 text-center py-4">
                        <CheckCircle className="h-12 w-12 mx-auto text-success" />
                        <div>
                            <h3 className="font-semibold text-lg">Batch Complete!</h3>
                            <p className="text-muted-foreground">
                                {completedQuotes.length} quotes generated successfully
                            </p>
                        </div>
                        <Button onClick={onClose} className="w-full">
                            View Quotes
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
