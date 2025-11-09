import { createContext, useContext, useState, useLayoutEffect, ReactNode } from "react";

interface WorkshopDraft {
  name: string;
  foremanId?: string; // Optional until selected
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
  isReady: boolean;
  version: number;
  loadDraft: (garageId: string, workshopId?: string) => void;
  replaceDraft: (draft: WorkshopDraft) => void;
  patchDraft: (updates: Partial<WorkshopDraft>) => void;
  clearDraft: () => void;
}

const getStorageKey = (garageId: string, workshopId?: string) => {
  return `workshop_draft_${garageId}_${workshopId || "new"}`;
};

const WorkshopDraftContext = createContext<WorkshopDraftContextType | undefined>(undefined);

export function WorkshopDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<WorkshopDraft | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [version, setVersion] = useState(0);
  const [currentStorageKey, setCurrentStorageKey] = useState<string | null>(null);

  // Synchronous persistence using useLayoutEffect
  useLayoutEffect(() => {
    if (currentStorageKey && draft) {
      sessionStorage.setItem(currentStorageKey, JSON.stringify({ draft, version }));
    }
  }, [draft, version, currentStorageKey]);

  const loadDraft = (garageId: string, workshopId?: string) => {
    const key = getStorageKey(garageId, workshopId);
    setCurrentStorageKey(key);
    setIsReady(false);
    
    // Load from sessionStorage synchronously
    try {
      const stored = sessionStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        setDraft(parsed.draft || parsed); // Support old format
        setVersion(parsed.version || 0);
      } else {
        setDraft(null);
        setVersion(0);
      }
    } catch {
      setDraft(null);
      setVersion(0);
    }
    
    setIsReady(true);
  };

  const replaceDraft = (newDraft: WorkshopDraft) => {
    setDraft(newDraft);
    setVersion((v) => v + 1);
  };

  const patchDraft = (updates: Partial<WorkshopDraft>) => {
    setDraft((prev) => (prev ? { ...prev, ...updates } : null));
    setVersion((v) => v + 1);
  };

  const clearDraft = () => {
    if (currentStorageKey) {
      sessionStorage.removeItem(currentStorageKey);
    }
    setDraft(null);
    setVersion(0);
    setCurrentStorageKey(null);
    setIsReady(false);
  };

  return (
    <WorkshopDraftContext.Provider
      value={{ 
        draft,
        isReady,
        version,
        loadDraft,
        replaceDraft,
        patchDraft,
        clearDraft,
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
