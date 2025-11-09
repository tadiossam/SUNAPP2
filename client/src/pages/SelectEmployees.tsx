import { useState, useMemo, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, Users, ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import type { Employee } from "@shared/schema";
import { useWorkshopDraft } from "@/contexts/WorkshopDraftContext";

const EMPLOYEES_PER_PAGE = 30;

export default function SelectEmployees() {
  const { garageId } = useParams();
  const [, setLocation] = useLocation();
  const { draft, patchDraft } = useWorkshopDraft();

  // Get query params
  const params = new URLSearchParams(window.location.search);
  const mode = params.get("mode") as "foreman" | "members" || "foreman";
  const returnTo = params.get("returnTo") || "add";
  const workshopId = params.get("workshopId");

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    mode === "foreman" 
      ? (draft?.foremanId ? [draft.foremanId] : [])
      : (draft?.memberIds || [])
  );
  const [currentPage, setCurrentPage] = useState(0);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE);
  const startIndex = currentPage * EMPLOYEES_PER_PAGE;
  const endIndex = startIndex + EMPLOYEES_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Clamp current page when filtered list shrinks
  useEffect(() => {
    if (filteredEmployees.length > 0 && paginatedEmployees.length === 0) {
      const maxPage = Math.max(totalPages - 1, 0);
      setCurrentPage(maxPage);
    }
  }, [filteredEmployees.length, paginatedEmployees.length, totalPages]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleSelect = (employeeId: string) => {
    if (mode === "foreman") {
      setSelectedIds([employeeId]);
    } else {
      setSelectedIds((prev) =>
        prev.includes(employeeId) ? prev.filter((id) => id !== employeeId) : [...prev, employeeId]
      );
    }
  };

  const handleConfirm = () => {
    // Update draft synchronously using patchDraft
    if (mode === "foreman" && selectedIds.length > 0) {
      patchDraft({ foremanId: selectedIds[0] });
    } else if (mode === "members") {
      patchDraft({ memberIds: selectedIds });
    }

    // Navigate immediately - no timeout needed with synchronous persistence
    if (returnTo === "add") {
      setLocation(`/garages/${garageId}/workshops/new`);
    } else {
      setLocation(`/garages/${garageId}/workshops/${workshopId}/edit`);
    }
  };

  const handleCancel = () => {
    // Navigate back without saving
    if (returnTo === "add") {
      setLocation(`/garages/${garageId}/workshops/new`);
    } else {
      setLocation(`/garages/${garageId}/workshops/${workshopId}/edit`);
    }
  };

  const title = mode === "foreman" ? "Select Foreman" : "Select Team Members";
  const description =
    mode === "foreman"
      ? "Choose one foreman to lead this workshop"
      : "Choose team members who will work in this workshop";

  return (
    <div className="h-full overflow-auto">
      <div className="container mx-auto p-6 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              {mode === "foreman" ? (
                <UserCheck className="h-8 w-8 text-primary" />
              ) : (
                <Users className="h-8 w-8 text-primary" />
              )}
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {mode === "foreman" ? "Available Employees" : "Available Team Members"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ID, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-employee-search"
              />
            </div>

            {/* Employee List */}
            <ScrollArea className="min-h-[400px] pr-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  Loading employees...
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="flex items-center justify-center py-8 text-muted-foreground">
                  No employees found
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedEmployees.map((employee) => (
                    <div
                      key={employee.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors hover-elevate ${
                        selectedIds.includes(employee.id)
                          ? "border-primary bg-primary/5"
                          : "border-border"
                      }`}
                      onClick={() => handleSelect(employee.id)}
                      data-testid={`employee-item-${employee.id}`}
                    >
                      {mode === "members" && (
                        <Checkbox
                          checked={selectedIds.includes(employee.id)}
                          onCheckedChange={() => handleSelect(employee.id)}
                          data-testid={`checkbox-employee-${employee.id}`}
                        />
                      )}
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={employee.profilePicture || undefined} />
                        <AvatarFallback>
                          {employee.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{employee.fullName}</div>
                        <div className="text-sm text-muted-foreground">
                          {employee.employeeId} • {employee.role}
                        </div>
                      </div>
                      {mode === "foreman" && selectedIds.includes(employee.id) && (
                        <UserCheck className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {/* Pagination Controls */}
            {filteredEmployees.length > EMPLOYEES_PER_PAGE && (
              <div className="flex items-center justify-between pt-3 border-t">
                <div className="text-sm text-muted-foreground">
                  Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of{" "}
                  {filteredEmployees.length}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    data-testid="button-previous-page"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                  <Badge variant="secondary" className="px-3">
                    Page {currentPage + 1} of {totalPages}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1}
                    data-testid="button-next-page"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            )}

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
                type="button"
                onClick={handleConfirm}
                className="flex-1"
                data-testid="button-confirm"
                disabled={selectedIds.length === 0}
              >
                Confirm Selection
                {selectedIds.length > 0 && ` (${selectedIds.length})`}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
