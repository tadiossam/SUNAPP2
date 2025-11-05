import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Printer, 
  Package, 
  DollarSign,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  Truck,
  User
} from "lucide-react";
import { format } from "date-fns";

interface PurchaseRequest {
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
  lineItem: any;
  requisition: any;
  sparePart: any;
  requestedBy: any;
  foremanApprovedBy: any;
  storeManager: any;
}

const statusColors: Record<string, string> = {
  pending: "warning",
  ordered: "info",
  received: "success",
  cancelled: "destructive",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  ordered: Package,
  received: CheckCircle2,
  cancelled: XCircle,
};

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseRequest | null>(null);
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ['/api/purchase-requests'],
  });

  const markAsOrderedMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/purchase-requests/${id}`, {
        status: "ordered",
        orderDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-requests'] });
      toast({
        title: "Success",
        description: "Purchase order marked as ordered",
      });
      setSelectedPO(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const markAsReceivedMutation = useMutation({
    mutationFn: async (data: { id: string; quantityReceived: number }) => {
      return apiRequest("PATCH", `/api/purchase-requests/${data.id}`, {
        status: "received",
        receivedDate: new Date().toISOString(),
        quantityReceived: data.quantityReceived,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-requests'] });
      toast({
        title: "Success",
        description: "Purchase order marked as received and stock updated",
      });
      setSelectedPO(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const filteredOrders = purchaseOrders?.filter((po) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      po.purchaseRequestNumber.toLowerCase().includes(searchLower) ||
      (po.sparePart?.partName?.toLowerCase()?.includes(searchLower) ?? false) ||
      (po.lineItem?.description?.toLowerCase()?.includes(searchLower) ?? false) ||
      (po.requestedBy?.fullName?.toLowerCase()?.includes(searchLower) ?? false);
    
    const matchesStatus = statusFilter === "all" || po.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handlePrint = (po: PurchaseRequest) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order ${po.purchaseRequestNumber}</title>
        <style>
          @media print {
            @page { margin: 1in; }
          }
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .subtitle {
            font-size: 14px;
            color: #666;
          }
          .po-title {
            font-size: 20px;
            font-weight: bold;
            margin: 20px 0;
          }
          .section {
            margin-bottom: 25px;
          }
          .section-title {
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
            margin-bottom: 10px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .info-item {
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            font-size: 12px;
            color: #666;
          }
          .info-value {
            font-size: 14px;
            margin-top: 2px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
          }
          th {
            background: #f5f5f5;
            padding: 10px;
            text-align: left;
            font-size: 12px;
            border: 1px solid #ddd;
          }
          td {
            padding: 10px;
            border: 1px solid #ddd;
            font-size: 13px;
          }
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
          }
          .signature-section {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 20px;
            margin-top: 40px;
          }
          .signature-line {
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-size: 12px;
          }
          .signature-name {
            font-weight: bold;
            margin-top: 5px;
          }
          .signature-role {
            font-size: 10px;
            color: #666;
          }
          .notes {
            background: #f9f9f9;
            padding: 15px;
            border-left: 3px solid #000;
            margin-top: 20px;
          }
          @media print {
            body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">SUNSHINE CONSTRUCTION PLC</div>
          <div class="subtitle">Gelan Terminal Maintenance Division</div>
          <div class="po-title">PURCHASE ORDER</div>
          <div style="font-size: 18px; font-weight: bold;">${po.purchaseRequestNumber}</div>
        </div>

        <div class="section">
          <div class="section-title">Order Details</div>
          <table>
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Part Number</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${po.lineItem?.description || po.sparePart?.partName || '-'}</td>
                <td>${po.sparePart?.partNumber || '-'}</td>
                <td>${po.quantityRequested}</td>
                <td>${po.unitPrice ? `${po.currency || 'ETB'} ${po.unitPrice}` : '-'}</td>
                <td>${po.totalPrice ? `${po.currency || 'ETB'} ${po.totalPrice}` : '-'}</td>
              </tr>
              ${po.totalPrice ? `
              <tr>
                <td colspan="4" style="text-align: right; font-weight: bold;">Total Amount:</td>
                <td style="font-weight: bold;">${po.currency || 'ETB'} ${po.totalPrice}</td>
              </tr>
              ` : ''}
            </tbody>
          </table>
        </div>

        <div class="section">
          <div class="section-title">Dates</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Date Requested</div>
              <div class="info-value">${format(new Date(po.dateRequested), 'MMM dd, yyyy')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Date Approved for Purchase</div>
              <div class="info-value">${format(new Date(po.dateApproved), 'MMM dd, yyyy')}</div>
            </div>
            ${po.orderDate ? `
            <div class="info-item">
              <div class="info-label">Date Ordered</div>
              <div class="info-value">${format(new Date(po.orderDate), 'MMM dd, yyyy')}</div>
            </div>
            ` : ''}
            ${po.receivedDate ? `
            <div class="info-item">
              <div class="info-label">Date Received</div>
              <div class="info-value">${format(new Date(po.receivedDate), 'MMM dd, yyyy')}</div>
            </div>
            ` : ''}
          </div>
        </div>

        ${po.notes ? `
        <div class="notes">
          <div class="info-label">Notes</div>
          <div>${po.notes}</div>
        </div>
        ` : ''}

        <div class="signature-section">
          <div>
            <div class="signature-line">
              <div class="info-label">Requested by</div>
              <div class="signature-name">${po.requestedBy?.fullName || ''}</div>
              <div class="signature-role">Team Member</div>
            </div>
          </div>
          <div>
            <div class="signature-line">
              <div class="info-label">Prepared by</div>
              <div class="signature-name">${po.storeManager?.fullName || ''}</div>
              <div class="signature-role">Store Manager</div>
            </div>
          </div>
          <div>
            <div class="signature-line">
              <div class="info-label">Approved by</div>
              <div class="signature-name">${po.foremanApprovedBy?.fullName || ''}</div>
              <div class="signature-role">Foreman</div>
            </div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 11px; color: #999;">
          Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm')}
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleMarkAsReceived = () => {
    if (!selectedPO) return;
    
    markAsReceivedMutation.mutate({
      id: selectedPO.id,
      quantityReceived: selectedPO.quantityRequested,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">Loading purchase orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders</h1>
          <p className="text-muted-foreground">Manage purchase requests and orders</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by PO number, part name, or requester..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-po"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px]" data-testid="select-status-filter">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="ordered">Ordered</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <Card className="p-12">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No purchase orders found</p>
            </div>
          </Card>
        ) : (
          filteredOrders.map((po) => {
            const StatusIcon = statusIcons[po.status] || Package;
            return (
              <Card key={po.id} className="p-6 hover-elevate" data-testid={`card-po-${po.id}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-3">
                      <StatusIcon className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">{po.purchaseRequestNumber}</h3>
                      <Badge variant={statusColors[po.status] as any}>
                        {po.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Part</div>
                        <div className="font-medium">{po.sparePart?.partName || po.lineItem?.description || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Requested By</div>
                        <div className="font-medium">{po.requestedBy?.fullName || '-'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Quantity</div>
                        <div className="font-medium">{po.quantityRequested} units</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Date Requested</div>
                        <div className="font-medium">{format(new Date(po.dateRequested), 'MMM dd, yyyy')}</div>
                      </div>
                    </div>

                    {po.totalPrice && (
                      <div className="flex items-center gap-2 text-lg font-semibold">
                        <DollarSign className="h-5 w-5" />
                        {po.currency || 'ETB'} {po.totalPrice}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handlePrint(po)}
                      data-testid={`button-print-${po.id}`}
                    >
                      <Printer className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setSelectedPO(po)}
                      data-testid={`button-view-${po.id}`}
                    >
                      <FileText className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      <Dialog open={!!selectedPO} onOpenChange={(open) => !open && setSelectedPO(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Purchase Order Details</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedPO && handlePrint(selectedPO)}
                data-testid="button-print-modal"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedPO && (
            <div className="space-y-6 pt-4">
              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>PO Number</Label>
                    <div className="text-lg font-semibold">{selectedPO.purchaseRequestNumber}</div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge variant={statusColors[selectedPO.status] as any} className="text-sm">
                      {selectedPO.status.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Item Information
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Description:</span>{' '}
                      {selectedPO.lineItem?.description || selectedPO.sparePart?.partName}
                    </div>
                    {selectedPO.sparePart?.partNumber && (
                      <div>
                        <span className="text-muted-foreground">Part Number:</span>{' '}
                        {selectedPO.sparePart.partNumber}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Quantity Requested:</span>{' '}
                      {selectedPO.quantityRequested} {selectedPO.lineItem?.unitOfMeasure || 'units'}
                    </div>
                    {selectedPO.quantityReceived > 0 && (
                      <div>
                        <span className="text-muted-foreground">Quantity Received:</span>{' '}
                        {selectedPO.quantityReceived} {selectedPO.lineItem?.unitOfMeasure || 'units'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Personnel
                  </h3>
                  <div className="grid gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Requested By:</span>{' '}
                      {selectedPO.requestedBy?.fullName || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Approved By (Foreman):</span>{' '}
                      {selectedPO.foremanApprovedBy?.fullName || '-'}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Prepared By (Store Manager):</span>{' '}
                      {selectedPO.storeManager?.fullName || '-'}
                    </div>
                  </div>
                </div>

                {(selectedPO.unitPrice || selectedPO.totalPrice) && (
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Pricing
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedPO.unitPrice && (
                        <div>
                          <Label>Unit Price</Label>
                          <div className="text-sm">{selectedPO.currency || 'ETB'} {selectedPO.unitPrice}</div>
                        </div>
                      )}
                      {selectedPO.totalPrice && (
                        <div>
                          <Label>Total Price</Label>
                          <div className="text-sm font-semibold">{selectedPO.currency || 'ETB'} {selectedPO.totalPrice}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-3">Dates</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Date Requested:</span>{' '}
                      {format(new Date(selectedPO.dateRequested), 'MMM dd, yyyy')}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date Approved:</span>{' '}
                      {format(new Date(selectedPO.dateApproved), 'MMM dd, yyyy')}
                    </div>
                    {selectedPO.orderDate && (
                      <div>
                        <span className="text-muted-foreground">Date Ordered:</span>{' '}
                        {format(new Date(selectedPO.orderDate), 'MMM dd, yyyy')}
                      </div>
                    )}
                    {selectedPO.receivedDate && (
                      <div>
                        <span className="text-muted-foreground">Date Received:</span>{' '}
                        {format(new Date(selectedPO.receivedDate), 'MMM dd, yyyy')}
                      </div>
                    )}
                  </div>
                </div>

                {selectedPO.notes && (
                  <div>
                    <Label>Notes</Label>
                    <div className="text-sm bg-muted p-3 rounded-md">{selectedPO.notes}</div>
                  </div>
                )}
              </div>

              <DialogFooter className="flex gap-2">
                {selectedPO.status === 'pending' && (
                  <Button
                    onClick={() => markAsOrderedMutation.mutate(selectedPO.id)}
                    disabled={markAsOrderedMutation.isPending}
                    data-testid="button-mark-ordered"
                  >
                    <Truck className="h-4 w-4 mr-2" />
                    {markAsOrderedMutation.isPending ? 'Processing...' : 'Mark as Ordered'}
                  </Button>
                )}
                {selectedPO.status === 'ordered' && (
                  <Button
                    onClick={handleMarkAsReceived}
                    disabled={markAsReceivedMutation.isPending}
                    data-testid="button-mark-received"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {markAsReceivedMutation.isPending ? 'Processing...' : 'Mark as Received'}
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
