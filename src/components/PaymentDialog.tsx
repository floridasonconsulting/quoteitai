import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Card, CardContent } from './ui/card';
import { Loader2, CreditCard, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { calculateDepositAmount } from '@/lib/stripe-service';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quoteTotal: number;
  onConfirmPayment: (paymentType: 'full' | 'deposit', depositPercentage?: number) => Promise<void>;
}

export function PaymentDialog({
  open,
  onOpenChange,
  quoteTotal,
  onConfirmPayment,
}: PaymentDialogProps) {
  const [paymentType, setPaymentType] = useState<'full' | 'deposit'>('full');
  const [depositPercentage, setDepositPercentage] = useState<number>(30);
  const [isProcessing, setIsProcessing] = useState(false);

  const depositAmount = calculateDepositAmount(quoteTotal, depositPercentage);
  const paymentAmount = paymentType === 'full' ? quoteTotal : depositAmount;

  const handlePayment = async () => {
    setIsProcessing(true);
    try {
      await onConfirmPayment(
        paymentType,
        paymentType === 'deposit' ? depositPercentage : undefined
      );
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Select Payment Option
          </DialogTitle>
          <DialogDescription>
            Choose how you'd like to pay for this quote
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={paymentType}
            onValueChange={(value) => setPaymentType(value as 'full' | 'deposit')}
            className="space-y-3"
          >
            {/* Full Payment Option */}
            <Card className={paymentType === 'full' ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Pay in Full</p>
                        <p className="text-sm text-muted-foreground">
                          Complete payment now
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatCurrency(quoteTotal)}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </CardContent>
            </Card>

            {/* Deposit Option */}
            <Card className={paymentType === 'deposit' ? 'border-primary' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <RadioGroupItem value="deposit" id="deposit" />
                  <Label htmlFor="deposit" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Pay Deposit</p>
                        <p className="text-sm text-muted-foreground">
                          Pay partial amount now
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {formatCurrency(depositAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {depositPercentage}% deposit
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                {paymentType === 'deposit' && (
                  <div className="mt-4 space-y-2">
                    <Label className="text-sm">Deposit Percentage</Label>
                    <div className="flex gap-2">
                      {[30, 50, 100].map((percent) => (
                        <Button
                          key={percent}
                          type="button"
                          variant={depositPercentage === percent ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDepositPercentage(percent)}
                          className="flex-1"
                        >
                          {percent}%
                        </Button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Remaining: {formatCurrency(quoteTotal - depositAmount)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </RadioGroup>

          {/* Payment Summary */}
          <Card className="bg-muted">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">Payment Amount:</span>
                <span className="font-bold text-lg">{formatCurrency(paymentAmount)}</span>
              </div>
              {paymentType === 'deposit' && (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Quote Total:</span>
                    <span>{formatCurrency(quoteTotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Deposit ({depositPercentage}%):</span>
                    <span>{formatCurrency(depositAmount)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-semibold mt-1 pt-1 border-t">
                    <span>Remaining Due:</span>
                    <span>{formatCurrency(quoteTotal - depositAmount)}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Proceed to Payment
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
