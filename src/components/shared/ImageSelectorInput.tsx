import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageEditDialog } from "@/components/proposal/viewer/ImageEditDialog";

interface ImageSelectorInputProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    subLabel?: string;
    description?: string;
}

export function ImageSelectorInput({
    value,
    onChange,
    label = "Image",
    subLabel = "(Optional)",
    description = "Upload an image or search from Unsplash to make your proposal look professional."
}: ImageSelectorInputProps) {
    const [showImageDialog, setShowImageDialog] = useState(false);

    return (
        <div className="space-y-3">
            <Label className="flex items-center gap-2">
                {label}
                {subLabel && (
                    <span className="text-xs text-muted-foreground font-normal">
                        {subLabel}
                    </span>
                )}
            </Label>

            <div className="flex gap-3 items-start">
                <div className="relative w-24 h-24 rounded-lg border bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 group">
                    {value ? (
                        <>
                            <img
                                src={value}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="text-white hover:text-white"
                                    onClick={() => onChange('')}
                                >
                                    Remove
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-muted-foreground text-xs text-center p-2">
                            No Image
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <div className="flex gap-2">
                        <Input
                            value={value}
                            readOnly
                            placeholder="No image selected"
                            className="flex-1 bg-muted"
                        />
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setShowImageDialog(true)}
                        >
                            Select Image
                        </Button>
                    </div>
                    {description && (
                        <p className="text-xs text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            <ImageEditDialog
                isOpen={showImageDialog}
                onClose={() => setShowImageDialog(false)}
                onSelect={onChange}
                title={`Select ${label}`}
                currentImage={value}
            />
        </div>
    );
}
