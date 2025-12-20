import { FollowUpSchedule } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface FollowUpSettingsProps {
    schedule: Partial<FollowUpSchedule>;
    onChange: (schedule: Partial<FollowUpSchedule>) => void;
    disabled?: boolean;
}

export function FollowUpSettings({ schedule, onChange, disabled }: FollowUpSettingsProps) {
    const isEnabled = schedule.status === 'active';

    const handleToggle = (checked: boolean) => {
        onChange({
            ...schedule,
            status: checked ? 'active' : 'paused',
            // Set default start date if enabling and not set
            nextSendAt: checked && !schedule.nextSendAt
                ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString() // Default 3 days from now
                : schedule.nextSendAt
        });
    };

    const handleChange = (field: keyof FollowUpSchedule, value: any) => {
        onChange({ ...schedule, [field]: value });
    };

    // Helper to format UTC ISO string to local datetime-local string
    const getLocalValue = (isoString?: string) => {
        if (!isoString) return '';
        const d = new Date(isoString);
        // Adjust for timezone to display correct local time
        const offset = d.getTimezoneOffset() * 60000;
        return (new Date(d.getTime() - offset)).toISOString().slice(0, 16);
    };

    // Helper to parse local datetime-local string to UTC ISO string
    const handleDateChange = (localValue: string) => {
        if (!localValue) return;
        const d = new Date(localValue);
        handleChange('nextSendAt', d.toISOString());
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="space-y-1">
                    <CardTitle>Automated Follow-ups</CardTitle>
                    <CardDescription>
                        Automatically send AI-crafted follow-up emails for this quote.
                    </CardDescription>
                </div>
                <Switch
                    checked={isEnabled}
                    onCheckedChange={handleToggle}
                    disabled={disabled}
                />
            </CardHeader>
            {isEnabled && (
                <CardContent className="space-y-4 pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Schedule Type</Label>
                            <Select
                                value={schedule.scheduleType || 'one_time'}
                                onValueChange={(val) => handleChange('scheduleType', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="one_time">One Time</SelectItem>
                                    <SelectItem value="recurring">Recurring</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Next Send Date</Label>
                            <Input
                                type="datetime-local"
                                value={getLocalValue(schedule.nextSendAt)}
                                onChange={(e) => handleDateChange(e.target.value)}
                            />
                        </div>

                        {schedule.scheduleType === 'recurring' && (
                            <>
                                <div className="space-y-2">
                                    <Label>Frequency (Days)</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={schedule.frequencyDays || 3}
                                        onChange={(e) => handleChange('frequencyDays', parseInt(e.target.value) || 3)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Follow-ups</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={schedule.maxFollowUps || 3}
                                        onChange={(e) => handleChange('maxFollowUps', parseInt(e.target.value) || 3)}
                                    />
                                </div>
                            </>
                        )}
                    </div>

                    <Separator />

                    <div className="space-y-2">
                        <Label>Email Subject Template (Optional)</Label>
                        <Input
                            value={schedule.subjectTemplate || ''}
                            onChange={(e) => handleChange('subjectTemplate', e.target.value)}
                            placeholder="Checking in on your quote..."
                        />
                        <p className="text-xs text-muted-foreground">Leave blank to use AI generated subject based on staleness.</p>
                    </div>
                </CardContent>
            )}
        </Card>
    );
}
