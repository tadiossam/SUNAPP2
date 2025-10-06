import { Home, Wrench, Box, Upload, ClipboardList } from "lucide-react";
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

  const menuItems = [
    {
      title: t("equipment"),
      url: "/",
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
              {menuItems.map((item) => (
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
