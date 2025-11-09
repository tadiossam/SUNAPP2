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
  getStorageKey: (garageId: string, workshopId?: string) => string;
  initDraft: (garageId: string, workshopId?: string) => void;
}

const getStorageKey = (garageId: string, workshopId?: string) => {
  return `workshop_draft_${garageId}_${workshopId || "new"}`;
};

const WorkshopDraftContext = createContext<WorkshopDraftContextType | undefined>(undefined);

export function WorkshopDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraftState] = useState<WorkshopDraft | null>(null);
  const [currentStorageKey, setCurrentStorageKey] = useState<string | null>(null);

  // Persist to sessionStorage whenever draft changes
  useEffect(() => {
    if (currentStorageKey) {
      if (draft) {
        sessionStorage.setItem(currentStorageKey, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(currentStorageKey);
      }
    }
  }, [draft, currentStorageKey]);

  const initDraft = (garageId: string, workshopId?: string) => {
    const key = getStorageKey(garageId, workshopId);
    setCurrentStorageKey(key);
    
    // Load from sessionStorage if exists
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        setDraftState(JSON.parse(stored));
      } else {
        setDraftState(null);
      }
    } catch {
      setDraftState(null);
    }
  };

  const setDraft = (newDraft: WorkshopDraft | null) => {
    setDraftState(newDraft);
  };

  const updateDraft = (updates: Partial<WorkshopDraft>) => {
    setDraftState((prev) => (prev ? { ...prev, ...updates } : null));
  };

  const clearDraft = () => {
    if (currentStorageKey) {
      sessionStorage.removeItem(currentStorageKey);
    }
    setDraftState(null);
    setCurrentStorageKey(null);
  };

  const setForemanId = (foremanId: string) => {
    updateDraft({ foremanId });
  };

  const setMemberIds = (memberIds: string[]) => {
    updateDraft({ memberIds });
  };

  return (
    <WorkshopDraftContext.Provider
      value={{ 
        draft, 
        setDraft, 
        updateDraft, 
        clearDraft, 
        setForemanId, 
        setMemberIds,
        getStorageKey,
        initDraft
      }}
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
