import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDeletionAlertProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  entityLabel: string;
  entityName: string;
  description?: string;
  onConfirm: () => void;
  isConfirming?: boolean;
}

export function ConfirmDeletionAlert({
  isOpen,
  onOpenChange,
  entityLabel,
  entityName,
  description,
  onConfirm,
  isConfirming = false,
}: ConfirmDeletionAlertProps) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-confirm-deletion">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-xl" data-testid="text-dialog-title">
              Delete {entityLabel}?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="pt-4 text-base" data-testid="text-dialog-description">
            {description || (
              <>
                Are you sure you want to delete <strong className="font-semibold text-foreground">"{entityName}"</strong>? 
                This action cannot be undone and will permanently remove this {entityLabel.toLowerCase()} from the system.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel 
            disabled={isConfirming}
            data-testid="button-cancel-deletion"
          >
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              onConfirm();
            }}
            disabled={isConfirming}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-deletion"
          >
            {isConfirming ? (
              <>
                <span className="mr-2">Deleting...</span>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              "Delete"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
