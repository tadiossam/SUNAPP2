import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface WorkshopDraft {
  name: string;
  foremanId: string;
  description: string;
  garageId: string;
  memberIds: string[];
  monthlyTarget?: number;
  q1Target?: number;
  q2Target?: number;
  q3Target?: number;
  q4Target?: number;
  annualTarget?: number;
  workshopId?: string; // For edit mode
}

interface WorkshopDraftContextType {
  draft: WorkshopDraft | null;
  setDraft: (draft: WorkshopDraft | null) => void;
  updateDraft: (updates: Partial<WorkshopDraft>) => void;
  clearDraft: () => void;
  setForemanId: (foremanId: string) => void;
  setMemberIds: (memberIds: string[]) => void;
}

const STORAGE_KEY = "workshop_draft";

const WorkshopDraftContext = createContext<WorkshopDraftContextType | undefined>(undefined);

export function WorkshopDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<WorkshopDraft | null>(() => {
    // Initialize from sessionStorage
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Persist to sessionStorage whenever draft changes
  useEffect(() => {
    if (draft) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }, [draft]);

  const setDraft = (newDraft: WorkshopDraft | null) => {
    setDraftState(newDraft);
  };

  const updateDraft = (updates: Partial<WorkshopDraft>) => {
    setDraftState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const clearDraft = () => {
    setDraftState(null);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  const setForemanId = (foremanId: string) => {
    updateDraft({ foremanId });
  };

  const setMemberIds = (memberIds: string[]) => {
    updateDraft({ memberIds });
  };

  return (
    <WorkshopDraftContext.Provider
      value={{ draft, setDraft, updateDraft, clearDraft, setForemanId, setMemberIds }}
    >
      {children}
    </WorkshopDraftContext.Provider>
  );
}

export function useWorkshopDraft() {
  const context = useContext(WorkshopDraftContext);
  if (!context) {
    throw new Error("useWorkshopDraft must be used within WorkshopDraftProvider");
  }
  return context;
}
