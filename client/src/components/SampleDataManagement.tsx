import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles,
  Database,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info,
  Loader2,
} from "lucide-react";

export function SampleDataManagement() {
  const { toast } = useToast();
  const [lastSeededAt, setLastSeededAt] = useState<Date | null>(null);

  // Seed sample data mutation
  const seedMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/admin/seed-sample-data", "POST", {});
    },
    onSuccess: () => {
      setLastSeededAt(new Date());
      toast({
        title: "Sample Data Seeded Successfully",
        description: "The database has been populated with comprehensive sample data. Navigate to the respective pages to view the data.",
      });
      // Invalidate all queries to refetch fresh data
      queryClient.invalidateQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Seeding Failed",
        description: error.message || "Failed to seed sample data",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Sample Data Management
              </CardTitle>
              <CardDescription>
                Generate comprehensive sample data for testing and demonstration purposes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Information Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool will populate your database with realistic sample data including work orders, requisitions,
              inspections, team performance metrics, and archived data from previous years. This is useful for testing
              and demonstrating the system's capabilities.
            </AlertDescription>
          </Alert>

          {/* What Gets Created */}
          <Card className="border-2 border-dashed">
            <CardHeader>
              <CardTitle className="text-base">What Sample Data Will Be Created</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Work Orders
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Pending mechanic assignment</li>
                    <li>In progress work orders</li>
                    <li>Awaiting parts</li>
                    <li>Pending verification</li>
                    <li>Verified and completed</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Item Requisitions
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Pending foreman approval</li>
                    <li>Approved by foreman</li>
                    <li>Rejected items</li>
                    <li>Pending store manager approval</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Inspections
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Pending inspections</li>
                    <li>Completed inspections</li>
                    <li>With equipment receptions</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Parts & Performance
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Parts receipts (received items)</li>
                    <li>Team performance snapshots</li>
                    <li>Daily & monthly metrics</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Archived Data (2017)
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>10 archived work orders</li>
                    <li>Ethiopian year 2017</li>
                    <li>With spare parts usage data</li>
                    <li>Complete cost breakdowns</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    Note
                  </h3>
                  <p className="text-sm text-muted-foreground ml-6">
                    Purchase requests are auto-generated when requisition items are approved but parts are out of stock.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Generate Sample Data</p>
                <p className="text-sm text-muted-foreground">
                  {lastSeededAt 
                    ? `Last seeded: ${lastSeededAt.toLocaleString()}`
                    : "Click the button to populate the database"}
                </p>
              </div>
            </div>
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              size="lg"
              data-testid="button-seed-sample-data"
            >
              {seedMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Seeding Data...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Seed Sample Data
                </>
              )}
            </Button>
          </div>

          {/* Warning Alert */}
          <Alert variant="default" className="border-amber-200 bg-amber-50 dark:bg-amber-950/10">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>Important:</strong> Running this multiple times will create duplicate data.
              It's recommended to seed once, then manually test or clear the database before seeding again.
            </AlertDescription>
          </Alert>

          {/* Success Message */}
          {seedMutation.isSuccess && (
            <Alert className="border-green-200 bg-green-50 dark:bg-green-950/10">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Sample data has been successfully seeded! Navigate to the following pages to view the data:
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Work Orders - Various statuses</li>
                  <li>Item Requisitions - Different approval states</li>
                  <li>Equipment Inspections - Pending and completed</li>
                  <li>Team Performance - Daily and monthly metrics</li>
                  <li>Archived Work Orders - Filter by year 2017 to see historical data</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
