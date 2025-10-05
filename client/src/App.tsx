import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ThemeToggle } from "@/components/ThemeToggle";
import EquipmentPage from "@/pages/Equipment";
import SparePartsPage from "@/pages/SpareParts";
import ModelsPage from "@/pages/Models";
import UploadModelPage from "@/pages/UploadModel";
import MaintenancePage from "@/pages/Maintenance";
import LoginPage from "@/pages/Login";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import React from "react";

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={EquipmentPage} />
      <Route path="/equipment" component={EquipmentPage} />
      <Route path="/parts" component={SparePartsPage} />
      <Route path="/maintenance" component={MaintenancePage} />
      <Route path="/models" component={ModelsPage} />
      <Route path="/upload" component={UploadModelPage} />
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
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      setLocation("/login");
    },
  });

  // Redirect to login if not authenticated
  React.useEffect(() => {
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
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1">
          <header className="flex items-center justify-between h-14 px-4 border-b bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              {(authData as any)?.user && (
                <div className="flex items-center gap-2 text-sm">
                  <UserIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-foreground">{(authData as any).user.fullName}</span>
                  {(authData as any).user.role === "CEO" && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded">
                      CEO
                    </span>
                  )}
                </div>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                data-testid="button-logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-hidden bg-background">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AppContent />
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
