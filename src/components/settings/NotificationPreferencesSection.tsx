import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { CompanySettings } from "@/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bell } from "lucide-react";

interface NotificationPreferencesSectionProps {
  settings: CompanySettings;
  onToggle: (field: "notifyEmailAccepted" | "notifyEmailDeclined", value: boolean) => void;
}

export function NotificationPreferencesSection({ 
  settings, 
  onToggle 
}: NotificationPreferencesSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription>
            Configure when you want to receive email notifications about quote status changes.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor="notify-accepted" className="cursor-pointer">
              Notify on Quote Accepted
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive an email when a customer accepts your quote
            </p>
          </div>
          <Switch
            id="notify-accepted"
            checked={settings.notifyEmailAccepted !== false}
            onCheckedChange={(checked) => onToggle("notifyEmailAccepted", checked)}
          />
        </div>

        <div className="flex items-center justify-between space-x-2">
          <div className="flex-1">
            <Label htmlFor="notify-declined" className="cursor-pointer">
              Notify on Quote Declined
            </Label>
            <p className="text-sm text-muted-foreground">
              Receive an email when a customer declines your quote
            </p>
          </div>
          <Switch
            id="notify-declined"
            checked={settings.notifyEmailDeclined !== false}
            onCheckedChange={(checked) => onToggle("notifyEmailDeclined", checked)}
          />
        </div>
      </CardContent>
    </Card>
  );
}