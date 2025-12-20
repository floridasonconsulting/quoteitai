import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Users, Zap } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    tier: string;
    onClose: () => void;
}

export const UpgradeModal = ({ isOpen, tier, onClose }: UpgradeModalProps) => {
    const navigate = useNavigate();
    const normalizedTier = tier.toLowerCase();

    const overagePrice = normalizedTier === 'pro' ? '$15' : '$10';
    const nextTier = normalizedTier === 'starter' ? 'Pro' : 'Business';
    const nextTierLimit = normalizedTier === 'starter' ? '3' : '10';

    const handleAddSeat = () => {
        onClose();
        navigate('/settings?tab=subscription&add_seat=true');
    };

    const handleUpgrade = () => {
        onClose();
        navigate('/settings?tab=subscription&upgrade=true');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-amber-100 rounded-full">
                            <ShieldAlert className="h-6 w-6 text-amber-600" />
                        </div>
                        <DialogTitle className="text-xl font-bold">Seat Limit Reached</DialogTitle>
                    </div>
                    <DialogDescription className="text-base text-gray-600">
                        Your <span className="font-semibold text-gray-900 uppercase">{tier}</span> plan includes a specific number of seats.
                        To add this team member, you can expand your team for just <span className="font-bold text-gray-900">{overagePrice}/mo</span> per seat.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-6 space-y-4">
                    <Button
                        onClick={handleAddSeat}
                        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md"
                    >
                        <Users className="mr-2 h-5 w-5" />
                        Add Seat for {overagePrice}/mo
                    </Button>

                    {normalizedTier !== 'business' && normalizedTier !== 'max_ai' && (
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-white px-2 text-gray-500 font-medium">Or grow with a bigger plan</span>
                            </div>
                        </div>
                    )}

                    {normalizedTier !== 'business' && normalizedTier !== 'max_ai' && (
                        <Button
                            variant="outline"
                            onClick={handleUpgrade}
                            className="w-full h-12 text-base font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 transition-all"
                        >
                            <Zap className="mr-2 h-5 w-5 text-amber-500 fill-amber-500" />
                            Upgrade to {nextTier} ({nextTierLimit} Seats)
                        </Button>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={onClose} className="w-full text-gray-400 hover:text-gray-600">
                        Maybe later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
