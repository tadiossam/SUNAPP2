import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp, DollarSign, CheckCircle, AlertCircle, Users, Wrench, Calendar, Filter } from "lucide-react";
import { format } from "date-fns";
import CostDrilldownDialog from "@/components/CostDrilldownDialog";
import { getFiscalQuarterRange } from "@shared/fiscal";

const COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#f59e0b", "#10b981", "#f97316", "#8b5cf6"];

export default function Dashboard() {
  const { t } = useLanguage();
  const [timePeriod, setTimePeriod] = useState<string>("annual");
  const [workshopId, setWorkshopId] = useState<string>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  
  // Cost drill-down state
  const [drilldownOpen, setDrilldownOpen] = useState(false);
  const [drilldownContext, setDrilldownContext] = useState<{
    type: 'month' | 'equipmentType' | 'garage' | 'costType' | null;
    value: string | null;
    label: string | null;
  }>({
    type: null,
    value: null,
    label: null,
  });
  
  // Date range state
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [useCustomRange, setUseCustomRange] = useState<boolean>(false);
  
  // Daily/Weekly specific date selectors
  const [dailyDate, setDailyDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));
  const [weekStartDate, setWeekStartDate] = useState<string>(() => {
    // Get current Monday
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    return format(monday, "yyyy-MM-dd");
  });

  // Build query params based on whether using custom range or predefined period
  const buildQueryParams = () => {
    let params = `workshopId=${workshopId}`;
    
    if (useCustomRange && startDate && endDate) {
      params += `&startDate=${startDate}&endDate=${endDate}&timePeriod=custom`;
    } else {
      params += `&timePeriod=${timePeriod}&year=${year}`;
      
      // Add date-specific params for daily/weekly
      if (timePeriod === 'daily') {
        params += `&date=${dailyDate}`;
      } else if (timePeriod === 'weekly') {
        params += `&weekStart=${weekStartDate}`;
      }
    }
    
    return params;
  };
  
  // Fetch dashboard analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/analytics?${buildQueryParams()}`],
  });

  const kpis = analyticsData?.kpis || {
    totalWorkOrders: 0,
    totalPlanned: 0,
    accomplishmentRate: 0,
    totalCost: 0,
    activeWorkshops: 0,
  };

  const costAnalytics = analyticsData?.costAnalytics || {
    labor: { planned: 0, actual: 0 },
    lubricants: { planned: 0, actual: 0 },
    outsource: { planned: 0, actual: 0 },
    totalMaintenanceCost: 0,
    avgCostPerWorkOrder: 0,
    costVariancePct: 0,
    costVarianceAmount: 0,
  };

  const costCharts = analyticsData?.costCharts || {
    monthlyTrends: [],
    breakdown: { labor: 0, lubricants: 0, outsource: 0 },
    byEquipmentType: [],
    byGarage: [],
  };

  const costBreakdown = analyticsData?.costBreakdown
    ? [
        { name: "Direct Maintenance", value: analyticsData.costBreakdown.directMaintenance, color: "#2563eb" },
        { name: "Overtime", value: analyticsData.costBreakdown.overtime, color: "#7c3aed" },
        { name: "Outsource", value: analyticsData.costBreakdown.outsource, color: "#dc2626" },
        { name: "Overhead (30%)", value: analyticsData.costBreakdown.overhead, color: "#f59e0b" },
      ]
    : [];

  const quarterlyData = analyticsData?.quarterlyData || [];
  const workshopPerformance = analyticsData?.workshopPerformance || [];
  const workshops = analyticsData?.workshops || [];

  // Generate year options (current year and past 5 years)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header with Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
              <p className="text-sm text-muted-foreground">
                Maintenance Performance Analytics
              </p>
            </div>
          </div>

          {/* Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Report Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filter Mode Toggle */}
                <div className="flex items-center gap-4">
                  <Button
                    variant={!useCustomRange ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomRange(false)}
                    data-testid="button-predefined-period"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Predefined Period
                  </Button>
                  <Button
                    variant={useCustomRange ? "default" : "outline"}
                    size="sm"
                    onClick={() => setUseCustomRange(true)}
                    data-testid="button-custom-range"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Custom Date Range
                  </Button>
                </div>

                {/* Conditional Filter Display */}
                {!useCustomRange ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Time Period Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time Period</label>
                        <Select value={timePeriod} onValueChange={setTimePeriod}>
                          <SelectTrigger data-testid="select-time-period">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="q1">FY Q1 (Sep-Dec)</SelectItem>
                            <SelectItem value="q2">FY Q2 (Dec-Mar)</SelectItem>
                            <SelectItem value="q3">FY Q3 (Mar-Jun)</SelectItem>
                            <SelectItem value="q4">FY Q4 (Jun-Sep)</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Workshop Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Workshop</label>
                        <Select value={workshopId} onValueChange={setWorkshopId}>
                          <SelectTrigger data-testid="select-workshop">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Workshops</SelectItem>
                            {workshops.map((workshop: any) => (
                              <SelectItem key={workshop.id} value={workshop.id}>
                                {workshop.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Year Filter - only show for non-daily/weekly periods */}
                      {timePeriod !== 'daily' && timePeriod !== 'weekly' && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Year</label>
                          <Select value={year.toString()} onValueChange={(val) => setYear(parseInt(val))}>
                            <SelectTrigger data-testid="select-year">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map((y) => (
                                <SelectItem key={y} value={y.toString()}>
                                  {y}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    {/* Daily Date Selector */}
                    {timePeriod === 'daily' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Select Date</label>
                        <Input
                          type="date"
                          value={dailyDate}
                          onChange={(e) => setDailyDate(e.target.value)}
                          data-testid="input-daily-date"
                          className="w-full md:w-64"
                        />
                      </div>
                    )}

                    {/* Weekly Start Date Selector */}
                    {timePeriod === 'weekly' && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Week Starting (Monday)</label>
                        <Input
                          type="date"
                          value={weekStartDate}
                          onChange={(e) => setWeekStartDate(e.target.value)}
                          data-testid="input-week-start"
                          className="w-full md:w-64"
                        />
                        {weekStartDate && (
                          <p className="text-xs text-muted-foreground">
                            Selected week: {format(new Date(weekStartDate), "MMM dd")} - {format(new Date(new Date(weekStartDate).setDate(new Date(weekStartDate).getDate() + 6)), "MMM dd, yyyy")}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Start Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">From Date</label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        data-testid="input-start-date"
                        className="w-full"
                      />
                    </div>

                    {/* End Date */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">To Date</label>
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        data-testid="input-end-date"
                        className="w-full"
                      />
                    </div>

                    {/* Workshop Filter */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Workshop</label>
                      <Select value={workshopId} onValueChange={setWorkshopId}>
                        <SelectTrigger data-testid="select-workshop">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Workshops</SelectItem>
                          {workshops.map((workshop: any) => (
                            <SelectItem key={workshop.id} value={workshop.id}>
                              {workshop.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="text-lg font-medium">Loading dashboard data...</div>
              <p className="text-sm text-muted-foreground mt-2">Please wait</p>
            </div>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-work-orders">
                    {kpis.totalWorkOrders.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    of {kpis.totalPlanned.toLocaleString()} planned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Accomplishment Rate</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-accomplishment-rate">
                    {kpis.accomplishmentRate.toFixed(2)}%
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Completed vs planned
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-total-cost">
                    {(kpis.totalCost / 1000000).toFixed(2)}M
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ETB (including overhead)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Workshops</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold" data-testid="text-active-workshops">
                    {kpis.activeWorkshops}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Maintenance workshops
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Cost Analytics Cards */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Cost Analytics</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Labor Cost</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary" data-testid="text-labor-cost">
                          ETB {(costAnalytics.labor.actual / 1000).toFixed(1)}K
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Planned: ETB {(costAnalytics.labor.planned / 1000).toFixed(1)}K
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Lubricant Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary" data-testid="text-lubricant-cost">
                          ETB {(costAnalytics.lubricants.actual / 1000).toFixed(1)}K
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Planned: ETB {(costAnalytics.lubricants.planned / 1000).toFixed(1)}K
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outsource Cost</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-primary" data-testid="text-outsource-cost">
                          ETB {(costAnalytics.outsource.actual / 1000).toFixed(1)}K
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Planned: ETB {(costAnalytics.outsource.planned / 1000).toFixed(1)}K
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Cost/Order</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold" data-testid="text-avg-cost-per-order">
                          ETB {(costAnalytics.avgCostPerWorkOrder / 1000).toFixed(1)}K
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Per completed order
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Cost Variance</CardTitle>
                        {costAnalytics.costVariancePct > 0 ? (
                          <TrendingUp className="h-4 w-4 text-destructive" data-testid="icon-variance-up" />
                        ) : (
                          <TrendingUp className="h-4 w-4 text-green-600" data-testid="icon-variance-down" />
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className={`text-2xl font-bold ${
                          costAnalytics.costVariancePct > 0 ? 'text-destructive' : 'text-green-600'
                        }`} data-testid="text-cost-variance">
                          {costAnalytics.costVariancePct > 0 ? '+' : ''}
                          {costAnalytics.costVariancePct.toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {costAnalytics.costVariancePct > 0 ? 'Over' : 'Under'} budget
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

            {/* Cost Charts - Task 8 */}
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-4">Cost Trends & Analysis</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {/* Monthly Cost Trends */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Monthly Cost Trends</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={costCharts.monthlyTrends}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const month = data.activePayload[0].payload.month;
                            setDrilldownContext({
                              type: 'month',
                              value: month,
                              label: `Costs for ${month}`,
                            });
                            setDrilldownOpen(true);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis 
                          dataKey="month" 
                          className="text-xs"
                          angle={-45}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis className="text-xs" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="laborActual" 
                          stroke="#2563eb" 
                          name="Labor" 
                          strokeWidth={2}
                          data-testid="line-labor-trend"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lubricantActual" 
                          stroke="#10b981" 
                          name="Lubricants" 
                          strokeWidth={2}
                          data-testid="line-lubricant-trend"
                        />
                        <Line 
                          type="monotone" 
                          dataKey="outsourceActual" 
                          stroke="#f59e0b" 
                          name="Outsource" 
                          strokeWidth={2}
                          data-testid="line-outsource-trend"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost Breakdown Pie Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Labor', value: costCharts.breakdown.labor },
                            { name: 'Lubricants', value: costCharts.breakdown.lubricants },
                            { name: 'Outsource', value: costCharts.breakdown.outsource },
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => 
                            percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : null
                          }
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          data-testid="pie-cost-breakdown"
                          onClick={(data) => {
                            if (data && data.name) {
                              setDrilldownContext({
                                type: 'costType',
                                value: data.name,
                                label: `${data.name} cost breakdown`,
                              });
                              setDrilldownOpen(true);
                            }
                          }}
                        >
                          <Cell fill="#2563eb" key="cell-0" />
                          <Cell fill="#10b981" key="cell-1" />
                          <Cell fill="#f59e0b" key="cell-2" />
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost by Equipment Type */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost by Equipment Type</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={costCharts.byEquipmentType}
                        layout="vertical"
                        margin={{ left: 100 }}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const equipmentType = data.activePayload[0].payload.name;
                            setDrilldownContext({
                              type: 'equipmentType',
                              value: equipmentType,
                              label: `Costs for ${equipmentType}`,
                            });
                            setDrilldownOpen(true);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          className="text-xs"
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#2563eb" 
                          name="Total Cost (ETB)"
                          data-testid="bar-equipment-type"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost by Garage */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Cost by Garage</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart 
                        data={costCharts.byGarage}
                        layout="vertical"
                        margin={{ left: 100 }}
                        onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const garageName = data.activePayload[0].payload.name;
                            setDrilldownContext({
                              type: 'garage',
                              value: garageName,
                              label: `Costs for ${garageName}`,
                            });
                            setDrilldownOpen(true);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis 
                          dataKey="name" 
                          type="category" 
                          className="text-xs"
                          width={90}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Bar 
                          dataKey="value" 
                          fill="#10b981" 
                          name="Total Cost (ETB)"
                          data-testid="bar-garage"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Show message if no data */}
            {kpis.totalPlanned === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Data Available</h3>
                  <p className="text-sm text-muted-foreground text-center max-w-md">
                    There are no work orders for the selected time period and workshop.
                    Try selecting a different filter or create some work orders to see analytics.
                  </p>
                </CardContent>
              </Card>
            )}

            {kpis.totalPlanned > 0 && (
              <>
                {/* Quarterly Performance */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quarterly Work Order Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={quarterlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="quarter" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Legend />
                          <Bar dataKey="planned" fill="#94a3b8" name="Planned" />
                          <Bar dataKey="completed" fill="#2563eb" name="Completed" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Accomplishment Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={quarterlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="quarter" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="accomplishment"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Accomplishment %"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Workshop Performance Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Workshop Performance Comparison</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={workshopPerformance} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis dataKey="name" type="category" className="text-xs" width={90} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--background))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                          }}
                        />
                        <Legend />
                        <Bar dataKey="q1" fill={COLORS[0]} name="Q1" />
                        <Bar dataKey="q2" fill={COLORS[1]} name="Q2" />
                        <Bar dataKey="q3" fill={COLORS[2]} name="Q3" />
                        <Bar dataKey="q4" fill={COLORS[3]} name="Q4" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Cost Analysis */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Quarterly Cost Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={quarterlyData}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="quarter" className="text-xs" />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                            formatter={(value: any) => `${(value / 1000000).toFixed(2)}M ETB`}
                          />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="cost"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="Total Cost"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Annual Cost Distribution</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={costBreakdown}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {costBreakdown.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "hsl(var(--background))",
                              border: "1px solid hsl(var(--border))",
                              borderRadius: "var(--radius)",
                            }}
                            formatter={(value: any) => `${(value / 1000000).toFixed(2)}M ETB`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Workshop Cost Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Workshop Cost Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {workshopPerformance.map((workshop: any, index: number) => (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="text-sm font-medium">{workshop.name}</p>
                              <p className="text-xs text-muted-foreground">
                                Avg Cost: {(workshop.avgCost / 1000).toFixed(2)}K ETB
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold">
                                {(workshop.totalCost / 1000000).toFixed(2)}M ETB
                              </p>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="h-2 rounded-full transition-all"
                              style={{
                                width: `${(workshop.totalCost / kpis.totalCost) * 100}%`,
                                backgroundColor: COLORS[index % COLORS.length],
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </>
        )}
      </div>

      {/* Cost Drilldown Dialog */}
      <CostDrilldownDialog
        open={drilldownOpen}
        onOpenChange={setDrilldownOpen}
        context={drilldownContext}
        workshopId={workshopId}
        timePeriod={timePeriod}
        startDate={startDate}
        endDate={endDate}
        year={year}
        useCustomRange={useCustomRange}
        weekStartDate={weekStartDate}
        dailyDate={dailyDate}
      />
    </div>
  );
}
