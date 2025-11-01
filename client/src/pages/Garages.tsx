import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Building2, Plus, MapPin, Users, Trash2, Eye, Pencil, Wrench, UserCheck, ChevronDown, ChevronUp, FileText, CheckCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertGarageSchema, type InsertGarage, type GarageWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeSearchDialog } from "@/components/EmployeeSearchDialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

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
  
  // Employee search dialog states
  const [isForemanSearchOpen, setIsForemanSearchOpen] = useState(false);
  const [isMemberSearchOpen, setIsMemberSearchOpen] = useState(false);
  const [isEditForemanSearchOpen, setIsEditForemanSearchOpen] = useState(false);
  const [isEditMemberSearchOpen, setIsEditMemberSearchOpen] = useState(false);
  
  // Workshop details state
  const [expandedGarageId, setExpandedGarageId] = useState<string | null>(null);
  const [expandedWorkshopId, setExpandedWorkshopId] = useState<string | null>(null);
  const [workshopDetails, setWorkshopDetails] = useState<any>(null);
  const [isLoadingWorkshopDetails, setIsLoadingWorkshopDetails] = useState(false);

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
      memberIds: [] as string[],
      monthlyTarget: undefined as number | undefined,
      q1Target: undefined as number | undefined,
      q2Target: undefined as number | undefined,
      q3Target: undefined as number | undefined,
      q4Target: undefined as number | undefined,
      annualTarget: undefined as number | undefined,
    },
  });

  const editWorkshopForm = useForm({
    defaultValues: {
      name: "",
      foremanId: "",
      description: "",
      memberIds: [] as string[],
      monthlyTarget: undefined as number | undefined,
      q1Target: undefined as number | undefined,
      q2Target: undefined as number | undefined,
      q3Target: undefined as number | undefined,
      q4Target: undefined as number | undefined,
      annualTarget: undefined as number | undefined,
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
      const { memberIds, ...workshopData } = data;
      createWorkshopMutation.mutate({
        ...workshopData,
        garageId: selectedGarageForWorkshop.id,
        memberIds: memberIds || [],
      });
    }
  };

  const onEditWorkshopSubmit = (data: any) => {
    if (editingWorkshop) {
      const { memberIds, ...workshopData } = data;
      updateWorkshopMutation.mutate({
        id: editingWorkshop.id,
        data: {
          ...workshopData,
          memberIds: memberIds || [],
        },
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
    const memberIds = workshop.membersList?.map((m: any) => m.id) || [];
    editWorkshopForm.reset({
      name: workshop.name,
      foremanId: workshop.foremanId || "",
      description: workshop.description || "",
      memberIds: memberIds,
      monthlyTarget: workshop.monthlyTarget || undefined,
      q1Target: workshop.q1Target || undefined,
      q2Target: workshop.q2Target || undefined,
      q3Target: workshop.q3Target || undefined,
      q4Target: workshop.q4Target || undefined,
      annualTarget: workshop.annualTarget || undefined,
    });
    setIsEditWorkshopDialogOpen(true);
  };

  const handleDeleteWorkshop = (workshopId: string) => {
    if (confirm("Are you sure you want to delete this workshop?")) {
      deleteWorkshopMutation.mutate(workshopId);
    }
  };

  const handleToggleWorkshop = async (workshopId: string) => {
    if (expandedWorkshopId === workshopId) {
      setExpandedWorkshopId(null);
      setWorkshopDetails(null);
    } else {
      // Reset details immediately to avoid showing stale data
      setWorkshopDetails(null);
      setExpandedWorkshopId(workshopId);
      setIsLoadingWorkshopDetails(true);
      
      try {
        const response = await fetch(`/api/workshops/${workshopId}/details`);
        if (response.ok) {
          const data = await response.json();
          // Only update if this workshop is still the expanded one
          setExpandedWorkshopId(currentId => {
            if (currentId === workshopId) {
              setWorkshopDetails(data);
            }
            return currentId;
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to load workshop details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Error fetching workshop details:", error);
        toast({
          title: "Error",
          description: "Failed to load workshop details",
          variant: "destructive",
        });
      } finally {
        // Only set loading to false if this workshop is still expanded
        setExpandedWorkshopId(currentId => {
          if (currentId === workshopId) {
            setIsLoadingWorkshopDetails(false);
          }
          return currentId;
        });
      }
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
    <div className="h-full overflow-auto">
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
                  <Collapsible
                    open={expandedGarageId === garage.id}
                    onOpenChange={() => setExpandedGarageId(expandedGarageId === garage.id ? null : garage.id)}
                    className="pt-2 border-t"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Workshops: {garage.workshops.length}</p>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 px-2">
                          {expandedGarageId === garage.id ? (
                            <>
                              <ChevronUp className="h-4 w-4" />
                              <span className="ml-1 text-xs">Hide</span>
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4" />
                              <span className="ml-1 text-xs">Show</span>
                            </>
                          )}
                        </Button>
                      </CollapsibleTrigger>
                    </div>
                    <CollapsibleContent>
                    <div className="space-y-2">
                      {garage.workshops.map((workshop: any) => (
                        <Collapsible
                          key={workshop.id}
                          open={expandedWorkshopId === workshop.id}
                          onOpenChange={() => handleToggleWorkshop(workshop.id)}
                        >
                          <Card className="hover-elevate" data-testid={`card-workshop-${workshop.id}`}>
                            <CollapsibleTrigger asChild>
                              <div className="p-3 cursor-pointer">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <Wrench className="h-4 w-4 text-primary" />
                                      <p className="font-medium text-sm">{workshop.name}</p>
                                      {expandedWorkshopId === workshop.id ? (
                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                      ) : (
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                      {workshop.foremanId && employees?.find((e) => e.id === workshop.foremanId) && (
                                        <p className="text-xs text-muted-foreground">
                                          Foreman: {employees.find((e) => e.id === workshop.foremanId)?.fullName}
                                        </p>
                                      )}
                                      <p className="text-xs text-muted-foreground">
                                        {workshop.membersList?.length || 0} member(s)
                                      </p>
                                    </div>
                                  </div>
                                  {isCEOorAdmin && (
                                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleEditWorkshop(workshop);
                                        }}
                                        data-testid={`button-edit-workshop-${workshop.id}`}
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteWorkshop(workshop.id);
                                        }}
                                        data-testid={`button-delete-workshop-${workshop.id}`}
                                      >
                                        <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CollapsibleTrigger>
                            
                            <CollapsibleContent>
                              {isLoadingWorkshopDetails && expandedWorkshopId === workshop.id ? (
                                <div className="px-3 pb-3">
                                  <div className="text-sm text-muted-foreground text-center py-4">Loading details...</div>
                                </div>
                              ) : expandedWorkshopId === workshop.id && workshopDetails ? (
                                <div className="px-3 pb-3 space-y-3 border-t pt-3">
                                  {/* Team Members */}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Team Members ({workshopDetails.stats.totalMembers})</p>
                                    <div className="flex flex-wrap gap-1">
                                      {workshopDetails.members && workshopDetails.members.length > 0 ? (
                                        workshopDetails.members.map((member: any) => (
                                          <Badge key={member.id} variant="outline" className="text-xs">
                                            {member.fullName}
                                          </Badge>
                                        ))
                                      ) : (
                                        <p className="text-xs text-muted-foreground">No members assigned</p>
                                      )}
                                    </div>
                                  </div>

                                  {/* Work Order Stats */}
                                  <div>
                                    <p className="text-xs font-semibold text-muted-foreground mb-2">Work Orders</p>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="bg-muted rounded-md p-2 text-center">
                                        <p className="text-lg font-bold">{workshopDetails.stats.totalWorkOrders}</p>
                                        <p className="text-xs text-muted-foreground">Total</p>
                                      </div>
                                      <div className="bg-green-50 dark:bg-green-950 rounded-md p-2 text-center">
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{workshopDetails.stats.completedWorkOrders}</p>
                                        <p className="text-xs text-muted-foreground">Completed</p>
                                      </div>
                                      <div className="bg-amber-50 dark:bg-amber-950 rounded-md p-2 text-center">
                                        <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{workshopDetails.stats.totalWorkOrders - workshopDetails.stats.completedWorkOrders}</p>
                                        <p className="text-xs text-muted-foreground">Active</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Work Order Status Tabs */}
                                  {workshopDetails.workOrders && workshopDetails.workOrders.length > 0 && (
                                    <Tabs defaultValue="all" className="w-full">
                                      <TabsList className="grid w-full grid-cols-4 h-8">
                                        <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
                                        <TabsTrigger value="active" className="text-xs">Active</TabsTrigger>
                                        <TabsTrigger value="completed" className="text-xs">Done</TabsTrigger>
                                        <TabsTrigger value="pending" className="text-xs">Pending</TabsTrigger>
                                      </TabsList>
                                      
                                      <TabsContent value="all" className="mt-2 space-y-1.5">
                                        {workshopDetails.workOrders.map((wo: any) => (
                                          <div key={wo.id} className="text-xs p-2 bg-muted rounded-md flex items-center justify-between">
                                            <div className="flex-1">
                                              <p className="font-medium">{wo.workOrderNumber}</p>
                                              <p className="text-muted-foreground truncate">{wo.workType}</p>
                                            </div>
                                            <Badge className="text-xs">{wo.status.replace(/_/g, ' ')}</Badge>
                                          </div>
                                        ))}
                                      </TabsContent>
                                      
                                      <TabsContent value="active" className="mt-2 space-y-1.5">
                                        {workshopDetails.workOrders
                                          .filter((wo: any) => !['completed', 'cancelled', 'rejected'].includes(wo.status))
                                          .map((wo: any) => (
                                            <div key={wo.id} className="text-xs p-2 bg-muted rounded-md flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="font-medium">{wo.workOrderNumber}</p>
                                                <p className="text-muted-foreground truncate">{wo.workType}</p>
                                              </div>
                                              <Badge className="text-xs">{wo.status.replace(/_/g, ' ')}</Badge>
                                            </div>
                                          ))}
                                        {workshopDetails.workOrders.filter((wo: any) => !['completed', 'cancelled', 'rejected'].includes(wo.status)).length === 0 && (
                                          <p className="text-xs text-muted-foreground text-center py-2">No active work orders</p>
                                        )}
                                      </TabsContent>
                                      
                                      <TabsContent value="completed" className="mt-2 space-y-1.5">
                                        {workshopDetails.workOrders
                                          .filter((wo: any) => wo.status === 'completed')
                                          .map((wo: any) => (
                                            <div key={wo.id} className="text-xs p-2 bg-green-50 dark:bg-green-950 rounded-md flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="font-medium">{wo.workOrderNumber}</p>
                                                <p className="text-muted-foreground truncate">{wo.workType}</p>
                                              </div>
                                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                          ))}
                                        {workshopDetails.workOrders.filter((wo: any) => wo.status === 'completed').length === 0 && (
                                          <p className="text-xs text-muted-foreground text-center py-2">No completed work orders</p>
                                        )}
                                      </TabsContent>
                                      
                                      <TabsContent value="pending" className="mt-2 space-y-1.5">
                                        {workshopDetails.workOrders
                                          .filter((wo: any) => wo.status.includes('pending') || wo.status === 'draft')
                                          .map((wo: any) => (
                                            <div key={wo.id} className="text-xs p-2 bg-amber-50 dark:bg-amber-950 rounded-md flex items-center justify-between">
                                              <div className="flex-1">
                                                <p className="font-medium">{wo.workOrderNumber}</p>
                                                <p className="text-muted-foreground truncate">{wo.workType}</p>
                                              </div>
                                              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                            </div>
                                          ))}
                                        {workshopDetails.workOrders.filter((wo: any) => wo.status.includes('pending') || wo.status === 'draft').length === 0 && (
                                          <p className="text-xs text-muted-foreground text-center py-2">No pending work orders</p>
                                        )}
                                      </TabsContent>
                                    </Tabs>
                                  )}
                                </div>
                              ) : null}
                            </CollapsibleContent>
                          </Card>
                        </Collapsible>
                      ))}
                    </div>
                    </CollapsibleContent>
                  </Collapsible>
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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Workshop to {selectedGarageForWorkshop?.name}</DialogTitle>
            <DialogDescription>
              Create a new workshop with a foreman, team members, and planning targets.
            </DialogDescription>
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
                render={({ field }) => {
                  const selectedForeman = employees?.find(e => e.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Foreman (Boss) *</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setIsForemanSearchOpen(true)}
                          data-testid="button-select-foreman"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {selectedForeman ? `${selectedForeman.fullName} - ${selectedForeman.role}` : "Select foreman"}
                        </Button>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

              {/* Workshop Members Section */}
              <div className="space-y-2">
                <FormLabel>Workshop Members *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsMemberSearchOpen(true)}
                  data-testid="button-select-members"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {workshopForm.watch('memberIds')?.length 
                    ? `${workshopForm.watch('memberIds')?.length} member(s) selected`
                    : "Select team members"}
                </Button>
              </div>

              {/* Planning Targets Section */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-medium">Planning Targets (Optional)</h3>
                <p className="text-xs text-muted-foreground">Set planned work order targets for dashboard reporting</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={workshopForm.control}
                    name="monthlyTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Monthly Target</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-monthly-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workshopForm.control}
                    name="annualTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Annual Target</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-annual-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={workshopForm.control}
                    name="q1Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q1 Target (Jan-Mar)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-q1-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workshopForm.control}
                    name="q2Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q2 Target (Apr-Jun)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-q2-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workshopForm.control}
                    name="q3Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q3 Target (Jul-Sep)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-q3-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workshopForm.control}
                    name="q4Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q4 Target (Oct-Dec)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-q4-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
            <DialogDescription>
              Update workshop details, foreman, team members, and planning targets.
            </DialogDescription>
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
                render={({ field }) => {
                  const selectedForeman = employees?.find(e => e.id === field.value);
                  return (
                    <FormItem>
                      <FormLabel>Foreman (Boss) *</FormLabel>
                      <FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setIsEditForemanSearchOpen(true)}
                          data-testid="button-edit-select-foreman"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          {selectedForeman ? `${selectedForeman.fullName} - ${selectedForeman.role}` : "Select foreman"}
                        </Button>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
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

              {/* Workshop Members Section */}
              <div className="space-y-2">
                <FormLabel>Workshop Members *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setIsEditMemberSearchOpen(true)}
                  data-testid="button-edit-select-members"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {editWorkshopForm.watch('memberIds')?.length 
                    ? `${editWorkshopForm.watch('memberIds')?.length} member(s) selected`
                    : "Select team members"}
                </Button>
              </div>

              {/* Planning Targets Section */}
              <div className="border-t pt-4 space-y-3">
                <h3 className="text-sm font-medium">Planning Targets (Optional)</h3>
                <p className="text-xs text-muted-foreground">Set planned work order targets for dashboard reporting</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={editWorkshopForm.control}
                    name="monthlyTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Monthly Target</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-monthly-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editWorkshopForm.control}
                    name="annualTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Annual Target</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-annual-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={editWorkshopForm.control}
                    name="q1Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q1 Target (Jan-Mar)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-q1-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editWorkshopForm.control}
                    name="q2Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q2 Target (Apr-Jun)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-q2-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editWorkshopForm.control}
                    name="q3Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q3 Target (Jul-Sep)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-q3-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editWorkshopForm.control}
                    name="q4Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Q4 Target (Oct-Dec)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            data-testid="input-edit-q4-target"
                            value={field.value || ''}
                            onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

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

      {/* Employee Search Dialogs for Create Workshop */}
      <EmployeeSearchDialog
        open={isForemanSearchOpen}
        onOpenChange={setIsForemanSearchOpen}
        mode="single"
        title="Select Foreman"
        description="Choose a foreman/boss for this workshop"
        selectedIds={workshopForm.watch('foremanId') ? [workshopForm.watch('foremanId')] : []}
        onSelect={(ids) => {
          if (ids.length > 0) {
            workshopForm.setValue('foremanId', ids[0]);
          }
        }}
      />

      <EmployeeSearchDialog
        open={isMemberSearchOpen}
        onOpenChange={setIsMemberSearchOpen}
        mode="multiple"
        title="Select Team Members"
        description="Choose team members for this workshop"
        selectedIds={workshopForm.watch('memberIds') || []}
        excludeIds={workshopForm.watch('foremanId') ? [workshopForm.watch('foremanId')] : []}
        onSelect={(ids) => {
          workshopForm.setValue('memberIds', ids);
        }}
      />

      {/* Employee Search Dialogs for Edit Workshop */}
      <EmployeeSearchDialog
        open={isEditForemanSearchOpen}
        onOpenChange={setIsEditForemanSearchOpen}
        mode="single"
        title="Select Foreman"
        description="Choose a foreman/boss for this workshop"
        selectedIds={editWorkshopForm.watch('foremanId') ? [editWorkshopForm.watch('foremanId')] : []}
        onSelect={(ids) => {
          if (ids.length > 0) {
            editWorkshopForm.setValue('foremanId', ids[0]);
          }
        }}
      />

      <EmployeeSearchDialog
        open={isEditMemberSearchOpen}
        onOpenChange={setIsEditMemberSearchOpen}
        mode="multiple"
        title="Select Team Members"
        description="Choose team members for this workshop"
        selectedIds={editWorkshopForm.watch('memberIds') || []}
        excludeIds={editWorkshopForm.watch('foremanId') ? [editWorkshopForm.watch('foremanId')] : []}
        onSelect={(ids) => {
          editWorkshopForm.setValue('memberIds', ids);
        }}
      />
      </div>
    </div>
  );
}
