import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, Eye, FileText, ClipboardCheck } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import {  Separator } from "@/components/ui/separator";

interface Approval {
  id: string;
  approvalType: string;
  referenceId: string;
  referenceNumber: string;
  status: string;
  priority: string;
  amount?: string;
  description: string;
  requestNotes?: string;
  createdAt: string;
  requestedBy: { fullName: string; employeeId: string };
}

interface WorkOrder {
  id: string;
  workOrderNumber: string;
  description: string;
  approvalStatus: string;
  estimatedCost?: string;
  priority?: string;
  workType?: string;
  equipmentId?: string;
  equipment?: { equipmentId: string; name: string };
  assignedToId?: string;
  assignedTo?: { fullName: string };
  createdAt: string;
}

interface Inspection {
  id: string;
  inspectionNumber: string;
  status: string;
  approvalStatus: string;
  serviceType: string;
  inspectorId?: string;
  inspector?: { fullName: string };
  receptionId: string;
  reception?: {
    receptionNumber: string;
    equipmentId: string;
    equipment?: { equipmentId: string; name: string };
  };
  createdAt: string;
}

interface ChecklistItem {
  id: string;
  inspectionId: string;
  itemNumber: number;
  itemNameAmharic: string;
  status: string;
  comments?: string;
}

export default function ApprovalsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);
  const [viewDetailType, setViewDetailType] = useState<"inspection" | "workorder" | null>(null);

  // Get authenticated user
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });
  
  const currentUser = (authData as any)?.user;

  // Fetch pending approvals assigned to current user
  const approvalsQueryKey = currentUser?.id 
    ? [`/api/approvals?status=pending&assignedToId=${currentUser.id}`]
    : ["/api/approvals?status=pending"];
  
  const { data: approvals, isLoading: loadingApprovals } = useQuery<Approval[]>({
    queryKey: approvalsQueryKey,
    enabled: !!currentUser,
  });

  // Fetch work orders pending approval
  const { data: workOrders, isLoading: loadingWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  // Fetch all inspections (to filter by status)
  const { data: allInspections, isLoading: loadingInspections } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections"],
  });

  // Fetch checklist items for selected inspection
  const { data: checklistItems } = useQuery<ChecklistItem[]>({
    queryKey: ["/api/inspections", selectedInspection?.id, "checklist"],
    enabled: !!selectedInspection?.id,
  });

  // Filter approvals by type
  const inspectionApprovals = approvals?.filter(a => a.approvalType === "inspection") || [];
  const pendingWorkOrders = workOrders?.filter(wo => wo.approvalStatus === "pending") || [];
  const pendingInspections = allInspections?.filter(insp => insp.status === "waiting_for_approval") || [];

  // Approve Work Order Mutation
  const approveWorkOrderMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes: string }) => {
      return await apiRequest("POST", `/api/work-orders/${id}/approve`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: t("success"), description: t("workOrderApproved") });
      setSelectedWorkOrder(null);
      setApprovalNotes("");
      setDialogAction(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToApprove"), variant: "destructive" });
    },
  });

  // Reject Work Order Mutation
  const rejectWorkOrderMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes: string }) => {
      return await apiRequest("POST", `/api/work-orders/${id}/reject`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: t("success"), description: t("workOrderRejected") });
      setSelectedWorkOrder(null);
      setApprovalNotes("");
      setDialogAction(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToReject"), variant: "destructive" });
    },
  });

  // General Approval Mutation (for inspections and other approval types)
  const approveApprovalMutation = useMutation({
    mutationFn: async ({ id, status, approvalNotes }: { id: string; status: string; approvalNotes?: string }) => {
      const response = await apiRequest("PUT", `/api/approvals/${id}`, { status, approvalNotes });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ predicate: (query) => 
        query.queryKey[0]?.toString().startsWith("/api/approvals") ?? false
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({ title: t("success"), description: "Approval processed successfully" });
      setSelectedApproval(null);
      setApprovalNotes("");
      setDialogAction(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToApprove"), variant: "destructive" });
    },
  });

  // Approve Inspection Mutation
  const approveInspectionMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes?: string }) => {
      return await apiRequest("POST", `/api/inspections/${id}/approve`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({ title: t("success"), description: "Inspection approved successfully" });
      setSelectedInspection(null);
      setApprovalNotes("");
      setDialogAction(null);
      setViewDetailType(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToApprove"), variant: "destructive" });
    },
  });

  // Reject Inspection Mutation
  const rejectInspectionMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes?: string }) => {
      return await apiRequest("POST", `/api/inspections/${id}/reject`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      toast({ title: t("success"), description: "Inspection rejected" });
      setSelectedInspection(null);
      setApprovalNotes("");
      setDialogAction(null);
      setViewDetailType(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToReject"), variant: "destructive" });
    },
  });

  const handleApprovalAction = (approval: Approval, action: "approve" | "reject") => {
    setSelectedApproval(approval);
    setDialogAction(action);
  };

  const handleWorkOrderAction = (workOrder: WorkOrder, action: "approve" | "reject") => {
    setSelectedWorkOrder(workOrder);
    setDialogAction(action);
  };

  const confirmAction = () => {
    // Get the actual logged-in user ID from auth context
    if (!currentUser?.id) {
      toast({
        title: t("error"),
        description: "User not authenticated",
        variant: "destructive",
      });
      return;
    }

    const approvedById = currentUser.id;

    if (selectedWorkOrder && dialogAction) {
      if (dialogAction === "approve") {
        approveWorkOrderMutation.mutate({ id: selectedWorkOrder.id, approvedById, notes: approvalNotes });
      } else {
        rejectWorkOrderMutation.mutate({ id: selectedWorkOrder.id, approvedById, notes: approvalNotes });
      }
    } else if (selectedApproval && dialogAction) {
      const status = dialogAction === "approve" ? "approved" : "rejected";
      approveApprovalMutation.mutate({ id: selectedApproval.id, status, approvalNotes });
    }
  };

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      urgent: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    return <Badge variant={variants[priority] || "secondary"}>{priority.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    if (!status) return <Badge variant="secondary">N/A</Badge>;
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      approved: "default",
      rejected: "destructive",
      waiting_for_approval: "secondary",
      in_progress: "outline",
    };
    return <Badge variant={variants[status] || "secondary"}>{status.toUpperCase().replace(/_/g, " ")}</Badge>;
  };

  const openInspectionDetail = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setViewDetailType("inspection");
  };

  const openWorkOrderDetail = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setViewDetailType("workorder");
  };

  return (
    <div className="h-full overflow-auto">
      <div className="container max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-approvals-title">
              {t("approvals")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t("reviewPendingApprovals")}
            </p>
          </div>
          <Badge variant="outline" className="gap-2">
            <Clock className="h-3.5 w-3.5" />
            {pendingInspections.length + pendingWorkOrders.length} {t("pending")}
          </Badge>
        </div>

        <Tabs defaultValue="inspections" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="inspections" data-testid="tab-inspections">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Inspections ({pendingInspections.length})
            </TabsTrigger>
            <TabsTrigger value="work-orders" data-testid="tab-work-orders">
              <FileText className="h-4 w-4 mr-2" />
              {t("workOrders")} ({pendingWorkOrders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inspections" className="space-y-4">
            {loadingInspections ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingInspections.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No inspections pending approval</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingInspections.map((inspection) => (
                  <Card key={inspection.id} data-testid={`card-inspection-${inspection.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold">
                            {inspection.inspectionNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {inspection.reception?.equipment?.equipmentId} - {inspection.reception?.equipment?.name}
                          </p>
                        </div>
                        {getStatusBadge(inspection.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Service Type:</span>
                          <span className="capitalize">{inspection.serviceType?.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Inspector:</span>
                          <span>{inspection.inspector?.fullName || "N/A"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Reception:</span>
                          <span>{inspection.reception?.receptionNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created:</span>
                          <span>{new Date(inspection.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openInspectionDetail(inspection)}
                          data-testid={`button-view-inspection-${inspection.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => {
                            // Find the corresponding approval for this inspection
                            const approval = approvals?.find(
                              a => a.approvalType === "inspection" && a.referenceId === inspection.id
                            );
                            if (approval) {
                              handleApprovalAction(approval, "approve");
                            }
                          }}
                          data-testid={`button-approve-inspection-${inspection.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const approval = approvals?.find(
                              a => a.approvalType === "inspection" && a.referenceId === inspection.id
                            );
                            if (approval) {
                              handleApprovalAction(approval, "reject");
                            }
                          }}
                          data-testid={`button-reject-inspection-${inspection.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("reject")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="work-orders" className="space-y-4">
            {loadingWorkOrders ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingWorkOrders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("noWorkOrdersPending")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingWorkOrders.map((workOrder) => (
                  <Card key={workOrder.id} data-testid={`card-work-order-${workOrder.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold">
                            {workOrder.workOrderNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{workOrder.description}</p>
                        </div>
                        {getPriorityBadge(workOrder.priority)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
                        {workOrder.equipment && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Equipment:</span>
                            <span>{workOrder.equipment.equipmentId} - {workOrder.equipment.name}</span>
                          </div>
                        )}
                        {workOrder.workType && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Work Type:</span>
                            <span className="capitalize">{workOrder.workType.replace("_", " ")}</span>
                          </div>
                        )}
                        {workOrder.assignedTo && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Assigned To:</span>
                            <span>{workOrder.assignedTo.fullName}</span>
                          </div>
                        )}
                        {workOrder.estimatedCost && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("estimatedCost")}:</span>
                            <span className="font-mono font-semibold">${workOrder.estimatedCost}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("createdAt")}:</span>
                          <span>{new Date(workOrder.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => openWorkOrderDetail(workOrder)}
                          data-testid={`button-view-wo-${workOrder.id}`}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleWorkOrderAction(workOrder, "approve")}
                          data-testid={`button-approve-wo-${workOrder.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleWorkOrderAction(workOrder, "reject")}
                          data-testid={`button-reject-wo-${workOrder.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          {t("reject")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval/Rejection Dialog */}
      <Dialog open={!!dialogAction && !viewDetailType} onOpenChange={() => { setDialogAction(null); setApprovalNotes(""); }}>
        <DialogContent data-testid="dialog-approval-action">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? t("confirmApproval") : t("confirmRejection")}
            </DialogTitle>
            <DialogDescription>
              {selectedWorkOrder && (
                <>
                  {t("workOrder")}: {selectedWorkOrder.workOrderNumber}
                </>
              )}
              {selectedApproval && (
                <>
                  {selectedApproval.approvalType.replace("_", " ").toUpperCase()}: {selectedApproval.referenceNumber}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notes">{t("notes")} ({t("optional")})</Label>
              <Textarea
                id="notes"
                placeholder={t("addNotesHere")}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                rows={4}
                data-testid="textarea-approval-notes"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setDialogAction(null); setApprovalNotes(""); }}
              data-testid="button-cancel-action"
            >
              {t("cancel")}
            </Button>
            <Button
              variant={dialogAction === "approve" ? "default" : "destructive"}
              onClick={confirmAction}
              data-testid="button-confirm-action"
            >
              {dialogAction === "approve" ? t("approve") : t("reject")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inspection Detail Dialog */}
      <Dialog open={viewDetailType === "inspection"} onOpenChange={() => { setViewDetailType(null); setSelectedInspection(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="dialog-inspection-detail">
          <DialogHeader>
            <DialogTitle>Inspection Details: {selectedInspection?.inspectionNumber}</DialogTitle>
            <DialogDescription>
              Complete inspection information including checklist
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Equipment</Label>
                    <p className="font-medium">{selectedInspection?.reception?.equipment?.equipmentId} - {selectedInspection?.reception?.equipment?.name}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Reception Number</Label>
                    <p className="font-medium">{selectedInspection?.reception?.receptionNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Service Type</Label>
                    <p className="font-medium capitalize">{selectedInspection?.serviceType?.replace("_", " ")}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Inspector</Label>
                    <p className="font-medium">{selectedInspection?.inspector?.fullName || "N/A"}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">{getStatusBadge(selectedInspection?.status || "")}</div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Created At</Label>
                    <p className="font-medium">{new Date(selectedInspection?.createdAt || "").toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-4">Inspection Checklist</h3>
                {checklistItems && checklistItems.length > 0 ? (
                  <div className="space-y-2">
                    {checklistItems.map((item) => (
                      <Card key={item.id}>
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <CardTitle className="text-sm font-medium">
                                {item.itemNumber}. {item.itemNameAmharic}
                              </CardTitle>
                              {item.comments && (
                                <CardDescription className="mt-2">{item.comments}</CardDescription>
                              )}
                            </div>
                            {getStatusBadge(item.status)}
                          </div>
                        </CardHeader>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No checklist items found</p>
                )}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => { setViewDetailType(null); setSelectedInspection(null); }}
              data-testid="button-close-inspection-detail"
            >
              Close
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!currentUser?.id) {
                  toast({
                    title: t("error"),
                    description: "User not authenticated",
                    variant: "destructive",
                  });
                  return;
                }
                if (selectedInspection?.id) {
                  rejectInspectionMutation.mutate({ 
                    id: selectedInspection.id, 
                    approvedById: currentUser.id,
                    notes: approvalNotes
                  });
                }
              }}
              disabled={rejectInspectionMutation.isPending}
              data-testid="button-reject-inspection-detail"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
            <Button
              variant="default"
              onClick={() => {
                if (!currentUser?.id) {
                  toast({
                    title: t("error"),
                    description: "User not authenticated",
                    variant: "destructive",
                  });
                  return;
                }
                if (selectedInspection?.id) {
                  approveInspectionMutation.mutate({ 
                    id: selectedInspection.id, 
                    approvedById: currentUser.id,
                    notes: approvalNotes
                  });
                }
              }}
              disabled={approveInspectionMutation.isPending}
              data-testid="button-approve-inspection-detail"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Work Order Detail Dialog */}
      <Dialog open={viewDetailType === "workorder"} onOpenChange={() => { setViewDetailType(null); setSelectedWorkOrder(null); }}>
        <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="dialog-workorder-detail">
          <DialogHeader>
            <DialogTitle>Work Order Details: {selectedWorkOrder?.workOrderNumber}</DialogTitle>
            <DialogDescription>
              Complete work order information
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              <div className="grid gap-4">
                <div>
                  <Label className="text-muted-foreground">Description</Label>
                  <p className="font-medium">{selectedWorkOrder?.description}</p>
                </div>
                {selectedWorkOrder?.equipment && (
                  <div>
                    <Label className="text-muted-foreground">Equipment</Label>
                    <p className="font-medium">{selectedWorkOrder.equipment.equipmentId} - {selectedWorkOrder.equipment.name}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  {selectedWorkOrder?.workType && (
                    <div>
                      <Label className="text-muted-foreground">Work Type</Label>
                      <p className="font-medium capitalize">{selectedWorkOrder.workType.replace("_", " ")}</p>
                    </div>
                  )}
                  {selectedWorkOrder?.priority && (
                    <div>
                      <Label className="text-muted-foreground">Priority</Label>
                      <div className="mt-1">{getPriorityBadge(selectedWorkOrder.priority)}</div>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {selectedWorkOrder?.assignedTo && (
                    <div>
                      <Label className="text-muted-foreground">Assigned To</Label>
                      <p className="font-medium">{selectedWorkOrder.assignedTo.fullName}</p>
                    </div>
                  )}
                  {selectedWorkOrder?.estimatedCost && (
                    <div>
                      <Label className="text-muted-foreground">Estimated Cost</Label>
                      <p className="font-medium font-mono">${selectedWorkOrder.estimatedCost}</p>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Approval Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedWorkOrder?.approvalStatus || "")}</div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Created At</Label>
                  <p className="font-medium">{new Date(selectedWorkOrder?.createdAt || "").toLocaleString()}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => { setViewDetailType(null); setSelectedWorkOrder(null); }}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
