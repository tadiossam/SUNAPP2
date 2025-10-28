import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, TrendingUp, Clock, Wrench } from "lucide-react";

type PerformanceMetric = {
  employeeId: string;
  fullName: string;
  role: string;
  tasksCompleted: number;
  workOrdersCompleted: number;
  totalLaborHours: number;
  requisitionsProcessed: number;
  performanceScore: number;
  rank: number;
  dailyScore?: number;
  monthlyScore?: number;
  yearlyScore?: number;
};

export default function TeamPerformancePage() {
  const { data: dailyLeaders, isLoading: loadingDaily } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/performance/daily"],
  });

  const { data: monthlyLeaders, isLoading: loadingMonthly } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/performance/monthly"],
  });

  const { data: yearlyLeaders, isLoading: loadingYearly } = useQuery<PerformanceMetric[]>({
    queryKey: ["/api/performance/yearly"],
  });

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-700" />;
      default:
        return <Award className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-yellow-500 text-black">🥇 Champion</Badge>;
      case 2:
        return <Badge variant="secondary">🥈 Runner-up</Badge>;
      case 3:
        return <Badge variant="outline">🥉 Third Place</Badge>;
      default:
        return <Badge variant="outline">#{rank}</Badge>;
    }
  };

  const LeaderboardTable = ({ data, isLoading }: { data?: PerformanceMetric[]; isLoading: boolean }) => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading performance data...</div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">No performance data available</div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {data.map((employee) => (
          <Card
            key={employee.employeeId}
            className={employee.rank <= 3 ? "border-2 border-primary" : ""}
            data-testid={`performance-card-${employee.employeeId}`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                    {getRankIcon(employee.rank)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg" data-testid={`text-employee-name-${employee.employeeId}`}>
                        {employee.fullName}
                      </h3>
                      {getRankBadge(employee.rank)}
                      <Badge variant="secondary">{employee.role}</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Work Orders</p>
                        <p className="font-medium" data-testid={`text-work-orders-${employee.employeeId}`}>
                          {employee.workOrdersCompleted}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tasks</p>
                        <p className="font-medium">{employee.tasksCompleted}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Labor Hours</p>
                        <p className="font-medium">{employee.totalLaborHours?.toFixed(1) || "0.0"}h</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Requisitions</p>
                        <p className="font-medium">{employee.requisitionsProcessed}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-muted-foreground text-sm">Performance Score</p>
                  <p className="text-3xl font-bold text-primary" data-testid={`text-score-${employee.employeeId}`}>
                    {employee.performanceScore}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-none p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">
              Team Performance
            </h1>
            <p className="text-muted-foreground">Employee leaderboard and achievement tracking</p>
          </div>
          <TrendingUp className="h-12 w-12 text-primary" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <Tabs defaultValue="daily" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3" data-testid="tabs-performance-period">
            <TabsTrigger value="daily" data-testid="tab-daily">
              <Clock className="h-4 w-4 mr-2" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="monthly" data-testid="tab-monthly">
              <Wrench className="h-4 w-4 mr-2" />
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" data-testid="tab-yearly">
              <Trophy className="h-4 w-4 mr-2" />
              Yearly
            </TabsTrigger>
          </TabsList>

          <TabsContent value="daily" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Today's Top Performers</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardTable data={dailyLeaders} isLoading={loadingDaily} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monthly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee of the Month</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardTable data={monthlyLeaders} isLoading={loadingMonthly} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Employee of the Year</CardTitle>
              </CardHeader>
              <CardContent>
                <LeaderboardTable data={yearlyLeaders} isLoading={loadingYearly} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
