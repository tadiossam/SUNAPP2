import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { ArrowLeft, Search } from "lucide-react";
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

export default function EquipmentCategoryPage() {
  const [, params] = useRoute("/equipment/category/:type");
  const equipmentType = params?.type ? decodeURIComponent(params.type) : "";
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [backgroundImage, setBackgroundImage] = useState("/attached_assets/Capture_1760099408820.PNG");

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const categoryEquipment = equipment?.filter(
    (item) => item.equipmentType === equipmentType
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

  return (
    <div className="flex-1 overflow-auto">
      {/* Hero Banner Header */}
      <div 
        className="relative h-64 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})` }}
        data-testid="header-category-banner"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
        <div className="absolute inset-0 container mx-auto px-6 flex items-center justify-between">
          <div className="flex-1">
            <Link href="/equipment">
              <Button variant="ghost" size="sm" className="mb-4 text-white hover:text-white/90">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Equipment
              </Button>
            </Link>
            <h1 className="text-5xl font-bold text-white mb-2" data-testid="text-category-name">
              {equipmentType}
            </h1>
            <p className="text-white/80 text-lg">
              Complete inventory for this equipment category
            </p>
          </div>
          <div className="text-right">
            <p className="text-6xl font-bold text-white" data-testid="text-total-units">
              {categoryEquipment?.length || 0}
            </p>
            <p className="text-xl text-white/80">
              {categoryEquipment?.length === 1 ? 'Unit' : 'Units'}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-6 space-y-6">
        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by model, make, serial, asset, or plate number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
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
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-1">
                        {item.make} {item.model}
                      </h3>
                      {item.machineSerial && (
                        <p className="text-sm text-muted-foreground">
                          Serial: {item.machineSerial}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {item.assetNo && (
                      <div>
                        <span className="text-muted-foreground">Asset #:</span>
                        <p className="font-mono font-medium">{item.assetNo}</p>
                      </div>
                    )}
                    {item.plateNo && (
                      <div>
                        <span className="text-muted-foreground">Plate #:</span>
                        <p className="font-mono font-medium">{item.plateNo}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No equipment found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {searchTerm ? "Try adjusting your search terms" : "No equipment in this category"}
            </p>
          </div>
        )}
      </div>

      {/* Equipment Detail Dialog */}
      <Dialog open={selectedEquipment !== null} onOpenChange={(open) => !open && setSelectedEquipment(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-equipment-detail">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedEquipment?.make} {selectedEquipment?.model}
            </DialogTitle>
            <DialogDescription>
              Detailed information and maintenance history
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="details" data-testid="tab-details">Details</TabsTrigger>
              <TabsTrigger value="maintenance" data-testid="tab-maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="operating" data-testid="tab-operating">Operating</TabsTrigger>
              <TabsTrigger value="parts" data-testid="tab-parts">Parts Used</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Equipment Type</h4>
                  <p className="text-lg font-semibold">{selectedEquipment?.equipmentType}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Make & Model</h4>
                  <p className="text-lg font-semibold">{selectedEquipment?.make} {selectedEquipment?.model}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Machine Serial</h4>
                  <p className="font-mono">{selectedEquipment?.machineSerial || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Asset Number</h4>
                  <p className="font-mono">{selectedEquipment?.assetNo || "N/A"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Plate Number</h4>
                  <p className="font-mono">{selectedEquipment?.plateNo || "N/A"}</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-3 mt-4">
              {maintenanceRecords?.filter(r => r.equipmentId === selectedEquipment?.id).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No maintenance records found</p>
              ) : (
                maintenanceRecords
                  ?.filter(r => r.equipmentId === selectedEquipment?.id)
                  .map((record) => (
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
              {operatingReports?.filter(r => r.equipmentId === selectedEquipment?.id).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No operating reports found</p>
              ) : (
                operatingReports
                  ?.filter(r => r.equipmentId === selectedEquipment?.id)
                  .map((report) => (
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
                // Get maintenance records for this equipment
                const equipmentMaintenanceRecords = maintenanceRecords?.filter(r => r.equipmentId === selectedEquipment?.id) || [];
                const maintenanceRecordIds = equipmentMaintenanceRecords.map(r => r.id);
                
                // Filter parts usage by maintenance records for this equipment
                const equipmentPartsUsage = partsUsage?.filter(p => maintenanceRecordIds.includes(p.maintenanceRecordId)) || [];
                
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
