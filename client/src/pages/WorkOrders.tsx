import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, FileText, Calendar, User, Clock, DollarSign, X, Package, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Equipment, Garage, Employee, SparePart } from "@shared/schema";

type WorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentId: string;
  priority: string;
  workType: string;
  description: string;
  status: string;
  estimatedHours: string;
  estimatedCost: string;
  scheduledDate: string;
  createdAt: string;
};

export default function WorkOrdersPage() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [workOrderNumber, setWorkOrderNumber] = useState("");
  const [equipmentId, setEquipmentId] = useState("");
  const [garageId, setGarageId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState("medium");
  const [workType, setWorkType] = useState("repair");
  const [description, setDescription] = useState("");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedParts, setSelectedParts] = useState<SparePart[]>([]);
  const [partSearchTerm, setPartSearchTerm] = useState("");
  const [isPartsDialogOpen, setIsPartsDialogOpen] = useState(false);
  const [tempSelectedParts, setTempSelectedParts] = useState<string[]>([]);

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

  // Auto-generate work order number when dialog opens
  useEffect(() => {
    const generateWorkOrderNumber = async () => {
      if (isDialogOpen && !workOrderNumber) {
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
  }, [isDialogOpen]);

  const createWorkOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/work-orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Success",
        description: "Work order created successfully",
      });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create work order",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setWorkOrderNumber("");
    setEquipmentId("");
    setGarageId("");
    setAssignedToId("");
    setPriority("medium");
    setWorkType("repair");
    setDescription("");
    setEstimatedHours("");
    setEstimatedCost("");
    setScheduledDate("");
    setNotes("");
    setSelectedParts([]);
    setPartSearchTerm("");
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

    createWorkOrderMutation.mutate({
      workOrderNumber,
      equipmentId,
      garageId: garageId || undefined,
      assignedToId: assignedToId || undefined,
      priority,
      workType,
      description,
      estimatedHours: estimatedHours || undefined,
      estimatedCost: estimatedCost || undefined,
      scheduledDate: scheduledDate || undefined,
      notes: notes || undefined,
      requiredParts: selectedParts.map(part => ({
        partId: part.id,
        partName: part.partName,
        partNumber: part.partNumber,
        stockStatus: part.stockStatus,
      })),
    });
  };

  const filteredWorkOrders = workOrders?.filter((wo) => {
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
            <Button onClick={() => setIsDialogOpen(true)} data-testid="button-add-work-order">
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

      {/* Add Work Order Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" data-testid="dialog-add-work-order">
          <DialogHeader>
            <DialogTitle>Create New Work Order</DialogTitle>
            <DialogDescription>
              Fill in the details to create a new work order for equipment service
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

              {/* Garage */}
              <div className="space-y-2">
                <Label htmlFor="garage">Garage/Workshop</Label>
                <Select value={garageId} onValueChange={setGarageId}>
                  <SelectTrigger data-testid="select-garage">
                    <SelectValue placeholder="Select garage (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {garages?.map((garage) => (
                      <SelectItem key={garage.id} value={garage.id}>
                        {garage.name} - {garage.location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select value={assignedToId} onValueChange={setAssignedToId}>
                  <SelectTrigger data-testid="select-assigned-to">
                    <SelectValue placeholder="Select employee (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees?.filter(emp => emp.isActive)?.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.fullName} - {emp.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Scheduled Date */}
              <div className="space-y-2">
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  data-testid="input-scheduled-date"
                />
              </div>

              {/* Estimated Hours */}
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Estimated Hours</Label>
                <Input
                  id="estimatedHours"
                  type="number"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(e.target.value)}
                  placeholder="e.g., 4.5"
                  data-testid="input-estimated-hours"
                />
              </div>

              {/* Estimated Cost */}
              <div className="space-y-2">
                <Label htmlFor="estimatedCost">Estimated Cost (USD)</Label>
                <Input
                  id="estimatedCost"
                  type="number"
                  step="0.01"
                  value={estimatedCost}
                  onChange={(e) => setEstimatedCost(e.target.value)}
                  placeholder="e.g., 1500.00"
                  data-testid="input-estimated-cost"
                />
              </div>
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

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information..."
                rows={2}
                data-testid="textarea-notes"
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
                {createWorkOrderMutation.isPending ? "Creating..." : "Create Work Order"}
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
    </div>
  );
}
