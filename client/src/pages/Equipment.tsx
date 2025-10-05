import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter, Calendar, Wrench, TrendingUp, DollarSign } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import type { 
  Equipment, 
  MaintenanceRecordWithDetails, 
  OperatingBehaviorReport,
  PartsUsageHistory,
  SparePart 
} from "@shared/schema";

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMake, setFilterMake] = useState<string>("all");
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);

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

  const equipmentTypes = Array.from(new Set(equipment?.map((e) => e.equipmentType) || []));
  const makes = Array.from(new Set(equipment?.map((e) => e.make) || []));

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">Equipment Inventory</h1>
            <p className="text-muted-foreground mt-1">
              Manage your heavy equipment fleet
            </p>
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
        ) : filteredEquipment && filteredEquipment.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEquipment.map((item) => (
              <Card 
                key={item.id} 
                className="hover-elevate cursor-pointer" 
                data-testid={`card-equipment-${item.id}`}
                onClick={() => setSelectedEquipment(item)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">{item.model}</CardTitle>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {item.equipmentType}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-muted-foreground">Make:</span>
                      <span className="ml-2 font-medium">{item.make}</span>
                    </div>
                    {item.plateNo && (
                      <div>
                        <span className="text-muted-foreground">Plate:</span>
                        <span className="ml-2 font-mono text-xs">{item.plateNo}</span>
                      </div>
                    )}
                  </div>
                  {item.machineSerial && (
                    <div>
                      <span className="text-muted-foreground">Serial:</span>
                      <span className="ml-2 font-mono text-xs">{item.machineSerial}</span>
                    </div>
                  )}
                  {item.assetNo && (
                    <div>
                      <span className="text-muted-foreground">Asset:</span>
                      <span className="ml-2 font-mono text-xs">{item.assetNo}</span>
                    </div>
                  )}
                  {item.newAssetNo && (
                    <div>
                      <span className="text-muted-foreground">New Asset:</span>
                      <span className="ml-2 font-mono text-xs">{item.newAssetNo}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
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
                <div className="text-sm text-muted-foreground">Plate Number</div>
                <div className="font-mono text-sm">{equipment.plateNo || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Serial Number</div>
                <div className="font-mono text-sm">{equipment.machineSerial || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Asset Number</div>
                <div className="font-mono text-sm">{equipment.assetNo || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">New Asset Number</div>
                <div className="font-mono text-sm">{equipment.newAssetNo || "N/A"}</div>
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
