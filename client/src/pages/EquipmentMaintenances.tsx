import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ClipboardList, Edit, Search, User } from "lucide-react";
import type { EquipmentReceptionWithDetails, Employee } from "@shared/schema";

export default function EquipmentMaintenances() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedReception, setSelectedReception] = useState<EquipmentReceptionWithDetails | null>(null);
  const [employeeDialogOpen, setEmployeeDialogOpen] = useState(false);
  const [selectedInspectionOfficer, setSelectedInspectionOfficer] = useState<Employee | null>(null);

  const [formData, setFormData] = useState({
    serviceType: "",
    adminIssuesReported: "",
    inspectionOfficerId: "",
  });

  // Fetch all equipment receptions
  const { data: receptions = [], isLoading } = useQuery<EquipmentReceptionWithDetails[]>({
    queryKey: ["/api/equipment-receptions"],
  });

  // Fetch employees for inspection officer selection
  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Update reception mutation
  const updateReceptionMutation = useMutation({
    mutationFn: async (data: { 
      id: string; 
      updates: { 
        serviceType?: string; 
        adminIssuesReported?: string; 
        inspectionOfficerId?: string;
        status?: string;
      } 
    }) => {
      return await apiRequest("PATCH", `/api/equipment-receptions/${data.id}`, data.updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment-receptions"] });
      toast({
        title: "Success",
        description: "Equipment maintenance form updated successfully",
      });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update equipment maintenance",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      serviceType: "",
      adminIssuesReported: "",
      inspectionOfficerId: "",
    });
    setSelectedReception(null);
    setSelectedInspectionOfficer(null);
  };

  const handleEdit = (reception: EquipmentReceptionWithDetails) => {
    setSelectedReception(reception);
    setFormData({
      serviceType: reception.serviceType || "",
      adminIssuesReported: reception.adminIssuesReported || "",
      inspectionOfficerId: reception.inspectionOfficerId || "",
    });
    
    // Find and set the inspection officer if already assigned
    if (reception.inspectionOfficerId) {
      const officer = employees.find(emp => emp.id === reception.inspectionOfficerId);
      if (officer) {
        setSelectedInspectionOfficer(officer);
      }
    }
    
    setEditDialogOpen(true);
  };

  const handleInspectionOfficerSelect = (employee: Employee) => {
    setSelectedInspectionOfficer(employee);
    setFormData({ ...formData, inspectionOfficerId: employee.id });
    setEmployeeDialogOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReception) return;
    
    if (!formData.serviceType) {
      toast({
        title: "Validation Error",
        description: "Please select a service type",
        variant: "destructive",
      });
      return;
    }

    if (!formData.inspectionOfficerId) {
      toast({
        title: "Validation Error",
        description: "Please assign an inspection officer",
        variant: "destructive",
      });
      return;
    }

    updateReceptionMutation.mutate({
      id: selectedReception.id,
      updates: {
        serviceType: formData.serviceType,
        adminIssuesReported: formData.adminIssuesReported,
        inspectionOfficerId: formData.inspectionOfficerId,
        status: "awaiting_mechanic", // Update status when admin processes
      },
    });
  };

  const filteredReceptions = receptions.filter((reception) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reception.receptionNumber?.toLowerCase().includes(search) ||
      reception.plantNumber?.toLowerCase().includes(search) ||
      reception.equipment?.model?.toLowerCase().includes(search)
    );
  });

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
          <h1 className="text-3xl font-bold">Equipment Maintenances Form</h1>
          <p className="text-muted-foreground mt-1">
            Process equipment arrivals and assign to inspection officers
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by reception number, plant number, or equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-maintenances"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : filteredReceptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ClipboardList className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No equipment arrivals found</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reception #</TableHead>
                <TableHead>Equipment</TableHead>
                <TableHead>Plant #</TableHead>
                <TableHead>Arrival Date</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Inspection Officer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReceptions.map((reception) => {
                const inspectionOfficer = reception.inspectionOfficerId 
                  ? employees.find(emp => emp.id === reception.inspectionOfficerId)
                  : null;
                
                return (
                  <TableRow key={reception.id}>
                    <TableCell className="font-medium" data-testid={`text-reception-${reception.id}`}>
                      {reception.receptionNumber}
                    </TableCell>
                    <TableCell>{reception.equipment?.model || "N/A"}</TableCell>
                    <TableCell>{reception.plantNumber || "N/A"}</TableCell>
                    <TableCell>
                      {reception.arrivalDate ? new Date(reception.arrivalDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell>
                      {reception.serviceType ? (
                        <Badge variant="outline">
                          {reception.serviceType === "long_term" ? "Long Term" : "Short Term"}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">Not Set</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {inspectionOfficer ? (
                        <span>{inspectionOfficer.fullName}</span>
                      ) : (
                        <span className="text-muted-foreground">Not Assigned</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(reception.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(reception)}
                        data-testid={`button-edit-${reception.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Process Equipment Maintenance - {selectedReception?.receptionNumber}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Original Driver Submission Info */}
            <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
              <h3 className="font-semibold">Driver Submission Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Equipment:</p>
                  <p className="font-medium">{selectedReception?.equipment?.model || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Plant Number:</p>
                  <p className="font-medium">{selectedReception?.plantNumber || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Project Area:</p>
                  <p className="font-medium">{selectedReception?.projectArea || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Kilometre Reading:</p>
                  <p className="font-medium">{selectedReception?.kilometreRiding || "N/A"} km</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Fuel Level:</p>
                  <p className="font-medium">{selectedReception?.fuelLevel || "N/A"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Reason:</p>
                  <p className="font-medium">{selectedReception?.reasonOfMaintenance || "N/A"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Driver's Issues Reported:</p>
                  <p className="font-medium">{selectedReception?.issuesReported || "None"}</p>
                </div>
              </div>
            </div>

            {/* Service Type */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Service Type *</Label>
              <RadioGroup
                value={formData.serviceType}
                onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                className="flex gap-6"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="long_term" id="long_term" data-testid="radio-long-term" />
                  <Label htmlFor="long_term" className="cursor-pointer">Long Term</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="short_term" id="short_term" data-testid="radio-short-term" />
                  <Label htmlFor="short_term" className="cursor-pointer">Short Term</Label>
                </div>
              </RadioGroup>
            </div>

            {/* Admin Issues Reported */}
            <div className="space-y-2">
              <Label htmlFor="adminIssues" className="text-base font-semibold">
                Issues Reported by Administration Officer
              </Label>
              <Textarea
                id="adminIssues"
                value={formData.adminIssuesReported}
                onChange={(e) => setFormData({ ...formData, adminIssuesReported: e.target.value })}
                placeholder="Enter any additional issues found by administration officer..."
                rows={4}
                data-testid="textarea-admin-issues"
              />
            </div>

            {/* Inspection Officer Assignment */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Assign Inspection Officer *</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setEmployeeDialogOpen(true)}
                data-testid="button-select-inspector"
              >
                <User className="h-4 w-4 mr-2" />
                {selectedInspectionOfficer ? (
                  <span>{selectedInspectionOfficer.fullName} - {selectedInspectionOfficer.role}</span>
                ) : (
                  <span className="text-muted-foreground">Click to Select Inspection Officer</span>
                )}
              </Button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditDialogOpen(false);
                  resetForm();
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateReceptionMutation.isPending}
                data-testid="button-submit-maintenance"
              >
                {updateReceptionMutation.isPending ? "Submitting..." : "Submit for Inspection"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Employee Selection Dialog */}
      <Dialog open={employeeDialogOpen} onOpenChange={setEmployeeDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Inspection Officer</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>{employee.fullName}</TableCell>
                    <TableCell>{employee.role}</TableCell>
                    <TableCell>{employee.department || "N/A"}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInspectionOfficerSelect(employee)}
                        data-testid={`button-select-employee-${employee.id}`}
                      >
                        Select
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
