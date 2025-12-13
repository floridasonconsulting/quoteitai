import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

interface NotificationPreferencesSectionProps {
  settings: {
    emailNotifications?: boolean;
    quoteStatusUpdates?: boolean;
    customerActivityAlerts?: boolean;
    weeklyReports?: boolean;
  };
  onUpdate: (updates: Partial<NotificationPreferencesSectionProps["settings"]>) => Promise<void>;
}

export function NotificationPreferencesSection({ settings, onUpdate }: NotificationPreferencesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose which notifications you want to receive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <div className="text-sm text-muted-foreground">
              Receive general email notifications
            </div>
          </div>
          <Switch
            checked={settings.emailNotifications ?? true}
            onCheckedChange={(checked) => onUpdate({ emailNotifications: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Quote Status Updates</Label>
            <div className="text-sm text-muted-foreground">
              Get notified when quote status changes
            </div>
          </div>
          <Switch
            checked={settings.quoteStatusUpdates ?? true}
            onCheckedChange={(checked) => onUpdate({ quoteStatusUpdates: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Customer Activity Alerts</Label>
            <div className="text-sm text-muted-foreground">
              Alerts when customers view quotes
            </div>
          </div>
          <Switch
            checked={settings.customerActivityAlerts ?? true}
            onCheckedChange={(checked) => onUpdate({ customerActivityAlerts: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Weekly Reports</Label>
            <div className="text-sm text-muted-foreground">
              Receive weekly summary reports
            </div>
          </div>
          <Switch
            checked={settings.weeklyReports ?? false}
            onCheckedChange={(checked) => onUpdate({ weeklyReports: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
