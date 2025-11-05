import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Package, CheckCircle, XCircle, Clock, ShoppingCart, AlertTriangle, FileText, Printer, Truck, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ItemRequisition = {
  id: string;
  requisitionNumber: string;
  workOrderId: string;
  requesterId: string;
  status: string;
  foremanApprovedAt?: string;
  storeApprovedAt?: string;
  createdAt: string;
  lines?: ItemRequisitionLine[];
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
  availableStock?: number;
};

type LineDecision = {
  lineId: string;
  action: 'approve' | 'reject' | 'backorder';
  quantityApproved?: number;
  remarks?: string;
};

type PurchaseRequest = {
  id: string;
  purchaseRequestNumber: string;
  quantityRequested: number;
  quantityReceived: number;
  status: string;
  unitPrice: string;
  totalPrice: string;
  currency: string;
  dateRequested: string;
  dateApproved: string;
  orderDate: string;
  receivedDate: string;
  notes: string;
  createdAt: string;
  lineItem?: ItemRequisitionLine;
  requisition?: ItemRequisition;
  sparePart?: {
    id: string;
    partName: string;
    partNumber: string;
  };
  requestedBy?: {
    id: string;
    fullName: string;
  };
  foremanApprovedBy?: {
    id: string;
    fullName: string;
  };
  storeManager?: {
    id: string;
    fullName: string;
  };
};

export default function StoreManagerDashboard() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedRequisition, setSelectedRequisition] = useState<ItemRequisition | null>(null);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvalRemarks, setApprovalRemarks] = useState("");
  const [lineDecisions, setLineDecisions] = useState<Record<string, LineDecision>>({});

  // Fetch item requisitions
  const { data: requisitions = [], isLoading } = useQuery<ItemRequisition[]>({
    queryKey: ["/api/item-requisitions/store-manager"],
  });

  // Fetch purchase requests
  const { data: purchaseRequests = [], isLoading: isLoadingPurchases } = useQuery<PurchaseRequest[]>({
    queryKey: ["/api/purchase-requests"],
  });

  // Process line decisions mutation
  const processLinesMutation = useMutation({
    mutationFn: async ({ id, lineDecisions, generalRemarks }: { 
      id: string; 
      lineDecisions: LineDecision[]; 
      generalRemarks?: string 
    }) => {
      const res = await apiRequest("POST", `/api/item-requisitions/${id}/process-lines`, {
        lineDecisions,
        generalRemarks,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions/store-manager"] });
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-requests"] });
      toast({
        title: "Success",
        description: "Line items processed successfully",
      });
      setIsApprovalDialogOpen(false);
      setSelectedRequisition(null);
      setApprovalRemarks("");
      setLineDecisions({});
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process line items",
        variant: "destructive",
      });
    },
  });

  // Mark purchase order as ordered mutation
  const markAsOrderedMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/purchase-requests/${id}`, {
        status: "ordered",
        orderDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-requests"] });
      toast({
        title: "Success",
        description: "Purchase order marked as ordered",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark purchase order as received/completed mutation
  const markAsReceivedMutation = useMutation({
    mutationFn: async (data: { id: string; quantityReceived: number }) => {
      return apiRequest("PATCH", `/api/purchase-requests/${data.id}`, {
        status: "completed",
        receivedDate: new Date().toISOString(),
        quantityReceived: data.quantityReceived,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/purchase-requests"] });
      toast({
        title: "Success",
        description: "Purchase order marked as completed and stock updated",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesSearch = req.requisitionNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.workOrder?.workOrderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab = 
      (activeTab === "pending" && req.status === "pending_store") ||
      (activeTab === "approved" && (req.status === "approved" || req.status === "waiting_purchase")) ||
      (activeTab === "rejected" && req.status === "rejected") ||
      (activeTab === "purchase_orders") ||
      (activeTab === "all");

    return matchesSearch && matchesTab;
  });

  const handleOpenApproval = (requisition: ItemRequisition) => {
    setSelectedRequisition(requisition);
    setIsApprovalDialogOpen(true);
    
    // Initialize line decisions with default approve action
    const initialDecisions: Record<string, LineDecision> = {};
    requisition.lines?.forEach(line => {
      initialDecisions[line.id] = {
        lineId: line.id,
        action: 'approve',
        quantityApproved: line.quantityRequested,
        remarks: '',
      };
    });
    setLineDecisions(initialDecisions);
  };

  const updateLineDecision = (lineId: string, updates: Partial<LineDecision>) => {
    setLineDecisions(prev => ({
      ...prev,
      [lineId]: { ...prev[lineId], ...updates, lineId }
    }));
  };

  const handleProcessLines = () => {
    if (!selectedRequisition) return;
    
    const decisions = Object.values(lineDecisions);
    
    // Validate that all lines have decisions
    if (decisions.length === 0) {
      toast({
        title: "Error",
        description: "Please make a decision for at least one line item",
        variant: "destructive",
      });
      return;
    }

    processLinesMutation.mutate({
      id: selectedRequisition.id,
      lineDecisions: decisions,
      generalRemarks: approvalRemarks,
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
      case "waiting_purchase":
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
      case "waiting_purchase":
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
          Review and approve item requisitions, manage purchase orders
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
          <TabsTrigger value="purchase_orders" data-testid="tab-purchase-orders">
            Purchase Orders ({purchaseRequests.filter(pr => pr.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all">
            All
          </TabsTrigger>
        </TabsList>

        {/* Requisitions Tabs */}
        {activeTab !== "purchase_orders" && (
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
                            <span>WO: {requisition.workOrder?.workOrderNumber || "N/A"}</span>
                            <span>•</span>
                            <span>By: {requisition.requester?.fullName || "Unknown"}</span>
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
        )}

        {/* Purchase Orders Tab */}
        {activeTab === "purchase_orders" && (
          <TabsContent value="purchase_orders" className="mt-6 space-y-2">
            {isLoadingPurchases ? (
              <div className="text-center py-8 text-muted-foreground">Loading purchase orders...</div>
            ) : purchaseRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8 text-muted-foreground">
                  No purchase orders found
                </CardContent>
              </Card>
            ) : (
              purchaseRequests.map((request) => {
                const statusColors: Record<string, string> = {
                  pending: "warning",
                  ordered: "info",
                  completed: "success",
                  cancelled: "destructive",
                };
                const statusIcons: Record<string, any> = {
                  pending: Clock,
                  ordered: Package,
                  completed: CheckCircle,
                  cancelled: XCircle,
                };
                const StatusIcon = statusIcons[request.status] || Package;
                
                return (
                  <Card key={request.id} className="p-4 hover-elevate" data-testid={`card-po-${request.id}`}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <StatusIcon className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="font-semibold text-base">{request.purchaseRequestNumber}</span>
                      </div>
                      
                      <Badge variant={statusColors[request.status] as any} className="flex-shrink-0">
                        {request.status.replace(/_/g, ' ')}
                      </Badge>

                      <div className="flex-1 grid grid-cols-4 gap-4 min-w-0">
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Part</div>
                          <div className="font-medium text-sm truncate">{request.sparePart?.partName || request.lineItem?.description || '-'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Requested By</div>
                          <div className="font-medium text-sm truncate">{request.requestedBy?.fullName || '-'}</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Quantity</div>
                          <div className="font-medium text-sm">{request.quantityRequested} units</div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs text-muted-foreground">Date Requested</div>
                          <div className="font-medium text-sm">{new Date(request.dateRequested).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {/* Print functionality */}}
                          data-testid={`button-print-${request.id}`}
                        >
                          <Printer className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {/* View details functionality */}}
                          data-testid={`button-view-${request.id}`}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Review Item Requisition</DialogTitle>
            <DialogDescription>
              {selectedRequisition?.requisitionNumber} - Approve, reject, or backorder individual line items
            </DialogDescription>
          </DialogHeader>

          {selectedRequisition && (
            <div className="space-y-6">
              {/* Requisition Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label>Requested by</Label>
                  <div className="mt-1 font-medium">{selectedRequisition.requester?.fullName || 'Unknown'}</div>
                </div>
                <div>
                  <Label>Work Order</Label>
                  <div className="mt-1 font-medium">{selectedRequisition.workOrder?.workOrderNumber || "N/A"}</div>
                </div>
                <div>
                  <Label>Date Requested</Label>
                  <div className="mt-1">{new Date(selectedRequisition.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <Label>Foreman Approved</Label>
                  <div className="mt-1">
                    {selectedRequisition.foremanApprovedAt 
                      ? new Date(selectedRequisition.foremanApprovedAt).toLocaleDateString()
                      : "Pending"}
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div>
                <Label>Line Items - Individual Approval</Label>
                <div className="mt-2 space-y-3">
                  {selectedRequisition.lines?.map((line) => {
                    const decision = lineDecisions[line.id];
                    return (
                      <Card key={line.id}>
                        <CardContent className="pt-4">
                          <div className="grid gap-4">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {line.description}
                                {line.availableStock !== undefined && (
                                  <span className="text-sm text-red-600 dark:text-red-400 font-semibold">
                                    (Stock: {line.availableStock})
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground mt-1">
                                Requested: {line.quantityRequested} {line.unitOfMeasure || "pcs"}
                                {line.partName && <span> • Part: {line.partName}</span>}
                                {line.stockStatus && (
                                  <Badge 
                                    variant={
                                      line.stockStatus === 'in_stock' ? 'default' : 
                                      line.stockStatus === 'low_stock' ? 'secondary' : 
                                      'destructive'
                                    } 
                                    className="ml-2"
                                  >
                                    {line.stockStatus === 'in_stock' ? 'In Stock' : 
                                     line.stockStatus === 'low_stock' ? 'Low Stock' : 
                                     'Out of Stock'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4">
                              <div>
                                <Label htmlFor={`action-${line.id}`}>Action</Label>
                                <Select
                                  value={decision?.action || 'approve'}
                                  onValueChange={(value: 'approve' | 'reject' | 'backorder') => 
                                    updateLineDecision(line.id, { action: value })
                                  }
                                >
                                  <SelectTrigger id={`action-${line.id}`} data-testid={`select-action-${line.id}`}>
                                    <SelectValue placeholder="Select action" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="approve">
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        Approve
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="backorder">
                                      <div className="flex items-center gap-2">
                                        <ShoppingCart className="h-4 w-4 text-blue-600" />
                                        Backorder (Create PO)
                                      </div>
                                    </SelectItem>
                                    <SelectItem value="reject">
                                      <div className="flex items-center gap-2">
                                        <XCircle className="h-4 w-4 text-red-600" />
                                        Reject
                                      </div>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              
                              {decision?.action !== 'reject' && (
                                <div>
                                  <Label htmlFor={`qty-${line.id}`}>
                                    {decision?.action === 'backorder' ? 'Quantity to Order' : 'Approved Quantity'}
                                  </Label>
                                  <Input
                                    id={`qty-${line.id}`}
                                    type="number"
                                    min="0"
                                    max={line.quantityRequested}
                                    value={decision?.quantityApproved || line.quantityRequested}
                                    onChange={(e) => updateLineDecision(
                                      line.id,
                                      { quantityApproved: parseInt(e.target.value) || 0 }
                                    )}
                                    data-testid={`input-qty-${line.id}`}
                                  />
                                </div>
                              )}
                              
                              <div className={decision?.action === 'reject' ? 'col-span-2' : ''}>
                                <Label htmlFor={`remarks-${line.id}`}>Remarks (Optional)</Label>
                                <Input
                                  id={`remarks-${line.id}`}
                                  value={decision?.remarks || ''}
                                  onChange={(e) => updateLineDecision(
                                    line.id,
                                    { remarks: e.target.value }
                                  )}
                                  placeholder="Add notes..."
                                  data-testid={`input-remarks-${line.id}`}
                                />
                              </div>
                            </div>

                            {decision?.action === 'backorder' && (
                              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
                                <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5" />
                                <div className="text-sm text-blue-900 dark:text-blue-100">
                                  <strong>Purchase Order will be created</strong> for {decision.quantityApproved || line.quantityRequested} units
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* General Remarks */}
              <div>
                <Label htmlFor="remarks">General Remarks (Optional)</Label>
                <Textarea
                  id="remarks"
                  value={approvalRemarks}
                  onChange={(e) => setApprovalRemarks(e.target.value)}
                  placeholder="Add any general notes or remarks for this requisition..."
                  rows={3}
                  data-testid="textarea-general-remarks"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsApprovalDialogOpen(false)}
              disabled={processLinesMutation.isPending}
              data-testid="button-cancel-approval"
            >
              Cancel
            </Button>
            <Button
              onClick={handleProcessLines}
              disabled={processLinesMutation.isPending}
              data-testid="button-process-lines"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {processLinesMutation.isPending ? "Processing..." : "Process Line Items"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
