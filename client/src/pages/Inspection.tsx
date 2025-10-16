import { useQuery, useMutation } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Search, ClipboardCheck, AlertCircle, Save, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { EquipmentReceptionWithDetails } from "@shared/schema";
import { getChecklistByServiceType, CHECKBOX_FIELDS } from "@/data/inspectionChecklists";

interface ChecklistItemState {
  itemNumber: number;
  itemDescription: string;
  hasItem: boolean;
  doesNotHave: boolean;
  isWorking: boolean;
  notWorking: boolean;
  isBroken: boolean;
  isCracked: boolean;
  additionalComments: string;
}

export default function Inspection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedReception, setSelectedReception] = useState<EquipmentReceptionWithDetails | null>(null);
  const [showInspectionDialog, setShowInspectionDialog] = useState(false);
  const [inspectionId, setInspectionId] = useState<string | null>(null);
  const [checklistItems, setChecklistItems] = useState<ChecklistItemState[]>([]);
  const [overallCondition, setOverallCondition] = useState("");
  const [findings, setFindings] = useState("");
  const [recommendations, setRecommendations] = useState("");
  const { toast } = useToast();

  // Get current user
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  const currentUser = (authData as any)?.user;

  // Fetch equipment receptions assigned to current user only
  const { data: assignedReceptions = [], isLoading } = useQuery<EquipmentReceptionWithDetails[]>({
    queryKey: ["/api/my-inspections"],
    enabled: !!currentUser?.id,
  });

  const filteredReceptions = assignedReceptions.filter((reception) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      reception.receptionNumber?.toLowerCase().includes(search) ||
      reception.plantNumber?.toLowerCase().includes(search) ||
      reception.equipment?.model?.toLowerCase().includes(search)
    );
  });

  // Create inspection mutation
  const createInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/inspections", data);
    },
    onSuccess: (data) => {
      setInspectionId(data.id);
      toast({
        title: "Inspection Started",
        description: `Inspection ${data.inspectionNumber} has been created.`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive",
      });
    },
  });

  // Update inspection mutation
  const updateInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/inspections/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Saved",
        description: "Inspection progress saved successfully",
      });
    },
  });

  // Save checklist items mutation
  const saveChecklistMutation = useMutation({
    mutationFn: async ({ inspectionId, items }: { inspectionId: string; items: any[] }) => {
      return await apiRequest("POST", `/api/inspections/${inspectionId}/checklist/bulk`, { items });
    },
    onSuccess: () => {
      toast({
        title: "Checklist Saved",
        description: "Checklist items saved successfully",
      });
    },
  });

  // Submit inspection mutation
  const submitInspectionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      return await apiRequest("PATCH", `/api/inspections/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/my-inspections"] });
      toast({
        title: "Inspection Submitted",
        description: "Inspection has been completed successfully",
      });
      setShowInspectionDialog(false);
      setSelectedReception(null);
      setInspectionId(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit inspection",
        variant: "destructive",
      });
    },
  });

  const handleStartInspection = async (reception: EquipmentReceptionWithDetails) => {
    setSelectedReception(reception);
    
    // Check if inspection already exists
    try {
      const existingInspection = await apiRequest("GET", `/api/inspections/by-reception/${reception.id}`);
      if (existingInspection) {
        setInspectionId(existingInspection.id);
        // Load existing checklist items
        const items = await apiRequest("GET", `/api/inspections/${existingInspection.id}/checklist`);
        if (items && items.length > 0) {
          setChecklistItems(items.map((item: any) => ({
            itemNumber: item.itemNumber,
            itemDescription: item.itemDescription,
            hasItem: item.hasItem || false,
            doesNotHave: item.doesNotHave || false,
            isWorking: item.isWorking || false,
            notWorking: item.notWorking || false,
            isBroken: item.isBroken || false,
            isCracked: item.isCracked || false,
            additionalComments: item.additionalComments || "",
          })));
        } else {
          initializeChecklist(reception.serviceType);
        }
        setOverallCondition(existingInspection.overallCondition || "");
        setFindings(existingInspection.findings || "");
        setRecommendations(existingInspection.recommendations || "");
      } else {
        // Create new inspection
        await createInspectionMutation.mutateAsync({
          receptionId: reception.id,
          serviceType: reception.serviceType,
          inspectorId: currentUser.id,
          status: "in_progress",
        });
        initializeChecklist(reception.serviceType);
      }
      setShowInspectionDialog(true);
    } catch (error) {
      console.error("Error loading inspection:", error);
      toast({
        title: "Error",
        description: "Failed to load inspection",
        variant: "destructive",
      });
    }
  };

  const initializeChecklist = (serviceType: string) => {
    const checklist = getChecklistByServiceType(serviceType);
    setChecklistItems(
      checklist.map((item) => ({
        itemNumber: item.number,
        itemDescription: item.descriptionAmharic,
        hasItem: false,
        doesNotHave: false,
        isWorking: false,
        notWorking: false,
        isBroken: false,
        isCracked: false,
        additionalComments: "",
      }))
    );
  };

  const handleCheckboxChange = (index: number, field: string, value: boolean) => {
    setChecklistItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleCommentChange = (index: number, value: string) => {
    setChecklistItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], additionalComments: value };
      return updated;
    });
  };

  const handleSaveProgress = async () => {
    if (!inspectionId) return;

    // Save inspection details
    await updateInspectionMutation.mutateAsync({
      id: inspectionId,
      data: {
        overallCondition,
        findings,
        recommendations,
      },
    });

    // Save checklist items
    const items = checklistItems.map((item) => ({
      inspectionId,
      itemNumber: item.itemNumber,
      itemDescription: item.itemDescription,
      hasItem: item.hasItem,
      doesNotHave: item.doesNotHave,
      isWorking: item.isWorking,
      notWorking: item.notWorking,
      isBroken: item.isBroken,
      isCracked: item.isCracked,
      additionalComments: item.additionalComments,
    }));

    await saveChecklistMutation.mutateAsync({ inspectionId, items });
  };

  const handleSubmitInspection = async () => {
    if (!inspectionId) return;

    // Save all data first
    await handleSaveProgress();

    // Submit inspection
    await submitInspectionMutation.mutateAsync({
      id: inspectionId,
      data: {
        status: "completed",
        overallCondition,
        findings,
        recommendations,
      },
    });
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
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
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
                <p className="text-sm text-muted-foreground mt-2">
                  {selectedReception.serviceType === "long_term" 
                    ? "140 items checklist" 
                    : "44 items checklist"}
                </p>
              </div>

              {/* Inspection Checklist */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Inspection Checklist (Amharic)</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">ተ.ቁ</TableHead>
                        <TableHead className="min-w-[200px]">የመሳሪያዉ ዝርዝር</TableHead>
                        <TableHead className="text-center">አለዉ</TableHead>
                        <TableHead className="text-center">የለዉም</TableHead>
                        <TableHead className="text-center">የሚሰራ</TableHead>
                        <TableHead className="text-center">የማይሰራ</TableHead>
                        <TableHead className="text-center">የተሰበረ</TableHead>
                        <TableHead className="text-center">የተሰነጠቀ</TableHead>
                        <TableHead className="min-w-[200px]">ተጨማሪ አስተያየት</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {checklistItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{item.itemNumber}</TableCell>
                          <TableCell>{item.itemDescription}</TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.hasItem}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "hasItem", checked as boolean)
                              }
                              data-testid={`checkbox-has-${index}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.doesNotHave}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "doesNotHave", checked as boolean)
                              }
                              data-testid={`checkbox-not-has-${index}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.isWorking}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "isWorking", checked as boolean)
                              }
                              data-testid={`checkbox-working-${index}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.notWorking}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "notWorking", checked as boolean)
                              }
                              data-testid={`checkbox-not-working-${index}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.isBroken}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "isBroken", checked as boolean)
                              }
                              data-testid={`checkbox-broken-${index}`}
                            />
                          </TableCell>
                          <TableCell className="text-center">
                            <Checkbox
                              checked={item.isCracked}
                              onCheckedChange={(checked) => 
                                handleCheckboxChange(index, "isCracked", checked as boolean)
                              }
                              data-testid={`checkbox-cracked-${index}`}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.additionalComments}
                              onChange={(e) => handleCommentChange(index, e.target.value)}
                              placeholder="ተጨማሪ አስተያየት"
                              className="min-w-[150px]"
                              data-testid={`input-comment-${index}`}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Inspector Summary */}
              <div className="border rounded-lg p-4 space-y-4">
                <h3 className="font-semibold">Inspector Summary</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium">Overall Condition</label>
                    <Input
                      value={overallCondition}
                      onChange={(e) => setOverallCondition(e.target.value)}
                      placeholder="Enter overall condition assessment"
                      data-testid="input-overall-condition"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Findings</label>
                    <Textarea
                      value={findings}
                      onChange={(e) => setFindings(e.target.value)}
                      placeholder="Detailed findings from inspection"
                      rows={3}
                      data-testid="textarea-findings"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Recommendations</label>
                    <Textarea
                      value={recommendations}
                      onChange={(e) => setRecommendations(e.target.value)}
                      placeholder="Recommended actions and repairs"
                      rows={3}
                      data-testid="textarea-recommendations"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between gap-3 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowInspectionDialog(false)}
                  data-testid="button-close-inspection"
                >
                  Close
                </Button>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={handleSaveProgress}
                    disabled={!inspectionId || updateInspectionMutation.isPending}
                    data-testid="button-save-progress"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Progress
                  </Button>
                  <Button
                    onClick={handleSubmitInspection}
                    disabled={!inspectionId || submitInspectionMutation.isPending}
                    data-testid="button-submit-inspection"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit Inspection
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
