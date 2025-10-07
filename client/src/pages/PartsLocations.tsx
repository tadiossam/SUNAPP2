import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, MapPin, Package, Building2, AlertTriangle } from "lucide-react";

type PartsLocation = {
  id: string;
  partId: string;
  garageId: string;
  location: string;
  quantity: number;
  minQuantity: number;
  notes: string;
  lastRestocked: string;
  createdAt: string;
};

export default function PartsLocationsPage() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: partsLocations, isLoading } = useQuery<PartsLocation[]>({
    queryKey: ["/api/parts-locations"],
  });

  const filteredLocations = partsLocations?.filter((loc) => {
    return loc.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
           loc.notes?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const isLowStock = (quantity: number, minQuantity: number) => {
    return quantity <= minQuantity;
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">{t("partsLocations")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("trackPartsStorageLocations")}
        </p>
      </div>

      {/* Search and Actions */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchPartsLocations")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-parts-locations"
                />
              </div>
            </div>
            <Button data-testid="button-add-parts-location">
              <Plus className="h-4 w-4 mr-2" />
              {t("addPartsLocation")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parts Locations Grid */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground">{t("loading")}</div>
      ) : filteredLocations && filteredLocations.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredLocations.map((loc) => (
            <Card key={loc.id} className="hover-elevate" data-testid={`card-parts-location-${loc.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{loc.location}</CardTitle>
                  </div>
                  {isLowStock(loc.quantity, loc.minQuantity) && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Low Stock
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {loc.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{loc.notes}</p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5 text-xs">
                    <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{loc.quantity} units</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>Min: {loc.minQuantity}</span>
                  </div>
                </div>
                {loc.lastRestocked && (
                  <div className="text-xs text-muted-foreground">
                    Last restocked: {new Date(loc.lastRestocked).toLocaleDateString()}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{t("noPartsLocationsFound")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
