import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  Lock,
  Unlock,
  AlertCircle,
  CheckCircle2,
  Clock,
  Archive,
  TrendingUp,
  Info,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type EthiopianYearInfo = {
  currentEthiopianYear: number;
  nextEthiopianYear: number;
  nextNewYearDate: string;
  daysUntilNewYear: number;
  isLeapYear: boolean;
  activeYear?: number;
  lastClosureDate?: string;
  planningTargetsLocked: boolean;
};

type YearClosureLog = {
  id: string;
  closedEthiopianYear: number;
  newEthiopianYear: number;
  workOrdersArchived: number;
  workOrdersRolledOver: number;
  workshopsReset: number;
  closedAt: string;
  closedByName: string;
  notes: string | null;
};

export function EthiopianYearManagement() {
  const { toast } = useToast();
  const [closureNotes, setClosureNotes] = useState("");

  // Fetch Ethiopian year info
  const { data: yearInfo, isLoading } = useQuery<EthiopianYearInfo>({
    queryKey: ["/api/ethiopian-year/info"],
  });

  // Fetch year closure logs
  const { data: closureLogs = [] } = useQuery<YearClosureLog[]>({
    queryKey: ["/api/year-closure-logs"],
  });

  // Close year mutation
  const closeYearMutation = useMutation({
    mutationFn: async (notes: string) => {
      return await apiRequest("/api/ethiopian-year/close", {
        method: "POST",
        body: { notes },
      });
    },
    onSuccess: () => {
      toast({
        title: "Year Closed Successfully",
        description: "The Ethiopian year has been closed and a new year started.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ethiopian-year/info"] });
      queryClient.invalidateQueries({ queryKey: ["/api/year-closure-logs"] });
      setClosureNotes("");
    },
    onError: (error: any) => {
      toast({
        title: "Error Closing Year",
        description: error.message || "Failed to close the Ethiopian year",
        variant: "destructive",
      });
    },
  });

  // Lock/unlock planning targets mutation
  const lockTargetsMutation = useMutation({
    mutationFn: async (locked: boolean) => {
      return await apiRequest("/api/planning-targets/lock", {
        method: "POST",
        body: { locked },
      });
    },
    onSuccess: (_, locked) => {
      toast({
        title: locked ? "Planning Targets Locked" : "Planning Targets Unlocked",
        description: locked
          ? "Workshop planning targets are now locked for editing"
          : "Workshop planning targets are now editable",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/ethiopian-year/info"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update planning targets lock status",
        variant: "destructive",
      });
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Loading year information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Year Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Ethiopian Calendar Year Information
              </CardTitle>
              <CardDescription>
                Manage Ethiopian fiscal year closure and planning targets
              </CardDescription>
            </div>
            {yearInfo && (
              <Badge variant="secondary" className="text-lg px-4 py-2">
                Year {yearInfo.activeYear || yearInfo.currentEthiopianYear}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {yearInfo && (
            <>
              {/* Year Status Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Current Year</p>
                  </div>
                  <p className="text-2xl font-bold">{yearInfo.currentEthiopianYear}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Next Year</p>
                  </div>
                  <p className="text-2xl font-bold">{yearInfo.nextEthiopianYear}</p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium text-muted-foreground">Next New Year</p>
                  </div>
                  <p className="text-sm font-semibold">{formatDate(yearInfo.nextNewYearDate)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {yearInfo.daysUntilNewYear} days away
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    {yearInfo.planningTargetsLocked ? (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Unlock className="h-4 w-4 text-muted-foreground" />
                    )}
                    <p className="text-sm font-medium text-muted-foreground">Planning Targets</p>
                  </div>
                  <Badge variant={yearInfo.planningTargetsLocked ? "secondary" : "default"}>
                    {yearInfo.planningTargetsLocked ? "Locked" : "Unlocked"}
                  </Badge>
                </div>
              </div>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Ethiopian New Year (Enkutatash)</strong> falls on{" "}
                  <strong>September {yearInfo.isLeapYear ? "12" : "11"}</strong> this year
                  {yearInfo.isLeapYear && " (Gregorian leap year)"}.
                  <br />
                  The year closure process will archive completed work orders, reset planning targets,
                  and prepare the system for the new fiscal year.
                </AlertDescription>
              </Alert>

              {/* Actions */}
              <div className="flex flex-wrap gap-4">
                {/* Close Year Button */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="default"
                      size="lg"
                      data-testid="button-close-year"
                    >
                      <Archive className="h-4 w-4 mr-2" />
                      Close Year & Start New Year
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="max-w-2xl">
                    <AlertDialogHeader>
                      <AlertDialogTitle>Close Ethiopian Year {yearInfo.activeYear || yearInfo.currentEthiopianYear}?</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <p className="font-semibold text-foreground">
                          This action will perform the following:
                        </p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>Archive all completed work orders to historical storage</li>
                          <li>Pending work orders will remain active</li>
                          <li>Reset all workshop planning targets to 0</li>
                          <li>Unlock planning targets for new year planning</li>
                          <li>Update active year to {yearInfo.nextEthiopianYear}</li>
                        </ul>
                        <p className="text-destructive font-medium">
                          ⚠️ This action cannot be undone. Archived data will be preserved but completed
                          work orders will be moved to archive storage.
                        </p>
                        <div className="space-y-2 mt-4">
                          <Label htmlFor="closure-notes">Notes (Optional)</Label>
                          <Textarea
                            id="closure-notes"
                            placeholder="Add any notes about this year closure..."
                            value={closureNotes}
                            onChange={(e) => setClosureNotes(e.target.value)}
                            rows={3}
                            data-testid="input-closure-notes"
                          />
                        </div>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel data-testid="button-cancel-closure">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => closeYearMutation.mutate(closureNotes)}
                        disabled={closeYearMutation.isPending}
                        className="bg-primary"
                        data-testid="button-confirm-closure"
                      >
                        {closeYearMutation.isPending ? (
                          <>
                            <Clock className="h-4 w-4 mr-2 animate-spin" />
                            Closing Year...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm Year Closure
                          </>
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                {/* Lock/Unlock Planning Targets */}
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => lockTargetsMutation.mutate(!yearInfo.planningTargetsLocked)}
                  disabled={lockTargetsMutation.isPending}
                  data-testid="button-toggle-lock"
                >
                  {yearInfo.planningTargetsLocked ? (
                    <>
                      <Unlock className="h-4 w-4 mr-2" />
                      Unlock Planning Targets
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Lock Planning Targets
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Year Closure History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Year Closure History
          </CardTitle>
          <CardDescription>
            View previous Ethiopian year closures and their statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {closureLogs.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No year closures recorded yet</p>
            </div>
          ) : (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Closed Year</TableHead>
                    <TableHead>New Year</TableHead>
                    <TableHead className="text-right">Work Orders Archived</TableHead>
                    <TableHead className="text-right">Workshops Reset</TableHead>
                    <TableHead>Closed By</TableHead>
                    <TableHead>Closed At</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {closureLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.closedEthiopianYear}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.newEthiopianYear}</Badge>
                      </TableCell>
                      <TableCell className="text-right">{log.workOrdersArchived}</TableCell>
                      <TableCell className="text-right">{log.workshopsReset}</TableCell>
                      <TableCell>{log.closedByName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDateTime(log.closedAt)}
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {log.notes || <span className="text-muted-foreground">-</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
