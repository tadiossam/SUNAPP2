import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Package, Eye, AlertCircle, Upload, Image as ImageIcon, MapPin, Wrench, Clock, Video, Edit, Trash2, X, Plus } from "lucide-react";
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
  DialogFooter,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
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
  
  // CRUD states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [partToDelete, setPartToDelete] = useState<SparePart | null>(null);
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);
  const [formData, setFormData] = useState({
    partNumber: "",
    partName: "",
    description: "",
    category: "General",
    price: "",
    stockQuantity: 0,
    stockStatus: "in_stock",
    manufacturingSpecs: "",
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

  // Get current user to check role
  const { data: authData } = useQuery<{ user: { role: string } }>({
    queryKey: ["/api/auth/me"],
  });

  // Check if user is CEO or Admin (case-insensitive)
  const userRole = authData?.user?.role?.toLowerCase();
  const isCEOorAdmin = userRole === "ceo" || userRole === "admin";

  const uploadImagesMutation = useMutation({
    mutationFn: async (files: FileList) => {
      if (!selectedPart) throw new Error("No part selected");
      
      const fileArray = Array.from(files);
      const token = localStorage.getItem('auth_token');
      
      // Step 1: Get presigned upload URLs from backend for all images
      const urlResponse = await fetch(`/api/parts/${selectedPart.id}/images/upload-urls`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ count: fileArray.length }),
      });

      if (!urlResponse.ok) {
        throw new Error('Failed to get upload URLs');
      }

      const { uploadData } = await urlResponse.json();
      
      // Step 2: Upload each file to its presigned URL
      const uploadPromises = fileArray.map((file, index) => {
        return fetch(uploadData[index].uploadURL, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        });
      });

      const uploadResults = await Promise.all(uploadPromises);
      
      // Check if all uploads succeeded
      if (uploadResults.some(result => !result.ok)) {
        throw new Error('Failed to upload one or more images');
      }

      // Step 3: Update part with image URLs (use permanent object paths, not presigned URLs)
      const objectPaths = uploadData.map((data: any) => data.objectPath);
      const updateResponse = await fetch(`/api/parts/${selectedPart.id}/images`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ imageUrls: objectPaths }),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update part with images');
      }

      return updateResponse.json();
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
      
      // Upload video to local storage
      const token = localStorage.getItem('auth_token');
      const formData = new FormData();
      formData.append('video', file);

      const uploadResponse = await fetch(`/api/parts/${selectedPart.id}/tutorial/upload-local`, {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to upload tutorial video');
      }

      return uploadResponse.json();
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

  const deleteImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      if (!selectedPart) throw new Error("No part selected");
      
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/parts/${selectedPart.id}/images`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ imageUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      toast({
        title: "Image deleted",
        description: "Image has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete image",
        variant: "destructive",
      });
    },
  });

  // Create spare part mutation
  const createPartMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/parts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Part created",
        description: "Spare part has been successfully created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Creation failed",
        description: error.message || "Failed to create spare part",
        variant: "destructive",
      });
    },
  });

  // Update spare part mutation
  const updatePartMutation = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { id, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/parts/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setIsEditDialogOpen(false);
      setEditingPart(null);
      resetForm();
      toast({
        title: "Part updated",
        description: "Spare part has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update spare part",
        variant: "destructive",
      });
    },
  });

  // Delete spare part mutation
  const deletePartMutation = useMutation({
    mutationFn: async (partId: string) => {
      const response = await apiRequest("DELETE", `/api/parts/${partId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
      setIsDeleteDialogOpen(false);
      setPartToDelete(null);
      toast({
        title: "Part deleted",
        description: "Spare part has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete spare part",
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

  const resetForm = () => {
    setFormData({
      partNumber: "",
      partName: "",
      description: "",
      category: "General",
      price: "",
      stockQuantity: 0,
      stockStatus: "in_stock",
      manufacturingSpecs: "",
    });
  };

  const openCreateDialog = () => {
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const openEditDialog = (part: SparePart) => {
    setEditingPart(part);
    setFormData({
      partNumber: part.partNumber,
      partName: part.partName,
      description: part.description || "",
      category: part.category,
      price: part.price || "",
      stockQuantity: part.stockQuantity || 0,
      stockStatus: part.stockStatus,
      manufacturingSpecs: part.manufacturingSpecs || "",
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (part: SparePart) => {
    setPartToDelete(part);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = () => {
    // Trim whitespace and validate required fields
    const trimmedPartNumber = formData.partNumber.trim();
    const trimmedPartName = formData.partName.trim();
    
    if (!trimmedPartNumber || !trimmedPartName) {
      toast({
        title: "Validation error",
        description: "Part number and part name are required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Submit with trimmed values
    createPartMutation.mutate({
      ...formData,
      partNumber: trimmedPartNumber,
      partName: trimmedPartName,
    });
  };

  const handleUpdateSubmit = () => {
    if (!editingPart) return;
    
    // Trim whitespace and validate required fields
    const trimmedPartNumber = formData.partNumber.trim();
    const trimmedPartName = formData.partName.trim();
    
    if (!trimmedPartNumber || !trimmedPartName) {
      toast({
        title: "Validation error",
        description: "Part number and part name are required fields",
        variant: "destructive",
      });
      return;
    }
    
    // Submit with trimmed values
    updatePartMutation.mutate({
      ...formData,
      partNumber: trimmedPartNumber,
      partName: trimmedPartName,
      id: editingPart.id
    });
  };

  const handleDeleteConfirm = () => {
    if (!partToDelete) return;
    deletePartMutation.mutate(partToDelete.id);
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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Spare Parts Catalog</h1>
              <p className="text-muted-foreground mt-1">
                Browse and search for compatible parts
              </p>
            </div>
            {isCEOorAdmin && (
              <Button onClick={openCreateDialog} data-testid="button-create-part">
                <Plus className="h-4 w-4 mr-2" />
                Create Part
              </Button>
            )}
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
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold text-lg">{part.price ? formatPrice(part.price) : "N/A"}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Stock:</span>
                    <span className="font-mono">{part.stockQuantity !== null ? part.stockQuantity : "N/A"}</span>
                  </div>
                  {part.description && (
                    <p className="text-muted-foreground text-xs line-clamp-2">
                      {part.description}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="pt-4 flex flex-col gap-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setSelectedPart(part)}
                    data-testid={`button-view-details-${part.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                  {isCEOorAdmin && (
                    <div className="flex gap-2 w-full">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openEditDialog(part)}
                        data-testid={`button-edit-${part.id}`}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openDeleteDialog(part)}
                        data-testid={`button-delete-${part.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  )}
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
                      {isCEOorAdmin && (
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
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {selectedPart.imageUrls.map((url, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-square bg-muted rounded-lg overflow-hidden group"
                          data-testid={`img-gallery-${idx}`}
                        >
                          <div 
                            className="w-full h-full cursor-pointer"
                            onClick={() => setSelectedImage(url)}
                          >
                            <img
                              src={url}
                              alt={`${selectedPart.partName} - Image ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {isCEOorAdmin && (
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Are you sure you want to delete this image?")) {
                                  deleteImageMutation.mutate(url);
                                }
                              }}
                              disabled={deleteImageMutation.isPending}
                              data-testid={`button-delete-image-${idx}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
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
                    {isCEOorAdmin && (
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadImagesMutation.isPending}
                        data-testid="button-upload-first-images"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadImagesMutation.isPending ? "Uploading..." : "Upload Images"}
                      </Button>
                    )}
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
                    <p className="text-2xl font-bold">{formatPrice(selectedPart.price)}</p>
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

      {/* Create Part Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Create New Spare Part</DialogTitle>
            <DialogDescription>
              Add a new spare part to the catalog
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partNumber">Part Number *</Label>
                <Input
                  id="partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="e.g., CAT-ENG-001"
                  data-testid="input-part-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partName">Part Name *</Label>
                <Input
                  id="partName"
                  value={formData.partName}
                  onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                  placeholder="e.g., Engine Oil Filter"
                  data-testid="input-part-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter part description"
                rows={3}
                data-testid="input-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Engine, Hydraulic"
                  data-testid="input-category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-stock-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stockStatus">Stock Status</Label>
                <Select
                  value={formData.stockStatus}
                  onValueChange={(value) => setFormData({ ...formData, stockStatus: value })}
                >
                  <SelectTrigger id="stockStatus" data-testid="select-stock-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="manufacturingSpecs">Manufacturing Specifications</Label>
              <Textarea
                id="manufacturingSpecs"
                value={formData.manufacturingSpecs}
                onChange={(e) => setFormData({ ...formData, manufacturingSpecs: e.target.value })}
                placeholder="Enter manufacturing specifications (JSON or text)"
                rows={3}
                data-testid="input-manufacturing-specs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} data-testid="button-cancel-create">
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createPartMutation.isPending}
              data-testid="button-submit-create"
            >
              {createPartMutation.isPending ? "Creating..." : "Create Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Part Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Spare Part</DialogTitle>
            <DialogDescription>
              Update spare part information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-partNumber">Part Number *</Label>
                <Input
                  id="edit-partNumber"
                  value={formData.partNumber}
                  onChange={(e) => setFormData({ ...formData, partNumber: e.target.value })}
                  placeholder="e.g., CAT-ENG-001"
                  data-testid="input-edit-part-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-partName">Part Name *</Label>
                <Input
                  id="edit-partName"
                  value={formData.partName}
                  onChange={(e) => setFormData({ ...formData, partName: e.target.value })}
                  placeholder="e.g., Engine Oil Filter"
                  data-testid="input-edit-part-name"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter part description"
                rows={3}
                data-testid="input-edit-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-category">Category</Label>
                <Input
                  id="edit-category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Engine, Hydraulic"
                  data-testid="input-edit-category"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price (USD)</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="0.00"
                  data-testid="input-edit-price"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-stockQuantity">Stock Quantity</Label>
                <Input
                  id="edit-stockQuantity"
                  type="number"
                  value={formData.stockQuantity}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  data-testid="input-edit-stock-quantity"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-stockStatus">Stock Status</Label>
                <Select
                  value={formData.stockStatus}
                  onValueChange={(value) => setFormData({ ...formData, stockStatus: value })}
                >
                  <SelectTrigger id="edit-stockStatus" data-testid="select-edit-stock-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-manufacturingSpecs">Manufacturing Specifications</Label>
              <Textarea
                id="edit-manufacturingSpecs"
                value={formData.manufacturingSpecs}
                onChange={(e) => setFormData({ ...formData, manufacturingSpecs: e.target.value })}
                placeholder="Enter manufacturing specifications (JSON or text)"
                rows={3}
                data-testid="input-edit-manufacturing-specs"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} data-testid="button-cancel-edit">
              Cancel
            </Button>
            <Button
              onClick={handleUpdateSubmit}
              disabled={updatePartMutation.isPending}
              data-testid="button-submit-edit"
            >
              {updatePartMutation.isPending ? "Updating..." : "Update Part"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the spare part
              <strong> {partToDelete?.partName} ({partToDelete?.partNumber})</strong> from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePartMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deletePartMutation.isPending ? "Deleting..." : "Delete Part"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
