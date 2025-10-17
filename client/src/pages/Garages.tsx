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
  const [isWorkshopDialogOpen, setIsWorkshopDialogOpen] = useState(false);
  const [selectedGarageForWorkshop, setSelectedGarageForWorkshop] = useState<GarageWithDetails | null>(null);
  const [editingWorkshop, setEditingWorkshop] = useState<any | null>(null);
  const [isEditWorkshopDialogOpen, setIsEditWorkshopDialogOpen] = useState(false);

  const { data: garages, isLoading } = useQuery<GarageWithDetails[]>({
    queryKey: ["/api/garages"],
  });

  // Get current user to check role
  const { data: authData } = useQuery<{ user: { role: string } }>({
    queryKey: ["/api/auth/me"],
  });

  // Check if user is CEO or Admin
  const isCEOorAdmin = authData?.user?.role === "CEO" || authData?.user?.role === "admin";

  // Get employees for foreman selection
  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

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

  const createWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/workshops", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      setIsWorkshopDialogOpen(false);
      setSelectedGarageForWorkshop(null);
      workshopForm.reset();
      toast({
        title: "Workshop created",
        description: "Workshop has been successfully added to the garage.",
      });
    },
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/workshops/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      setIsEditWorkshopDialogOpen(false);
      setEditingWorkshop(null);
      editWorkshopForm.reset();
      toast({
        title: "Workshop updated",
        description: "Workshop has been successfully updated.",
      });
    },
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/workshops/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/garages"] });
      toast({
        title: "Workshop deleted",
        description: "Workshop has been successfully deleted.",
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

  const workshopForm = useForm({
    defaultValues: {
      name: "",
      foremanId: "",
      description: "",
    },
  });

  const editWorkshopForm = useForm({
    defaultValues: {
      name: "",
      foremanId: "",
      description: "",
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

  const onWorkshopSubmit = (data: any) => {
    if (selectedGarageForWorkshop) {
      createWorkshopMutation.mutate({
        ...data,
        garageId: selectedGarageForWorkshop.id,
      });
    }
  };

  const onEditWorkshopSubmit = (data: any) => {
    if (editingWorkshop) {
      updateWorkshopMutation.mutate({
        id: editingWorkshop.id,
        data,
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

  const handleAddWorkshop = (garage: GarageWithDetails) => {
    setSelectedGarageForWorkshop(garage);
    setIsWorkshopDialogOpen(true);
  };

  const handleEditWorkshop = (workshop: any) => {
    setEditingWorkshop(workshop);
    editWorkshopForm.reset({
      name: workshop.name,
      foremanId: workshop.foremanId || "",
      description: workshop.description || "",
    });
    setIsEditWorkshopDialogOpen(true);
  };

  const handleDeleteWorkshop = (workshopId: string) => {
    if (confirm("Are you sure you want to delete this workshop?")) {
      deleteWorkshopMutation.mutate(workshopId);
    }
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
                {garage.workshops && garage.workshops.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium mb-2">Workshops: {garage.workshops.length}</p>
                    <div className="space-y-2">
                      {garage.workshops.map((workshop: any) => (
                        <Card key={workshop.id} className="p-2" data-testid={`card-workshop-${workshop.id}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{workshop.name}</p>
                              {workshop.foremanId && employees?.find((e) => e.id === workshop.foremanId) && (
                                <p className="text-xs text-muted-foreground">
                                  Foreman: {employees.find((e) => e.id === workshop.foremanId)?.fullName}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Members: {workshop.membersList?.length || 0}
                              </p>
                            </div>
                            {isCEOorAdmin && (
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditWorkshop(workshop);
                                  }}
                                  data-testid={`button-edit-workshop-${workshop.id}`}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteWorkshop(workshop.id);
                                  }}
                                  data-testid={`button-delete-workshop-${workshop.id}`}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  {isCEOorAdmin && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleAddWorkshop(garage)}
                      data-testid={`button-add-workshop-${garage.id}`}
                    >
                      <Wrench className="h-4 w-4 mr-2" />
                      Add Workshop
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

      {/* Add Workshop Dialog */}
      <Dialog open={isWorkshopDialogOpen} onOpenChange={setIsWorkshopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Workshop to {selectedGarageForWorkshop?.name}</DialogTitle>
          </DialogHeader>
          <Form {...workshopForm}>
            <form onSubmit={workshopForm.handleSubmit(onWorkshopSubmit)} className="space-y-4">
              <FormField
                control={workshopForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workshop Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-workshop-name"
                        placeholder="e.g., Engine Workshop, Hydraulics Shop"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workshopForm.control}
                name="foremanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foreman (Boss)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-workshop-foreman">
                          <SelectValue placeholder="Select foreman" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName} - {employee.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={workshopForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-workshop-description"
                        placeholder="Workshop description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  data-testid="button-submit-workshop"
                  disabled={createWorkshopMutation.isPending}
                >
                  {createWorkshopMutation.isPending ? t("loading") : "Add Workshop"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Workshop Dialog */}
      <Dialog open={isEditWorkshopDialogOpen} onOpenChange={setIsEditWorkshopDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
          </DialogHeader>
          <Form {...editWorkshopForm}>
            <form onSubmit={editWorkshopForm.handleSubmit(onEditWorkshopSubmit)} className="space-y-4">
              <FormField
                control={editWorkshopForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Workshop Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-workshop-name"
                        placeholder="Workshop name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkshopForm.control}
                name="foremanId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Foreman (Boss)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-workshop-foreman">
                          <SelectValue placeholder="Select foreman" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees?.map((employee) => (
                          <SelectItem key={employee.id} value={employee.id}>
                            {employee.fullName} - {employee.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editWorkshopForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-workshop-description"
                        placeholder="Workshop description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  data-testid="button-submit-edit-workshop"
                  disabled={updateWorkshopMutation.isPending}
                >
                  {updateWorkshopMutation.isPending ? t("loading") : t("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
