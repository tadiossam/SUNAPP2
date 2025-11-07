import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Loader2, RefreshCw, MapPin, Gauge, Battery, Clock, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface MellaTechVehicle {
  id: string;
  mellaTechId: string;
  name: string;
  plateNumber?: string;
  speed?: string;
  latitude?: string;
  longitude?: string;
  altitude?: string;
  batteryLevel?: string;
  distance?: string;
  status?: string;
  lastUpdate?: string;
  syncedAt: string;
}

export default function FleetTracking() {
  const { toast } = useToast();
  const [testingConnection, setTestingConnection] = useState(false);

  const { data: vehicles, isLoading } = useQuery<MellaTechVehicle[]>({
    queryKey: ["/api/mellatech/vehicles"],
  });

  const syncMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("/api/mellatech/sync", {
        method: "POST",
      });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: data.message || "Vehicles synced successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/mellatech/vehicles"] });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Sync Failed",
        description: error.message,
      });
    },
  });

  const handleTestConnection = async () => {
    setTestingConnection(true);
    try {
      const response = await fetch("/api/mellatech/test");
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Connection Failed",
          description: result.message,
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Test Failed",
        description: error.message,
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case "moving":
        return "bg-green-500";
      case "stopped":
        return "bg-red-500";
      case "idle":
        return "bg-yellow-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(date);
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-page-title">
            Fleet Tracking
          </h1>
          <p className="text-muted-foreground">
            Monitor your fleet vehicles in real-time from MellaTech
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testingConnection}
            data-testid="button-test-connection"
          >
            {testingConnection ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>
          <Button
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-vehicles"
          >
            {syncMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Vehicles
              </>
            )}
          </Button>
        </div>
      </div>

      {!vehicles || vehicles.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              No vehicles found. Click "Sync Vehicles" to fetch data from MellaTech.
            </p>
            <Button onClick={() => syncMutation.mutate()} data-testid="button-sync-empty">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Now
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {vehicles.map((vehicle) => (
            <Card key={vehicle.id} className="hover-elevate" data-testid={`card-vehicle-${vehicle.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg" data-testid={`text-vehicle-name-${vehicle.id}`}>
                      {vehicle.name}
                    </CardTitle>
                    {vehicle.plateNumber && (
                      <p className="text-sm text-muted-foreground mt-1" data-testid={`text-plate-${vehicle.id}`}>
                        {vehicle.plateNumber}
                      </p>
                    )}
                  </div>
                  {vehicle.status && (
                    <Badge
                      variant="secondary"
                      className={`${getStatusColor(vehicle.status)} text-white`}
                      data-testid={`badge-status-${vehicle.id}`}
                    >
                      {vehicle.status}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehicle.speed && parseFloat(vehicle.speed) > 0 && (
                  <div className="flex items-center gap-2 text-sm">
                    <Gauge className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-speed-${vehicle.id}`}>
                      {parseFloat(vehicle.speed).toFixed(1)} km/h
                    </span>
                  </div>
                )}

                {vehicle.latitude && vehicle.longitude && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate" data-testid={`text-coordinates-${vehicle.id}`}>
                      {parseFloat(vehicle.latitude).toFixed(5)}, {parseFloat(vehicle.longitude).toFixed(5)}
                    </span>
                  </div>
                )}

                {vehicle.batteryLevel && (
                  <div className="flex items-center gap-2 text-sm">
                    <Battery className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-battery-${vehicle.id}`}>
                      {parseFloat(vehicle.batteryLevel).toFixed(1)}V
                    </span>
                  </div>
                )}

                {vehicle.distance && (
                  <div className="flex items-center gap-2 text-sm">
                    <Truck className="h-4 w-4 text-muted-foreground" />
                    <span data-testid={`text-distance-${vehicle.id}`}>
                      {parseFloat(vehicle.distance).toFixed(2)} km
                    </span>
                  </div>
                )}

                {vehicle.lastUpdate && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                    <Clock className="h-4 w-4" />
                    <span data-testid={`text-last-update-${vehicle.id}`}>
                      {formatDate(vehicle.lastUpdate)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {vehicles && vehicles.length > 0 && (
        <div className="text-center text-sm text-muted-foreground pt-4">
          Showing {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
        </div>
      )}
    </div>
  );
}
