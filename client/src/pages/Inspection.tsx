import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ClipboardCheck, AlertCircle } from "lucide-react";
import type { EquipmentReceptionWithDetails } from "@shared/schema";

export default function Inspection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReception, setSelectedReception] = useState<EquipmentReceptionWithDetails | null>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);

  // Get current user
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const currentUser = (authData as any)?.user;

  // Fetch all equipment receptions
  const { data: allReceptions = [], isLoading } = useQuery<EquipmentReceptionWithDetails[]>({
    queryKey: ["/api/equipment-receptions"],
  });

  // Filter receptions assigned to current user
  const assignedReceptions = allReceptions.filter(
    (reception) => 
      reception.inspectionOfficerId === currentUser?.id &&
      reception.status === "awaiting_mechanic"
  );

  const filteredReceptions = assignedReceptions.filter((reception) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reception.receptionNumber?.toLowerCase().includes(search) ||
      reception.plantNumber?.toLowerCase().includes(search) ||
      reception.equipment?.model?.toLowerCase().includes(search)
    );
  });

  const handleStartInspection = (reception: EquipmentReceptionWithDetails) => {
    setSelectedReception(reception);
    setShowInspectionDialog(true);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Loading inspections...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Equipment Inspections</h1>
          <p className="text-muted-foreground">
            Review and inspect equipment assigned to you
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          {filteredReceptions.length} Pending
        </Badge>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by reception number, plant number, or equipment..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
          data-testid="input-search-inspections"
        />
      </div>

      {/* Inspections List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Inspections</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredReceptions.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {assignedReceptions.length === 0
                  ? "No inspections assigned to you yet"
                  : "No inspections match your search"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reception Number</TableHead>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Plant Number</TableHead>
                  <TableHead>Service Type</TableHead>
                  <TableHead>Arrival Date</TableHead>
                  <TableHead>Admin Issues</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReceptions.map((reception) => (
                  <TableRow key={reception.id}>
                    <TableCell className="font-medium" data-testid={`text-reception-${reception.id}`}>
                      {reception.receptionNumber}
                    </TableCell>
                    <TableCell>{reception.equipment?.model || "N/A"}</TableCell>
                    <TableCell>{reception.plantNumber || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={reception.serviceType === "long_term" ? "destructive" : "secondary"}>
                        {reception.serviceType === "long_term" ? "Long Term" : "Short Term"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {reception.arrivalDate ? new Date(reception.arrivalDate).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {reception.adminIssuesReported || "None"}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        onClick={() => handleStartInspection(reception)}
                        data-testid={`button-inspect-${reception.id}`}
                      >
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                        Start Inspection
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Inspection Dialog */}
      <Dialog open={showInspectionDialog} onOpenChange={setShowInspectionDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Equipment Inspection - {selectedReception?.receptionNumber}</DialogTitle>
          </DialogHeader>

          {selectedReception && (
            <div className="space-y-6">
              {/* Equipment Details */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-3">
                <h3 className="font-semibold">Equipment Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Equipment:</p>
                    <p className="font-medium">{selectedReception.equipment?.model || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Plant Number:</p>
                    <p className="font-medium">{selectedReception.plantNumber || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Project Area:</p>
                    <p className="font-medium">{selectedReception.projectArea || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Kilometre Reading:</p>
                    <p className="font-medium">{selectedReception.kilometreRiding || "N/A"} km</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Fuel Level:</p>
                    <p className="font-medium">{selectedReception.fuelLevel || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Reason of Maintenance:</p>
                    <p className="font-medium">{selectedReception.reasonOfMaintenance || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Driver Reported Issues */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <h3 className="font-semibold">Driver Reported Issues</h3>
                <p className="text-sm">{selectedReception.issuesReported || "No issues reported"}</p>
              </div>

              {/* Admin Notes */}
              {selectedReception.adminIssuesReported && (
                <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                  <h3 className="font-semibold">Admin Additional Notes</h3>
                  <p className="text-sm">{selectedReception.adminIssuesReported}</p>
                </div>
              )}

              {/* Service Type */}
              <div className="border rounded-lg p-4 bg-muted/30 space-y-2">
                <h3 className="font-semibold">Service Type</h3>
                <Badge variant={selectedReception.serviceType === "long_term" ? "destructive" : "secondary"}>
                  {selectedReception.serviceType === "long_term" ? "Long Term Service" : "Short Term Service"}
                </Badge>
              </div>

              {/* Inspection Checklist - Placeholder for future implementation */}
              <div className="border rounded-lg p-4 space-y-3">
                <h3 className="font-semibold">Inspection Checklist</h3>
                <p className="text-sm text-muted-foreground">
                  Inspection checklist functionality will be implemented here.
                  You'll be able to:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li>Check engine condition</li>
                  <li>Inspect hydraulic systems</li>
                  <li>Verify electrical components</li>
                  <li>Document damage with photos</li>
                  <li>Create repair estimates</li>
                </ul>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowInspectionDialog(false)}>
                  Close
                </Button>
                <Button disabled>
                  Complete Inspection (Coming Soon)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
