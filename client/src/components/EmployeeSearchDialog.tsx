import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, Users, ChevronLeft, ChevronRight } from "lucide-react";
import type { Employee } from "@shared/schema";

interface EmployeeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "single" | "multiple";
  title: string;
  description?: string;
  selectedIds?: string[];
  excludeIds?: string[];
  onSelect: (employeeIds: string[]) => void;
}

const EMPLOYEES_PER_PAGE = 30;

export function EmployeeSearchDialog({
  open,
  onOpenChange,
  mode,
  title,
  description,
  selectedIds = [],
  excludeIds = [],
  onSelect,
}: EmployeeSearchDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>(selectedIds);
  const [currentPage, setCurrentPage] = useState(0);

  // Sync internal state when dialog opens or selectedIds changes
  useEffect(() => {
    if (open) {
      setInternalSelectedIds(selectedIds);
      setSearchTerm(""); // Reset search for fresh experience
      setCurrentPage(0); // Reset to first page
    }
  }, [open, selectedIds]);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(0);
  }, [searchTerm]);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ["/api/employees"],
  });

  const filteredEmployees = useMemo(() => {
    return employees
      .filter((emp) => !excludeIds.includes(emp.id))
      .filter(
        (emp) =>
          emp.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [employees, excludeIds, searchTerm]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / EMPLOYEES_PER_PAGE);
  const startIndex = currentPage * EMPLOYEES_PER_PAGE;
  const endIndex = startIndex + EMPLOYEES_PER_PAGE;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Clamp current page when filtered list shrinks (e.g., excludeIds changes)
  useEffect(() => {
    if (filteredEmployees.length > 0 && paginatedEmployees.length === 0) {
      // Current page is beyond available pages, reset to last valid page
      const maxPage = Math.max(totalPages - 1, 0);
      setCurrentPage(maxPage);
    }
  }, [filteredEmployees.length, paginatedEmployees.length, totalPages]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleSelect = (employeeId: string) => {
    if (mode === "single") {
      setInternalSelectedIds([employeeId]);
    } else {
      setInternalSelectedIds((prev) =>
        prev.includes(employeeId)
          ? prev.filter((id) => id !== employeeId)
          : [...prev, employeeId]
      );
    }
  };

  const handleConfirm = () => {
    onSelect(internalSelectedIds);
    onOpenChange(false);
    setSearchTerm("");
  };

  const handleCancel = () => {
    setInternalSelectedIds(selectedIds);
    onOpenChange(false);
    setSearchTerm("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col" data-testid="dialog-employee-search">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "single" ? <UserCheck className="h-5 w-5" /> : <Users className="h-5 w-5" />}
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
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

          <ScrollArea className="flex-1 pr-4">
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
                      internalSelectedIds.includes(employee.id)
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    }`}
                    onClick={() => handleSelect(employee.id)}
                    data-testid={`employee-item-${employee.id}`}
                  >
                    {mode === "multiple" && (
                      <Checkbox
                        checked={internalSelectedIds.includes(employee.id)}
                        onCheckedChange={() => handleSelect(employee.id)}
                        data-testid={`checkbox-employee-${employee.id}`}
                      />
                    )}
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={employee.profilePicture || undefined} />
                      <AvatarFallback>
                        {employee.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{employee.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {employee.employeeId} • {employee.role}
                      </div>
                    </div>
                    {mode === "single" && internalSelectedIds.includes(employee.id) && (
                      <UserCheck className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Pagination Controls */}
          {filteredEmployees.length > EMPLOYEES_PER_PAGE && (
            <div className="flex items-center justify-between pt-3 border-t flex-shrink-0">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1}-{Math.min(endIndex, filteredEmployees.length)} of {filteredEmployees.length}
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
          <div className="flex items-center justify-between pt-4 border-t flex-shrink-0">
            <div className="text-sm text-muted-foreground">
              {mode === "multiple" && `${internalSelectedIds.length} selected`}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                data-testid="button-cancel-selection"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={internalSelectedIds.length === 0}
                data-testid="button-confirm-selection"
              >
                Confirm {mode === "multiple" ? "Selection" : ""}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
