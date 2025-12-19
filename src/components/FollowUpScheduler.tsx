import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Mail, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Quote } from '@/types';

interface FollowUpSchedule {
    id: string;
    quote_id: string;
    schedule_type: 'one_time' | 'recurring';
    frequency_days: number | null;
    max_follow_ups: number;
    follow_ups_sent: number;
    next_send_at: string;
    last_sent_at: string | null;
    status: 'active' | 'paused' | 'completed' | 'cancelled';
    subject_template: string | null;
    message_template: string | null;
}

interface FollowUpSchedulerProps {
    quote: Quote;
    companyName?: string;
}

export function FollowUpScheduler({ quote, companyName }: FollowUpSchedulerProps) {
    const { user } = useAuth();
    const [schedule, setSchedule] = useState<FollowUpSchedule | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form state for new schedule
    const [scheduleType, setScheduleType] = useState<'one_time' | 'recurring'>('recurring');
    const [daysUntilFirst, setDaysUntilFirst] = useState(3);
    const [frequencyDays, setFrequencyDays] = useState(7);
    const [maxFollowUps, setMaxFollowUps] = useState(3);
    const [customSubject, setCustomSubject] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [useCustomMessage, setUseCustomMessage] = useState(false);

    useEffect(() => {
        loadSchedule();
    }, [quote.id]);

    const loadSchedule = async () => {
        if (!user?.id) return;

        setIsLoading(true);
        try {
            // Using 'as any' until types are regenerated after migration
            const { data, error } = await (supabase as any)
                .from('follow_up_schedules')
                .select('*')
                .eq('quote_id', quote.id)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;
            setSchedule(data as FollowUpSchedule | null);
        } catch (error) {
            console.error('Failed to load schedule:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateSchedule = async () => {
        if (!user?.id) return;

        setIsSaving(true);
        try {
            const nextSendAt = new Date();
            nextSendAt.setDate(nextSendAt.getDate() + daysUntilFirst);

            const { data, error } = await (supabase as any)
                .from('follow_up_schedules')
                .insert({
                    user_id: user.id,
                    quote_id: quote.id,
                    schedule_type: scheduleType,
                    frequency_days: scheduleType === 'recurring' ? frequencyDays : null,
                    max_follow_ups: maxFollowUps,
                    next_send_at: nextSendAt.toISOString(),
                    subject_template: useCustomMessage ? customSubject : null,
                    message_template: useCustomMessage ? customMessage : null,
                    status: 'active',
                })
                .select()
                .single();

            if (error) throw error;

            setSchedule(data as FollowUpSchedule);
            toast.success('Follow-up schedule created');
        } catch (error: any) {
            console.error('Failed to create schedule:', error);
            toast.error(error.message || 'Failed to create schedule');
        } finally {
            setIsSaving(false);
        }
    };

    const handleTogglePause = async () => {
        if (!schedule) return;

        const newStatus = schedule.status === 'active' ? 'paused' : 'active';

        try {
            const { error } = await (supabase as any)
                .from('follow_up_schedules')
                .update({ status: newStatus, updated_at: new Date().toISOString() })
                .eq('id', schedule.id);

            if (error) throw error;

            setSchedule({ ...schedule, status: newStatus });
            toast.success(newStatus === 'active' ? 'Follow-ups resumed' : 'Follow-ups paused');
        } catch (error) {
            console.error('Failed to toggle pause:', error);
            toast.error('Failed to update schedule');
        }
    };

    const handleDelete = async () => {
        if (!schedule) return;

        try {
            const { error } = await (supabase as any)
                .from('follow_up_schedules')
                .delete()
                .eq('id', schedule.id);

            if (error) throw error;

            setSchedule(null);
            toast.success('Follow-up schedule deleted');
        } catch (error) {
            console.error('Failed to delete schedule:', error);
            toast.error('Failed to delete schedule');
        }
    };

    // Don't show for accepted/declined quotes
    if (quote.status === 'accepted' || quote.status === 'declined') {
        return null;
    }

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-500" />
                    Automated Follow-ups
                </CardTitle>
                <CardDescription>
                    Schedule automatic follow-up emails if the client hasn't responded
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {schedule ? (
                    // Existing schedule view
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Badge
                                variant={schedule.status === 'active' ? 'default' : 'secondary'}
                                className={schedule.status === 'completed' ? 'bg-success/10 text-success' : ''}
                            >
                                {schedule.status.charAt(0).toUpperCase() + schedule.status.slice(1)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {schedule.follow_ups_sent} of {schedule.max_follow_ups} sent
                            </span>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Type</span>
                                <span className="text-muted-foreground">
                                    {schedule.schedule_type === 'recurring'
                                        ? `Every ${schedule.frequency_days} days`
                                        : 'One-time'}
                                </span>
                            </div>
                            {schedule.next_send_at && schedule.status === 'active' && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Next Send</span>
                                    <span className="text-muted-foreground">
                                        {new Date(schedule.next_send_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            {schedule.last_sent_at && (
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium">Last Sent</span>
                                    <span className="text-muted-foreground">
                                        {new Date(schedule.last_sent_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {schedule.status !== 'completed' && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleTogglePause}
                                    className="flex-1"
                                >
                                    {schedule.status === 'active' ? (
                                        <>
                                            <Pause className="h-4 w-4 mr-1" />
                                            Pause
                                        </>
                                    ) : (
                                        <>
                                            <Play className="h-4 w-4 mr-1" />
                                            Resume
                                        </>
                                    )}
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDelete}
                                    className="text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Create new schedule form
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Schedule Type</Label>
                                <Select value={scheduleType} onValueChange={(v: any) => setScheduleType(v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="recurring">Recurring</SelectItem>
                                        <SelectItem value="one_time">One-time</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>First Follow-up (days)</Label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={30}
                                    value={daysUntilFirst}
                                    onChange={(e) => setDaysUntilFirst(parseInt(e.target.value) || 3)}
                                />
                            </div>
                        </div>

                        {scheduleType === 'recurring' && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Repeat Every (days)</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={30}
                                        value={frequencyDays}
                                        onChange={(e) => setFrequencyDays(parseInt(e.target.value) || 7)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Follow-ups</Label>
                                    <Input
                                        type="number"
                                        min={1}
                                        max={10}
                                        value={maxFollowUps}
                                        onChange={(e) => setMaxFollowUps(parseInt(e.target.value) || 3)}
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="custom-message"
                                checked={useCustomMessage}
                                onCheckedChange={setUseCustomMessage}
                            />
                            <Label htmlFor="custom-message">Use custom message</Label>
                        </div>

                        {useCustomMessage && (
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <Label>Subject</Label>
                                    <Input
                                        value={customSubject}
                                        onChange={(e) => setCustomSubject(e.target.value)}
                                        placeholder="Following up: {{quote_title}}"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Message</Label>
                                    <Textarea
                                        value={customMessage}
                                        onChange={(e) => setCustomMessage(e.target.value)}
                                        placeholder="Hi {{customer_name}}, I wanted to follow up..."
                                        rows={4}
                                    />
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={handleCreateSchedule}
                            disabled={isSaving}
                            className="w-full"
                        >
                            <Mail className="h-4 w-4 mr-2" />
                            {isSaving ? 'Creating...' : 'Schedule Follow-ups'}
                        </Button>

                        <p className="text-xs text-muted-foreground">
                            First email will be sent{' '}
                            {new Date(Date.now() + daysUntilFirst * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                            {scheduleType === 'recurring' && ` Up to ${maxFollowUps} emails will be sent.`}
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
