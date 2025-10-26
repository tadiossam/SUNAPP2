import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface D365Equipment {
  No: string;
  Description: string;
  Description_2?: string;
  Make?: string;
  Model?: string;
  Serial_No?: string;
  Asset_No?: string;
  Plant_Number?: string;
  Unit_Price?: number;
  Type?: string;
  existsInDb?: boolean;
}

interface EquipmentCategory {
  id: string;
  name: string;
}

interface D365EquipmentReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: D365Equipment[];
  categories: EquipmentCategory[];
  onImport: (selectedEquipment: D365Equipment[], defaultCategoryId: string | null) => Promise<void>;
  isImporting?: boolean;
}

export function D365EquipmentReviewDialog({ 
  open, 
  onOpenChange, 
  equipment,
  categories,
  onImport,
  isImporting = false,
}: D365EquipmentReviewDialogProps) {
  const [selectedEquipment, setSelectedEquipment] = useState<Set<string>>(new Set(equipment.map(e => e.No)));
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);

  const toggleEquipment = (equipNo: string) => {
    const newSelected = new Set(selectedEquipment);
    if (newSelected.has(equipNo)) {
      newSelected.delete(equipNo);
    } else {
      newSelected.add(equipNo);
    }
    setSelectedEquipment(newSelected);
  };

  const toggleAll = () => {
    if (selectedEquipment.size === equipment.length) {
      setSelectedEquipment(new Set());
    } else {
      setSelectedEquipment(new Set(equipment.map(e => e.No)));
    }
  };

  const handleImport = async () => {
    const equipmentToImport = equipment.filter(e => selectedEquipment.has(e.No));
    await onImport(equipmentToImport, defaultCategoryId);
  };

  const newEquipment = equipment.filter(e => !e.existsInDb);
  const existingEquipment = equipment.filter(e => e.existsInDb);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review D365 Equipment Before Import</DialogTitle>
          <DialogDescription>
            Found {equipment.length} equipment from Dynamics 365. 
            {newEquipment.length} new equipment, {existingEquipment.length} will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="default-category">Default Equipment Category</Label>
            <Select value={defaultCategoryId || undefined} onValueChange={setDefaultCategoryId}>
              <SelectTrigger id="default-category" data-testid="select-default-category">
                <SelectValue placeholder="Select default category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              This category will be assigned to all imported equipment
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedEquipment.size === equipment.length}
                onCheckedChange={toggleAll}
                data-testid="checkbox-select-all-equipment"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedEquipment.size} of {equipment.length} selected)
              </label>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {newEquipment.length} New
              </Badge>
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                {existingEquipment.length} Exists
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[350px] border rounded-md">
            <div className="p-4 space-y-2">
              {equipment.map((equip) => (
                <div 
                  key={equip.No}
                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate active-elevate-2"
                  data-testid={`equipment-row-${equip.No}`}
                >
                  <Checkbox
                    checked={selectedEquipment.has(equip.No)}
                    onCheckedChange={() => toggleEquipment(equip.No)}
                    data-testid={`checkbox-equipment-${equip.No}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{equip.No}</p>
                          {equip.existsInDb && (
                            <Badge variant="outline" className="text-xs">
                              Exists
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{equip.Description}</p>
                        {equip.Description_2 && (
                          <p className="text-xs text-muted-foreground">{equip.Description_2}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {equip.Unit_Price && (
                          <p className="font-medium">${equip.Unit_Price.toFixed(2)}</p>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {equip.Make && <span>Make: {equip.Make}</span>}
                      {equip.Model && <span>• Model: {equip.Model}</span>}
                      {equip.Asset_No && <span>• Asset: {equip.Asset_No}</span>}
                      {equip.Serial_No && <span>• Serial: {equip.Serial_No}</span>}
                      {equip.Plant_Number && <span>• Plant: {equip.Plant_Number}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isImporting}
              data-testid="button-cancel-import"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={selectedEquipment.size === 0 || isImporting}
              data-testid="button-confirm-import"
            >
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {selectedEquipment.size} Equipment
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
