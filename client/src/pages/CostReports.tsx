import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Filter,
  ArrowRight,
  Minus,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon
} from "lucide-react";
import { format as formatDate, subMonths, subYears, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";
import { getFiscalQuarterRange, getFiscalYear, getCurrentFiscalQuarter } from "@shared/fiscal";
import { LineChart, Line, BarChart as RechartsBarChart, Bar, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

type PeriodComparison = {
  period1: CostSummary;
  period2: CostSummary;
  variance: {
    totalActualCost: number;
    totalLaborCost: number;
    totalLubricantCost: number;
    totalOutsourceCost: number;
    avgCostPerOrder: number;
  };
  percentChange: {
    totalActualCost: number;
    totalLaborCost: number;
    totalLubricantCost: number;
    totalOutsourceCost: number;
    avgCostPerOrder: number;
  };
};

export default function CostReports() {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState("detailed");
  
  // Detailed Report Filters
  const [filters, setFilters] = useState({
    startDate: `${currentYear}-01-01`,
    endDate: `${currentYear}-12-31`,
    garageId: 'all',
    workshopId: 'all',
    equipmentCategoryId: 'all',
    costType: 'all',
    status: 'completed',
  });

  // Period Comparison Filters
  const [comparisonMode, setComparisonMode] = useState<'month' | 'quarter' | 'year' | 'custom'>('month');
  const [period1, setPeriod1] = useState({
    startDate: formatDate(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
    endDate: formatDate(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
  });
  const [period2, setPeriod2] = useState({
    startDate: formatDate(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: formatDate(endOfMonth(new Date()), 'yyyy-MM-dd'),
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
  const buildQueryParams = (startDate: string, endDate: string) => {
    const params = new URLSearchParams();
    params.append('status', 'completed');
    
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      params.append('completedAfter', start.toISOString());
    }
    
    if (endDate) {
      const end = new Date(endDate);
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

  // Fetch detailed report data (used by both Detailed Reports and Visualizations tabs)
  const { data: workOrders = [], isLoading } = useQuery<any[]>({
    queryKey: [`/api/work-orders?${buildQueryParams(filters.startDate, filters.endDate)}`],
    enabled: activeTab === 'detailed' || activeTab === 'visualizations',
  });

  // Fetch period 1 data for comparison
  const { data: period1Data = [] } = useQuery<any[]>({
    queryKey: [`/api/work-orders?${buildQueryParams(period1.startDate, period1.endDate)}`],
    enabled: activeTab === 'comparison',
  });

  // Fetch period 2 data for comparison
  const { data: period2Data = [] } = useQuery<any[]>({
    queryKey: [`/api/work-orders?${buildQueryParams(period2.startDate, period2.endDate)}`],
    enabled: activeTab === 'comparison',
  });

  // Update period dates based on comparison mode
  const handleComparisonModeChange = (mode: 'month' | 'quarter' | 'year' | 'custom') => {
    setComparisonMode(mode);
    
    if (mode === 'month') {
      setPeriod1({
        startDate: formatDate(startOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
        endDate: formatDate(endOfMonth(subMonths(new Date(), 1)), 'yyyy-MM-dd'),
      });
      setPeriod2({
        startDate: formatDate(startOfMonth(new Date()), 'yyyy-MM-dd'),
        endDate: formatDate(endOfMonth(new Date()), 'yyyy-MM-dd'),
      });
    } else if (mode === 'quarter') {
      // Use fiscal quarters - properly calculated using Ethiopian calendar boundaries
      const { fiscalYear: currentFiscalYear, quarter: currentQuarter } = getCurrentFiscalQuarter();
      
      // Previous quarter (handle year transition)
      const prevQuarter = currentQuarter === 1 ? 4 : currentQuarter - 1;
      const prevFiscalYear = currentQuarter === 1 ? currentFiscalYear - 1 : currentFiscalYear;
      
      // Get properly calculated quarter ranges based on Ethiopian calendar
      const currentQuarterRange = getFiscalQuarterRange(currentQuarter, currentFiscalYear);
      const lastQuarterRange = getFiscalQuarterRange(prevQuarter, prevFiscalYear);
      
      setPeriod1({
        startDate: formatDate(lastQuarterRange.start, 'yyyy-MM-dd'),
        endDate: formatDate(lastQuarterRange.end, 'yyyy-MM-dd'),
      });
      setPeriod2({
        startDate: formatDate(currentQuarterRange.start, 'yyyy-MM-dd'),
        endDate: formatDate(currentQuarterRange.end, 'yyyy-MM-dd'),
      });
    } else if (mode === 'year') {
      setPeriod1({
        startDate: formatDate(startOfYear(subYears(new Date(), 1)), 'yyyy-MM-dd'),
        endDate: formatDate(endOfYear(subYears(new Date(), 1)), 'yyyy-MM-dd'),
      });
      setPeriod2({
        startDate: formatDate(startOfYear(new Date()), 'yyyy-MM-dd'),
        endDate: formatDate(endOfYear(new Date()), 'yyyy-MM-dd'),
      });
    }
  };

  // Calculate summary from work orders
  const calculateSummary = (orders: any[]): CostSummary => {
    const filteredOrders = orders.filter((order: any) => {
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

  const detailedSummary = calculateSummary(workOrders);
  
  // Calculate period comparison
  const calculateComparison = (): PeriodComparison => {
    const p1Summary = calculateSummary(period1Data);
    const p2Summary = calculateSummary(period2Data);
    
    const variance = {
      totalActualCost: p2Summary.totalActualCost - p1Summary.totalActualCost,
      totalLaborCost: p2Summary.totalLaborCost - p1Summary.totalLaborCost,
      totalLubricantCost: p2Summary.totalLubricantCost - p1Summary.totalLubricantCost,
      totalOutsourceCost: p2Summary.totalOutsourceCost - p1Summary.totalOutsourceCost,
      avgCostPerOrder: p2Summary.avgCostPerOrder - p1Summary.avgCostPerOrder,
    };
    
    const percentChange = {
      totalActualCost: p1Summary.totalActualCost > 0 ? (variance.totalActualCost / p1Summary.totalActualCost) * 100 : 0,
      totalLaborCost: p1Summary.totalLaborCost > 0 ? (variance.totalLaborCost / p1Summary.totalLaborCost) * 100 : 0,
      totalLubricantCost: p1Summary.totalLubricantCost > 0 ? (variance.totalLubricantCost / p1Summary.totalLubricantCost) * 100 : 0,
      totalOutsourceCost: p1Summary.totalOutsourceCost > 0 ? (variance.totalOutsourceCost / p1Summary.totalOutsourceCost) * 100 : 0,
      avgCostPerOrder: p1Summary.avgCostPerOrder > 0 ? (variance.avgCostPerOrder / p1Summary.avgCostPerOrder) * 100 : 0,
    };
    
    return { period1: p1Summary, period2: p2Summary, variance, percentChange };
  };

  const comparison = calculateComparison();

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
      order.completedAt ? formatDate(new Date(order.completedAt), 'yyyy-MM-dd') : '',
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
    link.download = `cost-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'ETB',
      minimumFractionDigits: 2,
    }).format(amount).replace('ETB', 'ETB ');
  };

  const formatDateDisplay = (dateString: string) => {
    return formatDate(new Date(dateString), 'MMM dd, yyyy');
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
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

  const ComparisonCard = ({ title, value1, value2, variance, percentChange, icon: Icon }: any) => (
    <Card data-testid={`card-comparison-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Icon className="h-4 w-4" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 items-center">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Period 1</p>
            <p className="text-lg font-semibold">{formatCurrency(value1)}</p>
          </div>
          <div className="flex justify-center">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Period 2</p>
            <p className="text-lg font-semibold">{formatCurrency(value2)}</p>
          </div>
        </div>
        <Separator className="my-3" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {variance > 0 ? (
              <TrendingUp className="h-4 w-4 text-destructive" />
            ) : variance < 0 ? (
              <TrendingDown className="h-4 w-4 text-green-600" />
            ) : (
              <Minus className="h-4 w-4 text-muted-foreground" />
            )}
            <span className={`text-sm font-medium ${
              variance > 0 ? 'text-destructive' :
              variance < 0 ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {formatCurrency(Math.abs(variance))}
            </span>
          </div>
          <Badge variant={variance > 0 ? "destructive" : variance < 0 ? "default" : "secondary"}>
            {formatPercent(percentChange)}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );

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
            Comprehensive cost analysis and period-over-period comparisons
          </p>
        </div>
        {activeTab === 'detailed' && (
          <Button 
            onClick={exportToCSV}
            disabled={filteredWorkOrders.length === 0}
            data-testid="button-export-csv"
          >
            <Download className="h-4 w-4 mr-2" />
            Export to CSV
          </Button>
        )}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-cost-reports">
        <TabsList className="grid w-full max-w-2xl grid-cols-3">
          <TabsTrigger value="detailed" data-testid="tab-detailed-reports">
            <FileText className="h-4 w-4 mr-2" />
            Detailed Reports
          </TabsTrigger>
          <TabsTrigger value="comparison" data-testid="tab-period-comparison">
            <BarChart3 className="h-4 w-4 mr-2" />
            Period Comparison
          </TabsTrigger>
          <TabsTrigger value="visualizations" data-testid="tab-visualizations">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Visualizations
          </TabsTrigger>
        </TabsList>

        {/* Detailed Reports Tab */}
        <TabsContent value="detailed" className="space-y-6">
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
                  {detailedSummary.totalRecords}
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
                  {formatCurrency(detailedSummary.totalActualCost)}
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
                  {formatCurrency(detailedSummary.avgCostPerOrder)}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-variance">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  {detailedSummary.totalCostVariance > 0 ? (
                    <TrendingUp className="h-4 w-4 text-destructive" />
                  ) : detailedSummary.totalCostVariance < 0 ? (
                    <TrendingDown className="h-4 w-4 text-green-600" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Cost Variance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${
                  detailedSummary.totalCostVariance > 0 ? 'text-destructive' :
                  detailedSummary.totalCostVariance < 0 ? 'text-green-600' : ''
                }`} data-testid="text-variance">
                  {formatCurrency(Math.abs(detailedSummary.totalCostVariance))}
                  {detailedSummary.totalCostVariance > 0 ? ' over' : detailedSummary.totalCostVariance < 0 ? ' under' : ''}
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
                  {formatCurrency(detailedSummary.totalLaborCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {detailedSummary.totalActualCost > 0 
                    ? `${((detailedSummary.totalLaborCost / detailedSummary.totalActualCost) * 100).toFixed(1)}% of total`
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
                  {formatCurrency(detailedSummary.totalLubricantCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {detailedSummary.totalActualCost > 0 
                    ? `${((detailedSummary.totalLubricantCost / detailedSummary.totalActualCost) * 100).toFixed(1)}% of total`
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
                  {formatCurrency(detailedSummary.totalOutsourceCost)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {detailedSummary.totalActualCost > 0 
                    ? `${((detailedSummary.totalOutsourceCost / detailedSummary.totalActualCost) * 100).toFixed(1)}% of total`
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
                              {order.completedAt ? formatDateDisplay(order.completedAt) : 'N/A'}
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
        </TabsContent>

        {/* Period Comparison Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {/* Comparison Mode Selector */}
          <Card data-testid="card-comparison-mode">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Comparison Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="comparison-mode">Comparison Mode</Label>
                  <Select
                    value={comparisonMode}
                    onValueChange={(value: any) => handleComparisonModeChange(value)}
                  >
                    <SelectTrigger id="comparison-mode" data-testid="select-comparison-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Month-to-Month</SelectItem>
                      <SelectItem value="quarter">Quarter-to-Quarter (Fiscal)</SelectItem>
                      <SelectItem value="year">Year-over-Year</SelectItem>
                      <SelectItem value="custom">Custom Periods</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period1-start">Period 1 Start</Label>
                  <Input
                    id="period1-start"
                    type="date"
                    value={period1.startDate}
                    onChange={(e) => setPeriod1({ ...period1, startDate: e.target.value })}
                    disabled={comparisonMode !== 'custom'}
                    data-testid="input-period1-start"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period1-end">Period 1 End</Label>
                  <Input
                    id="period1-end"
                    type="date"
                    value={period1.endDate}
                    onChange={(e) => setPeriod1({ ...period1, endDate: e.target.value })}
                    disabled={comparisonMode !== 'custom'}
                    data-testid="input-period1-end"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="period2-start">Period 2 Start</Label>
                  <Input
                    id="period2-start"
                    type="date"
                    value={period2.startDate}
                    onChange={(e) => setPeriod2({ ...period2, startDate: e.target.value })}
                    disabled={comparisonMode !== 'custom'}
                    data-testid="input-period2-start"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period2-end">Period 2 End</Label>
                  <Input
                    id="period2-end"
                    type="date"
                    value={period2.endDate}
                    onChange={(e) => setPeriod2({ ...period2, endDate: e.target.value })}
                    disabled={comparisonMode !== 'custom'}
                    data-testid="input-period2-end"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Period Labels */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Period 1</p>
                  <p className="font-semibold">
                    {formatDate(new Date(period1.startDate), 'MMM dd, yyyy')} - {formatDate(new Date(period1.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Period 2</p>
                  <p className="font-semibold">
                    {formatDate(new Date(period2.startDate), 'MMM dd, yyyy')} - {formatDate(new Date(period2.endDate), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ComparisonCard
              title="Total Cost"
              value1={comparison.period1.totalActualCost}
              value2={comparison.period2.totalActualCost}
              variance={comparison.variance.totalActualCost}
              percentChange={comparison.percentChange.totalActualCost}
              icon={DollarSign}
            />
            <ComparisonCard
              title="Average Cost Per Order"
              value1={comparison.period1.avgCostPerOrder}
              value2={comparison.period2.avgCostPerOrder}
              variance={comparison.variance.avgCostPerOrder}
              percentChange={comparison.percentChange.avgCostPerOrder}
              icon={DollarSign}
            />
            <ComparisonCard
              title="Labor Cost"
              value1={comparison.period1.totalLaborCost}
              value2={comparison.period2.totalLaborCost}
              variance={comparison.variance.totalLaborCost}
              percentChange={comparison.percentChange.totalLaborCost}
              icon={User}
            />
            <ComparisonCard
              title="Lubricant Cost"
              value1={comparison.period1.totalLubricantCost}
              value2={comparison.period2.totalLubricantCost}
              variance={comparison.variance.totalLubricantCost}
              percentChange={comparison.percentChange.totalLubricantCost}
              icon={Droplet}
            />
            <ComparisonCard
              title="Outsource Cost"
              value1={comparison.period1.totalOutsourceCost}
              value2={comparison.period2.totalOutsourceCost}
              variance={comparison.variance.totalOutsourceCost}
              percentChange={comparison.percentChange.totalOutsourceCost}
              icon={Briefcase}
            />
          </div>

          {/* Summary Comparison Table */}
          <Card data-testid="card-comparison-summary">
            <CardHeader>
              <CardTitle className="text-lg">Summary Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    <TableHead className="text-right">Period 1</TableHead>
                    <TableHead className="text-right">Period 2</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                    <TableHead className="text-right">% Change</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Work Orders Completed</TableCell>
                    <TableCell className="text-right">{comparison.period1.totalRecords}</TableCell>
                    <TableCell className="text-right">{comparison.period2.totalRecords}</TableCell>
                    <TableCell className="text-right">
                      {comparison.period2.totalRecords - comparison.period1.totalRecords > 0 ? '+' : ''}
                      {comparison.period2.totalRecords - comparison.period1.totalRecords}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={comparison.period2.totalRecords >= comparison.period1.totalRecords ? "default" : "destructive"}>
                        {comparison.period1.totalRecords > 0 
                          ? formatPercent(((comparison.period2.totalRecords - comparison.period1.totalRecords) / comparison.period1.totalRecords) * 100)
                          : 'N/A'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Total Cost</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.period1.totalActualCost)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.period2.totalActualCost)}</TableCell>
                    <TableCell className="text-right">
                      {comparison.variance.totalActualCost > 0 ? '+' : ''}
                      {formatCurrency(comparison.variance.totalActualCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={comparison.variance.totalActualCost > 0 ? "destructive" : "default"}>
                        {formatPercent(comparison.percentChange.totalActualCost)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Average Cost/Order</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.period1.avgCostPerOrder)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(comparison.period2.avgCostPerOrder)}</TableCell>
                    <TableCell className="text-right">
                      {comparison.variance.avgCostPerOrder > 0 ? '+' : ''}
                      {formatCurrency(comparison.variance.avgCostPerOrder)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant={comparison.variance.avgCostPerOrder > 0 ? "destructive" : "default"}>
                        {formatPercent(comparison.percentChange.avgCostPerOrder)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Visualizations Tab */}
        <TabsContent value="visualizations" className="space-y-6">
          {/* Monthly Cost Trend */}
          <Card data-testid="card-monthly-trend">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <LineChartIcon className="h-5 w-5" />
                Monthly Cost Trend
              </CardTitle>
              <CardDescription>
                Track cost evolution month by month for the selected period
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                // Group work orders by month
                const monthlyData = workOrders.reduce((acc: any, order: any) => {
                  if (!order.completedAt) return acc;
                  
                  const month = formatDate(parseISO(order.completedAt), 'MMM yyyy');
                  if (!acc[month]) {
                    acc[month] = {
                      month,
                      totalCost: 0,
                      laborCost: 0,
                      lubricantCost: 0,
                      outsourceCost: 0,
                      orders: 0,
                    };
                  }
                  
                  acc[month].totalCost += parseFloat(order.totalActualCost || '0');
                  acc[month].laborCost += parseFloat(order.actualLaborCost || '0');
                  acc[month].lubricantCost += parseFloat(order.actualLubricantCost || '0');
                  acc[month].outsourceCost += parseFloat(order.actualOutsourceCost || '0');
                  acc[month].orders += 1;
                  
                  return acc;
                }, {});

                const chartData = Object.values(monthlyData).sort((a: any, b: any) => {
                  const dateA = new Date(a.month);
                  const dateB = new Date(b.month);
                  return dateA.getTime() - dateB.getTime();
                });

                return chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalCost" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={3}
                        name="Total Cost"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="laborCost" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Labor"
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="lubricantCost" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        name="Lubricants"
                        dot={{ r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="outsourceCost" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Outsource"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Cost Category Breakdown - Stacked Area Chart */}
          <Card data-testid="card-cost-breakdown-area">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Cost Category Distribution Over Time
              </CardTitle>
              <CardDescription>
                Visualize how cost categories contribute to total costs month by month
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const monthlyData = workOrders.reduce((acc: any, order: any) => {
                  if (!order.completedAt) return acc;
                  
                  const month = formatDate(parseISO(order.completedAt), 'MMM yyyy');
                  if (!acc[month]) {
                    acc[month] = {
                      month,
                      Labor: 0,
                      Lubricants: 0,
                      Outsource: 0,
                    };
                  }
                  
                  acc[month].Labor += parseFloat(order.actualLaborCost || '0');
                  acc[month].Lubricants += parseFloat(order.actualLubricantCost || '0');
                  acc[month].Outsource += parseFloat(order.actualOutsourceCost || '0');
                  
                  return acc;
                }, {});

                const chartData = Object.values(monthlyData).sort((a: any, b: any) => {
                  const dateA = new Date(a.month);
                  const dateB = new Date(b.month);
                  return dateA.getTime() - dateB.getTime();
                });

                return chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="Labor" 
                        stackId="1"
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Lubricants" 
                        stackId="1"
                        stroke="#3b82f6" 
                        fill="#3b82f6"
                        fillOpacity={0.6}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="Outsource" 
                        stackId="1"
                        stroke="#f59e0b" 
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Cost by Garage - Bar Chart */}
          <Card data-testid="card-cost-by-garage">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Cost Distribution by Garage
              </CardTitle>
              <CardDescription>
                Compare total costs across different garages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const garageData = workOrders.reduce((acc: any, order: any) => {
                  const garageName = order.garageName || 'Unknown';
                  if (!acc[garageName]) {
                    acc[garageName] = {
                      garage: garageName,
                      totalCost: 0,
                      laborCost: 0,
                      lubricantCost: 0,
                      outsourceCost: 0,
                      orders: 0,
                    };
                  }
                  
                  acc[garageName].totalCost += parseFloat(order.totalActualCost || '0');
                  acc[garageName].laborCost += parseFloat(order.actualLaborCost || '0');
                  acc[garageName].lubricantCost += parseFloat(order.actualLubricantCost || '0');
                  acc[garageName].outsourceCost += parseFloat(order.actualOutsourceCost || '0');
                  acc[garageName].orders += 1;
                  
                  return acc;
                }, {});

                const chartData = Object.values(garageData).sort((a: any, b: any) => b.totalCost - a.totalCost);

                return chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <RechartsBarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="garage" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                      />
                      <Tooltip 
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                      />
                      <Legend />
                      <Bar dataKey="laborCost" fill="#10b981" name="Labor" stackId="a" />
                      <Bar dataKey="lubricantCost" fill="#3b82f6" name="Lubricants" stackId="a" />
                      <Bar dataKey="outsourceCost" fill="#f59e0b" name="Outsource" stackId="a" />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-12 text-center text-muted-foreground">
                    No data available for the selected period
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Cost Category Pie Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card data-testid="card-cost-pie">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5" />
                  Cost Breakdown by Category
                </CardTitle>
                <CardDescription>
                  Overall cost distribution across categories
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const totalLabor = detailedSummary.totalLaborCost;
                  const totalLubricant = detailedSummary.totalLubricantCost;
                  const totalOutsource = detailedSummary.totalOutsourceCost;
                  
                  const pieData = [
                    { name: 'Labor', value: totalLabor, color: '#10b981' },
                    { name: 'Lubricants', value: totalLubricant, color: '#3b82f6' },
                    { name: 'Outsource', value: totalOutsource, color: '#f59e0b' },
                  ].filter(item => item.value > 0);

                  return pieData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      No cost data available
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Top Workshops by Cost */}
            <Card data-testid="card-top-workshops">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Top Workshops by Cost
                </CardTitle>
                <CardDescription>
                  Workshops with highest maintenance costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                {(() => {
                  const workshopData = workOrders.reduce((acc: any, order: any) => {
                    const workshopName = order.workshopName || 'Unknown';
                    if (!acc[workshopName]) {
                      acc[workshopName] = {
                        workshop: workshopName,
                        totalCost: 0,
                        orders: 0,
                      };
                    }
                    
                    acc[workshopName].totalCost += parseFloat(order.totalActualCost || '0');
                    acc[workshopName].orders += 1;
                    
                    return acc;
                  }, {});

                  const sortedWorkshops = Object.values(workshopData)
                    .sort((a: any, b: any) => b.totalCost - a.totalCost)
                    .slice(0, 10);

                  return sortedWorkshops.length > 0 ? (
                    <div className="space-y-4">
                      {sortedWorkshops.map((workshop: any, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold text-sm">
                              #{index + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{workshop.workshop}</p>
                              <p className="text-xs text-muted-foreground">{workshop.orders} orders</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(workshop.totalCost)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      No workshop data available
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
