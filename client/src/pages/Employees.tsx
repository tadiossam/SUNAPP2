import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Plus, Phone, Mail, Briefcase, Upload, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertEmployeeSchema, type InsertEmployee, type Employee } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function Employees() {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmployee) => {
      return await apiRequest("POST", "/api/employees", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDialogOpen(false);
      setSelectedEmployee(null);
      form.reset();
      toast({
        title: t("addEmployee"),
        description: "Employee created successfully",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedEmployee) throw new Error("No employee selected");
      
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/employees/${selectedEmployee.id}/photo`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload photo');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Photo uploaded",
        description: "Employee photo has been successfully uploaded.",
      });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload photo",
        variant: "destructive",
      });
    },
  });

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const form = useForm<InsertEmployee>({
    resolver: zodResolver(insertEmployeeSchema),
    defaultValues: {
      employeeId: "",
      fullName: "",
      username: "",
      password: "",
      role: "wash_employee",
      phoneNumber: "",
      email: "",
    },
  });

  const onSubmit = (data: InsertEmployee) => {
    createMutation.mutate(data);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "mechanic":
        return "default";
      case "supervisor":
        return "secondary";
      case "painter":
      case "body_worker":
      case "electrician":
        return "default";
      default:
        return "outline";
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "ceo":
        return "CEO";
      case "admin":
        return "Admin";
      case "user":
        return "User";
      case "mechanic":
        return t("mechanic");
      case "supervisor":
        return t("supervisor");
      case "wash_employee":
        return t("washEmployee");
      case "painter":
        return t("painter");
      case "body_worker":
        return t("bodyWorker");
      case "electrician":
        return t("electrician");
      case "technician":
        return t("technician");
      default:
        return role;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold" data-testid="text-page-title">{t("employees")}</h1>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-employee">
              <Plus className="h-4 w-4 mr-2" />
              {t("addEmployee")}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("addEmployee")}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-employee-id"
                          placeholder="Employee ID"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("employeeName")}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          data-testid="input-employee-name"
                          placeholder={t("employeeName")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username (for login)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          data-testid="input-employee-username"
                          placeholder="Username (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password (for login)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value || ""}
                          type="password"
                          data-testid="input-employee-password"
                          placeholder="Password (optional)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("role")}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-employee-role">
                            <SelectValue placeholder={t("role")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ceo">CEO</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="wash_employee">{t("washEmployee")}</SelectItem>
                          <SelectItem value="mechanic">{t("mechanic")}</SelectItem>
                          <SelectItem value="supervisor">{t("supervisor")}</SelectItem>
                          <SelectItem value="painter">{t("painter")}</SelectItem>
                          <SelectItem value="body_worker">{t("bodyWorker")}</SelectItem>
                          <SelectItem value="electrician">{t("electrician")}</SelectItem>
                          <SelectItem value="technician">{t("technician")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("phone")}</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value || ""}
                          onChange={field.onChange}
                          data-testid="input-employee-phone"
                          placeholder={t("phone")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("email")}</FormLabel>
                      <FormControl>
                        <Input
                          value={field.value || ""}
                          onChange={field.onChange}
                          type="email"
                          data-testid="input-employee-email"
                          placeholder={t("email")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    data-testid="button-submit-employee"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? t("loading") : t("save")}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {employees && employees.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-lg text-muted-foreground">{t("noData")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {employees?.map((employee) => (
            <Card key={employee.id} className="hover-elevate" data-testid={`card-employee-${employee.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <Avatar className="h-16 w-16">
                    {employee.profilePicture ? (
                      <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                    ) : null}
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {employee.fullName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{employee.fullName}</CardTitle>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">{employee.employeeId}</Badge>
                      <Badge variant={getRoleBadgeVariant(employee.role)} data-testid={`badge-role-${employee.id}`} className="text-xs">
                        {getRoleLabel(employee.role)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {employee.phoneNumber && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span data-testid={`text-phone-${employee.id}`}>{employee.phoneNumber}</span>
                  </div>
                )}
                
                {employee.email && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span data-testid={`text-email-${employee.id}`} className="truncate">{employee.email}</span>
                  </div>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full mt-2"
                  onClick={() => {
                    setSelectedEmployee(employee);
                    photoInputRef.current?.click();
                  }}
                  data-testid={`button-upload-photo-${employee.id}`}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {t("uploadPhoto")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Hidden file input for employee photos */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
        data-testid="input-photo-upload"
      />
    </div>
  );
}
