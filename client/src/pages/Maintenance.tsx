import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Wrench, Clock, FileText, TrendingUp, ArrowUpDown } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import type { Equipment } from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type WorkOrderWithDetails = {
  id: string;
  workOrderNumber: string;
  equipmentId: string;
  workType: string;
  description: string;
  status: string;
  priority: string;
  completedAt: string;
  startedAt?: string;
  createdAt: string;
  equipment?: Equipment;
  assignedToList?: Array<{ fullName: string }>;
};

export default function MaintenancePage() {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderWithDetails | null>(null);

  const { data: equipment, isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: allWorkOrders, isLoading: workOrdersLoading } = useQuery<WorkOrderWithDetails[]>({
    queryKey: ["/api/work-orders"],
  });

  const selectedEquipment = equipment?.find((e) => e.id === selectedEquipmentId);

  // Filter completed work orders for selected equipment
  const completedWorkOrders = useMemo(() => {
    if (!selectedEquipmentId || !allWorkOrders) return [];
    return allWorkOrders.filter(
      (wo) => wo.equipmentId === selectedEquipmentId && wo.status === "completed" && wo.completedAt
    );
  }, [selectedEquipmentId, allWorkOrders]);

  // Calculate maintenance statistics
  const maintenanceStats = useMemo(() => {
    if (!completedWorkOrders.length) return null;

    const workTypeCount: Record<string, number> = {};
    completedWorkOrders.forEach((wo) => {
      workTypeCount[wo.workType] = (workTypeCount[wo.workType] || 0) + 1;
    });

    const mostFrequentType = Object.entries(workTypeCount).sort((a, b) => b[1] - a[1])[0];
    const avgDaysBetween = completedWorkOrders.length > 1
      ? differenceInDays(
          new Date(completedWorkOrders[0].completedAt),
          new Date(completedWorkOrders[completedWorkOrders.length - 1].completedAt)
        ) / (completedWorkOrders.length - 1)
      : 0;

    return {
      totalMaintenance: completedWorkOrders.length,
      mostFrequentType: mostFrequentType?.[0] || "N/A",
      frequencyCount: mostFrequentType?.[1] || 0,
      avgDaysBetween: Math.round(avgDaysBetween),
      workTypeBreakdown: workTypeCount,
    };
  }, [completedWorkOrders]);

  // Sort work orders based on selected option
  const sortedWorkOrders = useMemo(() => {
    const sorted = [...completedWorkOrders];
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => 
          new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
        );
      case "oldest":
        return sorted.sort((a, b) => 
          new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
        );
      case "type":
        return sorted.sort((a, b) => a.workType.localeCompare(b.workType));
      default:
        return sorted;
    }
  }, [completedWorkOrders, sortBy]);

  const getWorkTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "repair":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "maintenance":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "inspection":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "wash":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Maintenance History</h1>
          <p className="text-sm text-muted-foreground">
            Automatic maintenance records from completed work orders
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Equipment</CardTitle>
              <CardDescription>Choose equipment to view maintenance history</CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                <SelectTrigger className="w-full" data-testid="select-equipment">
                  <SelectValue placeholder="Select equipment..." />
                </SelectTrigger>
                <SelectContent>
                  {equipmentLoading ? (
                    <div className="p-2">Loading equipment...</div>
                  ) : (
                    equipment?.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id} data-testid={`option-equipment-${eq.id}`}>
                        {eq.equipmentType} - {eq.make} {eq.model} ({eq.plateNo})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedEquipmentId && selectedEquipment && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="font-medium" data-testid="text-equipment-type">{selectedEquipment.equipmentType}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Make & Model</div>
                    <div className="font-medium" data-testid="text-equipment-make-model">
                      {selectedEquipment.make} {selectedEquipment.model}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Plate No.</div>
                    <div className="font-medium" data-testid="text-equipment-plate">{selectedEquipment.plateNo}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Serial No.</div>
                    <div className="font-medium" data-testid="text-equipment-serial">{selectedEquipment.machineSerial}</div>
                  </div>
                </CardContent>
              </Card>

              {/* Maintenance Statistics */}
              {maintenanceStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Maintenance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-total-maintenance">{maintenanceStats.totalMaintenance}</div>
                      <p className="text-xs text-muted-foreground mt-1">Completed work orders</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-4 w-4" />
                        Most Frequent
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold capitalize" data-testid="text-frequent-type">
                        {maintenanceStats.mostFrequentType}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {maintenanceStats.frequencyCount} times
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Frequency</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold" data-testid="text-avg-frequency">
                        {maintenanceStats.avgDaysBetween}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">days between maintenance</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Sort and Filter Controls */}
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold">Maintenance History</h3>
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-[180px]" data-testid="select-sort">
                      <SelectValue placeholder="Sort by..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Most Recent</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="type">By Work Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Clickable Maintenance Cards */}
              {workOrdersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : sortedWorkOrders.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    No completed maintenance records found for this equipment
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {sortedWorkOrders.map((wo) => (
                    <Card 
                      key={wo.id} 
                      className="hover-elevate cursor-pointer transition-all" 
                      onClick={() => setSelectedWorkOrder(wo)}
                      data-testid={`card-maintenance-${wo.id}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <CardTitle className="text-base">{wo.workOrderNumber}</CardTitle>
                            </div>
                            <CardDescription className="line-clamp-2">{wo.description}</CardDescription>
                          </div>
                          <Badge className={getWorkTypeColor(wo.workType)} data-testid={`badge-type-${wo.id}`}>
                            {wo.workType}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(wo.completedAt), "MMM dd, yyyy")}
                          </span>
                          {wo.startedAt && wo.completedAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3.5 w-3.5" />
                              {differenceInDays(new Date(wo.completedAt), new Date(wo.startedAt))} days
                            </span>
                          )}
                          {wo.assignedToList && wo.assignedToList.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Wrench className="h-3.5 w-3.5" />
                              {wo.assignedToList[0].fullName}
                              {wo.assignedToList.length > 1 && ` +${wo.assignedToList.length - 1}`}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}

          {!selectedEquipmentId && (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Select equipment to view maintenance history
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Work Order Details Dialog */}
      <Dialog open={!!selectedWorkOrder} onOpenChange={() => setSelectedWorkOrder(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWorkOrder?.workOrderNumber}</DialogTitle>
            <DialogDescription>Completed maintenance work order details</DialogDescription>
          </DialogHeader>
          {selectedWorkOrder && (
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Work Type</div>
                <Badge className={getWorkTypeColor(selectedWorkOrder.workType)}>
                  {selectedWorkOrder.workType}
                </Badge>
              </div>
              <div>
                <div className="text-sm font-medium text-muted-foreground mb-1">Description</div>
                <p className="text-sm">{selectedWorkOrder.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Started</div>
                  <p className="text-sm">
                    {selectedWorkOrder.startedAt 
                      ? format(new Date(selectedWorkOrder.startedAt), "PPP")
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">Completed</div>
                  <p className="text-sm">
                    {format(new Date(selectedWorkOrder.completedAt), "PPP")}
                  </p>
                </div>
              </div>
              {selectedWorkOrder.assignedToList && selectedWorkOrder.assignedToList.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2">Team Members</div>
                  <div className="flex flex-wrap gap-2">
                    {selectedWorkOrder.assignedToList.map((member, idx) => (
                      <Badge key={idx} variant="outline">{member.fullName}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
