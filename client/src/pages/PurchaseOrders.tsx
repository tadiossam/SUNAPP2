import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  Printer, 
  Edit2, 
  Package, 
  Calendar, 
  DollarSign,
  Truck,
  FileText,
  CheckCircle2,
  Clock,
  XCircle
} from "lucide-react";
import { format } from "date-fns";

interface PurchaseRequest {
  id: string;
  purchaseRequestNumber: string;
  quantityRequested: number;
  quantityReceived: number;
  status: string;
  vendorName: string;
  vendorContact: string;
  vendorPhone: string;
  vendorEmail: string;
  vendorAddress: string;
  unitPrice: string;
  totalPrice: string;
  currency: string;
  requestDate: string;
  expectedDeliveryDate: string;
  orderDate: string;
  receivedDate: string;
  shippingMethod: string;
  deliveryAddress: string;
  trackingNumber: string;
  paymentTerms: string;
  paymentStatus: string;
  notes: string;
  internalNotes: string;
  createdAt: string;
  lineItem: any;
  requisition: any;
  sparePart: any;
  storeManager: any;
}

const statusColors: Record<string, string> = {
  pending: "warning",
  ordered: "info",
  received: "success",
  partially_received: "secondary",
  canceled: "destructive",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  ordered: Package,
  received: CheckCircle2,
  partially_received: Truck,
  canceled: XCircle,
};

export default function PurchaseOrders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPO, setSelectedPO] = useState<PurchaseRequest | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editForm, setEditForm] = useState<Partial<PurchaseRequest>>({});
  const { toast } = useToast();

  const { data: purchaseOrders, isLoading } = useQuery<PurchaseRequest[]>({
    queryKey: ['/api/purchase-requests'],
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: string; updates: Partial<PurchaseRequest> }) => {
      return apiRequest(`/api/purchase-requests/${data.id}`, "PATCH", data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/purchase-requests'] });
      toast({
        title: "Success",
        description: "Purchase order updated successfully",
      });
      setIsEditMode(false);
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
      (po.vendorName?.toLowerCase()?.includes(searchLower) ?? false) ||
      (po.sparePart?.partName?.toLowerCase()?.includes(searchLower) ?? false);
    
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
          .signature-line {
            margin-top: 40px;
            border-top: 1px solid #000;
            padding-top: 5px;
            text-align: center;
            font-size: 12px;
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
          <div class="section-title">Vendor Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Vendor Name</div>
              <div class="info-value">${po.vendorName || 'To be determined'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Contact Person</div>
              <div class="info-value">${po.vendorContact || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${po.vendorPhone || '-'}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${po.vendorEmail || '-'}</div>
            </div>
          </div>
          ${po.vendorAddress ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Address</div>
            <div class="info-value">${po.vendorAddress}</div>
          </div>
          ` : ''}
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
          <div class="section-title">Delivery Information</div>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Request Date</div>
              <div class="info-value">${format(new Date(po.requestDate), 'MMM dd, yyyy')}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Expected Delivery</div>
              <div class="info-value">${po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), 'MMM dd, yyyy') : 'TBD'}</div>
            </div>
            ${po.shippingMethod ? `
            <div class="info-item">
              <div class="info-label">Shipping Method</div>
              <div class="info-value">${po.shippingMethod}</div>
            </div>
            ` : ''}
            ${po.trackingNumber ? `
            <div class="info-item">
              <div class="info-label">Tracking Number</div>
              <div class="info-value">${po.trackingNumber}</div>
            </div>
            ` : ''}
          </div>
          ${po.deliveryAddress ? `
          <div class="info-item" style="margin-top: 10px;">
            <div class="info-label">Delivery Address</div>
            <div class="info-value">${po.deliveryAddress}</div>
          </div>
          ` : ''}
        </div>

        ${po.paymentTerms ? `
        <div class="section">
          <div class="section-title">Payment Terms</div>
          <div class="info-value">${po.paymentTerms}</div>
        </div>
        ` : ''}

        ${po.notes ? `
        <div class="notes">
          <div class="info-label">Notes</div>
          <div>${po.notes}</div>
        </div>
        ` : ''}

        <div class="footer">
          <div class="info-grid">
            <div>
              <div class="signature-line">
                <div>Prepared By</div>
                <div style="margin-top: 5px;">${po.storeManager?.fullName || ''}</div>
                <div style="font-size: 10px; color: #666;">Store Manager</div>
              </div>
            </div>
            <div>
              <div class="signature-line">
                <div>Approved By</div>
                <div style="margin-top: 5px;">_____________________</div>
                <div style="font-size: 10px; color: #666;">Authorization</div>
              </div>
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

  const handleSaveEdit = () => {
    if (!selectedPO) return;
    
    updateMutation.mutate({
      id: selectedPO.id,
      updates: editForm,
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
            placeholder="Search by PO number, vendor, or part name..."
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
            <SelectItem value="partially_received">Partially Received</SelectItem>
            <SelectItem value="received">Received</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
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
                        <div className="text-muted-foreground">Vendor</div>
                        <div className="font-medium">{po.vendorName || 'TBD'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Quantity</div>
                        <div className="font-medium">{po.quantityRequested} units</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Request Date</div>
                        <div className="font-medium">{format(new Date(po.requestDate), 'MMM dd, yyyy')}</div>
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
                      onClick={() => {
                        setSelectedPO(po);
                        setEditForm(po);
                        setIsEditMode(false);
                      }}
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
              <div className="flex gap-2">
                {!isEditMode ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => selectedPO && handlePrint(selectedPO)}
                      data-testid="button-print-modal"
                    >
                      <Printer className="h-4 w-4 mr-2" />
                      Print
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditMode(true)}
                      data-testid="button-edit-modal"
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditMode(false);
                        setEditForm(selectedPO || {});
                      }}
                      data-testid="button-cancel-edit"
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveEdit}
                      disabled={updateMutation.isPending}
                      data-testid="button-save-edit"
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </>
                )}
              </div>
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
                    {isEditMode ? (
                      <Select
                        value={editForm.status}
                        onValueChange={(value) => setEditForm({ ...editForm, status: value })}
                      >
                        <SelectTrigger data-testid="select-edit-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="ordered">Ordered</SelectItem>
                          <SelectItem value="partially_received">Partially Received</SelectItem>
                          <SelectItem value="received">Received</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge variant={statusColors[selectedPO.status] as any} className="text-sm">
                        {selectedPO.status.replace(/_/g, ' ')}
                      </Badge>
                    )}
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
                  <h3 className="font-semibold mb-3">Vendor Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vendor Name</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.vendorName || ''}
                          onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                          data-testid="input-vendor-name"
                        />
                      ) : (
                        <div>{selectedPO.vendorName || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Contact Person</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.vendorContact || ''}
                          onChange={(e) => setEditForm({ ...editForm, vendorContact: e.target.value })}
                          data-testid="input-vendor-contact"
                        />
                      ) : (
                        <div>{selectedPO.vendorContact || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Phone</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.vendorPhone || ''}
                          onChange={(e) => setEditForm({ ...editForm, vendorPhone: e.target.value })}
                          data-testid="input-vendor-phone"
                        />
                      ) : (
                        <div>{selectedPO.vendorPhone || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Email</Label>
                      {isEditMode ? (
                        <Input
                          type="email"
                          value={editForm.vendorEmail || ''}
                          onChange={(e) => setEditForm({ ...editForm, vendorEmail: e.target.value })}
                          data-testid="input-vendor-email"
                        />
                      ) : (
                        <div>{selectedPO.vendorEmail || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Address</Label>
                    {isEditMode ? (
                      <Textarea
                        value={editForm.vendorAddress || ''}
                        onChange={(e) => setEditForm({ ...editForm, vendorAddress: e.target.value })}
                        data-testid="textarea-vendor-address"
                      />
                    ) : (
                      <div>{selectedPO.vendorAddress || '-'}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Unit Price</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.unitPrice || ''}
                          onChange={(e) => setEditForm({ ...editForm, unitPrice: e.target.value })}
                          data-testid="input-unit-price"
                        />
                      ) : (
                        <div>{selectedPO.unitPrice || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Total Price</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.totalPrice || ''}
                          onChange={(e) => setEditForm({ ...editForm, totalPrice: e.target.value })}
                          data-testid="input-total-price"
                        />
                      ) : (
                        <div>{selectedPO.totalPrice || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Currency</Label>
                      {isEditMode ? (
                        <Select
                          value={editForm.currency}
                          onValueChange={(value) => setEditForm({ ...editForm, currency: value })}
                        >
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ETB">ETB</SelectItem>
                            <SelectItem value="USD">USD</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div>{selectedPO.currency || 'ETB'}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Payment Terms</Label>
                    {isEditMode ? (
                      <Textarea
                        value={editForm.paymentTerms || ''}
                        onChange={(e) => setEditForm({ ...editForm, paymentTerms: e.target.value })}
                        placeholder="e.g., Net 30 days"
                        data-testid="textarea-payment-terms"
                      />
                    ) : (
                      <div>{selectedPO.paymentTerms || '-'}</div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Delivery Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Expected Delivery Date</Label>
                      {isEditMode ? (
                        <Input
                          type="date"
                          value={editForm.expectedDeliveryDate ? new Date(editForm.expectedDeliveryDate).toISOString().split('T')[0] : ''}
                          onChange={(e) => setEditForm({ ...editForm, expectedDeliveryDate: e.target.value })}
                          data-testid="input-expected-date"
                        />
                      ) : (
                        <div>{selectedPO.expectedDeliveryDate ? format(new Date(selectedPO.expectedDeliveryDate), 'MMM dd, yyyy') : 'TBD'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Shipping Method</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.shippingMethod || ''}
                          onChange={(e) => setEditForm({ ...editForm, shippingMethod: e.target.value })}
                          data-testid="input-shipping-method"
                        />
                      ) : (
                        <div>{selectedPO.shippingMethod || '-'}</div>
                      )}
                    </div>
                    <div>
                      <Label>Tracking Number</Label>
                      {isEditMode ? (
                        <Input
                          value={editForm.trackingNumber || ''}
                          onChange={(e) => setEditForm({ ...editForm, trackingNumber: e.target.value })}
                          data-testid="input-tracking-number"
                        />
                      ) : (
                        <div>{selectedPO.trackingNumber || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label>Delivery Address</Label>
                    {isEditMode ? (
                      <Textarea
                        value={editForm.deliveryAddress || ''}
                        onChange={(e) => setEditForm({ ...editForm, deliveryAddress: e.target.value })}
                        data-testid="textarea-delivery-address"
                      />
                    ) : (
                      <div>{selectedPO.deliveryAddress || '-'}</div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Notes</Label>
                  {isEditMode ? (
                    <Textarea
                      value={editForm.notes || ''}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      rows={3}
                      data-testid="textarea-notes"
                    />
                  ) : (
                    <div className="text-sm">{selectedPO.notes || '-'}</div>
                  )}
                </div>

                {isEditMode && (
                  <div>
                    <Label>Internal Notes (not printed)</Label>
                    <Textarea
                      value={editForm.internalNotes || ''}
                      onChange={(e) => setEditForm({ ...editForm, internalNotes: e.target.value })}
                      rows={2}
                      data-testid="textarea-internal-notes"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
