import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, Package, Edit, Trash2, RefreshCw, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Item } from "@shared/schema";

// Form validation schema
const itemFormSchema = z.object({
  itemNo: z.string().min(1, "Item number is required"),
  description: z.string().min(1, "Description is required"),
  description2: z.string().optional().transform(val => val || undefined),
  type: z.string().optional().transform(val => val || undefined),
  baseUnitOfMeasure: z.string().optional().transform(val => val || undefined),
  unitPrice: z.string().optional().transform(val => val || undefined),
  unitCost: z.string().optional().transform(val => val || undefined),
  inventory: z.string().optional().transform(val => val || undefined),
  vendorNo: z.string().optional().transform(val => val || undefined),
  vendorItemNo: z.string().optional().transform(val => val || undefined),
});

type ItemFormValues = z.infer<typeof itemFormSchema>;

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const { t } = useLanguage();
  const { toast } = useToast();

  // Fetch items from database
  const { data: items, isLoading } = useQuery<Item[]>({
    queryKey: ["/api/items"],
  });

  // Form setup
  const form = useForm<ItemFormValues>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      itemNo: "",
      description: "",
      description2: "",
      type: "",
      baseUnitOfMeasure: "",
      unitPrice: "",
      unitCost: "",
      inventory: "",
      vendorNo: "",
      vendorItemNo: "",
    },
  });

  // Mutation to sync items from Dynamics 365
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/sync-items");
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: t("success"),
        description: `${t("itemsSyncedSuccessfully")}: ${data.savedCount} new, ${data.updatedCount} updated`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: t("syncFailed") + `: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation to create/update item
  const saveMutation = useMutation({
    mutationFn: async (data: ItemFormValues) => {
      if (editingItem) {
        const response = await apiRequest("PATCH", `/api/items/${editingItem.id}`, data);
        return response.json();
      } else {
        const response = await apiRequest("POST", "/api/items", data);
        return response.json();
      }
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: editingItem ? t("itemUpdatedSuccessfully") : t("itemCreatedSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      setIsDialogOpen(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutation to delete item
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/items/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("itemDeletedSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const displayItems = items || [];

  const filteredItems = displayItems.filter(
    (item: Item) =>
      item.itemNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddItem = () => {
    setEditingItem(null);
    form.reset({
      itemNo: "",
      description: "",
      description2: "",
      type: "",
      baseUnitOfMeasure: "",
      unitPrice: "",
      unitCost: "",
      inventory: "",
      vendorNo: "",
      vendorItemNo: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditItem = (item: Item) => {
    setEditingItem(item);
    form.reset({
      itemNo: item.itemNo,
      description: item.description,
      description2: item.description2 ?? "",
      type: item.type ?? "",
      baseUnitOfMeasure: item.baseUnitOfMeasure ?? "",
      unitPrice: item.unitPrice != null ? item.unitPrice.toString() : "",
      unitCost: item.unitCost != null ? item.unitCost.toString() : "",
      inventory: item.inventory != null ? item.inventory.toString() : "",
      vendorNo: item.vendorNo ?? "",
      vendorItemNo: item.vendorItemNo ?? "",
    });
    setIsDialogOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    if (confirm(t("confirmDeleteItem"))) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: ItemFormValues) => {
    saveMutation.mutate(data);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("items")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("manageYourInventoryItems")}
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={async () => {
              try {
                // Get auth token from localStorage
                const token = localStorage.getItem("auth_token");
                const headers: HeadersInit = {
                  'Content-Type': 'application/json',
                };
                
                if (token) {
                  headers['Authorization'] = `Bearer ${token}`;
                }
                
                const response = await fetch("/api/dynamics365/test-endpoints", {
                  headers,
                });
                const data = await response.json();
                
                if (!response.ok) {
                  if (response.status === 403) {
                    alert(`⚠️ Access Denied\n\nYou need to be logged in with CEO or Admin privileges to test D365 endpoints.\n\nPlease log in and try again.`);
                  } else {
                    alert(`❌ Error: ${data.message || 'Unknown error occurred'}`);
                  }
                  return;
                }
                
                if (data.success) {
                  alert(`✅ Found working endpoint!\n\nEndpoint: ${data.workingEndpoint}\n\nYou can now sync items.`);
                } else if (data.results) {
                  const failedEndpoints = data.results.map((r: any) => 
                    `${r.success ? '✓' : '✗'} ${r.endpoint}: ${r.status}`
                  ).join('\n');
                  alert(`❌ No working endpoint found.\n\nTested endpoints:\n${failedEndpoints}\n\nPlease check your D365 credentials and URL.`);
                } else {
                  alert(`❌ Error: ${data.message || 'Test failed'}`);
                }
              } catch (error: any) {
                alert(`Error testing endpoints: ${error.message}`);
              }
            }}
            data-testid="button-test-endpoints"
          >
            <Settings className="h-4 w-4 mr-2" />
            Test D365
          </Button>
          <Button 
            variant="outline" 
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-items"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? t("syncingItems") : t("syncFromDynamics365")}
          </Button>
          <Button onClick={handleAddItem} data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-full mx-auto space-y-6">
          {/* Search Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t("searchItems")}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-items"
                />
              </div>
            </CardContent>
          </Card>

          {/* Stats Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("totalItems")}</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{displayItems.length}</div>
              <p className="text-xs text-muted-foreground">
                {t("totalItemsInInventory")}
              </p>
            </CardContent>
          </Card>

          {/* Items Table */}
          <Card>
            <CardHeader>
              <CardTitle>{t("itemsList")}</CardTitle>
              <CardDescription>
                {t("viewAndManageAllInventoryItems")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("itemNo")}</TableHead>
                        <TableHead>{t("description")}</TableHead>
                        <TableHead>{t("description2")}</TableHead>
                        <TableHead>{t("type")}</TableHead>
                        <TableHead>{t("baseUnitOfMeasure")}</TableHead>
                        <TableHead className="text-right">{t("unitPrice")}</TableHead>
                        <TableHead className="text-right">{t("unitCost")}</TableHead>
                        <TableHead className="text-right">{t("inventory")}</TableHead>
                        <TableHead>{t("vendorNo")}</TableHead>
                        <TableHead>{t("vendorItemNo")}</TableHead>
                        <TableHead>{t("lastModified")}</TableHead>
                        <TableHead>{t("lastSynced")}</TableHead>
                        <TableHead className="text-right">{t("actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={13} className="text-center text-muted-foreground">
                            {t("noItemsFound")}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item: Item) => (
                          <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                            <TableCell className="font-medium">{item.itemNo}</TableCell>
                            <TableCell className="max-w-[200px]">{item.description}</TableCell>
                            <TableCell className="max-w-[150px]">{item.description2 ?? "-"}</TableCell>
                            <TableCell>{item.type ?? "-"}</TableCell>
                            <TableCell>{item.baseUnitOfMeasure ?? "-"}</TableCell>
                            <TableCell className="text-right">{item.unitPrice ?? "-"}</TableCell>
                            <TableCell className="text-right">{item.unitCost ?? "-"}</TableCell>
                            <TableCell className="text-right">{item.inventory ?? "-"}</TableCell>
                            <TableCell>{item.vendorNo ?? "-"}</TableCell>
                            <TableCell>{item.vendorItemNo ?? "-"}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.lastDateModified ? new Date(item.lastDateModified).toLocaleDateString() : "-"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {item.syncedAt ? new Date(item.syncedAt).toLocaleString() : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditItem(item)}
                                  data-testid={`button-edit-${item.id}`}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  data-testid={`button-delete-${item.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Item Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? t("editItem") : t("addItem")}
            </DialogTitle>
            <DialogDescription>
              {editingItem ? t("editItemDescription") : t("addItemDescription")}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="itemNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("itemNo")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="SP-001" data-testid="input-item-no" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("type")}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder={t("selectType")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Inventory">Inventory</SelectItem>
                          <SelectItem value="Service">Service</SelectItem>
                          <SelectItem value="Non-Inventory">Non-Inventory</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("enterDescription")} data-testid="input-description" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("description2")}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t("enterDescription2")} data-testid="input-description2" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="baseUnitOfMeasure"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("baseUnitOfMeasure")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="PCS, KG, etc." data-testid="input-unit" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="inventory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("inventory")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" placeholder="0" data-testid="input-inventory" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="unitPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unitPrice")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-unit-price" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("unitCost")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" step="0.01" placeholder="0.00" data-testid="input-unit-cost" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="vendorNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("vendorNo")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enterVendorNo")} data-testid="input-vendor-no" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendorItemNo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("vendorItemNo")}</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={t("enterVendorItemNo")} data-testid="input-vendor-item-no" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  data-testid="button-cancel"
                >
                  {t("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={saveMutation.isPending}
                  data-testid="button-save-item"
                >
                  {saveMutation.isPending ? t("saving") : t("save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
