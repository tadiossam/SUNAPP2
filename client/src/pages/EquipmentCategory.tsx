import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Search, Wrench, DollarSign, Calendar, TrendingUp, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { 
  Equipment, 
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
  "DOZER": "/attached_assets/Capture_1760099408820.PNG",
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

  // Update background image when equipment type changes
  useEffect(() => {
    const newBackground = CATEGORY_BACKGROUNDS[equipmentType] || CATEGORY_BACKGROUNDS["default"];
    setBackgroundImage(newBackground);
  }, [equipmentType]);

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const categoryEquipment = equipment?.filter(
    (item) => item.equipmentType.toUpperCase().trim() === equipmentType
  );

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
            <h1 className="text-6xl font-bold text-white" data-testid="text-category-name">
              {equipmentType}
            </h1>
            
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
            <h2 className="text-4xl font-bold mb-1">{selectedEquipment?.model}</h2>
            <p className="text-lg text-muted-foreground">
              {selectedEquipment?.equipmentType} - {selectedEquipment?.make}
            </p>
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance History</TabsTrigger>
              <TabsTrigger value="parts" data-testid="tab-parts">Parts Used</TabsTrigger>
              <TabsTrigger value="operating" data-testid="tab-operating">Operating Reports</TabsTrigger>
            </TabsList>

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
    </div>
  );
}
