import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, User, Package, CheckCircle, Users, FileText, PackageCheck } from "lucide-react";
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

  const teamMembers = details?.memberships?.filter(m => m.role === "team_member") || [];
  const verifier = details?.memberships?.find(m => m.role === "verifier");
  const foreman = details?.memberships?.find(m => m.role === "foreman");

  // Get all spare parts used from approved/fulfilled requisitions
  const sparePartsUsed = details?.itemRequisitions
    ?.filter(req => req.status === "approved" || req.status === "fulfilled")
    .flatMap(req => req.lines)
    .filter(line => line.status === "approved" || line.status === "fulfilled") || [];

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
