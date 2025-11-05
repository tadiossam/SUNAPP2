import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
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

export default function AdminPage() {
  const { toast } = useToast();
  const [deviceForm, setDeviceForm] = useState({
    deviceName: "iFace990 Plus",
    deviceModel: "iFace990 Plus",
    serialNumber: "CKPG222360158",
    ipAddress: "192.168.40.2",
    port: "4370",
    timeout: "5000",
  });

  // Fetch device settings
  const { data: deviceSettings, isLoading: isLoadingDevice } = useQuery<DeviceSettings>({
    queryKey: ["/api/attendance-device/settings"],
  });

  // Fetch import logs
  const { data: importLogs = [], isLoading: isLoadingLogs } = useQuery<ImportLog[]>({
    queryKey: ["/api/attendance-device/logs"],
  });

  // Sync device settings to form when loaded
  useEffect(() => {
    if (deviceSettings) {
      setDeviceForm({
        deviceName: deviceSettings.deviceName || "",
        deviceModel: deviceSettings.deviceModel || "",
        serialNumber: deviceSettings.serialNumber || "",
        ipAddress: deviceSettings.ipAddress || "",
        port: String(deviceSettings.port || "4370"),
        timeout: String(deviceSettings.timeout || "5000"),
      });
    }
  }, [deviceSettings]);

  // Test connection mutation
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

  // Save device settings mutation
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

  // Import all users mutation
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
          description: `Imported ${data.imported} users, updated ${data.updated} users, skipped ${data.skipped} users.`,
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

  // Sync new users mutation
  const syncUsersMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/attendance-device/sync-users");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance-device/logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      
      if (data.success) {
        toast({
          title: "Sync Successful",
          description: `Synced ${data.newUsers} new users.`,
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

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground mt-1">
              Manage attendance device and employee imports
            </p>
          </div>
          {deviceSettings && (
            <Badge variant={deviceSettings.isActive ? "default" : "secondary"}>
              {deviceSettings.isActive ? "Active" : "Inactive"}
            </Badge>
          )}
        </div>

        {/* Device Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Device Settings
            </CardTitle>
            <CardDescription>
              Configure connection to iFace990 Plus attendance device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deviceName">Device Name</Label>
                <Input
                  id="deviceName"
                  value={deviceForm.deviceName}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceName: e.target.value })}
                  data-testid="input-device-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deviceModel">Device Model</Label>
                <Input
                  id="deviceModel"
                  value={deviceForm.deviceModel}
                  onChange={(e) => setDeviceForm({ ...deviceForm, deviceModel: e.target.value })}
                  data-testid="input-device-model"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="serialNumber">Serial Number</Label>
                <Input
                  id="serialNumber"
                  value={deviceForm.serialNumber}
                  onChange={(e) => setDeviceForm({ ...deviceForm, serialNumber: e.target.value })}
                  data-testid="input-serial-number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ipAddress">IP Address</Label>
                <Input
                  id="ipAddress"
                  value={deviceForm.ipAddress}
                  onChange={(e) => setDeviceForm({ ...deviceForm, ipAddress: e.target.value })}
                  placeholder="192.168.40.2"
                  data-testid="input-ip-address"
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
                  data-testid="input-port"
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
                  data-testid="input-timeout"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={() => testConnectionMutation.mutate()}
                disabled={testConnectionMutation.isPending}
                variant="outline"
                data-testid="button-test-connection"
              >
                {testConnectionMutation.isPending ? (
                  <WifiOff className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Wifi className="mr-2 h-4 w-4" />
                )}
                Test Connection
              </Button>
              <Button
                onClick={() => saveSettingsMutation.mutate()}
                disabled={saveSettingsMutation.isPending}
                data-testid="button-save-settings"
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Import/Sync Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Import All Users
              </CardTitle>
              <CardDescription>
                One-time import of all users from the attendance device
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceSettings?.lastImportAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last imported: {formatDate(deviceSettings.lastImportAt)}
                </div>
              )}
              <Button
                onClick={() => importUsersMutation.mutate()}
                disabled={importUsersMutation.isPending || !deviceSettings}
                className="w-full"
                data-testid="button-import-users"
              >
                {importUsersMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Import All Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync New Users
              </CardTitle>
              <CardDescription>
                Sync only new users added since last import/sync
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {deviceSettings?.lastSyncAt && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Last synced: {formatDate(deviceSettings.lastSyncAt)}
                </div>
              )}
              <Button
                onClick={() => syncUsersMutation.mutate()}
                disabled={syncUsersMutation.isPending || !deviceSettings}
                className="w-full"
                variant="outline"
                data-testid="button-sync-users"
              >
                {syncUsersMutation.isPending ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Sync New Users
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Logs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Import History
                </CardTitle>
                <CardDescription>
                  View history of user imports and syncs
                </CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" data-testid="button-view-all-logs">
                    View All
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>All Import Logs</DialogTitle>
                    <DialogDescription>
                      Complete history of device import operations
                    </DialogDescription>
                  </DialogHeader>
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
                                <CheckCircle2 className="mr-1 h-3 w-3" />
                                Success
                              </Badge>
                            ) : log.status === "failed" ? (
                              <Badge variant="destructive">
                                <XCircle className="mr-1 h-3 w-3" />
                                Failed
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="mr-1 h-3 w-3" />
                                Partial
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
                No import logs yet
              </div>
            ) : (
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
                            <CheckCircle2 className="mr-1 h-3 w-3" />
                            Success
                          </Badge>
                        ) : log.status === "failed" ? (
                          <Badge variant="destructive">
                            <XCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Partial
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
