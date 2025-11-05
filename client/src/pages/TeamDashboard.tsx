import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, Package, CheckCircle } from "lucide-react";
import { RequestPartsDialog } from "@/components/RequestPartsDialog";
import { useLanguage } from "@/contexts/LanguageContext";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentModel?: string;
  status: string;
  priority: string;
  description: string;
  workshopNames?: string[];
  garageNames?: string[];
};

export default function TeamDashboard() {
  const { language } = useLanguage();
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null);
  const [isRequestPartsOpen, setIsRequestPartsOpen] = useState(false);

  const { data: myWorkOrders = [], isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders/my-assignments"],
  });

  const handleRequestParts = (workOrder: WorkOrder) => {
    setSelectedWorkOrder(workOrder);
    setIsRequestPartsOpen(true);
  };

  const activeWorkOrders = myWorkOrders.filter(
    (wo) =>
      wo.status === "active" ||
      wo.status === "in_progress" ||
      wo.status === "awaiting_parts" ||
      wo.status === "waiting_purchase"
  );

  const completedWorkOrders = myWorkOrders.filter(
    (wo) =>
      wo.status === "pending_verification" ||
      wo.status === "pending_supervisor" ||
      wo.status === "completed"
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

          <div className="flex gap-2 pt-2">
            <Button
              onClick={() => handleRequestParts(workOrder)}
              size="sm"
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "am" ? "እቃ በመጠባበቅ" : "Awaiting Parts"}
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myWorkOrders.filter((wo) => wo.status === "awaiting_parts" || wo.status === "waiting_purchase").length}
            </div>
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

        <TabsContent value="completed" className="space-y-4">
          {completedWorkOrders.length > 0 ? (
            completedWorkOrders.map((workOrder) => <WorkOrderCard key={workOrder.id} workOrder={workOrder} />)
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
    </div>
  );
}
