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
      return await apiRequest("POST", "/api/admin/seed-sample-data");
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
              This tool will populate your database with <strong>1000+ realistic sample records</strong> covering all pages and tabs.
              Perfect for offline/local deployments and comprehensive system testing.
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
                    50 Employees
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Team members</li>
                    <li>Foremen & supervisors</li>
                    <li>Verifiers & store managers</li>
                    <li>Across multiple departments</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    100 Equipment Items
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Excavators, loaders, trucks</li>
                    <li>Cranes, forklifts, compactors</li>
                    <li>Across multiple project sites</li>
                    <li>Various operational statuses</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    200 Spare Parts
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>Engine, hydraulic, electrical</li>
                    <li>Brake, filter, bearing, seal</li>
                    <li>With stock levels & locations</li>
                    <li>Various price ranges</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    300 Work Orders
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>All states: pending → completed</li>
                    <li>Various priorities & work types</li>
                    <li>With foreman/team assignments</li>
                    <li>Includes cost breakdowns</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    100 Requisitions
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>~300 requisition lines</li>
                    <li>Foreman & store approvals</li>
                    <li>Approved/rejected/fulfilled</li>
                    <li>Parts receipts included</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Additional Data
                  </h3>
                  <ul className="text-sm text-muted-foreground space-y-1 ml-6 list-disc">
                    <li>50 equipment receptions</li>
                    <li>Equipment inspections</li>
                    <li>100 performance snapshots</li>
                    <li>100 archived WOs (2017)</li>
                  </ul>
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
                Successfully seeded 1000+ sample records! All pages now have data:
                <ul className="mt-2 ml-4 space-y-1 list-disc">
                  <li>Dashboard - Updated analytics & metrics</li>
                  <li>Work Orders - 300 orders across all statuses</li>
                  <li>Equipment - 100 units across sites</li>
                  <li>Spare Parts - 200 parts with stock levels</li>
                  <li>Requisitions - 100 requisitions with ~300 lines</li>
                  <li>Team Performance - Performance data for all team members</li>
                  <li>Archived Work Orders - 100 orders from year 2017</li>
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
