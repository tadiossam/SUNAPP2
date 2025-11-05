import { useState, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLanguage } from "@/contexts/LanguageContext";
import { Users, Plus, Phone, Mail, Briefcase, Upload, User, Pencil, Trash2, Search, Grid3x3, List } from "lucide-react";
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
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const photoInputRef = useRef<HTMLInputElement>(null);

  const { data: employees, isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Filter employees based on search term
  const filteredEmployees = employees?.filter((employee) => {
    const search = searchTerm.toLowerCase();
    return (
      employee.fullName.toLowerCase().includes(search) ||
      employee.employeeId.toLowerCase().includes(search) ||
      employee.email?.toLowerCase().includes(search) ||
      employee.phoneNumber?.toLowerCase().includes(search) ||
      employee.role.toLowerCase().includes(search)
    );
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

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertEmployee }) => {
      return await apiRequest("PUT", `/api/employees/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsEditDialogOpen(false);
      setSelectedEmployee(null);
      editForm.reset();
      toast({
        title: "Employee Updated",
        description: "Employee information has been successfully updated.",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/employees/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      setIsDeleteDialogOpen(false);
      setSelectedEmployee(null);
      toast({
        title: "Employee Deleted",
        description: "Employee has been successfully deleted.",
      });
    },
  });

  const deleteAllBiometricEmployeesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", "/api/biometric-imports/delete-all-employees", {});
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/employees"] });
      toast({
        title: "Employees Deleted",
        description: `Deleted ${data.deletedCount} employees imported from biometric device`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete biometric employees",
        variant: "destructive",
      });
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedEmployee) throw new Error("No employee selected");
      
      // Step 1: Get presigned upload URL
      const urlResponse = await apiRequest("POST", `/api/employees/${selectedEmployee.id}/photo/upload-url`);
      const { uploadURL, objectPath } = await urlResponse.json() as { uploadURL: string; objectPath: string };

      // Step 2: Upload file directly to object storage
      const uploadResponse = await fetch(uploadURL, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload file to storage');
      }

      // Step 3: Update employee with photo URL
      const updateResponse = await apiRequest("PUT", `/api/employees/${selectedEmployee.id}/photo`, {
        photoUrl: objectPath,
      });
      const employee = await updateResponse.json();

      return employee;
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

  const editForm = useForm<InsertEmployee>({
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

  const onEditSubmit = (data: InsertEmployee) => {
    if (selectedEmployee) {
      updateMutation.mutate({ id: selectedEmployee.id, data });
    }
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    editForm.reset({
      employeeId: employee.employeeId,
      fullName: employee.fullName,
      username: employee.username || "",
      password: "", // Don't populate password for security
      role: employee.role,
      phoneNumber: employee.phoneNumber || "",
      email: employee.email || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedEmployee) {
      deleteMutation.mutate(selectedEmployee.id);
    }
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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-background space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold tracking-tight" data-testid="text-page-title">{t("employees")}</h1>
              <p className="text-sm text-muted-foreground" data-testid="text-employee-count">
                {employees?.length || 0} {employees?.length === 1 ? 'employee' : 'employees'} total
                {filteredEmployees && filteredEmployees.length !== employees?.length && (
                  <span> • {filteredEmployees.length} matching search</span>
                )}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  disabled={deleteAllBiometricEmployeesMutation.isPending}
                  data-testid="button-delete-all-biometric-employees"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleteAllBiometricEmployeesMutation.isPending ? "Deleting..." : "Delete All Employees"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete All Biometric Employees?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all employees that were imported from the biometric device. 
                    This action cannot be undone. Manually created employees will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete-all">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteAllBiometricEmployeesMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete-all"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
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
        </div>

        {/* Search and View Toggle */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search") + " employees..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="input-search-employees"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              data-testid="button-view-grid"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("list")}
              data-testid="button-view-list"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-auto p-6">
        {filteredEmployees && filteredEmployees.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg text-muted-foreground">{t("noData")}</p>
            </CardContent>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEmployees?.map((employee) => (
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

                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedEmployee(employee);
                      photoInputRef.current?.click();
                    }}
                    data-testid={`button-upload-photo-${employee.id}`}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {t("uploadPhoto")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(employee)}
                    data-testid={`button-edit-${employee.id}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(employee)}
                    data-testid={`button-delete-${employee.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEmployees?.map((employee) => (
              <Card key={employee.id} className="hover-elevate" data-testid={`card-employee-${employee.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      {employee.profilePicture ? (
                        <AvatarImage src={employee.profilePicture} alt={employee.fullName} />
                      ) : null}
                      <AvatarFallback className="bg-primary/10 text-primary text-lg">
                        {employee.fullName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <p className="font-semibold text-base truncate">{employee.fullName}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">{employee.employeeId}</Badge>
                          <Badge variant={getRoleBadgeVariant(employee.role)} className="text-xs">
                            {getRoleLabel(employee.role)}
                          </Badge>
                        </div>
                      </div>
                      
                      {employee.phoneNumber && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{employee.phoneNumber}</span>
                        </div>
                      )}
                      
                      {employee.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-4 w-4 flex-shrink-0" />
                          <span className="truncate">{employee.email}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedEmployee(employee);
                          photoInputRef.current?.click();
                        }}
                        data-testid={`button-upload-photo-${employee.id}`}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {t("uploadPhoto")}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(employee)}
                        data-testid={`button-edit-${employee.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(employee)}
                        data-testid={`button-delete-${employee.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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

      {/* Edit Employee Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Employee ID</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-employee-id"
                        placeholder="Employee ID"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("employeeName")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        data-testid="input-edit-employee-name"
                        placeholder={t("employeeName")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (for login)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        data-testid="input-edit-employee-username"
                        placeholder="Username (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password (leave blank to keep current)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value || ""}
                        type="password"
                        data-testid="input-edit-employee-password"
                        placeholder="New password (optional)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("role")}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-edit-employee-role">
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
                control={editForm.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("phone")}</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value || ""}
                        onChange={field.onChange}
                        data-testid="input-edit-employee-phone"
                        placeholder={t("phone")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        value={field.value || ""}
                        onChange={field.onChange}
                        type="email"
                        data-testid="input-edit-employee-email"
                        placeholder={t("email")}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  data-testid="button-cancel-edit"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="button-submit-edit-employee"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? t("loading") : "Update Employee"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">
              Are you sure you want to delete employee <strong>{selectedEmployee?.fullName}</strong>? This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              data-testid="button-cancel-delete"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Employee"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
