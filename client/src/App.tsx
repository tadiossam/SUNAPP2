import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { LanguageToggle } from "@/components/LanguageToggle";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import DashboardPage from "@/pages/Dashboard";
import EquipmentPage from "@/pages/Equipment";
import EquipmentCategoryPage from "@/pages/EquipmentCategory";
import EquipmentReceptionPage from "@/pages/EquipmentReception";
import EquipmentMaintenancesPage from "@/pages/EquipmentMaintenances";
import InspectionPage from "@/pages/Inspection";
import SparePartsPage from "@/pages/SpareParts";
import ModelsPage from "@/pages/Models";
import UploadModelPage from "@/pages/UploadModel";
import MaintenancePage from "@/pages/Maintenance";
import LoginPage from "@/pages/Login";
import GaragesPage from "@/pages/Garages";
import GarageDetailsPage from "@/pages/GarageDetails";
import GarageDetailPage from "@/pages/GarageDetail";
import WorkshopDetailPage from "@/pages/WorkshopDetail";
import EmployeesPage from "@/pages/Employees";
import ApprovalsPage from "@/pages/Approvals";
import WorkOrdersPage from "@/pages/WorkOrders";
import PartsLocationsPage from "@/pages/PartsLocations";
import AdminPage from "@/pages/Admin";
import AdminSettingsPage from "@/pages/AdminSettings";
import ItemsPage from "@/pages/Items";
import StoreManagerDashboard from "@/pages/StoreManagerDashboard";
import TeamPerformance from "@/pages/TeamPerformance";
import ForemanDashboard from "@/pages/ForemanDashboard";
import VerifierDashboard from "@/pages/VerifierDashboard";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={DashboardPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/equipment/category/:type" component={EquipmentCategoryPage} />
      <Route path="/equipment" component={EquipmentPage} />
      <Route path="/equipment-reception" component={EquipmentReceptionPage} />
      <Route path="/equipment-maintenances" component={EquipmentMaintenancesPage} />
      <Route path="/inspection" component={InspectionPage} />
      <Route path="/parts" component={SparePartsPage} />
      <Route path="/maintenance" component={MaintenancePage} />
      <Route path="/models" component={ModelsPage} />
      <Route path="/upload" component={UploadModelPage} />
      <Route path="/garages/:id/old" component={GarageDetailsPage} />
      <Route path="/garages/:id" component={GarageDetailPage} />
      <Route path="/garages" component={GaragesPage} />
      <Route path="/workshops/:id" component={WorkshopDetailPage} />
      <Route path="/employees" component={EmployeesPage} />
      <Route path="/approvals" component={ApprovalsPage} />
      <Route path="/work-orders" component={WorkOrdersPage} />
      <Route path="/parts-locations" component={PartsLocationsPage} />
      <Route path="/items" component={ItemsPage} />
      <Route path="/store-manager" component={StoreManagerDashboard} />
      <Route path="/foreman" component={ForemanDashboard} />
      <Route path="/verifier" component={VerifierDashboard} />
      <Route path="/team-performance" component={TeamPerformance} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin-settings" component={AdminSettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check authentication status
  const { data: authData, isLoading } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/logout");
      return res.json();
    },
    onSuccess: () => {
      // Remove JWT token from localStorage
      localStorage.removeItem("auth_token");
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation("/login");
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !(authData as any)?.user && location !== "/login") {
      setLocation("/login");
    }
  }, [isLoading, authData, location, setLocation]);

  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  // If on login page, show login without sidebar
  if (location === "/login") {
    return <Router />;
  }

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <SidebarProvider style={style as any}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between h-10 px-2 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-1.5">
              {(authData as any)?.user && (
                <div className="flex items-center gap-1.5 text-[11px]">
                  <UserIcon className="h-3 w-3 text-muted-foreground" />
                  <span className="text-foreground">{(authData as any).user.fullName}</span>
                  {(authData as any).user.role === "CEO" && (
                    <span className="px-1 py-0 text-[10px] font-medium bg-primary/10 text-primary rounded">
                      CEO
                    </span>
                  )}
                </div>
              )}
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-3.5 w-3.5" />
              </Button>
              <LanguageToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
