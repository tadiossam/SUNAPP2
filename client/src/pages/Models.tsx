import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Box, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Simple3DViewer } from "@/components/Simple3DViewer";
import type { SparePartWithCompatibility } from "@shared/schema";

export default function ModelsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPart, setSelectedPart] = useState<SparePartWithCompatibility | null>(null);

  const { data: parts, isLoading } = useQuery<SparePartWithCompatibility[]>({
    queryKey: ["/api/parts"],
  });

  // Filter only parts that have 3D models
  const partsWithModels = parts?.filter((part) => part.model3dPath);

  const filteredParts = partsWithModels?.filter((part) => {
    const matchesSearch =
      searchTerm === "" ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold">3D Model Library</h1>
            <p className="text-muted-foreground mt-1">
              Browse and view 3D schematics of spare parts
            </p>
          </div>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search 3D models by part number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
              data-testid="input-search-models"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-32 w-full rounded-md" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredParts && filteredParts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredParts.map((part) => (
              <Card key={part.id} className="hover-elevate flex flex-col" data-testid={`card-model-${part.id}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-center h-32 bg-muted rounded-md">
                    <Box className="h-16 w-16 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <CardTitle className="text-base line-clamp-2">{part.partName}</CardTitle>
                  <p className="text-xs font-mono text-muted-foreground">{part.partNumber}</p>
                  <Badge variant="outline" className="text-xs">
                    {part.category}
                  </Badge>
                </CardContent>
                <CardFooter>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPart(part)}
                    data-testid={`button-view-model-${part.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View 3D Model
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <Box className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No 3D models found</h3>
            <p className="text-muted-foreground text-sm max-w-sm">
              {partsWithModels?.length === 0
                ? "No 3D models have been uploaded yet. Upload models to view them here."
                : "Try adjusting your search to find what you're looking for."}
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedPart} onOpenChange={() => setSelectedPart(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">{selectedPart?.partName}</DialogTitle>
            <DialogDescription>
              Interactive 3D view of {selectedPart?.partName}
            </DialogDescription>
          </DialogHeader>

          {selectedPart && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">{selectedPart.category}</Badge>
                <span className="text-sm font-mono text-muted-foreground">
                  {selectedPart.partNumber}
                </span>
              </div>

              <Simple3DViewer modelPath={selectedPart.model3dPath || undefined} className="h-[400px]" />

              {selectedPart.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedPart.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-sm">
                {selectedPart.compatibleMakes && selectedPart.compatibleMakes.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Compatible Makes:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPart.compatibleMakes.map((make, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {make}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {selectedPart.compatibleModels && selectedPart.compatibleModels.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Compatible Models:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedPart.compatibleModels.map((model, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {model}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
