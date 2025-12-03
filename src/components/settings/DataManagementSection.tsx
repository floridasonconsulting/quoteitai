import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { clearDatabaseData } from "@/lib/db-service";
import { clearAllData } from "@/lib/storage";
import { exportAllData, importAllData } from "@/lib/import-export-utils";
import { useAuth } from "@/contexts/AuthContext";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

export function DataManagementSection() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportAllData();
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Export failed:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      await importAllData(file);
      toast.success("Data imported successfully");
      window.location.reload();
    } catch (error) {
      console.error("Import failed:", error);
      toast.error("Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClearAllData = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to clear data");
      return;
    }

    if (!window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return;
    }

    try {
      setIsClearing(true);
      
      // Clear database data (Supabase)
      await clearDatabaseData(user.id);
      
      // Clear local storage
      await clearAllData();
      
      toast.success("All data cleared successfully");
      window.location.reload();
    } catch (error) {
      console.error("Clear data failed:", error);
      toast.error("Failed to clear data");
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteAllData = async () => {
    if (!user?.id) {
      toast.error("You must be signed in to delete data");
      return;
    }

    // First confirmation
    const firstConfirm = window.confirm(
      "⚠️ WARNING: This will permanently delete ALL your data including customers, items, quotes, and settings.\n\nAre you absolutely sure you want to continue?"
    );
    
    if (!firstConfirm) return;

    // Second confirmation with typing requirement
    const typedConfirmation = window.prompt(
      'This action CANNOT be undone. Type "DELETE ALL DATA" to confirm:'
    );

    if (typedConfirmation !== "DELETE ALL DATA") {
      toast.error("Deletion cancelled - confirmation text did not match");
      return;
    }

    setIsDeleting(true);

    try {
      // Import necessary functions
      const { clearDatabaseData } = await import('@/lib/db-service');
      const { clearAllData } = await import('@/lib/storage');

      // Clear database
      await clearDatabaseData(user.id);
      
      // Clear local storage
      await clearAllData();
      
      // Clear all localStorage
      localStorage.clear();
      
      toast.success("All data has been permanently deleted");
      
      // Reload to fresh state
      setTimeout(() => {
        window.location.href = '/';
      }, 1000);
    } catch (error) {
      console.error("[DataManagement] Delete all failed:", error);
      toast.error("Failed to delete all data. Please try again.");
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export, import, or manage your data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export All Data"}
          </Button>

          <div className="flex-1">
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={isImporting}
              className="hidden"
              id="import-file"
            />
            <label htmlFor="import-file" className="w-full">
              <Button
                variant="outline"
                disabled={isImporting}
                className="w-full"
                asChild
              >
                <span>
                  <Upload className="mr-2 h-4 w-4" />
                  {isImporting ? "Importing..." : "Import Data"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        <Separator />

        {/* Danger Zone */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <Label className="text-destructive font-semibold">Danger Zone</Label>
          </div>
          <p className="text-sm text-muted-foreground">
            Permanently delete all your data. This action cannot be undone.
          </p>
          <Button
            variant="destructive"
            onClick={handleDeleteAllData}
            disabled={isDeleting || !user}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete All Data"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}