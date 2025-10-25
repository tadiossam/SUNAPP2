import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
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

const COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#f59e0b", "#10b981", "#f97316", "#8b5cf6"];

export default function Dashboard() {
  const { t } = useLanguage();
  const [timePeriod, setTimePeriod] = useState<string>("annual");
  const [workshopId, setWorkshopId] = useState<string>("all");
  const [year, setYear] = useState<number>(new Date().getFullYear());

  // Fetch dashboard analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: [`/api/dashboard/analytics?timePeriod=${timePeriod}&workshopId=${workshopId}&year=${year}`],
  });

  const kpis = analyticsData?.kpis || {
    totalWorkOrders: 0,
    totalPlanned: 0,
    accomplishmentRate: 0,
    totalCost: 0,
    activeWorkshops: 0,
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
                      <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                      <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
                      <SelectItem value="q3">Q3 (Jul-Sep)</SelectItem>
                      <SelectItem value="q4">Q4 (Oct-Dec)</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Workshop Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Maintenance Workshop</label>
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

                {/* Year Filter */}
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
    </div>
  );
}
