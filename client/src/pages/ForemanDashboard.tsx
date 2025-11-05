import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardList, Users, CheckCircle, Clock, FileText, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmployeeSearchDialog } from "@/components/EmployeeSearchDialog";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentModel: string;
  status: string;
  priority: string;
  description: string;
  assignedGarages?: string[];
  assignedWorkshops?: string[];
  teamMembers?: any[];
  inspectionId?: string | null;
  receptionId?: string | null;
};

type Employee = {
  id: string;
  fullName: string;
  role: string;
};

export default function ForemanDashboard() {
  const { toast } = useToast();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [viewingReceptionId, setViewingReceptionId] = useState<string | null>(null);

  const { data: pendingWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/pending"],
  });

  const { data: activeWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/active"],
  });

  const { data: teamMembers } = useQuery<Employee[]>({
    queryKey: ["/api/employees/team-members"],
  });

  // Fetch inspection details when viewing
  const { data: inspectionDetails } = useQuery<any>({
    queryKey: ["/api/inspections", viewingInspectionId],
    queryFn: async () => {
      if (!viewingInspectionId) return null;
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}`);
      return response.json();
    },
    enabled: !!viewingInspectionId,
  });

  // Fetch reception details when viewing
  const { data: receptionDetails } = useQuery<any>({
    queryKey: ["/api/equipment-receptions", viewingReceptionId],
    queryFn: async () => {
      if (!viewingReceptionId) return null;
      const response = await apiRequest("GET", `/api/equipment-receptions/${viewingReceptionId}`);
      return response.json();
    },
    enabled: !!viewingReceptionId,
  });

  const assignTeamMutation = useMutation({
    mutationFn: async (data: { workOrderId: string; teamMemberIds: string[] }) => {
      return await apiRequest("POST", `/api/work-orders/${data.workOrderId}/assign-team`, data);
    },
    onSuccess: () => {
      toast({
        title: "Team Assigned",
        description: "Team members have been assigned to the work order.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/active"] });
      setIsAssignDialogOpen(false);
      setSelectedWorkOrder(null);
      setSelectedTeamMembers([]);
    },
  });

  const handleAssignTeam = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setSelectedTeamMembers([]);
    setIsAssignDialogOpen(true);
  };

  const confirmAssignment = () => {
    if (selectedWorkOrder && selectedTeamMembers.length > 0) {
      assignTeamMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        teamMemberIds: selectedTeamMembers,
      });
    }
  };

  const toggleTeamMember = (memberId: string) => {
    setSelectedTeamMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const WorkOrderCard = ({ workOrder }: { workOrder: WorkOrder }) => (
    <Card className="hover-elevate" data-testid={`work-order-card-${workOrder.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" data-testid={`text-work-order-number-${workOrder.id}`}>
            {workOrder.workOrderNumber}
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={workOrder.priority === "high" ? "destructive" : "secondary"}>
              {workOrder.priority}
            </Badge>
            <Badge variant="outline">{workOrder.status}</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-muted-foreground text-sm">Equipment:</Label>
          <p className="font-medium">{workOrder.equipmentModel}</p>
        </div>
        <div>
          <Label className="text-muted-foreground text-sm">Description:</Label>
          <p className="text-sm">{workOrder.description}</p>
        </div>
        
        {/* View Inspection and View Maintenance Buttons */}
        {(workOrder.inspectionId || workOrder.receptionId) && (
          <div className="flex gap-2 pt-2 border-t">
            {workOrder.inspectionId && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setViewingInspectionId(workOrder.inspectionId!)}
                className="flex-1"
                data-testid={`button-view-inspection-${workOrder.id}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                View Inspection
              </Button>
            )}
            {workOrder.receptionId && (
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => setViewingReceptionId(workOrder.receptionId!)}
                className="flex-1"
                data-testid={`button-view-maintenance-${workOrder.id}`}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                View Maintenance
              </Button>
            )}
          </div>
        )}

        {workOrder.teamMembers && workOrder.teamMembers.length > 0 ? (
          <div>
            <Label className="text-muted-foreground text-sm">Team Members:</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {workOrder.teamMembers.map((member: any) => (
                <Badge key={member.id} variant="secondary">
                  {member.fullName}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <Button
            onClick={() => handleAssignTeam(workOrder)}
            className="w-full"
            data-testid={`button-assign-team-${workOrder.id}`}
          >
            <Users className="h-4 w-4 mr-2" />
            Assign Team
          </Button>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Foreman Dashboard
            </h1>
            <p className="text-muted-foreground">Assign teams and manage work orders</p>
          </div>
          <ClipboardList className="h-12 w-12 text-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="pending" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2" data-testid="tabs-work-orders">
            <TabsTrigger value="pending" data-testid="tab-pending">
              <Clock className="h-4 w-4 mr-2" />
              Pending Assignment
            </TabsTrigger>
            <TabsTrigger value="active" data-testid="tab-active">
              <CheckCircle className="h-4 w-4 mr-2" />
              Active Work
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingWorkOrders && pendingWorkOrders.length > 0 ? (
              pendingWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending work orders requiring team assignment
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {activeWorkOrders && activeWorkOrders.length > 0 ? (
              activeWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No active work orders
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Team Assignment Dialog */}
      <EmployeeSearchDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        mode="multiple"
        selectedIds={selectedTeamMembers}
        onConfirm={(ids) => {
          if (selectedWorkOrder && ids.length > 0) {
            assignTeamMutation.mutate({
              workOrderId: selectedWorkOrder.id,
              teamMemberIds: ids,
            });
          }
        }}
        title="Assign Team Members"
        description="Select one or more team members to assign to this work order"
      />

      {/* View Inspection Dialog */}
      <Dialog open={!!viewingInspectionId} onOpenChange={() => setViewingInspectionId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inspection Details</DialogTitle>
            <DialogDescription>
              {inspectionDetails?.inspectionNumber || 'Loading...'}
            </DialogDescription>
          </DialogHeader>
          {inspectionDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Service Type</Label>
                  <p className="font-medium capitalize">{inspectionDetails.serviceType?.replace('_', ' ')}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{inspectionDetails.status}</p>
                </div>
                {inspectionDetails.overallCondition && (
                  <div>
                    <Label className="text-muted-foreground">Overall Condition</Label>
                    <p className="font-medium capitalize">{inspectionDetails.overallCondition}</p>
                  </div>
                )}
                {inspectionDetails.inspector && (
                  <div>
                    <Label className="text-muted-foreground">Inspector</Label>
                    <p className="font-medium">{inspectionDetails.inspector.fullName}</p>
                  </div>
                )}
              </div>
              {inspectionDetails.findings && (
                <div>
                  <Label className="text-muted-foreground">Findings</Label>
                  <p className="text-sm mt-1">{inspectionDetails.findings}</p>
                </div>
              )}
              {inspectionDetails.recommendations && (
                <div>
                  <Label className="text-muted-foreground">Recommendations</Label>
                  <p className="text-sm mt-1">{inspectionDetails.recommendations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Reception/Maintenance Dialog */}
      <Dialog open={!!viewingReceptionId} onOpenChange={() => setViewingReceptionId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Request Details</DialogTitle>
            <DialogDescription>
              {receptionDetails?.receptionNumber || 'Loading...'}
            </DialogDescription>
          </DialogHeader>
          {receptionDetails && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Driver Name</Label>
                  <p className="font-medium">{receptionDetails.driverName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Phone Number</Label>
                  <p className="font-medium">{receptionDetails.driverPhoneNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p className="font-medium capitalize">{receptionDetails.status}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Arrival Date</Label>
                  <p className="font-medium">{new Date(receptionDetails.arrivalDate).toLocaleDateString()}</p>
                </div>
              </div>
              {receptionDetails.reportedIssues && (
                <div>
                  <Label className="text-muted-foreground">Reported Issues</Label>
                  <p className="text-sm mt-1">{receptionDetails.reportedIssues}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
