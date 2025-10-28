import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, Plus, FileText, Calendar, User, Clock, DollarSign, X, Package, ShoppingCart, Edit, Trash2, Users, Building2, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Equipment, Garage, Employee, SparePart } from "@shared/schema";

type WorkOrderRequiredPart = {
  id: string;
  sparePartId?: string | null;
  partName: string;
  partNumber: string;
  stockStatus?: string | null;
  quantity?: number;
};

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentId: string;
  garageId?: string | null;
  assignedToIds?: string[] | null; // Array of employee IDs for team assignment
  assignedToList?: Employee[]; // Populated assigned employees
  priority: string;
  workType: string;
  description: string;
  status: string;
  estimatedHours: string | null;
  estimatedCost: string | null;
  scheduledDate: string | null;
  notes?: string | null;
  requiredParts?: WorkOrderRequiredPart[];
  inspectionId?: string | null;
  receptionId?: string | null;
  createdAt: string;
};

export default function WorkOrdersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingWorkOrder, setEditingWorkOrder] = useState<WorkOrder | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isInspectionSelectOpen, setIsInspectionSelectOpen] = useState(false);
  const [selectedInspectionId, setSelectedInspectionId] = useState<string | null>(null);
  
  // Form state
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [selectedGarageIds, setSelectedGarageIds] = useState<string[]>([]);
  const [selectedWorkshopIds, setSelectedWorkshopIds] = useState<string[]>([]);
  const [priority, setPriority] = useState("medium");
  const [workType, setWorkType] = useState("repair");
  const [description, setDescription] = useState("");
  const [selectedParts, setSelectedParts] = useState<SparePart[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [isPartsDialogOpen, setIsPartsDialogOpen] = useState(false);
  const [tempSelectedParts, setTempSelectedParts] = useState<string[]>([]);
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);

  // Inspection and Maintenance detail dialogs
  const [viewingInspectionId, setViewingInspectionId] = useState<string | null>(null);
  const [viewingReceptionId, setViewingReceptionId] = useState<string | null>(null);

  const { data: workOrders, isLoading } = useQuery<WorkOrder[]>({
    queryKey: ["/api/work-orders"],
  });

  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: garages } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: spareParts } = useQuery<SparePart[]>({
    queryKey: ["/api/parts"],
  });

  // Fetch completed inspections for selection
  const { data: allCompletedInspections = [] } = useQuery<any[]>({
    queryKey: ["/api/inspections/completed"],
  });

  // Filter out inspections that already have work orders (unless WO is deleted)
  const completedInspections = useMemo(() => {
    if (!workOrders || !allCompletedInspections) return allCompletedInspections;
    
    // Get all inspection IDs that have work orders created
    const inspectionIdsWithWorkOrders = new Set(
      workOrders
        .filter(wo => wo.inspectionId) // Only work orders linked to inspections
        .map(wo => wo.inspectionId)
    );
    
    // Filter out inspections that already have work orders
    return allCompletedInspections.filter(
      inspection => !inspectionIdsWithWorkOrders.has(inspection.id)
    );
  }, [allCompletedInspections, workOrders]);

  // Fetch inspection details when viewing
  const { data: inspectionDetails, isLoading: isLoadingInspection } = useQuery<any>({
    queryKey: ["/api/inspections", viewingInspectionId],
    queryFn: async () => {
      if (!viewingInspectionId) return null;
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}`);
      return response.json();
    },
    enabled: !!viewingInspectionId,
  });

  // Fetch inspection checklist items when viewing
  const { data: checklistItems = [] } = useQuery<any[]>({
    queryKey: ["/api/inspections", viewingInspectionId, "checklist"],
    queryFn: async () => {
      if (!viewingInspectionId) return [];
      const response = await apiRequest("GET", `/api/inspections/${viewingInspectionId}/checklist`);
      return response.json();
    },
    enabled: !!viewingInspectionId,
  });

  // Fetch reception details when viewing
  const { data: receptionDetails, isLoading: isLoadingReception } = useQuery<any>({
    queryKey: ["/api/equipment-receptions", viewingReceptionId],
    queryFn: async () => {
      if (!viewingReceptionId) return null;
      const response = await apiRequest("GET", `/api/equipment-receptions/${viewingReceptionId}`);
      return response.json();
    },
    enabled: !!viewingReceptionId,
  });

  // Auto-generate work order number when dialog opens (only for new work orders)
  useEffect(() => {
    const generateWorkOrderNumber = async () => {
      if (isDialogOpen && !editingWorkOrder && !workOrderNumber) {
        try {
          const response = await fetch("/api/work-orders/generate-number");
          const data = await response.json();
          setWorkOrderNumber(data.workOrderNumber);
        } catch (error) {
          console.error("Failed to generate work order number:", error);
        }
      }
    };
    generateWorkOrderNumber();
  }, [isDialogOpen, editingWorkOrder]);

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      if (editingWorkOrder) {
        return await apiRequest("PUT", `/api/work-orders/${editingWorkOrder.id}`, data);
      } else {
        return await apiRequest("POST", "/api/work-orders", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: editingWorkOrder ? "Work order updated successfully" : "Work order created successfully",
      });
      resetForm();
      setIsDialogOpen(false);
      setEditingWorkOrder(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingWorkOrder ? 'update' : 'create'} work order`,
        variant: "destructive",
      });
    },
  });

  const deleteWorkOrderMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/work-orders/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Work order deleted successfully",
      });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete work order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setWorkOrderNumber("");
    setEquipmentId("");
    setSelectedGarageIds([]);
    setSelectedWorkshopIds([]);
    setPriority("medium");
    setWorkType("repair");
    setDescription("");
    setSelectedParts([]);
    setPartSearchTerm("");
    setEditingWorkOrder(null);
    setSelectedInspectionId(null);
  };

  // Handle inspection selection and pre-fill form
  const handleInspectionSelect = (inspectionId: string) => {
    const inspection = completedInspections.find(insp => insp.id === inspectionId);
    if (!inspection || !inspection.reception) {
      toast({
        title: "Error",
        description: "Inspection details not found",
        variant: "destructive",
      });
      return;
    }

    const reception = inspection.reception;
    
    // Pre-fill the form with inspection and reception data
    setSelectedInspectionId(inspectionId);
    setEquipmentId(reception.equipmentId || "");
    // Note: Multi-garage assignment will be done manually in the form
    
    // Build description from driver submission and admin issues
    let descriptionText = `Process Equipment Maintenance - ${reception.receptionNumber}\n\n`;
    descriptionText += `--- Driver Submission Details ---\n`;
    descriptionText += `Driver Name: ${reception.driver?.fullName || 'N/A'}\n`;
    descriptionText += `Reported Issues: ${reception.reportedIssues || 'None reported'}\n`;
    descriptionText += `Fuel Level: ${reception.fuelLevel || 'N/A'}\n`;
    descriptionText += `Kilometrage: ${reception.kilometrage || 'N/A'} km\n`;
    descriptionText += `Reason: ${reception.reasonForMaintenance || 'N/A'}\n\n`;
    
    if (reception.adminReportedIssues) {
      descriptionText += `--- Issues Reported by Administration Officer ---\n`;
      descriptionText += `${reception.adminReportedIssues}\n`;
    }
    
    setDescription(descriptionText);
    setWorkType(inspection.serviceType === "Short Term" ? "maintenance" : "repair");
    setPriority("medium");

    // Open the work order dialog
    setIsInspectionSelectOpen(false);
    setIsDialogOpen(true);
  };

  const handleEdit = async (workOrder: WorkOrder) => {
    setEditingWorkOrder(workOrder);
    setWorkOrderNumber(workOrder.workOrderNumber);
    setEquipmentId(workOrder.equipmentId);
    setPriority(workOrder.priority);
    setWorkType(workOrder.workType);
    setDescription(workOrder.description);
    
    // Load garage and workshop assignments for this work order
    try {
      const response = await fetch(`/api/work-orders/${workOrder.id}/assignments`);
      if (response.ok) {
        const assignments = await response.json();
        setSelectedGarageIds(assignments.garageIds || []);
        setSelectedWorkshopIds(assignments.workshopIds || []);
      }
    } catch (error) {
      console.error("Failed to load work order assignments:", error);
      // Continue with empty arrays if fetch fails
      setSelectedGarageIds([]);
      setSelectedWorkshopIds([]);
    }
    
    // Hydrate selected parts from work order required parts
    if (workOrder.requiredParts && spareParts) {
      const partsToSelect = workOrder.requiredParts
        .map(reqPart => {
          // Try to find the part in the spare parts list
          const fullPart = spareParts.find(sp => sp.id === reqPart.sparePartId);
          if (fullPart) {
            return fullPart;
          }
          // If not found, create a partial SparePart from the denormalized data
          return {
            id: reqPart.sparePartId || reqPart.id,
            partName: reqPart.partName,
            partNumber: reqPart.partNumber,
            stockStatus: reqPart.stockStatus || 'unknown',
          } as SparePart;
        })
        .filter(Boolean);
      setSelectedParts(partsToSelect);
    } else if (workOrder.requiredParts) {
      // If spareParts not loaded yet, create partial parts from denormalized data
      const partsToSelect = workOrder.requiredParts.map(reqPart => ({
        id: reqPart.sparePartId || reqPart.id,
        partName: reqPart.partName,
        partNumber: reqPart.partNumber,
        stockStatus: reqPart.stockStatus || 'unknown',
      } as SparePart));
      setSelectedParts(partsToSelect);
    }
    
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteWorkOrderMutation.mutate(deleteConfirmId);
    }
  };

  const openPartsDialog = () => {
    setTempSelectedParts(selectedParts.map(p => p.id));
    setIsPartsDialogOpen(true);
  };

  const togglePartSelection = (partId: string) => {
    setTempSelectedParts(prev => {
      if (prev.includes(partId)) {
        return prev.filter(id => id !== partId);
      } else {
        return [...prev, partId];
      }
    });
  };

  const confirmPartsSelection = () => {
    setSelectedParts(prev => {
      const selected = spareParts?.filter(p => tempSelectedParts.includes(p.id)) || [];
      return selected;
    });
    setIsPartsDialogOpen(false);
    setPartSearchTerm("");
  };

  const removePart = (partId: string) => {
    setSelectedParts(selectedParts.filter(p => p.id !== partId));
  };

  const getStockStatusColor = (status: string) => {
    switch (status) {
      case "in_stock": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "low_stock": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "out_of_stock": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const filteredSpareParts = spareParts?.filter(part => 
    partSearchTerm === "" ||
    part.partNumber.toLowerCase().includes(partSearchTerm.toLowerCase()) ||
    part.partName.toLowerCase().includes(partSearchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!equipmentId || !description || !workType) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const selectedInspection = selectedInspectionId 
      ? completedInspections.find(insp => insp.id === selectedInspectionId)
      : null;

    createWorkOrderMutation.mutate({
      workOrderNumber,
      equipmentId,
      garageIds: selectedGarageIds,
      workshopIds: selectedWorkshopIds,
      priority,
      workType,
      description,
      inspectionId: selectedInspectionId || undefined,
      receptionId: selectedInspection?.receptionId || undefined,
      requiredParts: selectedParts.map(part => ({
        partId: part.id,
        partName: part.partName,
        partNumber: part.partNumber,
        stockStatus: part.stockStatus,
      })),
    });
  };

  // Filter work orders by tab and other filters
  const pendingWorkOrders = workOrders?.filter((wo) => wo.status !== "completed" && wo.status !== "cancelled") || [];
  const completedWorkOrders = workOrders?.filter((wo) => wo.status === "completed") || [];
  
  const currentTabWorkOrders = activeTab === "pending" ? pendingWorkOrders : completedWorkOrders;
  
  const filteredWorkOrders = currentTabWorkOrders.filter((wo) => {
    const matchesSearch = wo.workOrderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         wo.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || wo.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || wo.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "in_progress": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "pending": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "assigned": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "high": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "low": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t("workOrders")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("manageAndTrackWorkOrders")}
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="pending" data-testid="tab-pending-work-orders">
            Pending ({pendingWorkOrders.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed-work-orders">
            Completed ({completedWorkOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t("searchWorkOrders")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                      data-testid="input-search-work-orders"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-status-filter">
                    <SelectValue placeholder={t("allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allStatuses")}</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="assigned">Assigned</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-[160px]" data-testid="select-priority-filter">
                    <SelectValue placeholder={t("allPriorities")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allPriorities")}</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsInspectionSelectOpen(true)} data-testid="button-add-work-order">
                  <Plus className="h-4 w-4 mr-2" />
                  {t("addWorkOrder")}
                </Button>
              </div>
            </CardContent>
          </Card>

      {/* Work Orders Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : filteredWorkOrders && filteredWorkOrders.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredWorkOrders.map((wo) => (
            <Card key={wo.id} className="hover-elevate" data-testid={`card-work-order-${wo.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{wo.workOrderNumber}</CardTitle>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge className={getPriorityColor(wo.priority)} data-testid={`badge-priority-${wo.id}`}>
                      {wo.priority}
                    </Badge>
                    <Badge className={getStatusColor(wo.status)} data-testid={`badge-status-${wo.id}`}>
                      {wo.status.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">{wo.workType}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">{wo.description}</p>
                </div>
                {/* Assigned Team */}
                {wo.assignedToList && wo.assignedToList.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex flex-wrap gap-1">
                      {wo.assignedToList.map((emp) => (
                        <Badge key={emp.id} variant="outline" className="text-xs">
                          {emp.fullName}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {wo.scheduledDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{new Date(wo.scheduledDate).toLocaleDateString()}</span>
                    </div>
                  )}
                  {wo.estimatedHours && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{wo.estimatedHours}h</span>
                    </div>
                  )}
                  {wo.estimatedCost && (
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>${wo.estimatedCost}</span>
                    </div>
                  )}
                </div>
                
                {/* Linked Documents - Show buttons for inspection and reception */}
                {(wo.inspectionId || wo.receptionId) && (
                  <div className="flex gap-2 pt-2 border-t">
                    {wo.inspectionId && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setViewingInspectionId(wo.inspectionId!)}
                        className="flex-1"
                        data-testid={`button-view-inspection-${wo.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        View Inspection
                      </Button>
                    )}
                    {wo.receptionId && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setViewingReceptionId(wo.receptionId!)}
                        className="flex-1"
                        data-testid={`button-view-reception-${wo.id}`}
                      >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        View Maintenance
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-2 border-t">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleEdit(wo)}
                    className="flex-1"
                    data-testid={`button-edit-${wo.id}`}
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => handleDelete(wo.id)}
                    className="flex-1 text-destructive hover:text-destructive"
                    data-testid={`button-delete-${wo.id}`}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("noWorkOrdersFound")}</p>
          </CardContent>
        </Card>
      )}
        </TabsContent>
      </Tabs>

      {/* Inspection Selection Dialog */}
      <Dialog open={isInspectionSelectOpen} onOpenChange={setIsInspectionSelectOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Select Completed Inspection</DialogTitle>
            <DialogDescription>
              Choose an inspection to create a work order from. The work order will be pre-filled with inspection details.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {completedInspections.length > 0 ? (
              completedInspections.map((inspection) => (
                <Card 
                  key={inspection.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => handleInspectionSelect(inspection.id)}
                  data-testid={`card-inspection-${inspection.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div>
                          <p className="font-semibold">{inspection.inspectionNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            Reception: {inspection.reception?.receptionNumber || 'N/A'}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">
                            Equipment: {inspection.reception?.equipment?.model || 'N/A'}
                          </Badge>
                          <Badge variant="outline">
                            {inspection.serviceType}
                          </Badge>
                          {inspection.inspector && (
                            <Badge variant="outline">
                              Inspector: {inspection.inspector.fullName}
                            </Badge>
                          )}
                        </div>
                        {inspection.findings && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            Findings: {inspection.findings}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="default" data-testid={`button-select-inspection-${inspection.id}`}>
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No completed inspections available
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Work Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) {
          resetForm();
        }
      }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-work-order">
          <DialogHeader>
            <DialogTitle>{editingWorkOrder ? "Edit Work Order" : "Create New Work Order"}</DialogTitle>
            <DialogDescription>
              {editingWorkOrder ? "Update the work order details" : "Fill in the details to create a new work order for equipment service"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Work Order Number */}
              <div className="space-y-2">
                <Label htmlFor="workOrderNumber">Work Order Number</Label>
                <Input
                  id="workOrderNumber"
                  value={workOrderNumber}
                  onChange={(e) => setWorkOrderNumber(e.target.value)}
                  data-testid="input-work-order-number"
                  className="font-mono font-semibold"
                />
                <p className="text-xs text-muted-foreground">Auto-generated (editable)</p>
              </div>

              {/* Equipment Selection */}
              <div className="space-y-2">
                <Label htmlFor="equipment">Equipment *</Label>
                <Select value={equipmentId} onValueChange={setEquipmentId}>
                  <SelectTrigger data-testid="select-equipment">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment?.map((eq) => (
                      <SelectItem key={eq.id} value={eq.id}>
                        {eq.make} {eq.model} - {eq.assetNo || eq.plateNo || eq.machineSerial}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Work Type */}
              <div className="space-y-2">
                <Label htmlFor="workType">Work Type *</Label>
                <Select value={workType} onValueChange={setWorkType}>
                  <SelectTrigger data-testid="select-work-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="repair">Repair</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inspection">Inspection</SelectItem>
                    <SelectItem value="wash">Wash</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger data-testid="select-priority">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

            </div>

            {/* Multi-Garage Selection */}
            <div className="space-y-3 p-4 border-2 rounded-lg bg-muted/30">
              <Label className="flex items-center gap-2 text-lg font-semibold">
                <Building2 className="h-5 w-5" />
                Assign Garages & Workshops
              </Label>
              
              {/* Selected Garages Display */}
              {selectedGarageIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-background rounded-md">
                  {selectedGarageIds.map((garageId) => {
                    const garage = garages?.find(g => g.id === garageId);
                    return garage ? (
                      <div key={garageId} className="flex items-center gap-2 bg-primary/10 rounded-md pl-3 pr-1 py-1 border border-primary/20">
                        <span className="text-sm font-medium">{garage.name}</span>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => setSelectedGarageIds(prev => prev.filter(id => id !== garageId))}
                          data-testid={`button-remove-garage-${garageId}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* Select Garages Button */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsWorkshopDialogOpen(true)}
                  className="h-10"
                  data-testid="button-select-garages-workshops"
                >
                  <Building2 className="h-4 w-4 mr-2" />
                  {selectedGarageIds.length === 0 ? "Select Garages" : `Manage Garages (${selectedGarageIds.length})`}
                </Button>

                {selectedWorkshopIds.length > 0 && (
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Wrench className="h-4 w-4 mr-1" />
                    {selectedWorkshopIds.length} workshop{selectedWorkshopIds.length !== 1 ? 's' : ''} selected
                  </div>
                )}
              </div>
            </div>

            {/* Required Spare Parts */}
            <div className="space-y-3 p-4 border-2 border-primary rounded-lg bg-primary/5">
              <Label className="flex items-center gap-2 text-lg font-semibold text-primary">
                <Package className="h-5 w-5" />
                Required Spare Parts
              </Label>
              
              {/* Selected Parts Display */}
              {selectedParts.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted rounded-md">
                  {selectedParts.map((part) => (
                    <div key={part.id} className="flex items-center gap-2 bg-background rounded-md pl-3 pr-1 py-1 border">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">{part.partName}</span>
                        <span className="text-xs text-muted-foreground">{part.partNumber}</span>
                      </div>
                      <Badge className={getStockStatusColor(part.stockStatus)} data-testid={`badge-stock-${part.id}`}>
                        {part.stockStatus.replace("_", " ")}
                      </Badge>
                      {part.stockStatus === "out_of_stock" && (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs"
                          onClick={() => {
                            toast({
                              title: "Purchase Request",
                              description: `Request purchase for ${part.partName}`,
                            });
                          }}
                          data-testid={`button-request-purchase-${part.id}`}
                        >
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          Request Purchase
                        </Button>
                      )}
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => removePart(part.id)}
                        data-testid={`button-remove-part-${part.id}`}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Select Parts Button */}
              <Button
                type="button"
                variant="default"
                onClick={openPartsDialog}
                className="w-full h-12 text-base font-semibold"
                data-testid="button-select-spare-parts"
              >
                <Plus className="h-5 w-5 mr-2" />
                {selectedParts.length === 0 ? "Click Here to Select Spare Parts" : `Manage Selected Parts (${selectedParts.length})`}
              </Button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the work to be done..."
                rows={3}
                data-testid="textarea-description"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setIsDialogOpen(false);
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createWorkOrderMutation.isPending}
                data-testid="button-submit-work-order"
              >
                {createWorkOrderMutation.isPending 
                  ? (editingWorkOrder ? "Updating..." : "Creating...") 
                  : (editingWorkOrder ? "Update Work Order" : "Create Work Order")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Spare Parts Selection Dialog */}
      <Dialog open={isPartsDialogOpen} onOpenChange={setIsPartsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-select-spare-parts">
          <DialogHeader>
            <DialogTitle>Select Spare Parts</DialogTitle>
            <DialogDescription>
              Choose the spare parts required for this work order
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search spare parts by name or part number..."
                value={partSearchTerm}
                onChange={(e) => setPartSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-parts-dialog"
              />
            </div>

            {/* Parts List */}
            <div className="flex-1 overflow-y-auto border rounded-md">
              {filteredSpareParts && filteredSpareParts.length > 0 ? (
                <div className="divide-y">
                  {filteredSpareParts.map((part) => (
                    <div
                      key={part.id}
                      className="flex items-center gap-3 p-4 hover-elevate cursor-pointer"
                      onClick={() => togglePartSelection(part.id)}
                      data-testid={`part-option-${part.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={tempSelectedParts.includes(part.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          togglePartSelection(part.id);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-gray-300"
                        data-testid={`checkbox-part-${part.id}`}
                      />
                      <div className="flex-1">
                        <div className="font-medium">{part.partName}</div>
                        <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                        {part.category && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Category: {part.category}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStockStatusColor(part.stockStatus)}>
                          {part.stockStatus.replace("_", " ")}
                        </Badge>
                        {part.price && (
                          <span className="text-sm font-medium">${part.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full p-8 text-muted-foreground">
                  {partSearchTerm ? "No parts found matching your search" : "No spare parts available"}
                </div>
              )}
            </div>

            {/* Selection Summary */}
            {tempSelectedParts.length > 0 && (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">
                  {tempSelectedParts.length} part{tempSelectedParts.length !== 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsPartsDialogOpen(false);
                setPartSearchTerm("");
              }}
              data-testid="button-cancel-parts-selection"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={confirmPartsSelection}
              data-testid="button-confirm-parts-selection"
            >
              Confirm Selection
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Workshop Selection Dialog */}
      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col" data-testid="dialog-select-garages-workshops">
          <DialogHeader>
            <DialogTitle>Select Garages & Workshops</DialogTitle>
            <DialogDescription>
              Choose garages and workshops to assign this work order
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4">
            {garages && garages.length > 0 ? (
              garages.map((garage: any) => (
                <Card key={garage.id} className="overflow-hidden" data-testid={`garage-card-${garage.id}`}>
                  <CardHeader className="pb-3 bg-muted/30">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={selectedGarageIds.includes(garage.id)}
                        onChange={() => {
                          setSelectedGarageIds(prev =>
                            prev.includes(garage.id)
                              ? prev.filter(id => id !== garage.id)
                              : [...prev, garage.id]
                          );
                        }}
                        className="h-4 w-4"
                        data-testid={`checkbox-garage-${garage.id}`}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold">{garage.name}</h3>
                        <p className="text-sm text-muted-foreground">{garage.location}</p>
                      </div>
                    </div>
                  </CardHeader>
                  {garage.workshops && garage.workshops.length > 0 && (
                    <CardContent className="pt-3">
                      <p className="text-sm font-medium mb-2">Workshops:</p>
                      <div className="space-y-2">
                        {garage.workshops.map((workshop: any) => (
                          <div
                            key={workshop.id}
                            className="flex items-center gap-3 p-2 rounded-md border hover-elevate"
                            data-testid={`workshop-option-${workshop.id}`}
                          >
                            <input
                              type="checkbox"
                              checked={selectedWorkshopIds.includes(workshop.id)}
                              onChange={() => {
                                setSelectedWorkshopIds(prev =>
                                  prev.includes(workshop.id)
                                    ? prev.filter(id => id !== workshop.id)
                                    : [...prev, workshop.id]
                                );
                              }}
                              className="h-4 w-4"
                              data-testid={`checkbox-workshop-${workshop.id}`}
                            />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{workshop.name}</p>
                              {workshop.foreman && (
                                <p className="text-xs text-muted-foreground">Foreman: {workshop.foreman.fullName}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                No garages available
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsWorkshopDialogOpen(false)}
              data-testid="button-cancel-workshop-selection"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => setIsWorkshopDialogOpen(false)}
              data-testid="button-confirm-workshop-selection"
            >
              Confirm ({selectedGarageIds.length} garages, {selectedWorkshopIds.length} workshops)
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Work Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this work order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                              // Only show items with at least one checkbox selected
                              return item.hasItem || item.doesNotHave || item.isWorking || 
                                     item.notWorking || item.isBroken || item.isCracked;
                            })
                            .map((item: any, index: number) => {
                              // Determine which status is selected
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
                  <p className="font-medium">{receptionDetails.kilometrage} km</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Fuel Level</Label>
                  <Badge>{receptionDetails.fuelLevel}</Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge>{receptionDetails.status}</Badge>
                </div>
              </div>
              
              {receptionDetails.reasonForMaintenance && (
                <div>
                  <Label className="text-muted-foreground">Reason for Maintenance</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{receptionDetails.reasonForMaintenance}</p>
                </div>
              )}
              
              {receptionDetails.reportedIssues && (
                <div>
                  <Label className="text-muted-foreground">Reported Issues</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{receptionDetails.reportedIssues}</p>
                </div>
              )}

              {receptionDetails.adminIssues && (
                <div>
                  <Label className="text-muted-foreground">Admin Review Notes</Label>
                  <p className="mt-1 p-3 bg-muted rounded-md text-sm">{receptionDetails.adminIssues}</p>
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
    </div>
  );
}
