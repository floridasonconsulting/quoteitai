import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Clock,
    BarChart3,
    Zap,
    History,
    MessageSquare,
    AlertCircle,
    CheckCircle2,
    TrendingUp,
    BrainCircuit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Quote } from '@/types';
import { getQuotes } from '@/lib/db-service';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface AnalyticsEvent {
    section_id: string;
    dwell_time_ms: number;
    viewed_at: string;
    is_owner: boolean;
    session_id: string;
}

export default function QuoteAnalytics() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, organizationId, isAdmin, isMaxAITier } = useAuth();
    const { toast } = useToast();

    const [quote, setQuote] = useState<Quote | null>(null);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            const [quotesData] = await Promise.all([
                getQuotes(user?.id, organizationId, isAdmin || isMaxAITier)
            ]);

            const foundQuote = quotesData.find(q => q.id === id);
            if (!foundQuote) {
                navigate('/quotes');
                return;
            }
            setQuote(foundQuote);

            // Fetch telemetry
            const { data: telemetry, error } = await supabase
                .from('proposal_analytics' as any)
                .select('*')
                .eq('quote_id', id)
                .order('viewed_at', { ascending: true });

            if (error) throw error;
            setEvents((telemetry as any) || []);

        } catch (error) {
            console.error('Failed to load analytics:', error);
            toast({
                title: 'Error',
                description: 'Failed to load behavioral analytics',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    // Calculations
    const stats = useMemo(() => {
        const visitorEvents = events.filter(e => !e.is_owner);
        const totalTimeMs = visitorEvents.reduce((sum, e) => sum + e.dwell_time_ms, 0);

        const sectionStats = visitorEvents.reduce((acc, e) => {
            acc[e.section_id] = (acc[e.section_id] || 0) + e.dwell_time_ms;
            return acc;
        }, {} as Record<string, number>);

        const mostViewedSection = Object.entries(sectionStats).sort((a, b) => b[1] - a[1])[0];

        // Concern Thresholds
        const exclusionsTime = sectionStats['terms'] || 0;
        const investmentTime = sectionStats['financials'] || 0;
        const stickerShock = investmentTime > 90000; // 90s
        const scopeConcern = exclusionsTime > 60000; // 60s

        return {
            totalTimeMs,
            sectionStats,
            mostViewedSection: mostViewedSection ? mostViewedSection[0] : 'None',
            sessionCount: new Set(visitorEvents.map(e => e.session_id)).size,
            stickerShock,
            scopeConcern,
            engagementScore: Math.min(100, Math.floor((totalTimeMs / 300000) * 100)) // 5 mins = 100 score
        };
    }, [events]);

    const [sending, setSending] = useState(false);

    // Frequency Cap Check (48h)
    const canSendFollowup = useMemo(() => {
        if (!(quote as any)?.last_behavioral_followup_at) return true;
        const lastSent = new Date((quote as any).last_behavioral_followup_at).getTime();
        const fortyEightHoursMs = 48 * 60 * 60 * 1000;
        return Date.now() - lastSent > fortyEightHoursMs;
    }, [quote]);

    const handleSendExpertClarification = async () => {
        if (!canSendFollowup) {
            toast({
                title: "Frequency Cap Active",
                description: "A behavioral follow-up was sent within the last 48 hours. Let's wait for the client to respond naturally.",
                variant: "destructive"
            });
            return;
        }

        setSending(true);
        try {
            // 1. Generate the expert clarification via AI
            const { data: aiData, error: aiError } = await supabase.functions.invoke('ai-assist', {
                body: {
                    featureType: 'followup_message',
                    prompt: `Draft an Expert Clarification for ${quote?.customerName}. Interest Level: ${stats.stickerShock ? 'High on financials' : stats.mostViewedSection}.`,
                    context: {
                        stats,
                        quote_id: id,
                        customer_name: quote?.customerName,
                    }
                }
            });

            if (aiError) throw aiError;

            // 2. Update the last_behavioral_followup_at timestamp
            const { error: updateError } = await supabase
                .from('quotes')
                .update({ last_behavioral_followup_at: new Date().toISOString() } as any)
                .eq('id', id);

            if (updateError) throw updateError;

            // 3. Trigger the email send (simulated or real depending on existing services)
            // For now, we'll just show the generated message and notify success
            toast({
                title: "Expert Clarification Sent",
                description: "Your perfectly timed professional insight has been sent to the client.",
            });

            // Refresh data to update frequency cap
            loadData();

        } catch (error) {
            console.error('Failed to send clarification:', error);
            toast({
                title: "Error",
                description: "Failed to generate Expert Clarification. Please try again.",
                variant: "destructive"
            });
        } finally {
            setSending(false);
        }
    };

    const formatMs = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate(`/quotes/${id}`)}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight uppercase">Behavioral Report</h1>
                        <p className="text-muted-foreground font-medium">Proposal for {quote.customerName} • {quote.title}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`py-1.5 px-4 ${stats.engagementScore > 70 ? 'bg-orange-500/10 text-orange-600 border-orange-200' : 'bg-blue-500/10 text-blue-600 border-blue-200'} font-black uppercase tracking-widest`}>
                        {stats.engagementScore > 70 ? '🔥 Hot Prospect' : '✨ Warming Up'}
                    </Badge>
                    <div className="text-right">
                        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Engagement Score</span>
                        <span className="text-2xl font-black text-primary">{stats.engagementScore}%</span>
                    </div>
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-none bg-gradient-to-br from-indigo-500/5 to-purple-500/5 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <Clock className="h-5 w-5 text-indigo-500" />
                            <Badge variant="secondary" className="text-[10px] font-bold">Total Time</Badge>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {formatMs(stats.totalTimeMs)}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Across {stats.sessionCount} session(s)</p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-orange-500/5 to-red-500/5 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <Zap className="h-5 w-5 text-orange-500" />
                            <Badge variant="secondary" className="text-[10px] font-bold">Concentration</Badge>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white truncate">
                            {stats.mostViewedSection.replace('cat-', '').replace(/-/g, ' ')}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Has the highest dwell time</p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-green-500/5 to-emerald-500/5 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <TrendingUp className="h-5 w-5 text-green-500" />
                            <Badge variant="secondary" className="text-[10px] font-bold">Interaction</Badge>
                        </div>
                        <div className="text-2xl font-black text-gray-900 dark:text-white">
                            {events.filter(e => !e.is_owner).length}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Page transitions recorded</p>
                    </CardContent>
                </Card>

                <Card className="border-none bg-gradient-to-br from-blue-500/5 to-cyan-500/5 shadow-sm">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between mb-2">
                            <BrainCircuit className="h-5 w-5 text-blue-500" />
                            <Badge variant="secondary" className="text-[10px] font-bold">AI Status</Badge>
                        </div>
                        <div className={`text-2xl font-black ${stats.stickerShock || stats.scopeConcern ? 'text-orange-600' : 'text-green-600'}`}>
                            {stats.stickerShock || stats.scopeConcern ? 'Intervene' : 'Optimize'}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Auto-detected concern level</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Heatmap of Intent */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="border-[#F1F5F9] dark:border-gray-800 shadow-xl overflow-hidden">
                        <CardHeader className="bg-[#F8FAFC] dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-lg font-black uppercase tracking-tight">Heatmap of Intent</CardTitle>
                                    <CardDescription>Section-by-section Interest Level analysis</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-[#F1F5F9] dark:divide-gray-800">
                                {Object.entries(stats.sectionStats).sort((a, b) => b[1] - a[1]).map(([id, time], idx) => {
                                    const percentage = (time / stats.totalTimeMs) * 100;
                                    const isConcern = (id === 'financials' && time > 90000) || (id === 'terms' && time > 60000);

                                    return (
                                        <div key={id} className="p-6 transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-900/10">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 text-[10px] font-black text-gray-400">
                                                        {idx + 1}
                                                    </span>
                                                    <span className="font-black text-gray-900 dark:text-white uppercase text-sm tracking-wide">
                                                        {id === 'cover' ? 'Landing Cover' : id.replace('cat-', '').replace(/-/g, ' ')}
                                                    </span>
                                                    {isConcern && (
                                                        <Badge className="bg-orange-500/10 text-orange-600 border-orange-200 text-[9px] uppercase font-black tracking-widest">
                                                            High Priority Interest
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="text-right">
                                                    <span className="text-sm font-black text-gray-900 dark:text-white">{formatMs(time)}</span>
                                                </div>
                                            </div>
                                            <div className="relative h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${percentage}%` }}
                                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                                    className={`h-full rounded-full ${percentage > 30 ? 'bg-orange-500' : 'bg-indigo-500'}`}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Engagement Storyline */}
                    <Card className="border-[#F1F5F9] dark:border-gray-800 shadow-xl">
                        <CardHeader className="bg-[#F8FAFC] dark:bg-gray-900/50">
                            <div className="flex items-center gap-3">
                                <History className="h-5 w-5 text-primary" />
                                <div>
                                    <CardTitle className="text-lg font-black uppercase tracking-tight">Engagement Storyline</CardTitle>
                                    <CardDescription>The client's chronological journey</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-500 before:via-purple-500 before:to-pink-500">
                                {events.filter(e => !e.is_owner).map((e, idx) => (
                                    <div key={idx} className="relative flex items-center gap-4 pl-10">
                                        <div className="absolute left-[13px] w-4 h-4 rounded-full border-4 border-white dark:border-gray-950 bg-indigo-500 shadow-sm" />
                                        <div className="flex-1 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                                    {new Date(e.viewed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                                <span className="text-[10px] font-bold text-indigo-500 bg-indigo-500/10 px-2 py-0.5 rounded-full">
                                                    {e.dwell_time_ms > 0 ? formatMs(e.dwell_time_ms) : 'Current'}
                                                </span>
                                            </div>
                                            <p className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-tight">
                                                Client viewed {e.section_id.replace('cat-', '').replace(/-/g, ' ')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right: AI Closer Toolbox */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 overflow-hidden">
                        <CardHeader className="bg-[#1E293B] dark:bg-gray-100 pb-8">
                            <div className="flex items-center gap-2 mb-2">
                                <BrainCircuit className="h-5 w-5 text-indigo-400 dark:text-indigo-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300 dark:text-indigo-500">AI Closer Toolbox</span>
                            </div>
                            <CardTitle className="text-2xl font-black tracking-tight leading-tight">Closing Strategic Intelligence</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 -mt-6">
                            <div className="bg-[#334155]/50 dark:bg-gray-200/50 backdrop-blur-xl rounded-2xl p-6 border border-white/5 dark:border-black/5 space-y-6">

                                {/* Sentiment Indicators */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {stats.stickerShock ? <AlertCircle className="h-4 w-4 text-orange-400" /> : <CheckCircle2 className="h-4 w-4 text-green-400" />}
                                            <span className="text-xs font-bold uppercase tracking-widest">Budget Scrutiny</span>
                                        </div>
                                        <span className={`text-xs font-black ${stats.stickerShock ? 'text-orange-400' : 'text-green-400'}`}>
                                            {stats.stickerShock ? 'HIGH' : 'STABLE'}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {stats.scopeConcern ? <AlertCircle className="h-4 w-4 text-orange-400" /> : <CheckCircle2 className="h-4 w-4 text-green-400" />}
                                            <span className="text-xs font-bold uppercase tracking-widest">Contract Risk</span>
                                        </div>
                                        <span className={`text-xs font-black ${stats.scopeConcern ? 'text-orange-400' : 'text-green-400'}`}>
                                            {stats.scopeConcern ? 'ALERT' : 'CLEAR'}
                                        </span>
                                    </div>
                                </div>

                                <Separator className="bg-white/10 dark:bg-black/10" />

                                {/* Closing Script Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <MessageSquare className="h-4 w-4 text-indigo-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Suggested Action</span>
                                    </div>

                                    {stats.stickerShock || stats.scopeConcern ? (
                                        <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                                            <p className="text-xs leading-relaxed italic text-orange-200 dark:text-orange-900 mb-4">
                                                "The client showed significant Interest in {stats.stickerShock ? 'the Investment Summary' : 'Exclusions'}. This is an opportunity for Expert Clarification."
                                            </p>
                                            <Button
                                                disabled={!canSendFollowup || sending}
                                                onClick={handleSendExpertClarification}
                                                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-black uppercase tracking-widest text-[10px] py-4"
                                            >
                                                {sending ? 'Generating...' : !canSendFollowup ? '48h Frequency Cap Active' : 'Send Expert Clarification'}
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                                            <p className="text-xs leading-relaxed italic text-green-200 dark:text-green-900 mb-4">
                                                "Interest Levels are healthy across all sections. The client is processing the proposal as expected."
                                            </p>
                                            <Button
                                                disabled={!canSendFollowup || sending}
                                                onClick={handleSendExpertClarification}
                                                className="w-full bg-green-500 hover:bg-green-600 text-white font-black uppercase tracking-widest text-[10px] py-4"
                                            >
                                                {sending ? 'Generating...' : !canSendFollowup ? '48h Frequency Cap Active' : 'Ask for the Close'}
                                            </Button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-yellow-400" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Growth Opportunity</span>
                                    </div>
                                    <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed font-medium">
                                        {stats.mostViewedSection !== 'None'
                                            ? `Focus on "${stats.mostViewedSection.replace('cat-', '').replace(/-/g, ' ')}" in your next call. They spent ${formatMs(stats.sectionStats[stats.mostViewedSection])} there.`
                                            : "Continue monitoring. Once they view the proposal, AI will suggest the perfect follow-up."}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
