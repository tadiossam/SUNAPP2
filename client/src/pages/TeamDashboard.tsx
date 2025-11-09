import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ClipboardList, Package, CheckCircle, PackageCheck, FileText, Info, Filter } from "lucide-react";
import { RequestPartsDialog } from "@/components/RequestPartsDialog";
import { WorkOrderDetailsDialog } from "@/components/WorkOrderDetailsDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

type ItemRequisition = {
  id: string;
  requisitionNumber: string;
  workOrderId: string;
  workOrderNumber: string;
  status: string;
  foremanApprovalStatus: string;
  storeApprovalStatus: string;
  foremanRemarks?: string | null;
  storeRemarks?: string | null;
  createdAt: string;
  lines?: Array<{
    description: string;
    quantityRequested: number;
    quantityApproved: number | null;
    unitOfMeasure: string;
  }>;
};

export default function TeamDashboard() {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isRequestPartsOpen, setIsRequestPartsOpen] = useState(false);
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [viewingReceptionId, setViewingReceptionId] = useState<string | null>(null);
  const [detailsWorkOrderId, setDetailsWorkOrderId] = useState<string | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  
  // Date range filtering state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: myWorkOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/my-assignments"],
  });

  const { data: myRequisitions } = useQuery<ItemRequisition[]>({
    queryKey: ["/api/item-requisitions"],
  });
  
  // Ensure arrays are never null (defaults don't work with null, only undefined)
  const safeWorkOrders = myWorkOrders ?? [];
  const safeRequisitions = myRequisitions ?? [];

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

  const confirmReceiptMutation = useMutation({
    mutationFn: async (requisitionId: string) => {
      const res = await apiRequest("POST", `/api/item-requisitions/${requisitionId}/confirm-receipt`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders/my-assignments"] });
      toast({
        title: language === "am" ? "ተሳክቷል" : "Success",
        description: language === "am" ? "የእቃዎች መቀበል ተረጋግጧል" : "Parts receipt confirmed",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || (language === "am" ? "የእቃዎች መቀበልን ማረጋገጥ አልተቻለም" : "Failed to confirm parts receipt");
      toast({
        title: language === "am" ? "ስህተት" : "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
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

  const activeWorkOrders = safeWorkOrders.filter(
    (wo) =>
      wo.status === "active" ||
      wo.status === "in_progress" ||
      wo.status === "awaiting_parts" ||
      wo.status === "waiting_purchase"
  );

  const completedWorkOrders = safeWorkOrders.filter(
    (wo) =>
      wo.status === "pending_verification" ||
      wo.status === "pending_supervisor" ||
      wo.status === "completed"
  );

  // Filter completed work orders by date range
  const filteredCompletedWorkOrders = completedWorkOrders.filter((wo) => {
    if (!startDate && !endDate) return true;
    
    // Use completedAt if available, otherwise use the work order creation date
    const workOrderDate = wo.completedAt || wo.startedAt;
    if (!workOrderDate) return false;
    
    const woDate = new Date(workOrderDate);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate + "T23:59:59") : null;
    
    if (start && woDate < start) return false;
    if (end && woDate > end) return false;
    
    return true;
  });

  const approvedRequisitions = safeRequisitions.filter(
    (req) => req.status === "approved"
  );

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
            {workOrder.status === "completed" ? (
              <Button
                onClick={() => {
                  setDetailsWorkOrderId(workOrder.id);
                  setIsDetailsDialogOpen(true);
                }}
                size="sm"
                variant="outline"
                className="w-full"
                data-testid={`button-view-details-${workOrder.id}`}
              >
                <Info className="h-4 w-4 mr-2" />
                {language === "am" ? "ዝርዝር ይመልከቱ" : "View Details"}
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => handleRequestParts(workOrder)}
                  size="sm"
                  variant="outline"
                  disabled={
                    workOrder.status === "pending_verification" ||
                    workOrder.status === "pending_supervisor"
                  }
                  data-testid={`button-request-parts-${workOrder.id}`}
                >
                  <Package className="h-4 w-4 mr-2" />
                  {language === "am" ? "እቃ ጠይቅ" : "Request Parts"}
                </Button>
                {workOrder.status === "in_progress" && (
                  <Button
                    onClick={() => markCompleteMutation.mutate(workOrder.id)}
                    disabled={markCompleteMutation.isPending}
                    size="sm"
                    data-testid={`button-complete-work-${workOrder.id}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {markCompleteMutation.isPending
                      ? (language === "am" ? "በመላክ ላይ..." : "Submitting...")
                      : (language === "am" ? "ስራውን አጠናቅቅ" : "Complete Work")}
                  </Button>
                )}
              </>
            )}
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">
          {language === "am" ? "የእኔ የስራ ትእዛዞች" : "My Work Orders"}
        </h1>
        <p className="text-muted-foreground">
          {language === "am" ? "የተመደቡ የስራ ትእዛዞች እና የእቃ ጥያቄዎች" : "View assigned work orders and request parts"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "am" ? "ንቁ የስራ ትእዛዞች" : "Active Work Orders"}
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeWorkOrders.length}</div>
          </CardContent>
        </Card>

        <Card 
          className="cursor-pointer hover-elevate active-elevate-2" 
          onClick={() => setLocation('/awaiting-parts')}
          data-testid="card-awaiting-parts"
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "am" ? "እቃ በመጠባበቅ" : "Awaiting Parts"}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {safeWorkOrders.filter((wo) => wo.status === "awaiting_parts" || wo.status === "waiting_purchase").length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {language === "am" ? "ይመልከቱ" : "Click to view"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "am" ? "የተጠናቀቁ" : "Completed"}
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedWorkOrders.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Work Orders Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active">
            <ClipboardList className="h-4 w-4 mr-2" />
            {language === "am" ? "ንቁ" : "Active"}
          </TabsTrigger>
          <TabsTrigger value="item-requested" data-testid="tab-item-requested">
            <Package className="h-4 w-4 mr-2" />
            {language === "am" ? "የተጠየቁ እቃዎች" : "Item Requested"} ({safeRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="parts-receipt" data-testid="tab-parts-receipt">
            <PackageCheck className="h-4 w-4 mr-2" />
            {language === "am" ? "የእቃ ማረጋገጫ" : "Parts Receipt"} ({approvedRequisitions.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            <CheckCircle className="h-4 w-4 mr-2" />
            {language === "am" ? "የተጠናቀቁ" : "Completed"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeWorkOrders.length > 0 ? (
            activeWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {language === "am" ? "ምንም ንቁ የስራ ትእዛዞች የሉም" : "No active work orders"}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="item-requested" className="space-y-4">
          {safeRequisitions.length > 0 ? (
            safeRequisitions.map((requisition) => {
              const getApprovalBadge = (status: string) => {
                if (status === "approved") {
                  return <Badge variant="default" data-testid={`badge-approved-${requisition.id}`}>{language === "am" ? "ፀድቋል" : "Approved"}</Badge>;
                } else if (status === "rejected") {
                  return <Badge variant="destructive" data-testid={`badge-rejected-${requisition.id}`}>{language === "am" ? "ተቀባይነት አላገኘም" : "Rejected"}</Badge>;
                } else if (status === "pending" || status === "pending_foreman") {
                  return <Badge variant="secondary" data-testid={`badge-pending-${requisition.id}`}>{language === "am" ? "በመጠባበቅ ላይ" : "Pending"}</Badge>;
                }
                return null;
              };

              return (
                <Card key={requisition.id} className="hover-elevate" data-testid={`requisition-card-${requisition.id}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{requisition.requisitionNumber}</CardTitle>
                      <div className="flex gap-2">
                        <div className="text-sm text-muted-foreground">
                          {language === "am" ? "ፎርማን" : "Foreman"}:
                        </div>
                        {getApprovalBadge(requisition.foremanApprovalStatus)}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {language === "am" ? "የስራ ትእዛዝ" : "Work Order"}: {requisition.workOrderNumber}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {requisition.foremanApprovalStatus === "approved" && (
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {language === "am" ? "መደብር" : "Store"}:
                          </p>
                          {getApprovalBadge(requisition.storeApprovalStatus)}
                        </div>
                      )}
                      
                      {requisition.lines && requisition.lines.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium">
                            {language === "am" ? "የተጠየቁ እቃዎች" : "Requested Items"}:
                          </p>
                          <div className="space-y-2">
                            {requisition.lines.map((line: any, idx: number) => (
                              <div 
                                key={idx} 
                                className={`text-sm p-2 rounded-md border-l-2 ${
                                  line.foremanStatus === 'approved' 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-950/30' 
                                    : line.foremanStatus === 'rejected'
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/30'
                                    : 'border-muted'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <p className="font-medium">{line.description}</p>
                                    <p className="text-muted-foreground text-xs mt-0.5">
                                      {language === "am" ? "የተጠየቀ መጠን" : "Requested"}: {line.quantityRequested} {line.unitOfMeasure}
                                    </p>
                                    
                                    {line.foremanStatus === 'approved' && line.foremanApprovedQty && (
                                      <p className="text-green-600 dark:text-green-400 text-xs font-medium mt-0.5">
                                        {language === "am" ? "የተፀደቀ መጠን" : "Approved"}: {line.foremanApprovedQty} {line.unitOfMeasure}
                                      </p>
                                    )}
                                    
                                    {line.foremanStatus === 'rejected' && line.foremanDecisionRemarks && (
                                      <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                        <strong>{language === "am" ? "የውድቅ ምክንያት" : "Rejection Reason"}:</strong> {line.foremanDecisionRemarks}
                                      </p>
                                    )}
                                    
                                    {line.foremanDecisionRemarks && line.foremanStatus === 'approved' && (
                                      <p className="text-muted-foreground text-xs mt-1">
                                        <strong>{language === "am" ? "የፎርማን አስተያየት" : "Foreman Note"}:</strong> {line.foremanDecisionRemarks}
                                      </p>
                                    )}
                                  </div>
                                  
                                  {line.foremanStatus === 'approved' && (
                                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-xs ml-2">
                                      {language === "am" ? "ፀድቋል" : "Approved"}
                                    </Badge>
                                  )}
                                  
                                  {line.foremanStatus === 'rejected' && (
                                    <Badge variant="destructive" className="text-xs ml-2">
                                      {language === "am" ? "ተቀባይነት አላገኘም" : "Rejected"}
                                    </Badge>
                                  )}
                                  
                                  {(!line.foremanStatus || line.foremanStatus === 'pending') && (
                                    <Badge variant="secondary" className="text-xs ml-2">
                                      {language === "am" ? "በመጠባበቅ ላይ" : "Pending"}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {requisition.foremanRemarks && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-muted-foreground">
                            {language === "am" ? "የፎርማን አስተያየት" : "Foreman Remarks"}:
                          </p>
                          <p className="text-sm">{requisition.foremanRemarks}</p>
                        </div>
                      )}

                      {requisition.storeRemarks && (
                        <div className="pt-2 border-t">
                          <p className="text-sm font-medium text-muted-foreground">
                            {language === "am" ? "የመደብር አስተያየት" : "Store Remarks"}:
                          </p>
                          <p className="text-sm">{requisition.storeRemarks}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {language === "am" ? "ምንም የተጠየቁ እቃዎች የሉም" : "No item requests"}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="parts-receipt" className="space-y-4">
          {approvedRequisitions.length > 0 ? (
            approvedRequisitions.map((requisition) => (
              <Card key={requisition.id} className="hover-elevate" data-testid={`requisition-card-${requisition.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{requisition.requisitionNumber}</CardTitle>
                    <Badge variant="default">{language === "am" ? "ፀድቋል" : "Approved"}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {language === "am" ? "የስራ ትእዛዝ" : "Work Order"}: {requisition.workOrderNumber}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {requisition.lines && requisition.lines.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          {language === "am" ? "የተፀደቁ እቃዎች" : "Approved Parts"}:
                        </p>
                        <div className="space-y-1">
                          {requisition.lines.map((line, idx) => (
                            <div key={idx} className="text-sm pl-4 border-l-2 border-muted">
                              <p className="font-medium">{line.description}</p>
                              <p className="text-muted-foreground">
                                {language === "am" ? "መጠን" : "Quantity"}: {line.quantityApproved || line.quantityRequested} {line.unitOfMeasure}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() => confirmReceiptMutation.mutate(requisition.id)}
                      disabled={confirmReceiptMutation.isPending}
                      className="w-full"
                      data-testid={`button-confirm-receipt-${requisition.id}`}
                    >
                      <PackageCheck className="h-4 w-4 mr-2" />
                      {confirmReceiptMutation.isPending
                        ? (language === "am" ? "በማረጋገጥ ላይ..." : "Confirming...")
                        : (language === "am" ? "መቀበልን አረጋግጥ" : "Confirm Receipt")}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {language === "am" ? "ምንም የሚጠበቁ የእቃ ማረጋገጫዎች የሉም" : "No pending parts receipts"}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {/* Date Range Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {language === "am" ? "በቀን ክልል ያጣራ" : "Filter by Date Range"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <Label htmlFor="start-date-td">
                    {language === "am" ? "የመጀመሪያ ቀን" : "Start Date"}
                  </Label>
                  <Input
                    id="start-date-td"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    data-testid="input-start-date"
                  />
                </div>
                <div className="flex-1">
                  <Label htmlFor="end-date-td">
                    {language === "am" ? "የመጨረሻ ቀን" : "End Date"}
                  </Label>
                  <Input
                    id="end-date-td"
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
                    data-testid="button-clear-filters"
                  >
                    {language === "am" ? "አጥራ" : "Clear Filters"}
                  </Button>
                </div>
              </div>
              {(startDate || endDate) && (
                <p className="text-sm text-muted-foreground mt-2">
                  {language === "am" 
                    ? `${filteredCompletedWorkOrders.length} ከ ${completedWorkOrders.length} የስራ ትእዛዞች` 
                    : `Showing ${filteredCompletedWorkOrders.length} of ${completedWorkOrders.length} work orders`}
                </p>
              )}
            </CardContent>
          </Card>

          {filteredCompletedWorkOrders.length > 0 ? (
            filteredCompletedWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                {language === "am" ? "ምንም የተጠናቀቁ የስራ ትእዛዞች የሉም" : "No completed work orders"}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Request Parts Dialog */}
      {selectedWorkOrder && (
        <RequestPartsDialog
          open={isRequestPartsOpen}
          onOpenChange={setIsRequestPartsOpen}
          workOrderId={selectedWorkOrder.id}
          workOrderNumber={selectedWorkOrder.workOrderNumber}
        />
      )}

      {/* Inspection Details Dialog */}
      <Dialog open={!!viewingInspectionId} onOpenChange={(open) => !open && setViewingInspectionId(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-inspection-details">
          <DialogHeader>
            <DialogTitle>Equipment Inspection Report</DialogTitle>
            <DialogDescription>
              Comprehensive inspection and reception details
            </DialogDescription>
          </DialogHeader>
          {isLoadingInspection ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading inspection details...</div>
            </div>
          ) : inspectionDetails ? (
            <div className="space-y-6">
              {/* Equipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Equipment Details</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-6">
                  <div>
                    <Label className="text-muted-foreground text-sm">Inspection Number:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.inspectionNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Equipment:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.reception?.equipment?.model || inspectionDetails.reception?.equipment?.plantNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Plant Number:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.reception?.plantNumber || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Service Type:</Label>
                    <div className="mt-1">
                      <Badge variant="secondary">{inspectionDetails.serviceType || "N/A"}</Badge>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Inspector:</Label>
                    <p className="font-medium mt-1">{inspectionDetails.inspector?.fullName || "N/A"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Completed Date:</Label>
                    <p className="font-medium mt-1">
                      {inspectionDetails.inspectionDate 
                        ? new Date(inspectionDetails.inspectionDate).toLocaleDateString('en-US', { 
                            month: '2-digit', 
                            day: '2-digit', 
                            year: 'numeric' 
                          })
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-sm">Status:</Label>
                    <div className="mt-1">
                      <Badge>{inspectionDetails.status}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Inspection Checklist Summary */}
              {checklistItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Inspection Checklist (የማረጋገጫ ዝርዝር)</CardTitle>
                    <p className="text-sm text-muted-foreground">Items with selected status</p>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-md overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-muted">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm font-medium">ተ.ቁ</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">የመሳሪያዉ ዝርዝር</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">ያለበት ሁኔታ</th>
                            <th className="px-4 py-2 text-left text-sm font-medium">ተጨማሪ አስተያየት</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {checklistItems
                            .filter((item: any) => {
                              return item.hasItem || item.doesNotHave || item.isWorking || 
                                     item.notWorking || item.isBroken || item.isCracked;
                            })
                            .map((item: any, index: number) => {
                              let selectedStatus = "";
                              if (item.hasItem) selectedStatus = "አለዉ";
                              else if (item.doesNotHave) selectedStatus = "የለዉም";
                              else if (item.isWorking) selectedStatus = "የሚሰራ";
                              else if (item.notWorking) selectedStatus = "የማይሰራ";
                              else if (item.isBroken) selectedStatus = "የተሰበረ";
                              else if (item.isCracked) selectedStatus = "የተሰነጠቀ";

                              return (
                                <tr key={item.id} className={index % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                                  <td className="px-4 py-2 text-sm">{item.itemNumber}</td>
                                  <td className="px-4 py-2 text-sm font-medium">{item.itemDescription}</td>
                                  <td className="px-4 py-2 text-sm">{selectedStatus}</td>
                                  <td className="px-4 py-2 text-sm text-muted-foreground">{item.comments || "-"}</td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                      {checklistItems.filter((item: any) => 
                        item.hasItem || item.doesNotHave || item.isWorking || 
                        item.notWorking || item.isBroken || item.isCracked
                      ).length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          No checklist items selected
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No inspection data available</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Maintenance/Reception Details Dialog */}
      <Dialog open={!!viewingReceptionId} onOpenChange={(open) => !open && setViewingReceptionId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-reception-details">
          <DialogHeader>
            <DialogTitle>Maintenance Check-in Details</DialogTitle>
            <DialogDescription>
              View equipment reception and maintenance information
            </DialogDescription>
          </DialogHeader>
          {isLoadingReception ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading maintenance details...</div>
            </div>
          ) : receptionDetails ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Reception Number</Label>
                  <p className="font-medium">{receptionDetails.receptionNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Plant Number</Label>
                  <p className="font-medium">{receptionDetails.plantNumber}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Arrival Date</Label>
                  <p className="font-medium">{new Date(receptionDetails.arrivalDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Kilometrage</Label>
                  <p className="font-medium">{receptionDetails.kilometreRiding || 'N/A'} km</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fuel Level</Label>
                  <Badge>{receptionDetails.fuelLevel || 'N/A'}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge>{receptionDetails.status}</Badge>
                </div>
              </div>
              
              {/* Driver Information */}
              {receptionDetails.driver && (
                <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <Label className="text-muted-foreground font-semibold">Driver Information</Label>
                  <div className="mt-2 space-y-1">
                    <p className="font-medium">{receptionDetails.driver.fullName}</p>
                    {receptionDetails.driver.email && (
                      <p className="text-sm text-muted-foreground">{receptionDetails.driver.email}</p>
                    )}
                    {receptionDetails.driver.phoneNumber && (
                      <p className="text-sm text-muted-foreground">{receptionDetails.driver.phoneNumber}</p>
                    )}
                  </div>
                </div>
              )}
              
              {receptionDetails.reasonOfMaintenance && (
                <div>
                  <Label className="text-muted-foreground">Reason for Maintenance</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{receptionDetails.reasonOfMaintenance}</p>
                </div>
              )}
              
              {receptionDetails.issuesReported && (
                <div>
                  <Label className="text-muted-foreground">Driver Reported Issues</Label>
                  <p className="mt-1 p-3 bg-amber-50 dark:bg-amber-950 rounded-md text-sm border border-amber-200 dark:border-amber-800">
                    {receptionDetails.issuesReported}
                  </p>
                </div>
              )}

              {receptionDetails.adminIssuesReported && (
                <div>
                  <Label className="text-muted-foreground">Issues Reported by Administration Officer</Label>
                  <p className="mt-1 p-3 bg-blue-50 dark:bg-blue-950 rounded-md text-sm border border-blue-200 dark:border-blue-800">
                    {receptionDetails.adminIssuesReported}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">No maintenance data available</div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Work Order Details Dialog */}
      <WorkOrderDetailsDialog
        workOrderId={detailsWorkOrderId}
        open={isDetailsDialogOpen}
        onOpenChange={setIsDetailsDialogOpen}
      />
    </div>
  );
}
