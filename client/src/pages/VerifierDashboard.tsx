import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const verifyMutation = useMutation({
    mutationFn: async (data: { workOrderId: string; decision: "approve" | "reject"; remarks: string }) => {
      return await apiRequest("POST", `/api/work-orders/${data.workOrderId}/verify`, data);
    },
    onSuccess: (_, variables) => {
      toast({
        title: variables.decision === "approve" ? "Work Order Approved" : "Work Order Rejected",
        description:
          variables.decision === "approve"
            ? "Work order has been verified and approved."
            : "Work order has been rejected and returned for revision.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/verifier/pending"] });
      setIsVerifyDialogOpen(false);
      setSelectedWorkOrder(null);
      setVerificationRemarks("");
      setVerificationDecision(null);
    },
  });

  const handleVerify = (workOrder: WorkOrder, decision: "approve" | "reject") => {
    setSelectedWorkOrder(workOrder);
    setVerificationDecision(decision);
    setVerificationRemarks("");
    setIsVerifyDialogOpen(true);
  };

  const confirmVerification = () => {
    if (selectedWorkOrder && verificationDecision) {
      verifyMutation.mutate({
        workOrderId: selectedWorkOrder.id,
        decision: verificationDecision,
        remarks: verificationRemarks,
      });
    }
  };

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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingVerification && pendingVerification.length > 0 ? (
                  pendingVerification.map((workOrder) => (
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
                          </div>
                          <div>
                            <Label className="text-muted-foreground text-sm">Description:</Label>
                            <p className="text-sm">{workOrder.description}</p>
                          </div>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No work orders pending verification
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
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
                verifyMutation.isPending || (verificationDecision === "reject" && !verificationRemarks.trim())
              }
              variant={verificationDecision === "reject" ? "destructive" : "default"}
              data-testid="button-confirm-verification"
            >
              {verificationDecision === "approve" ? "Approve" : "Reject"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
