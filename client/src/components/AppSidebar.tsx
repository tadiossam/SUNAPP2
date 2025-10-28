import { Home, Wrench, Box, Upload, ClipboardList, Building2, Users, FileText, BookOpen, MapPin, CheckCircle, Truck, Settings, ClipboardCheck, Search, Package, BarChart3, Store } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

export function AppSidebar() {
  const [location] = useLocation();
  const { t } = useLanguage();

  const mainMenuItems = [
    {
      title: t("dashboard"),
      url: "/",
      icon: BarChart3,
      testId: "link-dashboard",
    },
    {
      title: t("equipment"),
      url: "/equipment",
      icon: Home,
      testId: "link-equipment",
    },
    {
      title: t("spareParts"),
      url: "/parts",
      icon: Wrench,
      testId: "link-parts",
    },
    {
      title: t("maintenanceHistory"),
      url: "/maintenance",
      icon: ClipboardList,
      testId: "link-maintenance",
    },
    {
      title: t("models3D"),
      url: "/models",
      icon: Box,
      testId: "link-models",
    },
    {
      title: t("uploadModel"),
      url: "/upload",
      icon: Upload,
      testId: "link-upload",
    },
    {
      title: t("items"),
      url: "/items",
      icon: Package,
      testId: "link-items",
    },
  ];

  const garageMenuItems = [
    {
      title: t("garages"),
      url: "/garages",
      icon: Building2,
      testId: "link-garages",
    },
    {
      title: "Equipment Reception",
      url: "/equipment-reception",
      icon: Truck,
      testId: "link-equipment-reception",
    },
    {
      title: "Equipment Maintenances",
      url: "/equipment-maintenances",
      icon: ClipboardCheck,
      testId: "link-equipment-maintenances",
    },
    {
      title: "Inspection",
      url: "/inspection",
      icon: Search,
      testId: "link-inspection",
    },
    {
      title: t("employees"),
      url: "/employees",
      icon: Users,
      testId: "link-employees",
    },
    {
      title: t("approvals"),
      url: "/approvals",
      icon: CheckCircle,
      testId: "link-approvals",
    },
    {
      title: t("workOrders"),
      url: "/work-orders",
      icon: FileText,
      testId: "link-work-orders",
    },
    {
      title: t("partsLocations"),
      url: "/parts-locations",
      icon: MapPin,
      testId: "link-parts-locations",
    },
    {
      title: "Store Manager",
      url: "/store-manager",
      icon: Store,
      testId: "link-store-manager",
    },
    {
      title: t("adminSettings"),
      url: "/admin-settings",
      icon: Settings,
      testId: "link-admin-settings",
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Wrench className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-base font-semibold">{t("appName")}</span>
            <span className="text-xs text-muted-foreground">{t("heavyEquipment")}</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t("navigation")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <SidebarGroup>
          <SidebarGroupLabel>{t("garageManagement")}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {garageMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={location === item.url}>
                    <Link href={item.url} data-testid={item.testId}>
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
