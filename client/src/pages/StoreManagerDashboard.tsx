import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Package, CheckCircle, XCircle, Clock, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ItemRequisition = {
  id: string;
  requisitionNumber: string;
  workOrderId: string;
  workOrderNumber?: string;
  requesterId: string;
  requesterName?: string;
  workshopId?: string;
  workshopName?: string;
  status: string;
  foremanApprovedAt?: string;
  storeApprovedAt?: string;
  createdAt: string;
  lines?: ItemRequisitionLine[];
};

type ItemRequisitionLine = {
  id: string;
  lineNumber: number;
  description: string;
  unitOfMeasure?: string;
  quantityRequested: number;
  quantityApproved?: number;
  status: string;
  remarks?: string;
  sparePartId?: string;
  partName?: string;
  stockStatus?: string;
};

export default function StoreManagerDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequisition, setSelectedRequisition] = useState<ItemRequisition | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [lineApprovals, setLineApprovals] = useState<Record<string, { approved: number; status: string }>>({});

  // Fetch item requisitions
  const { data: requisitions = [], isLoading } = useQuery<ItemRequisition[]>({
    queryKey: ["/api/item-requisitions/store-manager"],
  });

  // Approve requisition mutation
  const approveMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks?: string }) => {
      const res = await apiRequest("POST", `/api/item-requisitions/${id}/approve-store`, {
        remarks,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/store-manager"] });
      toast({
        title: "Success",
        description: "Item requisition approved successfully",
      });
      setIsApprovalDialogOpen(false);
      setSelectedRequisition(null);
      setApprovalRemarks("");
      setLineApprovals({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to approve requisition",
        variant: "destructive",
      });
    },
  });

  // Reject requisition mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ id, remarks }: { id: string; remarks: string }) => {
      const res = await apiRequest("POST", `/api/item-requisitions/${id}/reject-store`, { remarks });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/store-manager"] });
      toast({
        title: "Rejected",
        description: "Item requisition rejected",
      });
      setIsApprovalDialogOpen(false);
      setSelectedRequisition(null);
      setApprovalRemarks("");
    },
  });

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch = req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requesterName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = 
      (activeTab === "pending" && req.status === "pending_store") ||
      (activeTab === "approved" && req.status === "approved") ||
      (activeTab === "rejected" && req.status === "rejected") ||
      (activeTab === "all");

    return matchesSearch && matchesTab;
  });

  const handleOpenApproval = (requisition: ItemRequisition) => {
    setSelectedRequisition(requisition);
    setIsApprovalDialogOpen(true);
    
    // Initialize line approvals with default values
    const initialApprovals: Record<string, { approved: number; status: string }> = {};
    requisition.lines?.forEach(line => {
      initialApprovals[line.id] = {
        approved: line.quantityRequested,
        status: "approved"
      };
    });
    setLineApprovals(initialApprovals);
  };

  const updateLineApproval = (lineId: string, approved: number, status: string) => {
    setLineApprovals(prev => ({
      ...prev,
      [lineId]: { approved, status }
    }));
  };

  const handleApprove = () => {
    if (!selectedRequisition) return;
    approveMutation.mutate({
      id: selectedRequisition.id,
      remarks: approvalRemarks,
    });
  };

  const handleReject = () => {
    if (!selectedRequisition) return;
    rejectMutation.mutate({
      id: selectedRequisition.id,
      remarks: approvalRemarks,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending_store":
      case "pending_foreman":
        return "secondary";
      case "approved":
        return "default";
      case "rejected":
        return "destructive";
      case "backordered":
      case "pending_purchase":
        return "secondary";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending_store":
      case "pending_foreman":
        return Clock;
      case "approved":
        return CheckCircle;
      case "rejected":
        return XCircle;
      case "backordered":
      case "pending_purchase":
        return ShoppingCart;
      default:
        return Package;
    }
  };

  return (
    <div className="h-full overflow-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Store Manager Dashboard
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and approve item requisitions
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by requisition number, work order, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-requisitions"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({requisitions.filter(r => r.status === "pending_store").length})
          </TabsTrigger>
          <TabsTrigger value="approved" data-testid="tab-approved">
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" data-testid="tab-rejected">
            Rejected
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading requisitions...</div>
          ) : filteredRequisitions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8 text-muted-foreground">
                No requisitions found
              </CardContent>
            </Card>
          ) : (
            filteredRequisitions.map((requisition) => {
              const StatusIcon = getStatusIcon(requisition.status);
              return (
                <Card key={requisition.id} className="hover-elevate">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          {requisition.requisitionNumber}
                        </CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>WO: {requisition.workOrderNumber || "N/A"}</span>
                          <span>•</span>
                          <span>{requisition.requesterName}</span>
                          {requisition.workshopName && (
                            <>
                              <span>•</span>
                              <span>{requisition.workshopName}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge variant={getStatusColor(requisition.status)}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {requisition.status.replace(/_/g, " ")}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Items:</span> {requisition.lines?.length || 0}
                      </div>
                      {requisition.status === "pending_store" && (
                        <Button
                          onClick={() => handleOpenApproval(requisition)}
                          className="w-full"
                          data-testid={`button-review-${requisition.id}`}
                        >
                          Review Requisition
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Item Requisition</DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisitionNumber} - Approve or reject line items
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-6">
              {/* Requisition Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Requester</Label>
                  <div className="mt-1">{selectedRequisition.requesterName}</div>
                </div>
                <div>
                  <Label>Workshop</Label>
                  <div className="mt-1">{selectedRequisition.workshopName || "N/A"}</div>
                </div>
                <div>
                  <Label>Work Order</Label>
                  <div className="mt-1">{selectedRequisition.workOrderNumber || "N/A"}</div>
                </div>
                <div>
                  <Label>Date</Label>
                  <div className="mt-1">{new Date(selectedRequisition.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <Label>Line Items</Label>
                <div className="mt-2 space-y-3">
                  {selectedRequisition.lines?.map((line) => (
                    <Card key={line.id}>
                      <CardContent className="pt-4">
                        <div className="grid gap-4">
                          <div>
                            <div className="font-medium">{line.description}</div>
                            <div className="text-sm text-muted-foreground mt-1">
                              Requested: {line.quantityRequested} {line.unitOfMeasure || "pcs"}
                              {line.partName && <span> • Part: {line.partName}</span>}
                              {line.stockStatus && (
                                <Badge variant="secondary" className="ml-2">
                                  {line.stockStatus}
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`qty-${line.id}`}>Approved Quantity</Label>
                              <Input
                                id={`qty-${line.id}`}
                                type="number"
                                min="0"
                                max={line.quantityRequested}
                                value={lineApprovals[line.id]?.approved || line.quantityRequested}
                                onChange={(e) => updateLineApproval(
                                  line.id,
                                  parseInt(e.target.value) || 0,
                                  lineApprovals[line.id]?.status || "approved"
                                )}
                              />
                            </div>
                            <div>
                              <Label htmlFor={`status-${line.id}`}>Status</Label>
                              <select
                                id={`status-${line.id}`}
                                className="w-full h-9 rounded-md border border-input bg-background px-3"
                                value={lineApprovals[line.id]?.status || "approved"}
                                onChange={(e) => updateLineApproval(
                                  line.id,
                                  lineApprovals[line.id]?.approved || line.quantityRequested,
                                  e.target.value
                                )}
                              >
                                <option value="approved">Approved</option>
                                <option value="backordered">Backordered</option>
                                <option value="rejected">Rejected</option>
                              </select>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Remarks */}
              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Add any notes or remarks..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              data-testid="button-reject-requisition"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject All
            </Button>
            <Button
              onClick={handleApprove}
              disabled={approveMutation.isPending || rejectMutation.isPending}
              data-testid="button-approve-requisition"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
