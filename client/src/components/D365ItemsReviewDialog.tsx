import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface D365Item {
  No: string;
  Description: string;
  Description_2?: string;
  Type?: string;
  Base_Unit_of_Measure?: string;
  Unit_Price?: number;
  Unit_Cost?: number;
  Inventory?: number;
  Vendor_No?: string;
  Vendor_Item_No?: string;
  existsInDb?: boolean;
}

interface D365ItemsReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: D365Item[];
  onImport: (selectedItems: D365Item[]) => Promise<void>;
  isImporting?: boolean;
}

export function D365ItemsReviewDialog({ 
  open, 
  onOpenChange, 
  items,
  onImport,
  isImporting = false,
}: D365ItemsReviewDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(items.map(i => i.No)));

  const toggleItem = (itemNo: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemNo)) {
      newSelected.delete(itemNo);
    } else {
      newSelected.add(itemNo);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(i => i.No)));
    }
  };

  const handleImport = async () => {
    const itemsToImport = items.filter(i => selectedItems.has(i.No));
    await onImport(itemsToImport);
  };

  const newItems = items.filter(i => !i.existsInDb);
  const existingItems = items.filter(i => i.existsInDb);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Review D365 Items Before Import</DialogTitle>
          <DialogDescription>
            Found {items.length} items from Dynamics 365. 
            {newItems.length} new items, {existingItems.length} will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedItems.size === items.length}
                onCheckedChange={toggleAll}
                data-testid="checkbox-select-all-items"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedItems.size} of {items.length} selected)
              </label>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {newItems.length} New
              </Badge>
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                {existingItems.length} Exists
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-2">
              {items.map((item) => (
                <div 
                  key={item.No}
                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate active-elevate-2"
                  data-testid={`item-row-${item.No}`}
                >
                  <Checkbox
                    checked={selectedItems.has(item.No)}
                    onCheckedChange={() => toggleItem(item.No)}
                    data-testid={`checkbox-item-${item.No}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.No}</p>
                          {item.existsInDb && (
                            <Badge variant="outline" className="text-xs">
                              Exists
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.Description}</p>
                        {item.Description_2 && (
                          <p className="text-xs text-muted-foreground">{item.Description_2}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {item.Unit_Price && (
                          <p className="font-medium">${item.Unit_Price.toFixed(2)}</p>
                        )}
                        {item.Inventory !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Stock: {item.Inventory}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      {item.Type && <span>Type: {item.Type}</span>}
                      {item.Base_Unit_of_Measure && <span>• UOM: {item.Base_Unit_of_Measure}</span>}
                      {item.Vendor_No && <span>• Vendor: {item.Vendor_No}</span>}
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
              disabled={selectedItems.size === 0 || isImporting}
              data-testid="button-confirm-import"
            >
              {isImporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Import {selectedItems.size} Items
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
