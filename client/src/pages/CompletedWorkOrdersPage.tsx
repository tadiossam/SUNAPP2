import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ArrowLeft, CheckCircle, Filter } from "lucide-react";
import { WorkOrderDetailsDialog } from "@/components/WorkOrderDetailsDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useEquipmentModels } from "@/hooks/useEquipmentModels";
import { EquipmentModelFilter } from "@/components/EquipmentModelFilter";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentModel?: string;
  status: string;
  priority: string;
  description: string;
  workshopNames?: string[];
  garageNames?: string[];
  inspectionId?: string | null;
  receptionId?: string | null;
  startedAt?: string | null;
  completedAt?: string | null;
  elapsedTime?: string;
  elapsedMs?: number;
  elapsedHours?: number;
  isTimerPaused?: boolean;
  pausedReason?: string;
};

export default function CompletedWorkOrdersPage() {
  const { language } = useLanguage();
  const [, setLocation] = useLocation();
  const [detailsWorkOrderId, setDetailsWorkOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Date range filtering state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [equipmentModelFilter, setEquipmentModelFilter] = useState<string>("all");

  const { data: myWorkOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/my-assignments"],
  });

  const safeWorkOrders = myWorkOrders ?? [];

  // Use equipment models hook
  const { models, isLoading: isLoadingModels } = useEquipmentModels();
  
  const completedWorkOrders = safeWorkOrders.filter(
    (wo) =>
      wo.status === "pending_verification" ||
      wo.status === "pending_supervisor" ||
      wo.status === "completed"
  );

  // Filter completed work orders by date range and equipment model
  const filteredCompletedWorkOrders = completedWorkOrders.filter((wo) => {
    // Date range filter
    if (startDate || endDate) {
      const workOrderDate = wo.completedAt || wo.startedAt;
      if (!workOrderDate) return false;
      
      const woDate = new Date(workOrderDate);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate + "T23:59:59") : null;
      
      if (start && woDate < start) return false;
      if (end && woDate > end) return false;
    }

    // Equipment model filter
    if (equipmentModelFilter !== "all" && wo.equipmentModel !== equipmentModelFilter) {
      return false;
    }
    
    return true;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      pending_verification: { variant: "outline", label: language === "am" ? "ማረጋገጫ በመጠባበቅ" : "Pending Verification" },
      pending_supervisor: { variant: "outline", label: language === "am" ? "ሱፐርቫይዘር በመጠባበቅ" : "Pending Supervisor" },
      completed: { variant: "default", label: language === "am" ? "ተጠናቋል" : "Completed" },
    };
    
    const statusInfo = statusMap[status] || { variant: "default" as const, label: status };
    return <Badge variant={statusInfo.variant} data-testid={`badge-status-${status}`}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      High: { variant: "destructive", label: language === "am" ? "ከፍተኛ" : "High" },
      Medium: { variant: "secondary", label: language === "am" ? "መካከለኛ" : "Medium" },
      Low: { variant: "default", label: language === "am" ? "ዝቅተኛ" : "Low" },
    };
    
    const priorityInfo = priorityMap[priority] || { variant: "default" as const, label: priority };
    return <Badge variant={priorityInfo.variant} data-testid={`badge-priority-${priority}`}>{priorityInfo.label}</Badge>;
  };

  const handleViewDetails = (workOrderId: string) => {
    setDetailsWorkOrderId(workOrderId);
    setIsDetailsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">
            {language === "am" ? "በመጫን ላይ..." : "Loading..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header with Back Navigation */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setLocation("/my-work")}
          data-testid="button-back-to-my-work"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle className="h-8 w-8" />
            {language === "am" ? "የተጠናቀቁ የስራ ትእዛዞች" : "Completed Work Orders"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {language === "am" 
              ? `${filteredCompletedWorkOrders.length} የተጠናቀቁ የስራ ትእዛዞች` 
              : `${filteredCompletedWorkOrders.length} completed work orders`}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {language === "am" ? "ማጣሪያዎች" : "Filters"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Equipment Model Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {language === "am" ? "በእቃ ሞዴል ያጣራ" : "Filter by Equipment Model"}
            </Label>
            <div className="flex items-center gap-3">
              <EquipmentModelFilter
                models={models}
                value={equipmentModelFilter}
                onChange={setEquipmentModelFilter}
                isLoading={isLoadingModels}
              />
              {equipmentModelFilter !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEquipmentModelFilter("all")}
                  data-testid="button-clear-model-filter"
                >
                  {language === "am" ? "አጽዳ" : "Clear"}
                </Button>
              )}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              {language === "am" ? "በቀን ክልል ያጣራ" : "Filter by Date Range"}
            </Label>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="start-date" className="text-xs">
                  {language === "am" ? "የመጀመሪያ ቀን" : "Start Date"}
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  data-testid="input-start-date"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-date" className="text-xs">
                  {language === "am" ? "የመጨረሻ ቀን" : "End Date"}
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  data-testid="input-end-date"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                  }}
                  data-testid="button-clear-date-filters"
                >
                  {language === "am" ? "አጥራ" : "Clear Dates"}
                </Button>
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          {(startDate || endDate || equipmentModelFilter !== "all") && (
            <p className="text-sm text-muted-foreground pt-2 border-t">
              {language === "am" 
                ? `${filteredCompletedWorkOrders.length} ከ ${completedWorkOrders.length} የስራ ትእዛዞች` 
                : `Showing ${filteredCompletedWorkOrders.length} of ${completedWorkOrders.length} work orders`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filteredCompletedWorkOrders.length > 0 ? (
          filteredCompletedWorkOrders.map((workOrder) => (
            <Card key={workOrder.id} className="hover-elevate" data-testid={`work-order-card-${workOrder.id}`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{workOrder.workOrderNumber}</CardTitle>
                  <div className="flex gap-2">
                    {getStatusBadge(workOrder.status)}
                    {getPriorityBadge(workOrder.priority)}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {workOrder.equipmentModel || (language === "am" ? "የእቃ ሞዴል የለም" : "No equipment model")}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm">{workOrder.description}</p>
                  
                  {workOrder.workshopNames && workOrder.workshopNames.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {language === "am" ? "ወርክሾፖች" : "Workshops"}:
                      </span>
                      <span>{workOrder.workshopNames.join(", ")}</span>
                    </div>
                  )}
                  
                  {workOrder.garageNames && workOrder.garageNames.length > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {language === "am" ? "ጋራጆች" : "Garages"}:
                      </span>
                      <span>{workOrder.garageNames.join(", ")}</span>
                    </div>
                  )}

                  {workOrder.elapsedTime && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {language === "am" ? "የፈጀው ጊዜ" : "Duration"}:
                      </span>
                      <span>{workOrder.elapsedTime}</span>
                    </div>
                  )}

                  {workOrder.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">
                        {language === "am" ? "የተጠናቀቀበት ቀን" : "Completed Date"}:
                      </span>
                      <span>
                        {new Date(workOrder.completedAt).toLocaleDateString('en-US', { 
                          month: '2-digit', 
                          day: '2-digit', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(workOrder.id)}
                      data-testid={`button-view-details-${workOrder.id}`}
                    >
                      {language === "am" ? "ዝርዝር ይመልከቱ" : "View Details"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {(startDate || endDate)
                ? (language === "am" ? "በዚህ ቀን ክልል ምንም የተጠናቀቁ የስራ ትእዛዞች የሉም" : "No completed work orders in this date range")
                : (language === "am" ? "ምንም የተጠናቀቁ የስራ ትእዛዞች የሉም" : "No completed work orders")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Work Order Details Dialog */}
      {detailsWorkOrderId && (
        <WorkOrderDetailsDialog
          open={isDetailsDialogOpen}
          onOpenChange={setIsDetailsDialogOpen}
          workOrderId={detailsWorkOrderId}
        />
      )}
    </div>
  );
}
