import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download, Upload, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { dbService } from "@/lib/db-service";
import { exportAllData, importAllData } from "@/lib/import-export-utils";

export function DataManagementSection() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

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
    if (!window.confirm("Are you sure you want to clear all data? This action cannot be undone.")) {
      return;
    }

    try {
      setIsClearing(true);
      await dbService.clearAllData();
      toast.success("All data cleared successfully");
      window.location.reload();
    } catch (error) {
      console.error("Clear data failed:", error);
      toast.error("Failed to clear data");
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Management</CardTitle>
        <CardDescription>
          Export, import, or clear your application data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
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

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">Danger Zone</p>
              <p className="text-sm">
                Clearing all data will permanently delete all quotes, customers, items, and settings.
                This action cannot be undone.
              </p>
              <Button
                variant="destructive"
                onClick={handleClearAllData}
                disabled={isClearing}
                size="sm"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {isClearing ? "Clearing..." : "Clear All Data"}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}