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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Palette,
  Upload,
  Image,
  Terminal,
  Info,
  Shield,
  Check,
  ChevronsUpDown,
  Calendar,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { EthiopianYearManagement } from "@/components/EthiopianYearManagement";
import { SampleDataManagement } from "@/components/SampleDataManagement";

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

// Helper component for consistent tab layout with max-width container
function AdminTabSection({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      {children}
    </div>
  );
}

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Deployment Tool state
  const [serverHost, setServerHost] = useState("0.0.0.0");
  const [serverPort, setServerPort] = useState(3000);
  const [mellatechUsername, setMellatechUsername] = useState("");
  const [mellatechPassword, setMellatechPassword] = useState("");

  // Dynamics 365 Settings state
  const [d365Form, setD365Form] = useState({
    bcUrl: "",
    bcCompany: "",
    bcUsername: "",
    bcPassword: "",
    bcDomain: "",
    itemPrefix: "",
    equipmentPrefix: "",
    syncIntervalHours: 24,
  });

  // D365 Companies state (populated after fetching companies)
  const [d365Companies, setD365Companies] = useState<any[]>([]);

  // D365 Data Table Modal state (Syncto365 functionality)
  const [isDataTableOpen, setIsDataTableOpen] = useState(false);
  const [fetchedRecords, setFetchedRecords] = useState<any[]>([]);
  const [currentDataType, setCurrentDataType] = useState<'items' | 'FixedAssets' | ''>('');
  const [currentSkip, setCurrentSkip] = useState(0);
  const [selectedRecordNos, setSelectedRecordNos] = useState<string[]>([]);
  const [currentFilterValue, setCurrentFilterValue] = useState('');

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

  const [isItemsReviewOpen, setIsItemsReviewOpen] = useState(false);
  const [isEquipmentReviewOpen, setIsEquipmentReviewOpen] = useState(false);

  // Customizations state
  const [customizationsForm, setCustomizationsForm] = useState({
    appName: "Gelan Terminal Maintenance",
    logoUrl: "",
    primaryColor: "#0ea5e9",
    themeMode: "light",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Fetch deployment settings
  const { data: deploySettings, isLoading: isLoadingDeploy } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // Load deployment settings when available
  useEffect(() => {
    if (deploySettings) {
      setServerHost(deploySettings.serverHost || "0.0.0.0");
      setServerPort(deploySettings.serverPort || 3000);
      // Note: Credentials are NOT sent from backend for security
      // They will only be updated when user saves new values
    }
  }, [deploySettings]);

  // Fetch D365 settings
  const { data: d365Settings, isLoading: isLoadingD365 } = useQuery<any>({
    queryKey: ["/api/dynamics365/settings"],
  });

  // Fetch equipment categories for D365 import
  const { data: equipmentCategories = [] } = useQuery<any[]>({
    queryKey: ["/api/equipment-categories"],
  });

  // Fetch all biometric devices
  const { data: allDevices = [], isLoading: isLoadingDevices } = useQuery<DeviceSettings[]>({
    queryKey: ["/api/biometric-devices"],
  });

  // Fetch active device settings (for backward compatibility)
  const { data: deviceSettings, isLoading: isLoadingDevice } = useQuery<DeviceSettings>({
    queryKey: ["/api/biometric-devices/active"],
  });

  // Fetch import logs
  const { data: importLogs = [], isLoading: isLoadingLogs } = useQuery<ImportLog[]>({
    queryKey: ["/api/biometric-imports/logs"],
  });

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

  // Fetch all devices
  // Fetch active device settings (for backward compatibility)
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

  // Fetch app customizations
  const { data: appCustomizations, isLoading: isLoadingCustomizations } = useQuery<any>({
    queryKey: ["/api/app-customizations"],
  });

  // Fetch employees for User Control tab
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/employees"],
  });

  // State for User Control tab
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");
  const [employeePermissions, setEmployeePermissions] = useState<{[key: string]: boolean}>({});
  const [employeeComboboxOpen, setEmployeeComboboxOpen] = useState(false);

  // Fetch permissions for selected employee
  const { data: permissions = [] } = useQuery<any[]>({
    queryKey: ["/api/employee-page-permissions", selectedEmployeeId],
    enabled: !!selectedEmployeeId,
  });

  // Update local state when permissions are loaded
  useEffect(() => {
    if (permissions && permissions.length > 0) {
      const permMap: {[key: string]: boolean} = {};
      permissions.forEach((perm: any) => {
        permMap[perm.pagePath] = perm.isAllowed;
      });
      setEmployeePermissions(permMap);
    } else if (selectedEmployeeId) {
      // If no permissions exist, default all to true (allowed)
      setEmployeePermissions({});
    }
  }, [permissions, selectedEmployeeId]);

  // Mutation to save permissions
  const savePermissionsMutation = useMutation({
    mutationFn: async () => {
      const permissionsToSave = Object.entries(employeePermissions).map(([pagePath, isAllowed]) => ({
        employeeId: selectedEmployeeId,
        pagePath,
        isAllowed,
      }));

      const res = await apiRequest("POST", "/api/employee-page-permissions/bulk", {
        permissions: permissionsToSave,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Employee page permissions updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/employee-page-permissions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update permissions",
        variant: "destructive",
      });
    },
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
        bcDomain: d365Settings.bcDomain || "",
        itemPrefix: d365Settings.itemPrefix || "",
        equipmentPrefix: d365Settings.equipmentPrefix || "",
        syncIntervalHours: d365Settings.syncIntervalHours || 24,
      });
    }
  }, [d365Settings]);

  // Update customizations form when data is loaded
  useEffect(() => {
    if (appCustomizations) {
      setCustomizationsForm({
        appName: appCustomizations.appName || "Gelan Terminal Maintenance",
        logoUrl: appCustomizations.logoUrl || "",
        primaryColor: appCustomizations.primaryColor || "#0ea5e9",
        themeMode: appCustomizations.themeMode || "light",
      });
    }
  }, [appCustomizations]);

  // Deployment Tool Mutations
  const saveDeploymentMutation = useMutation({
    mutationFn: async (data: { 
      serverHost: string; 
      serverPort: number;
      mellatechUsername?: string;
      mellatechPassword?: string;
    }) => {
      const response = await apiRequest("PATCH", "/api/system-settings", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t("success"),
        description: t("settingsSavedSuccessfully"),
      });
      queryClient.invalidateQueries({ queryKey: ["/api/system-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mellatech/status"] });
    },
    onError: (error) => {
      toast({
        title: t("error"),
        description: error.message || t("failedToSaveSettings"),
        variant: "destructive",
      });
    },
  });

  // Customizations Mutations
  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const response = await fetch("/api/app-customizations/upload-logo", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: formData,
      });
      if (!response.ok) throw new Error("Failed to upload logo");
      return response.json();
    },
    onSuccess: (data) => {
      setCustomizationsForm({ ...customizationsForm, logoUrl: data.logoUrl });
      toast({
        title: "Logo Uploaded",
        description: "Logo has been uploaded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    },
  });

  const saveCustomizationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", "/api/app-customizations", customizationsForm);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Customization settings have been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/app-customizations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save customizations",
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

  // NTLM Direct Connection Mutations
  const testNTLMConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/test-connection-ntlm");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Success" : "Failed",
        description: data.message || data.error || "Connection test completed",
        variant: data.success ? "default" : "destructive",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/settings"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to test connection",
        variant: "destructive",
      });
    },
  });

  const fetchCustomersNTLMMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/dynamics365/customers-ntlm?limit=10");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Customers Fetched",
          description: `Retrieved ${data.count} customers from D365`,
        });
        console.log("D365 Customers:", data.data);
      } else {
        toast({
          title: "Failed",
          description: data.error || "Could not fetch customers",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch customers",
        variant: "destructive",
      });
    },
  });

  const fetchItemsNTLMMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/dynamics365/items-ntlm?limit=100");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Items Fetched",
          description: `Retrieved ${data.count} items from D365${data.prefix ? ` (prefix: ${data.prefix})` : ''}`,
        });
        console.log("D365 Items:", data.data);
      } else {
        toast({
          title: "Failed",
          description: data.error || "Could not fetch items",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch items",
        variant: "destructive",
      });
    },
  });

  const fetchEquipmentNTLMMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/dynamics365/equipment-ntlm?limit=100");
      return response.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Equipment Fetched",
          description: `Retrieved ${data.count} fixed assets from D365${data.prefix ? ` (prefix: ${data.prefix})` : ''}`,
        });
        console.log("D365 Equipment:", data.data);
      } else {
        toast({
          title: "Failed",
          description: data.error || "Could not fetch equipment",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch equipment",
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

  // PowerShell-based D365 sync mutations
  const testPowerShellConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/dynamics365/ps-test-connection", {
        baseUrl: d365Form.bcUrl,
        username: d365Form.bcUsername,
        password: d365Form.bcPassword,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      if (data.status === 'ok') {
        toast({
          title: "PowerShell Connection Successful",
          description: data.message || "Successfully connected to D365 using PowerShell",
        });
      } else {
        toast({
          title: "PowerShell Connection Failed",
          description: data.message || "Could not connect to D365",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "PowerShell Test Error",
        description: error.message || "PowerShell sync is only available on Windows",
        variant: "destructive",
      });
    },
  });

  const fetchPowerShellDataMutation = useMutation({
    mutationFn: async (params: { type: string; filterValue?: string; skip?: number; top?: number }) => {
      console.log('[D365 FETCH] Starting PowerShell fetch with params:', {
        type: params.type,
        filterValue: params.filterValue,
        skip: params.skip || 0,
        top: params.top || 20,
        company: d365Form.bcCompany,
        timestamp: new Date().toISOString()
      });
      
      const response = await apiRequest("POST", "/api/dynamics365/ps-fetch-data", {
        baseUrl: d365Form.bcUrl,
        username: d365Form.bcUsername,
        password: d365Form.bcPassword,
        companyName: params.type === 'companies' ? undefined : d365Form.bcCompany,
        type: params.type,
        filterValue: params.filterValue,
        skip: params.skip || 0,
        top: params.top || 20,
      });
      return response.json();
    },
    onSuccess: (data: any, variables) => {
      console.log('[D365 FETCH] Success response:', {
        status: data.status,
        mode: data.mode,
        type: data.type,
        recordCount: data.records?.length || 0,
        totalCount: data.count,
        timestamp: new Date().toISOString()
      });
      
      if (data.status === 'ok') {
        // Handle companies data specifically
        if (data.mode === 'companies' && data.companies) {
          setD365Companies(data.companies);
          console.log('[D365 COMPANIES] Loaded companies:', data.companies.length);
          toast({
            title: "Companies Loaded",
            description: `Retrieved ${data.companies.length} companies from D365`,
          });
          console.log('D365 Companies:', data.companies);
        } else if (data.mode === 'data' && data.records) {
          const recordCount = data.count || 0;
          console.log('[D365 MODAL] Opening data table modal with:', {
            dataType: variables.type,
            recordsReceived: data.records.length,
            skip: variables.skip || 0,
            filterValue: variables.filterValue || '',
            firstRecordNo: data.records[0]?.No,
            timestamp: new Date().toISOString()
          });
          
          // Store records and open modal (Syncto365 functionality)
          setFetchedRecords(data.records);
          setCurrentDataType(variables.type as 'items' | 'FixedAssets');
          setCurrentSkip(variables.skip || 0);
          setCurrentFilterValue(variables.filterValue || '');
          setSelectedRecordNos([]);
          setIsDataTableOpen(true);
          
          console.log('[D365 MODAL] Modal state updated, should be opening now');
          
          toast({
            title: "Data Fetched Successfully",
            description: `Retrieved ${recordCount} ${variables.type} records from D365`,
          });
          console.log(`PowerShell D365 ${variables.type}:`, data.records);
        } else {
          console.log('[D365 FETCH] Unexpected response format:', data);
          toast({
            title: "Data Fetched",
            description: data.message || "Data retrieved successfully",
          });
        }
      } else {
        console.error('[D365 FETCH] Fetch failed:', data);
        toast({
          title: "Fetch Failed",
          description: data.message || "Could not fetch data",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('[D365 FETCH] Error:', error);
      toast({
        title: "PowerShell Fetch Error",
        description: error.message || "Failed to fetch data using PowerShell",
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
      queryClient.invalidateQueries({ queryKey: ["/api/parts"] });
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

  // Import selected D365 items to spare parts
  const importItemsToSparePartsMutation = useMutation({
    mutationFn: async (selectedItems: any[]) => {
      const response = await apiRequest("POST", "/api/dynamics365/import-items-to-spare-parts", {
        selectedItems,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log('[D365 IMPORT] Import complete:', {
        imported: data.imported,
        failed: data.failed,
        timestamp: new Date().toISOString()
      });
      
      if (data.status === 'ok') {
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} items to Spare Parts. ${data.failed > 0 ? `${data.failed} items failed.` : ''}`,
        });
        
        // Clear selection (keep dialog open for next page)
        setSelectedRecordNos([]);
        
        // Invalidate spare parts cache
        queryClient.invalidateQueries({ queryKey: ["/api/spare-parts"] });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import items",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('[D365 IMPORT] Error:', error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to import items to spare parts",
        variant: "destructive",
      });
    },
  });

  // Import selected D365 Fixed Assets to equipment
  const importEquipmentFromD365Mutation = useMutation({
    mutationFn: async (selectedEquipment: any[]) => {
      const response = await apiRequest("POST", "/api/dynamics365/import-equipment", {
        equipment: selectedEquipment,
        defaultCategoryId: null,
        prefix: d365Form.equipmentPrefix,
      });
      return response.json();
    },
    onSuccess: (data: any) => {
      console.log('[D365 EQUIPMENT IMPORT] Import complete:', {
        savedCount: data.savedCount,
        updatedCount: data.updatedCount,
        timestamp: new Date().toISOString()
      });
      
      if (data.success) {
        const categoryMsg = data.categoriesCreated > 0 ? `, created ${data.categoriesCreated} categories` : '';
        toast({
          title: "Import Successful",
          description: `Imported ${data.savedCount} new equipment, updated ${data.updatedCount} equipment${categoryMsg}`,
        });
        
        // Clear selection (keep dialog open for next page)
        setSelectedRecordNos([]);
        
        // Invalidate equipment and categories cache
        queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
        queryClient.invalidateQueries({ queryKey: ["/api/equipment-categories"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dynamics365/sync-logs"] });
      } else {
        toast({
          title: "Import Failed",
          description: data.message || "Failed to import equipment",
          variant: "destructive",
        });
      }
    },
    onError: (error: any) => {
      console.error('[D365 EQUIPMENT IMPORT] Error:', error);
      toast({
        title: "Import Error",
        description: error.message || "Failed to import equipment",
        variant: "destructive",
      });
    },
  });

  const handleInsertSelected = () => {
    console.log('[D365 IMPORT] Starting import:', {
      selectedCount: selectedRecordNos.length,
      dataType: currentDataType,
      timestamp: new Date().toISOString()
    });
    
    // Filter selected records from fetched records
    const selectedRecords = fetchedRecords.filter((r) => selectedRecordNos.includes(r.No));
    
    if (selectedRecords.length === 0) {
      toast({
        title: "No Records Selected",
        description: "Please select at least one record to import",
        variant: "destructive",
      });
      return;
    }
    
    // Handle different data types
    if (currentDataType === 'items') {
      // Import items to spare parts catalog
      importItemsToSparePartsMutation.mutate(selectedRecords);
    } else if (currentDataType === 'FixedAssets') {
      // Import fixed assets to equipment inventory
      importEquipmentFromD365Mutation.mutate(selectedRecords);
    } else {
      toast({
        title: "Invalid Data Type",
        description: "Cannot determine import destination",
        variant: "destructive",
      });
    }
  };

  // D365 Data Table Handlers (from Syncto365)
  const handleNextPage = () => {
    if (!currentDataType) return;
    console.log('[D365 PAGINATION] Next page clicked:', {
      currentType: currentDataType,
      currentSkip: currentSkip,
      newSkip: currentSkip + 50,
      filterValue: currentFilterValue,
      timestamp: new Date().toISOString()
    });
    
    fetchPowerShellDataMutation.mutate({
      type: currentDataType,
      filterValue: currentFilterValue,
      skip: currentSkip + 50,
      top: 50,
    });
  };

  const handlePreviousPage = () => {
    if (!currentDataType || currentSkip < 50) return;
    console.log('[D365 PAGINATION] Previous page clicked:', {
      currentType: currentDataType,
      currentSkip: currentSkip,
      newSkip: currentSkip - 50,
      filterValue: currentFilterValue,
      timestamp: new Date().toISOString()
    });
    
    fetchPowerShellDataMutation.mutate({
      type: currentDataType,
      filterValue: currentFilterValue,
      skip: currentSkip - 50,
      top: 50,
    });
  };

  const handleSelectAllRecords = (checked: boolean) => {
    console.log('[D365 SELECTION] Select all toggled:', {
      checked,
      recordCount: fetchedRecords.length,
      recordNos: fetchedRecords.map((r) => r.No),
      timestamp: new Date().toISOString()
    });
    
    if (checked) {
      setSelectedRecordNos(fetchedRecords.map((r) => r.No));
    } else {
      setSelectedRecordNos([]);
    }
  };

  const handleSelectOneRecord = (recordNo: string) => {
    const isCurrentlySelected = selectedRecordNos.includes(recordNo);
    console.log('[D365 SELECTION] Individual record toggled:', {
      recordNo,
      action: isCurrentlySelected ? 'deselect' : 'select',
      currentSelectionCount: selectedRecordNos.length,
      timestamp: new Date().toISOString()
    });
    
    if (isCurrentlySelected) {
      setSelectedRecordNos(selectedRecordNos.filter((n) => n !== recordNo));
    } else {
      setSelectedRecordNos([...selectedRecordNos, recordNo]);
    }
  };

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
    mutationFn: async (deviceData: any) => {
      const res = await apiRequest("POST", "/api/biometric-devices", deviceData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-devices"] });
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
        description: "Biometric device has been added successfully",
      });
    },
  });

  const setActiveDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await apiRequest("POST", `/api/biometric-devices/${deviceId}/set-active`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-devices"] });
      toast({
        title: "Active Device Set",
        description: "Device has been set as active",
      });
    },
  });

  const deleteDeviceMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      const res = await apiRequest("DELETE", `/api/biometric-devices/${deviceId}`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-devices"] });
      toast({
        title: "Device Deleted",
        description: "Device has been removed",
      });
    },
  });

  const importUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/biometric-imports/import-all", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-imports/logs"] });
      toast({
        title: "Import Complete",
        description: `Imported ${data.imported} users, updated ${data.updated} users`,
      });
    },
  });

  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/biometric-imports/sync", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-devices"] });
      toast({
        title: "Sync Complete",
        description: data.message || "User sync completed successfully",
      });
    },
  });

  const fetchUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/biometric-imports/fetch-users", {});
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success && data.users) {
        setFetchedUsers(data.users);
        setSelectedUserIds(data.users.map((u: any) => u.userId));
        setIsPreviewDialogOpen(true);
        toast({
          title: "Users Fetched",
          description: `Found ${data.users.length} users from device`,
        });
      } else {
        toast({
          title: "Fetch Failed",
          description: data.message || "Could not fetch users from device",
          variant: "destructive",
        });
      }
    },
  });

  const importSelectedUsersMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      const res = await apiRequest("POST", "/api/biometric-imports/import-selected", {
        userIds,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      queryClient.invalidateQueries({ queryKey: ["/api/biometric-imports/logs"] });
      setImportProgress(100);
      setTimeout(() => {
        setIsPreviewDialogOpen(false);
        setFetchedUsers([]);
        setSelectedUserIds([]);
        toast({
          title: "Import Successful",
          description: `Imported ${data.imported} users, updated ${data.updated} users, skipped ${data.skipped} users`,
        });
      }, 500);
    },
  });

  // MellaTech Fleet Tracking Mutations
  const testMellaTechConnectionMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/api/mellatech/test");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Connection Successful",
          description: data.message || "Successfully connected to MellaTech platform",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: data.message || "Could not connect to MellaTech",
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

  const syncMellaTechDataMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/mellatech/sync", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/mellatech/vehicles"] });
      toast({
        title: "Sync Complete",
        description: data.message || `Synced ${data.count || 0} vehicles successfully`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Sync Failed",
        description: error.message || "Failed to sync fleet data",
        variant: "destructive",
      });
    },
  });

  // Check if MellaTech credentials are configured
  const { data: mellaTechStatus } = useQuery<{ configured: boolean }>({
    queryKey: ["/api/mellatech/status"],
  });
  const isMellaTechConfigured = mellaTechStatus?.configured || false;

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
      user.name?.toLowerCase().includes(query)
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
              <TabsTrigger value="customisations" className="gap-2" data-testid="tab-customisations">
                <Palette className="h-4 w-4" />
                Customisations
              </TabsTrigger>
              <TabsTrigger value="userControl" className="gap-2" data-testid="tab-user-control">
                <Shield className="h-4 w-4" />
                User Control
              </TabsTrigger>
              <TabsTrigger value="ethiopianYear" className="gap-2" data-testid="tab-ethiopian-year">
                <Calendar className="h-4 w-4" />
                Ethiopian Year
              </TabsTrigger>
              <TabsTrigger value="sampleData" className="gap-2" data-testid="tab-sample-data">
                <Sparkles className="h-4 w-4" />
                Sample Data
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Sample Data Tab */}
          <TabsContent value="sampleData" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <SampleDataManagement />
            </AdminTabSection>
          </TabsContent>

          {/* Ethiopian Year Management Tab */}
          <TabsContent value="ethiopianYear" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <EthiopianYearManagement />
            </AdminTabSection>
          </TabsContent>

          {/* Biometric Device Tab */}
          <TabsContent value="biometric" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
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
                            onClick={() => createDeviceMutation.mutate({
                              ...newDeviceForm,
                              port: parseInt(newDeviceForm.port),
                              timeout: parseInt(newDeviceForm.timeout),
                            })}
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
            </AdminTabSection>
          </TabsContent>

          {/* Dynamics 365 Tab */}
          <TabsContent value="dynamics" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <Card>
                <CardHeader>
                  <CardTitle className="text-center text-2xl">
                    Business Central Data Fetcher
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Base URL, Username, Password row */}
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="bcUrl">Base URL</Label>
                      <Input
                        id="bcUrl"
                        value={d365Form.bcUrl}
                        onChange={(e) => setD365Form({ ...d365Form, bcUrl: e.target.value })}
                        placeholder="http://192.168.0.16:7048/SUNCONBC1"
                        data-testid="input-d365-url"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bcUsername">Username</Label>
                      <Input
                        id="bcUsername"
                        value={d365Form.bcUsername}
                        onChange={(e) => setD365Form({ ...d365Form, bcUsername: e.target.value })}
                        placeholder="Solomon.Sintayehu@Sunshineinv.local"
                        data-testid="input-d365-username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bcPassword">Password</Label>
                      <Input
                        id="bcPassword"
                        type="password"
                        value={d365Form.bcPassword}
                        onChange={(e) => setD365Form({ ...d365Form, bcPassword: e.target.value })}
                        placeholder="••••••••"
                        data-testid="input-d365-password"
                      />
                    </div>
                  </div>

                  {/* Action buttons row 1 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => testPowerShellConnectionMutation.mutate()}
                      disabled={testPowerShellConnectionMutation.isPending || !d365Form.bcUrl || !d365Form.bcUsername || !d365Form.bcPassword}
                      variant="secondary"
                      data-testid="button-test-connection"
                    >
                      {testPowerShellConnectionMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </Button>

                    <Button
                      onClick={() => fetchPowerShellDataMutation.mutate({ 
                        type: 'companies',
                        top: 100
                      })}
                      disabled={fetchPowerShellDataMutation.isPending || !d365Form.bcUrl || !d365Form.bcUsername || !d365Form.bcPassword}
                      className="bg-cyan-500 hover:bg-cyan-600"
                      data-testid="button-fetch-companies"
                    >
                      {fetchPowerShellDataMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        'Fetch Companies'
                      )}
                    </Button>

                    <Button
                      onClick={() => saveD365SettingsMutation.mutate()}
                      disabled={saveD365SettingsMutation.isPending || !d365Form.bcUrl || !d365Form.bcUsername}
                      data-testid="button-save-settings"
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
                  </div>

                  {/* Company dropdown and filter row */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="companySelect">Select Company</Label>
                      <Select
                        value={d365Form.bcCompany}
                        onValueChange={(value) => setD365Form({ ...d365Form, bcCompany: value })}
                        disabled={!d365Companies || d365Companies.length === 0}
                      >
                        <SelectTrigger id="companySelect" data-testid="select-company">
                          <SelectValue placeholder="-- Select a Company --" />
                        </SelectTrigger>
                        <SelectContent>
                          {d365Companies && d365Companies.map((company: any, idx: number) => (
                            <SelectItem key={idx} value={company.Name}>
                              {company.Name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="filterValue">Start With (Filter)</Label>
                      <Input
                        id="filterValue"
                        value={d365Form.itemPrefix || ''}
                        onChange={(e) => setD365Form({ ...d365Form, itemPrefix: e.target.value })}
                        placeholder="SP-"
                        data-testid="input-filter-value"
                      />
                    </div>
                  </div>

                  {/* Action buttons row 2 */}
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => fetchPowerShellDataMutation.mutate({ 
                        type: 'items',
                        filterValue: d365Form.itemPrefix,
                        top: 50
                      })}
                      disabled={fetchPowerShellDataMutation.isPending || !d365Form.bcCompany}
                      data-testid="button-fetch-items"
                    >
                      {fetchPowerShellDataMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        'Fetch Items'
                      )}
                    </Button>

                    <Button
                      onClick={() => fetchPowerShellDataMutation.mutate({ 
                        type: 'FixedAssets',
                        filterValue: d365Form.itemPrefix,
                        top: 50
                      })}
                      disabled={fetchPowerShellDataMutation.isPending || !d365Form.bcCompany}
                      className="bg-green-600 hover:bg-green-700"
                      data-testid="button-fetch-fixed-assets"
                    >
                      {fetchPowerShellDataMutation.isPending ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Fetching...
                        </>
                      ) : (
                        'Fetch Fixed Assets'
                      )}
                    </Button>
                  </div>
                </CardContent>

              </Card>
            </AdminTabSection>
          </TabsContent>

          {/* Fleet Management Tab */}
          <TabsContent value="fleet" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    MellaTech Fleet Tracking Integration
                  </CardTitle>
                  <CardDescription>Monitor GPS vehicle tracking and fleet data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">How Fleet Integration Works:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          <li>MellaTech credentials are securely encrypted and stored in the database</li>
                          <li>When equipment arrives at Equipment Reception, plate numbers are matched with fleet data</li>
                          <li>If a match is found, kilometer reading is automatically populated from GPS tracking data</li>
                          <li>Sync fleet data regularly to keep vehicle information up to date</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div className="space-y-4">
                      <h4 className="font-medium">Credentials Configuration</h4>
                      
                      <div className="space-y-2">
                        <Label htmlFor="mellatechUsername">Username</Label>
                        <Input
                          id="mellatechUsername"
                          type="text"
                          value={mellatechUsername}
                          onChange={(e) => setMellatechUsername(e.target.value)}
                          placeholder="Enter MellaTech username"
                          data-testid="input-mellatech-username"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mellatechPassword">Password</Label>
                        <Input
                          id="mellatechPassword"
                          type="password"
                          value={mellatechPassword}
                          onChange={(e) => setMellatechPassword(e.target.value)}
                          placeholder="Enter MellaTech password"
                          data-testid="input-mellatech-password"
                        />
                      </div>

                      <Button
                        onClick={() => saveDeploymentMutation.mutate({
                          serverHost,
                          serverPort,
                          mellatechUsername,
                          mellatechPassword
                        })}
                        disabled={saveDeploymentMutation.isPending}
                        className="w-full"
                        data-testid="button-save-mellatech"
                      >
                        {saveDeploymentMutation.isPending ? "Saving..." : "Save Settings"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-md">
                      <div className="flex items-center gap-3">
                        <div className={`h-2 w-2 rounded-full ${isMellaTechConfigured ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <p className="font-medium">Connection Status</p>
                          <p className="text-sm text-muted-foreground">
                            {isMellaTechConfigured ? 'MellaTech credentials are configured' : 'MellaTech credentials not configured'}
                          </p>
                        </div>
                      </div>
                      <Button
                        onClick={() => testMellaTechConnectionMutation.mutate()}
                        disabled={testMellaTechConnectionMutation.isPending}
                        data-testid="button-test-mellatech"
                      >
                        {testMellaTechConnectionMutation.isPending ? (
                          <>Testing...</>
                        ) : (
                          <>Test Connection</>
                        )}
                      </Button>
                    </div>

                    {isMellaTechConfigured && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">Vehicle Data Synchronization</h4>
                            <p className="text-sm text-muted-foreground">
                              Sync latest vehicle tracking data from MellaTech platform
                            </p>
                          </div>
                          <Button
                            onClick={() => syncMellaTechDataMutation.mutate()}
                            disabled={syncMellaTechDataMutation.isPending}
                            data-testid="button-sync-mellatech"
                          >
                            {syncMellaTechDataMutation.isPending ? (
                              <>Syncing...</>
                            ) : (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2" />
                                Sync Now
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AdminTabSection>
          </TabsContent>

          {/* Deployment Tool Tab */}
          <TabsContent value="deployment" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
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
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">How Server Settings Work:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          <li><strong>On Replit:</strong> Keep 0.0.0.0:5000 (required for webview)</li>
                          <li><strong>On Local PC:</strong> Use your computer's IP (e.g., 192.168.0.3:3000)</li>
                          <li>Settings are saved to database - export and import on local PC</li>
                          <li>You must restart the server after changing settings</li>
                          <li>Find your local IP: Open Command Prompt and type "ipconfig"</li>
                        </ul>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="serverHost">{t("serverHost")}</Label>
                    <Input
                      id="serverHost"
                      value={serverHost}
                      onChange={(e) => setServerHost(e.target.value)}
                      placeholder="192.168.0.3 (for local) or 0.0.0.0 (for Replit)"
                      data-testid="input-server-host"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your local network IP (e.g., 192.168.0.3) or 0.0.0.0 for all interfaces
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
                      Recommended: 3000 for local deployment, 5000 for Replit
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

                  <div className="pt-4 flex justify-between items-center">
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          // Download database schema with authentication
                          const token = localStorage.getItem("auth_token");
                          const response = await fetch("/api/system-settings/export-schema", {
                            method: "GET",
                            headers: {
                              Authorization: `Bearer ${token}`,
                            },
                          });

                          if (!response.ok) {
                            throw new Error("Failed to download schema");
                          }

                          // Create blob and trigger download
                          const blob = await response.blob();
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          
                          // Extract filename from Content-Disposition header
                          const contentDisposition = response.headers.get("Content-Disposition");
                          const filename = contentDisposition
                            ? contentDisposition.split("filename=")[1]?.replace(/"/g, "")
                            : `database_schema_${new Date().toISOString().split('T')[0]}.sql`;
                          
                          a.download = filename;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          window.URL.revokeObjectURL(url);

                          toast({
                            title: t("success"),
                            description: "Database schema downloaded successfully",
                          });
                        } catch (error) {
                          console.error("Error downloading schema:", error);
                          toast({
                            title: t("error"),
                            description: "Failed to download database schema",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid="button-download-schema"
                    >
                      <Database className="h-4 w-4 mr-2" />
                      Download Database Schema
                    </Button>
                    
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
                    <Terminal className="h-4 w-4" />
                    <AlertDescription>
                      <div className="space-y-2">
                        <p className="font-medium">To Apply Settings - Restart the Server:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside">
                          <li><strong>On Replit:</strong> Stop and restart the "Start application" workflow</li>
                          <li><strong>On Windows:</strong> Run <code className="bg-background px-1 rounded">start-windows.bat</code></li>
                          <li><strong>On Linux/Mac:</strong> Restart your Node.js process</li>
                        </ul>
                        <p className="text-xs text-muted-foreground mt-2">
                          The server will automatically load the saved settings from the database on startup.
                        </p>
                      </div>
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </AdminTabSection>
          </TabsContent>

          {/* Customisations Tab */}
          <TabsContent value="customisations" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    <CardTitle>App Customisations</CardTitle>
                  </div>
                  <CardDescription>
                    Customize the application name, logo, colors, and theme
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* App Name */}
                  <div className="space-y-2">
                    <Label htmlFor="appName">Application Name</Label>
                    <Input
                      id="appName"
                      value={customizationsForm.appName}
                      onChange={(e) => setCustomizationsForm({ ...customizationsForm, appName: e.target.value })}
                      placeholder="Gelan Terminal Maintenance"
                      data-testid="input-app-name"
                    />
                    <p className="text-xs text-muted-foreground">
                      This name will appear on the login page and throughout the application
                    </p>
                  </div>

                  {/* Logo Upload */}
                  <div className="space-y-2">
                    <Label htmlFor="logo">Application Logo</Label>
                    <div className="flex items-center gap-4">
                      {customizationsForm.logoUrl && (
                        <div className="w-24 h-24 border rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                          <img 
                            src={customizationsForm.logoUrl} 
                            alt="App Logo" 
                            className="max-w-full max-h-full object-contain"
                          />
                        </div>
                      )}
                      <div className="flex-1 space-y-2">
                        <Input
                          id="logo"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setLogoFile(file);
                              uploadLogoMutation.mutate(file);
                            }
                          }}
                          data-testid="input-logo"
                        />
                        <p className="text-xs text-muted-foreground">
                          Upload a logo image (PNG, JPG, SVG recommended)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Primary Color */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex items-center gap-4">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={customizationsForm.primaryColor}
                        onChange={(e) => setCustomizationsForm({ ...customizationsForm, primaryColor: e.target.value })}
                        className="w-24 h-10"
                        data-testid="input-primary-color"
                      />
                      <Input
                        type="text"
                        value={customizationsForm.primaryColor}
                        onChange={(e) => setCustomizationsForm({ ...customizationsForm, primaryColor: e.target.value })}
                        placeholder="#0ea5e9"
                        className="flex-1"
                        data-testid="input-primary-color-hex"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Choose the primary theme color for the application
                    </p>
                  </div>

                  {/* Theme Mode */}
                  <div className="space-y-2">
                    <Label>Theme Mode</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={customizationsForm.themeMode === "light" ? "default" : "outline"}
                        onClick={() => setCustomizationsForm({ ...customizationsForm, themeMode: "light" })}
                        className="justify-start"
                        data-testid="button-theme-light"
                      >
                        <span className="mr-2">☀️</span> Light Mode
                      </Button>
                      <Button
                        type="button"
                        variant={customizationsForm.themeMode === "dark" ? "default" : "outline"}
                        onClick={() => setCustomizationsForm({ ...customizationsForm, themeMode: "dark" })}
                        className="justify-start"
                        data-testid="button-theme-dark"
                      >
                        <span className="mr-2">🌙</span> Dark Mode
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Set the default theme mode for the application
                    </p>
                  </div>

                  {/* Current Settings Preview */}
                  {appCustomizations && (
                    <div className="pt-4 border-t">
                      <p className="text-sm font-medium mb-2">Current Settings:</p>
                      <div className="bg-muted p-3 rounded-md text-sm space-y-1">
                        <div><span className="font-medium">App Name:</span> {appCustomizations.appName}</div>
                        <div><span className="font-medium">Logo:</span> {appCustomizations.logoUrl ? "Uploaded" : "Not set"}</div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Primary Color:</span>
                          <div 
                            className="w-4 h-4 rounded border" 
                            style={{ backgroundColor: appCustomizations.primaryColor }}
                          />
                          <span>{appCustomizations.primaryColor}</span>
                        </div>
                        <div><span className="font-medium">Theme:</span> {appCustomizations.themeMode}</div>
                        {appCustomizations.updatedAt && (
                          <div className="text-xs text-muted-foreground mt-2">
                            Last Updated: {new Date(appCustomizations.updatedAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Save Button */}
                  <div className="pt-4 flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (appCustomizations) {
                          setCustomizationsForm({
                            appName: appCustomizations.appName || "Gelan Terminal Maintenance",
                            logoUrl: appCustomizations.logoUrl || "",
                            primaryColor: appCustomizations.primaryColor || "#0ea5e9",
                            themeMode: appCustomizations.themeMode || "light",
                          });
                        }
                      }}
                      data-testid="button-reset-customizations"
                    >
                      Reset
                    </Button>
                    <Button
                      onClick={() => saveCustomizationsMutation.mutate()}
                      disabled={saveCustomizationsMutation.isPending || isLoadingCustomizations}
                      data-testid="button-save-customizations"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveCustomizationsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Changes will take effect after refreshing the page. The app name will appear on the login page and throughout the application.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </AdminTabSection>
          </TabsContent>

          {/* User Control Tab */}
          <TabsContent value="userControl" className="flex-1 overflow-auto p-6 m-0">
            <AdminTabSection>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Employee Page Access Control
                  </CardTitle>
                  <CardDescription>
                    Manage which pages each employee can access. Denied pages will not appear in their navigation.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Select an employee and toggle page access. CEO and Admin users always have access to all pages.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label>Select Employee</Label>
                      <Popover open={employeeComboboxOpen} onOpenChange={setEmployeeComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={employeeComboboxOpen}
                            className="w-full justify-between"
                            data-testid="select-employee"
                          >
                            {selectedEmployeeId
                              ? employees.find((emp: any) => emp.id === selectedEmployeeId)?.fullName + 
                                " - " + 
                                employees.find((emp: any) => emp.id === selectedEmployeeId)?.role
                              : "Search and select employee..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search employee by name or role..." />
                            <CommandList>
                              <CommandEmpty>No employee found.</CommandEmpty>
                              <CommandGroup>
                                {employees?.map((emp: any) => (
                                  <CommandItem
                                    key={emp.id}
                                    value={`${emp.fullName} ${emp.role}`}
                                    onSelect={() => {
                                      setSelectedEmployeeId(emp.id);
                                      setEmployeePermissions({});
                                      setEmployeeComboboxOpen(false);
                                    }}
                                    data-testid={`employee-option-${emp.id}`}
                                  >
                                    <Check
                                      className={`mr-2 h-4 w-4 ${
                                        selectedEmployeeId === emp.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                    {emp.fullName} - {emp.role}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    {selectedEmployeeId && (
                      <>
                        <div className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-3">Available Pages</h3>
                          <div className="grid grid-cols-2 gap-3">
                            {[
                              { path: "/", name: "Dashboard" },
                              { path: "/my-work", name: "My Work" },
                              { path: "/equipment", name: "Equipment" },
                              { path: "/parts", name: "Spare Parts" },
                              { path: "/maintenance", name: "Maintenance History" },
                              { path: "/models", name: "3D Models" },
                              { path: "/upload", name: "Upload Model" },
                              { path: "/items", name: "Items" },
                              { path: "/garages", name: "Garages" },
                              { path: "/equipment-reception", name: "Equipment Reception" },
                              { path: "/equipment-maintenances", name: "Equipment Maintenances" },
                              { path: "/inspection", name: "Inspection" },
                              { path: "/employees", name: "Employees" },
                              { path: "/approvals", name: "Approvals" },
                              { path: "/work-orders", name: "Work Orders" },
                              { path: "/parts-locations", name: "Parts Locations" },
                              { path: "/store-manager", name: "Store Manager" },
                              { path: "/foreman", name: "Foreman Dashboard" },
                              { path: "/verifier", name: "Verifier Dashboard" },
                              { path: "/team-performance", name: "Team Performance" },
                              { path: "/admin-settings", name: "Admin Settings" },
                            ].map((page) => (
                              <div key={page.path} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={page.path} 
                                  checked={employeePermissions[page.path] !== false}
                                  onCheckedChange={(checked) => {
                                    setEmployeePermissions(prev => ({
                                      ...prev,
                                      [page.path]: checked === true,
                                    }));
                                  }}
                                  data-testid={`checkbox-${page.path}`} 
                                />
                                <Label htmlFor={page.path} className="cursor-pointer">
                                  {page.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={() => savePermissionsMutation.mutate()}
                          disabled={savePermissionsMutation.isPending}
                          data-testid="button-save-permissions"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {savePermissionsMutation.isPending ? "Saving..." : "Save Permissions"}
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </AdminTabSection>
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
              placeholder="Search by User ID or Name..."
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
                      <div className="flex-1 grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-xs text-muted-foreground">User ID</Label>
                          <p className="font-medium">{user.userId}</p>
                        </div>
                        <div>
                          <Label className="text-xs text-muted-foreground">Full Name</Label>
                          <p className="font-medium">{user.name || "N/A"}</p>
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

      {/* D365 Data Table Dialog (Syncto365 functionality) */}
      <Dialog 
        open={isDataTableOpen} 
        onOpenChange={(open) => {
          console.log('[D365 MODAL] Dialog state changing:', {
            previousState: isDataTableOpen,
            newState: open,
            currentRecordCount: fetchedRecords.length,
            selectedCount: selectedRecordNos.length,
            timestamp: new Date().toISOString()
          });
          setIsDataTableOpen(open);
        }}
      >
        <DialogContent className="max-w-6xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {currentDataType === 'items' ? 'Items' : 'Fixed Assets'} (Page {Math.floor(currentSkip / 50) + 1})
            </DialogTitle>
            <DialogDescription>
              Review and select records to import from Dynamics 365 Business Central
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedRecordNos.length === fetchedRecords.length && fetchedRecords.length > 0}
                      onCheckedChange={handleSelectAllRecords}
                      data-testid="checkbox-select-all"
                    />
                  </TableHead>
                  {currentDataType === 'items' ? (
                    <>
                      <TableHead>No</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Inventory</TableHead>
                      <TableHead>Unit of Measure</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Last Modified</TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>No</TableHead>
                      <TableHead>Description</TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {fetchedRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={currentDataType === 'items' ? 7 : 3} className="text-center py-8 text-muted-foreground">
                      No records found
                    </TableCell>
                  </TableRow>
                ) : (
                  fetchedRecords.map((record, idx) => (
                    <TableRow key={idx} data-testid={`row-record-${record.No}`}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecordNos.includes(record.No)}
                          onCheckedChange={() => handleSelectOneRecord(record.No)}
                          data-testid={`checkbox-record-${record.No}`}
                        />
                      </TableCell>
                      {currentDataType === 'items' ? (
                        <>
                          <TableCell className="font-medium">{record.No}</TableCell>
                          <TableCell>{record.Description}</TableCell>
                          <TableCell>{record.InventoryField || 'N/A'}</TableCell>
                          <TableCell>{record.Purch_Unit_of_Measure || 'N/A'}</TableCell>
                          <TableCell>{record.Unit_Cost || 'N/A'}</TableCell>
                          <TableCell>{record.Last_Date_Modified || 'N/A'}</TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="font-medium">{record.No}</TableCell>
                          <TableCell>{record.Description}</TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex justify-between items-center gap-2 pt-4 border-t">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePreviousPage}
                disabled={currentSkip === 0 || fetchPowerShellDataMutation.isPending}
                data-testid="button-previous-page"
              >
                Previous
              </Button>
              <Button
                onClick={handleNextPage}
                disabled={fetchPowerShellDataMutation.isPending}
                data-testid="button-next-page"
              >
                Next
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="text-sm">
                {selectedRecordNos.length} selected
              </Badge>
              <Button
                className="bg-amber-500 hover:bg-amber-600"
                disabled={selectedRecordNos.length === 0 || importItemsToSparePartsMutation.isPending || importEquipmentFromD365Mutation.isPending}
                onClick={handleInsertSelected}
                data-testid="button-insert-selected"
                title={currentDataType === 'items' ? 'Import to Spare Parts Catalog' : currentDataType === 'FixedAssets' ? 'Import to Equipment Inventory' : ''}
              >
                {importItemsToSparePartsMutation.isPending || importEquipmentFromD365Mutation.isPending ? "Importing..." : "Insert Selected"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
