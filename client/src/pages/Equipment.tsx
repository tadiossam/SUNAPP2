import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Equipment } from "@shared/schema";

export default function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMake, setFilterMake] = useState<string>("all");

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
              <Card key={item.id} className="hover-elevate" data-testid={`card-equipment-${item.id}`}>
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
    </div>
  );
}
