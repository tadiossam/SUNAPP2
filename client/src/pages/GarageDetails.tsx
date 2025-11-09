import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
  Plus,
  Eye,
  Calendar,
  Clock,
  DollarSign
} from "lucide-react";
import type { Garage, WorkOrder, Workshop, Employee } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

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

  const [selectedWorkshopForDetails, setSelectedWorkshopForDetails] = useState<Workshop | null>(null);
  const [isWorkshopDetailsDialogOpen, setIsWorkshopDetailsDialogOpen] = useState(false);

  const { data: garage, isLoading } = useQuery<GarageWithDetails>({
    queryKey: [`/api/garages/${id}`],
  });

  // Fetch all employees (needed for foreman name lookup)
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Fetch work orders for selected workshop
  const { data: workshopWorkOrders = [] } = useQuery<WorkOrder[]>({
    queryKey: [`/api/work-orders`, { workshopId: selectedWorkshopForDetails?.id }],
    enabled: !!selectedWorkshopForDetails?.id,
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

  const handleEditWorkshop = (workshop: any) => {
    // Navigate to edit workshop page
    setLocation(`/garages/${id}/workshops/${workshop.id}/edit`);
  };

  const handleDeleteWorkshop = (workshopId: string, workshopName: string) => {
    if (confirm(`Are you sure you want to delete "${workshopName}"? This action cannot be undone.`)) {
      deleteWorkshopMutation.mutate(workshopId);
    }
  };

  const handleViewWorkshopDetails = (workshop: Workshop) => {
    setSelectedWorkshopForDetails(workshop);
    setIsWorkshopDetailsDialogOpen(true);
  };

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
              onClick={() => setLocation(`/garages/${id}/workshops/new`)}
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
              {garage.workshops.map((workshop) => {
                // Fallback for foreman name if not embedded
                const foremanName = workshop.foreman?.fullName || 
                  employees.find(e => e.id === workshop.foremanId)?.fullName || 
                  "Not assigned";
                
                return (
                  <Card 
                    key={workshop.id} 
                    className="p-4 hover-elevate cursor-pointer" 
                    data-testid={`workshop-card-${workshop.id}`}
                    onClick={() => setLocation(`/workshops/${workshop.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-semibold text-lg">{workshop.name}</h4>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditWorkshop(workshop);
                            }}
                            data-testid={`button-edit-workshop-${workshop.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteWorkshop(workshop.id, workshop.name);
                            }}
                            data-testid={`button-delete-workshop-${workshop.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Foreman:</span>
                          <span className="font-medium">{foremanName}</span>
                        </div>
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

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewWorkshopDetails(workshop);
                        }}
                        data-testid={`button-view-workshop-details-${workshop.id}`}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Work Orders
                      </Button>
                    </div>
                  </Card>
                );
              })}
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

      {/* Workshop Details Dialog - Shows Work Orders */}
      <Dialog open={isWorkshopDetailsDialogOpen} onOpenChange={setIsWorkshopDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              {selectedWorkshopForDetails?.name} - Work Orders
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {workshopWorkOrders && workshopWorkOrders.length > 0 ? (
              <div className="space-y-3">
                {workshopWorkOrders.map((order) => (
                  <Card key={order.id} className="p-4" data-testid={`workshop-work-order-${order.id}`}>
                    <div className="space-y-3">
                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{order.workOrderNumber}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{order.description}</p>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Badge variant={
                            order.status === 'completed' ? 'default' :
                            order.status === 'in_progress' ? 'default' :
                            order.status === 'cancelled' ? 'secondary' :
                            'outline'
                          }>
                            {order.status?.replace(/_/g, ' ')}
                          </Badge>
                          <Badge variant={
                            order.priority === 'urgent' ? 'destructive' : 
                            order.priority === 'high' ? 'default' : 
                            'secondary'
                          }>
                            {order.priority}
                          </Badge>
                        </div>
                      </div>

                      {/* Work Order Details Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-3 border-t">
                        {/* Work Type */}
                        <div className="flex items-center gap-2">
                          <Activity className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="text-xs text-muted-foreground">Work Type</p>
                            <p className="text-sm font-medium capitalize">{order.workType?.replace(/_/g, ' ')}</p>
                          </div>
                        </div>

                        {/* Completed Date */}
                        {order.completedAt && (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Completed</p>
                              <p className="text-sm font-medium">
                                {new Date(order.completedAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Actual Hours */}
                        {order.actualHours && (
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Actual Hours</p>
                              <p className="text-sm font-medium">{order.actualHours}h</p>
                            </div>
                          </div>
                        )}

                        {/* Total Cost */}
                        {order.actualCost && (
                          <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-xs text-muted-foreground">Total Cost</p>
                              <p className="text-sm font-medium">
                                {parseFloat(order.actualCost).toLocaleString('en-US', {
                                  style: 'currency',
                                  currency: 'ETB',
                                  minimumFractionDigits: 0,
                                })}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Cost Breakdown - if available */}
                      {(order.directMaintenanceCost || order.overtimeCost || order.outsourceCost) && (
                        <div className="pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-2">Cost Breakdown:</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {order.directMaintenanceCost && parseFloat(order.directMaintenanceCost) > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Direct: </span>
                                <span className="font-medium">
                                  {parseFloat(order.directMaintenanceCost).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'ETB',
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            )}
                            {order.overtimeCost && parseFloat(order.overtimeCost) > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Overtime: </span>
                                <span className="font-medium">
                                  {parseFloat(order.overtimeCost).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'ETB',
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            )}
                            {order.outsourceCost && parseFloat(order.outsourceCost) > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Outsource: </span>
                                <span className="font-medium">
                                  {parseFloat(order.outsourceCost).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'ETB',
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            )}
                            {order.overheadCost && parseFloat(order.overheadCost) > 0 && (
                              <div className="text-sm">
                                <span className="text-muted-foreground">Overhead: </span>
                                <span className="font-medium">
                                  {parseFloat(order.overheadCost).toLocaleString('en-US', {
                                    style: 'currency',
                                    currency: 'ETB',
                                    minimumFractionDigits: 0,
                                  })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto mb-3 opacity-50 text-muted-foreground" />
                <p className="text-muted-foreground">No work orders assigned to this workshop yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
