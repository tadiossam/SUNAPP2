import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Phone, 
  CheckCircle2,
  XCircle,
  Activity,
  Wrench,
  Users,
  Edit,
  Trash2,
  Plus
} from "lucide-react";
import type { Garage, WorkOrder, Workshop, Employee } from "@shared/schema";
import { insertWorkshopSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { EmployeeSearchDialog } from "@/components/EmployeeSearchDialog";

type GarageWithDetails = Garage & {
  workOrders?: WorkOrder[];
  workshops?: (Workshop & { 
    foreman?: Employee; 
    membersList?: Employee[];
  })[];
};

export default function GarageDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [editingWorkshop, setEditingWorkshop] = useState<any | null>(null);
  const [isEditWorkshopDialogOpen, setIsEditWorkshopDialogOpen] = useState(false);
  const [isAddWorkshopDialogOpen, setIsAddWorkshopDialogOpen] = useState(false);

  // Employee search dialog states
  const [isForemanSearchOpen, setIsForemanSearchOpen] = useState(false);
  const [isMembersSearchOpen, setIsMembersSearchOpen] = useState(false);
  const [selectedForemanId, setSelectedForemanId] = useState<string>("");
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Edit workshop employee search states
  const [isEditForemanSearchOpen, setIsEditForemanSearchOpen] = useState(false);
  const [isEditMembersSearchOpen, setIsEditMembersSearchOpen] = useState(false);
  const [editSelectedForemanId, setEditSelectedForemanId] = useState<string>("");
  const [editSelectedMemberIds, setEditSelectedMemberIds] = useState<string[]>([]);

  const { data: garage, isLoading } = useQuery<GarageWithDetails>({
    queryKey: [`/api/garages/${id}`],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const workshopForm = useForm({
    resolver: zodResolver(insertWorkshopSchema.extend({
      memberIds: z.array(z.string()).min(1, "At least one team member is required"),
    })),
    defaultValues: {
      name: "",
      foremanId: "",
      description: "",
      garageId: id,
      memberIds: [] as string[],
      monthlyTarget: undefined,
      q1Target: undefined,
      q2Target: undefined,
      q3Target: undefined,
      q4Target: undefined,
      annualTarget: undefined,
    },
  });

  const editWorkshopForm = useForm({
    resolver: zodResolver(insertWorkshopSchema.extend({
      memberIds: z.array(z.string()).min(1, "At least one team member is required"),
    })),
    defaultValues: {
      name: "",
      foremanId: "",
      description: "",
      garageId: id,
      memberIds: [] as string[],
      monthlyTarget: undefined,
      q1Target: undefined,
      q2Target: undefined,
      q3Target: undefined,
      q4Target: undefined,
      annualTarget: undefined,
    },
  });

  const createWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/workshops", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${id}`] });
      setIsAddWorkshopDialogOpen(false);
      workshopForm.reset();
      setSelectedForemanId("");
      setSelectedMemberIds([]);
      toast({
        title: "Workshop created",
        description: "Workshop has been successfully added to the garage.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create workshop",
        variant: "destructive",
      });
    },
  });

  const updateWorkshopMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PUT", `/api/workshops/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${id}`] });
      setIsEditWorkshopDialogOpen(false);
      setEditingWorkshop(null);
      editWorkshopForm.reset();
      setEditSelectedForemanId("");
      setEditSelectedMemberIds([]);
      toast({
        title: "Workshop updated",
        description: "Workshop has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workshop",
        variant: "destructive",
      });
    },
  });

  const deleteWorkshopMutation = useMutation({
    mutationFn: async (workshopId: string) => {
      return await apiRequest("DELETE", `/api/workshops/${workshopId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${id}`] });
      toast({
        title: "Workshop deleted",
        description: "Workshop has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete workshop",
        variant: "destructive",
      });
    },
  });

  const onWorkshopSubmit = (data: any) => {
    createWorkshopMutation.mutate({
      ...data,
      garageId: id,
    });
  };

  const onEditWorkshopSubmit = (data: any) => {
    if (editingWorkshop) {
      updateWorkshopMutation.mutate({
        id: editingWorkshop.id,
        data: {
          ...data,
        },
      });
    }
  };

  const handleEditWorkshop = (workshop: any) => {
    setEditingWorkshop(workshop);
    const memberIds = workshop.membersList?.map((m: Employee) => m.id) || [];
    setEditSelectedForemanId(workshop.foremanId || "");
    setEditSelectedMemberIds(memberIds);
    editWorkshopForm.reset({
      name: workshop.name,
      foremanId: workshop.foremanId,
      description: workshop.description || "",
      garageId: workshop.garageId,
      memberIds: memberIds,
      monthlyTarget: workshop.monthlyTarget ?? undefined,
      q1Target: workshop.q1Target ?? undefined,
      q2Target: workshop.q2Target ?? undefined,
      q3Target: workshop.q3Target ?? undefined,
      q4Target: workshop.q4Target ?? undefined,
      annualTarget: workshop.annualTarget ?? undefined,
    });
    setIsEditWorkshopDialogOpen(true);
  };

  const handleDeleteWorkshop = (workshopId: string, workshopName: string) => {
    if (confirm(`Are you sure you want to delete "${workshopName}"? This action cannot be undone.`)) {
      deleteWorkshopMutation.mutate(workshopId);
    }
  };

  const selectedForeman = employees.find((e) => e.id === selectedForemanId);
  const editSelectedForeman = employees.find((e) => e.id === editSelectedForemanId);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-muted-foreground">Garage not found</h2>
          <Button onClick={() => setLocation("/garages")} className="mt-4">
            Back to Garages
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setLocation("/garages")}
          data-testid="button-back-to-garages"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            {garage.name}
          </h1>
          <div className="flex items-center gap-2 mt-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{garage.location}</span>
          </div>
        </div>
        <Badge variant={garage.isActive ? "default" : "secondary"}>
          {garage.isActive ? (
            <>
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Active
            </>
          ) : (
            <>
              <XCircle className="h-3 w-3 mr-1" />
              Inactive
            </>
          )}
        </Badge>
      </div>

      {/* Garage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Garage Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div>
            <p className="text-sm text-muted-foreground">Type</p>
            <p className="font-medium capitalize">{garage.type}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Capacity</p>
            <p className="font-medium">{garage.capacity || "N/A"} units</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Contact Person</p>
            <p className="font-medium">{garage.contactPerson || "N/A"}</p>
          </div>
          {garage.phoneNumber && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium">{garage.phoneNumber}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Workshops Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Workshops ({garage.workshops?.length || 0})
            </CardTitle>
            <Button 
              onClick={() => setIsAddWorkshopDialogOpen(true)}
              size="sm"
              data-testid="button-add-workshop"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Workshop
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {garage.workshops && garage.workshops.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {garage.workshops.map((workshop) => (
                <Card key={workshop.id} className="p-4 hover-elevate" data-testid={`workshop-card-${workshop.id}`}>
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-lg">{workshop.name}</h4>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditWorkshop(workshop)}
                          data-testid={`button-edit-workshop-${workshop.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteWorkshop(workshop.id, workshop.name)}
                          data-testid={`button-delete-workshop-${workshop.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {workshop.foreman && (
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Foreman:</span>
                          <span className="font-medium">{workshop.foreman.fullName}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Members:</span>
                        <Badge variant="secondary">{workshop.membersList?.length || 0}</Badge>
                      </div>
                    </div>

                    {workshop.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {workshop.description}
                      </p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Wrench className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No workshops yet</p>
              <p className="text-sm mt-1">Click "Add Workshop" to create one</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Orders Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Work Orders ({garage.workOrders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {garage.workOrders && garage.workOrders.length > 0 ? (
            <div className="space-y-3">
              {garage.workOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-4 rounded-md hover-elevate border"
                  data-testid={`work-order-${order.id}`}
                >
                  <div className="flex-1">
                    <p className="font-semibold">{order.workOrderNumber}</p>
                    <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{order.workType?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={
                      order.priority === 'urgent' ? 'destructive' : 
                      order.priority === 'high' ? 'default' : 
                      'secondary'
                    }>
                      {order.priority}
                    </Badge>
                    <Badge variant="outline">
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No work orders</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Workshop Dialog */}
      <Dialog open={isAddWorkshopDialogOpen} onOpenChange={setIsAddWorkshopDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Add Workshop to {garage.name}</DialogTitle>
          </DialogHeader>
          <Form {...workshopForm}>
            <form onSubmit={workshopForm.handleSubmit(onWorkshopSubmit)} className="flex flex-col overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
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
                render={() => (
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
                        <Users className="h-4 w-4 mr-2" />
                        {selectedForeman ? selectedForeman.fullName : "Select foreman"}
                      </Button>
                    </FormControl>
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
                      <Textarea
                        {...field}
                        placeholder="Workshop description"
                        data-testid="input-workshop-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Workshop Members *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start mt-2"
                  onClick={() => setIsMembersSearchOpen(true)}
                  data-testid="button-select-members"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {selectedMemberIds.length > 0
                    ? `${selectedMemberIds.length} member(s) selected`
                    : "Select team members"}
                </Button>
              </div>

              {/* Planning Targets */}
              <div className="space-y-3">
                <FormLabel className="text-base">Planning Targets (Optional)</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={workshopForm.control}
                    name="monthlyTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-monthly-target"
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
                        <FormLabel>Annual</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-annual-target"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={workshopForm.control}
                    name="q1Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Q1 (Jan-Mar)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-q1-target"
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
                        <FormLabel>Q2 (Apr-Jun)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-q2-target"
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
                        <FormLabel>Q3 (Jul-Sep)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-q3-target"
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
                        <FormLabel>Q4 (Oct-Dec)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-q4-target"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddWorkshopDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  data-testid="button-submit-workshop"
                  disabled={createWorkshopMutation.isPending}
                >
                  Add Workshop
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Workshop Dialog */}
      <Dialog open={isEditWorkshopDialogOpen} onOpenChange={setIsEditWorkshopDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Workshop</DialogTitle>
          </DialogHeader>
          <Form {...editWorkshopForm}>
            <form onSubmit={editWorkshopForm.handleSubmit(onEditWorkshopSubmit)} className="flex flex-col overflow-hidden">
              <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 140px)' }}>
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
                        placeholder="e.g., Engine Workshop, Hydraulics Shop"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editWorkshopForm.control}
                name="foremanId"
                render={() => (
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
                        <Users className="h-4 w-4 mr-2" />
                        {editSelectedForeman ? editSelectedForeman.fullName : "Select foreman"}
                      </Button>
                    </FormControl>
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
                      <Textarea
                        {...field}
                        placeholder="Workshop description"
                        data-testid="input-edit-workshop-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <FormLabel>Workshop Members *</FormLabel>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start mt-2"
                  onClick={() => setIsEditMembersSearchOpen(true)}
                  data-testid="button-edit-select-members"
                >
                  <Users className="h-4 w-4 mr-2" />
                  {editSelectedMemberIds.length > 0
                    ? `${editSelectedMemberIds.length} member(s) selected`
                    : "Select team members"}
                </Button>
              </div>

              {/* Planning Targets */}
              <div className="space-y-3">
                <FormLabel className="text-base">Planning Targets (Optional)</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={editWorkshopForm.control}
                    name="monthlyTarget"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-monthly-target"
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
                        <FormLabel>Annual</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-annual-target"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editWorkshopForm.control}
                    name="q1Target"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Q1 (Jan-Mar)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-q1-target"
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
                        <FormLabel>Q2 (Apr-Jun)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-q2-target"
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
                        <FormLabel>Q3 (Jul-Sep)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-q3-target"
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
                        <FormLabel>Q4 (Oct-Dec)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="0"
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            data-testid="input-edit-q4-target"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              </div>

              <div className="flex gap-2 pt-4 mt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditWorkshopDialogOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  data-testid="button-submit-edit-workshop"
                  disabled={updateWorkshopMutation.isPending}
                >
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Employee Search Dialogs for Add Workshop */}
      <EmployeeSearchDialog
        open={isForemanSearchOpen}
        onOpenChange={setIsForemanSearchOpen}
        mode="single"
        title="Select Foreman"
        selectedIds={selectedForemanId ? [selectedForemanId] : []}
        onSelect={(ids) => {
          setSelectedForemanId(ids[0] || "");
          workshopForm.setValue("foremanId", ids[0] || "");
        }}
      />

      <EmployeeSearchDialog
        open={isMembersSearchOpen}
        onOpenChange={setIsMembersSearchOpen}
        mode="multiple"
        title="Select Team Members"
        selectedIds={selectedMemberIds}
        excludeIds={selectedForemanId ? [selectedForemanId] : []}
        onSelect={(ids) => {
          setSelectedMemberIds(ids);
          workshopForm.setValue("memberIds", ids);
        }}
      />

      {/* Employee Search Dialogs for Edit Workshop */}
      <EmployeeSearchDialog
        open={isEditForemanSearchOpen}
        onOpenChange={setIsEditForemanSearchOpen}
        mode="single"
        title="Select Foreman"
        selectedIds={editSelectedForemanId ? [editSelectedForemanId] : []}
        onSelect={(ids) => {
          setEditSelectedForemanId(ids[0] || "");
          editWorkshopForm.setValue("foremanId", ids[0] || "");
        }}
      />

      <EmployeeSearchDialog
        open={isEditMembersSearchOpen}
        onOpenChange={setIsEditMembersSearchOpen}
        mode="multiple"
        title="Select Team Members"
        selectedIds={editSelectedMemberIds}
        excludeIds={editSelectedForemanId ? [editSelectedForemanId] : []}
        onSelect={(ids) => {
          setEditSelectedMemberIds(ids);
          editWorkshopForm.setValue("memberIds", ids);
        }}
      />
      </div>
    </div>
  );
}
