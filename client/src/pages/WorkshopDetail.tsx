import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Wrench, CheckCircle, Clock, Edit, UserCheck, Users, Lock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EmployeeSearchDialog } from "@/components/EmployeeSearchDialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function WorkshopDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const workshopId = params.id;
  const { toast } = useToast();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editForemanId, setEditForemanId] = useState("");
  const [isForemanSearchOpen, setIsForemanSearchOpen] = useState(false);
  
  // Planning targets state
  const [editMonthlyTarget, setEditMonthlyTarget] = useState<number | undefined>(undefined);
  const [editQ1Target, setEditQ1Target] = useState<number | undefined>(undefined);
  const [editQ2Target, setEditQ2Target] = useState<number | undefined>(undefined);
  const [editQ3Target, setEditQ3Target] = useState<number | undefined>(undefined);
  const [editQ4Target, setEditQ4Target] = useState<number | undefined>(undefined);
  const [editAnnualTarget, setEditAnnualTarget] = useState<number | undefined>(undefined);

  const { data: workshopDetails, isLoading } = useQuery<any>({
    queryKey: [`/api/workshops/${workshopId}/details`],
    enabled: !!workshopId,
  });

  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // Get system settings for planning targets lock status
  const { data: systemSettings } = useQuery<{ planningTargetsLocked: boolean }>({
    queryKey: ["/api/system-settings"],
  });

  const planningTargetsLocked = systemSettings?.planningTargetsLocked ?? true;

  const updateWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/workshops/${workshopId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshopId}/details`] });
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      toast({
        title: "Success",
        description: "Workshop updated successfully",
      });
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update workshop",
        variant: "destructive",
      });
    },
  });

  const handleEditClick = () => {
    if (workshopDetails?.workshop) {
      setEditName(workshopDetails.workshop.name);
      setEditDescription(workshopDetails.workshop.description || "");
      setEditForemanId(workshopDetails.workshop.foremanId || "");
      setEditMonthlyTarget(workshopDetails.workshop.monthlyTarget ?? undefined);
      setEditQ1Target(workshopDetails.workshop.q1Target ?? undefined);
      setEditQ2Target(workshopDetails.workshop.q2Target ?? undefined);
      setEditQ3Target(workshopDetails.workshop.q3Target ?? undefined);
      setEditQ4Target(workshopDetails.workshop.q4Target ?? undefined);
      setEditAnnualTarget(workshopDetails.workshop.annualTarget ?? undefined);
      setIsEditDialogOpen(true);
    }
  };

  const handleUpdateWorkshop = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkshopMutation.mutate({
      name: editName,
      description: editDescription,
      foremanId: editForemanId || null,
      garageId: workshopDetails.workshop.garageId,
      monthlyTarget: editMonthlyTarget,
      q1Target: editQ1Target,
      q2Target: editQ2Target,
      q3Target: editQ3Target,
      q4Target: editQ4Target,
      annualTarget: editAnnualTarget,
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workshopDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Workshop not found</p>
          <Button onClick={() => setLocation("/garages")} className="mt-4">
            Back to Garages
          </Button>
        </div>
      </div>
    );
  }

  const completedOrders = workshopDetails.workOrders?.filter((wo: any) => wo.status === 'completed') || [];
  const pendingOrders = workshopDetails.workOrders?.filter((wo: any) => !['completed', 'cancelled', 'rejected'].includes(wo.status)) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/garages")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Workshop Details</h1>
        </div>
        <Button
          onClick={handleEditClick}
          data-testid="button-edit-workshop"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Workshop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              {workshopDetails.workshop.name}
            </div>
            {workshopDetails.foreman && (
              <Badge variant="outline" className="gap-1">
                <UserCheck className="h-3 w-3" />
                Foreman: {workshopDetails.foreman.fullName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workshopDetails.workshop.description && (
            <p className="text-muted-foreground">{workshopDetails.workshop.description}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-2xl font-bold">{workshopDetails.stats.totalMembers}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-2xl font-bold">{workshopDetails.stats.totalWorkOrders}</p>
              <p className="text-sm text-muted-foreground">Total Work Orders</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{workshopDetails.stats.completedWorkOrders}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          {workshopDetails.members && workshopDetails.members.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Team Members</p>
              <div className="flex flex-wrap gap-2">
                {workshopDetails.members.map((member: any) => (
                  <Badge key={member.id} variant="outline">
                    {member.fullName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Work Orders</h2>
        <Tabs defaultValue="pending" className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="mt-4">
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((wo: any) => (
                  <Card key={wo.id} className="hover-elevate" data-testid={`card-work-order-${wo.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="font-semibold">{wo.workOrderNumber}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{wo.workType}</p>
                          {wo.description && (
                            <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {wo.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {wo.equipmentUnit && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Equipment:</span> {wo.equipmentUnit}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No pending work orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedOrders.length > 0 ? (
              <div className="space-y-3">
                {completedOrders.map((wo: any) => (
                  <Card key={wo.id} className="hover-elevate bg-green-50 dark:bg-green-950" data-testid={`card-work-order-${wo.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="font-semibold">{wo.workOrderNumber}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{wo.workType}</p>
                          {wo.description && (
                            <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4 bg-green-100 dark:bg-green-900">
                          Completed
                        </Badge>
                      </div>
                      {wo.equipmentUnit && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Equipment:</span> {wo.equipmentUnit}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No completed work orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Workshop Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>
              Update workshop details and assign a foreman
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateWorkshop} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Workshop Name *</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                data-testid="input-edit-workshop-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                rows={3}
                data-testid="input-edit-workshop-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-foreman">Foreman</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsForemanSearchOpen(true)}
                data-testid="button-select-foreman"
              >
                <Users className="h-4 w-4 mr-2" />
                {editForemanId && employees?.find((e: any) => e.id === editForemanId)
                  ? employees.find((e: any) => e.id === editForemanId).fullName
                  : "Select foreman (optional)"}
              </Button>
            </div>

            {/* Planning Targets Section */}
            <div className="border-t pt-4 space-y-3">
              <Label className="text-base">Planning Targets (Optional)</Label>
              
              {planningTargetsLocked && (
                <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                  <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                    Planning targets are locked for the current Ethiopian year. They can only be edited when a new year starts through the Year Closure process in Admin Settings.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-monthly-target" className="text-xs">Monthly Target</Label>
                  <Input
                    id="edit-monthly-target"
                    type="number"
                    placeholder="0"
                    value={editMonthlyTarget ?? ""}
                    onChange={(e) => setEditMonthlyTarget(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-monthly-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-annual-target" className="text-xs">Annual Target</Label>
                  <Input
                    id="edit-annual-target"
                    type="number"
                    placeholder="0"
                    value={editAnnualTarget ?? ""}
                    onChange={(e) => setEditAnnualTarget(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-annual-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-q1-target" className="text-xs">Q1 Target (Jan-Mar)</Label>
                  <Input
                    id="edit-q1-target"
                    type="number"
                    placeholder="0"
                    value={editQ1Target ?? ""}
                    onChange={(e) => setEditQ1Target(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-q1-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-q2-target" className="text-xs">Q2 Target (Apr-Jun)</Label>
                  <Input
                    id="edit-q2-target"
                    type="number"
                    placeholder="0"
                    value={editQ2Target ?? ""}
                    onChange={(e) => setEditQ2Target(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-q2-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-q3-target" className="text-xs">Q3 Target (Jul-Sep)</Label>
                  <Input
                    id="edit-q3-target"
                    type="number"
                    placeholder="0"
                    value={editQ3Target ?? ""}
                    onChange={(e) => setEditQ3Target(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-q3-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-q4-target" className="text-xs">Q4 Target (Oct-Dec)</Label>
                  <Input
                    id="edit-q4-target"
                    type="number"
                    placeholder="0"
                    value={editQ4Target ?? ""}
                    onChange={(e) => setEditQ4Target(e.target.value ? parseInt(e.target.value) : undefined)}
                    disabled={planningTargetsLocked}
                    data-testid="input-edit-q4-target"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditDialogOpen(false)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateWorkshopMutation.isPending}
                data-testid="button-save-workshop"
              >
                {updateWorkshopMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Search Dialog for Edit Workshop */}
      <EmployeeSearchDialog
        open={isForemanSearchOpen}
        onOpenChange={setIsForemanSearchOpen}
        mode="single"
        title="Select Foreman"
        onSelect={(employeeIds) => {
          const employeeId = employeeIds[0] || "";
          setEditForemanId(employeeId);
        }}
        selectedIds={editForemanId ? [editForemanId] : []}
      />
    </div>
  );
}
