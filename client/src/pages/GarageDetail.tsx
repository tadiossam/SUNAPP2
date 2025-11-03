import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, Users, Wrench } from "lucide-react";
import type { GarageWithDetails } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function GarageDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const garageId = params.id;

  const { data: garage, isLoading } = useQuery<GarageWithDetails>({
    queryKey: [`/api/garages/${garageId}`],
    enabled: !!garageId,
  });

  const { data: employees } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!garage) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Garage not found</p>
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
          variant="outline"
          size="icon"
          onClick={() => setLocation("/garages")}
          data-testid="button-back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">Garage Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            {garage.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{garage.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>Capacity: {garage.capacity}</span>
          </div>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Workshops</h2>
        {garage.workshops && garage.workshops.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {garage.workshops.map((workshop: any) => (
              <Card
                key={workshop.id}
                className="hover-elevate cursor-pointer"
                onClick={() => setLocation(`/workshops/${workshop.id}`)}
                data-testid={`card-workshop-${workshop.id}`}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary" />
                    <span className="text-lg">{workshop.name}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {workshop.foremanId && employees?.find((e) => e.id === workshop.foremanId) && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Foreman:</span>{" "}
                      {employees.find((e) => e.id === workshop.foremanId)?.fullName}
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium">Team Members:</span>{" "}
                    {workshop.membersList?.length || 0}
                  </div>
                  {workshop.description && (
                    <div className="text-sm text-muted-foreground mt-2">
                      {workshop.description}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Wrench className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">No workshops found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
