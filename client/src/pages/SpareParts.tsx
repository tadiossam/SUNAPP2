import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Package, Eye, AlertCircle, Upload, Image as ImageIcon, MapPin, Wrench, Clock, Video, Edit } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { ManufacturingSpecs } from "@/components/ManufacturingSpecs";
import { DimensionViewer } from "@/components/DimensionViewer";
import type { SparePart } from "@shared/schema";

export default function SparePartsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [currency, setCurrency] = useState<"USD" | "ETB">("USD");
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [editingMaintenance, setEditingMaintenance] = useState(false);
  const [maintenanceForm, setMaintenanceForm] = useState({
    locationInstructions: "",
    requiredTools: [] as string[],
    installTimeEstimates: { beginner: 0, average: 0, expert: 0 },
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Ethiopian Birr exchange rate (1 USD = 125 ETB approximately)
  const USD_TO_ETB_RATE = 125;

  // Format price based on selected currency
  const formatPrice = (priceUSD: string | null | undefined): string => {
    if (!priceUSD) return "N/A";
    const numPrice = parseFloat(priceUSD);
    
    if (currency === "ETB") {
      const priceETB = numPrice * USD_TO_ETB_RATE;
      return `${priceETB.toFixed(2)} Br`;
    }
    return `$${numPrice.toFixed(2)}`;
  };

  const { data: parts, isLoading } = useQuery<SparePart[]>({
    queryKey: ["/api/parts"],
  });

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!selectedPart) throw new Error("No part selected");
      
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('images', file);
      });

      const response = await fetch(`/api/parts/${selectedPart.id}/images`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload images');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({
        title: "Images uploaded",
        description: "Part images have been successfully uploaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload images",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadImagesMutation.mutate(files);
    }
  };

  const uploadTutorialVideoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedPart) throw new Error("No part selected");
      
      const formData = new FormData();
      formData.append('video', file);

      const response = await fetch(`/api/parts/${selectedPart.id}/tutorial`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload tutorial video');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({
        title: "Tutorial uploaded",
        description: "Tutorial video has been successfully uploaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload tutorial video",
        variant: "destructive",
      });
    },
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: async (data: typeof maintenanceForm) => {
      if (!selectedPart) throw new Error("No part selected");

      const response = await fetch(`/api/parts/${selectedPart.id}/maintenance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          locationInstructions: data.locationInstructions,
          requiredTools: data.requiredTools,
          installTimeEstimates: JSON.stringify(data.installTimeEstimates),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update maintenance information');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setEditingMaintenance(false);
      toast({
        title: "Maintenance info updated",
        description: "Maintenance information has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update failed",
        description: error instanceof Error ? error.message : "Failed to update maintenance info",
        variant: "destructive",
      });
    },
  });

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadTutorialVideoMutation.mutate(file);
    }
  };

  const startEditingMaintenance = () => {
    if (selectedPart) {
      setMaintenanceForm({
        locationInstructions: selectedPart.locationInstructions || "",
        requiredTools: selectedPart.requiredTools || [],
        installTimeEstimates: selectedPart.installTimeEstimates 
          ? JSON.parse(selectedPart.installTimeEstimates)
          : { beginner: 0, average: 0, expert: 0 },
      });
      setEditingMaintenance(true);
    }
  };

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

              <Select value={currency} onValueChange={(value: "USD" | "ETB") => setCurrency(value)}>
                <SelectTrigger className="w-[120px]" data-testid="select-currency">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD ($)</SelectItem>
                  <SelectItem value="ETB">ETB (Br)</SelectItem>
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
                {part.imageUrls && part.imageUrls.length > 0 && (
                  <div className="aspect-video w-full bg-muted overflow-hidden rounded-t-lg relative">
                    <img
                      src={part.imageUrls[0]}
                      alt={part.partName}
                      className="w-full h-full object-cover"
                      data-testid={`img-part-${part.id}`}
                    />
                    {part.imageUrls.length > 1 && (
                      <div className="absolute bottom-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-medium">
                        +{part.imageUrls.length - 1} more
                      </div>
                    )}
                  </div>
                )}
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

              {/* Image Gallery */}
              {selectedPart.imageUrls && selectedPart.imageUrls.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Part Images ({selectedPart.imageUrls.length})</h4>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadImagesMutation.isPending}
                        data-testid="button-upload-images"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadImagesMutation.isPending ? "Uploading..." : "Add More"}
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedPart.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="aspect-square bg-muted rounded-lg overflow-hidden hover-elevate cursor-pointer"
                          onClick={() => setSelectedImage(url)}
                          data-testid={`img-gallery-${idx}`}
                        >
                          <img
                            src={url}
                            alt={`${selectedPart.partName} - Image ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Upload button if no images */}
              {(!selectedPart.imageUrls || selectedPart.imageUrls.length === 0) && (
                <>
                  <Separator />
                  <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">No images yet</p>
                    <Button
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadImagesMutation.isPending}
                      data-testid="button-upload-first-images"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadImagesMutation.isPending ? "Uploading..." : "Upload Images"}
                    </Button>
                  </div>
                </>
              )}

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


              {selectedPart.model3dPath && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold mb-2">3D Model Available</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      A 3D schematic is available for this part. View it in the 3D Models section.
                    </p>
                    <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded">
                      {selectedPart.model3dPath}
                    </p>
                  </div>
                </>
              )}

              {/* Manufacturing Specifications */}
              <Separator />
              <ManufacturingSpecs part={selectedPart} />

              {/* 3D Dimension Viewer */}
              {selectedPart.manufacturingSpecs && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-semibold text-lg mb-4">Technical Dimensions</h4>
                    <DimensionViewer
                      partNumber={selectedPart.partNumber}
                      partName={selectedPart.partName}
                      specs={selectedPart.manufacturingSpecs as any}
                      imageUrl={selectedPart.imageUrls?.[0]}
                    />
                  </div>
                </>
              )}

              {/* Maintenance Information Section */}
              <Separator />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-semibold text-lg">Maintenance Guide</h4>
                  {!editingMaintenance && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={startEditingMaintenance}
                      data-testid="button-edit-maintenance"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  )}
                </div>

                {editingMaintenance ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location Instructions
                      </label>
                      <textarea
                        value={maintenanceForm.locationInstructions}
                        onChange={(e) => setMaintenanceForm({ ...maintenanceForm, locationInstructions: e.target.value })}
                        className="w-full min-h-[100px] p-3 border rounded-md text-sm"
                        placeholder="Describe where to locate this part on the machinery..."
                        data-testid="input-location-instructions"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Required Tools (comma-separated)
                      </label>
                      <Input
                        value={maintenanceForm.requiredTools.join(", ")}
                        onChange={(e) => setMaintenanceForm({ 
                          ...maintenanceForm, 
                          requiredTools: e.target.value.split(",").map(t => t.trim()).filter(Boolean)
                        })}
                        placeholder="e.g., Socket wrench set, Torque wrench, Pliers"
                        data-testid="input-required-tools"
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Installation Time Estimates (minutes)
                      </label>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-xs text-muted-foreground">Beginner</label>
                          <Input
                            type="number"
                            value={maintenanceForm.installTimeEstimates.beginner}
                            onChange={(e) => setMaintenanceForm({
                              ...maintenanceForm,
                              installTimeEstimates: {
                                ...maintenanceForm.installTimeEstimates,
                                beginner: parseInt(e.target.value) || 0
                              }
                            })}
                            data-testid="input-time-beginner"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Average</label>
                          <Input
                            type="number"
                            value={maintenanceForm.installTimeEstimates.average}
                            onChange={(e) => setMaintenanceForm({
                              ...maintenanceForm,
                              installTimeEstimates: {
                                ...maintenanceForm.installTimeEstimates,
                                average: parseInt(e.target.value) || 0
                              }
                            })}
                            data-testid="input-time-average"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">Expert</label>
                          <Input
                            type="number"
                            value={maintenanceForm.installTimeEstimates.expert}
                            onChange={(e) => setMaintenanceForm({
                              ...maintenanceForm,
                              installTimeEstimates: {
                                ...maintenanceForm.installTimeEstimates,
                                expert: parseInt(e.target.value) || 0
                              }
                            })}
                            data-testid="input-time-expert"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={() => updateMaintenanceMutation.mutate(maintenanceForm)}
                        disabled={updateMaintenanceMutation.isPending}
                        data-testid="button-save-maintenance"
                      >
                        {updateMaintenanceMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setEditingMaintenance(false)}
                        data-testid="button-cancel-maintenance"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Location Instructions */}
                    {selectedPart.locationInstructions ? (
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-primary mt-0.5" />
                          <div className="flex-1">
                            <h5 className="font-medium mb-1">Part Location</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                              {selectedPart.locationInstructions}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground italic">No location instructions added yet.</div>
                    )}

                    {/* Tutorial Video */}
                    {selectedPart.tutorialVideoUrl ? (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h5 className="font-medium flex items-center gap-2">
                            <Video className="h-4 w-4" />
                            Installation Tutorial
                          </h5>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => videoInputRef.current?.click()}
                            disabled={uploadTutorialVideoMutation.isPending}
                            data-testid="button-replace-tutorial"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {uploadTutorialVideoMutation.isPending ? "Uploading..." : "Replace"}
                          </Button>
                        </div>
                        <video
                          src={selectedPart.tutorialVideoUrl}
                          controls
                          className="w-full rounded-lg bg-black"
                          data-testid="video-tutorial"
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-6 border-2 border-dashed rounded-lg">
                        <Video className="h-10 w-10 text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground mb-3">No tutorial video yet</p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => videoInputRef.current?.click()}
                          disabled={uploadTutorialVideoMutation.isPending}
                          data-testid="button-upload-tutorial"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          {uploadTutorialVideoMutation.isPending ? "Uploading..." : "Upload Tutorial"}
                        </Button>
                      </div>
                    )}

                    {/* Required Tools */}
                    {selectedPart.requiredTools && selectedPart.requiredTools.length > 0 && (
                      <div>
                        <h5 className="font-medium mb-2 flex items-center gap-2">
                          <Wrench className="h-4 w-4" />
                          Required Tools
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {selectedPart.requiredTools.map((tool, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {tool}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Installation Time Estimates */}
                    {selectedPart.installTimeEstimates && (
                      <div>
                        <h5 className="font-medium mb-3 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Installation Time Estimates
                        </h5>
                        <div className="grid grid-cols-3 gap-3">
                          {(() => {
                            const times = JSON.parse(selectedPart.installTimeEstimates);
                            return (
                              <>
                                <div className="bg-muted/50 p-3 rounded-lg text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Beginner</div>
                                  <div className="text-2xl font-bold">{times.beginner}</div>
                                  <div className="text-xs text-muted-foreground">minutes</div>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Average</div>
                                  <div className="text-2xl font-bold">{times.average}</div>
                                  <div className="text-xs text-muted-foreground">minutes</div>
                                </div>
                                <div className="bg-muted/50 p-3 rounded-lg text-center">
                                  <div className="text-xs text-muted-foreground mb-1">Expert</div>
                                  <div className="text-2xl font-bold">{times.expert}</div>
                                  <div className="text-xs text-muted-foreground">minutes</div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden file input for images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />

      {/* Hidden file input for tutorial videos */}
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        onChange={handleVideoSelect}
        className="hidden"
        data-testid="input-video-upload"
      />

      {/* Full-screen image viewer */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative bg-black">
            {selectedImage && (
              <img
                src={selectedImage}
                alt="Full size"
                className="w-full h-auto max-h-[90vh] object-contain"
                data-testid="img-fullscreen"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
