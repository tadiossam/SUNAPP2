import { Switch, Route, useLocation } from "wouter";
import { queryClient, apiRequest } from "./lib/queryClient";
import { QueryClientProvider, useQuery, useMutation } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { LanguageProvider } from "@/contexts/LanguageContext";
import EquipmentPage from "@/pages/Equipment";
import SparePartsPage from "@/pages/SpareParts";
import ModelsPage from "@/pages/Models";
import UploadModelPage from "@/pages/UploadModel";
import MaintenancePage from "@/pages/Maintenance";
import LoginPage from "@/pages/Login";
import GaragesPage from "@/pages/Garages";
import EmployeesPage from "@/pages/Employees";
import ApprovalsPage from "@/pages/Approvals";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut, User as UserIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Theme Provider inline to avoid import issues
type Theme = "light" | "dark";
type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};
const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined);

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (!context) throw new Error("useTheme must be within ThemeProvider");
  return context;
};

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
      <Route path="/garages" component={GaragesPage} />
      <Route path="/employees" component={EmployeesPage} />
      <Route path="/approvals" component={ApprovalsPage} />
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
        <LanguageProvider>
          <TooltipProvider>
            <AppContent />
            <Toaster />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
