import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle, XCircle, ClipboardCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentModel: string;
  status: string;
  priority: string;
  description: string;
  completedBy?: string;
  completedAt?: string;
};

export default function VerifierDashboard() {
  const { toast } = useToast();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [verificationRemarks, setVerificationRemarks] = useState("");
  const [isVerifyDialogOpen, setIsVerifyDialogOpen] = useState(false);
  const [verificationDecision, setVerificationDecision] = useState<"approve" | "reject" | null>(null);

  const { data: pendingVerification } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/verifier/pending"],
  });

  const { data: verifiedWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/verifier/verified"],
  });

  const { data: rejectedWorkOrders } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/verifier/rejected"],
  });

  const approveMutation = useMutation({
    mutationFn: async (data: { workOrderId: string; notes?: string }) => {
      return await apiRequest("POST", `/api/work-orders/${data.workOrderId}/approve-verification`, {
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Approved",
        description: "Work order has been verified and sent to supervisor",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/verifier/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/verifier/verified"] });
      setIsVerifyDialogOpen(false);
      setSelectedWorkOrder(null);
      setVerificationRemarks("");
      setVerificationDecision(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to approve verification";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (data: { workOrderId: string; rejectionNotes: string }) => {
      return await apiRequest("POST", `/api/work-orders/${data.workOrderId}/reject-verification`, {
        rejectionNotes: data.rejectionNotes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Verification Rejected",
        description: "Work order has been sent back to team for corrections",
        variant: "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/verifier/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/verifier/rejected"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/active"] });
      setIsVerifyDialogOpen(false);
      setSelectedWorkOrder(null);
      setVerificationRemarks("");
      setVerificationDecision(null);
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to reject verification";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleVerify = (workOrder: WorkOrder, decision: "approve" | "reject") => {
    setSelectedWorkOrder(workOrder);
    setVerificationDecision(decision);
    setVerificationRemarks("");
    setIsVerifyDialogOpen(true);
  };

  const confirmVerification = () => {
    if (!selectedWorkOrder || !verificationDecision) return;

    if (verificationDecision === "reject" && !verificationRemarks.trim()) {
      toast({
        title: "Rejection Notes Required",
        description: "Please provide notes explaining why this work is being rejected",
        variant: "destructive",
      });
      return;
    }

    if (verificationDecision === "approve") {
      approveMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        notes: verificationRemarks.trim() || undefined,
      });
    } else {
      rejectMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        rejectionNotes: verificationRemarks.trim(),
      });
    }
  };

  const renderWorkOrderCard = (workOrder: WorkOrder, showActions: boolean = false) => (
    <Card key={workOrder.id} className="hover-elevate" data-testid={`work-order-card-${workOrder.id}`}>
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg" data-testid={`text-work-order-number-${workOrder.id}`}>
              {workOrder.workOrderNumber}
            </h3>
            <div className="flex gap-2">
              <Badge variant={workOrder.priority === "high" ? "destructive" : "secondary"}>
                {workOrder.priority}
              </Badge>
              <Badge variant="outline">{workOrder.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-muted-foreground text-sm">Equipment:</Label>
              <p className="font-medium">{workOrder.equipmentModel}</p>
            </div>
            {workOrder.completedBy && (
              <div>
                <Label className="text-muted-foreground text-sm">Completed By:</Label>
                <p className="font-medium">{workOrder.completedBy}</p>
              </div>
            )}
            {workOrder.completedAt && (
              <div>
                <Label className="text-muted-foreground text-sm">Completed At:</Label>
                <p className="font-medium">{new Date(workOrder.completedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          <div>
            <Label className="text-muted-foreground text-sm">Description:</Label>
            <p className="text-sm">{workOrder.description}</p>
          </div>
          {showActions && (
            <div className="flex gap-3 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleVerify(workOrder, "reject")}
                data-testid={`button-reject-${workOrder.id}`}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleVerify(workOrder, "approve")}
                data-testid={`button-approve-${workOrder.id}`}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Verifier Dashboard
            </h1>
            <p className="text-muted-foreground">Quality control and work order verification</p>
          </div>
          <ClipboardCheck className="h-12 w-12 text-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="pending" className="space-y-6">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-3" data-testid="tabs-verifier">
              <TabsTrigger value="pending" data-testid="tab-pending">
                Pending Verification ({pendingVerification?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="verified" data-testid="tab-verified">
                Verified ({verifiedWorkOrders?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="rejected" data-testid="tab-rejected">
                Rejected ({rejectedWorkOrders?.length || 0})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending">
            <div className="space-y-4">
              {pendingVerification && pendingVerification.length > 0 ? (
                pendingVerification.map((workOrder) => renderWorkOrderCard(workOrder, true))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No work orders pending verification
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="verified">
            <div className="space-y-4">
              {verifiedWorkOrders && verifiedWorkOrders.length > 0 ? (
                verifiedWorkOrders.map((workOrder) => renderWorkOrderCard(workOrder, false))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No verified work orders
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="rejected">
            <div className="space-y-4">
              {rejectedWorkOrders && rejectedWorkOrders.length > 0 ? (
                rejectedWorkOrders.map((workOrder) => renderWorkOrderCard(workOrder, false))
              ) : (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    No rejected work orders
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Verification Dialog */}
      <Dialog open={isVerifyDialogOpen} onOpenChange={setIsVerifyDialogOpen}>
        <DialogContent data-testid="dialog-verify-work-order">
          <DialogHeader>
            <DialogTitle>
              {verificationDecision === "approve" ? "Approve Work Order" : "Reject Work Order"}
            </DialogTitle>
            <DialogDescription>
              {verificationDecision === "approve"
                ? "Confirm that the work has been completed to quality standards."
                : "Provide feedback on why this work order is being rejected."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Remarks / Feedback</Label>
              <Textarea
                value={verificationRemarks}
                onChange={(e) => setVerificationRemarks(e.target.value)}
                placeholder={
                  verificationDecision === "approve"
                    ? "Optional: Add any quality notes or observations..."
                    : "Required: Explain what needs to be fixed or improved..."
                }
                rows={4}
                data-testid="textarea-verification-remarks"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsVerifyDialogOpen(false)} data-testid="button-cancel">
              Cancel
            </Button>
            <Button
              onClick={confirmVerification}
              disabled={
                approveMutation.isPending || rejectMutation.isPending || (verificationDecision === "reject" && !verificationRemarks.trim())
              }
              variant={verificationDecision === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-verification"
            >
              {approveMutation.isPending || rejectMutation.isPending 
                ? (verificationDecision === "approve" ? "Approving..." : "Rejecting...")
                : (verificationDecision === "approve" ? "Approve" : "Reject")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
