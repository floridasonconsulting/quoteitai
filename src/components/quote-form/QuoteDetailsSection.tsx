import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "lucide-react";
import { AIButton } from "@/components/AIButton";
import { Customer } from "@/types";

interface QuoteDetailsSectionProps {
  customers: Customer[];
  selectedCustomerId: string;
  onCustomerChange: (id: string) => void;
  quoteTitle: string;
  onTitleChange: (title: string) => void;
  onGenerateTitle: () => void;
  isTitleGenerating: boolean;
  quoteNotes: string;
  onNotesChange: (notes: string) => void;
  onGenerateNotes: () => void;
  isNotesGenerating: boolean;
  isGenerationDisabled: boolean;
}

export function QuoteDetailsSection({
  customers,
  selectedCustomerId,
  onCustomerChange,
  quoteTitle,
  onTitleChange,
  onGenerateTitle,
  isTitleGenerating,
  quoteNotes,
  onNotesChange,
  onGenerateNotes,
  isNotesGenerating,
  isGenerationDisabled,
}: QuoteDetailsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Quote Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customer">Select Customer *</Label>
          <Select value={selectedCustomerId} onValueChange={onCustomerChange} data-demo="customer-select">
            <SelectTrigger>
              <SelectValue placeholder="Choose a customer..." />
            </SelectTrigger>
            <SelectContent>
              {customers.map(customer => (
                <SelectItem key={customer.id} value={customer.id}>
                  <div>
                    <div>{customer.name}</div>
                    {(customer.contactFirstName || customer.contactLastName) && (
                      <div className="text-xs text-muted-foreground">
                        Contact: {customer.contactFirstName} {customer.contactLastName}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Quote Title *</Label>
          <div className="flex gap-2">
            <Input
              id="title"
              value={quoteTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Website Development Project"
              className="flex-1"
              data-demo="title-input"
            />
            <AIButton
              onClick={onGenerateTitle}
              isLoading={isTitleGenerating}
              disabled={isGenerationDisabled}
              data-demo="title-ai-button"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="notes">Notes</Label>
            <AIButton
              onClick={onGenerateNotes}
              isLoading={isNotesGenerating}
              disabled={isGenerationDisabled}
              data-demo="notes-ai-button"
            >
              Generate Terms
            </AIButton>
          </div>
          <Textarea
            id="notes"
            value={quoteNotes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Additional information..."
            rows={3}
            data-demo="notes-textarea"
          />
        </div>
      </CardContent>
    </Card>
  );
}
