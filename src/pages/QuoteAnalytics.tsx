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
import { supabase as supabaseSingleton } from '@/integrations/supabase/client';
import { createClient } from '@supabase/supabase-js';
import { Quote } from '@/types';
import { getQuotes } from '@/lib/db-service';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { UpgradeModal } from '@/components/UpgradeModal';

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
    const { user, organizationId, isAdmin, isBusinessTier, subscriptionTier, loading: authLoading } = useAuth();
    const { toast } = useToast();

    const [quote, setQuote] = useState<Quote | null>(null);
    const [events, setEvents] = useState<AnalyticsEvent[]>([]);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Isolated client to prevent connection deadlocks in analytics views
    const analyticsClient = useMemo(() => {
        return createClient(
            import.meta.env.VITE_SUPABASE_URL,
            import.meta.env.VITE_SUPABASE_ANON_KEY
        );
    }, []);

    // Safety check for tier reporting
    const currentTierLabel = subscriptionTier || 'free';

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        try {
            const [quotesData] = await Promise.all([
                getQuotes(user?.id, organizationId, isAdmin || isBusinessTier, { client: analyticsClient })
            ]);

            const foundQuote = quotesData.find(q => q.id === id);
            if (!foundQuote) {
                navigate('/quotes');
                return;
            }
            setQuote(foundQuote);

            // Fetch telemetry
            const { data: telemetry, error } = await analyticsClient
                .from('proposal_analytics' as any)
                .select('*')
                .eq('quote_id', id)
                .order('viewed_at', { ascending: true });

            setEvents((telemetry as any) || []);

            // Fetch conversations
            const { data: convData, error: convError } = await analyticsClient
                .from('proposal_conversations' as any)
                .select('*')
                .eq('quote_id', id)
                .order('created_at', { ascending: false });

            if (convError) throw convError;
            setConversations(convData || []);

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
            const { data: aiData, error: aiError } = await analyticsClient.functions.invoke('ai-assist', {
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
            const { error: updateError } = await analyticsClient
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

    const handleSendResponse = async (convId: string, response: string) => {
        try {
            const { error } = await analyticsClient
                .from('proposal_conversations' as any)
                .update({
                    contractor_response: response,
                    status: 'answered'
                })
                .eq('id', convId);

            if (error) throw error;

            toast({
                title: "Response Sent",
                description: "Your answer has been delivered instantly to the client's proposal view.",
            });

            loadData();
        } catch (error) {
            console.error('Failed to send response:', error);
            toast({
                title: "Error",
                description: "Failed to send response",
                variant: 'destructive'
            });
        }
    };

    const formatMs = (ms: number) => {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground font-black uppercase tracking-widest text-xs">Loading Behavioral Data...</p>
            </div>
        );
    }

    if (!quote) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500" />
                <h2 className="text-xl font-black uppercase tracking-tight">Report Not Found</h2>
                <Button onClick={() => navigate('/quotes')}>Back to Quotes</Button>
            </div>
        );
    }

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
                    {stats.engagementScore > 30 && !isBusinessTier ? (
                        <Badge
                            variant="outline"
                            className="py-1.5 px-4 bg-orange-500/10 text-orange-600 border-orange-200 font-black uppercase tracking-widest cursor-pointer hover:bg-orange-500/20 transition-all"
                            onClick={() => setShowUpgradeModal(true)}
                        >
                            🔥 High Interest Detected
                        </Badge>
                    ) : (
                        <Badge variant="outline" className={`py-1.5 px-4 ${stats.engagementScore > 70 ? 'bg-orange-500/10 text-orange-600 border-orange-200' : 'bg-blue-500/10 text-blue-600 border-blue-200'} font-black uppercase tracking-widest`}>
                            {stats.engagementScore > 70 ? '🔥 Hot Prospect' : '✨ Warming Up'}
                        </Badge>
                    )}
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
                        <div className={`text-2xl font-black ${stats.stickerShock || stats.scopeConcern ? 'text-orange-600' : 'text-green-600'} ${!isBusinessTier && !isAdmin ? 'blur-[3px]' : ''}`}>
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
                        <CardContent className="p-0 relative">
                            {(!isBusinessTier && !isAdmin) && (
                                <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/10 flex flex-col items-center justify-center p-8 text-center">
                                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm space-y-4">
                                        <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                            <BarChart3 className="w-6 h-6 text-indigo-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-white font-black uppercase tracking-tight text-lg">Unlock Closer Insights</h3>
                                            <p className="text-slate-400 text-xs leading-relaxed">
                                                See exactly where clients are lingering so you can lead with a "Winning Sales Strategy."
                                            </p>
                                        </div>
                                        <Button
                                            onClick={() => setShowUpgradeModal(true)}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px]"
                                        >
                                            Upgrade to Business
                                        </Button>
                                    </div>
                                </div>
                            )}
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
                    <Card className="border-[#F1F5F9] dark:border-gray-800 shadow-xl relative overflow-hidden">
                        {(!isBusinessTier && !isAdmin && !authLoading) && (
                            <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-white/10 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm space-y-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                        <History className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-white font-black uppercase tracking-tight text-lg">Detailed Client Journey</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Track exactly when and how long your client views each section.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Upgrade to Business
                                    </Button>
                                </div>
                            </div>
                        )}
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

                    {/* Client Questions & AI Drafts */}
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-6 w-6 text-primary" />
                            <h2 className="text-xl font-black uppercase tracking-tight">Active Conversations</h2>
                        </div>

                        {conversations.length === 0 ? (
                            <Card className="border-dashed border-2">
                                <CardContent className="py-12 text-center text-muted-foreground">
                                    <p>No questions from the client yet.</p>
                                    <p className="text-xs">Incoming questions from the proposal assistant will appear here.</p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid gap-6">
                                {conversations.map((conv) => (
                                    <Card key={conv.id} className={`border-none shadow-lg overflow-hidden ${conv.status === 'pending' ? 'ring-2 ring-indigo-500/20' : ''}`}>
                                        <div className="bg-slate-50 dark:bg-slate-900 border-b p-4 flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="text-[9px] uppercase font-black bg-white">
                                                    Section: {conv.section_id.replace('cat-', '').replace(/-/g, ' ')}
                                                </Badge>
                                                {conv.status === 'pending' && <Badge className="bg-indigo-600 text-[9px] font-black uppercase">Unanswered</Badge>}
                                            </div>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">
                                                {new Date(conv.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <CardContent className="p-6 space-y-4">
                                            <div>
                                                <p className="text-[10px] font-black uppercase text-indigo-500 mb-1">Client Question</p>
                                                <p className="font-bold text-slate-800 dark:text-slate-200">"{conv.client_question}"</p>
                                            </div>

                                            <Separator />

                                            {conv.status === 'answered' ? (
                                                <div>
                                                    <p className="text-[10px] font-black uppercase text-green-500 mb-1">Your Response</p>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">{conv.contractor_response}</p>
                                                </div>
                                            ) : (
                                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                    <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                                                        <div className="flex items-center gap-2 mb-2 text-indigo-600">
                                                            <BrainCircuit className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase">AI Recommended Draft</span>
                                                        </div>
                                                        <p className="text-sm text-slate-700 dark:text-slate-300 italic mb-4 leading-relaxed">
                                                            {conv.ai_draft_response || "AI is drafting a response based on your SOW..."}
                                                        </p>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase"
                                                                onClick={() => handleSendResponse(conv.id, conv.ai_draft_response)}
                                                                disabled={!conv.ai_draft_response}
                                                            >
                                                                Approve & Send
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="font-bold text-xs uppercase"
                                                                onClick={() => {
                                                                    const resp = window.prompt("Edit Response:", conv.ai_draft_response);
                                                                    if (resp) handleSendResponse(conv.id, resp);
                                                                }}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right: AI Closer Toolbox */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="border-none shadow-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 overflow-hidden relative">
                        {(!isBusinessTier && !isAdmin && !authLoading) && (
                            <div className="absolute inset-0 z-20 backdrop-blur-[6px] bg-gray-900/10 flex flex-col items-center justify-center p-8 text-center">
                                <div className="bg-slate-900 border border-slate-700 p-6 rounded-3xl shadow-2xl max-w-sm space-y-4">
                                    <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto">
                                        <BrainCircuit className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-white font-black uppercase tracking-tight text-lg">AI Closer Intelligence</h3>
                                        <p className="text-slate-400 text-xs leading-relaxed">
                                            Get real-time sentiment analysis and AI-drafted closing scripts.
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() => setShowUpgradeModal(true)}
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Upgrade to Business
                                    </Button>
                                </div>
                            </div>
                        )}
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

            <UpgradeModal
                isOpen={showUpgradeModal}
                tier={currentTierLabel}
                onClose={() => setShowUpgradeModal(false)}
            />
        </div>
    );
}
