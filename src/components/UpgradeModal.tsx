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
import { ShieldAlert, Users, Zap, BarChart3 } from 'lucide-react';

interface UpgradeModalProps {
    isOpen: boolean;
    tier: string;
    onClose: () => void;
}

export const UpgradeModal = ({ isOpen, tier, onClose }: UpgradeModalProps) => {
    const navigate = useNavigate();
    const normalizedTier = tier.toLowerCase();

    const overagePrice = normalizedTier === 'pro' ? '$25' : '$20';
    const nextTier = normalizedTier === 'starter' ? 'Pro' : (normalizedTier === 'pro' ? 'Business' : 'Enterprise');
    const nextTierLimit = normalizedTier === 'starter' ? '2' : (normalizedTier === 'pro' ? '5' : '10');

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
            <DialogContent className="sm:max-w-[500px] bg-slate-950 border-slate-800 text-white overflow-hidden p-0">
                {/* Visual Header with professional gradient */}
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-950 to-indigo-950">
                    <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                    <div className="absolute top-6 left-6 flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/20 backdrop-blur-md rounded-xl border border-indigo-500/30">
                            <Zap className="h-6 w-6 text-indigo-400 fill-indigo-400" />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Unlock the "Closer's Edge"</h2>
                    </div>
                </div>

                <div className="p-8 space-y-6">
                    <div className="space-y-4">
                        <p className="text-slate-300 leading-relaxed">
                            Your team is currently sending <span className="text-white font-bold text-lg">20+ proposals</span> a month.
                            At this volume, you aren't just managing quotes—you're managing a high-stakes sales pipeline.
                        </p>

                        <div className="space-y-4 pt-2">
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 p-1 bg-indigo-500/10 rounded-md">
                                    <BarChart3 className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm tracking-wide uppercase text-indigo-400">Behavioral Intelligence</p>
                                    <p className="text-xs text-slate-400 leading-normal">Stop guessing. Know exactly when a client is lingering on your 'Investment Summary' or 'Exclusions'.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 p-1 bg-indigo-500/10 rounded-md">
                                    <Zap className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm tracking-wide uppercase text-indigo-400">Smart SOW Architect</p>
                                    <p className="text-xs text-slate-400 leading-normal">Scale your output. Generate technical, professional Scopes of Work in seconds, not hours.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <div className="mt-1 p-1 bg-indigo-500/10 rounded-md">
                                    <Users className="h-4 w-4 text-indigo-400" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-sm tracking-wide uppercase text-indigo-400">Team Expansion</p>
                                    <p className="text-xs text-slate-400 leading-normal">Increase your base to 5 users to keep your entire sales force synced on one platform.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                        <p className="text-xs text-slate-300 italic leading-relaxed text-center">
                            "If these insights help you close just <span className="text-white font-bold">one extra $5,000 project</span> this year,
                            the Business Tier has already paid for itself 5x over."
                        </p>
                    </div>

                    <div className="space-y-3 pt-2">
                        <Button
                            onClick={handleUpgrade}
                            className="w-full h-14 text-base font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)]"
                        >
                            Upgrade to Business — $149/mo
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full text-slate-500 hover:text-slate-300 hover:bg-white/5 font-bold uppercase tracking-widest text-[10px]"
                        >
                            Maybe later
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
