import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
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
import { DollarSign, Plus, Trash2, User, Droplet, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

type WorkOrderCostDialogProps = {
  workOrderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderElapsedHours?: number;
  isCompleted?: boolean;
};

type LaborEntry = {
  id: string;
  employeeName: string;
  hoursWorked: number;
  hourlyRate: number;
  totalCost: number;
  description?: string;
  workDate: string;
};

type LubricantEntry = {
  id: string;
  lubricantType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  description?: string;
  usedDate: string;
};

type OutsourceEntry = {
  id: string;
  vendorName: string;
  serviceDescription: string;
  cost: number;
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

export function WorkOrderCostDialog({ 
  workOrderId, 
  open, 
  onOpenChange,
  workOrderElapsedHours = 0,
  isCompleted = false
}: WorkOrderCostDialogProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("summary");

  // Labor form state
  const [laborEmployeeName, setLaborEmployeeName] = useState("");
  const [laborHours, setLaborHours] = useState("");
  const [laborRate, setLaborRate] = useState("");
  const [laborDescription, setLaborDescription] = useState("");
  const [laborDate, setLaborDate] = useState(new Date().toISOString().split('T')[0]);

  // Lubricant form state
  const [lubricantType, setLubricantType] = useState("");
  const [lubricantQuantity, setLubricantQuantity] = useState("");
  const [lubricantUnitCost, setLubricantUnitCost] = useState("");
  const [lubricantDescription, setLubricantDescription] = useState("");
  const [lubricantDate, setLubricantDate] = useState(new Date().toISOString().split('T')[0]);

  // Outsource form state
  const [outsourceVendor, setOutsourceVendor] = useState("");
  const [outsourceService, setOutsourceService] = useState("");
  const [outsourceCost, setOutsourceCost] = useState("");
  const [outsourceInvoice, setOutsourceInvoice] = useState("");
  const [outsourceDate, setOutsourceDate] = useState(new Date().toISOString().split('T')[0]);

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

  // Add labor entry mutation
  const addLaborMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/labor`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Labor entry added",
        description: "Labor cost has been recorded successfully",
      });
      // Reset form
      setLaborEmployeeName("");
      setLaborHours("");
      setLaborRate("");
      setLaborDescription("");
      setLaborDate(new Date().toISOString().split('T')[0]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add labor entry",
        variant: "destructive",
      });
    },
  });

  // Add lubricant entry mutation
  const addLubricantMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/lubricants`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Lubricant entry added",
        description: "Lubricant cost has been recorded successfully",
      });
      // Reset form
      setLubricantType("");
      setLubricantQuantity("");
      setLubricantUnitCost("");
      setLubricantDescription("");
      setLubricantDate(new Date().toISOString().split('T')[0]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add lubricant entry",
        variant: "destructive",
      });
    },
  });

  // Add outsource entry mutation
  const addOutsourceMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/work-orders/${workOrderId}/outsource`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders", workOrderId, "costs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: "Outsource entry added",
        description: "Outsource cost has been recorded successfully",
      });
      // Reset form
      setOutsourceVendor("");
      setOutsourceService("");
      setOutsourceCost("");
      setOutsourceInvoice("");
      setOutsourceDate(new Date().toISOString().split('T')[0]);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add outsource entry",
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

  const handleAddLabor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!laborEmployeeName || !laborHours || !laborRate) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addLaborMutation.mutate({
      employeeName: laborEmployeeName,
      hoursWorked: parseFloat(laborHours),
      hourlyRate: parseFloat(laborRate),
      description: laborDescription || undefined,
      workDate: laborDate,
    });
  };

  const handleAddLubricant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!lubricantType || !lubricantQuantity || !lubricantUnitCost) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addLubricantMutation.mutate({
      lubricantType,
      quantity: parseFloat(lubricantQuantity),
      unitCost: parseFloat(lubricantUnitCost),
      description: lubricantDescription || undefined,
      usedDate: lubricantDate,
    });
  };

  const handleAddOutsource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!outsourceVendor || !outsourceService || !outsourceCost) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addOutsourceMutation.mutate({
      vendorName: outsourceVendor,
      serviceDescription: outsourceService,
      cost: parseFloat(outsourceCost),
      invoiceNumber: outsourceInvoice || undefined,
      serviceDate: outsourceDate,
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
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
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(costData?.summary.actualLaborCost || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Entries:</span>
                        <Badge variant="secondary">{costData?.laborEntries.length || 0}</Badge>
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
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Actual</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(costData?.summary.actualLubricantCost || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Entries:</span>
                        <Badge variant="secondary">{costData?.lubricantEntries.length || 0}</Badge>
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
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(costData?.summary.actualOutsourceCost || 0)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Entries:</span>
                        <Badge variant="secondary">{costData?.outsourceEntries.length || 0}</Badge>
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
                        <p className="text-3xl font-bold">
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
                        <p className="text-3xl font-bold text-primary">
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
                          }`}>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Labor Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddLabor} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="labor-employee">Employee Name *</Label>
                        <Input
                          id="labor-employee"
                          value={laborEmployeeName}
                          onChange={(e) => setLaborEmployeeName(e.target.value)}
                          placeholder="Enter employee name"
                          data-testid="input-labor-employee"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labor-date">Work Date *</Label>
                        <Input
                          id="labor-date"
                          type="date"
                          value={laborDate}
                          onChange={(e) => setLaborDate(e.target.value)}
                          data-testid="input-labor-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labor-hours">Hours Worked *</Label>
                        <Input
                          id="labor-hours"
                          type="number"
                          step="0.1"
                          min="0"
                          value={laborHours}
                          onChange={(e) => setLaborHours(e.target.value)}
                          placeholder="0.0"
                          data-testid="input-labor-hours"
                        />
                        {workOrderElapsedHours > 0 && (
                          <p className="text-xs text-muted-foreground">
                            Work order elapsed: {workOrderElapsedHours.toFixed(2)} hours
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="labor-rate">Hourly Rate (ETB) *</Label>
                        <Input
                          id="labor-rate"
                          type="number"
                          step="0.01"
                          min="0"
                          value={laborRate}
                          onChange={(e) => setLaborRate(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-labor-rate"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="labor-description">Description</Label>
                        <Textarea
                          id="labor-description"
                          value={laborDescription}
                          onChange={(e) => setLaborDescription(e.target.value)}
                          placeholder="Optional notes about the labor work"
                          data-testid="input-labor-description"
                        />
                      </div>
                    </div>
                    {laborHours && laborRate && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Total Labor Cost:</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(parseFloat(laborHours) * parseFloat(laborRate))}
                        </p>
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addLaborMutation.isPending}
                      data-testid="button-add-labor"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addLaborMutation.isPending ? "Adding..." : "Add Labor Entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

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
                          <TableHead>Date</TableHead>
                          <TableHead>Employee</TableHead>
                          <TableHead>Hours</TableHead>
                          <TableHead>Rate</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.laborEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-labor-${entry.id}`}>
                            <TableCell>{new Date(entry.workDate).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{entry.employeeName}</TableCell>
                            <TableCell>{entry.hoursWorked.toFixed(2)}</TableCell>
                            <TableCell>{formatCurrency(entry.hourlyRate)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLaborMutation.mutate(entry.id)}
                                disabled={deleteLaborMutation.isPending}
                                data-testid={`button-delete-labor-${entry.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Lubricant Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddLubricant} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="lubricant-type">Lubricant Type *</Label>
                        <Select value={lubricantType} onValueChange={setLubricantType}>
                          <SelectTrigger id="lubricant-type" data-testid="select-lubricant-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="engine_oil">Engine Oil</SelectItem>
                            <SelectItem value="hydraulic_oil">Hydraulic Oil</SelectItem>
                            <SelectItem value="transmission_fluid">Transmission Fluid</SelectItem>
                            <SelectItem value="grease">Grease</SelectItem>
                            <SelectItem value="coolant">Coolant</SelectItem>
                            <SelectItem value="brake_fluid">Brake Fluid</SelectItem>
                            <SelectItem value="gear_oil">Gear Oil</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lubricant-date">Date Used *</Label>
                        <Input
                          id="lubricant-date"
                          type="date"
                          value={lubricantDate}
                          onChange={(e) => setLubricantDate(e.target.value)}
                          data-testid="input-lubricant-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lubricant-quantity">Quantity (Liters) *</Label>
                        <Input
                          id="lubricant-quantity"
                          type="number"
                          step="0.1"
                          min="0"
                          value={lubricantQuantity}
                          onChange={(e) => setLubricantQuantity(e.target.value)}
                          placeholder="0.0"
                          data-testid="input-lubricant-quantity"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lubricant-cost">Unit Cost (ETB) *</Label>
                        <Input
                          id="lubricant-cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={lubricantUnitCost}
                          onChange={(e) => setLubricantUnitCost(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-lubricant-cost"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="lubricant-description">Description</Label>
                        <Textarea
                          id="lubricant-description"
                          value={lubricantDescription}
                          onChange={(e) => setLubricantDescription(e.target.value)}
                          placeholder="Optional notes about the lubricant"
                          data-testid="input-lubricant-description"
                        />
                      </div>
                    </div>
                    {lubricantQuantity && lubricantUnitCost && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Total Lubricant Cost:</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(parseFloat(lubricantQuantity) * parseFloat(lubricantUnitCost))}
                        </p>
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addLubricantMutation.isPending}
                      data-testid="button-add-lubricant"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addLubricantMutation.isPending ? "Adding..." : "Add Lubricant Entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Lubricant Entries Table */}
              {costData && costData.lubricantEntries.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lubricant Entries</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Cost</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.lubricantEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-lubricant-${entry.id}`}>
                            <TableCell>{new Date(entry.usedDate).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">
                              <Badge variant="outline">{entry.lubricantType.replace(/_/g, ' ')}</Badge>
                            </TableCell>
                            <TableCell>{entry.quantity.toFixed(2)} L</TableCell>
                            <TableCell>{formatCurrency(entry.unitCost)}</TableCell>
                            <TableCell className="font-bold">{formatCurrency(entry.totalCost)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {entry.description || "-"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteLubricantMutation.mutate(entry.id)}
                                disabled={deleteLubricantMutation.isPending}
                                data-testid={`button-delete-lubricant-${entry.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Outsource Entry</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddOutsource} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="outsource-vendor">Vendor Name *</Label>
                        <Input
                          id="outsource-vendor"
                          value={outsourceVendor}
                          onChange={(e) => setOutsourceVendor(e.target.value)}
                          placeholder="Enter vendor name"
                          data-testid="input-outsource-vendor"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="outsource-date">Service Date *</Label>
                        <Input
                          id="outsource-date"
                          type="date"
                          value={outsourceDate}
                          onChange={(e) => setOutsourceDate(e.target.value)}
                          data-testid="input-outsource-date"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="outsource-cost">Cost (ETB) *</Label>
                        <Input
                          id="outsource-cost"
                          type="number"
                          step="0.01"
                          min="0"
                          value={outsourceCost}
                          onChange={(e) => setOutsourceCost(e.target.value)}
                          placeholder="0.00"
                          data-testid="input-outsource-cost"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="outsource-invoice">Invoice Number</Label>
                        <Input
                          id="outsource-invoice"
                          value={outsourceInvoice}
                          onChange={(e) => setOutsourceInvoice(e.target.value)}
                          placeholder="Optional invoice number"
                          data-testid="input-outsource-invoice"
                        />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="outsource-service">Service Description *</Label>
                        <Textarea
                          id="outsource-service"
                          value={outsourceService}
                          onChange={(e) => setOutsourceService(e.target.value)}
                          placeholder="Describe the outsourced service"
                          data-testid="input-outsource-service"
                        />
                      </div>
                    </div>
                    {outsourceCost && (
                      <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                        <p className="text-sm text-muted-foreground">Outsource Cost:</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(parseFloat(outsourceCost))}
                        </p>
                      </div>
                    )}
                    <Button 
                      type="submit" 
                      className="w-full"
                      disabled={addOutsourceMutation.isPending}
                      data-testid="button-add-outsource"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {addOutsourceMutation.isPending ? "Adding..." : "Add Outsource Entry"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

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
                          <TableHead>Date</TableHead>
                          <TableHead>Vendor</TableHead>
                          <TableHead>Service</TableHead>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Cost</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {costData.outsourceEntries.map((entry) => (
                          <TableRow key={entry.id} data-testid={`row-outsource-${entry.id}`}>
                            <TableCell>{new Date(entry.serviceDate).toLocaleDateString()}</TableCell>
                            <TableCell className="font-medium">{entry.vendorName}</TableCell>
                            <TableCell className="max-w-xs truncate" title={entry.serviceDescription}>
                              {entry.serviceDescription}
                            </TableCell>
                            <TableCell>
                              {entry.invoiceNumber ? (
                                <Badge variant="outline">{entry.invoiceNumber}</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="font-bold">{formatCurrency(entry.cost)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteOutsourceMutation.mutate(entry.id)}
                                disabled={deleteOutsourceMutation.isPending}
                                data-testid={`button-delete-outsource-${entry.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
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
