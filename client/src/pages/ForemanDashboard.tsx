import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardList, Users, CheckCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

  const { data: pendingWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/pending"],
  });

  const { data: activeWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/active"],
  });

  const { data: teamMembers } = useQuery<Employee[]>({
    queryKey: ["/api/employees/team-members"],
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
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl" data-testid="dialog-assign-team">
          <DialogHeader>
            <DialogTitle>Assign Team Members</DialogTitle>
            <DialogDescription>Select team members to assign to this work order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {teamMembers && teamMembers.length > 0 ? (
              teamMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-3 p-3 rounded-md border cursor-pointer hover-elevate"
                  onClick={() => toggleTeamMember(member.id)}
                  data-testid={`team-member-option-${member.id}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTeamMembers.includes(member.id)}
                    onChange={() => toggleTeamMember(member.id)}
                    className="h-4 w-4"
                    data-testid={`checkbox-team-member-${member.id}`}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{member.fullName}</p>
                    <p className="text-sm text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-8">No team members available</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsAssignDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={confirmAssignment}
              disabled={selectedTeamMembers.length === 0 || assignTeamMutation.isPending}
              data-testid="button-confirm-assignment"
            >
              Assign Team ({selectedTeamMembers.length})
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
