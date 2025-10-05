import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Calendar, Wrench, Clock, DollarSign, User, Package } from "lucide-react";
import { format } from "date-fns";
import type { 
  Equipment, 
  MaintenanceRecordWithDetails, 
  OperatingBehaviorReport,
  PartsUsageHistory,
  SparePart,
  Mechanic
} from "@shared/schema";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertMaintenanceRecordSchema, insertOperatingBehaviorReportSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function MaintenancePage() {
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [showAddMaintenanceDialog, setShowAddMaintenanceDialog] = useState(false);
  const [showAddReportDialog, setShowAddReportDialog] = useState(false);
  const { toast } = useToast();

  const { data: equipment, isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: maintenanceRecords, isLoading: recordsLoading } = useQuery<MaintenanceRecordWithDetails[]>({
    queryKey: ["/api/equipment", selectedEquipmentId, "maintenance"],
    enabled: !!selectedEquipmentId,
  });

  const { data: operatingReports, isLoading: reportsLoading } = useQuery<OperatingBehaviorReport[]>({
    queryKey: ["/api/equipment", selectedEquipmentId, "operating-reports"],
    enabled: !!selectedEquipmentId,
  });

  const { data: partsUsage, isLoading: partsLoading } = useQuery<(PartsUsageHistory & { part?: SparePart })[]>({
    queryKey: ["/api/equipment", selectedEquipmentId, "parts-usage"],
    enabled: !!selectedEquipmentId,
  });

  const selectedEquipment = equipment?.find((e) => e.id === selectedEquipmentId);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-6 border-b bg-background">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-page-title">Maintenance History</h1>
          <p className="text-sm text-muted-foreground">
            Track maintenance records, parts usage, and operating behavior
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

              <Tabs defaultValue="maintenance" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance Records</TabsTrigger>
                  <TabsTrigger value="parts" data-testid="tab-parts">Parts Usage</TabsTrigger>
                  <TabsTrigger value="reports" data-testid="tab-reports">Operating Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="maintenance" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Maintenance Records</h3>
                    <Button onClick={() => setShowAddMaintenanceDialog(true)} data-testid="button-add-maintenance">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Record
                    </Button>
                  </div>

                  {recordsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-32 w-full" />
                      <Skeleton className="h-32 w-full" />
                    </div>
                  ) : maintenanceRecords?.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        No maintenance records found
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {maintenanceRecords?.map((record) => (
                        <Card key={record.id} data-testid={`card-maintenance-${record.id}`}>
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <CardTitle className="text-base">{record.description}</CardTitle>
                                <CardDescription>
                                  <div className="flex items-center gap-4 mt-2">
                                    <span className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {format(new Date(record.maintenanceDate), "MMM dd, yyyy")}
                                    </span>
                                    {record.mechanic && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {record.mechanic.fullName}
                                      </span>
                                    )}
                                  </div>
                                </CardDescription>
                              </div>
                              <Badge variant={record.status === "completed" ? "default" : "secondary"}>
                                {record.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Type</div>
                                <div className="font-medium">{record.maintenanceType}</div>
                              </div>
                              {record.operatingHours && (
                                <div>
                                  <div className="text-muted-foreground">Operating Hours</div>
                                  <div className="font-medium">{record.operatingHours}h</div>
                                </div>
                              )}
                              {record.laborHours && (
                                <div>
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Labor Hours
                                  </div>
                                  <div className="font-medium">{record.laborHours}h</div>
                                </div>
                              )}
                              {record.cost && (
                                <div>
                                  <div className="text-muted-foreground flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    Cost
                                  </div>
                                  <div className="font-medium">${Number(record.cost).toLocaleString()}</div>
                                </div>
                              )}
                            </div>
                            {record.partsUsed && record.partsUsed.length > 0 && (
                              <div className="mt-4">
                                <div className="text-sm font-medium mb-2 flex items-center gap-1">
                                  <Package className="h-3 w-3" />
                                  Parts Used
                                </div>
                                <div className="space-y-1">
                                  {record.partsUsed.map((usage, idx) => (
                                    <div key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                                      <Badge variant="outline">{usage.quantity}x</Badge>
                                      {usage.part?.partName || "Unknown Part"}
                                      {usage.unitCost && (
                                        <span className="text-xs">
                                          @ ${Number(usage.unitCost).toFixed(2)}
                                        </span>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {record.notes && (
                              <div className="mt-4 pt-4 border-t">
                                <div className="text-sm font-medium mb-1">Notes</div>
                                <div className="text-sm text-muted-foreground">{record.notes}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="parts" className="space-y-4 mt-4">
                  <h3 className="text-lg font-semibold">Parts Usage History</h3>
                  {partsLoading ? (
                    <Skeleton className="h-64 w-full" />
                  ) : partsUsage?.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        No parts usage recorded
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="grid gap-3">
                      {partsUsage?.map((usage) => (
                        <Card key={usage.id} data-testid={`card-part-usage-${usage.id}`}>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Badge>{usage.quantity}x</Badge>
                                <div>
                                  <div className="font-medium">{usage.part?.partName || "Unknown Part"}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {usage.part?.partNumber}
                                  </div>
                                </div>
                              </div>
                              {usage.unitCost && (
                                <div className="text-right">
                                  <div className="font-medium">${Number(usage.unitCost).toFixed(2)}</div>
                                  <div className="text-sm text-muted-foreground">per unit</div>
                                </div>
                              )}
                            </div>
                            {usage.notes && (
                              <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
                                {usage.notes}
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4 mt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Operating Behavior Reports</h3>
                    <Button onClick={() => setShowAddReportDialog(true)} data-testid="button-add-report">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Report
                    </Button>
                  </div>

                  {reportsLoading ? (
                    <div className="space-y-3">
                      <Skeleton className="h-40 w-full" />
                      <Skeleton className="h-40 w-full" />
                    </div>
                  ) : operatingReports?.length === 0 ? (
                    <Card>
                      <CardContent className="pt-6 text-center text-muted-foreground">
                        No operating reports found
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-3">
                      {operatingReports?.map((report) => (
                        <Card key={report.id} data-testid={`card-report-${report.id}`}>
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">
                                {format(new Date(report.reportDate), "MMMM dd, yyyy")}
                              </CardTitle>
                              {report.performanceRating && (
                                <Badge variant={report.performanceRating >= 4 ? "default" : "secondary"}>
                                  {report.performanceRating}/5
                                </Badge>
                              )}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <div className="text-muted-foreground">Operating Hours</div>
                                <div className="font-medium">{report.operatingHours}h</div>
                              </div>
                              {report.fuelConsumption && (
                                <div>
                                  <div className="text-muted-foreground">Fuel Consumption</div>
                                  <div className="font-medium">{report.fuelConsumption}L</div>
                                </div>
                              )}
                              {report.productivity && (
                                <div>
                                  <div className="text-muted-foreground">Productivity</div>
                                  <div className="font-medium">{report.productivity}</div>
                                </div>
                              )}
                            </div>
                            {report.issuesReported && (
                              <div className="mt-4">
                                <div className="text-sm font-medium mb-1">Issues Reported</div>
                                <div className="text-sm text-muted-foreground">{report.issuesReported}</div>
                              </div>
                            )}
                            {report.operatorNotes && (
                              <div className="mt-3">
                                <div className="text-sm font-medium mb-1">Operator Notes</div>
                                <div className="text-sm text-muted-foreground">{report.operatorNotes}</div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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

      <AddMaintenanceDialog
        open={showAddMaintenanceDialog}
        onClose={() => setShowAddMaintenanceDialog(false)}
        equipmentId={selectedEquipmentId}
      />

      <AddReportDialog
        open={showAddReportDialog}
        onClose={() => setShowAddReportDialog(false)}
        equipmentId={selectedEquipmentId}
      />
    </div>
  );
}

function AddMaintenanceDialog({
  open,
  onClose,
  equipmentId,
}: {
  open: boolean;
  onClose: () => void;
  equipmentId: string;
}) {
  const { toast } = useToast();

  const { data: mechanics } = useQuery<Mechanic[]>({
    queryKey: ["/api/mechanics"],
  });

  const maintenanceFormSchema = z.object({
    equipmentId: z.string(),
    mechanicId: z.string().optional(),
    maintenanceType: z.string(),
    description: z.string(),
    operatingHours: z.number().optional(),
    laborHours: z.string().optional(),
    cost: z.string().optional(),
    status: z.string(),
    maintenanceDate: z.string(),
    completedDate: z.string().optional(),
    notes: z.string().optional(),
  });

  type MaintenanceFormData = z.infer<typeof maintenanceFormSchema>;

  const form = useForm<MaintenanceFormData>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      equipmentId,
      maintenanceType: "Routine",
      description: "",
      status: "completed",
      maintenanceDate: new Date().toISOString().split("T")[0],
      mechanicId: undefined,
      operatingHours: undefined,
      laborHours: undefined,
      cost: undefined,
      completedDate: undefined,
      notes: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/maintenance", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId, "maintenance"] });
      toast({ title: "Maintenance record created successfully" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create maintenance record", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      equipmentId,
      maintenanceDate: new Date(data.maintenanceDate).toISOString(),
      completedDate: data.completedDate ? new Date(data.completedDate).toISOString() : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Maintenance Record</DialogTitle>
          <DialogDescription>Record new maintenance work performed on this equipment</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-maintenance-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Routine">Routine</SelectItem>
                      <SelectItem value="Repair">Repair</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="Inspection">Inspection</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Describe the maintenance work..." data-testid="input-description" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="maintenanceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maintenance Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-maintenance-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mechanicId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mechanic (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-mechanic">
                          <SelectValue placeholder="Select mechanic..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {mechanics?.map((mechanic: any) => (
                          <SelectItem key={mechanic.id} value={mechanic.id}>
                            {mechanic.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        data-testid="input-operating-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="laborHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Labor Hours</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.5" {...field} data-testid="input-labor-hours" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} data-testid="input-cost" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes..." data-testid="input-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-maintenance">
                {createMutation.isPending ? "Creating..." : "Create Record"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function AddReportDialog({
  open,
  onClose,
  equipmentId,
}: {
  open: boolean;
  onClose: () => void;
  equipmentId: string;
}) {
  const { toast } = useToast();

  const reportFormSchema = z.object({
    equipmentId: z.string(),
    reportDate: z.string(),
    operatingHours: z.number(),
    fuelConsumption: z.string().optional(),
    productivity: z.string().optional(),
    issuesReported: z.string().optional(),
    operatorNotes: z.string().optional(),
    performanceRating: z.number().optional(),
  });

  type ReportFormData = z.infer<typeof reportFormSchema>;

  const form = useForm<ReportFormData>({
    resolver: zodResolver(reportFormSchema),
    defaultValues: {
      equipmentId,
      reportDate: new Date().toISOString().split("T")[0],
      operatingHours: 0,
      performanceRating: 5,
      fuelConsumption: undefined,
      productivity: undefined,
      issuesReported: undefined,
      operatorNotes: undefined,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/operating-reports", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment", equipmentId, "operating-reports"] });
      toast({ title: "Operating report created successfully" });
      onClose();
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to create operating report", variant: "destructive" });
    },
  });

  const onSubmit = (data: any) => {
    createMutation.mutate({
      ...data,
      equipmentId,
      reportDate: new Date(data.reportDate).toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Operating Report</DialogTitle>
          <DialogDescription>Record operating behavior and performance data</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="reportDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Report Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-report-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="operatingHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Operating Hours</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-report-operating-hours"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fuelConsumption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fuel Consumption (L)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" {...field} data-testid="input-fuel-consumption" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="performanceRating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Rating (1-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        max="5"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                        data-testid="input-performance-rating"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="productivity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Productivity Metrics (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g., 500 cubic meters moved" data-testid="input-productivity" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="issuesReported"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Issues Reported (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Any issues or problems noticed..." data-testid="input-issues" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="operatorNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Operator Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional operator observations..." data-testid="input-operator-notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} data-testid="button-cancel-report">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} data-testid="button-submit-report">
                {createMutation.isPending ? "Creating..." : "Create Report"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
