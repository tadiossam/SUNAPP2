import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  FileText, 
  Download, 
  Calendar, 
  Building2, 
  Wrench,
  User,
  Droplet,
  Briefcase,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Filter
} from "lucide-react";
import { format } from "date-fns";

type Workshop = {
  id: string;
  name: string;
  garageId: string;
};

type Garage = {
  id: string;
  name: string;
};

type EquipmentCategory = {
  id: string;
  name: string;
};

type CostReportData = {
  workOrderNumber: string;
  workOrderId: string;
  description: string;
  equipmentModel: string;
  equipmentCategory: string;
  garageName: string;
  workshopName: string;
  status: string;
  completedAt: string;
  plannedLaborCost: number;
  actualLaborCost: number;
  plannedLubricantCost: number;
  actualLubricantCost: number;
  plannedOutsourceCost: number;
  actualOutsourceCost: number;
  totalPlannedCost: number;
  totalActualCost: number;
  costVariance: number;
  costVariancePercent: number;
};

type CostSummary = {
  totalRecords: number;
  totalPlannedCost: number;
  totalActualCost: number;
  totalCostVariance: number;
  totalLaborCost: number;
  totalLubricantCost: number;
  totalOutsourceCost: number;
  avgCostPerOrder: number;
};

export default function CostReports() {
  const currentYear = new Date().getFullYear();
  const [filters, setFilters] = useState({
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
    garageId: 'all',
    workshopId: 'all',
    equipmentCategoryId: 'all',
    costType: 'all', // all, labor, lubricants, outsource
    status: 'completed', // Only completed orders have cost data
  });

  // Fetch garages
  const { data: garages = [] } = useQuery<Garage[]>({
    queryKey: ["/api/garages"],
  });

  // Fetch workshops
  const { data: workshops = [] } = useQuery<Workshop[]>({
    queryKey: ["/api/workshops"],
  });

  // Fetch equipment categories
  const { data: equipmentCategories = [] } = useQuery<EquipmentCategory[]>({
    queryKey: ["/api/equipment-categories"],
  });

  // Build query parameters
  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.append('status', filters.status);
    
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      start.setHours(0, 0, 0, 0);
      params.append('completedAfter', start.toISOString());
    }
    
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      params.append('completedBefore', end.toISOString());
    }
    
    if (filters.garageId && filters.garageId !== 'all') {
      params.append('garage', filters.garageId);
    }
    
    if (filters.workshopId && filters.workshopId !== 'all') {
      params.append('workshopId', filters.workshopId);
    }
    
    if (filters.equipmentCategoryId && filters.equipmentCategoryId !== 'all') {
      params.append('equipmentCategory', filters.equipmentCategoryId);
    }
    
    return params.toString();
  };

  // Fetch cost report data
  const { data: workOrders = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/work-orders?${buildQueryParams()}`],
  });

  // Calculate summary statistics
  const calculateSummary = (): CostSummary => {
    const filteredOrders = workOrders.filter((order: any) => {
      // Apply cost type filter client-side
      if (filters.costType !== 'all') {
        if (filters.costType === 'labor' && (!order.actualLaborCost || parseFloat(order.actualLaborCost) === 0)) {
          return false;
        }
        if (filters.costType === 'lubricants' && (!order.actualLubricantCost || parseFloat(order.actualLubricantCost) === 0)) {
          return false;
        }
        if (filters.costType === 'outsource' && (!order.actualOutsourceCost || parseFloat(order.actualOutsourceCost) === 0)) {
          return false;
        }
      }
      return true;
    });

    const totalPlannedCost = filteredOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.totalPlannedCost || '0'), 0);
    const totalActualCost = filteredOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.totalActualCost || '0'), 0);
    const totalLaborCost = filteredOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.actualLaborCost || '0'), 0);
    const totalLubricantCost = filteredOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.actualLubricantCost || '0'), 0);
    const totalOutsourceCost = filteredOrders.reduce((sum: number, order: any) => 
      sum + parseFloat(order.actualOutsourceCost || '0'), 0);

    return {
      totalRecords: filteredOrders.length,
      totalPlannedCost,
      totalActualCost,
      totalCostVariance: totalActualCost - totalPlannedCost,
      totalLaborCost,
      totalLubricantCost,
      totalOutsourceCost,
      avgCostPerOrder: filteredOrders.length > 0 ? totalActualCost / filteredOrders.length : 0,
    };
  };

  const summary = calculateSummary();

  // Export to CSV
  const exportToCSV = () => {
    const filteredOrders = workOrders.filter((order: any) => {
      if (filters.costType !== 'all') {
        if (filters.costType === 'labor' && (!order.actualLaborCost || parseFloat(order.actualLaborCost) === 0)) {
          return false;
        }
        if (filters.costType === 'lubricants' && (!order.actualLubricantCost || parseFloat(order.actualLubricantCost) === 0)) {
          return false;
        }
        if (filters.costType === 'outsource' && (!order.actualOutsourceCost || parseFloat(order.actualOutsourceCost) === 0)) {
          return false;
        }
      }
      return true;
    });

    const headers = [
      'Work Order',
      'Description',
      'Equipment',
      'Category',
      'Garage',
      'Workshop',
      'Status',
      'Completed Date',
      'Planned Labor',
      'Actual Labor',
      'Planned Lubricant',
      'Actual Lubricant',
      'Planned Outsource',
      'Actual Outsource',
      'Total Planned',
      'Total Actual',
      'Variance',
      'Variance %'
    ];

    const rows = filteredOrders.map((order: any) => [
      order.workOrderNumber || '',
      (order.description || '').replace(/,/g, ';'),
      order.equipmentModel || '',
      order.equipmentCategoryName || '',
      order.garageName || '',
      order.workshopName || '',
      order.status || '',
      order.completedAt ? format(new Date(order.completedAt), 'yyyy-MM-dd') : '',
      parseFloat(order.plannedLaborCost || '0').toFixed(2),
      parseFloat(order.actualLaborCost || '0').toFixed(2),
      parseFloat(order.plannedLubricantCost || '0').toFixed(2),
      parseFloat(order.actualLubricantCost || '0').toFixed(2),
      parseFloat(order.plannedOutsourceCost || '0').toFixed(2),
      parseFloat(order.actualOutsourceCost || '0').toFixed(2),
      parseFloat(order.totalPlannedCost || '0').toFixed(2),
      parseFloat(order.totalActualCost || '0').toFixed(2),
      parseFloat(order.costVariance || '0').toFixed(2),
      parseFloat(order.costVariancePercent || '0').toFixed(2)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cost-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const filteredWorkOrders = workOrders.filter((order: any) => {
    if (filters.costType !== 'all') {
      if (filters.costType === 'labor' && (!order.actualLaborCost || parseFloat(order.actualLaborCost) === 0)) {
        return false;
      }
      if (filters.costType === 'lubricants' && (!order.actualLubricantCost || parseFloat(order.actualLubricantCost) === 0)) {
        return false;
      }
      if (filters.costType === 'outsource' && (!order.actualOutsourceCost || parseFloat(order.actualOutsourceCost) === 0)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <DollarSign className="h-8 w-8" />
            Cost Reports
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive cost analysis and reporting for work orders
          </p>
        </div>
        <Button 
          onClick={exportToCSV}
          disabled={filteredWorkOrders.length === 0}
          data-testid="button-export-csv"
        >
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      {/* Filters Card */}
      <Card data-testid="card-filters">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                data-testid="input-start-date"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                data-testid="input-end-date"
              />
            </div>

            {/* Garage Filter */}
            <div className="space-y-2">
              <Label htmlFor="garage">Garage</Label>
              <Select
                value={filters.garageId}
                onValueChange={(value) => setFilters({ ...filters, garageId: value, workshopId: 'all' })}
              >
                <SelectTrigger id="garage" data-testid="select-garage">
                  <SelectValue placeholder="All Garages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Garages</SelectItem>
                  {garages.map((garage) => (
                    <SelectItem key={garage.id} value={garage.id}>
                      {garage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Workshop Filter */}
            <div className="space-y-2">
              <Label htmlFor="workshop">Workshop</Label>
              <Select
                value={filters.workshopId}
                onValueChange={(value) => setFilters({ ...filters, workshopId: value })}
              >
                <SelectTrigger id="workshop" data-testid="select-workshop">
                  <SelectValue placeholder="All Workshops" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Workshops</SelectItem>
                  {workshops
                    .filter(w => filters.garageId === 'all' || w.garageId === filters.garageId)
                    .map((workshop) => (
                      <SelectItem key={workshop.id} value={workshop.id}>
                        {workshop.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Equipment Category Filter */}
            <div className="space-y-2">
              <Label htmlFor="equipment-category">Equipment Category</Label>
              <Select
                value={filters.equipmentCategoryId}
                onValueChange={(value) => setFilters({ ...filters, equipmentCategoryId: value })}
              >
                <SelectTrigger id="equipment-category" data-testid="select-equipment-category">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {equipmentCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cost Type Filter */}
            <div className="space-y-2">
              <Label htmlFor="cost-type">Cost Type</Label>
              <Select
                value={filters.costType}
                onValueChange={(value) => setFilters({ ...filters, costType: value })}
              >
                <SelectTrigger id="cost-type" data-testid="select-cost-type">
                  <SelectValue placeholder="All Cost Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cost Types</SelectItem>
                  <SelectItem value="labor">Labor Only</SelectItem>
                  <SelectItem value="lubricants">Lubricants Only</SelectItem>
                  <SelectItem value="outsource">Outsource Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card data-testid="card-total-records">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Total Work Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-total-records">
              {summary.totalRecords}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-total-cost">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Actual Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-primary" data-testid="text-total-cost">
              {formatCurrency(summary.totalActualCost)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-avg-cost">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Average Cost Per Order
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold" data-testid="text-avg-cost">
              {formatCurrency(summary.avgCostPerOrder)}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-variance">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              {summary.totalCostVariance > 0 ? (
                <TrendingUp className="h-4 w-4 text-destructive" />
              ) : summary.totalCostVariance < 0 ? (
                <TrendingDown className="h-4 w-4 text-green-600" />
              ) : (
                <DollarSign className="h-4 w-4" />
              )}
              Cost Variance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${
              summary.totalCostVariance > 0 ? 'text-destructive' :
              summary.totalCostVariance < 0 ? 'text-green-600' : ''
            }`} data-testid="text-variance">
              {formatCurrency(Math.abs(summary.totalCostVariance))}
              {summary.totalCostVariance > 0 ? ' over' : summary.totalCostVariance < 0 ? ' under' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="card-labor-cost">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Total Labor Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-labor-total">
              {formatCurrency(summary.totalLaborCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalActualCost > 0 
                ? `${((summary.totalLaborCost / summary.totalActualCost) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-lubricant-cost">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Droplet className="h-4 w-4" />
              Total Lubricant Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-lubricant-total">
              {formatCurrency(summary.totalLubricantCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalActualCost > 0 
                ? `${((summary.totalLubricantCost / summary.totalActualCost) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>

        <Card data-testid="card-outsource-cost">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Total Outsource Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" data-testid="text-outsource-total">
              {formatCurrency(summary.totalOutsourceCost)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.totalActualCost > 0 
                ? `${((summary.totalOutsourceCost / summary.totalActualCost) * 100).toFixed(1)}% of total`
                : '0% of total'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Cost Table */}
      <Card data-testid="card-cost-table">
        <CardHeader>
          <CardTitle className="text-lg">Detailed Cost Report</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading cost data...</div>
          ) : filteredWorkOrders.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              No work orders found matching the selected filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Work Order</TableHead>
                    <TableHead>Equipment</TableHead>
                    <TableHead>Garage/Workshop</TableHead>
                    <TableHead>Completed</TableHead>
                    <TableHead className="text-right">Labor</TableHead>
                    <TableHead className="text-right">Lubricants</TableHead>
                    <TableHead className="text-right">Outsource</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWorkOrders.map((order: any) => {
                    const actualTotal = parseFloat(order.totalActualCost || '0');
                    const plannedTotal = parseFloat(order.totalPlannedCost || '0');
                    const variance = actualTotal - plannedTotal;
                    
                    return (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell>
                          <div className="font-medium">{order.workOrderNumber}</div>
                          <div className="text-xs text-muted-foreground line-clamp-1">
                            {order.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.equipmentModel || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.equipmentCategoryName || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">{order.garageName || 'N/A'}</div>
                          <div className="text-xs text-muted-foreground">
                            {order.workshopName || 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.completedAt ? formatDate(order.completedAt) : 'N/A'}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(order.actualLaborCost || '0'))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(order.actualLubricantCost || '0'))}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(parseFloat(order.actualOutsourceCost || '0'))}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(actualTotal)}
                        </TableCell>
                        <TableCell className="text-right">
                          {variance !== 0 ? (
                            <Badge 
                              variant={variance > 0 ? "destructive" : "default"}
                              data-testid={`badge-variance-${order.id}`}
                            >
                              {variance > 0 ? '+' : ''}{formatCurrency(variance)}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
