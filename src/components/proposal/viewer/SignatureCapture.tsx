import React, { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { RotateCcw, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignatureCaptureProps {
    onSave: (signatureData: string) => void;
    onClear?: () => void;
    className?: string;
}

export function SignatureCapture({ onSave, onClear, className }: SignatureCaptureProps) {
    const sigCanvas = useRef<SignatureCanvas>(null);
    const [isEmpty, setIsEmpty] = useState(true);

    const clear = () => {
        sigCanvas.current?.clear();
        setIsEmpty(true);
        if (onClear) onClear();
    };

    const save = () => {
        if (sigCanvas.current?.isEmpty()) return;
        const data = sigCanvas.current?.getTrimmedCanvas().toDataURL('image/png');
        if (data) {
            onSave(data);
        }
    };

    return (
        <div className={cn("flex flex-col gap-4", className)}>
            <div className="border rounded-md bg-white overflow-hidden relative">
                <SignatureCanvas
                    ref={sigCanvas}
                    penColor="black"
                    canvasProps={{
                        className: "w-full h-40 cursor-crosshair",
                        style: { width: '100%', height: '160px' }
                    }}
                    onBegin={() => setIsEmpty(false)}
                />
                <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground pointer-events-none uppercase tracking-widest font-medium opacity-50">
                    Sign Above
                </div>
            </div>

            <div className="flex justify-between gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={clear}
                    className="flex-1"
                >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Clear
                </Button>
                <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={save}
                    disabled={isEmpty}
                    className="flex-1"
                >
                    <Check className="h-4 w-4 mr-2" />
                    Adopt Signature
                </Button>
            </div>
        </div>
    );
}
