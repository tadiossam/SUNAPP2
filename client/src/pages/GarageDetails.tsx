import { useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Building2, 
  MapPin, 
  Users, 
  Wrench, 
  Phone, 
  User,
  CheckCircle2,
  XCircle,
  Activity
} from "lucide-react";
import type { Garage, RepairBay, Employee, WorkOrder } from "@shared/schema";

type GarageWithDetails = Garage & {
  repairBays?: RepairBay[];
  employees?: Employee[];
  workOrders?: WorkOrder[];
};

export default function GarageDetails() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: garage, isLoading } = useQuery<GarageWithDetails>({
    queryKey: [`/api/garages/${id}`],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
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
    <div className="container mx-auto p-6 space-y-6">
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Garage Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
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

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Repair Bays ({garage.repairBays?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {garage.repairBays && garage.repairBays.length > 0 ? (
              <div className="space-y-2">
                {garage.repairBays.map((bay) => (
                  <div 
                    key={bay.id} 
                    className="flex items-center justify-between p-2 rounded-md hover-elevate"
                    data-testid={`repair-bay-${bay.id}`}
                  >
                    <div>
                      <p className="font-medium">{bay.bayNumber}</p>
                      <p className="text-sm text-muted-foreground capitalize">{bay.bayType.replace(/_/g, ' ')}</p>
                    </div>
                    <Badge 
                      variant={bay.status === 'available' ? 'default' : 'secondary'}
                    >
                      {bay.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No repair bays</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Employees ({garage.employees?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {garage.employees && garage.employees.length > 0 ? (
              <div className="space-y-2">
                {garage.employees.slice(0, 5).map((employee) => (
                  <div 
                    key={employee.id} 
                    className="flex items-center gap-3 p-2 rounded-md hover-elevate"
                    data-testid={`employee-${employee.id}`}
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium">{employee.fullName}</p>
                      <p className="text-sm text-muted-foreground capitalize">{employee.role}</p>
                    </div>
                  </div>
                ))}
                {garage.employees.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    + {garage.employees.length - 5} more
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No employees assigned</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Work Orders ({garage.workOrders?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {garage.workOrders && garage.workOrders.length > 0 ? (
            <div className="space-y-2">
              {garage.workOrders.map((order) => (
                <div 
                  key={order.id} 
                  className="flex items-center justify-between p-3 rounded-md hover-elevate border"
                  data-testid={`work-order-${order.id}`}
                >
                  <div className="flex-1">
                    <p className="font-medium">{order.workOrderNumber}</p>
                    <p className="text-sm text-muted-foreground">{order.description}</p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">{order.workType}</p>
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
            <p className="text-sm text-muted-foreground">No work orders</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
