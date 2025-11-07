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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Truck, ClipboardCheck, Wrench, FileText, Search, Loader2, Calendar, X } from "lucide-react";
import type { Equipment, Employee } from "@shared/schema";

export default function EquipmentReception() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("driver-dropoff");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [driverDialogOpen, setDriverDialogOpen] = useState(false);
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState("");
  const [driverSearchTerm, setDriverSearchTerm] = useState("");

  // Fetch data
  const { data: equipment } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const { data: employees } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: receptions } = useQuery<any[]>({
    queryKey: ["/api/equipment-receptions"],
  });

  // Driver Drop-off Form State
  const [driverFormData, setDriverFormData] = useState({
    equipmentId: "",
    driverId: "",
    plantNumber: "",
    projectArea: "",
    arrivalDate: new Date().toISOString().slice(0, 16), // Today's date in datetime-local format
    kilometreRiding: "",
    fuelLevel: "",
    reasonOfMaintenance: "",
    issuesReported: "",
  });

  // Selected items for display
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [selectedDriver, setSelectedDriver] = useState<Employee | null>(null);

  // Filter equipment based on search
  const filteredEquipment = equipment?.filter((equip) => {
    if (!equipmentSearchTerm) return true;
    const searchLower = equipmentSearchTerm.toLowerCase();
    return (
      equip.equipmentType?.toLowerCase().includes(searchLower) ||
      equip.model?.toLowerCase().includes(searchLower) ||
      equip.make?.toLowerCase().includes(searchLower) ||
      equip.assetNo?.toLowerCase().includes(searchLower) ||
      equip.plateNo?.toLowerCase().includes(searchLower)
    );
  });

  // Filter drivers based on search
  const filteredDrivers = employees?.filter((emp) => {
    if (!driverSearchTerm) return true;
    const searchLower = driverSearchTerm.toLowerCase();
    return (
      emp.fullName?.toLowerCase().includes(searchLower) ||
      emp.employeeId?.toLowerCase().includes(searchLower) ||
      emp.role?.toLowerCase().includes(searchLower)
    );
  });

  // Filter receptions based on search
  const filteredReceptions = receptions?.filter((reception) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      reception.receptionNumber?.toLowerCase().includes(searchLower) ||
      reception.plantNumber?.toLowerCase().includes(searchLower)
    );
  });

  // Handle equipment selection
  const handleEquipmentSelect = async (equip: Equipment) => {
    setSelectedEquipment(equip);
    
    let updatedFormData = {
      ...driverFormData,
      equipmentId: equip.id,
      plantNumber: equip.plantNumber || "",
      projectArea: equip.projectArea || "",
    };
    
    // Auto-fetch assigned driver if equipment has one
    if (equip.assignedDriverId && employees) {
      const assignedDriver = employees.find(emp => emp.id === equip.assignedDriverId);
      if (assignedDriver) {
        setSelectedDriver(assignedDriver);
        updatedFormData.driverId = assignedDriver.id;
      } else {
        setSelectedDriver(null);
        updatedFormData.driverId = "";
      }
    } else {
      setSelectedDriver(null);
      updatedFormData.driverId = "";
    }

    // Fetch fleet data by plate number if available
    if (equip.plateNo) {
      try {
        const response = await fetch(`/api/mellatech/vehicles/by-plate/${encodeURIComponent(equip.plateNo)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          },
        });
        
        if (response.ok) {
          const vehicleData = await response.json();
          if (vehicleData.found && vehicleData.distance) {
            updatedFormData.kilometreRiding = vehicleData.distance.toString();
            toast({
              title: "Fleet Data Found",
              description: `Auto-filled kilometer reading: ${vehicleData.distance} km from GPS tracking`,
            });
          } else if (!vehicleData.found) {
            toast({
              title: "Fleet Data Not Available",
              description: `No GPS tracking data found for plate ${equip.plateNo}. Please enter kilometer reading manually.`,
              variant: "default",
            });
          }
        } else {
          toast({
            title: "Fleet Data Unavailable",
            description: "Unable to retrieve GPS tracking data. Please enter kilometer reading manually.",
            variant: "default",
          });
        }
      } catch (error) {
        console.log("Fleet data not available for this plate number");
        toast({
          title: "Fleet Data Service Unavailable",
          description: "GPS tracking service is not responding. Please enter kilometer reading manually.",
          variant: "default",
        });
      }
    }
    
    setDriverFormData(updatedFormData);
    setEquipmentDialogOpen(false);
    setEquipmentSearchTerm("");
  };

  // Handle driver selection
  const handleDriverSelect = (driver: Employee) => {
    setSelectedDriver(driver);
    setDriverFormData({
      ...driverFormData,
      driverId: driver.id,
    });
    setDriverDialogOpen(false);
    setDriverSearchTerm("");
  };

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
      driverId: "",
      plantNumber: "",
      projectArea: "",
      arrivalDate: new Date().toISOString().slice(0, 16),
      kilometreRiding: "",
      fuelLevel: "",
      reasonOfMaintenance: "",
      issuesReported: "",
    });
    setSelectedEquipment(null);
    setSelectedDriver(null);
  };

  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare data with proper types
    const submissionData = {
      ...driverFormData,
      arrivalDate: new Date(driverFormData.arrivalDate).toISOString(),
      kilometreRiding: driverFormData.kilometreRiding ? String(driverFormData.kilometreRiding) : undefined,
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
                    {/* Equipment Unit Selection */}
                    <div className="space-y-2">
                      <Label>Equipment Unit *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setEquipmentDialogOpen(true)}
                        data-testid="button-select-equipment"
                      >
                        {selectedEquipment ? (
                          <span className="truncate">
                            {selectedEquipment.equipmentType} - {selectedEquipment.model} ({selectedEquipment.assetNo})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Click to Select Equipment Unit</span>
                        )}
                      </Button>
                    </div>

                    {/* Plant Number (readonly, auto-populated) */}
                    <div className="space-y-2">
                      <Label htmlFor="plantNumber">Plant Number</Label>
                      <Input
                        id="plantNumber"
                        value={driverFormData.plantNumber}
                        readOnly
                        placeholder="Auto-populated from equipment"
                        className="bg-muted"
                        data-testid="input-plant-number"
                      />
                    </div>

                    {/* Project Area (readonly, auto-populated) */}
                    <div className="space-y-2">
                      <Label htmlFor="projectArea">Project Area</Label>
                      <Input
                        id="projectArea"
                        value={driverFormData.projectArea}
                        readOnly
                        placeholder="Auto-populated from equipment"
                        className="bg-muted"
                        data-testid="input-project-area"
                      />
                    </div>

                    {/* Driver Selection */}
                    <div className="space-y-2">
                      <Label>Driver Name *</Label>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        onClick={() => setDriverDialogOpen(true)}
                        data-testid="button-select-driver"
                      >
                        {selectedDriver ? (
                          <span className="truncate">
                            {selectedDriver.fullName} ({selectedDriver.employeeId})
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Click to Select Driver</span>
                        )}
                      </Button>
                    </div>

                    {/* Arrival Date */}
                    <div className="space-y-2">
                      <Label htmlFor="arrivalDate" className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Arrival Date *
                      </Label>
                      <Input
                        id="arrivalDate"
                        type="datetime-local"
                        value={driverFormData.arrivalDate}
                        onChange={(e) => setDriverFormData({ ...driverFormData, arrivalDate: e.target.value })}
                        required
                        data-testid="input-arrival-date"
                      />
                    </div>

                    {/* Kilometre Riding */}
                    <div className="space-y-2">
                      <Label htmlFor="kilometreRiding">Kilometre Riding</Label>
                      <Input
                        id="kilometreRiding"
                        type="text"
                        inputMode="decimal"
                        pattern="[0-9]*\.?[0-9]*"
                        value={driverFormData.kilometreRiding}
                        onChange={(e) => setDriverFormData({ ...driverFormData, kilometreRiding: e.target.value })}
                        placeholder="Enter kilometrage"
                        data-testid="input-kilometre-riding"
                      />
                    </div>

                    {/* Fuel Level */}
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

                    {/* Reason Of Maintenance */}
                    <div className="space-y-2">
                      <Label htmlFor="reasonOfMaintenance">Reason Of Maintenance *</Label>
                      <Select
                        value={driverFormData.reasonOfMaintenance}
                        onValueChange={(value) => setDriverFormData({ ...driverFormData, reasonOfMaintenance: value })}
                        required
                      >
                        <SelectTrigger id="reasonOfMaintenance" data-testid="select-reason">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Accident">Accident</SelectItem>
                          <SelectItem value="Damage">Damage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Issues Reported by Driver */}
                  <div className="space-y-2">
                    <Label htmlFor="issuesReported">Issues Reported by Driver</Label>
                    <Textarea
                      id="issuesReported"
                      value={driverFormData.issuesReported}
                      onChange={(e) => setDriverFormData({ ...driverFormData, issuesReported: e.target.value })}
                      placeholder="Describe any issues or problems with the equipment..."
                      className="min-h-[100px]"
                      data-testid="textarea-issues-reported"
                    />
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={resetDriverForm}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createReceptionMutation.isPending}
                      data-testid="button-submit-reception"
                    >
                      {createReceptionMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        "Submit Reception"
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reception List */}
          <TabsContent value="reception-list" className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by reception number or plant number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-receptions"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredReceptions?.length === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">No receptions found</p>
                  </CardContent>
                </Card>
              )}

              {filteredReceptions?.map((reception: any) => (
                <Card key={reception.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{reception.receptionNumber}</CardTitle>
                        <CardDescription className="mt-1">
                          Plant: {reception.plantNumber} | Project: {reception.projectArea}
                        </CardDescription>
                      </div>
                      {getStatusBadge(reception.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Arrival Date</p>
                        <p className="font-medium">{reception.arrivalDate ? new Date(reception.arrivalDate).toLocaleDateString() : "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Reason</p>
                        <p className="font-medium">{reception.reasonOfMaintenance || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kilometrage</p>
                        <p className="font-medium">{reception.kilometreRiding || "N/A"} km</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Fuel Level</p>
                        <p className="font-medium">{reception.fuelLevel || "N/A"}</p>
                      </div>
                    </div>
                    {reception.issuesReported && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">Reported Issues:</p>
                        <p className="text-sm text-muted-foreground mt-1">{reception.issuesReported}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Mechanic Inspection - Placeholder */}
          <TabsContent value="mechanic-inspection">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Mechanic Inspection Coming Soon</p>
                <p className="text-muted-foreground mt-1">Checklist and inspection workflow will be available here</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Workflow Diagram */}
          <TabsContent value="workflow-diagram">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Reception Workflow</CardTitle>
                <CardDescription>Complete process from truck yard entry to repair completion</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground">Workflow diagram will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Equipment Selection Dialog */}
      <Dialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Equipment Unit</DialogTitle>
            <DialogDescription>
              Choose the equipment unit that is being checked in
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by type, model, make, or asset number..."
                value={equipmentSearchTerm}
                onChange={(e) => setEquipmentSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-equipment"
              />
            </div>

            {/* Equipment List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {filteredEquipment?.map((equip) => (
                  <div
                    key={equip.id}
                    className="p-4 hover-elevate cursor-pointer flex items-center justify-between"
                    onClick={() => handleEquipmentSelect(equip)}
                    data-testid={`equipment-option-${equip.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {equip.equipmentType} - {equip.model}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Make: {equip.make} | Asset: {equip.assetNo} | Plate: {equip.plateNo}
                      </p>
                      {(equip.plantNumber || equip.projectArea) && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {equip.plantNumber && `Plant: ${equip.plantNumber}`}
                          {equip.plantNumber && equip.projectArea && " | "}
                          {equip.projectArea && `Project: ${equip.projectArea}`}
                        </p>
                      )}
                    </div>
                    {selectedEquipment?.id === equip.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Driver Selection Dialog */}
      <Dialog open={driverDialogOpen} onOpenChange={setDriverDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Driver</DialogTitle>
            <DialogDescription>
              Choose the driver who is checking in the equipment
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee ID, or role..."
                value={driverSearchTerm}
                onChange={(e) => setDriverSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-driver"
              />
            </div>

            {/* Driver List */}
            <div className="flex-1 overflow-y-auto border rounded-lg">
              <div className="divide-y">
                {filteredDrivers?.map((driver) => (
                  <div
                    key={driver.id}
                    className="p-4 hover-elevate cursor-pointer flex items-center justify-between"
                    onClick={() => handleDriverSelect(driver)}
                    data-testid={`driver-option-${driver.id}`}
                  >
                    <div className="flex-1">
                      <p className="font-medium">{driver.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {driver.employeeId} | Role: {driver.role}
                      </p>
                    </div>
                    {selectedDriver?.id === driver.id && (
                      <Badge variant="default">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
