import { useQuery } from "@tanstack/react-query";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wrench, CheckCircle, Clock, Edit, UserCheck } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function WorkshopDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const workshopId = params.id;
  const { toast } = useToast();


  const { data: workshopDetails, isLoading } = useQuery<any>({
    queryKey: [`/api/workshops/${workshopId}/details`],
    enabled: !!workshopId,
  });


  const handleEditClick = () => {
    if (workshopDetails?.workshop) {
      // Navigate to edit workshop page
      setLocation(`/garages/${workshopDetails.workshop.garageId}/workshops/${workshopId}/edit`);
    }
  };


  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!workshopDetails) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Workshop not found</p>
          <Button onClick={() => setLocation("/garages")} className="mt-4">
            Back to Garages
          </Button>
        </div>
      </div>
    );
  }

  const completedOrders = workshopDetails.workOrders?.filter((wo: any) => wo.status === 'completed') || [];
  const pendingOrders = workshopDetails.workOrders?.filter((wo: any) => !['completed', 'cancelled', 'rejected'].includes(wo.status)) || [];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setLocation("/garages")}
            data-testid="button-back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Workshop Details</h1>
        </div>
        <Button
          onClick={handleEditClick}
          data-testid="button-edit-workshop"
        >
          <Edit className="h-4 w-4 mr-2" />
          Edit Workshop
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wrench className="h-6 w-6 text-primary" />
              {workshopDetails.workshop.name}
            </div>
            {workshopDetails.foreman && (
              <Badge variant="outline" className="gap-1">
                <UserCheck className="h-3 w-3" />
                Foreman: {workshopDetails.foreman.fullName}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {workshopDetails.workshop.description && (
            <p className="text-muted-foreground">{workshopDetails.workshop.description}</p>
          )}
          
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-2xl font-bold">{workshopDetails.stats.totalMembers}</p>
              <p className="text-sm text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-md">
              <p className="text-2xl font-bold">{workshopDetails.stats.totalWorkOrders}</p>
              <p className="text-sm text-muted-foreground">Total Work Orders</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-md">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{workshopDetails.stats.completedWorkOrders}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          {workshopDetails.members && workshopDetails.members.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-muted-foreground mb-2">Team Members</p>
              <div className="flex flex-wrap gap-2">
                {workshopDetails.members.map((member: any) => (
                  <Badge key={member.id} variant="outline">
                    {member.fullName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Work Orders</h2>
        <Tabs defaultValue="pending" className="w-full">
          <div className="w-full overflow-x-auto">
            <TabsList className="inline-flex w-full min-w-max lg:grid lg:w-full lg:grid-cols-2">
              <TabsTrigger value="pending">
                Pending ({pendingOrders.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed ({completedOrders.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending" className="mt-4">
            {pendingOrders.length > 0 ? (
              <div className="space-y-3">
                {pendingOrders.map((wo: any) => (
                  <Card key={wo.id} className="hover-elevate" data-testid={`card-work-order-${wo.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            <p className="font-semibold">{wo.workOrderNumber}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{wo.workType}</p>
                          {wo.description && (
                            <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4">
                          {wo.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      {wo.equipmentUnit && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Equipment:</span> {wo.equipmentUnit}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No pending work orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completedOrders.length > 0 ? (
              <div className="space-y-3">
                {completedOrders.map((wo: any) => (
                  <Card key={wo.id} className="hover-elevate bg-green-50 dark:bg-green-950" data-testid={`card-work-order-${wo.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                            <p className="font-semibold">{wo.workOrderNumber}</p>
                          </div>
                          <p className="text-sm text-muted-foreground">{wo.workType}</p>
                          {wo.description && (
                            <p className="text-sm text-muted-foreground mt-1">{wo.description}</p>
                          )}
                        </div>
                        <Badge variant="outline" className="ml-4 bg-green-100 dark:bg-green-900">
                          Completed
                        </Badge>
                      </div>
                      {wo.equipmentUnit && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <span className="font-medium">Equipment:</span> {wo.equipmentUnit}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-16 w-16 text-muted-foreground mb-4" />
                  <p className="text-lg text-muted-foreground">No completed work orders</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}
