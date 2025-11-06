import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/LanguageContext";
import { nanoid } from "nanoid";

type RequestPartsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrderId: string;
  workOrderNumber: string;
  workshopId?: string;
};

type LineItem = {
  id: string;
  lineNumber: number;
  sparePartId?: string;
  description: string;
  unitOfMeasure: string;
  quantityRequested: number;
  remarks: string;
};

export function RequestPartsDialog({
  open,
  onOpenChange,
  workOrderId,
  workOrderNumber,
  workshopId,
}: RequestPartsDialogProps) {
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [lines, setLines] = useState<LineItem[]>([
    {
      id: nanoid(),
      lineNumber: 1,
      description: "",
      unitOfMeasure: "pcs",
      quantityRequested: 1,
      remarks: "",
    },
  ]);

  // Fetch spare parts for autocomplete
  const { data: spareParts = [] } = useQuery<any[]>({
    queryKey: ["/api/parts"],
    enabled: open,
  });

  const createRequisitionMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/item-requisitions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/item-requisitions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/work-orders"] });
      toast({
        title: language === "am" ? "ተሳክቷል" : "Success",
        description: language === "am" 
          ? "የእቃ ጥያቄ በተሳካ ሁኔታ ተፈጥሯል" 
          : "Parts requisition created successfully",
      });
      onOpenChange(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: language === "am" ? "ስህተት" : "Error",
        description: error.message || (language === "am" ? "የእቃ ጥያቄ መፍጠር አልተሳካም" : "Failed to create requisition"),
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setLines([
      {
        id: nanoid(),
        lineNumber: 1,
        description: "",
        unitOfMeasure: "pcs",
        quantityRequested: 1,
        remarks: "",
      },
    ]);
  };

  const addLine = () => {
    const newLineNumber = lines.length + 1;
    setLines([
      ...lines,
      {
        id: nanoid(),
        lineNumber: newLineNumber,
        description: "",
        unitOfMeasure: "pcs",
        quantityRequested: 1,
        remarks: "",
      },
    ]);
  };

  const removeLine = (id: string) => {
    if (lines.length === 1) {
      toast({
        title: language === "am" ? "ማስጠንቀቂያ" : "Warning",
        description: language === "am" ? "ቢያንስ አንድ ወረፋ ያስፈልጋል" : "At least one line item is required",
        variant: "destructive",
      });
      return;
    }
    const updatedLines = lines
      .filter((line) => line.id !== id)
      .map((line, index) => ({ ...line, lineNumber: index + 1 }));
    setLines(updatedLines);
  };

  const updateLine = (id: string, field: keyof LineItem, value: any) => {
    setLines(lines.map((line) => (line.id === id ? { ...line, [field]: value } : line)));
  };

  const handlePartSelect = (lineId: string, partId: string) => {
    const part = spareParts.find((p) => p.id === partId);
    if (part) {
      setLines(
        lines.map((line) =>
          line.id === lineId
            ? {
                ...line,
                sparePartId: partId,
                description: `${part.partName} (${part.partNumber})`,
                unitOfMeasure: part.unitOfMeasure || "pcs",
              }
            : line
        )
      );
    }
  };

  const handleSubmit = () => {
    // Validation
    const hasEmptyDescription = lines.some((line) => !line.description.trim());
    if (hasEmptyDescription) {
      toast({
        title: language === "am" ? "ማስጠንቀቂያ" : "Validation Error",
        description: language === "am" 
          ? "ሁሉም ወረፎች መግለጫ ሊኖራቸው ይገባል" 
          : "All line items must have a description",
        variant: "destructive",
      });
      return;
    }

    const hasInvalidQuantity = lines.some((line) => line.quantityRequested < 1);
    if (hasInvalidQuantity) {
      toast({
        title: language === "am" ? "ማስጠንቀቂያ" : "Validation Error",
        description: language === "am" 
          ? "መጠን ቢያንስ 1 መሆን አለበት" 
          : "Quantity must be at least 1",
        variant: "destructive",
      });
      return;
    }

    const requisitionData = {
      workOrderId,
      workshopId: workshopId || null,
      status: "pending_foreman",
      lines: lines.map((line) => ({
        lineNumber: line.lineNumber,
        sparePartId: line.sparePartId || null,
        description: line.description,
        unitOfMeasure: line.unitOfMeasure,
        quantityRequested: line.quantityRequested,
        remarks: line.remarks || null,
        status: "pending",
      })),
    };

    createRequisitionMutation.mutate(requisitionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {language === "am" ? "የእቃ ጥያቄ ቅጽ" : "Item Requisition Form"}
          </DialogTitle>
          <DialogDescription>
            {language === "am" 
              ? `የሥራ ትዕዛዝ ${workOrderNumber} - የሚፈልጓቸውን እቃዎች ዝርዝር ያስገቡ` 
              : `Work Order ${workOrderNumber} - Request parts needed for this job`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Line Items */}
          <div className="space-y-3">
            {lines.map((line, index) => (
              <Card key={line.id}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-semibold text-primary">
                      {line.lineNumber}
                    </div>
                    <div className="flex-1 grid gap-3">
                      {/* Part Selection */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>
                            {language === "am" ? "ከካታሎግ ምረጥ" : "Select from Catalog"}
                          </Label>
                          <Select
                            value={line.sparePartId || ""}
                            onValueChange={(value) => handlePartSelect(line.id, value)}
                          >
                            <SelectTrigger data-testid={`select-part-${index}`}>
                              <SelectValue placeholder={language === "am" ? "አማራጭ" : "Optional"} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">{language === "am" ? "ምንም" : "None"}</SelectItem>
                              {spareParts.map((part) => (
                                <SelectItem key={part.id} value={part.id}>
                                  {part.partName} ({part.partNumber})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>
                            {language === "am" ? "መለኪያ" : "Unit of Measure"}
                          </Label>
                          <Select
                            value={line.unitOfMeasure}
                            onValueChange={(value) => updateLine(line.id, "unitOfMeasure", value)}
                          >
                            <SelectTrigger data-testid={`select-unit-${index}`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pcs">pcs (ቁጥር)</SelectItem>
                              <SelectItem value="kg">kg (ኪሎግራም)</SelectItem>
                              <SelectItem value="L">L (ሊትር)</SelectItem>
                              <SelectItem value="m">m (ሜትር)</SelectItem>
                              <SelectItem value="box">box (ሳጥን)</SelectItem>
                              <SelectItem value="set">set (ስብስብ)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Description */}
                      <div>
                        <Label>
                          {language === "am" ? "ዝርዝር መግለጫ *" : "Detailed Description *"}
                        </Label>
                        <Textarea
                          value={line.description}
                          onChange={(e) => updateLine(line.id, "description", e.target.value)}
                          placeholder={language === "am" ? "የእቃውን ሙሉ መግለጫ ያስገቡ" : "Enter complete item description"}
                          data-testid={`input-description-${index}`}
                          rows={2}
                        />
                      </div>

                      {/* Quantity and Remarks */}
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>
                            {language === "am" ? "መጠን *" : "Quantity *"}
                          </Label>
                          <Input
                            type="number"
                            min="1"
                            value={line.quantityRequested}
                            onChange={(e) =>
                              updateLine(line.id, "quantityRequested", parseInt(e.target.value) || 1)
                            }
                            data-testid={`input-quantity-${index}`}
                          />
                        </div>
                        <div>
                          <Label>
                            {language === "am" ? "አስተያየት" : "Remarks"}
                          </Label>
                          <Input
                            value={line.remarks}
                            onChange={(e) => updateLine(line.id, "remarks", e.target.value)}
                            placeholder={language === "am" ? "አማራጭ" : "Optional"}
                            data-testid={`input-remarks-${index}`}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Remove Button */}
                    {lines.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLine(line.id)}
                        data-testid={`button-remove-line-${index}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add Line Button */}
          <Button
            variant="outline"
            onClick={addLine}
            className="w-full"
            data-testid="button-add-line"
          >
            <Plus className="h-4 w-4 mr-2" />
            {language === "am" ? "ወረፋ ጨምር" : "Add Line Item"}
          </Button>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            {language === "am" ? "ሰርዝ" : "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={createRequisitionMutation.isPending}
            data-testid="button-submit"
          >
            {createRequisitionMutation.isPending
              ? language === "am"
                ? "በመላክ ላይ..."
                : "Submitting..."
              : language === "am"
                ? "ጥያቄ አስገባ"
                : "Submit Request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
