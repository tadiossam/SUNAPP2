import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Archive,
  Calendar,
  Building2,
  User,
  Clock,
  FileText,
  Truck,
  Search,
  ChevronDown,
  Package,
} from "lucide-react";
import { formatDistance } from "date-fns";

type PartUsed = {
  id: string;
  quantityIssued: number;
  issuedAt: string;
  notes: string | null;
  partNumber: string | null;
  partName: string | null;
  description: string | null;
  unitOfMeasure: string | null;
};

type ArchivedWorkOrder = {
  id: string;
  workOrderNumber: string;
  equipmentId: string | null;
  equipmentModel: string | null;
  priority: string | null;
  workType: string | null;
  description: string | null;
  status: string | null;
  actualHours: string | null;
  actualCost: string | null;
  createdByName: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string | null;
  ethiopianYear: number;
  archivedAt: string;
  partsUsed: PartUsed[];
};

type EthiopianYearInfo = {
  currentEthiopianYear: number;
  nextEthiopianYear: number;
  daysUntilNewYear: number;
  newYearDate: string;
  planningTargetsLocked: boolean;
};

export default function ArchivedWorkOrders() {
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("all");

  // Fetch Ethiopian year info
  const { data: yearInfo } = useQuery<EthiopianYearInfo>({
    queryKey: ["/api/ethiopian-year/info"],
  });

  // Fetch year closure logs to get available years
  const { data: closureLogs = [] } = useQuery<any[]>({
    queryKey: ["/api/year-closure-logs"],
  });

  // Fetch archived work orders
  const { data: archivedOrders = [], isLoading } = useQuery<ArchivedWorkOrder[]>({
    queryKey: selectedYear === "all" 
      ? ["/api/archived-work-orders"]
      : ["/api/archived-work-orders", `?ethiopianYear=${selectedYear}`],
  });

  // Get list of available years from closure logs
  const availableYears = closureLogs
    .map((log) => log.closedEthiopianYear)
    .sort((a, b) => b - a);

  // Filter and search logic
  const filteredOrders = useMemo(() => {
    let filtered = [...archivedOrders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.workOrderNumber.toLowerCase().includes(query) ||
          order.equipmentModel?.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query) ||
          order.workType?.toLowerCase().includes(query) ||
          order.createdByName?.toLowerCase().includes(query)
      );
    }

    // Equipment filter
    if (selectedEquipment !== "all") {
      filtered = filtered.filter(
        (order) => order.equipmentModel === selectedEquipment
      );
    }

    return filtered;
  }, [archivedOrders, searchQuery, selectedEquipment]);

  // Group orders by equipment
  const ordersByEquipment = useMemo(() => {
    const grouped = new Map<string, ArchivedWorkOrder[]>();
    
    filteredOrders.forEach((order) => {
      const equipment = order.equipmentModel || "Unknown Equipment";
      if (!grouped.has(equipment)) {
        grouped.set(equipment, []);
      }
      grouped.get(equipment)!.push(order);
    });

    return Array.from(grouped.entries()).sort((a, b) => 
      a[0].localeCompare(b[0])
    );
  }, [filteredOrders]);

  // Get unique equipment models for filter
  const uniqueEquipment = useMemo(() => {
    const equipment = new Set(
      archivedOrders
        .map((order) => order.equipmentModel)
        .filter((model): model is string => !!model)
    );
    return Array.from(equipment).sort();
  }, [archivedOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "verified":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <div className="h-full overflow-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Archive className="h-7 w-7" />
            Archived Work Orders
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            View completed work orders from previous Ethiopian fiscal years
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Label htmlFor="year-filter" className="text-sm">
            Filter by Year:
          </Label>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[180px]" data-testid="select-year-filter">
              <SelectValue placeholder="All years" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  Year {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by work order, equipment, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            data-testid="input-search-archived"
          />
        </div>
        <Select value={selectedEquipment} onValueChange={setSelectedEquipment}>
          <SelectTrigger className="w-full md:w-[250px]" data-testid="select-equipment-filter">
            <SelectValue placeholder="All Equipment" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            {uniqueEquipment.map((equipment) => (
              <SelectItem key={equipment} value={equipment}>
                {equipment}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {searchQuery || selectedEquipment !== "all" ? "Filtered" : "Total Archived"}
            </CardTitle>
            <Archive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-archived">
              {filteredOrders.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {searchQuery || selectedEquipment !== "all" 
                ? `of ${archivedOrders.length} total`
                : selectedYear === "all" ? "All years" : `Year ${selectedYear}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Year</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-current-year">
              {yearInfo?.currentEthiopianYear || "—"}
            </div>
            <p className="text-xs text-muted-foreground">Ethiopian Calendar</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Years</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-available-years">
              {availableYears.length}
            </div>
            <p className="text-xs text-muted-foreground">Years with archived data</p>
          </CardContent>
        </Card>
      </div>

      {/* Archived Work Orders List - Grouped by Equipment */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">Loading archived work orders...</p>
          </CardContent>
        </Card>
      ) : filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Archive className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Work Orders Found</h3>
            <p className="text-sm text-muted-foreground">
              {searchQuery || selectedEquipment !== "all"
                ? "Try adjusting your filters."
                : selectedYear === "all"
                ? "No work orders have been archived yet."
                : `No work orders found for Year ${selectedYear}.`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {ordersByEquipment.map(([equipment, orders]) => (
            <Collapsible key={equipment} defaultOpen className="space-y-2">
              <Card>
                <CollapsibleTrigger className="w-full" data-testid={`trigger-equipment-${equipment}`}>
                  <CardHeader className="hover-elevate cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Truck className="h-5 w-5 text-primary" />
                        <div className="text-left">
                          <CardTitle className="text-lg">{equipment}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {orders.length} work order{orders.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform duration-200" />
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {orders.map((order) => (
            <Card key={order.id} className="hover-elevate" data-testid={`card-archived-order-${order.id}`}>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-lg">{order.workOrderNumber}</CardTitle>
                      {order.status && (
                        <Badge className={getStatusColor(order.status)}>
                          {order.status}
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                        <Calendar className="h-3 w-3 mr-1" />
                        Year {order.ethiopianYear}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Truck className="h-3 w-3" />
                      {order.equipmentModel || "No equipment info"}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Description */}
                {order.description && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Description</Label>
                    <p className="text-sm">{order.description}</p>
                  </div>
                )}

                {/* Work Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {order.workType && (
                    <div className="flex items-center gap-2 text-sm">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{order.workType}</p>
                        <p className="text-xs text-muted-foreground">Work Type</p>
                      </div>
                    </div>
                  )}

                  {order.priority && (
                    <div className="flex items-center gap-2 text-sm">
                      <Badge variant={order.priority === "high" ? "destructive" : "outline"}>
                        {order.priority}
                      </Badge>
                      <p className="text-xs text-muted-foreground">Priority</p>
                    </div>
                  )}
                </div>

                {/* Cost and Hours */}
                {(order.actualCost || order.actualHours) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                    {order.actualCost && (
                      <div className="flex items-center gap-2 text-sm">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{parseFloat(order.actualCost).toLocaleString()} ETB</p>
                          <p className="text-xs text-muted-foreground">Total Cost</p>
                        </div>
                      </div>
                    )}

                    {order.actualHours && (
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{order.actualHours} hours</p>
                          <p className="text-xs text-muted-foreground">Work Duration</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t">
                  {order.createdAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Created By</p>
                        <p className="font-medium">
                          {order.createdByName || "Unknown"}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.completedAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Completed</p>
                        <p className="font-medium">
                          {formatDistance(new Date(order.completedAt), new Date(), {
                            addSuffix: true,
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Spare Parts Used */}
                {order.partsUsed && order.partsUsed.length > 0 && (
                  <div className="space-y-2 pt-3 border-t">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-primary" />
                      <Label className="text-sm font-semibold">Spare Parts Used</Label>
                      <Badge variant="secondary">{order.partsUsed.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {order.partsUsed.map((part) => (
                        <div
                          key={part.id}
                          className="flex items-start gap-3 p-2 rounded-md bg-muted/50"
                          data-testid={`part-${part.id}`}
                        >
                          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {part.partNumber && (
                                <Badge variant="outline" className="font-mono text-xs">
                                  {part.partNumber}
                                </Badge>
                              )}
                              <span className="font-medium text-sm">
                                {part.partName || part.description || "Unknown Part"}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                              <span>
                                Qty: <span className="font-medium">{part.quantityIssued}</span>
                                {part.unitOfMeasure && ` ${part.unitOfMeasure}`}
                              </span>
                              {part.notes && (
                                <span className="truncate" title={part.notes}>
                                  Note: {part.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  );
}
