import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingUp, DollarSign, CheckCircle, AlertCircle, Users, Wrench } from "lucide-react";

// Dashboard data based on quarterly reports
const quarterlyData = [
  {
    quarter: "Q1",
    planned: 665,
    completed: 599,
    accomplishment: 91.45,
    cost: 16809278.20,
    overhead: 3879064.20,
  },
  {
    quarter: "Q2",
    planned: 659,
    completed: 595,
    accomplishment: 90.29,
    cost: 13362347.67,
    overhead: 3083618.69,
  },
  {
    quarter: "Q3",
    planned: 694,
    completed: 631,
    accomplishment: 90.92,
    cost: 23191108.71,
    overhead: 5351194.32,
  },
  {
    quarter: "Q4",
    planned: 804,
    completed: 717,
    accomplishment: 89.17,
    cost: 18296629.49,
    overhead: 4222299.11,
  },
];

const departmentPerformance = [
  { name: "Light Duty", q1: 96.18, q2: 95.68, q3: 96.09, q4: 95.85, avgCost: 1634247.36 },
  { name: "Heavy Duty", q1: 91.09, q2: 88.54, q3: 93.14, q4: 85.79, avgCost: 4284825.38 },
  { name: "EMM", q1: 77.19, q2: 77.19, q3: 67.50, q4: 69.38, avgCost: 3579318.13 },
  { name: "Electric", q1: 91.72, q2: 80.95, q3: 89.01, q4: 89.23, avgCost: 1032506.04 },
  { name: "Welding", q1: 86.89, q2: 89.33, q3: 92.19, q4: 89.41, avgCost: 1224430.62 },
  { name: "Body & Paint", q1: 87.95, q2: 85.96, q3: 88.89, q4: 87.35, avgCost: 337355.03 },
  { name: "Machine", q1: 85.71, q2: 89.74, q3: 94.55, q4: 100.00, avgCost: 181192.83 },
];

const costBreakdown = [
  { name: "Direct Maintenance", value: 47083578.52, color: "#2563eb" },
  { name: "Overtime", value: 2321064.02, color: "#7c3aed" },
  { name: "Outsource", value: 3707011.20, color: "#dc2626" },
  { name: "Overhead (30%)", value: 16536176.32, color: "#f59e0b" },
];

const COLORS = ["#2563eb", "#7c3aed", "#dc2626", "#f59e0b", "#10b981", "#f97316", "#8b5cf6"];

export default function Dashboard() {
  const { t } = useLanguage();

  const totalPlanned = quarterlyData.reduce((sum, q) => sum + q.planned, 0);
  const totalCompleted = quarterlyData.reduce((sum, q) => sum + q.completed, 0);
  const totalCost = quarterlyData.reduce((sum, q) => sum + q.cost, 0);
  const avgAccomplishment = (quarterlyData.reduce((sum, q) => sum + q.accomplishment, 0) / quarterlyData.length).toFixed(2);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("dashboard")}</h1>
            <p className="text-sm text-muted-foreground">
              Annual Maintenance Performance Overview
            </p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Work Orders</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCompleted.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                of {totalPlanned.toLocaleString()} planned
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accomplishment Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgAccomplishment}%</div>
              <p className="text-xs text-muted-foreground">
                Average across all quarters
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {(totalCost / 1000000).toFixed(2)}M
              </div>
              <p className="text-xs text-muted-foreground">
                ETB (including overhead)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Departments</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">7</div>
              <p className="text-xs text-muted-foreground">
                Maintenance workshops
              </p>
            </CardContent>
          </Card>
        </div>

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
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
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
              <CardTitle className="text-base">Accomplishment Rate Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quarterlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="quarter" className="text-xs" />
                  <YAxis domain={[85, 95]} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="accomplishment" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Achievement (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Department Performance Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={departmentPerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" domain={[0, 100]} className="text-xs" />
                <YAxis dataKey="name" type="category" width={100} className="text-xs" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
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
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => `${(value / 1000000).toFixed(2)}M ETB`}
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
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {costBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))' 
                    }}
                    formatter={(value: number) => `${(value / 1000000).toFixed(2)}M ETB`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Department Cost Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Cost by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {departmentPerformance
                .sort((a, b) => b.avgCost - a.avgCost)
                .map((dept, index) => (
                  <div key={dept.name} className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{dept.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {(dept.avgCost / 1000).toFixed(0)}K ETB
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(dept.avgCost / Math.max(...departmentPerformance.map(d => d.avgCost))) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
