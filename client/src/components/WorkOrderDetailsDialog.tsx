import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, Package, CheckCircle, Users, FileText, PackageCheck, DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

type WorkOrderDetailsDialogProps = {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type WorkOrderMembership = {
  id: string;
  role: string;
  employee: {
    id: string;
    fullName: string;
    role: string;
  };
  assignedAt: string;
};

type ItemRequisitionLine = {
  id: string;
  description: string;
  unitOfMeasure?: string;
  quantityRequested: number;
  quantityApproved?: number;
  status: string;
  sparePart?: {
    id: string;
    partName: string;
    partNumber: string;
  };
};

type ItemRequisition = {
  id: string;
  requisitionNumber: string;
  status: string;
  lines: ItemRequisitionLine[];
};

type PartReceipt = {
  id: string;
  workOrderId: string;
  quantityIssued: number;
  issuedAt: string;
  notes?: string;
  sparePart?: {
    id: string;
    partName: string;
    partNumber: string;
    unitOfMeasure?: string;
  } | null;
  issuedBy?: {
    id: string;
    fullName: string;
  } | null;
};

type LaborEntry = {
  id: string;
  employeeName: string;
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  description?: string;
  workDate: string;
};

type LubricantEntry = {
  id: string;
  lubricantType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  description?: string;
  usedDate: string;
};

type OutsourceEntry = {
  id: string;
  vendorName: string;
  serviceDescription: string;
  cost: number;
  invoiceNumber?: string;
  serviceDate: string;
};

type CostSummary = {
  plannedLaborCost: number;
  actualLaborCost: number;
  plannedLubricantCost: number;
  actualLubricantCost: number;
  plannedOutsourceCost: number;
  actualOutsourceCost: number;
  totalPlannedCost: number;
  totalActualCost: number;
  costVariance: number;
};

type WorkOrderDetails = {
  id: string;
  workOrderNumber: string;
  status: string;
  equipmentModel?: string;
  description: string;
  elapsedTime?: string;
  elapsedHours?: number;
  startedAt?: string;
  completedAt?: string;
  memberships: WorkOrderMembership[];
  itemRequisitions: ItemRequisition[];
  partsReceipts: PartReceipt[];
  costSummary?: CostSummary;
};

export function WorkOrderDetailsDialog({ workOrderId, open, onOpenChange }: WorkOrderDetailsDialogProps) {
  const { data: details, isLoading } = useQuery<WorkOrderDetails>({
    queryKey: ["/api/work-orders", workOrderId, "details"],
    queryFn: async () => {
      if (!workOrderId) throw new Error("No work order ID");
      const response = await apiRequest("GET", `/api/work-orders/${workOrderId}/details`);
      return response.json();
    },
    enabled: !!workOrderId && open,
  });

  // Fetch cost data separately
  const { data: costData } = useQuery<{ 
    summary: CostSummary;
    laborEntries: LaborEntry[];
    lubricantEntries: LubricantEntry[];
    outsourceEntries: OutsourceEntry[];
  }>({
    queryKey: ["/api/work-orders", workOrderId, "costs"],
    queryFn: async () => {
      if (!workOrderId) throw new Error("No work order ID");
      const response = await apiRequest("GET", `/api/work-orders/${workOrderId}/costs`);
      return response.json();
    },
    enabled: !!workOrderId && open,
  });

  const teamMembers = details?.memberships?.filter(m => m.role === "team_member") || [];
  const verifier = details?.memberships?.find(m => m.role === "verifier");
  const foreman = details?.memberships?.find(m => m.role === "foreman");

  // Get all spare parts used from approved/fulfilled requisitions
  const sparePartsUsed = details?.itemRequisitions
    ?.filter(req => req.status === "approved" || req.status === "fulfilled")
    .flatMap(req => req.lines)
    .filter(line => line.status === "approved" || line.status === "fulfilled") || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-work-order-details">
        <DialogHeader>
          <DialogTitle className="text-2xl">Work Order Details</DialogTitle>
          <DialogDescription>
            {details?.workOrderNumber || "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading details...</div>
        ) : details ? (
          <div className="space-y-6">
            {/* Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Equipment</Label>
                    <p className="font-medium">{details.equipmentModel || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline">{details.status}</Badge>
                    </div>
                  </div>
                </div>
                {details.description && (
                  <div>
                    <Label className="text-muted-foreground text-sm">Description</Label>
                    <p className="mt-1">{details.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Elapsed Time Card */}
            {details.elapsedTime && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Time Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground text-sm">Elapsed Time</Label>
                      <p className="text-2xl font-bold text-primary">{details.elapsedTime}</p>
                      {details.elapsedHours !== undefined && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {details.elapsedHours.toFixed(2)} hours
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      {details.startedAt && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Started</Label>
                          <p className="text-sm">{new Date(details.startedAt).toLocaleString()}</p>
                        </div>
                      )}
                      {details.completedAt && (
                        <div>
                          <Label className="text-muted-foreground text-sm">Completed</Label>
                          <p className="text-sm">{new Date(details.completedAt).toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Cost Breakdown Card */}
            {costData?.summary && (costData.summary.totalActualCost > 0 || costData.summary.totalPlannedCost > 0) && (
              <Card data-testid="card-cost-breakdown">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Cost Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Total Cost Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Planned Total</Label>
                      <p className="text-3xl font-bold" data-testid="text-planned-total">
                        {formatCurrency(costData.summary.totalPlannedCost)}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-muted-foreground text-sm">Actual Total</Label>
                      <p className="text-3xl font-bold text-primary" data-testid="text-actual-total">
                        {formatCurrency(costData.summary.totalActualCost)}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Cost Breakdown by Category */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold">Cost Details</Label>
                    
                    {/* Labor Costs */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Labor (Planned)</p>
                        <p className="font-medium">{formatCurrency(costData.summary.plannedLaborCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Labor (Actual)</p>
                        <p className="font-medium text-primary">{formatCurrency(costData.summary.actualLaborCost)}</p>
                      </div>
                    </div>

                    {/* Lubricant Costs */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Lubricants (Planned)</p>
                        <p className="font-medium">{formatCurrency(costData.summary.plannedLubricantCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Lubricants (Actual)</p>
                        <p className="font-medium text-primary">{formatCurrency(costData.summary.actualLubricantCost)}</p>
                      </div>
                    </div>

                    {/* Outsource Costs */}
                    <div className="grid grid-cols-2 gap-4 p-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-xs text-muted-foreground">Outsource (Planned)</p>
                        <p className="font-medium">{formatCurrency(costData.summary.plannedOutsourceCost)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Outsource (Actual)</p>
                        <p className="font-medium text-primary">{formatCurrency(costData.summary.actualOutsourceCost)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Cost Variance */}
                  {costData.summary.totalPlannedCost > 0 && (
                    <div className="pt-3 border-t">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-2">
                          {costData.summary.costVariance > 0 ? (
                            <TrendingUp className="h-5 w-5 text-destructive" data-testid="icon-variance-over" />
                          ) : costData.summary.costVariance < 0 ? (
                            <TrendingDown className="h-5 w-5 text-green-600" data-testid="icon-variance-under" />
                          ) : null}
                          <Label className="font-semibold">Cost Variance</Label>
                        </div>
                        <div className="text-right">
                          <p className={`text-xl font-bold ${
                            costData.summary.costVariance > 0 ? 'text-destructive' :
                            costData.summary.costVariance < 0 ? 'text-green-600' : ''
                          }`} data-testid="text-cost-variance">
                            {costData.summary.costVariance > 0 ? '+' : ''}
                            {formatCurrency(costData.summary.costVariance)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {costData.summary.costVariance > 0 ? 'Over Budget' :
                             costData.summary.costVariance < 0 ? 'Under Budget' : 'On Budget'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Itemized Cost Entries - Show if any entries exist */}
                  {costData && (costData.laborEntries.length > 0 || costData.lubricantEntries.length > 0 || costData.outsourceEntries.length > 0) && (
                    <>
                      <Separator className="my-4" />
                      <div className="space-y-4">
                        <Label className="text-sm font-semibold">Itemized Cost Entries</Label>
                        
                        <Tabs defaultValue={
                          costData.laborEntries.length > 0 ? "labor" :
                          costData.lubricantEntries.length > 0 ? "lubricants" : "outsource"
                        } className="w-full">
                          <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="labor" data-testid="tab-cost-labor">
                              Labor ({costData.laborEntries.length})
                            </TabsTrigger>
                            <TabsTrigger value="lubricants" data-testid="tab-cost-lubricants">
                              Lubricants ({costData.lubricantEntries.length})
                            </TabsTrigger>
                            <TabsTrigger value="outsource" data-testid="tab-cost-outsource">
                              Outsource ({costData.outsourceEntries.length})
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="labor" className="space-y-2 mt-4">
                            {costData.laborEntries.length > 0 ? (
                              <div className="space-y-2">
                                {costData.laborEntries.map((entry) => (
                                  <div key={entry.id} className="p-3 rounded-lg border" data-testid={`labor-entry-${entry.id}`}>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Employee</p>
                                        <p className="font-medium text-sm">{entry.employeeName}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Hours</p>
                                        <p className="font-medium text-sm">{entry.hoursWorked.toFixed(2)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Rate</p>
                                        <p className="font-medium text-sm">{formatCurrency(entry.hourlyRate)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="font-bold text-sm text-primary">{formatCurrency(entry.totalCost)}</p>
                                      </div>
                                    </div>
                                    {entry.description && (
                                      <p className="text-xs text-muted-foreground mt-2">{entry.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(entry.workDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No labor entries</p>
                            )}
                          </TabsContent>

                          <TabsContent value="lubricants" className="space-y-2 mt-4">
                            {costData.lubricantEntries.length > 0 ? (
                              <div className="space-y-2">
                                {costData.lubricantEntries.map((entry) => (
                                  <div key={entry.id} className="p-3 rounded-lg border" data-testid={`lubricant-entry-${entry.id}`}>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Type</p>
                                        <Badge variant="outline" className="text-xs">
                                          {entry.lubricantType.replace(/_/g, ' ')}
                                        </Badge>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Quantity</p>
                                        <p className="font-medium text-sm">{entry.quantity.toFixed(2)} L</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Unit Cost</p>
                                        <p className="font-medium text-sm">{formatCurrency(entry.unitCost)}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                        <p className="font-bold text-sm text-primary">{formatCurrency(entry.totalCost)}</p>
                                      </div>
                                    </div>
                                    {entry.description && (
                                      <p className="text-xs text-muted-foreground mt-2">{entry.description}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(entry.usedDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No lubricant entries</p>
                            )}
                          </TabsContent>

                          <TabsContent value="outsource" className="space-y-2 mt-4">
                            {costData.outsourceEntries.length > 0 ? (
                              <div className="space-y-2">
                                {costData.outsourceEntries.map((entry) => (
                                  <div key={entry.id} className="p-3 rounded-lg border" data-testid={`outsource-entry-${entry.id}`}>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                      <div>
                                        <p className="text-xs text-muted-foreground">Vendor</p>
                                        <p className="font-medium text-sm">{entry.vendorName}</p>
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Invoice #</p>
                                        {entry.invoiceNumber ? (
                                          <Badge variant="outline" className="text-xs">{entry.invoiceNumber}</Badge>
                                        ) : (
                                          <p className="text-sm text-muted-foreground">-</p>
                                        )}
                                      </div>
                                      <div>
                                        <p className="text-xs text-muted-foreground">Cost</p>
                                        <p className="font-bold text-sm text-primary">{formatCurrency(entry.cost)}</p>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <p className="text-xs text-muted-foreground">Service</p>
                                      <p className="text-sm">{entry.serviceDescription}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(entry.serviceDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-4">No outsource entries</p>
                            )}
                          </TabsContent>
                        </Tabs>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Team Members Card */}
            {(teamMembers.length > 0 || foreman) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {foreman && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Foreman</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-2">
                          <User className="h-3 w-3" />
                          {foreman.employee.fullName}
                        </Badge>
                      </div>
                    </div>
                  )}
                  {teamMembers.length > 0 && (
                    <>
                      {foreman && <Separator />}
                      <div>
                        <Label className="text-muted-foreground text-sm">
                          Team Members ({teamMembers.length})
                        </Label>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {teamMembers.map((member) => (
                            <Badge key={member.id} variant="outline" className="flex items-center gap-2">
                              <User className="h-3 w-3" />
                              {member.employee.fullName}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Verifier Card */}
            {verifier && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Label className="text-muted-foreground text-sm">Verified By</Label>
                  <div className="mt-2">
                    <Badge variant="secondary" className="flex items-center gap-2 w-fit">
                      <User className="h-3 w-3" />
                      {verifier.employee.fullName}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Parts Tracking Tabs */}
            <Card>
              <CardContent className="pt-6">
                <Tabs defaultValue="requisitions" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="requisitions" data-testid="tab-requisitions">
                      <FileText className="h-4 w-4 mr-2" />
                      Requisitions ({sparePartsUsed.length})
                    </TabsTrigger>
                    <TabsTrigger value="receipts" data-testid="tab-parts-receipts">
                      <PackageCheck className="h-4 w-4 mr-2" />
                      Parts Receipts ({details?.partsReceipts?.length || 0})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="requisitions" className="mt-4">
                    {sparePartsUsed.length > 0 ? (
                      <div className="space-y-3">
                        {sparePartsUsed.map((line) => (
                          <div key={line.id} className="flex items-start justify-between border-b pb-3 last:border-0" data-testid={`requisition-line-${line.id}`}>
                            <div className="flex-1">
                              <p className="font-medium">{line.description}</p>
                              {line.sparePart && (
                                <p className="text-sm text-muted-foreground">
                                  Part #: {line.sparePart.partNumber}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-medium text-primary">
                                {line.quantityApproved || line.quantityRequested} {line.unitOfMeasure || "pcs"}
                              </p>
                              <Badge variant="outline" className="mt-1">
                                {line.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No requisitions for this work order</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="receipts" className="mt-4">
                    {details?.partsReceipts && details.partsReceipts.length > 0 ? (
                      <div className="space-y-3">
                        {details.partsReceipts.map((receipt) => (
                          <div key={receipt.id} className="flex items-start justify-between border-b pb-3 last:border-0" data-testid={`parts-receipt-${receipt.id}`}>
                            <div className="flex-1">
                              <p className="font-medium">
                                {receipt.sparePart?.partName || "Unknown Part"}
                              </p>
                              {receipt.sparePart && (
                                <p className="text-sm text-muted-foreground">
                                  Part #: {receipt.sparePart.partNumber}
                                </p>
                              )}
                              <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                                {receipt.issuedBy && (
                                  <span>Issued by: {receipt.issuedBy.fullName}</span>
                                )}
                                <span>
                                  {format(new Date(receipt.issuedAt), "MMM dd, yyyy HH:mm")}
                                </span>
                              </div>
                              {receipt.notes && (
                                <p className="text-sm text-muted-foreground mt-1 italic">
                                  Note: {receipt.notes}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="font-medium text-primary">
                                {receipt.quantityIssued} {receipt.sparePart?.unitOfMeasure || "pcs"}
                              </p>
                              <Badge variant="secondary" className="mt-1">
                                issued
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground">
                        <PackageCheck className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No parts receipts for this work order</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No details available
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
