import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface D365PreviewItem {
  id: string;
  syncId: string;
  itemNo: string;
  description: string;
  description2: string | null;
  type: string | null;
  baseUnitOfMeasure: string | null;
  unitPrice: number | null;
  unitCost: number | null;
  inventory: number | null;
  vendorNo: string | null;
  vendorItemNo: string | null;
  alreadyExists: boolean;
  createdAt: string;
}

interface D365ItemsReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewItems: D365PreviewItem[];
  syncId: string;
  onImport: (syncId: string, selectedItemIds: string[]) => Promise<void>;
  isImporting?: boolean;
}

export function D365ItemsReviewDialog({ 
  open, 
  onOpenChange, 
  previewItems,
  syncId,
  onImport,
  isImporting = false,
}: D365ItemsReviewDialogProps) {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set(previewItems.map(i => i.id)));

  // Reset selection when preview items or syncId changes
  useEffect(() => {
    setSelectedItems(new Set(previewItems.map(i => i.id)));
  }, [previewItems, syncId]);

  const toggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const toggleAll = () => {
    if (selectedItems.size === previewItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(previewItems.map(i => i.id)));
    }
  };

  const handleImport = async () => {
    const selectedIds = Array.from(selectedItems);
    await onImport(syncId, selectedIds);
  };

  const handleInsertAll = async () => {
    const allIds = previewItems.map(i => i.id);
    setSelectedItems(new Set(allIds));
    await onImport(syncId, allIds);
  };

  const newItems = previewItems.filter(i => !i.alreadyExists);
  const existingItems = previewItems.filter(i => i.alreadyExists);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Review D365 Items Before Import
          </DialogTitle>
          <DialogDescription>
            Found {previewItems.length} items from Dynamics 365. 
            {newItems.length} new items, {existingItems.length} will be updated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                id="select-all"
                checked={selectedItems.size === previewItems.length}
                onCheckedChange={toggleAll}
                data-testid="checkbox-select-all-items"
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({selectedItems.size} of {previewItems.length} selected)
              </label>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="bg-green-500/10 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                {newItems.length} New
              </Badge>
              <Badge variant="outline">
                <AlertCircle className="h-3 w-3 mr-1" />
                {existingItems.length} Update
              </Badge>
            </div>
          </div>

          <ScrollArea className="h-[400px] border rounded-md">
            <div className="p-4 space-y-2">
              {previewItems.map((item) => (
                <div 
                  key={item.id}
                  className="flex items-start gap-3 p-3 rounded-md border hover-elevate active-elevate-2"
                  data-testid={`item-row-${item.itemNo}`}
                >
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => toggleItem(item.id)}
                    data-testid={`checkbox-item-${item.itemNo}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{item.itemNo}</p>
                          {item.alreadyExists ? (
                            <Badge variant="outline" className="text-xs">
                              Will Update
                            </Badge>
                          ) : (
                            <Badge className="text-xs bg-green-500/10 text-green-600 dark:text-green-400">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {item.description2 && (
                          <p className="text-xs text-muted-foreground">{item.description2}</p>
                        )}
                      </div>
                      <div className="text-right text-sm">
                        {item.unitPrice && (
                          <p className="font-medium">${item.unitPrice.toFixed(2)}</p>
                        )}
                        {item.inventory !== null && item.inventory !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            Stock: {item.inventory}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                      {item.type && <span>Type: {item.type}</span>}
                      {item.baseUnitOfMeasure && <span>• UOM: {item.baseUnitOfMeasure}</span>}
                      {item.vendorNo && <span>• Vendor: {item.vendorNo}</span>}
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
              variant="secondary"
              onClick={handleInsertAll}
              disabled={isImporting || previewItems.length === 0}
              data-testid="button-insert-all"
            >
              {isImporting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Insert All ({previewItems.length})
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
