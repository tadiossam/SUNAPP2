import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Plus, MapPin, Users, Trash2, Eye, Pencil, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertGarageSchema, type InsertGarage, type GarageWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Garages() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGarage, setEditingGarage] = useState<GarageWithDetails | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isBayDialogOpen, setIsBayDialogOpen] = useState(false);
  const [selectedGarageForBay, setSelectedGarageForBay] = useState<GarageWithDetails | null>(null);

  const { data: garages, isLoading } = useQuery<GarageWithDetails[]>({
    queryKey: ["/api/garages"],
  });

  // Get current user to check role
  const { data: authData } = useQuery<{ user: { role: string } }>({
    queryKey: ["/api/auth/me"],
  });

  // Check if user is CEO or Admin
  const isCEOorAdmin = authData?.user?.role === "CEO" || authData?.user?.role === "admin";

  const createMutation = useMutation({
    mutationFn: async (data: InsertGarage) => {
      return await apiRequest("POST", "/api/garages", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: t("addGarage"),
        description: "Garage created successfully",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertGarage }) => {
      return await apiRequest("PUT", `/api/garages/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      setIsEditDialogOpen(false);
      setEditingGarage(null);
      editForm.reset();
      toast({
        title: "Garage updated",
        description: "Garage has been successfully updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/garages/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      toast({
        title: "Garage deleted",
        description: "Garage has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || "Failed to delete garage";
      toast({
        title: "Delete failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const createBayMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/repair-bays", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      setIsBayDialogOpen(false);
      setSelectedGarageForBay(null);
      bayForm.reset();
      toast({
        title: "Shop/Bay added",
        description: "Repair bay has been successfully added to the garage.",
      });
    },
  });

  const form = useForm<InsertGarage>({
    resolver: zodResolver(insertGarageSchema),
    defaultValues: {
      name: "",
      location: "",
      type: "workshop",
      capacity: 0,
      contactPerson: "",
      phoneNumber: "",
      isActive: true,
    },
  });

  const editForm = useForm<InsertGarage>({
    resolver: zodResolver(insertGarageSchema),
    defaultValues: {
      name: "",
      location: "",
      type: "workshop",
      capacity: 0,
      contactPerson: "",
      phoneNumber: "",
      isActive: true,
    },
  });

  const bayForm = useForm({
    defaultValues: {
      bayNumber: "",
      bayType: "heavy_equipment",
      status: "available",
      notes: "",
    },
  });

  const onSubmit = (data: InsertGarage) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: InsertGarage) => {
    if (editingGarage) {
      updateMutation.mutate({ id: editingGarage.id, data });
    }
  };

  const onBaySubmit = (data: any) => {
    if (selectedGarageForBay) {
      createBayMutation.mutate({
        ...data,
        garageId: selectedGarageForBay.id,
      });
    }
  };

  const handleEdit = (garage: GarageWithDetails) => {
    setEditingGarage(garage);
    editForm.reset({
      name: garage.name,
      location: garage.location,
      type: garage.type,
      capacity: garage.capacity || 0,
      contactPerson: garage.contactPerson || "",
      phoneNumber: garage.phoneNumber || "",
      isActive: garage.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const handleAddBay = (garage: GarageWithDetails) => {
    setSelectedGarageForBay(garage);
    setIsBayDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t("garages")}</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-garage">
              <Plus className="h-4 w-4 mr-2" />
              {t("addGarage")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addGarage")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("garageName")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-garage-name"
                          placeholder={t("garageName")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("location")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-garage-location"
                          placeholder={t("location")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-garage-type">
                            <SelectValue placeholder="Select garage type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="workshop">Workshop</SelectItem>
                          <SelectItem value="field_station">Field Station</SelectItem>
                          <SelectItem value="warehouse">Warehouse</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="capacity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("capacity")}</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          data-testid="input-garage-capacity"
                          placeholder={t("capacity")}
                          value={field.value || 0}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    data-testid="button-submit-garage"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? t("loading") : t("save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {garages && garages.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">{t("noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {garages?.map((garage) => (
            <Card key={garage.id} className="hover-elevate" data-testid={`card-garage-${garage.id}`}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{garage.name}</span>
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {isCEOorAdmin && (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(garage);
                          }}
                          data-testid={`button-edit-garage-${garage.id}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Are you sure you want to delete this garage?")) {
                              deleteMutation.mutate(garage.id);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-garage-${garage.id}`}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span data-testid={`text-location-${garage.id}`}>{garage.location}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span data-testid={`text-capacity-${garage.id}`}>
                    {t("capacity")}: {garage.capacity}
                  </span>
                </div>
                {garage.repairBays && garage.repairBays.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">{t("repairBays")}: {garage.repairBays.length}</p>
                    <div className="flex flex-wrap gap-2">
                      {garage.repairBays.map((bay) => (
                        <Badge
                          key={bay.id}
                          variant={bay.status === "available" ? "default" : "secondary"}
                          data-testid={`badge-bay-${bay.id}`}
                        >
                          {bay.bayNumber}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {isCEOorAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddBay(garage)}
                      data-testid={`button-add-bay-${garage.id}`}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Add Shop
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setLocation(`/garages/${garage.id}`)}
                    data-testid={`button-view-garage-${garage.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Garage Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Garage</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("garageName")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-garage-name"
                        placeholder={t("garageName")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("location")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-garage-location"
                        placeholder={t("location")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-garage-type">
                          <SelectValue placeholder="Select garage type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="workshop">Workshop</SelectItem>
                        <SelectItem value="field_station">Field Station</SelectItem>
                        <SelectItem value="warehouse">Warehouse</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="capacity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("capacity")}</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        data-testid="input-edit-garage-capacity"
                        placeholder={t("capacity")}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  data-testid="button-submit-edit-garage"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? t("loading") : t("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Shop/Bay Dialog */}
      <Dialog open={isBayDialogOpen} onOpenChange={setIsBayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Shop/Bay to {selectedGarageForBay?.name}</DialogTitle>
          </DialogHeader>
          <Form {...bayForm}>
            <form onSubmit={bayForm.handleSubmit(onBaySubmit)} className="space-y-4">
              <FormField
                control={bayForm.control}
                name="bayNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop/Bay Number</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-bay-number"
                        placeholder="e.g., Bay 1, A-1, Shop 1"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bayForm.control}
                name="bayType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bay Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bay-type">
                          <SelectValue placeholder="Select bay type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="heavy_equipment">Heavy Equipment</SelectItem>
                        <SelectItem value="light_vehicle">Light Vehicle</SelectItem>
                        <SelectItem value="diagnostic">Diagnostic</SelectItem>
                        <SelectItem value="wash">Wash</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bayForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-bay-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={bayForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-bay-notes"
                        placeholder="Additional notes about this bay"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  data-testid="button-submit-bay"
                  disabled={createBayMutation.isPending}
                >
                  {createBayMutation.isPending ? t("loading") : "Add Shop/Bay"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
