import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Shield, Lock, User as UserIcon, Languages } from "lucide-react";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState<"en" | "am">("en");

  // Check if already logged in
  const { data: authData } = useQuery({
    queryKey: ["/api/auth/me"],
  });

  // Fetch app customizations
  const { data: appCustomizations } = useQuery({
    queryKey: ["/api/app-customizations"],
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string; language: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", credentials);
      return res.json();
    },
    onSuccess: (data: any) => {
      // Store JWT token in localStorage
      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.user.fullName}!`,
      });
      setLocation("/equipment");
    },
    onError: (error: any) => {
      toast({
        title: "Login failed",
        description: error.message || "Invalid username or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ username, password, language });
  };

  // Redirect if already logged in
  useEffect(() => {
    if ((authData as any)?.user) {
      setLocation("/equipment");
    }
  }, [authData, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Shield className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {(appCustomizations as any)?.appName || "Gelan Terminal Maintenance"}
          </CardTitle>
          <CardDescription>
            Sign in to access the equipment management system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {language === "am" ? "ቋንቋ" : "Language"}
              </Label>
              <Select value={language} onValueChange={(value: "en" | "am") => setLanguage(value)}>
                <SelectTrigger id="language" data-testid="select-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="am">አማርኛ (Amharic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                {language === "am" ? "የተጠቃሚ ስም" : "Username"}
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={language === "am" ? "የተጠቃሚ ስምዎን ያስገቡ" : "Enter your username"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                data-testid="input-username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                {language === "am" ? "የይለፍ ቃል" : "Password"}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={language === "am" ? "የይለፍ ቃልዎን ያስገቡ" : "Enter your password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
              data-testid="button-login"
            >
              {loginMutation.isPending 
                ? (language === "am" ? "በመግባት ላይ..." : "Signing in...") 
                : (language === "am" ? "ግባ" : "Sign In")}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <div className="absolute bottom-4 left-0 right-0 text-center text-sm text-muted-foreground">
        <p>Master Equipment List - Sunshine Construction PLC</p>
        <p className="text-xs mt-1">CEO access required for equipment modifications</p>
      </div>
    </div>
  );
}
