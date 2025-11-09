import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package, CheckCircle, PackageOpen, FileText, Info } from "lucide-react";
import { RequestPartsDialog } from "@/components/RequestPartsDialog";
import { WorkOrderDetailsDialog } from "@/components/WorkOrderDetailsDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
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

export default function AwaitingPartsPage() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isRequestPartsOpen, setIsRequestPartsOpen] = useState(false);
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [viewingReceptionId, setViewingReceptionId] = useState<string | null>(null);
  const [detailsWorkOrderId, setDetailsWorkOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [equipmentModelFilter, setEquipmentModelFilter] = useState<string>("all");

  const { data: myWorkOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/my-assignments"],
  });

  const { data: inspectionDetails, isLoading: isLoadingInspection } = useQuery<any>({
    queryKey: ["/api/inspections", viewingInspectionId],
    queryFn: async () => {
      if (!viewingInspectionId) return null;
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}`);
      return response.json();
    },
    enabled: !!viewingInspectionId,
  });

  const { data: checklistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/inspections", viewingInspectionId, "checklist"],
    queryFn: async () => {
      if (!viewingInspectionId) return [];
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}/checklist`);
      return response.json();
    },
    enabled: !!viewingInspectionId,
  });

  const { data: receptionDetails, isLoading: isLoadingReception } = useQuery<any>({
    queryKey: ["/api/equipment-receptions", viewingReceptionId],
    queryFn: async () => {
      if (!viewingReceptionId) return null;
      const response = await apiRequest("GET", `/api/equipment-receptions/${viewingReceptionId}`);
      return response.json();
    },
    enabled: !!viewingReceptionId,
  });

  const markCompleteMutation = useMutation({
    mutationFn: async (workOrderId: string) => {
      const res = await apiRequest("POST", `/api/work-orders/${workOrderId}/mark-complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/my-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/foreman/pending-completion"] });
      toast({
        title: language === "am" ? "ተሳክቷል" : "Success",
        description: language === "am" ? "ስራው እንደተጠናቀቀ ምልክት ተደርጓል" : "Work marked as complete",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || (language === "am" ? "ስራውን እንደተጠናቀቀ ምልክት ማድረግ አልተቻለም" : "Failed to mark work as complete");
      toast({
        title: language === "am" ? "ስህተት" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleRequestParts = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsRequestPartsOpen(true);
  };

  const safeWorkOrders = myWorkOrders ?? [];
  const awaitingPartsOrders = safeWorkOrders.filter((wo) => wo.status === "awaiting_parts" || wo.status === "waiting_purchase");

  // Use equipment models hook
  const { models, isLoading: isLoadingModels } = useEquipmentModels();

  // Apply equipment model filter
  const filteredAwaitingPartsOrders = awaitingPartsOrders.filter((wo) => {
    if (equipmentModelFilter === "all") return true;
    return wo.equipmentModel === equipmentModelFilter;
  });

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: language === "am" ? "ንቁ" : "Active" },
      in_progress: { variant: "default", label: language === "am" ? "በሂደት ላይ" : "In Progress" },
      awaiting_parts: { variant: "secondary", label: language === "am" ? "እቃ በመጠባበቅ" : "Awaiting Parts" },
      waiting_purchase: { variant: "secondary", label: language === "am" ? "ግዢ በመጠባበቅ" : "Waiting Purchase" },
      pending_verification: { variant: "outline", label: language === "am" ? "ማረጋገጫ በመጠባበቅ" : "Pending Verification" },
      completed: { variant: "outline", label: language === "am" ? "ተጠናቋል" : "Completed" },
    };
    
    const statusInfo = statusMap[status] || { variant: "default" as const, label: status };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap: Record<string, { variant: "default" | "secondary" | "destructive"; label: string }> = {
      High: { variant: "destructive", label: language === "am" ? "ከፍተኛ" : "High" },
      Medium: { variant: "secondary", label: language === "am" ? "መካከለኛ" : "Medium" },
      Low: { variant: "default", label: language === "am" ? "ዝቅተኛ" : "Low" },
    };
    
    const priorityInfo = priorityMap[priority] || { variant: "default" as const, label: priority };
    return <Badge variant={priorityInfo.variant}>{priorityInfo.label}</Badge>;
  };

  const WorkOrderCard = ({ workOrder }: { workOrder: WorkOrder }) => (
    <Card className="hover-elevate" data-testid={`work-order-card-${workOrder.id}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg" data-testid={`text-work-order-number-${workOrder.id}`}>
            {workOrder.workOrderNumber}
          </CardTitle>
          <div className="flex items-center gap-2">
            {getStatusBadge(workOrder.status)}
            {getPriorityBadge(workOrder.priority)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {workOrder.elapsedTime && (
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "am" ? "የስራ ጊዜ" : "Work Time"}
              </p>
              <p className="font-bold text-red-600 dark:text-red-400" data-testid={`text-elapsed-time-${workOrder.id}`}>
                {workOrder.elapsedTime}
                {workOrder.isTimerPaused && (
                  <span className="text-xs ml-2 text-muted-foreground">
                    ({language === "am" ? "ቆሟል" : "Paused"})
                  </span>
                )}
              </p>
            </div>
          )}
          
          <div>
            <p className="text-sm text-muted-foreground">
              {language === "am" ? "መሳሪያ" : "Equipment"}
            </p>
            <p className="font-medium">{workOrder.equipmentModel || (language === "am" ? "የለም" : "N/A")}</p>
          </div>
          
          {workOrder.description && (
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "am" ? "መግለጫ" : "Description"}
              </p>
              <p className="text-sm">{workOrder.description}</p>
            </div>
          )}

          {workOrder.garageNames && workOrder.garageNames.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">
                {language === "am" ? "ጋራዥ" : "Garage"}
              </p>
              <p className="text-sm">{workOrder.garageNames.join(", ")}</p>
            </div>
          )}

          {(workOrder.inspectionId || workOrder.receptionId) && (
            <div className="flex gap-2 pt-2 border-t">
              {workOrder.inspectionId && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setViewingInspectionId(workOrder.inspectionId!)}
                  className="flex-1"
                  data-testid={`button-view-inspection-${workOrder.id}`}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  View Inspection
                </Button>
              )}
              {workOrder.receptionId && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setViewingReceptionId(workOrder.receptionId!)}
                  className="flex-1"
                  data-testid={`button-view-reception-${workOrder.id}`}
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  View Maintenance
                </Button>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => handleRequestParts(workOrder)}
              size="sm"
              variant="outline"
              data-testid={`button-request-parts-${workOrder.id}`}
            >
              <Package className="h-4 w-4 mr-2" />
              {language === "am" ? "እቃ ጠይቅ" : "Request Parts"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">
            {language === "am" ? "በመጫን ላይ..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Back Navigation */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/my-work")}
          data-testid="button-back-to-my-work"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {language === "am" ? "ወደ የእኔ ስራ ተመለስ" : "Back to My Work"}
        </Button>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 rounded-lg bg-secondary">
          <PackageOpen className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">
            {language === "am" ? "እቃ በመጠባበቅ" : "Awaiting Parts"}
          </h1>
          <p className="text-muted-foreground">
            {language === "am" ? "ለእቃዎች የሚጠብቁ የስራ ትእዛዞች" : "Work orders waiting for parts"}
          </p>
        </div>
      </div>

      {/* Stats */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {language === "am" ? "ጠቅላላ ትእዛዞች" : "Total Orders"}
          </CardTitle>
          <PackageOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold" data-testid="text-awaiting-parts-count">
            {awaitingPartsOrders.length}
          </div>
          <p className="text-xs text-muted-foreground">
            {language === "am" ? "እቃ በመጠባበቅ ላይ" : "Waiting for parts"}
          </p>
        </CardContent>
      </Card>

      {/* Equipment Model Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium whitespace-nowrap">
              {language === "am" ? "በእቃ ሞዴል ያጣራ" : "Filter by Equipment Model"}:
            </span>
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
          {equipmentModelFilter !== "all" && (
            <p className="text-sm text-muted-foreground mt-2">
              {language === "am" 
                ? `${filteredAwaitingPartsOrders.length} ከ ${awaitingPartsOrders.length} የስራ ትእዛዞች` 
                : `Showing ${filteredAwaitingPartsOrders.length} of ${awaitingPartsOrders.length} work orders`}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Work Orders List */}
      <div className="space-y-4">
        {filteredAwaitingPartsOrders.length > 0 ? (
          filteredAwaitingPartsOrders.map((workOrder) => (
            <WorkOrderCard key={workOrder.id} workOrder={workOrder} />
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              {equipmentModelFilter !== "all" 
                ? (language === "am" ? "ለዚህ ሞዴል ምንም እቃዎች በመጠባበቅ ላይ ያሉ የስራ ትእዛዞች የሉም" : "No work orders awaiting parts for this model")
                : (language === "am" ? "ለእቃዎች የሚጠብቁ የስራ ትእዛዞች የሉም" : "No work orders awaiting parts")}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      {selectedWorkOrder && (
        <RequestPartsDialog
          open={isRequestPartsOpen}
          onOpenChange={setIsRequestPartsOpen}
          workOrder={{
            id: selectedWorkOrder.id,
            workOrderNumber: selectedWorkOrder.workOrderNumber,
            status: selectedWorkOrder.status,
          }}
        />
      )}

      <WorkOrderDetailsDialog
        workOrderId={detailsWorkOrderId}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}
