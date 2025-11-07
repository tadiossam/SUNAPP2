import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Search, Wrench, DollarSign, Calendar, TrendingUp, X, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { 
  Equipment,
  EquipmentCategory,
  MaintenanceRecordWithDetails, 
  OperatingBehaviorReport,
  PartsUsageHistory,
  SparePart 
} from "@shared/schema";

// Background image mapping for different equipment categories
// To change a category's background, update the image path for that category
const CATEGORY_BACKGROUNDS: Record<string, string> = {
  "EXCAVATOR": "/attached_assets/Capture_1760099408820.PNG",
  "WHEEL EXCAVATOR": "/attached_assets/Capture_1760099408820.PNG",
  "ASPHALT DISTR.": "/attached_assets/Capture_1760099408820.PNG",
  "ASPHALT PAVER": "/attached_assets/Capture_1760099408820.PNG",
  "ASPHALT PLANT": "/attached_assets/Capture_1760099408820.PNG",
  "ASPHALT TYRE ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "DUMP TRUCK": "/attached_assets/Capture_1760099408820.PNG",
  "MID TRUCK": "/attached_assets/Capture_1760099408820.PNG",
  "MIXER TRUCK": "/attached_assets/Capture_1760099408820.PNG",
  "WHEEL LOADER": "/attached_assets/Capture_1760099408820.PNG",
  "GRADER": "/attached_assets/Capture_1760099408820.PNG",
  "ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "D DRUM ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "D/DRUM ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "S/D DRUM ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "S/D ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "PNEUMATIC ROLLER": "/attached_assets/Capture_1760099408820.PNG",
  "TYRE PNEUMATIC": "/attached_assets/Capture_1760099408820.PNG",
  "DOZER": "/attached_assets/dozer_1760103113381.avif",
  "MOBILE CRANE": "/attached_assets/Capture_1760099408820.PNG",
  "HALF CRANE": "/attached_assets/Capture_1760099408820.PNG",
  "CRUSHER": "/attached_assets/Capture_1760099408820.PNG",
  "CHINA CRUSHER": "/attached_assets/Capture_1760099408820.PNG",
  "CRUSHER (INDIA)": "/attached_assets/Capture_1760099408820.PNG",
  "CONE CRUSHER": "/attached_assets/Capture_1760099408820.PNG",
  "WAGON DRILL": "/attached_assets/Capture_1760099408820.PNG",
  "SERVICE BUS": "/attached_assets/Capture_1760099408820.PNG",
  "DOUBLE CAB": "/attached_assets/Capture_1760099408820.PNG",
  "STATION WAGON": "/attached_assets/Capture_1760099408820.PNG",
  "SUV": "/attached_assets/Capture_1760099408820.PNG",
  "LAND ROVER": "/attached_assets/Capture_1760099408820.PNG",
  "RANGE ROVER": "/attached_assets/Capture_1760099408820.PNG",
  "PRADO": "/attached_assets/Capture_1760099408820.PNG",
  "RAV4": "/attached_assets/Capture_1760099408820.PNG",
  "TERIOS": "/attached_assets/Capture_1760099408820.PNG",
  "COROLLA": "/attached_assets/Capture_1760099408820.PNG",
  "LEXUS": "/attached_assets/Capture_1760099408820.PNG",
  "MERCEDES": "/attached_assets/Capture_1760099408820.PNG",
  "BMW": "/attached_assets/Capture_1760099408820.PNG",
  "AUDI": "/attached_assets/Capture_1760099408820.PNG",
  "CADILLAC": "/attached_assets/Capture_1760099408820.PNG",
  "default": "/attached_assets/Capture_1760099408820.PNG"
};

export default function EquipmentCategoryPage() {
  const [, params] = useRoute("/equipment/category/:type");
  // Normalize equipment type to uppercase for consistent mapping
  const equipmentType = params?.type ? decodeURIComponent(params.type).toUpperCase().trim() : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [backgroundImage, setBackgroundImage] = useState(
    CATEGORY_BACKGROUNDS[equipmentType] || CATEGORY_BACKGROUNDS["default"]
  );
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    categoryId: null as string | null,
    equipmentType: "",
    make: "",
    model: "",
    plateNo: "",
    assetNo: "",
    newAssetNo: "",
    machineSerial: "",
    remarks: "",
  });
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState<string | null>(null);
  const [categoryFormData, setCategoryFormData] = useState({
    name: "",
    description: "",
    backgroundImage: "",
  });
  const { toast } = useToast();

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: categories } = useQuery<EquipmentCategory[]>({
    queryKey: ["/api/equipment-categories"],
  });

  // Try to find a matching category by name
  const matchedCategory = categories?.find(
    (cat) => cat.name.toUpperCase().trim() === equipmentType
  );

  // Update background image when equipment type or category changes
  useEffect(() => {
    if (matchedCategory?.backgroundImage) {
      setBackgroundImage(matchedCategory.backgroundImage);
    } else {
      const newBackground = CATEGORY_BACKGROUNDS[equipmentType] || CATEGORY_BACKGROUNDS["default"];
      setBackgroundImage(newBackground);
    }
  }, [equipmentType, matchedCategory]);

  // Filter equipment by categoryId if category exists, otherwise by equipmentType
  // Include legacy equipment (categoryId=null) that matches equipmentType when a category exists
  const categoryEquipment = equipment?.filter((item) => {
    if (matchedCategory) {
      // Include equipment with matching categoryId OR legacy equipment matching equipmentType
      return item.categoryId === matchedCategory.id || 
             (!item.categoryId && item.equipmentType.toUpperCase().trim() === equipmentType);
    }
    return item.equipmentType.toUpperCase().trim() === equipmentType;
  });

  const filteredEquipment = categoryEquipment?.filter((item) => {
    const matchesSearch =
      searchTerm === "" ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.plateNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.machineSerial?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.assetNo?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const { data: maintenanceRecords } = useQuery<MaintenanceRecordWithDetails[]>({
    queryKey: ["/api/maintenance"],
  });

  const { data: operatingReports } = useQuery<OperatingBehaviorReport[]>({
    queryKey: ["/api/operating-reports"],
  });

  const { data: partsUsage } = useQuery<PartsUsageHistory[]>({
    queryKey: ["/api/parts-usage"],
  });

  const { data: spareParts } = useQuery<SparePart[]>({
    queryKey: ["/api/spare-parts"],
  });

  // Update equipment mutation
  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: { id: string; equipment: typeof formData }) => {
      return await apiRequest("PUT", `/api/equipment/${data.id}`, data.equipment);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment"], type: 'active' });
      toast({ title: "Success", description: "Equipment updated successfully" });
      setIsEditDialogOpen(false);
      setEditingEquipment(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update equipment", 
        variant: "destructive" 
      });
    },
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/equipment/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment"], type: 'active' });
      toast({ title: "Success", description: "Equipment deleted successfully" });
      setDeleteConfirmId(null);
      setSelectedEquipment(null);
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete equipment", 
        variant: "destructive" 
      });
    },
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; category: typeof categoryFormData }) => {
      return await apiRequest("PUT", `/api/equipment-categories/${data.id}`, data.category);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment-categories"], type: 'active' });
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment"], type: 'active' });
      toast({ title: "Success", description: "Category updated successfully" });
      setIsEditCategoryDialogOpen(false);
      resetCategoryForm();
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update category", 
        variant: "destructive" 
      });
    },
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/equipment-categories/${id}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment-categories"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment-categories"], type: 'active' });
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment"], type: 'active' });
      toast({ title: "Success", description: "Category deleted successfully" });
      setDeleteCategoryConfirmId(null);
      window.location.href = "/equipment";
    },
    onError: (error: Error) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete category", 
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      categoryId: null,
      equipmentType: "",
      make: "",
      model: "",
      plateNo: "",
      assetNo: "",
      newAssetNo: "",
      machineSerial: "",
      remarks: "",
    });
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: "",
      description: "",
      backgroundImage: "",
    });
  };

  const handleEdit = (equipment: Equipment, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingEquipment(equipment);
    setFormData({
      categoryId: equipment.categoryId || null,
      equipmentType: equipment.equipmentType,
      make: equipment.make,
      model: equipment.model,
      plateNo: equipment.plateNo || "",
      assetNo: equipment.assetNo || "",
      newAssetNo: equipment.newAssetNo || "",
      machineSerial: equipment.machineSerial || "",
      remarks: equipment.remarks || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDelete = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setDeleteConfirmId(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEquipment) {
      updateEquipmentMutation.mutate({ id: editingEquipment.id, equipment: formData });
    }
  };

  const handleEditCategory = () => {
    if (matchedCategory) {
      setCategoryFormData({
        name: matchedCategory.name,
        description: matchedCategory.description || "",
        backgroundImage: matchedCategory.backgroundImage || "",
      });
      setIsEditCategoryDialogOpen(true);
    }
  };

  const handleDeleteCategory = () => {
    if (matchedCategory) {
      setDeleteCategoryConfirmId(matchedCategory.id);
    }
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (matchedCategory) {
      updateCategoryMutation.mutate({ id: matchedCategory.id, category: categoryFormData });
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="relative h-64 bg-muted">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="container mx-auto p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const equipmentMaintenanceRecords = maintenanceRecords?.filter(r => r.equipmentId === selectedEquipment?.id) ?? [];
  const maintenanceRecordsCount = equipmentMaintenanceRecords.length;
  const totalCost = equipmentMaintenanceRecords.reduce((sum, r) => sum + (parseFloat(r.cost || '0')), 0);
  const totalLaborHours = equipmentMaintenanceRecords.reduce((sum, r) => sum + (parseFloat(r.laborHours || '0')), 0);
  
  const equipmentOperatingReports = operatingReports?.filter(r => r.equipmentId === selectedEquipment?.id) ?? [];
  const avgPerformance = equipmentOperatingReports.length > 0
    ? equipmentOperatingReports.reduce((sum, r) => sum + (r.performanceRating || 0), 0) / equipmentOperatingReports.length
    : 0;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header Banner with Background */}
      <div 
        className="relative h-64 bg-cover bg-center flex-shrink-0"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        data-testid="header-category-banner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="absolute inset-0 container mx-auto px-6 py-6 flex flex-col">
          <div className="mb-4">
            <Link href="/equipment">
              <Button variant="ghost" size="sm" className="text-white hover:text-white/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Equipment
              </Button>
            </Link>
          </div>
          
          <div className="flex-1 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-6xl font-bold text-white" data-testid="text-category-name">
                {equipmentType}
              </h1>
              {matchedCategory && (
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-white/90 hover:bg-white/20"
                    onClick={handleEditCategory}
                    data-testid="button-edit-category"
                  >
                    <Pencil className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-white hover:text-white/90 hover:bg-white/20"
                    onClick={handleDeleteCategory}
                    data-testid="button-delete-category"
                  >
                    <Trash2 className="h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="text-right">
              <p className="text-7xl font-bold text-white" data-testid="text-total-units">
                {categoryEquipment?.length || 0}
              </p>
              <p className="text-xl text-white/80">
                {categoryEquipment?.length === 1 ? 'Unit' : 'Units'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 overflow-auto bg-background">
        <div className="container mx-auto px-6 py-6">
          {/* Search Bar */}
          <div className="mb-6 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search by model, make, serial, asset, or plate number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12"
                data-testid="input-search-equipment"
              />
            </div>
          </div>

          {/* Equipment Grid */}
          {filteredEquipment && filteredEquipment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEquipment.map((item) => (
                <Card 
                  key={item.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setSelectedEquipment(item)}
                  data-testid={`card-equipment-${item.id}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-1">
                          {item.make} {item.model}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Serial: {item.machineSerial || "N/A"}
                        </p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleEdit(item, e)}
                          data-testid={`button-edit-${item.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => handleDelete(item.id, e)}
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {item.assetNo && (
                        <div>
                          <span className="text-muted-foreground">Asset:</span>
                          <span className="ml-1 font-mono">{item.assetNo}</span>
                        </div>
                      )}
                      {item.plateNo && (
                        <div>
                          <span className="text-muted-foreground">Plate:</span>
                          <span className="ml-1 font-mono">{item.plateNo}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-lg">No equipment found in this category</p>
            </div>
          )}
        </div>
      </div>

      {/* Equipment Detail Dialog */}
      <Dialog open={selectedEquipment !== null} onOpenChange={(open) => !open && setSelectedEquipment(null)}>
        <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto bg-background/95 backdrop-blur-lg p-0" data-testid="dialog-equipment-detail">
          {/* Close Button */}
          <button
            onClick={() => setSelectedEquipment(null)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>

          {/* Header */}
          <div className="p-8 pb-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-4xl font-bold mb-1">{selectedEquipment?.model}</h2>
                <p className="text-lg text-muted-foreground">
                  {selectedEquipment?.equipmentType} - {selectedEquipment?.make}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={(e) => selectedEquipment && handleEdit(selectedEquipment, e)}
                  data-testid="button-edit-equipment-dialog"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={(e) => selectedEquipment && handleDelete(selectedEquipment.id, e)}
                  data-testid="button-delete-equipment-dialog"
                >
                  <Trash2 className="h-4 w-4 mr-2 text-destructive" />
                  Delete
                </Button>
              </div>
            </div>
          </div>

          {/* Equipment Information Section */}
          <div className="px-8 pb-6">
            <div className="bg-muted/30 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Equipment Information</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Asset Number</p>
                  <p className="font-mono font-medium text-lg">{selectedEquipment?.assetNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">New Asset Number</p>
                  <p className="font-mono font-medium text-lg">{selectedEquipment?.newAssetNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plate Number</p>
                  <p className="font-mono font-medium text-lg">{selectedEquipment?.plateNo || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Serial Number</p>
                  <p className="font-mono font-medium text-lg">{selectedEquipment?.machineSerial || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-4 gap-4">
              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Wrench className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{maintenanceRecordsCount}</p>
                  <p className="text-sm text-muted-foreground">Maintenance Records</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <DollarSign className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">${totalCost.toFixed(0)}</p>
                  <p className="text-sm text-muted-foreground">Total Cost</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{totalLaborHours.toFixed(1)}h</p>
                  <p className="text-sm text-muted-foreground">Labor Hours</p>
                </CardContent>
              </Card>

              <Card className="bg-muted/30">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <p className="text-3xl font-bold mb-1">{avgPerformance > 0 ? avgPerformance.toFixed(1) : 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">Avg Performance</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="maintenance" className="w-full px-8 pb-8">
            <div className="w-full overflow-x-auto">
              <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-3 mb-6">
                <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance History</TabsTrigger>
                <TabsTrigger value="parts" data-testid="tab-parts">Parts Used</TabsTrigger>
                <TabsTrigger value="operating" data-testid="tab-operating">Operating Reports</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="maintenance" className="space-y-3 mt-4">
              {equipmentMaintenanceRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No maintenance records found</p>
              ) : (
                equipmentMaintenanceRecords.map((record) => (
                    <Card key={record.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{record.maintenanceType}</h4>
                            <p className="text-sm text-muted-foreground">
                              {record.maintenanceDate ? format(new Date(record.maintenanceDate), "PPP") : "N/A"}
                            </p>
                          </div>
                          <Badge variant={record.status === 'Completed' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                        </div>
                        <p className="text-sm">{record.description}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="operating" className="space-y-3 mt-4">
              {equipmentOperatingReports.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No operating reports found</p>
              ) : (
                equipmentOperatingReports.map((report) => (
                    <Card key={report.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">Operating Report</h4>
                            <p className="text-sm text-muted-foreground">
                              {report.reportDate ? format(new Date(report.reportDate), "PPP") : "N/A"}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm">{report.operatorNotes || report.issuesReported || "No notes available"}</p>
                      </CardContent>
                    </Card>
                  ))
              )}
            </TabsContent>

            <TabsContent value="parts" className="space-y-3 mt-4">
              {(() => {
                // Get maintenance records for this equipment (reuse already filtered array)
                const maintenanceRecordIds = equipmentMaintenanceRecords.map(r => r.id);
                
                // Filter parts usage by maintenance records for this equipment
                const equipmentPartsUsage = partsUsage?.filter(p => maintenanceRecordIds.includes(p.maintenanceRecordId)) ?? [];
                
                if (equipmentPartsUsage.length === 0) {
                  return <p className="text-muted-foreground text-center py-8">No parts usage history found</p>;
                }
                
                return equipmentPartsUsage.map((usage) => {
                  const part = spareParts?.find(sp => sp.id === usage.partId);
                  const maintenanceRecord = equipmentMaintenanceRecords.find(r => r.id === usage.maintenanceRecordId);
                  
                  return (
                    <Card key={usage.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{part?.partName || "Unknown Part"}</h4>
                            <p className="text-sm text-muted-foreground">
                              Part #: {part?.partNumber || "N/A"}
                            </p>
                            <p className="text-sm mt-1">
                              Quantity: {usage.quantity} | Date: {maintenanceRecord?.maintenanceDate ? format(new Date(maintenanceRecord.maintenanceDate), "PP") : "N/A"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                });
              })()}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Edit Equipment Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Equipment</DialogTitle>
            <DialogDescription>
              Update equipment information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">

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
                  placeholder="e.g., A-12345"
                  data-testid="input-asset-no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newAssetNo">New Asset Number</Label>
                <Input
                  id="newAssetNo"
                  value={formData.newAssetNo || ""}
                  onChange={(e) => setFormData({ ...formData, newAssetNo: e.target.value })}
                  placeholder="e.g., NA-12345"
                  data-testid="input-new-asset-no"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="machineSerial">Machine Serial</Label>
                <Input
                  id="machineSerial"
                  value={formData.machineSerial || ""}
                  onChange={(e) => setFormData({ ...formData, machineSerial: e.target.value })}
                  placeholder="e.g., SN-123456"
                  data-testid="input-machine-serial"
                />
              </div>

              <div className="space-y-2 col-span-2">
                <Label htmlFor="remarks">Remarks</Label>
                <Input
                  id="remarks"
                  value={formData.remarks || ""}
                  onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                  placeholder="Additional notes"
                  data-testid="input-remarks"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingEquipment(null);
                  resetForm();
                }}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateEquipmentMutation.isPending}
                data-testid="button-submit-edit"
              >
                {updateEquipmentMutation.isPending ? "Updating..." : "Update Equipment"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Confirmation Dialog */}
      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Equipment?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the equipment from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteEquipmentMutation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteEquipmentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update category information
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">Category Name *</Label>
              <Input
                id="categoryName"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value.toUpperCase() })}
                placeholder="e.g., DOZER, WHEEL LOADER, EXCAVATOR"
                required
                data-testid="input-category-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryDescription">Description</Label>
              <Input
                id="categoryDescription"
                value={categoryFormData.description || ""}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                placeholder="Optional description"
                data-testid="input-category-description"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryBackground">Background Image URL</Label>
              <Input
                id="categoryBackground"
                value={categoryFormData.backgroundImage || ""}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, backgroundImage: e.target.value })}
                placeholder="e.g., /attached_assets/dozer_background.jpg"
                data-testid="input-category-background"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsEditCategoryDialogOpen(false);
                  resetCategoryForm();
                }}
                data-testid="button-cancel-category"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateCategoryMutation.isPending} data-testid="button-submit-category">
                {updateCategoryMutation.isPending ? "Updating..." : "Update Category"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteCategoryConfirmId !== null} onOpenChange={(open) => !open && setDeleteCategoryConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the category and remove the category assignment from all equipment in this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-category">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCategoryConfirmId && deleteCategoryMutation.mutate(deleteCategoryConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-category"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
