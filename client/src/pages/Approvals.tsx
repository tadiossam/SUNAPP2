import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckCircle, XCircle, Clock, ArrowUp, AlertTriangle, FileText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";

interface PartsRequest {
  id: string;
  requestNumber: string;
  workOrderId?: string;
  totalCost: string;
  urgency: string;
  justification?: string;
  approvalStatus: string;
  status: string;
  createdAt: string;
  requestedBy?: { fullName: string; employeeId: string };
  workOrder?: { workOrderNumber: string; description: string };
}

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
  assignedToId?: string;
  createdAt: string;
}

export default function ApprovalsPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedRequest, setSelectedRequest] = useState<PartsRequest | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [dialogAction, setDialogAction] = useState<"approve" | "reject" | null>(null);

  // Fetch parts requests
  const { data: partsRequests, isLoading: loadingRequests } = useQuery<PartsRequest[]>({
    queryKey: ["/api/parts-requests"],
  });

  // Fetch pending approvals (for current user if logged in as supervisor)
  const { data: approvals, isLoading: loadingApprovals } = useQuery<Approval[]>({
    queryKey: ["/api/approvals?status=pending"],
  });

  // Fetch work orders pending approval
  const { data: workOrders, isLoading: loadingWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const pendingWorkOrders = workOrders?.filter(wo => wo.approvalStatus === "pending") || [];
  const pendingPartsRequests = partsRequests?.filter(pr => pr.approvalStatus === "pending") || [];

  // Approve Parts Request Mutation
  const approvePartsMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes: string }) => {
      return await apiRequest("POST", `/api/parts-requests/${id}/approve`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals?status=pending"] });
      toast({ title: t("success"), description: t("partsRequestApproved") });
      setSelectedRequest(null);
      setApprovalNotes("");
      setDialogAction(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToApprove"), variant: "destructive" });
    },
  });

  // Reject Parts Request Mutation
  const rejectPartsMutation = useMutation({
    mutationFn: async ({ id, approvedById, notes }: { id: string; approvedById: string; notes: string }) => {
      return await apiRequest("POST", `/api/parts-requests/${id}/reject`, { approvedById, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/approvals?status=pending"] });
      toast({ title: t("success"), description: t("partsRequestRejected") });
      setSelectedRequest(null);
      setApprovalNotes("");
      setDialogAction(null);
    },
    onError: () => {
      toast({ title: t("error"), description: t("failedToReject"), variant: "destructive" });
    },
  });

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
      queryClient.invalidateQueries({ queryKey: ["/api/approvals?status=pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections/completed"] });
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

  const handlePartsAction = (request: PartsRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setDialogAction(action);
  };

  const handleApprovalAction = (approval: Approval, action: "approve" | "reject") => {
    setSelectedApproval(approval);
    setDialogAction(action);
  };

  const handleWorkOrderAction = (workOrder: WorkOrder, action: "approve" | "reject") => {
    setSelectedWorkOrder(workOrder);
    setDialogAction(action);
  };

  const confirmAction = () => {
    // Note: In production, get the actual logged-in supervisor/user ID
    const approvedById = "placeholder-supervisor-id";

    if (selectedRequest && dialogAction) {
      if (dialogAction === "approve") {
        approvePartsMutation.mutate({ id: selectedRequest.id, approvedById, notes: approvalNotes });
      } else {
        rejectPartsMutation.mutate({ id: selectedRequest.id, approvedById, notes: approvalNotes });
      }
    } else if (selectedWorkOrder && dialogAction) {
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

  const getUrgencyBadge = (urgency: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      critical: { variant: "destructive", icon: AlertTriangle },
      high: { variant: "default", icon: ArrowUp },
      normal: { variant: "secondary", icon: Clock },
      low: { variant: "outline", icon: Clock },
    };
    const config = variants[urgency] || variants.normal;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {urgency.toUpperCase()}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      urgent: "destructive",
      high: "default",
      medium: "secondary",
      low: "outline",
    };
    return <Badge variant={variants[priority] || "secondary"}>{priority.toUpperCase()}</Badge>;
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
            {pendingPartsRequests.length + pendingWorkOrders.length} {t("pending")}
          </Badge>
        </div>

        <Tabs defaultValue="parts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="parts" data-testid="tab-parts-requests">
              {t("partsRequests")} ({pendingPartsRequests.length})
            </TabsTrigger>
            <TabsTrigger value="work-orders" data-testid="tab-work-orders">
              {t("workOrders")} ({pendingWorkOrders.length})
            </TabsTrigger>
            <TabsTrigger value="all-approvals" data-testid="tab-all-approvals">
              {t("allApprovals")} ({approvals?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="parts" className="space-y-4">
            {loadingRequests ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : pendingPartsRequests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("noPartsRequestsPending")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {pendingPartsRequests.map((request) => (
                  <Card key={request.id} data-testid={`card-parts-request-${request.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold">
                            {request.requestNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {request.workOrder?.workOrderNumber} - {request.workOrder?.description}
                          </p>
                        </div>
                        {getUrgencyBadge(request.urgency)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("requestedBy")}:</span>
                          <span className="font-medium">{request.requestedBy?.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("totalCost")}:</span>
                          <span className="font-mono font-semibold">${request.totalCost}</span>
                        </div>
                        {request.justification && (
                          <div className="mt-2">
                            <span className="text-muted-foreground">{t("justification")}:</span>
                            <p className="mt-1 text-sm">{request.justification}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handlePartsAction(request, "approve")}
                          data-testid={`button-approve-${request.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handlePartsAction(request, "reject")}
                          data-testid={`button-reject-${request.id}`}
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
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
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
                          variant="default"
                          className="flex-1"
                          onClick={() => handleWorkOrderAction(workOrder, "approve")}
                          data-testid={`button-approve-wo-${workOrder.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
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

          <TabsContent value="all-approvals" className="space-y-4">
            {loadingApprovals ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <Card key={i}>
                    <CardContent className="p-6">
                      <Skeleton className="h-20 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !approvals || approvals.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">{t("noApprovalsPending")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {approvals.map((approval) => (
                  <Card key={approval.id} data-testid={`card-approval-${approval.id}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <CardTitle className="text-base font-semibold">
                            {approval.referenceNumber}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">{approval.description}</p>
                        </div>
                        {getPriorityBadge(approval.priority)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("type")}:</span>
                          <span className="capitalize">{approval.approvalType.replace("_", " ")}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">{t("requestedBy")}:</span>
                          <span>{approval.requestedBy.fullName}</span>
                        </div>
                        {approval.amount && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{t("amount")}:</span>
                            <span className="font-mono font-semibold">${approval.amount}</span>
                          </div>
                        )}
                        {approval.requestNotes && (
                          <div className="mt-2">
                            <span className="text-muted-foreground">Notes:</span>
                            <p className="mt-1 text-sm whitespace-pre-line">{approval.requestNotes}</p>
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          variant="default"
                          className="flex-1"
                          onClick={() => handleApprovalAction(approval, "approve")}
                          data-testid={`button-approve-approval-${approval.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {t("approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1"
                          onClick={() => handleApprovalAction(approval, "reject")}
                          data-testid={`button-reject-approval-${approval.id}`}
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
      <Dialog open={!!dialogAction} onOpenChange={() => { setDialogAction(null); setApprovalNotes(""); }}>
        <DialogContent data-testid="dialog-approval-action">
          <DialogHeader>
            <DialogTitle>
              {dialogAction === "approve" ? t("confirmApproval") : t("confirmRejection")}
            </DialogTitle>
            <DialogDescription>
              {selectedRequest && (
                <>
                  {t("requestNumber")}: {selectedRequest.requestNumber} - ${selectedRequest.totalCost}
                </>
              )}
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
              disabled={
                approvePartsMutation.isPending ||
                rejectPartsMutation.isPending ||
                approveWorkOrderMutation.isPending ||
                rejectWorkOrderMutation.isPending ||
                approveApprovalMutation.isPending
              }
              data-testid="button-confirm-action"
            >
              {dialogAction === "approve" ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {t("approve")}
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  {t("reject")}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
