import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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

  // Fetch deployment settings
  const { data: deploySettings, isLoading: isLoadingDeploy } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // Fetch device settings
  const { data: deviceSettings, isLoading: isLoadingDevice } = useQuery<DeviceSettings>({
    queryKey: ["/api/attendance-device/settings"],
  });

  // Fetch import logs
  const { data: importLogs = [], isLoading: isLoadingLogs } = useQuery<ImportLog[]>({
    queryKey: ["/api/attendance-device/logs"],
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (deploySettings) {
      setServerHost(deploySettings.serverHost || "0.0.0.0");
      setServerPort(deploySettings.serverPort || 3000);
    }
  }, [deploySettings]);

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

  const importUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/import");
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
      const res = await apiRequest("POST", "/api/attendance-device/fetch-users", {
        ipAddress: deviceForm.ipAddress,
        port: parseInt(deviceForm.port),
        timeout: parseInt(deviceForm.timeout),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) {
        setFetchedUsers(data.users || []);
        setSelectedUserIds([]);
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
      const res = await apiRequest("POST", "/api/attendance-device/import-selected", {
        userIds,
        ipAddress: deviceForm.ipAddress,
        port: parseInt(deviceForm.port),
        timeout: parseInt(deviceForm.timeout),
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

  const toggleSelectAll = () => {
    if (selectedUserIds.length === fetchedUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(fetchedUsers.map(user => user.userId));
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
              {/* Device Configuration Card */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Biometric Device Configuration
                      </CardTitle>
                      <CardDescription>Configure ZKTeco iFace990 Plus attendance device</CardDescription>
                    </div>
                    {deviceSettings && (
                      <Badge variant={deviceSettings.isActive ? "default" : "secondary"}>
                        {deviceSettings.isActive ? (
                          <>
                            <Wifi className="h-3 w-3 mr-1" />
                            Active
                          </>
                        ) : (
                          <>
                            <WifiOff className="h-3 w-3 mr-1" />
                            Inactive
                          </>
                        )}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="deviceName">Device Name</Label>
                      <Input
                        id="deviceName"
                        value={deviceForm.deviceName}
                        onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                        placeholder="iFace990 Plus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deviceModel">Device Model</Label>
                      <Input
                        id="deviceModel"
                        value={deviceForm.deviceModel}
                        onChange={(e) => setDeviceForm({ ...deviceForm, deviceModel: e.target.value })}
                        placeholder="iFace990 Plus"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">Serial Number</Label>
                      <Input
                        id="serialNumber"
                        value={deviceForm.serialNumber}
                        onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })}
                        placeholder="CKPG222360158"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ipAddress">IP Address</Label>
                      <Input
                        id="ipAddress"
                        value={deviceForm.ipAddress}
                        onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                        placeholder="192.168.40.2"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="port">Port</Label>
                      <Input
                        id="port"
                        type="number"
                        value={deviceForm.port}
                        onChange={(e) => setDeviceForm({ ...deviceForm, port: e.target.value })}
                        placeholder="4370"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timeout">Timeout (ms)</Label>
                      <Input
                        id="timeout"
                        type="number"
                        value={deviceForm.timeout}
                        onChange={(e) => setDeviceForm({ ...deviceForm, timeout: e.target.value })}
                        placeholder="5000"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => testConnectionMutation.mutate()}
                      disabled={testConnectionMutation.isPending}
                    >
                      <Wifi className="h-4 w-4 mr-2" />
                      {testConnectionMutation.isPending ? "Testing..." : "Test Connection"}
                    </Button>
                    <Button
                      onClick={() => saveSettingsMutation.mutate()}
                      disabled={saveSettingsMutation.isPending}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>

                  {deviceSettings && (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="space-y-1 text-sm">
                          <div><strong>Last Sync:</strong> {deviceSettings.lastSyncAt ? formatDate(deviceSettings.lastSyncAt) : "Never"}</div>
                          <div><strong>Last Import:</strong> {deviceSettings.lastImportAt ? formatDate(deviceSettings.lastImportAt) : "Never"}</div>
                        </div>
                      </AlertDescription>
                    </Alert>
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
            <div className="max-w-7xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Dynamics 365 Business Central Integration
                  </CardTitle>
                  <CardDescription>Configure integration with Microsoft Dynamics 365 Business Central</CardDescription>
                </CardHeader>
                <CardContent>
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dynamics 365 integration settings will be available in a future update.
                    </AlertDescription>
                  </Alert>
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
          
          <div className="flex-1 overflow-auto">
            <div className="space-y-2">
              {/* Select All Checkbox */}
              <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50 sticky top-0 z-10">
                <Checkbox
                  id="select-all"
                  checked={selectedUserIds.length === fetchedUsers.length && fetchedUsers.length > 0}
                  onCheckedChange={toggleSelectAll}
                  data-testid="checkbox-select-all"
                />
                <Label htmlFor="select-all" className="font-semibold cursor-pointer">
                  Select All ({fetchedUsers.length} users)
                </Label>
              </div>

              {/* User List */}
              {fetchedUsers.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No users fetched from device
                </div>
              ) : (
                <div className="space-y-2">
                  {fetchedUsers.map((user) => (
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
    </div>
  );
}
