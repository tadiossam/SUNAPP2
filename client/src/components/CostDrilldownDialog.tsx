import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { FileText, Calendar, Wrench } from "lucide-react";
import { format } from "date-fns";
import { getFiscalQuarterRange } from "@shared/fiscal";

interface CostDrilldownDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context: {
    type: 'month' | 'equipmentType' | 'garage' | 'costType' | null;
    value: string | null;
    label: string | null;
  };
  workshopId: string;
  timePeriod: string;
  startDate: string;
  endDate: string;
  year: number;
  useCustomRange: boolean;
  weekStartDate: string;
  dailyDate: string;
}

export default function CostDrilldownDialog({ 
  open, 
  onOpenChange, 
  context, 
  workshopId, 
  timePeriod, 
  startDate, 
  endDate, 
  year,
  useCustomRange,
  weekStartDate,
  dailyDate
}: CostDrilldownDialogProps) {
  // Build query params based on drill-down context AND dashboard filters
  const buildQueryParams = () => {
    if (!context.type || !context.value) return '';
    
    const params = new URLSearchParams();
    params.append('status', 'completed'); // Only completed orders have cost data
    
    // Add workshop filter from dashboard
    if (workshopId && workshopId !== 'all') {
      params.append('workshopId', workshopId);
    }
    
    // Add context-specific filter
    if (context.type === 'month') {
      // Filter by completion month
      const [year, month] = context.value.split('-');
      let monthStart = new Date(parseInt(year), parseInt(month) - 1, 1);
      let monthEnd = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);
      
      // Clamp to active dashboard period (custom, weekly, daily, or any other active filter)
      let dashboardStart: Date | null = null;
      let dashboardEnd: Date | null = null;
      
      if (useCustomRange && startDate && endDate) {
        // Custom range
        dashboardStart = new Date(startDate);
        dashboardEnd = new Date(endDate);
        dashboardEnd.setHours(23, 59, 59, 999);
      } else if (timePeriod === 'weekly' && weekStartDate) {
        // Weekly period
        dashboardStart = new Date(weekStartDate);
        dashboardEnd = new Date(weekStartDate);
        dashboardEnd.setDate(dashboardStart.getDate() + 6);
        dashboardEnd.setHours(23, 59, 59, 999);
      } else if (timePeriod === 'daily' && dailyDate) {
        // Daily period
        dashboardStart = new Date(dailyDate);
        dashboardStart.setHours(0, 0, 0, 0);
        dashboardEnd = new Date(dailyDate);
        dashboardEnd.setHours(23, 59, 59, 999);
      }
      
      // Intersect month range with dashboard period bounds
      if (dashboardStart && dashboardEnd) {
        monthStart = monthStart < dashboardStart ? dashboardStart : monthStart;
        monthEnd = monthEnd > dashboardEnd ? dashboardEnd : monthEnd;
      }
      
      params.append('completedAfter', monthStart.toISOString());
      params.append('completedBefore', monthEnd.toISOString());
    } else if (context.type === 'equipmentType') {
      params.append('equipmentCategory', context.value);
    } else if (context.type === 'garage') {
      params.append('garage', context.value);
    } else if (context.type === 'costType') {
      // Filter by cost type - show all completed orders with cost data
      // Additional filtering will be done client-side to show only relevant cost type
      params.append('hasCostData', 'true');
    }
    
    // Add dashboard date range filters if not month-specific drill-down
    // IMPORTANT: Replicate Dashboard's exact date logic to ensure drill-down matches chart data
    if (context.type !== 'month') {
      let filterStart: Date | null = null;
      let filterEnd: Date | null = null;
      
      if (useCustomRange && startDate && endDate) {
        // Custom date range
        filterStart = new Date(startDate);
        filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);
      } else if (timePeriod === 'q1') {
        const { start, end } = getFiscalQuarterRange(1, year);
        filterStart = start;
        filterEnd = end;
      } else if (timePeriod === 'q2') {
        const { start, end } = getFiscalQuarterRange(2, year);
        filterStart = start;
        filterEnd = end;
      } else if (timePeriod === 'q3') {
        const { start, end } = getFiscalQuarterRange(3, year);
        filterStart = start;
        filterEnd = end;
      } else if (timePeriod === 'q4') {
        const { start, end } = getFiscalQuarterRange(4, year);
        filterStart = start;
        filterEnd = end;
      } else if (timePeriod === 'monthly') {
        // For monthly mode, dashboard aggregates the FULL YEAR (all 12 months)
        // NOT a single month - use year range to match dashboard analytics
        filterStart = new Date(year, 0, 1);
        filterEnd = new Date(year, 11, 31, 23, 59, 59);
      } else if (timePeriod === 'weekly') {
        // Use selected week start from dashboard
        const weekStart = new Date(weekStartDate);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);
        filterStart = weekStart;
        filterEnd = weekEnd;
      } else if (timePeriod === 'daily') {
        // Use selected day from dashboard
        const dayStart = new Date(dailyDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(dailyDate);
        dayEnd.setHours(23, 59, 59, 999);
        filterStart = dayStart;
        filterEnd = dayEnd;
      } else {
        // Annual (default)
        filterStart = new Date(year, 0, 1);
        filterEnd = new Date(year, 11, 31, 23, 59, 59);
      }
      
      if (filterStart && filterEnd) {
        params.append('completedAfter', filterStart.toISOString());
        params.append('completedBefore', filterEnd.toISOString());
      }
    }
    
    return params.toString();
  };

  // Fetch filtered work orders with proper typing
  const { data: workOrders, isLoading } = useQuery<any[]>({
    queryKey: [`/api/work-orders?${buildQueryParams()}`],
    enabled: open && !!context.type && !!context.value,
  });

  const formatCurrency = (value: number) => {
    return `ETB ${(value / 1000).toFixed(1)}K`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" data-testid="dialog-cost-drilldown">
        <DialogHeader>
          <DialogTitle className="text-2xl">Cost Details</DialogTitle>
          <DialogDescription>
            {context.label || "Loading..."}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground">Loading work orders...</div>
        ) : workOrders && workOrders.length > 0 ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Work Orders ({workOrders.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {workOrders.map((order: any) => (
                    <div 
                      key={order.id} 
                      className="p-4 border rounded-lg hover-elevate"
                      data-testid={`drilldown-order-${order.id}`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="font-semibold">{order.workOrderNumber}</span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {order.description || "No description"}
                          </p>
                        </div>
                        <Badge variant="outline" data-testid={`badge-status-${order.id}`}>
                          {order.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Wrench className="h-3 w-3" />
                            <span>Equipment</span>
                          </div>
                          <p className="font-medium truncate">{order.equipmentModel || "N/A"}</p>
                        </div>

                        <div>
                          <div className="flex items-center gap-1 text-muted-foreground mb-1">
                            <Calendar className="h-3 w-3" />
                            <span>Completed</span>
                          </div>
                          <p className="font-medium">
                            {order.completedAt ? format(new Date(order.completedAt), 'MMM dd, yyyy') : "N/A"}
                          </p>
                        </div>

                        <div>
                          <div className="text-muted-foreground mb-1">Total Cost</div>
                          <p className="font-bold text-primary" data-testid={`cost-total-${order.id}`}>
                            {formatCurrency(parseFloat(order.totalActualCost || '0'))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">Labor:</span>
                          <span className="ml-1 font-medium" data-testid={`cost-labor-${order.id}`}>
                            ETB {parseFloat(order.actualLaborCost || '0').toFixed(0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Lubricants:</span>
                          <span className="ml-1 font-medium" data-testid={`cost-lubricant-${order.id}`}>
                            ETB {parseFloat(order.actualLubricantCost || '0').toFixed(0)}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Outsource:</span>
                          <span className="ml-1 font-medium" data-testid={`cost-outsource-${order.id}`}>
                            ETB {parseFloat(order.actualOutsourceCost || '0').toFixed(0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="py-12 text-center text-muted-foreground">
            No completed work orders found for this selection.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
