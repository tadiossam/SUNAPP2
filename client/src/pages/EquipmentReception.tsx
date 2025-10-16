import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, ClipboardCheck, Wrench, FileText, Search, AlertTriangle, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { Equipment, Garage, Employee } from "@shared/schema";

export default function EquipmentReception() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("driver-dropoff");
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch data
  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: garages } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  const { data: mechanics } = useQuery<Employee[]>({
    queryKey: ["/api/mechanics"],
  });

  const { data: receptions } = useQuery<any[]>({
    queryKey: ["/api/equipment-receptions"],
  });

  // Driver Drop-off Form State
  const [driverFormData, setDriverFormData] = useState({
    equipmentId: "",
    garageId: "",
    operatorHours: "",
    fuelLevel: "",
    issuesReported: "",
    visualDamageSummary: "",
    conditionGrade: "",
    driverName: "",
  });

  // Filter receptions based on search
  const filteredReceptions = receptions?.filter((reception) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      reception.receptionNumber?.toLowerCase().includes(searchLower) ||
      reception.driverName?.toLowerCase().includes(searchLower)
    );
  });

  // Driver drop-off mutation
  const createReceptionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/equipment-receptions", data);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/equipment-receptions"] });
      await queryClient.refetchQueries({ queryKey: ["/api/equipment-receptions"], type: 'active' });
      toast({
        title: "Reception Created",
        description: "Equipment check-in record created successfully",
      });
      resetDriverForm();
      setActiveTab("reception-list");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create reception",
        variant: "destructive",
      });
    },
  });

  const resetDriverForm = () => {
    setDriverFormData({
      equipmentId: "",
      garageId: "",
      operatorHours: "",
      fuelLevel: "",
      issuesReported: "",
      visualDamageSummary: "",
      conditionGrade: "",
      driverName: "",
    });
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data with proper types
    const submissionData = {
      ...driverFormData,
      operatorHours: driverFormData.operatorHours ? parseFloat(driverFormData.operatorHours) : undefined,
    };
    
    createReceptionMutation.mutate(submissionData);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      driver_submitted: { label: "Driver Submitted", variant: "secondary" },
      awaiting_mechanic: { label: "Awaiting Mechanic", variant: "outline" },
      inspection_complete: { label: "Inspection Complete", variant: "default" },
      work_order_created: { label: "Work Order Created", variant: "default" },
      closed: { label: "Closed", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-none border-b bg-card p-6">
        <div>
          <h1 className="text-3xl font-bold">Equipment Reception & Check-In</h1>
          <p className="text-muted-foreground mt-1">
            Manage equipment arrivals, inspections, and maintenance workflow
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4">
            <TabsTrigger value="driver-dropoff" className="gap-2">
              <Truck className="h-4 w-4" />
              Driver Drop-off
            </TabsTrigger>
            <TabsTrigger value="reception-list" className="gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Receptions
            </TabsTrigger>
            <TabsTrigger value="mechanic-inspection" className="gap-2">
              <Wrench className="h-4 w-4" />
              Inspection
            </TabsTrigger>
            <TabsTrigger value="workflow-diagram" className="gap-2">
              <FileText className="h-4 w-4" />
              Workflow
            </TabsTrigger>
          </TabsList>

          {/* Driver Drop-off Form */}
          <TabsContent value="driver-dropoff" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Equipment Arrival - Driver Check-In
                </CardTitle>
                <CardDescription>
                  Record equipment drop-off details when equipment arrives at the yard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleDriverSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="equipment">Equipment Unit *</Label>
                      <Select
                        value={driverFormData.equipmentId}
                        onValueChange={(value) => setDriverFormData({ ...driverFormData, equipmentId: value })}
                        required
                      >
                        <SelectTrigger id="equipment" data-testid="select-equipment">
                          <SelectValue placeholder="Select equipment" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment?.map((equip) => (
                            <SelectItem key={equip.id} value={equip.id}>
                              {equip.equipmentType} - {equip.model} ({equip.assetNo})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="garage">Destination Garage *</Label>
                      <Select
                        value={driverFormData.garageId}
                        onValueChange={(value) => setDriverFormData({ ...driverFormData, garageId: value })}
                        required
                      >
                        <SelectTrigger id="garage" data-testid="select-garage">
                          <SelectValue placeholder="Select garage" />
                        </SelectTrigger>
                        <SelectContent>
                          {garages?.map((garage) => (
                            <SelectItem key={garage.id} value={garage.id}>
                              {garage.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="driverName">Driver Name *</Label>
                      <Input
                        id="driverName"
                        value={driverFormData.driverName}
                        onChange={(e) => setDriverFormData({ ...driverFormData, driverName: e.target.value })}
                        placeholder="Enter driver's name"
                        required
                        data-testid="input-driver-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="operatorHours">Equipment Hours</Label>
                      <Input
                        id="operatorHours"
                        type="number"
                        step="0.1"
                        value={driverFormData.operatorHours}
                        onChange={(e) => setDriverFormData({ ...driverFormData, operatorHours: e.target.value })}
                        placeholder="0.0"
                        data-testid="input-operator-hours"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="fuelLevel">Fuel Level</Label>
                      <Select
                        value={driverFormData.fuelLevel}
                        onValueChange={(value) => setDriverFormData({ ...driverFormData, fuelLevel: value })}
                      >
                        <SelectTrigger id="fuelLevel" data-testid="select-fuel-level">
                          <SelectValue placeholder="Select fuel level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full</SelectItem>
                          <SelectItem value="3/4">3/4</SelectItem>
                          <SelectItem value="1/2">1/2</SelectItem>
                          <SelectItem value="1/4">1/4</SelectItem>
                          <SelectItem value="empty">Empty</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="conditionGrade">Condition Grade</Label>
                      <Select
                        value={driverFormData.conditionGrade}
                        onValueChange={(value) => setDriverFormData({ ...driverFormData, conditionGrade: value })}
                      >
                        <SelectTrigger id="conditionGrade" data-testid="select-condition-grade">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="excellent">Excellent</SelectItem>
                          <SelectItem value="good">Good</SelectItem>
                          <SelectItem value="fair">Fair</SelectItem>
                          <SelectItem value="poor">Poor</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="issuesReported">Issues Reported by Driver</Label>
                    <Textarea
                      id="issuesReported"
                      value={driverFormData.issuesReported}
                      onChange={(e) => setDriverFormData({ ...driverFormData, issuesReported: e.target.value })}
                      placeholder="Describe any issues, unusual sounds, performance problems..."
                      rows={3}
                      data-testid="textarea-issues-reported"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="visualDamage">Visual Damage Summary</Label>
                    <Textarea
                      id="visualDamage"
                      value={driverFormData.visualDamageSummary}
                      onChange={(e) => setDriverFormData({ ...driverFormData, visualDamageSummary: e.target.value })}
                      placeholder="Describe any visible damage, scratches, dents..."
                      rows={3}
                      data-testid="textarea-visual-damage"
                    />
                  </div>

                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={resetDriverForm}>
                      Reset
                    </Button>
                    <Button type="submit" disabled={createReceptionMutation.isPending} data-testid="button-submit-reception">
                      {createReceptionMutation.isPending ? "Submitting..." : "Submit Check-In"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reception List */}
          <TabsContent value="reception-list" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reception number or driver name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-receptions"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredReceptions && filteredReceptions.length > 0 ? (
                filteredReceptions.map((reception) => (
                  <Card key={reception.id} className="hover-elevate" data-testid={`card-reception-${reception.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg font-mono">{reception.receptionNumber}</CardTitle>
                          <CardDescription className="mt-1">
                            Driver: {reception.driverName} • {new Date(reception.dropOffTime).toLocaleString()}
                          </CardDescription>
                        </div>
                        {getStatusBadge(reception.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Fuel Level:</span>
                          <div className="font-medium">{reception.fuelLevel || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Hours:</span>
                          <div className="font-medium">{reception.operatorHours || "N/A"}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Condition:</span>
                          <div className="font-medium capitalize">{reception.conditionGrade || "N/A"}</div>
                        </div>
                      </div>
                      {reception.issuesReported && (
                        <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md">
                          <div className="flex items-start gap-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                            <div className="text-sm text-yellow-700 dark:text-yellow-400">
                              {reception.issuesReported}
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <ClipboardCheck className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Equipment Receptions</h3>
                    <p className="text-muted-foreground text-sm">
                      Start by submitting equipment check-in from the Driver Drop-off tab
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Mechanic Inspection - Placeholder */}
          <TabsContent value="mechanic-inspection">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Mechanic Inspection</h3>
                <p className="text-muted-foreground text-sm text-center max-w-md">
                  Mechanic inspection workflow with standardized checklists and damage reporting will be available here
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Diagram */}
          <TabsContent value="workflow-diagram">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Reception Workflow</CardTitle>
                <CardDescription>Complete process flow from truck yard to repair completion</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center p-6">
                <img 
                  src="/attached_assets/diagram-export-10-16-2025-9_12_25-AM_1760595242427.png" 
                  alt="Equipment Reception Workflow Diagram" 
                  className="max-w-full h-auto rounded-lg border"
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
