import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Search, Filter, Calendar, Wrench, TrendingUp, DollarSign, ChevronRight, Plus, Upload, Download, Edit, Trash2, FileSpreadsheet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { insertEquipmentSchema, type Equipment, type InsertEquipment } from "@shared/schema";
import type { 
  MaintenanceRecordWithDetails, 
  OperatingBehaviorReport,
  PartsUsageHistory,
  SparePart 
} from "@shared/schema";
import * as XLSX from "xlsx";

interface EquipmentGroup {
  equipmentType: string;
  count: number;
  units: Equipment[];
}

export default function EquipmentPage() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMake, setFilterMake] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  
  // CRUD dialogs state
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // Import/Export state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Form state
  const [formData, setFormData] = useState<InsertEquipment>({
    equipmentType: "",
    make: "",
    model: "",
    plateNo: "",
    assetNo: "",
    newAssetNo: "",
    machineSerial: "",
    remarks: "",
  });

  const { toast } = useToast();

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const filteredEquipment = equipment?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plateNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.machineSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetNo?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = filterType === "all" || item.equipmentType === filterType;
    const matchesMake = filterMake === "all" || item.make === filterMake;

    return matchesSearch && matchesType && matchesMake;
  });

  // Group equipment by type only
  const groupedEquipment: EquipmentGroup[] = [];
  filteredEquipment?.forEach((item) => {
    const existing = groupedEquipment.find(
      (g) => g.equipmentType === item.equipmentType
    );
    
    if (existing) {
      existing.units.push(item);
      existing.count++;
    } else {
      groupedEquipment.push({
        equipmentType: item.equipmentType,
        count: 1,
        units: [item],
      });
    }
  });

  // Sort groups by equipment type alphabetically
  groupedEquipment.sort((a, b) => a.equipmentType.localeCompare(b.equipmentType));

  const equipmentTypes = Array.from(new Set(equipment?.map((e) => e.equipmentType) || []));
  const makes = Array.from(new Set(equipment?.map((e) => e.make) || []));

  // Mutations
  const createEquipmentMutation = useMutation({
    mutationFn: async (data: InsertEquipment) => {
      if (editingEquipment) {
        return await apiRequest("PUT", `/api/equipment/${editingEquipment.id}`, data);
      } else {
        return await apiRequest("POST", "/api/equipment", data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: editingEquipment ? "Equipment updated successfully" : "Equipment created successfully",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingEquipment ? 'update' : 'create'} equipment`,
        variant: "destructive",
      });
    },
  });

  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/equipment/${id}`, null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: "Equipment deleted successfully",
      });
      setDeleteConfirmId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete equipment",
        variant: "destructive",
      });
    },
  });

  const importEquipmentMutation = useMutation({
    mutationFn: async (equipmentList: InsertEquipment[]) => {
      return await apiRequest("POST", "/api/equipment/import", { equipment: equipmentList });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Success",
        description: `Imported ${data.count} equipment items successfully`,
      });
      setIsImportDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import equipment",
        variant: "destructive",
      });
    },
  });

  // Handler functions
  const resetForm = () => {
    setFormData({
      equipmentType: "",
      make: "",
      model: "",
      plateNo: "",
      assetNo: "",
      newAssetNo: "",
      machineSerial: "",
      remarks: "",
    });
    setEditingEquipment(null);
    setIsCreateDialogOpen(false);
  };

  const handleCreate = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (equip: Equipment) => {
    setFormData({
      equipmentType: equip.equipmentType,
      make: equip.make,
      model: equip.model,
      plateNo: equip.plateNo || "",
      assetNo: equip.assetNo || "",
      newAssetNo: equip.newAssetNo || "",
      machineSerial: equip.machineSerial || "",
      remarks: equip.remarks || "",
    });
    setEditingEquipment(equip);
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEquipmentMutation.mutate(formData);
  };

  // Excel template download
  const downloadTemplate = () => {
    const template = [
      {
        "Equipment Type": "DOZER",
        "Make": "CAT",
        "Model": "D8R",
        "Plate No": "AA-12345",
        "Asset No": "SSC-001",
        "New Asset No": "SSC-NEW-001",
        "Machine Serial": "CAT12345X",
        "Remarks": "Sample equipment entry"
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(template);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Equipment Template");
    XLSX.writeFile(workbook, "equipment_import_template.xlsx");

    toast({
      title: "Template Downloaded",
      description: "Excel template has been downloaded successfully",
    });
  };

  // Excel import handler
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const equipmentList: InsertEquipment[] = jsonData.map((row: any) => ({
          equipmentType: row["Equipment Type"] || "",
          make: row["Make"] || "",
          model: row["Model"] || "",
          plateNo: row["Plate No"] || null,
          assetNo: row["Asset No"] || null,
          newAssetNo: row["New Asset No"] || null,
          machineSerial: row["Machine Serial"] || null,
          remarks: row["Remarks"] || null,
        }));

        // Validate required fields
        const invalidRows = equipmentList.filter(
          (item) => !item.equipmentType || !item.make || !item.model
        );

        if (invalidRows.length > 0) {
          toast({
            title: "Validation Error",
            description: `${invalidRows.length} rows missing required fields (Equipment Type, Make, Model)`,
            variant: "destructive",
          });
          return;
        }

        importEquipmentMutation.mutate(equipmentList);
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse Excel file. Please use the template format.",
          variant: "destructive",
        });
      }
    };

    reader.readAsArrayBuffer(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold">Equipment Inventory</h1>
              <p className="text-muted-foreground mt-1">
                Manage your heavy equipment fleet
              </p>
            </div>
            {equipment && (
              <div className="text-right">
                <div className="text-2xl font-bold" data-testid="text-total-equipment">
                  {equipment.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Assets</div>
                {filteredEquipment && filteredEquipment.length < equipment.length && (
                  <div className="text-xs text-muted-foreground mt-1">
                    ({filteredEquipment.length} filtered)
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by model, plate, serial, or asset number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-equipment"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]" data-testid="select-equipment-type">
                  <SelectValue placeholder="Equipment Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterMake} onValueChange={setFilterMake}>
                <SelectTrigger className="w-[180px]" data-testid="select-make">
                  <SelectValue placeholder="Make" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Makes</SelectItem>
                  {makes.map((make) => (
                    <SelectItem key={make} value={make}>
                      {make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleCreate} data-testid="button-add-equipment">
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
            <Button variant="outline" onClick={downloadTemplate} data-testid="button-download-template">
              <Download className="h-4 w-4 mr-2" />
              Download Template
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} data-testid="button-import-excel">
              <Upload className="h-4 w-4 mr-2" />
              Import from Excel
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : groupedEquipment && groupedEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedEquipment.map((group) => {
              const groupKey = group.equipmentType;
              
              return (
                <Card 
                  key={groupKey} 
                  className="overflow-hidden hover-elevate cursor-pointer" 
                  data-testid={`card-equipment-group-${groupKey}`}
                  onClick={() => setLocation(`/equipment/category/${encodeURIComponent(groupKey)}`)}
                >
                  <div 
                    className="relative h-48 bg-cover bg-center"
                    style={{ backgroundImage: `url(/attached_assets/Capture_1760099408820.PNG)` }}
                    data-testid={`header-equipment-type-${groupKey}`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-black/20" />
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <div className="flex items-end justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="text-2xl font-bold text-white mb-1" data-testid={`text-equipment-type-${groupKey}`}>
                            {group.equipmentType}
                          </h3>
                          <p className="text-4xl font-bold text-white" data-testid={`text-unit-count-${groupKey}`}>
                            {group.count}
                          </p>
                          <p className="text-sm text-white/80">
                            {group.count === 1 ? 'Unit' : 'Units'}
                          </p>
                        </div>
                        <ChevronRight className="h-6 w-6 text-white flex-shrink-0" />
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <Filter className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      <EquipmentDetailDialog 
        equipment={selectedEquipment}
        onClose={() => setSelectedEquipment(null)}
      />

      {/* Create/Edit Equipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEquipment ? "Edit Equipment" : "Add New Equipment"}</DialogTitle>
            <DialogDescription>
              {editingEquipment ? "Update equipment information" : "Add a new equipment unit to your inventory"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="equipmentType">Equipment Type *</Label>
                <Input
                  id="equipmentType"
                  value={formData.equipmentType}
                  onChange={(e) => setFormData({ ...formData, equipmentType: e.target.value })}
                  placeholder="e.g., DOZER, WHEEL LOADER"
                  required
                  data-testid="input-equipment-type"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  placeholder="e.g., CAT, KOMATSU"
                  required
                  data-testid="input-make"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g., D8R, L-90C"
                  required
                  data-testid="input-model"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plateNo">Plate Number</Label>
                <Input
                  id="plateNo"
                  value={formData.plateNo || ""}
                  onChange={(e) => setFormData({ ...formData, plateNo: e.target.value })}
                  placeholder="e.g., AA-12345"
                  data-testid="input-plate-no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assetNo">Asset Number</Label>
                <Input
                  id="assetNo"
                  value={formData.assetNo || ""}
                  onChange={(e) => setFormData({ ...formData, assetNo: e.target.value })}
                  placeholder="e.g., SSC-001"
                  data-testid="input-asset-no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAssetNo">New Asset Number</Label>
                <Input
                  id="newAssetNo"
                  value={formData.newAssetNo || ""}
                  onChange={(e) => setFormData({ ...formData, newAssetNo: e.target.value })}
                  placeholder="e.g., SSC-NEW-001"
                  data-testid="input-new-asset-no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="machineSerial">Machine Serial</Label>
                <Input
                  id="machineSerial"
                  value={formData.machineSerial || ""}
                  onChange={(e) => setFormData({ ...formData, machineSerial: e.target.value })}
                  placeholder="e.g., CAT12345X"
                  data-testid="input-machine-serial"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={formData.remarks || ""}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="Additional notes or comments"
                rows={3}
                data-testid="textarea-remarks"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={resetForm} data-testid="button-cancel-equipment">
                Cancel
              </Button>
              <Button type="submit" disabled={createEquipmentMutation.isPending} data-testid="button-submit-equipment">
                {createEquipmentMutation.isPending ? "Saving..." : editingEquipment ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this equipment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteEquipmentMutation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EquipmentDetailDialog({ 
  equipment, 
  onClose 
}: { 
  equipment: Equipment | null; 
  onClose: () => void;
}) {
  const { data: maintenanceRecords, isLoading: recordsLoading } = useQuery<MaintenanceRecordWithDetails[]>({
    queryKey: ["/api/equipment", equipment?.id, "maintenance"],
    enabled: !!equipment,
  });

  const { data: operatingReports, isLoading: reportsLoading } = useQuery<OperatingBehaviorReport[]>({
    queryKey: ["/api/equipment", equipment?.id, "operating-reports"],
    enabled: !!equipment,
  });

  const { data: partsUsage } = useQuery<(PartsUsageHistory & { part?: SparePart })[]>({
    queryKey: ["/api/equipment", equipment?.id, "parts-usage"],
    enabled: !!equipment,
  });

  if (!equipment) return null;

  // Calculate statistics
  const totalMaintenanceCost = maintenanceRecords?.reduce((sum, record) => 
    sum + (Number(record.cost) || 0), 0
  ) || 0;

  const totalLaborHours = maintenanceRecords?.reduce((sum, record) => 
    sum + (Number(record.laborHours) || 0), 0
  ) || 0;

  const lastMaintenance = maintenanceRecords?.[0];
  const avgPerformanceRating = operatingReports?.length 
    ? (operatingReports.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / operatingReports.length).toFixed(1)
    : "N/A";

  return (
    <Dialog open={!!equipment} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{equipment.model}</DialogTitle>
          <DialogDescription>
            {equipment.equipmentType} - {equipment.make}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Equipment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipment Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Asset Number</div>
                <div className="font-mono text-sm">{equipment.assetNo || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New Asset Number</div>
                <div className="font-mono text-sm">{equipment.newAssetNo || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Plate Number</div>
                <div className="font-mono text-sm">{equipment.plateNo || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Serial Number</div>
                <div className="font-mono text-sm">{equipment.machineSerial || "N/A"}</div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Wrench className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{maintenanceRecords?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Maintenance Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">${totalMaintenanceCost.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">Total Cost</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{totalLaborHours.toFixed(1)}h</div>
                    <div className="text-sm text-muted-foreground">Labor Hours</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{avgPerformanceRating}</div>
                    <div className="text-sm text-muted-foreground">Avg Performance</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs for detailed information */}
          <Tabs defaultValue="maintenance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="parts">Parts Used</TabsTrigger>
              <TabsTrigger value="reports">Operating Reports</TabsTrigger>
            </TabsList>

            <TabsContent value="maintenance" className="space-y-3 mt-4">
              {recordsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : maintenanceRecords?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No maintenance records found
                </div>
              ) : (
                maintenanceRecords?.slice(0, 5).map((record) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{record.description}</CardTitle>
                          <div className="text-sm text-muted-foreground mt-1">
                            {format(new Date(record.maintenanceDate), "MMM dd, yyyy")}
                            {record.mechanic && ` • ${record.mechanic.fullName}`}
                          </div>
                        </div>
                        <Badge>{record.maintenanceType}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        {record.cost && (
                          <div>
                            <span className="text-muted-foreground">Cost:</span>
                            <span className="ml-2 font-medium">${Number(record.cost).toFixed(2)}</span>
                          </div>
                        )}
                        {record.laborHours && (
                          <div>
                            <span className="text-muted-foreground">Labor:</span>
                            <span className="ml-2 font-medium">{record.laborHours}h</span>
                          </div>
                        )}
                        {record.operatingHours && (
                          <div>
                            <span className="text-muted-foreground">Hours:</span>
                            <span className="ml-2 font-medium">{record.operatingHours}h</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="parts" className="space-y-3 mt-4">
              {partsUsage?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No parts usage recorded
                </div>
              ) : (
                partsUsage?.slice(0, 8).map((usage) => (
                  <Card key={usage.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge>{usage.quantity}x</Badge>
                          <div>
                            <div className="font-medium">{usage.part?.partName || "Unknown Part"}</div>
                            <div className="text-sm text-muted-foreground">{usage.part?.partNumber}</div>
                          </div>
                        </div>
                        {usage.unitCost && (
                          <div className="text-right">
                            <div className="font-medium">${Number(usage.unitCost).toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">per unit</div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="reports" className="space-y-3 mt-4">
              {reportsLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : operatingReports?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No operating reports found
                </div>
              ) : (
                operatingReports?.slice(0, 5).map((report) => (
                  <Card key={report.id}>
                    <CardHeader className="pb-3">
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
                    <CardContent className="text-sm">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-muted-foreground">Hours:</span>
                          <span className="ml-2">{report.operatingHours}h</span>
                        </div>
                        {report.fuelConsumption && (
                          <div>
                            <span className="text-muted-foreground">Fuel:</span>
                            <span className="ml-2">{report.fuelConsumption}L</span>
                          </div>
                        )}
                        {report.productivity && (
                          <div>
                            <span className="text-muted-foreground">Output:</span>
                            <span className="ml-2">{report.productivity}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
