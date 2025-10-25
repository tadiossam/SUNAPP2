import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Save, Server, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLanguage } from "@/contexts/LanguageContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SystemSettings } from "@shared/schema";

export default function AdminSettings() {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  const [serverHost, setServerHost] = useState("0.0.0.0");
  const [serverPort, setServerPort] = useState(3000);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ["/api/system-settings"],
  });

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setServerHost(settings.serverHost || "0.0.0.0");
      setServerPort(settings.serverPort || 3000);
    }
  }, [settings]);

  // Mutation to update settings
  const saveMutation = useMutation({
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

  const handleSave = () => {
    // Validate port number
    if (serverPort < 1 || serverPort > 65535) {
      toast({
        title: t("error"),
        description: t("invalidPortNumber"),
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate({
      serverHost,
      serverPort,
    });
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

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Server Configuration Card */}
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
              {/* Alert */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t("serverRestartRequired")}
                </AlertDescription>
              </Alert>

              {/* Server Host */}
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

              {/* Server Port */}
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

              {/* Current Settings Display */}
              {settings && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium mb-2">{t("currentSettings")}:</p>
                  <div className="bg-muted p-3 rounded-md text-sm font-mono">
                    <div>Host: {settings.serverHost || "0.0.0.0"}</div>
                    <div>Port: {settings.serverPort || 3000}</div>
                    {settings.updatedAt && (
                      <div className="text-xs text-muted-foreground mt-2">
                        {t("lastUpdated")}: {new Date(settings.updatedAt).toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Save Button */}
              <div className="pt-4 flex justify-end">
                <Button
                  onClick={handleSave}
                  disabled={saveMutation.isPending || isLoading}
                  data-testid="button-save-settings"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saveMutation.isPending ? t("saving") : t("saveSettings")}
                </Button>
              </div>

              {/* Restart Instructions */}
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
      </div>
    </div>
  );
}
