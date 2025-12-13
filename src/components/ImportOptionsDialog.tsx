import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { FileText, SkipForward, RefreshCw, X } from 'lucide-react';

export type DuplicateStrategy = 'skip' | 'overwrite' | 'error';

interface ImportOptionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (strategy: DuplicateStrategy) => void;
  fileName: string;
  entityType: 'customers' | 'items';
}

export function ImportOptionsDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  fileName,
  entityType 
}: ImportOptionsDialogProps) {
  const [strategy, setStrategy] = useState<DuplicateStrategy>('skip');

  const handleConfirm = () => {
    onConfirm(strategy);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import Options</DialogTitle>
          <DialogDescription>
            Choose how to handle duplicate {entityType} during import
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium truncate">{fileName}</span>
          </div>

          <RadioGroup value={strategy} onValueChange={(value) => setStrategy(value as DuplicateStrategy)}>
            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="skip" id="skip" className="mt-1" />
              <Label htmlFor="skip" className="cursor-pointer flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <SkipForward className="h-4 w-4 text-primary" />
                  <span className="font-medium">Skip duplicates (recommended)</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep existing records and only import new ones
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="overwrite" id="overwrite" className="mt-1" />
              <Label htmlFor="overwrite" className="cursor-pointer flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="h-4 w-4 text-primary" />
                  <span className="font-medium">Overwrite existing</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Replace existing records with imported data
                </p>
              </Label>
            </div>

            <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 cursor-pointer">
              <RadioGroupItem value="error" id="error" className="mt-1" />
              <Label htmlFor="error" className="cursor-pointer flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <X className="h-4 w-4 text-primary" />
                  <span className="font-medium">Cancel on duplicates</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Report duplicates as errors and don't import them
                </p>
              </Label>
            </div>
          </RadioGroup>
        </div>

        <div className="flex gap-2 justify-end pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
