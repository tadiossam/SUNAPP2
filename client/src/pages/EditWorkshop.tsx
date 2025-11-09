import { useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Users, Lock, Edit } from "lucide-react";
import type { Employee, Workshop } from "@shared/schema";
import { insertWorkshopSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWorkshopDraft } from "@/contexts/WorkshopDraftContext";

export default function EditWorkshop() {
  const { garageId, workshopId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { draft, setDraft, updateDraft, clearDraft } = useWorkshopDraft();

  const { data: workshop, isLoading } = useQuery<Workshop & { membersList?: Employee[] }>({
    queryKey: [`/api/workshops/${workshopId}`],
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const { data: systemSettings } = useQuery<{ planningTargetsLocked: boolean }>({
    queryKey: ["/api/system-settings"],
  });

  const planningTargetsLocked = systemSettings?.planningTargetsLocked ?? true;

  const form = useForm({
    resolver: zodResolver(
      insertWorkshopSchema.extend({
        memberIds: z.array(z.string()).min(1, "At least one team member is required"),
      })
    ),
    defaultValues: draft || {
      name: "",
      foremanId: "",
      description: "",
      garageId: garageId,
      memberIds: [] as string[],
      monthlyTarget: undefined,
      q1Target: undefined,
      q2Target: undefined,
      q3Target: undefined,
      q4Target: undefined,
      annualTarget: undefined,
    },
  });

  // Initialize draft from workshop data
  useEffect(() => {
    if (workshop && (!draft || draft.workshopId !== workshopId)) {
      const memberIds = workshop.membersList?.map((m: Employee) => m.id) || [];
      const initialDraft = {
        name: workshop.name,
        foremanId: workshop.foremanId || "",
        description: workshop.description || "",
        garageId: workshop.garageId,
        memberIds: memberIds,
        monthlyTarget: workshop.monthlyTarget ?? undefined,
        q1Target: workshop.q1Target ?? undefined,
        q2Target: workshop.q2Target ?? undefined,
        q3Target: workshop.q3Target ?? undefined,
        q4Target: workshop.q4Target ?? undefined,
        annualTarget: workshop.annualTarget ?? undefined,
        workshopId: workshopId,
      };
      setDraft(initialDraft);
      form.reset(initialDraft);
    }
  }, [workshop, draft, setDraft, workshopId, form]);

  // Sync form changes to draft
  useEffect(() => {
    const subscription = form.watch((value) => {
      if (draft) {
        updateDraft(value as any);
      }
    });
    return () => subscription.unsubscribe();
  }, [form, draft, updateDraft]);

  // Update form when draft changes (from SelectEmployees navigation)
  useEffect(() => {
    if (draft) {
      form.reset(draft);
    }
  }, [draft?.foremanId, draft?.memberIds]);

  const updateWorkshopMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/workshops/${workshopId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/garages/${garageId}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/workshops/${workshopId}`] });
      clearDraft();
      toast({
        title: "Workshop updated",
        description: "Workshop has been successfully updated.",
      });
      setLocation(`/garages/${garageId}`);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update workshop",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateWorkshopMutation.mutate(data);
  };

  const handleCancel = () => {
    clearDraft();
    setLocation(`/garages/${garageId}`);
  };

  const selectedForeman = employees.find((e) => e.id === draft?.foremanId);
  const selectedMembers = employees.filter((e) => draft?.memberIds?.includes(e.id));

  if (isLoading) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 max-w-4xl space-y-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!workshop) {
    return (
      <div className="h-full overflow-auto">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-muted-foreground">Workshop not found</h2>
            <Button onClick={() => setLocation(`/garages/${garageId}`)} className="mt-4">
              Back to Garage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            data-testid="button-back-to-garage"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Edit className="h-8 w-8 text-primary" />
              Edit Workshop
            </h1>
            <p className="text-muted-foreground mt-1">
              Update workshop details and team assignments
            </p>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Workshop Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workshop Name *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            data-testid="input-workshop-name"
                            placeholder="e.g., Engine Workshop, Hydraulics Shop"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Workshop description"
                            data-testid="input-workshop-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Team Assignment */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Team Assignment</h3>

                  <FormField
                    control={form.control}
                    name="foremanId"
                    render={() => (
                      <FormItem>
                        <FormLabel>Foreman (Boss) *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() =>
                                setLocation(
                                  `/garages/${garageId}/workshops/select-employees?mode=foreman&returnTo=edit&workshopId=${workshopId}`
                                )
                              }
                              data-testid="button-select-foreman"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {selectedForeman ? selectedForeman.fullName : "Select foreman"}
                            </Button>
                            {selectedForeman && (
                              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                                <Badge variant="secondary">{selectedForeman.role}</Badge>
                                <span className="text-sm">{selectedForeman.fullName}</span>
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="memberIds"
                    render={() => (
                      <FormItem>
                        <FormLabel>Workshop Members *</FormLabel>
                        <FormControl>
                          <div className="space-y-2">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() =>
                                setLocation(
                                  `/garages/${garageId}/workshops/select-employees?mode=members&returnTo=edit&workshopId=${workshopId}`
                                )
                              }
                              data-testid="button-select-members"
                            >
                              <Users className="h-4 w-4 mr-2" />
                              {draft?.memberIds && draft.memberIds.length > 0
                                ? `${draft.memberIds.length} member(s) selected`
                                : "Select team members"}
                            </Button>
                            {selectedMembers.length > 0 && (
                              <div className="space-y-2">
                                {selectedMembers.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center gap-2 p-3 bg-muted rounded-lg"
                                  >
                                    <Badge variant="secondary">{member.role}</Badge>
                                    <span className="text-sm">{member.fullName}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Planning Targets */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Planning Targets (Optional)</h3>

                  {planningTargetsLocked && (
                    <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                      <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Planning targets are locked for the current Ethiopian year. They can only be
                        edited when a new year starts through the Year Closure process in Admin
                        Settings.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="monthlyTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Monthly Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-monthly-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="annualTarget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-annual-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="q1Target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q1 Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-q1-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="q2Target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q2 Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-q2-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="q3Target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q3 Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-q3-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="q4Target"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Q4 Target</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="0"
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : undefined)
                              }
                              data-testid="input-q4-target"
                              disabled={planningTargetsLocked}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1"
                    data-testid="button-cancel"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    data-testid="button-submit"
                    disabled={updateWorkshopMutation.isPending}
                  >
                    {updateWorkshopMutation.isPending ? "Updating..." : "Update Workshop"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
