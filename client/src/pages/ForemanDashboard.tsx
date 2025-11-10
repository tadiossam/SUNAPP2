import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ClipboardList, Users, CheckCircle, Clock, FileText, Eye, Package, ThumbsUp, ThumbsDown, XCircle, Check, X, Info, Calendar, Filter } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmployeeSearchDialog } from "@/components/EmployeeSearchDialog";
import { WorkOrderDetailsDialog } from "@/components/WorkOrderDetailsDialog";
import { WorkOrderCostDialog } from "@/components/WorkOrderCostDialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useEquipmentModels } from "@/hooks/useEquipmentModels";
import { EquipmentModelFilter } from "@/components/EquipmentModelFilter";

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
  startedAt?: string | null;
  completedAt?: string | null;
  elapsedTime?: string;
  elapsedMs?: number;
  elapsedHours?: number;
  isTimerPaused?: boolean;
  pausedReason?: string;
};

type Employee = {
  id: string;
  fullName: string;
  role: string;
};

type RequisitionLine = {
  id: string;
  lineNumber: number;
  description: string;
  unitOfMeasure?: string;
  quantityRequested: number;
  quantityApproved?: number;
  status: string;
  remarks?: string;
  foremanStatus?: string;
  foremanApprovedQty?: number;
  foremanDecisionRemarks?: string;
  foremanDecisionAt?: string;
  foremanReviewerId?: string;
};

type Requisition = {
  id: string;
  requisitionNumber: string;
  workOrderNumber?: string;
  workOrderId: string;
  status: string;
  createdAt: string;
  lines: RequisitionLine[];
  requester?: {
    id: string;
    fullName: string;
    role: string;
  };
  workOrder?: {
    id: string;
    workOrderNumber: string;
  };
};

export default function ForemanDashboard() {
  const { toast } = useToast();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedTeamMembers, setSelectedTeamMembers] = useState<string[]>([]);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [viewingReceptionId, setViewingReceptionId] = useState<string | null>(null);
  const [selectedRequisition, setSelectedRequisition] = useState<Requisition | null>(null);
  const [actionRemarks, setActionRemarks] = useState("");
  const [detailsWorkOrderId, setDetailsWorkOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Cost tracking dialog
  const [costDialogWorkOrderId, setCostDialogWorkOrderId] = useState<string | null>(null);
  const [isCostDialogOpen, setIsCostDialogOpen] = useState(false);
  
  // Date range filtering state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [equipmentModelFilter, setEquipmentModelFilter] = useState<string>("all");
  
  // Per-line approval state
  const [lineRemarks, setLineRemarks] = useState<{ [lineId: string]: string }>({});
  const [lineApprovedQty, setLineApprovedQty] = useState<{ [lineId: string]: number }>({});

  // Use equipment models hook
  const { models, isLoading: isLoadingModels } = useEquipmentModels();

  const { data: pendingWorkOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/pending"],
  });

  const { data: activeWorkOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/active"],
  });

  const { data: teamMembers = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees/team-members"],
  });

  const { data: requisitions = [] } = useQuery<Requisition[]>({
    queryKey: ["/api/item-requisitions/foreman"],
  });

  const { data: pendingCompletions = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/pending-completion"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/work-orders/foreman/active");
      const data = await response.json();
      return data.filter((wo: WorkOrder) => wo.status === "in_progress" && (wo as any).completionApprovalStatus === "pending");
    },
  });

  const { data: approvedCompletions = [] } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/foreman/approved-completions"],
  });

  // Apply equipment model filter to work orders
  const filteredPendingWorkOrders = pendingWorkOrders.filter((wo) => {
    if (equipmentModelFilter === "all") return true;
    return wo.equipmentModel === equipmentModelFilter;
  });

  const filteredActiveWorkOrders = activeWorkOrders.filter((wo) => {
    if (equipmentModelFilter === "all") return true;
    return wo.equipmentModel === equipmentModelFilter;
  });

  const filteredPendingCompletions = pendingCompletions.filter((wo) => {
    if (equipmentModelFilter === "all") return true;
    return wo.equipmentModel === equipmentModelFilter;
  });

  // Filter approved completions by date range and equipment model
  const filteredApprovedCompletions = approvedCompletions.filter((wo) => {
    // Equipment model filter
    if (equipmentModelFilter !== "all" && wo.equipmentModel !== equipmentModelFilter) {
      return false;
    }

    // Date range filter
    if (!startDate && !endDate) return true;
    
    const completedDate = wo.completedAt ? new Date(wo.completedAt) : null;
    if (!completedDate) return false;
    
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null; // Include the entire end date
    
    if (start && completedDate < start) return false;
    if (end && completedDate > end) return false;
    
    return true;
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

  const { data: checklistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/inspections", viewingInspectionId, "checklist"],
    queryFn: async () => {
      if (!viewingInspectionId) return [];
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}/checklist`);
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

  const approveRequisitionMutation = useMutation({
    mutationFn: async (data: { requisitionId: string; remarks?: string }) => {
      return await apiRequest("POST", `/api/item-requisitions/${data.requisitionId}/approve-foreman`, {
        remarks: data.remarks,
      });
    },
    onSuccess: () => {
      toast({
        title: "Requisition Approved",
        description: "Parts requisition has been approved and sent to store manager.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/foreman"] });
      setSelectedRequisition(null);
      setActionRemarks("");
    },
  });

  const rejectRequisitionMutation = useMutation({
    mutationFn: async (data: { requisitionId: string; remarks?: string }) => {
      return await apiRequest("POST", `/api/item-requisitions/${data.requisitionId}/reject-foreman`, {
        remarks: data.remarks,
      });
    },
    onSuccess: () => {
      toast({
        title: "Requisition Rejected",
        description: "Parts requisition has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/foreman"] });
      setSelectedRequisition(null);
      setActionRemarks("");
    },
  });

  const approveCompletionMutation = useMutation({
    mutationFn: async (data: { workOrderId: string; notes?: string }) => {
      return await apiRequest("POST", `/api/work-orders/${data.workOrderId}/approve-work-completion`, {
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Completion Approved",
        description: "Work completion has been approved and sent to verifier",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/pending-completion"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/approved-completions"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to approve work completion";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  // Per-line approval mutations
  const approveLineMutation = useMutation({
    mutationFn: async (data: { lineId: string; approvedQty: number; remarks?: string }) => {
      return await apiRequest("POST", `/api/item-requisition-lines/${data.lineId}/foreman-approve`, {
        approvedQty: data.approvedQty,
        remarks: data.remarks,
      });
    },
    onSuccess: () => {
      toast({
        title: "Line Item Approved",
        description: "Requisition line item has been approved.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/foreman"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to approve line item";
      toast({
        title: "Approval Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const rejectLineMutation = useMutation({
    mutationFn: async (data: { lineId: string; remarks: string }) => {
      return await apiRequest("POST", `/api/item-requisition-lines/${data.lineId}/foreman-reject`, {
        remarks: data.remarks,
      });
    },
    onSuccess: () => {
      toast({
        title: "Line Item Rejected",
        description: "Requisition line item has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/foreman"] });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to reject line item";
      toast({
        title: "Rejection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleApproveLine = (line: RequisitionLine) => {
    const approvedQty = lineApprovedQty[line.id] || line.quantityRequested;
    const remarks = lineRemarks[line.id] || "";
    
    approveLineMutation.mutate({
      lineId: line.id,
      approvedQty,
      remarks,
    });
  };

  const handleRejectLine = (line: RequisitionLine) => {
    const remarks = lineRemarks[line.id];
    
    if (!remarks) {
      toast({
        title: "Remarks Required",
        description: "Please provide remarks for rejection",
        variant: "destructive",
      });
      return;
    }
    
    rejectLineMutation.mutate({
      lineId: line.id,
      remarks,
    });
  };

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
        {workOrder.elapsedTime && (
          <div>
            <Label className="text-muted-foreground text-sm">Work Time:</Label>
            <p className="font-bold text-red-600 dark:text-red-400" data-testid={`text-elapsed-time-${workOrder.id}`}>
              {workOrder.elapsedTime}
              {workOrder.isTimerPaused && (
                <span className="text-xs ml-2 text-muted-foreground">(Paused)</span>
              )}
            </p>
          </div>
        )}
        
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
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:max-w-4xl lg:grid-cols-4" data-testid="tabs-work-orders">
              <TabsTrigger value="pending" data-testid="tab-pending">
                <Clock className="h-4 w-4 mr-2" />
                Pending Assignment
              </TabsTrigger>
              <TabsTrigger value="active" data-testid="tab-active">
                <CheckCircle className="h-4 w-4 mr-2" />
                Active Work
              </TabsTrigger>
              <TabsTrigger value="completions" data-testid="tab-completions">
                <ThumbsUp className="h-4 w-4 mr-2" />
                Completion Approvals ({pendingCompletions.length})
              </TabsTrigger>
              <TabsTrigger value="requisitions" data-testid="tab-requisitions">
                <Package className="h-4 w-4 mr-2" />
                Parts Requisitions
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="space-y-4">
            {/* Equipment Model Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium whitespace-nowrap">
                    Filter by Equipment Model:
                  </span>
                  <EquipmentModelFilter
                    models={models}
                    value={equipmentModelFilter}
                    onChange={setEquipmentModelFilter}
                    isLoading={isLoadingModels}
                  />
                  {equipmentModelFilter !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEquipmentModelFilter("all")}
                      data-testid="button-clear-model-filter"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {equipmentModelFilter !== "all" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing {filteredPendingWorkOrders.length} of {pendingWorkOrders.length} work orders
                  </p>
                )}
              </CardContent>
            </Card>

            {filteredPendingWorkOrders && filteredPendingWorkOrders.length > 0 ? (
              filteredPendingWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {equipmentModelFilter !== "all" 
                    ? "No pending work orders for this model"
                    : "No pending work orders requiring team assignment"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            {/* Equipment Model Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium whitespace-nowrap">
                    Filter by Equipment Model:
                  </span>
                  <EquipmentModelFilter
                    models={models}
                    value={equipmentModelFilter}
                    onChange={setEquipmentModelFilter}
                    isLoading={isLoadingModels}
                  />
                  {equipmentModelFilter !== "all" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEquipmentModelFilter("all")}
                      data-testid="button-clear-model-filter"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                {equipmentModelFilter !== "all" && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing {filteredActiveWorkOrders.length} of {activeWorkOrders.length} work orders
                  </p>
                )}
              </CardContent>
            </Card>

            {filteredActiveWorkOrders && filteredActiveWorkOrders.length > 0 ? (
              filteredActiveWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  {equipmentModelFilter !== "all" 
                    ? "No active work orders for this model"
                    : "No active work orders"}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completions" className="space-y-4">
            <Tabs defaultValue="pending" className="space-y-4">
              <div className="w-full overflow-x-auto">
                <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:max-w-2xl lg:grid-cols-2">
                  <TabsTrigger value="pending" data-testid="tab-pending-completions">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Pending ({pendingCompletions.length})
                  </TabsTrigger>
                  <TabsTrigger value="approved" data-testid="tab-approved-completions">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approved ({approvedCompletions.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pending" className="space-y-4">
                {/* Equipment Model Filter */}
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium whitespace-nowrap">
                        Filter by Equipment Model:
                      </span>
                      <EquipmentModelFilter
                        models={models}
                        value={equipmentModelFilter}
                        onChange={setEquipmentModelFilter}
                        isLoading={isLoadingModels}
                      />
                      {equipmentModelFilter !== "all" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEquipmentModelFilter("all")}
                          data-testid="button-clear-model-filter"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    {equipmentModelFilter !== "all" && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Showing {filteredPendingCompletions.length} of {pendingCompletions.length} work orders
                      </p>
                    )}
                  </CardContent>
                </Card>

                {filteredPendingCompletions.length > 0 ? (
                  filteredPendingCompletions.map((workOrder) => (
                    <Card key={workOrder.id} className="hover-elevate" data-testid={`completion-card-${workOrder.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{workOrder.workOrderNumber}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Equipment: {workOrder.equipmentModel || "N/A"}
                            </p>
                          </div>
                          <Badge variant="outline">Pending Approval</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {workOrder.description && (
                          <div>
                            <Label className="text-muted-foreground text-sm">Description:</Label>
                            <p>{workOrder.description}</p>
                          </div>
                        )}
                        {workOrder.teamMembers && workOrder.teamMembers.length > 0 && (
                          <div>
                            <Label className="text-muted-foreground text-sm mb-2 block">Team Members:</Label>
                            <div className="flex flex-wrap gap-2">
                              {workOrder.teamMembers.map((member: any) => (
                                <Badge key={member.id} variant="secondary">{member.fullName}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          onClick={() => approveCompletionMutation.mutate({ workOrderId: workOrder.id })}
                          disabled={approveCompletionMutation.isPending}
                          className="w-full"
                          data-testid={`button-approve-completion-${workOrder.id}`}
                        >
                          <ThumbsUp className="h-4 w-4 mr-2" />
                          {approveCompletionMutation.isPending ? "Approving..." : "Approve Completion"}
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      {equipmentModelFilter !== "all" 
                        ? "No pending completions for this model"
                        : "No work orders pending completion approval"}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="approved" className="space-y-4">
                {/* Filters Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      Filters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Equipment Model Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Filter by Equipment Model</Label>
                      <div className="flex items-center gap-3">
                        <EquipmentModelFilter
                          models={models}
                          value={equipmentModelFilter}
                          onChange={setEquipmentModelFilter}
                          isLoading={isLoadingModels}
                        />
                        {equipmentModelFilter !== "all" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEquipmentModelFilter("all")}
                            data-testid="button-clear-model-filter"
                          >
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Date Range Filter */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Filter by Date Range</Label>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                          <Label htmlFor="start-date" className="text-xs">Start Date</Label>
                          <Input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            data-testid="input-start-date"
                          />
                        </div>
                        <div className="flex-1">
                          <Label htmlFor="end-date" className="text-xs">End Date</Label>
                          <Input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            data-testid="input-end-date"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setStartDate("");
                              setEndDate("");
                            }}
                            data-testid="button-clear-filters"
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>
                      {(startDate || endDate) && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Showing {filteredApprovedCompletions.length} of {approvedCompletions.length} work orders
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {filteredApprovedCompletions.length > 0 ? (
                  filteredApprovedCompletions.map((workOrder) => (
                    <Card key={workOrder.id} className="hover-elevate" data-testid={`approved-completion-card-${workOrder.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">{workOrder.workOrderNumber}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Equipment: {workOrder.equipmentModel || "N/A"}
                            </p>
                            {workOrder.elapsedTime && (
                              <div className="flex items-center gap-2 mt-2">
                                <Clock className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium text-primary">
                                  {workOrder.elapsedTime}
                                </span>
                              </div>
                            )}
                          </div>
                          <Badge>Approved</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {workOrder.description && (
                          <div>
                            <Label className="text-muted-foreground text-sm">Description:</Label>
                            <p>{workOrder.description}</p>
                          </div>
                        )}
                        {workOrder.teamMembers && workOrder.teamMembers.length > 0 && (
                          <div>
                            <Label className="text-muted-foreground text-sm mb-2 block">Team Members:</Label>
                            <div className="flex flex-wrap gap-2">
                              {workOrder.teamMembers.map((member: any) => (
                                <Badge key={member.id} variant="secondary">{member.fullName}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => {
                            setDetailsWorkOrderId(workOrder.id);
                            setIsDetailsDialogOpen(true);
                          }}
                          data-testid={`button-view-details-${workOrder.id}`}
                        >
                          <Info className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No approved work order completions
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="requisitions" className="space-y-4">
            <Tabs defaultValue="pending" className="space-y-4">
              <div className="w-full overflow-x-auto">
                <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:max-w-2xl lg:grid-cols-3">
                  <TabsTrigger value="pending" data-testid="tab-pending-requisitions">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                    Pending Review
                  </TabsTrigger>
                  <TabsTrigger value="approved" data-testid="tab-approved-requisitions">
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
                    Approved Items
                  </TabsTrigger>
                  <TabsTrigger value="rejected" data-testid="tab-rejected-requisitions">
                    <XCircle className="h-3.5 w-3.5 mr-1.5" />
                    Rejected Items
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="pending" className="space-y-4">
            {requisitions.length > 0 ? (
              requisitions.filter(req => req.lines.some((line: any) => !line.foremanStatus || line.foremanStatus === 'pending')).map((requisition) => (
                <Card key={requisition.id} className="hover-elevate" data-testid={`requisition-card-${requisition.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg" data-testid={`text-requisition-number-${requisition.id}`}>
                          {requisition.requisitionNumber}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          Work Order: {requisition.workOrderNumber}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Requested by: {requisition.requester?.fullName || 'Unknown'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline">{requisition.status}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold mb-3 block">Review Each Line Item:</Label>
                      <div className="space-y-3">
                        {requisition.lines.filter((line: any) => !line.foremanStatus || line.foremanStatus === 'pending').map((line) => (
                          <Card key={line.id} className="border-2" data-testid={`line-card-${line.id}`}>
                            <CardContent className="p-4 space-y-3">
                              <div className="grid grid-cols-12 gap-4 items-start">
                                <div className="col-span-1">
                                  <Badge variant="secondary">{line.lineNumber}</Badge>
                                </div>
                                <div className="col-span-11 space-y-2">
                                  <div>
                                    <p className="font-medium">{line.description}</p>
                                    <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                      <span>Unit: {line.unitOfMeasure || 'N/A'}</span>
                                      <span>Qty Requested: <strong>{line.quantityRequested}</strong></span>
                                      {line.remarks && <span>Notes: {line.remarks}</span>}
                                    </div>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <Label className="text-xs">Approved Quantity</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        max={line.quantityRequested}
                                        defaultValue={line.quantityRequested}
                                        onChange={(e) => {
                                          setLineApprovedQty(prev => ({
                                            ...prev,
                                            [line.id]: parseInt(e.target.value) || 0
                                          }));
                                        }}
                                        className="mt-1"
                                        data-testid={`input-approved-qty-${line.id}`}
                                      />
                                    </div>
                                    <div>
                                      <Label className="text-xs">Remarks (Optional for Approve, Required for Reject)</Label>
                                      <Input
                                        type="text"
                                        placeholder="Add remarks..."
                                        onChange={(e) => {
                                          setLineRemarks(prev => ({
                                            ...prev,
                                            [line.id]: e.target.value
                                          }));
                                        }}
                                        className="mt-1"
                                        data-testid={`input-remarks-${line.id}`}
                                      />
                                    </div>
                                  </div>
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleApproveLine(line)}
                                      disabled={approveLineMutation.isPending}
                                      className="flex-1"
                                      data-testid={`button-approve-line-${line.id}`}
                                    >
                                      <Check className="h-3.5 w-3.5 mr-1.5" />
                                      Approve
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => handleRejectLine(line)}
                                      disabled={rejectLineMutation.isPending}
                                      className="flex-1"
                                      data-testid={`button-reject-line-${line.id}`}
                                    >
                                      <X className="h-3.5 w-3.5 mr-1.5" />
                                      Reject
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  No pending line items to review
                </CardContent>
              </Card>
            )}
            </TabsContent>

            {/* Approved Lines Tab */}
            <TabsContent value="approved" className="space-y-4">
                {requisitions.length > 0 && requisitions.some(req => req.lines.some((line: any) => line.foremanStatus === 'approved')) ? (
                  requisitions.filter(req => req.lines.some((line: any) => line.foremanStatus === 'approved')).map((requisition) => (
                    <Card key={requisition.id} className="hover-elevate" data-testid={`approved-requisition-card-${requisition.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {requisition.requisitionNumber}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Work Order: {requisition.workOrderNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested by: {requisition.requester?.fullName || 'Unknown'}
                            </p>
                          </div>
                          <Badge variant="outline" className="bg-green-50 dark:bg-green-950">
                            <CheckCircle className="h-3.5 w-3.5 mr-1" />
                            Approved
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {requisition.lines.filter((line: any) => line.foremanStatus === 'approved').map((line: any) => (
                            <div key={line.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`approved-line-${line.id}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{line.lineNumber}</Badge>
                                  <p className="font-medium">{line.description}</p>
                                </div>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                  <span>Qty Requested: {line.quantityRequested}</span>
                                  <span>Qty Approved: <strong className="text-green-600 dark:text-green-400">{line.foremanApprovedQty}</strong></span>
                                  {line.foremanDecisionRemarks && <span>Remarks: {line.foremanDecisionRemarks}</span>}
                                </div>
                                {line.foremanDecisionAt && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Approved on {new Date(line.foremanDecisionAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No approved items
                    </CardContent>
                  </Card>
                )}
            </TabsContent>

            {/* Rejected Lines Tab */}
            <TabsContent value="rejected" className="space-y-4">
                {requisitions.length > 0 && requisitions.some(req => req.lines.some((line: any) => line.foremanStatus === 'rejected')) ? (
                  requisitions.filter(req => req.lines.some((line: any) => line.foremanStatus === 'rejected')).map((requisition) => (
                    <Card key={requisition.id} className="hover-elevate" data-testid={`rejected-requisition-card-${requisition.id}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="text-lg">
                              {requisition.requisitionNumber}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              Work Order: {requisition.workOrderNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Requested by: {requisition.requester?.fullName || 'Unknown'}
                            </p>
                          </div>
                          <Badge variant="destructive">
                            <XCircle className="h-3.5 w-3.5 mr-1" />
                            Rejected
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {requisition.lines.filter((line: any) => line.foremanStatus === 'rejected').map((line: any) => (
                            <div key={line.id} className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg border border-destructive/20" data-testid={`rejected-line-${line.id}`}>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="text-xs">{line.lineNumber}</Badge>
                                  <p className="font-medium">{line.description}</p>
                                </div>
                                <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                                  <span>Qty Requested: {line.quantityRequested}</span>
                                  {line.foremanDecisionRemarks && (
                                    <span className="text-destructive font-medium">
                                      Rejection Reason: {line.foremanDecisionRemarks}
                                    </span>
                                  )}
                                </div>
                                {line.foremanDecisionAt && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Rejected on {new Date(line.foremanDecisionAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      No rejected items
                    </CardContent>
                  </Card>
                )}
            </TabsContent>
          </Tabs>
          </TabsContent>
        </Tabs>
      </div>

      {/* Team Assignment Dialog */}
      <EmployeeSearchDialog
        open={isAssignDialogOpen}
        onOpenChange={(open) => {
          if (!assignTeamMutation.isPending) {
            setIsAssignDialogOpen(open);
            if (!open) {
              setSelectedTeamMembers([]);
              setSelectedWorkOrder(null);
            }
          }
        }}
        mode="multiple"
        selectedIds={selectedTeamMembers}
        onSelect={(teamMemberIds) => {
          if (selectedWorkOrder && teamMemberIds.length > 0) {
            assignTeamMutation.mutate({
              workOrderId: selectedWorkOrder.id,
              teamMemberIds,
            });
          }
          setSelectedTeamMembers(teamMemberIds);
        }}
        isLoading={assignTeamMutation.isPending}
        title="Assign Team Members"
        description="Select one or more team members to assign to this work order"
      />

      {/* View Inspection Dialog */}
      <Dialog open={!!viewingInspectionId} onOpenChange={(open) => !open && setViewingInspectionId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-inspection-details">
          <DialogHeader>
            <DialogTitle>Equipment Inspection Report</DialogTitle>
            <DialogDescription>
              Comprehensive inspection and reception details
            </DialogDescription>
          </DialogHeader>
          {inspectionDetails ? (
            <div className="space-y-6">
              {/* Equipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipment Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Inspection Number:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.inspectionNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Equipment:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.reception?.equipment?.model || inspectionDetails.reception?.equipment?.plantNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Plant Number:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.reception?.plantNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Service Type:</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{inspectionDetails.serviceType || "N/A"}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Inspector:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.inspector?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Completed Date:</Label>
                    <p className="font-medium mt-1">
                      {inspectionDetails.inspectionDate 
                        ? new Date(inspectionDetails.inspectionDate).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Status:</Label>
                    <div className="mt-1">
                      <Badge>{inspectionDetails.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inspection Checklist Summary */}
              {checklistItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inspection Checklist (የማረጋገጫ ዝርዝር)</CardTitle>
                    <p className="text-sm text-muted-foreground">Items with selected status</p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">ተ.ቁ</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">የመሳሪያዉ ዝርዝር</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">ያለበት ሁኔታ</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">ተጨማሪ አስተያየት</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {checklistItems
                            .filter((item: any) => {
                              return item.hasItem || item.doesNotHave || item.isWorking || 
                                     item.notWorking || item.isBroken || item.isCracked;
                            })
                            .map((item: any, index: number) => {
                              let selectedStatus = "";
                              if (item.hasItem) selectedStatus = "አለዉ";
                              else if (item.doesNotHave) selectedStatus = "የለዉም";
                              else if (item.isWorking) selectedStatus = "የሚሰራ";
                              else if (item.notWorking) selectedStatus = "የማይሰራ";
                              else if (item.isBroken) selectedStatus = "የተሰበረ";
                              else if (item.isCracked) selectedStatus = "የተሰነጠቀ";

                              return (
                                <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                  <td className="px-4 py-2 text-sm">{item.itemNumber}</td>
                                  <td className="px-4 py-2 text-sm font-medium">{item.itemDescription}</td>
                                  <td className="px-4 py-2 text-sm">{selectedStatus}</td>
                                  <td className="px-4 py-2 text-sm text-muted-foreground">{item.comments || "-"}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {checklistItems.filter((item: any) => 
                        item.hasItem || item.doesNotHave || item.isWorking || 
                        item.notWorking || item.isBroken || item.isCracked
                      ).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No checklist items selected
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading inspection details...</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance/Reception Details Dialog */}
      <Dialog open={!!viewingReceptionId} onOpenChange={(open) => !open && setViewingReceptionId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-reception-details">
          <DialogHeader>
            <DialogTitle>Maintenance Check-in Details</DialogTitle>
            <DialogDescription>
              View equipment reception and maintenance information
            </DialogDescription>
          </DialogHeader>
          {receptionDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reception Number</Label>
                  <p className="font-medium">{receptionDetails.receptionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plant Number</Label>
                  <p className="font-medium">{receptionDetails.plantNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Arrival Date</Label>
                  <p className="font-medium">{new Date(receptionDetails.arrivalDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kilometrage</Label>
                  <p className="font-medium">{receptionDetails.kilometreRiding || 'N/A'} km</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fuel Level</Label>
                  <Badge>{receptionDetails.fuelLevel || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge>{receptionDetails.status}</Badge>
                </div>
              </div>
              
              {/* Driver Information */}
              {receptionDetails.driver && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Label className="text-muted-foreground font-semibold">Driver Information</Label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{receptionDetails.driver.fullName}</p>
                    {receptionDetails.driver.email && (
                      <p className="text-sm text-muted-foreground">{receptionDetails.driver.email}</p>
                    )}
                    {receptionDetails.driver.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{receptionDetails.driver.phoneNumber}</p>
                    )}
                  </div>
                </div>
              )}
              
              {receptionDetails.reasonOfMaintenance && (
                <div>
                  <Label className="text-muted-foreground">Reason for Maintenance</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{receptionDetails.reasonOfMaintenance}</p>
                </div>
              )}
              
              {receptionDetails.issuesReported && (
                <div>
                  <Label className="text-muted-foreground">Driver Reported Issues</Label>
                  <p className="mt-1 p-3 bg-amber-50 dark:bg-amber-950 rounded-md text-sm border border-amber-200 dark:border-amber-800">
                    {receptionDetails.issuesReported}
                  </p>
                </div>
              )}

              {receptionDetails.adminIssuesReported && (
                <div>
                  <Label className="text-muted-foreground">Issues Reported by Administration Officer</Label>
                  <p className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                    {receptionDetails.adminIssuesReported}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading maintenance details...</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Requisition Dialog */}
      <Dialog open={!!selectedRequisition} onOpenChange={() => {
        setSelectedRequisition(null);
        setActionRemarks("");
      }}>
        <DialogContent data-testid="dialog-approve-requisition">
          <DialogHeader>
            <DialogTitle>Approve Parts Requisition</DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisitionNumber} - Review and approve this parts requisition
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks (Optional)</Label>
              <Textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="Add any remarks or notes..."
                rows={3}
                data-testid="textarea-approval-remarks"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setSelectedRequisition(null);
                  setActionRemarks("");
                }}
                variant="outline"
                className="flex-1"
                data-testid="button-cancel-approval"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedRequisition) {
                    approveRequisitionMutation.mutate({
                      requisitionId: selectedRequisition.id,
                      remarks: actionRemarks || undefined,
                    });
                  }
                }}
                className="flex-1"
                disabled={approveRequisitionMutation.isPending}
                data-testid="button-confirm-approval"
              >
                {approveRequisitionMutation.isPending ? "Approving..." : "Approve"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Work Order Details Dialog */}
      <WorkOrderDetailsDialog
        workOrderId={detailsWorkOrderId}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}
