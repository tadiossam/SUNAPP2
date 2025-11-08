import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Clock, User, Package, CheckCircle, Users, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

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

            {/* Spare Parts Used Card */}
            {sparePartsUsed.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Spare Parts Used ({sparePartsUsed.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {sparePartsUsed.map((line, index) => (
                      <div key={line.id} className="flex items-start justify-between border-b pb-3 last:border-0">
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
                </CardContent>
              </Card>
            )}

            {sparePartsUsed.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No spare parts used for this work order</p>
                </CardContent>
              </Card>
            )}
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
