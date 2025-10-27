import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Settings,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Save,
  Server,
  Database,
  Truck,
  Rocket,
  Plus,
  Trash2,
  Edit,
  CheckCircle,
  Search,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/contexts/LanguageContext";
import type { SystemSettings } from "@shared/schema";
import { D365ItemsReviewDialog } from "@/components/D365ItemsReviewDialog";
import { D365EquipmentReviewDialog } from "@/components/D365EquipmentReviewDialog";

type DeviceSettings = {
  id: string;
  deviceName: string;
  deviceModel: string | null;
  serialNumber: string | null;
  ipAddress: string;
  port: number;
  timeout: number;
  isActive: boolean;
  lastSyncAt: string | null;
  lastImportAt: string | null;
};

type ImportLog = {
  id: string;
  operationType: string;
  status: string;
  usersImported: number;
  usersUpdated: number;
  usersSkipped: number;
  errorMessage: string | null;
  createdAt: string;
};

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Deployment Tool state
  const [serverHost, setServerHost] = useState("0.0.0.0");
  const [serverPort, setServerPort] = useState(3000);

  // Dynamics 365 Settings state
  const [d365Form, setD365Form] = useState({
    bcUrl: "",
    bcCompany: "",
    bcUsername: "",
    bcPassword: "",
    itemPrefix: "",
    equipmentPrefix: "",
    syncIntervalHours: 24,
  });

  // Parse D365 URL
  const parseD365Url = (fullUrl: string) => {
    try {
      // Example: http://192.168.0.16:7048/SUNCONBC1/ODataV4/Company('Sunshine%20Construction%20PLC%28Test')/items
      const match = fullUrl.match(/^(https?:\/\/[^/]+\/[^/]+)\/ODataV4\/Company\('([^']+)'\)/);
      
      if (match) {
        const baseUrl = match[1]; // http://192.168.0.16:7048/SUNCONBC1
        const companyEncoded = match[2]; // Sunshine%20Construction%20PLC%28Test
        const company = decodeURIComponent(companyEncoded); // Sunshine Construction PLC(Test
        
        setD365Form({
          ...d365Form,
          bcUrl: baseUrl,
          bcCompany: company,
        });
        
        toast({
          title: "URL Parsed",
          description: "Form fields have been auto-filled from URL",
        });
      } else {
        toast({
          title: "Invalid URL",
          description: "Could not parse URL. Please check format.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Parse Error",
        description: "Failed to parse URL",
        variant: "destructive",
      });
    }
  };

  // Biometric Device state
  const [deviceForm, setDeviceForm] = useState({
    deviceName: "iFace990 Plus",
    deviceModel: "iFace990 Plus",
    serialNumber: "CKPG222360158",
    ipAddress: "192.168.40.2",
    port: "4370",
    timeout: "5000",
  });

  // Preview dialog state
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState<any[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [importProgress, setImportProgress] = useState(0);
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // D365 Sync state
  const [itemsPrefix, setItemsPrefix] = useState("SP-");
  const [equipmentPrefix, setEquipmentPrefix] = useState("EQ-");
  const [previewedItems, setPreviewedItems] = useState<any[]>([]);
  const [previewedEquipment, setPreviewedEquipment] = useState<any[]>([]);
  const [isItemsReviewOpen, setIsItemsReviewOpen] = useState(false);
  const [isEquipmentReviewOpen, setIsEquipmentReviewOpen] = useState(false);

  // Fetch deployment settings
  const { data: deploySettings, isLoading: isLoadingDeploy } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // Fetch D365 settings
  const { data: d365Settings, isLoading: isLoadingD365 } = useQuery<any>({
    queryKey: ["/api/dynamics365/settings"],
  });

  // Fetch equipment categories for D365 import
  const { data: equipmentCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/equipment-categories"],
  });

  // Fetch all devices
  const { data: allDevices = [], isLoading: isLoadingDevices } = useQuery<DeviceSettings[]>({
    queryKey: ["/api/attendance-devices"],
  });

  // Fetch active device settings (for backward compatibility)
  const { data: deviceSettings, isLoading: isLoadingDevice } = useQuery<DeviceSettings>({
    queryKey: ["/api/attendance-device/settings"],
  });

  // State for Add Device dialog
  const [isAddDeviceOpen, setIsAddDeviceOpen] = useState(false);
  const [newDeviceForm, setNewDeviceForm] = useState({
    deviceName: "",
    deviceModel: "",
    serialNumber: "",
    ipAddress: "",
    port: "4370",
    timeout: "5000",
  });

  // Fetch import logs
  const { data: importLogs = [], isLoading: isLoadingLogs } = useQuery<ImportLog[]>({
    queryKey: ["/api/attendance-device/logs"],
  });

  // Fetch D365 sync logs
  const { data: d365SyncLogs = [], isLoading: isLoadingD365Logs } = useQuery<any[]>({
    queryKey: ["/api/dynamics365/sync-logs"],
  });

  // Fetch D365 preview items
  const { data: previewData, refetch: refetchPreview } = useQuery<{
    success: boolean;
    syncId: string;
    items: any[];
    totalCount: number;
    newCount: number;
    existingCount: number;
  }>({
    queryKey: ["/api/dynamics365/preview-items"],
    enabled: false, // Only fetch when explicitly called
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (deploySettings) {
      setServerHost(deploySettings.serverHost || "0.0.0.0");
      setServerPort(deploySettings.serverPort || 3000);
    }
  }, [deploySettings]);

  // Update D365 form when settings are loaded
  useEffect(() => {
    if (d365Settings) {
      setD365Form({
        bcUrl: d365Settings.bcUrl || "",
        bcCompany: d365Settings.bcCompany || "",
        bcUsername: d365Settings.bcUsername || "",
        bcPassword: "", // Don't populate password
        itemPrefix: d365Settings.itemPrefix || "",
        equipmentPrefix: d365Settings.equipmentPrefix || "",
        syncIntervalHours: d365Settings.syncIntervalHours || 24,
      });
    }
  }, [d365Settings]);

  // Deployment Tool Mutations
  const saveDeploymentMutation = useMutation({
    mutationFn: async (data: { serverHost: string; serverPort: number }) => {
      const response = await apiRequest("PATCH", "/api/system-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("settingsSavedSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
    },
    onError: (error: any) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToSaveSettings"),
        variant: "destructive",
      });
    },
  });

  // Dynamics 365 Mutations
  const saveD365SettingsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/settings", d365Form);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Dynamics 365 settings saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save Dynamics 365 settings",
        variant: "destructive",
      });
    },
  });

  const testD365ConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/test", d365Form);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: data.message,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Could not connect to Dynamics 365",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Connection Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const syncFromD365Mutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/sync-items");
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success",
        description: `Items synced successfully: ${data.savedCount} new, ${data.updatedCount} updated`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Sync failed",
        variant: "destructive",
      });
    },
  });

  // Import selected items from preview
  const importSelectedItemsMutation = useMutation({
    mutationFn: async ({ syncId, selectedItemIds }: { syncId: string; selectedItemIds: string[] }) => {
      const response = await apiRequest("POST", "/api/dynamics365/import-selected", {
        syncId,
        selectedItemIds,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Complete",
        description: `Imported ${data.totalImported} items (${data.savedCount} new, ${data.updatedCount} updated)`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/items"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/sync-logs"] });
      setIsItemsReviewOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Error",
        description: error.message || "Failed to import items",
        variant: "destructive",
      });
    },
  });

  const previewItemsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/preview-items", { prefix: itemsPrefix });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setPreviewedItems(data.items || []);
        setIsItemsReviewOpen(true);
        toast({
          title: "Items Preview Ready",
          description: `Found ${data.totalCount} items (${data.newCount} new, ${data.existingCount} existing)`,
        });
      } else {
        toast({
          title: "Preview Failed",
          description: data.message || "Could not preview items",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to preview items",
        variant: "destructive",
      });
    },
  });

  const previewEquipmentMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/preview-equipment", { prefix: equipmentPrefix });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setPreviewedEquipment(data.equipment || []);
        setIsEquipmentReviewOpen(true);
        toast({
          title: "Equipment Preview Ready",
          description: `Found ${data.totalCount} equipment (${data.newCount} new, ${data.existingCount} existing)`,
        });
      } else {
        toast({
          title: "Preview Failed",
          description: data.message || "Could not preview equipment",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to preview equipment",
        variant: "destructive",
      });
    },
  });

  const importItemsMutation = useMutation({
    mutationFn: async (selectedItems: any[]) => {
      const response = await apiRequest("POST", "/api/dynamics365/import-items", { 
        items: selectedItems,
        prefix: itemsPrefix 
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setIsItemsReviewOpen(false);
        setPreviewedItems([]);
        toast({
          title: "Import Successful",
          description: `Imported ${data.savedCount} new items, updated ${data.updatedCount} items`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/items"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/sync-logs"] });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Import failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import items",
        variant: "destructive",
      });
    },
  });

  const importEquipmentMutation = useMutation({
    mutationFn: async ({ selectedEquipment, defaultCategoryId }: { selectedEquipment: any[], defaultCategoryId: string | null }) => {
      const response = await apiRequest("POST", "/api/dynamics365/import-equipment", { 
        equipment: selectedEquipment,
        defaultCategoryId,
        prefix: equipmentPrefix
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.success) {
        setIsEquipmentReviewOpen(false);
        setPreviewedEquipment([]);
        toast({
          title: "Import Successful",
          description: `Imported ${data.savedCount} new equipment, updated ${data.updatedCount} equipment`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/sync-logs"] });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Import failed",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to import equipment",
        variant: "destructive",
      });
    },
  });

  // Biometric Device Mutations
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/test-connection", {
        ipAddress: deviceForm.ipAddress,
        port: parseInt(deviceForm.port),
        timeout: parseInt(deviceForm.timeout),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: `Connected to device. Found ${data.userCount} users.`,
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Could not connect to device",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Connection Error",
        description: "Failed to connect to attendance device",
        variant: "destructive",
      });
    },
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/settings", {
        ...deviceForm,
        port: parseInt(deviceForm.port),
        timeout: parseInt(deviceForm.timeout),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/settings"] });
      toast({
        title: "Settings Saved",
        description: "Device settings have been saved successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save device settings",
        variant: "destructive",
      });
    },
  });

  // New Device Management Mutations
  const createDeviceMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-devices", {
        ...newDeviceForm,
        port: parseInt(newDeviceForm.port),
        timeout: parseInt(newDeviceForm.timeout),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-devices"] });
      setIsAddDeviceOpen(false);
      setNewDeviceForm({
        deviceName: "",
        deviceModel: "",
        serialNumber: "",
        ipAddress: "",
        port: "4370",
        timeout: "5000",
      });
      toast({
        title: "Device Added",
        description: "Device has been added successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add device",
        variant: "destructive",
      });
    },
  });

  const setActiveDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await apiRequest("PATCH", `/api/attendance-devices/${deviceId}/activate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/settings"] });
      toast({
        title: "Active Device Set",
        description: "Device has been set as active",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to set active device",
        variant: "destructive",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await apiRequest("DELETE", `/api/attendance-devices/${deviceId}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-devices"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/settings"] });
      toast({
        title: "Device Deleted",
        description: "Device has been deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete device",
        variant: "destructive",
      });
    },
  });

  const importUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/import-users");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      if (data.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} users, updated ${data.updated}, skipped ${data.skipped}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import users",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Import Error",
        description: "Failed to import users from device",
        variant: "destructive",
      });
    },
  });

  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/sync");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      if (data.success) {
        toast({
          title: "Sync Successful",
          description: `Synced ${data.imported} new users, updated ${data.updated}`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: data.message || "Failed to sync users",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Sync Error",
        description: "Failed to sync users from device",
        variant: "destructive",
      });
    },
  });

  const fetchUsersMutation = useMutation({
    mutationFn: async () => {
      // Use active device settings instead of form values
      const activeDevice = allDevices.find(d => d.isActive) || deviceSettings;
      if (!activeDevice) {
        throw new Error("No active device configured. Please add and activate a device first.");
      }
      
      const res = await apiRequest("POST", "/api/attendance-device/fetch-users", {
        ipAddress: activeDevice.ipAddress,
        port: parseInt(activeDevice.port.toString()),
        timeout: parseInt(activeDevice.timeout.toString()),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setFetchedUsers(data.users || []);
        setSelectedUserIds([]);
        setUserSearchQuery(""); // Clear search when opening dialog
        setIsPreviewDialogOpen(true);
        toast({
          title: "Users Fetched",
          description: `Found ${data.count} users from the device`,
        });
      } else {
        toast({
          title: "Fetch Failed",
          description: data.message || "Failed to fetch users",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Fetch Error",
        description: "Failed to fetch users from device",
        variant: "destructive",
      });
    },
  });

  const importSelectedUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      // Use active device settings instead of form values
      const activeDevice = allDevices.find(d => d.isActive) || deviceSettings;
      if (!activeDevice) {
        throw new Error("No active device configured. Please add and activate a device first.");
      }
      
      const res = await apiRequest("POST", "/api/attendance-device/import-selected", {
        userIds,
        ipAddress: activeDevice.ipAddress,
        port: parseInt(activeDevice.port.toString()),
        timeout: parseInt(activeDevice.timeout.toString()),
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsPreviewDialogOpen(false);
      setFetchedUsers([]);
      setSelectedUserIds([]);
      
      if (data.success) {
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} users, updated ${data.updated}, skipped ${data.skipped}`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import selected users",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Import Error",
        description: "Failed to import selected users",
        variant: "destructive",
      });
    },
  });

  // Animate progress bar during import
  useEffect(() => {
    if (importSelectedUsersMutation.isPending) {
      setImportProgress(0);
      const interval = setInterval(() => {
        setImportProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 200);
      return () => clearInterval(interval);
    } else {
      setImportProgress(0);
    }
  }, [importSelectedUsersMutation.isPending]);

  const handleFetchUsers = () => {
    fetchUsersMutation.mutate();
  };

  const handleApproveImport = () => {
    if (selectedUserIds.length === 0) {
      toast({
        title: "No Users Selected",
        description: "Please select at least one user to import",
        variant: "destructive",
      });
      return;
    }
    importSelectedUsersMutation.mutate(selectedUserIds);
  };

  const handleDiscardImport = () => {
    setIsPreviewDialogOpen(false);
    setFetchedUsers([]);
    setSelectedUserIds([]);
    toast({
      title: "Import Cancelled",
      description: "User import has been cancelled",
    });
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Filter users based on search query
  const filteredUsers = fetchedUsers.filter(user => {
    if (!userSearchQuery.trim()) return true;
    const query = userSearchQuery.toLowerCase();
    return (
      user.userId?.toLowerCase().includes(query) ||
      user.name?.toLowerCase().includes(query) ||
      user.cardno?.toString().toLowerCase().includes(query)
    );
  });

  const toggleSelectAll = () => {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(user => user.userId));
    }
  };

  const handleSaveDeployment = () => {
    if (serverPort < 1 || serverPort > 65535) {
      toast({
        title: t("error"),
        description: t("invalidPortNumber"),
        variant: "destructive",
      });
      return;
    }

    saveDeploymentMutation.mutate({
      serverHost,
      serverPort,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("adminSettings")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("configureSystemSettings")}
          </p>
        </div>
      </div>

      {/* Content with Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="biometric" className="h-full flex flex-col">
          <div className="border-b px-6">
            <TabsList className="h-12">
              <TabsTrigger value="biometric" className="gap-2" data-testid="tab-biometric">
                <Users className="h-4 w-4" />
                Biometric Device INT
              </TabsTrigger>
              <TabsTrigger value="dynamics" className="gap-2" data-testid="tab-dynamics">
                <Database className="h-4 w-4" />
                Dynamics 365 IN
              </TabsTrigger>
              <TabsTrigger value="fleet" className="gap-2" data-testid="tab-fleet">
                <Truck className="h-4 w-4" />
                Fleet Management INT
              </TabsTrigger>
              <TabsTrigger value="deployment" className="gap-2" data-testid="tab-deployment">
                <Rocket className="h-4 w-4" />
                Deployment Tool
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Biometric Device Tab */}
          <TabsContent value="biometric" className="flex-1 overflow-auto p-6 m-0">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Device Management Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Biometric Devices
                      </CardTitle>
                      <CardDescription>Manage ZKTeco attendance devices</CardDescription>
                    </div>
                    <Dialog open={isAddDeviceOpen} onOpenChange={setIsAddDeviceOpen}>
                      <DialogTrigger asChild>
                        <Button data-testid="button-add-device">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Device
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Device</DialogTitle>
                          <DialogDescription>
                            Configure a new biometric attendance device
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="newDeviceName">Device Name *</Label>
                              <Input
                                id="newDeviceName"
                                value={newDeviceForm.deviceName}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceName: e.target.value })}
                                placeholder="iFace990 Plus"
                                data-testid="input-device-name"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newDeviceModel">Device Model</Label>
                              <Input
                                id="newDeviceModel"
                                value={newDeviceForm.deviceModel}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, deviceModel: e.target.value })}
                                placeholder="iFace990 Plus"
                                data-testid="input-device-model"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newSerialNumber">Serial Number</Label>
                              <Input
                                id="newSerialNumber"
                                value={newDeviceForm.serialNumber}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, serialNumber: e.target.value })}
                                placeholder="CKPG222360158"
                                data-testid="input-serial-number"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newIpAddress">IP Address *</Label>
                              <Input
                                id="newIpAddress"
                                value={newDeviceForm.ipAddress}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, ipAddress: e.target.value })}
                                placeholder="192.168.40.2"
                                data-testid="input-ip-address"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newPort">Port *</Label>
                              <Input
                                id="newPort"
                                type="number"
                                value={newDeviceForm.port}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, port: e.target.value })}
                                placeholder="4370"
                                data-testid="input-port"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="newTimeout">Timeout (ms) *</Label>
                              <Input
                                id="newTimeout"
                                type="number"
                                value={newDeviceForm.timeout}
                                onChange={(e) => setNewDeviceForm({ ...newDeviceForm, timeout: e.target.value })}
                                placeholder="5000"
                                data-testid="input-timeout"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsAddDeviceOpen(false)}
                            data-testid="button-cancel-add"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => createDeviceMutation.mutate()}
                            disabled={createDeviceMutation.isPending || !newDeviceForm.deviceName || !newDeviceForm.ipAddress}
                            data-testid="button-save-device"
                          >
                            {createDeviceMutation.isPending ? "Saving..." : "Save Device"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingDevices ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading devices...
                    </div>
                  ) : allDevices.length === 0 ? (
                    <div className="text-center py-8">
                      <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No devices configured</p>
                      <p className="text-sm text-muted-foreground mt-1">Click "Add Device" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {allDevices.map((device) => (
                        <div
                          key={device.id}
                          className={`p-4 rounded-lg border ${
                            device.isActive ? "border-primary bg-primary/5" : "border-border"
                          }`}
                          data-testid={`device-card-${device.id}`}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{device.deviceName}</h3>
                                {device.isActive && (
                                  <Badge variant="default" className="text-xs">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Active
                                  </Badge>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {device.deviceModel && <div><strong>Model:</strong> {device.deviceModel}</div>}
                                {device.serialNumber && <div><strong>Serial:</strong> {device.serialNumber}</div>}
                                <div><strong>IP:</strong> {device.ipAddress}:{device.port}</div>
                                <div><strong>Timeout:</strong> {device.timeout}ms</div>
                                {device.lastSyncAt && (
                                  <div><strong>Last Sync:</strong> {formatDate(device.lastSyncAt)}</div>
                                )}
                                {device.lastImportAt && (
                                  <div><strong>Last Import:</strong> {formatDate(device.lastImportAt)}</div>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {!device.isActive && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setActiveDeviceMutation.mutate(device.id)}
                                  disabled={setActiveDeviceMutation.isPending}
                                  data-testid={`button-activate-${device.id}`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => deleteDeviceMutation.mutate(device.id)}
                                disabled={deleteDeviceMutation.isPending || device.isActive}
                                data-testid={`button-delete-${device.id}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* User Import Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                  <CardDescription>Import and sync users from the biometric device</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      onClick={handleFetchUsers}
                      disabled={fetchUsersMutation.isPending}
                      data-testid="button-fetch-users"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      {fetchUsersMutation.isPending ? "Fetching..." : "Fetch & Preview Users"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => importUsersMutation.mutate()}
                      disabled={importUsersMutation.isPending}
                      data-testid="button-import-all"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      {importUsersMutation.isPending ? "Importing..." : "Import All (No Preview)"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => syncUsersMutation.mutate()}
                      disabled={syncUsersMutation.isPending}
                      data-testid="button-sync-users"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncUsersMutation.isPending ? "animate-spin" : ""}`} />
                      {syncUsersMutation.isPending ? "Syncing..." : "Sync New Users"}
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Fetch & Preview:</strong> Fetch users from device and select which ones to import.<br />
                      <strong>Import All:</strong> Import all users from device without preview.<br />
                      <strong>Sync New Users:</strong> Import only new users added since last sync.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              {/* Import Logs Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Import History
                      </CardTitle>
                      <CardDescription>Recent import and sync operations</CardDescription>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          View All
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
                        <DialogHeader>
                          <DialogTitle>All Import Logs</DialogTitle>
                          <DialogDescription>
                            Complete history of all import operations
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex-1 overflow-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Imported</TableHead>
                                <TableHead>Updated</TableHead>
                                <TableHead>Skipped</TableHead>
                                <TableHead>Error</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {importLogs.map((log) => (
                                <TableRow key={log.id}>
                                  <TableCell className="text-sm">
                                    {formatDate(log.createdAt)}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {log.operationType}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {log.status === "success" ? (
                                      <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Success
                                      </Badge>
                                    ) : (
                                      <Badge variant="destructive">
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Failed
                                      </Badge>
                                    )}
                                  </TableCell>
                                  <TableCell>{log.usersImported}</TableCell>
                                  <TableCell>{log.usersUpdated}</TableCell>
                                  <TableCell>{log.usersSkipped}</TableCell>
                                  <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                                    {log.errorMessage || "-"}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoadingLogs ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </div>
                  ) : importLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No import history available
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Results</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {importLogs.slice(0, 5).map((log) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm">
                                {formatDate(log.createdAt)}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">
                                  {log.operationType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {log.status === "success" ? (
                                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Success
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {log.usersImported} imported, {log.usersUpdated} updated, {log.usersSkipped} skipped
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dynamics 365 Tab */}
          <TabsContent value="dynamics" className="flex-1 overflow-auto p-6 m-0">
            <div className="max-w-4xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Dynamics 365 Business Central Connection
                  </CardTitle>
                  <CardDescription>Configure connection settings for Microsoft Dynamics 365 Business Central</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {d365Settings?.lastTestDate && (
                    <Alert className={d365Settings.lastTestStatus === 'success' ? "border-green-500 bg-green-50 dark:bg-green-950" : "border-red-500 bg-red-50 dark:bg-red-950"}>
                      {d365Settings.lastTestStatus === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <XCircle className="h-4 w-4 text-red-600" />}
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-medium">Last Test: {d365Settings.lastTestStatus === 'success' ? 'Successful' : 'Failed'}</p>
                            <p className="text-sm text-muted-foreground">{new Date(d365Settings.lastTestDate).toLocaleString()}</p>
                            {d365Settings.lastTestMessage && (
                              <p className="text-sm mt-1">{d365Settings.lastTestMessage}</p>
                            )}
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid gap-4">
                    {/* URL Parser Helper */}
                    <div className="space-y-2 p-4 bg-muted/50 rounded-lg border">
                      <Label htmlFor="fullUrl" className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        Quick Setup: Paste Your Working URL
                      </Label>
                      <Input
                        id="fullUrl"
                        placeholder="http://192.168.0.16:7048/SUNCONBC1/ODataV4/Company('Sunshine%20Construction%20PLC%28Test')/items"
                        data-testid="input-parse-url"
                        onPaste={(e) => {
                          const pastedUrl = e.clipboardData.getData('text');
                          setTimeout(() => parseD365Url(pastedUrl), 100);
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        💡 Paste the URL that works in your browser, and we'll auto-fill the fields below
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bcUrl">Business Central URL *</Label>
                      <Input
                        id="bcUrl"
                        value={d365Form.bcUrl}
                        onChange={(e) => setD365Form({ ...d365Form, bcUrl: e.target.value })}
                        placeholder="http://192.168.0.16:7048/SUNCONBC1"
                        data-testid="input-d365-url"
                      />
                      <p className="text-xs text-muted-foreground">
                        Just the base URL (without /ODataV4/...)
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bcCompany">Company Name *</Label>
                      <Input
                        id="bcCompany"
                        value={d365Form.bcCompany}
                        onChange={(e) => setD365Form({ ...d365Form, bcCompany: e.target.value })}
                        placeholder=""
                        data-testid="input-d365-company"
                      />
                      <p className="text-xs text-muted-foreground">
                        Exact company name (auto-decoded from URL if pasted above)
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="bcUsername">Username *</Label>
                        <Input
                          id="bcUsername"
                          value={d365Form.bcUsername}
                          onChange={(e) => setD365Form({ ...d365Form, bcUsername: e.target.value })}
                          placeholder=""
                          data-testid="input-d365-username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="bcPassword">Password *</Label>
                        <Input
                          id="bcPassword"
                          type="password"
                          value={d365Form.bcPassword}
                          onChange={(e) => setD365Form({ ...d365Form, bcPassword: e.target.value })}
                          placeholder="Enter password"
                          data-testid="input-d365-password"
                        />
                        <p className="text-xs text-muted-foreground">
                          {d365Settings ? "Leave blank to keep existing password" : "Enter your password"}
                        </p>
                      </div>
                    </div>

                    {/* Sync Filters Section */}
                    <div className="pt-4 border-t">
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Sync Filters
                      </h3>
                      
                      <div className="grid gap-4 md:grid-cols-3">
                        <div className="space-y-2">
                          <Label htmlFor="itemPrefix">Item Prefix (Optional)</Label>
                          <Input
                            id="itemPrefix"
                            value={d365Form.itemPrefix}
                            onChange={(e) => setD365Form({ ...d365Form, itemPrefix: e.target.value })}
                            placeholder="SP-"
                            data-testid="input-item-prefix"
                          />
                          <p className="text-xs text-muted-foreground">
                            Only sync items starting with this prefix
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="equipmentPrefix">Equipment Prefix (Optional)</Label>
                          <Input
                            id="equipmentPrefix"
                            value={d365Form.equipmentPrefix}
                            onChange={(e) => setD365Form({ ...d365Form, equipmentPrefix: e.target.value })}
                            placeholder="FA-"
                            data-testid="input-equipment-prefix"
                          />
                          <p className="text-xs text-muted-foreground">
                            Only sync fixed assets starting with this
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="syncInterval">Auto-Sync Interval (Hours)</Label>
                          <Input
                            id="syncInterval"
                            type="number"
                            min="1"
                            max="168"
                            value={d365Form.syncIntervalHours}
                            onChange={(e) => setD365Form({ ...d365Form, syncIntervalHours: parseInt(e.target.value) || 24 })}
                            placeholder="24"
                            data-testid="input-sync-interval"
                          />
                          <p className="text-xs text-muted-foreground">
                            How often to run auto-sync (1-168 hours)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    <Button
                      onClick={() => saveD365SettingsMutation.mutate()}
                      disabled={saveD365SettingsMutation.isPending || !d365Form.bcUrl || !d365Form.bcCompany || !d365Form.bcUsername}
                      data-testid="button-save-d365-settings"
                    >
                      {saveD365SettingsMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={async () => {
                        try {
                          const token = localStorage.getItem('token');
                          const response = await fetch("/api/dynamics365/generate-script", {
                            headers: {
                              'Authorization': `Bearer ${token}`
                            }
                          });
                          
                          if (!response.ok) {
                            const error = await response.json();
                            toast({
                              title: "Error",
                              description: error.message || "Failed to generate script",
                              variant: "destructive",
                            });
                            return;
                          }
                          
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'D365-Sync.ps1';
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                          
                          toast({
                            title: "Success",
                            description: "PowerShell script downloaded successfully",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to download script",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!d365Settings}
                      variant="default"
                      className="bg-primary"
                      data-testid="button-generate-script"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Generate PowerShell Script
                    </Button>

                    <Button
                      onClick={async () => {
                        const result = await refetchPreview();
                        if (result.data && result.data.totalCount > 0) {
                          setIsItemsReviewOpen(true);
                        } else {
                          toast({
                            title: "No Items to Review",
                            description: "No items found in preview. Run the PowerShell script first.",
                            variant: "destructive",
                          });
                        }
                      }}
                      disabled={!d365Settings}
                      variant="secondary"
                      data-testid="button-review-items"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      Review & Import Items
                    </Button>
                  </div>

                  {d365Settings && (
                    <Alert className="mt-4 border-blue-500/50 bg-blue-50 dark:bg-blue-950/20">
                      <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <AlertDescription className="text-blue-900 dark:text-blue-100">
                        <div className="space-y-3">
                          <div>
                            <p className="font-semibold">✨ New Preview & Select Workflow:</p>
                            <ol className="list-decimal ml-4 mt-2 space-y-1 text-sm">
                              <li><strong>Generate Script:</strong> Click "Generate PowerShell Script" button above</li>
                              <li><strong>Copy to D365 Server:</strong> Place D365-Sync.ps1 in C:\D365Sync\ on server 192.168.0.16</li>
                              <li><strong>Run PowerShell:</strong> Right-click D365-Sync.ps1 → "Run with PowerShell"</li>
                              <li><strong>Review Items:</strong> Click "Review & Import Items" button to see what was fetched</li>
                              <li><strong>Select & Import:</strong> Choose which items to import, then click "Import Selected"</li>
                              <li><strong>Auto-Sync (Optional):</strong> Run SETUP-AUTO-SYNC.bat for scheduled syncs</li>
                            </ol>
                          </div>
                          
                          <div className="pt-2 border-t border-blue-300/30">
                            <p className="font-semibold text-sm">🎯 How It Works:</p>
                            <ul className="ml-4 mt-1 space-y-1 text-sm">
                              <li>✅ PowerShell fetches <strong>ALL</strong> items from D365</li>
                              <li>✅ Filters by prefix ({d365Settings.itemPrefix ? `items: "${d365Settings.itemPrefix}*"` : 'items: all'}
                                {d365Settings.equipmentPrefix && `, equipment: "${d365Settings.equipmentPrefix}*"`})</li>
                              <li>✅ Stores in <strong>preview table</strong> (not imported yet)</li>
                              <li>✅ You review and select which items to import</li>
                              <li>✅ Only selected items are added/updated in your database</li>
                              <li>✅ Auto-sync runs every {d365Settings.syncIntervalHours || 24} hours when scheduled</li>
                            </ul>
                          </div>

                          <p className="text-sm mt-2 pt-2 border-t border-blue-300/30">
                            💡 <strong>Full Control:</strong> Review before importing - see what's new vs. what will update!
                          </p>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* PowerShell Sync History Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Import History
                  </CardTitle>
                  <CardDescription>Recent Dynamics 365 sync operations</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoadingD365Logs ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </div>
                  ) : d365SyncLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No import history available
                    </div>
                  ) : (
                    <div className="overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Prefix</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Results</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {d365SyncLogs.slice(0, 10).map((log: any) => (
                            <TableRow key={log.id}>
                              <TableCell className="text-sm">
                                {new Date(log.createdAt).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="capitalize">
                                  {log.syncType}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <code className="text-xs bg-muted px-2 py-1 rounded">
                                  {log.prefix || "N/A"}
                                </code>
                              </TableCell>
                              <TableCell>
                                {log.status === "success" ? (
                                  <Badge className="bg-green-500/10 text-green-600 dark:text-green-400">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    Success
                                  </Badge>
                                ) : log.status === "partial" ? (
                                  <Badge variant="secondary">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Partial
                                  </Badge>
                                ) : (
                                  <Badge variant="destructive">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    Failed
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {log.recordsImported > 0 && `${log.recordsImported} imported`}
                                {log.recordsImported > 0 && log.recordsUpdated > 0 && ", "}
                                {log.recordsUpdated > 0 && `${log.recordsUpdated} updated`}
                                {(log.recordsImported > 0 || log.recordsUpdated > 0) && log.recordsSkipped > 0 && ", "}
                                {log.recordsSkipped > 0 && `${log.recordsSkipped} skipped`}
                                {log.recordsImported === 0 && log.recordsUpdated === 0 && log.recordsSkipped === 0 && "No records"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Fleet Management Tab */}
          <TabsContent value="fleet" className="flex-1 overflow-auto p-6 m-0">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Fleet Management Integration
                  </CardTitle>
                  <CardDescription>Configure integration with fleet management systems</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Fleet management integration settings will be available in a future update.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Deployment Tool Tab */}
          <TabsContent value="deployment" className="flex-1 overflow-auto p-6 m-0">
            <div className="max-w-2xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    <CardTitle>{t("serverConfiguration")}</CardTitle>
                  </div>
                  <CardDescription>
                    {t("configureServerHostAndPort")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {t("serverRestartRequired")}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="serverHost">{t("serverHost")}</Label>
                    <Input
                      id="serverHost"
                      value={serverHost}
                      onChange={(e) => setServerHost(e.target.value)}
                      placeholder="0.0.0.0"
                      data-testid="input-server-host"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("serverHostDescription")}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serverPort">{t("serverPort")}</Label>
                    <Input
                      id="serverPort"
                      type="number"
                      min="1"
                      max="65535"
                      value={serverPort}
                      onChange={(e) => setServerPort(parseInt(e.target.value) || 3000)}
                      placeholder="3000"
                      data-testid="input-server-port"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("serverPortDescription")}
                    </p>
                  </div>

                  {deploySettings && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">{t("currentSettings")}:</p>
                      <div className="bg-muted p-3 rounded-md text-sm font-mono">
                        <div>Host: {deploySettings.serverHost || "0.0.0.0"}</div>
                        <div>Port: {deploySettings.serverPort || 3000}</div>
                        {deploySettings.updatedAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            {t("lastUpdated")}: {new Date(deploySettings.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 flex justify-end">
                    <Button
                      onClick={handleSaveDeployment}
                      disabled={saveDeploymentMutation.isPending || isLoadingDeploy}
                      data-testid="button-save-settings"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveDeploymentMutation.isPending ? t("saving") : t("saveSettings")}
                    </Button>
                  </div>

                  <Alert className="mt-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">{t("howToRestartServer")}:</p>
                        <div className="bg-background p-2 rounded border font-mono text-xs">
                          {t("runStartWindowsBat")}
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Preview Users Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Preview Users from Device</DialogTitle>
            <DialogDescription>
              Select the users you want to import into the employee list. {selectedUserIds.length} of {fetchedUsers.length} users selected.
            </DialogDescription>
          </DialogHeader>

          {/* Import Progress Bar */}
          {importSelectedUsersMutation.isPending && (
            <div className="space-y-2 px-1" data-testid="import-progress-section">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Importing selected users...</span>
                <span className="font-medium">{selectedUserIds.length} users</span>
              </div>
              <Progress value={importProgress} className="h-2" data-testid="progress-bar-import" />
            </div>
          )}

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by User ID, Name, or Card Number..."
              value={userSearchQuery}
              onChange={(e) => setUserSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-users"
            />
          </div>
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50 sticky top-0 z-10">
                <Checkbox
                  id="select-all"
                  checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Select All ({filteredUsers.length} {filteredUsers.length === fetchedUsers.length ? 'users' : `of ${fetchedUsers.length} users`})
                </Label>
              </div>

              {/* User List */}
              {fetchedUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users fetched from device
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users match your search criteria
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.userId}
                      className={`flex items-center gap-3 p-3 border rounded-lg hover-elevate cursor-pointer ${
                        selectedUserIds.includes(user.userId) ? "bg-primary/5 border-primary" : ""
                      }`}
                      onClick={() => toggleUserSelection(user.userId)}
                      data-testid={`user-row-${user.userId}`}
                    >
                      <Checkbox
                        id={`user-${user.userId}`}
                        checked={selectedUserIds.includes(user.userId)}
                        onCheckedChange={() => toggleUserSelection(user.userId)}
                        data-testid={`checkbox-user-${user.userId}`}
                      />
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">User ID</Label>
                          <p className="font-medium">{user.userId}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Name</Label>
                          <p className="font-medium">{user.name || "N/A"}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Card No</Label>
                          <p className="text-sm">{user.cardno || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleDiscardImport}
              disabled={importSelectedUsersMutation.isPending}
              data-testid="button-discard-import"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Discard
            </Button>
            <div className="flex gap-2">
              <Badge variant="secondary" className="text-sm">
                {selectedUserIds.length} selected
              </Badge>
              <Button
                onClick={handleApproveImport}
                disabled={importSelectedUsersMutation.isPending || selectedUserIds.length === 0}
                data-testid="button-approve-import"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {importSelectedUsersMutation.isPending ? "Importing..." : "Approve & Import"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* D365 Items Review Dialog */}
      <D365ItemsReviewDialog
        open={isItemsReviewOpen}
        onOpenChange={setIsItemsReviewOpen}
        previewItems={previewData?.items || []}
        syncId={previewData?.syncId || ""}
        onImport={async (syncId, selectedItemIds) => {
          await importSelectedItemsMutation.mutateAsync({ syncId, selectedItemIds });
        }}
        isImporting={importSelectedItemsMutation.isPending}
      />

      {/* D365 Equipment Review Dialog */}
      <D365EquipmentReviewDialog
        open={isEquipmentReviewOpen}
        onOpenChange={setIsEquipmentReviewOpen}
        equipment={previewedEquipment}
        categories={equipmentCategories}
        onImport={async (selectedEquipment, defaultCategoryId) => {
          await importEquipmentMutation.mutateAsync({ selectedEquipment, defaultCategoryId });
        }}
        isImporting={importEquipmentMutation.isPending}
      />
    </div>
  );
}
