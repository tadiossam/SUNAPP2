import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, Plus, Package, Edit, Trash2, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ItemsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const { t } = useLanguage();
  const { toast } = useToast();

  // Placeholder data - you can connect this to your backend later
  const { data: items, isLoading } = useQuery({
    queryKey: ["/api/items"],
    enabled: false, // Disabled until backend route is created
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
        description: t("itemsSyncedSuccessfully") + ` (${data.itemsCount} items)`,
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

  // Placeholder items for demonstration
  const placeholderItems = [
    { id: "1", name: "Sample Item 1", category: "Category A", quantity: 50, status: "inStock" },
    { id: "2", name: "Sample Item 2", category: "Category B", quantity: 25, status: "lowStock" },
    { id: "3", name: "Sample Item 3", category: "Category A", quantity: 0, status: "outOfStock" },
  ];

  const displayItems = (items as any[]) || placeholderItems;

  const filteredItems = displayItems.filter(
    (item: any) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            data-testid="button-sync-items"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? t("syncingItems") : t("syncFromDynamics365")}
          </Button>
          <Button data-testid="button-add-item">
            <Plus className="h-4 w-4 mr-2" />
            {t("addItem")}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-6">
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

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("totalItems")}</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{displayItems.length}</div>
                <p className="text-xs text-muted-foreground">
                  {t("acrossAllCategories")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("inStock")}</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayItems.filter((i: any) => i.status === "inStock").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("availableItems")}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t("lowStock")}</CardTitle>
                <Package className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {displayItems.filter((i: any) => i.status === "lowStock").length}
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("needsAttention")}
                </p>
              </CardContent>
            </Card>
          </div>

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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("name")}</TableHead>
                      <TableHead>{t("category")}</TableHead>
                      <TableHead>{t("quantity")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          {t("noItemsFound")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItems.map((item: any) => (
                        <TableRow key={item.id} data-testid={`row-item-${item.id}`}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.category}</TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                item.status === "inStock"
                                  ? "default"
                                  : item.status === "lowStock"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {t(item.status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-edit-${item.id}`}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
