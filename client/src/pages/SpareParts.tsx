import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Package, Eye, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import type { SparePart } from "@shared/schema";

export default function SparePartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);

  const { data: parts, isLoading } = useQuery<SparePart[]>({
    queryKey: ["/api/parts"],
  });

  const filteredParts = parts?.filter((part) => {
    const matchesSearch =
      searchTerm === "" ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === "all" || part.category === filterCategory;
    const matchesStatus = filterStatus === "all" || part.stockStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(parts?.map((p) => p.category) || []));

  const getStockBadgeVariant = (status: string) => {
    switch (status) {
      case "in_stock":
        return "default";
      case "low_stock":
        return "secondary";
      case "out_of_stock":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStockLabel = (status: string) => {
    switch (status) {
      case "in_stock":
        return "In Stock";
      case "low_stock":
        return "Low Stock";
      case "out_of_stock":
        return "Out of Stock";
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">Spare Parts Catalog</h1>
            <p className="text-muted-foreground mt-1">
              Browse and search for compatible parts
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by part number, name, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
                data-testid="input-search-parts"
              />
            </div>

            <div className="flex gap-2">
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-[180px]" data-testid="select-category">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[140px]" data-testid="select-status">
                  <SelectValue placeholder="Stock Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="low_stock">Low Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
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
        ) : filteredParts && filteredParts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredParts.map((part) => (
              <Card key={part.id} className="hover-elevate flex flex-col" data-testid={`card-part-${part.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate">{part.partName}</CardTitle>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {part.partNumber}
                      </p>
                    </div>
                    <Badge variant={getStockBadgeVariant(part.stockStatus)} className="text-xs">
                      {getStockLabel(part.stockStatus)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3 text-sm">
                  <div>
                    <Badge variant="outline" className="text-xs">
                      {part.category}
                    </Badge>
                  </div>
                  {part.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {part.description}
                    </p>
                  )}
                  {part.price && (
                    <div className="flex items-center justify-between pt-2">
                      <span className="text-muted-foreground">Price:</span>
                      <span className="font-semibold text-lg">${part.price}</span>
                    </div>
                  )}
                  {part.stockQuantity !== null && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Quantity:</span>
                      <span className="font-mono">{part.stockQuantity}</span>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-4">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPart(part)}
                    data-testid={`button-view-details-${part.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No parts found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              Try adjusting your search or filter criteria to find what you're looking for.
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedPart?.partName}</DialogTitle>
            <DialogDescription className="font-mono text-sm">
              Part Number: {selectedPart?.partNumber}
            </DialogDescription>
          </DialogHeader>

          {selectedPart && (
            <div className="space-y-6">
              <div className="flex gap-2">
                <Badge variant={getStockBadgeVariant(selectedPart.stockStatus)}>
                  {getStockLabel(selectedPart.stockStatus)}
                </Badge>
                <Badge variant="outline">{selectedPart.category}</Badge>
              </div>

              {selectedPart.description && (
                <div>
                  <h4 className="font-semibold mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                {selectedPart.price && (
                  <div>
                    <span className="text-sm text-muted-foreground">Price</span>
                    <p className="text-2xl font-bold">${selectedPart.price}</p>
                  </div>
                )}
                {selectedPart.stockQuantity !== null && (
                  <div>
                    <span className="text-sm text-muted-foreground">Stock Quantity</span>
                    <p className="text-2xl font-mono font-bold">{selectedPart.stockQuantity}</p>
                  </div>
                )}
              </div>

              {(selectedPart.compatibleMakes || selectedPart.compatibleModels) && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold">Compatibility</h4>
                    {selectedPart.compatibleMakes && selectedPart.compatibleMakes.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Makes:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPart.compatibleMakes.map((make, idx) => (
                            <Badge key={idx} variant="secondary">
                              {make}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {selectedPart.compatibleModels && selectedPart.compatibleModels.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">Models:</span>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {selectedPart.compatibleModels.map((model, idx) => (
                            <Badge key={idx} variant="outline">
                              {model}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}

              {selectedPart.model3dPath && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">3D Model Available</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A 3D schematic is available for this part.
                    </p>
                    <Button variant="default" className="w-full" data-testid="button-view-3d">
                      <Package className="h-4 w-4 mr-2" />
                      View 3D Model
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
