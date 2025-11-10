import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DollarSign, Plus, Trash2, Edit, User, Droplet, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Employee } from "@shared/schema";

type WorkOrderCostDialogProps = {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderElapsedHours?: number;
  isCompleted?: boolean;
  readOnly?: boolean; // If true, disable all editing functions
  userRole?: "foreman" | "team"; // foreman = planned entries, team = actual entries
};

type LaborEntry = {
  id: string;
  employeeId: string;
  employeeName?: string;
  hoursWorked: number;
  hourlyRateSnapshot: number;
  overtimeFactor: number;
  totalCost: number;
  description?: string;
  workDate: string;
};

type LubricantEntry = {
  id: string;
  entryType: "planned" | "actual";
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  unitCostSnapshot: number;
  totalCost: number;
  description?: string;
  usedDate: string;
};

type OutsourceEntry = {
  id: string;
  vendorName: string;
  serviceDescription: string;
  plannedCost?: number;
  actualCost: number;
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

type CostData = {
  laborEntries: LaborEntry[];
  lubricantEntries: LubricantEntry[];
  outsourceEntries: OutsourceEntry[];
  summary: CostSummary;
};

// Client-side form schemas extending insert schemas
const laborFormSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  minutesWorked: z.coerce.number().min(1, "Minutes must be at least 1"),
  hourlyRateSnapshot: z.coerce.number().min(0, "Hourly rate must be positive"),
  overtimeFactor: z.coerce.number().min(1, "Overtime factor must be at least 1.0").default(1.0),
  description: z.string().optional(),
  workDate: z.string().min(1, "Work date is required"),
});

const lubricantFormSchema = z.object({
  entryType: z.enum(["planned", "actual"]).default("actual"),
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.coerce.number().min(0.1, "Quantity must be at least 0.1"),
  unit: z.string().min(1, "Unit is required"),
  unitCostSnapshot: z.coerce.number().min(0, "Unit cost must be positive"),
  description: z.string().optional(),
  usedDate: z.string().min(1, "Used date is required"),
});

const outsourceFormSchema = z.object({
  vendorName: z.string().min(1, "Vendor name is required"),
  serviceDescription: z.string().min(1, "Service description is required"),
  plannedCost: z.coerce.number().min(0, "Planned cost must be positive").optional(),
  actualCost: z.coerce.number().min(0, "Actual cost must be positive"),
  invoiceNumber: z.string().optional(),
  serviceDate: z.string().min(1, "Service date is required"),
});

type LaborFormValues = z.infer<typeof laborFormSchema>;
type LubricantFormValues = z.infer<typeof lubricantFormSchema>;
type OutsourceFormValues = z.infer<typeof outsourceFormSchema>;

export function WorkOrderCostDialog({ 
  workOrderId, 
  open, 
  onOpenChange,
  workOrderElapsedHours = 0,
  isCompleted = false,
  readOnly = false,
  userRole = "team" // Default to team member
}: WorkOrderCostDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");
  const [editingLaborEntry, setEditingLaborEntry] = useState<LaborEntry | null>(null);
  
  // Determine entry type based on user role
  const lubricantEntryType: "planned" | "actual" = userRole === "foreman" ? "planned" : "actual";

  // Reset minutes when dialog opens with work order elapsed hours (including 0 to avoid stale values)
  useEffect(() => {
    if (open) {
      // Convert hours to minutes for the form
      laborForm.setValue("minutesWorked", Math.round(workOrderElapsedHours * 60));
    }
  }, [open, workOrderElapsedHours]);

  // Fetch employees for labor entry
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
    enabled: open,
  });

  // Fetch cost data
  const { data: costData, isLoading } = useQuery<CostData>({
    queryKey: ["/api/work-orders", workOrderId, "costs"],
    queryFn: async () => {
      if (!workOrderId) throw new Error("No work order ID");
      const response = await apiRequest("GET", `/api/work-orders/${workOrderId}/costs`);
      return response.json();
    },
    enabled: !!workOrderId && open,
  });

  // Labor form
  const laborForm = useForm<LaborFormValues>({
    resolver: zodResolver(laborFormSchema),
    defaultValues: {
      employeeId: "",
      minutesWorked: Math.round((workOrderElapsedHours || 0) * 60), // Auto-fill from work order timer (convert hours to minutes)
      hourlyRateSnapshot: 0,
      overtimeFactor: 1.0,
      description: "",
      workDate: new Date().toISOString().split('T')[0],
    },
  });

  // Watch form values for live cost calculation
  const watchedMinutes = useWatch({ control: laborForm.control, name: "minutesWorked", defaultValue: 0 });
  const watchedRate = useWatch({ control: laborForm.control, name: "hourlyRateSnapshot", defaultValue: 0 });
  const watchedOvertimeFactor = useWatch({ control: laborForm.control, name: "overtimeFactor", defaultValue: 1.0 });
  
  // Calculate live cost - ALWAYS use current form values (minutes / 60) * hourlyRate * overtimeFactor
  // This ensures the preview updates in real-time as the user edits the form
  const liveLaborCost = ((Number(watchedMinutes) || 0) / 60) * (Number(watchedRate) || 0) * (Number(watchedOvertimeFactor) || 1.0);
  
  // Values for display in calculation preview - always use current form values
  const displayMinutes = Number(watchedMinutes) || 0;
  const displayRate = Number(watchedRate) || 0;
  const displayOvertimeFactor = Number(watchedOvertimeFactor) || 1.0;

  // Lubricant form
  const lubricantForm = useForm<LubricantFormValues>({
    resolver: zodResolver(lubricantFormSchema),
    defaultValues: {
      entryType: lubricantEntryType,
      itemName: "",
      category: "lubricant",
      quantity: 0,
      unit: "liter",
      unitCostSnapshot: 0,
      description: "",
      usedDate: new Date().toISOString().split('T')[0],
    },
  });

  // Outsource form
  const outsourceForm = useForm<OutsourceFormValues>({
    resolver: zodResolver(outsourceFormSchema),
    defaultValues: {
      vendorName: "",
      serviceDescription: "",
      plannedCost: undefined,
      actualCost: 0,
      invoiceNumber: "",
      serviceDate: new Date().toISOString().split('T')[0],
    },
  });

  // Add labor entry mutation
  const addLaborMutation = useMutation({
    mutationFn: async (data: LaborFormValues) => {
      // Convert minutes to hours for storage
      const hoursWorked = data.minutesWorked / 60;
      // Calculate total cost using per-minute formula
      const totalCost = hoursWorked * data.hourlyRateSnapshot * data.overtimeFactor;
      const payload = {
        employeeId: data.employeeId,
        hoursWorked: hoursWorked.toFixed(2), // Store as decimal hours (2 decimal places)
        hourlyRateSnapshot: data.hourlyRateSnapshot,
        overtimeFactor: data.overtimeFactor,
        totalCost,
        description: data.description || undefined,
        workDate: data.workDate,
      };
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/labor`, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add labor entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Labor entry added",
        description: "Labor cost has been recorded successfully",
      });
      laborForm.reset();
      setEditingLaborEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add labor entry",
        variant: "destructive",
      });
    },
  });

  // Update labor entry mutation (only overtime factor and description are editable)
  const updateLaborMutation = useMutation({
    mutationFn: async (data: LaborFormValues & { entryId: string }) => {
      // Only send overtimeFactor and description (backend will recalculate totalCost)
      const payload = {
        overtimeFactor: data.overtimeFactor,
        description: data.description || undefined,
      };
      const response = await apiRequest("PATCH", `/api/work-orders/${workOrderId}/labor/${data.entryId}`, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update labor entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Labor entry updated",
        description: "Labor cost has been updated successfully",
      });
      laborForm.reset();
      setEditingLaborEntry(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update labor entry",
        variant: "destructive",
      });
    },
  });

  // Add lubricant entry mutation
  const addLubricantMutation = useMutation({
    mutationFn: async (data: LubricantFormValues) => {
      const totalCost = data.quantity * data.unitCostSnapshot;
      const payload = {
        entryType: data.entryType, // Include entry type (planned or actual)
        itemName: data.itemName,
        category: data.category,
        quantity: data.quantity,
        unit: data.unit,
        unitCostSnapshot: data.unitCostSnapshot,
        totalCost,
        description: data.description || undefined,
        usedDate: data.usedDate,
      };
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/lubricants`, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add lubricant entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      const entryTypeLabel = lubricantEntryType === "planned" ? "Planned" : "Actual";
      toast({
        title: `${entryTypeLabel} lubricant entry added`,
        description: "Lubricant cost has been recorded successfully",
      });
      // Reset form and restore entryType
      lubricantForm.reset({ entryType: lubricantEntryType });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add lubricant entry",
        variant: "destructive",
      });
    },
  });

  // Add outsource entry mutation
  const addOutsourceMutation = useMutation({
    mutationFn: async (data: OutsourceFormValues) => {
      const payload = {
        vendorName: data.vendorName,
        serviceDescription: data.serviceDescription,
        plannedCost: typeof data.plannedCost === 'number' && !Number.isNaN(data.plannedCost) ? data.plannedCost : undefined,
        actualCost: data.actualCost,
        invoiceNumber: data.invoiceNumber || undefined,
        serviceDate: data.serviceDate,
      };
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/outsource`, payload);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add outsource entry");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Outsource entry added",
        description: "Outsource cost has been recorded successfully",
      });
      outsourceForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add outsource entry",
        variant: "destructive",
      });
    },
  });

  // Delete mutations
  const deleteLaborMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/work-orders/${workOrderId}/labor/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Labor entry deleted",
        description: "Labor cost entry has been removed",
      });
    },
  });

  const deleteLubricantMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/work-orders/${workOrderId}/lubricants/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Lubricant entry deleted",
        description: "Lubricant cost entry has been removed",
      });
    },
  });

  const deleteOutsourceMutation = useMutation({
    mutationFn: async (entryId: string) => {
      await apiRequest("DELETE", `/api/work-orders/${workOrderId}/outsource/${entryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Outsource entry deleted",
        description: "Outsource cost entry has been removed",
      });
    },
  });

  // Update hourly rate when employee changes
  const handleEmployeeChange = (employeeId: string) => {
    const selectedEmployee = employees.find(e => e.id === employeeId);
    if (selectedEmployee && selectedEmployee.hourlyRate) {
      laborForm.setValue("hourlyRateSnapshot", parseFloat(selectedEmployee.hourlyRate));
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatWorkTime = (hours: number) => {
    if (hours < 1 && hours > 0) {
      const minutes = Math.round(hours * 60);
      return `${minutes}m`;
    }
    return `${hours.toFixed(2)} hours`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto" data-testid="dialog-work-order-costs">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <DollarSign className="h-6 w-6" />
            Work Order Cost Tracking
          </DialogTitle>
          <DialogDescription>
            Track labor, lubricants, and outsource costs for this work order
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading cost data...</div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="summary" data-testid="tab-cost-summary">
                Summary
              </TabsTrigger>
              <TabsTrigger value="labor" data-testid="tab-labor">
                <User className="h-4 w-4 mr-2" />
                Labor
              </TabsTrigger>
              <TabsTrigger value="lubricants" data-testid="tab-lubricants">
                <Droplet className="h-4 w-4 mr-2" />
                Lubricants
              </TabsTrigger>
              <TabsTrigger value="outsource" data-testid="tab-outsource">
                <Briefcase className="h-4 w-4 mr-2" />
                Outsource
              </TabsTrigger>
            </TabsList>

            {/* Summary Tab */}
            <TabsContent value="summary" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Labor Cost Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Labor Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-2xl font-bold text-primary" data-testid="text-labor-cost">
                          {formatCurrency(costData?.summary.actualLaborCost || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Entries:</span>
                        <Badge variant="secondary" data-testid="badge-labor-entries">{costData?.laborEntries.length || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Lubricant Cost Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Droplet className="h-4 w-4" />
                      Lubricant Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-blue-500" />
                          Planned (Foreman)
                        </p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-planned-lubricant-cost">
                          {formatCurrency(costData?.summary.plannedLubricantCost || 0)}
                        </p>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Entries:</span>
                          <Badge variant="secondary" data-testid="badge-planned-lubricant-entries">
                            {costData?.lubricantEntries.filter(e => e.entryType === "planned").length || 0}
                          </Badge>
                        </div>
                      </div>
                      <Separator />
                      <div>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-500" />
                          Actual (Team)
                        </p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-actual-lubricant-cost">
                          {formatCurrency(costData?.summary.actualLubricantCost || 0)}
                        </p>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-muted-foreground">Entries:</span>
                          <Badge variant="secondary" data-testid="badge-actual-lubricant-entries">
                            {costData?.lubricantEntries.filter(e => e.entryType === "actual").length || 0}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Outsource Cost Card */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Outsource Costs
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-2xl font-bold text-primary" data-testid="text-outsource-cost">
                          {formatCurrency(costData?.summary.actualOutsourceCost || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Entries:</span>
                        <Badge variant="secondary" data-testid="badge-outsource-entries">{costData?.outsourceEntries.length || 0}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              {/* Total Cost Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Total Cost Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Planned Total</p>
                        <p className="text-3xl font-bold" data-testid="text-planned-total">
                          {formatCurrency(costData?.summary.totalPlannedCost || 0)}
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor:</span>
                          <span>{formatCurrency(costData?.summary.plannedLaborCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lubricants:</span>
                          <span>{formatCurrency(costData?.summary.plannedLubricantCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outsource:</span>
                          <span>{formatCurrency(costData?.summary.plannedOutsourceCost || 0)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Actual Total</p>
                        <p className="text-3xl font-bold text-primary" data-testid="text-actual-total">
                          {formatCurrency(costData?.summary.totalActualCost || 0)}
                        </p>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Labor:</span>
                          <span>{formatCurrency(costData?.summary.actualLaborCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Lubricants:</span>
                          <span>{formatCurrency(costData?.summary.actualLubricantCost || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Outsource:</span>
                          <span>{formatCurrency(costData?.summary.actualOutsourceCost || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Cost Variance */}
                  {costData?.summary.totalPlannedCost !== undefined && costData.summary.totalPlannedCost > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Cost Variance:</span>
                        <div className="flex items-center gap-2">
                          {costData.summary.costVariance > 0 ? (
                            <TrendingUp className="h-5 w-5 text-destructive" />
                          ) : costData.summary.costVariance < 0 ? (
                            <TrendingDown className="h-5 w-5 text-green-600" />
                          ) : null}
                          <span className={`text-lg font-bold ${
                            costData.summary.costVariance > 0 ? 'text-destructive' :
                            costData.summary.costVariance < 0 ? 'text-green-600' : ''
                          }`} data-testid="text-cost-variance">
                            {formatCurrency(Math.abs(costData.summary.costVariance || 0))}
                            {costData.summary.costVariance > 0 ? ' over' : costData.summary.costVariance < 0 ? ' under' : ''}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Labor Tab */}
            <TabsContent value="labor" className="space-y-4">
              {!readOnly && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {editingLaborEntry ? "Edit Labor Entry" : "Add Labor Entry"}
                    </CardTitle>
                    {editingLaborEntry && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Only Overtime Factor and Description can be edited
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    <Form {...laborForm}>
                    <form onSubmit={laborForm.handleSubmit((data) => {
                      if (editingLaborEntry) {
                        updateLaborMutation.mutate({ ...data, entryId: editingLaborEntry.id });
                      } else {
                        addLaborMutation.mutate(data);
                      }
                    })} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={laborForm.control}
                          name="employeeId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Employee *</FormLabel>
                              <Select 
                                value={field.value} 
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleEmployeeChange(value);
                                }}
                                disabled={!!editingLaborEntry}
                              >
                                <FormControl>
                                  <SelectTrigger data-testid="select-labor-employee">
                                    <SelectValue placeholder="Select employee" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {employees.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                      {emp.fullName}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={laborForm.control}
                          name="workDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Work Date *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="date" 
                                  {...field} 
                                  disabled={!!editingLaborEntry}
                                  data-testid="input-labor-date" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={laborForm.control}
                          name="minutesWorked"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Minutes Worked *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="1" 
                                  min="1" 
                                  placeholder="30" 
                                  {...field} 
                                  disabled={!!editingLaborEntry}
                                  data-testid="input-labor-minutes"
                                />
                              </FormControl>
                              {workOrderElapsedHours > 0 && (
                                <p className="text-xs text-muted-foreground">
                                  Work order elapsed: {formatWorkTime(workOrderElapsedHours)} ({Math.round(workOrderElapsedHours * 60)} minutes)
                                </p>
                              )}
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={laborForm.control}
                          name="hourlyRateSnapshot"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hourly Rate (ETB) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  placeholder="0.00" 
                                  {...field} 
                                  disabled={!!editingLaborEntry}
                                  data-testid="input-labor-rate"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={laborForm.control}
                          name="overtimeFactor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Overtime Factor</FormLabel>
                              <Select value={field.value?.toString()} onValueChange={(value) => field.onChange(parseFloat(value))}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-overtime-factor">
                                    <SelectValue placeholder="Select factor" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="1.0">Regular (1.0x)</SelectItem>
                                  <SelectItem value="1.5">Time-and-Half (1.5x)</SelectItem>
                                  <SelectItem value="2.0">Double-Time (2.0x)</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={laborForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Optional notes about the labor work" 
                                  {...field} 
                                  data-testid="textarea-labor-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Live Cost Preview */}
                      <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Calculated Labor Cost</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {displayMinutes} min × {displayRate ? (displayRate / 60).toFixed(2) : '0.00'} ETB/min × {displayOvertimeFactor}x
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ({(displayMinutes / 60).toFixed(2)} hrs × {displayRate} ETB/hr)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatCurrency(liveLaborCost)}
                            </p>
                            <p className="text-xs text-muted-foreground">ETB</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2">
                        {editingLaborEntry && (
                          <Button 
                            type="button"
                            variant="outline"
                            onClick={() => {
                              laborForm.reset();
                              setEditingLaborEntry(null);
                            }}
                            data-testid="button-cancel-labor-edit"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button 
                          type="submit" 
                          disabled={editingLaborEntry ? updateLaborMutation.isPending : addLaborMutation.isPending}
                          data-testid={editingLaborEntry ? "button-update-labor" : "button-add-labor"}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {editingLaborEntry 
                            ? (updateLaborMutation.isPending ? "Updating..." : "Update Labor Entry")
                            : (addLaborMutation.isPending ? "Adding..." : "Add Labor Entry")
                          }
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              )}

              {/* Labor Entries Table */}
              {costData && costData.laborEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Labor Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Minutes</TableHead>
                          <TableHead>Rate (ETB/hr)</TableHead>
                          <TableHead>Overtime</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.laborEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-labor-${entry.id}`}>
                            <TableCell>{entry.employeeName || "Unknown"}</TableCell>
                            <TableCell>{formatDate(entry.workDate)}</TableCell>
                            <TableCell>{Math.round(entry.hoursWorked * 60)} min</TableCell>
                            <TableCell>{formatCurrency(entry.hourlyRateSnapshot)}</TableCell>
                            <TableCell>{entry.overtimeFactor}x</TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell>
                              {!readOnly && (
                                <div className="flex gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      setEditingLaborEntry(entry);
                                      // Parse numeric values properly from database
                                      const hours = typeof entry.hoursWorked === 'number' 
                                        ? entry.hoursWorked 
                                        : parseFloat(entry.hoursWorked as any) || 0;
                                      const minutes = Math.round(hours * 60); // Convert hours to minutes for the form
                                      const rate = typeof entry.hourlyRateSnapshot === 'number'
                                        ? entry.hourlyRateSnapshot
                                        : parseFloat(entry.hourlyRateSnapshot as any) || 0;
                                      
                                      laborForm.reset({
                                        employeeId: entry.employeeId,
                                        minutesWorked: minutes,
                                        hourlyRateSnapshot: rate,
                                        overtimeFactor: entry.overtimeFactor,
                                        description: entry.description || "",
                                        workDate: new Date(entry.workDate).toISOString().split('T')[0],
                                      });
                                      // Scroll to form
                                      window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    data-testid={`button-edit-labor-${entry.id}`}
                                  >
                                    <Edit className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => deleteLaborMutation.mutate(entry.id)}
                                    disabled={deleteLaborMutation.isPending}
                                    data-testid={`button-delete-labor-${entry.id}`}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Lubricants Tab */}
            <TabsContent value="lubricants" className="space-y-4">
              {!readOnly && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Planned Lubricant Entry</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Record planned lubricants for this work order
                    </p>
                  </CardHeader>
                  <CardContent>
                    <Form {...lubricantForm}>
                    <form onSubmit={lubricantForm.handleSubmit((data) => addLubricantMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={lubricantForm.control}
                          name="itemName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Item Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 15W-40 Engine Oil" {...field} data-testid="input-lubricant-name" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="category"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Category *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-lubricant-category">
                                    <SelectValue placeholder="Select category" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="lubricant">Lubricant</SelectItem>
                                  <SelectItem value="oil">Oil</SelectItem>
                                  <SelectItem value="grease">Grease</SelectItem>
                                  <SelectItem value="filter">Filter</SelectItem>
                                  <SelectItem value="material">Material</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Quantity *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.1" 
                                  min="0" 
                                  placeholder="0.0" 
                                  {...field} 
                                  data-testid="input-lubricant-quantity"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="unit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit *</FormLabel>
                              <Select value={field.value} onValueChange={field.onChange}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-lubricant-unit">
                                    <SelectValue placeholder="Select unit" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="liter">Liter</SelectItem>
                                  <SelectItem value="gallon">Gallon</SelectItem>
                                  <SelectItem value="kg">Kilogram</SelectItem>
                                  <SelectItem value="piece">Piece</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="unitCostSnapshot"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Unit Cost (ETB) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  placeholder="0.00" 
                                  {...field} 
                                  data-testid="input-lubricant-cost"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="usedDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Date Used *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-lubricant-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={lubricantForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Optional notes about the lubricant" 
                                  {...field} 
                                  data-testid="textarea-lubricant-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addLubricantMutation.isPending}
                          data-testid="button-add-lubricant"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addLubricantMutation.isPending ? "Adding..." : "Add Lubricant Entry"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              )}

              {/* Planned Lubricant Entries (Foreman) */}
              {costData && costData.lubricantEntries.filter(e => e.entryType === "planned").length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingDown className="h-5 w-5 text-blue-500" />
                      Planned Lubricant Entries (Foreman)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.lubricantEntries.filter(e => e.entryType === "planned").map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-lubricant-planned-${entry.id}`}>
                            <TableCell>{entry.itemName}</TableCell>
                            <TableCell className="capitalize">{entry.category}</TableCell>
                            <TableCell>{formatDate(entry.usedDate)}</TableCell>
                            <TableCell>
                              {entry.quantity.toFixed(2)} {entry.unit}
                            </TableCell>
                            <TableCell>{formatCurrency(entry.unitCostSnapshot)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell>
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLubricantMutation.mutate(entry.id)}
                                  disabled={deleteLubricantMutation.isPending}
                                  data-testid={`button-delete-lubricant-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Actual Lubricant Entries (Team Members) */}
              {costData && costData.lubricantEntries.filter(e => e.entryType === "actual").length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-500" />
                      Actual Lubricant Entries (Team Members)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item Name</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total Cost</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.lubricantEntries.filter(e => e.entryType === "actual").map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-lubricant-actual-${entry.id}`}>
                            <TableCell>{entry.itemName}</TableCell>
                            <TableCell className="capitalize">{entry.category}</TableCell>
                            <TableCell>{formatDate(entry.usedDate)}</TableCell>
                            <TableCell>
                              {entry.quantity.toFixed(2)} {entry.unit}
                            </TableCell>
                            <TableCell>{formatCurrency(entry.unitCostSnapshot)}</TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell>
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteLubricantMutation.mutate(entry.id)}
                                  disabled={deleteLubricantMutation.isPending}
                                  data-testid={`button-delete-lubricant-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Outsource Tab */}
            <TabsContent value="outsource" className="space-y-4">
              {!readOnly && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Add Outsource Entry</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...outsourceForm}>
                    <form onSubmit={outsourceForm.handleSubmit((data) => addOutsourceMutation.mutate(data))} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={outsourceForm.control}
                          name="vendorName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vendor Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter vendor name" {...field} data-testid="input-outsource-vendor" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outsourceForm.control}
                          name="serviceDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Service Date *</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} data-testid="input-outsource-date" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outsourceForm.control}
                          name="plannedCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Planned Cost (ETB)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  placeholder="0.00 (optional)" 
                                  {...field}
                                  value={field.value || ""}
                                  data-testid="input-outsource-planned-cost"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outsourceForm.control}
                          name="actualCost"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Actual Cost (ETB) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01" 
                                  min="0" 
                                  placeholder="0.00" 
                                  {...field} 
                                  data-testid="input-outsource-cost"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outsourceForm.control}
                          name="invoiceNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Invoice Number</FormLabel>
                              <FormControl>
                                <Input placeholder="Optional invoice number" {...field} data-testid="input-outsource-invoice" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={outsourceForm.control}
                          name="serviceDescription"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Service Description *</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Describe the outsourced service" 
                                  {...field} 
                                  data-testid="textarea-outsource-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="flex justify-end">
                        <Button 
                          type="submit" 
                          disabled={addOutsourceMutation.isPending}
                          data-testid="button-add-outsource"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          {addOutsourceMutation.isPending ? "Adding..." : "Add Outsource Entry"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
              )}

              {/* Outsource Entries Table */}
              {costData && costData.outsourceEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Outsource Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Planned Cost</TableHead>
                          <TableHead>Actual Cost</TableHead>
                          <TableHead>Invoice</TableHead>
                          <TableHead className="w-[80px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.outsourceEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-outsource-${entry.id}`}>
                            <TableCell>{entry.vendorName}</TableCell>
                            <TableCell className="max-w-xs truncate">{entry.serviceDescription}</TableCell>
                            <TableCell>{formatDate(entry.serviceDate)}</TableCell>
                            <TableCell>
                              {entry.plannedCost ? formatCurrency(entry.plannedCost) : "-"}
                            </TableCell>
                            <TableCell className="font-medium">{formatCurrency(entry.actualCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.invoiceNumber || "-"}
                            </TableCell>
                            <TableCell>
                              {!readOnly && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteOutsourceMutation.mutate(entry.id)}
                                  disabled={deleteOutsourceMutation.isPending}
                                  data-testid={`button-delete-outsource-${entry.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
