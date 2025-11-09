import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Equipment } from "@shared/schema";

export type EquipmentModelInfo = {
  model: string;
  make: string;
  count: number; // How many equipment units have this model
};

export function useEquipmentModels() {
  // Reuse existing equipment query
  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Extract unique equipment models with make information
  const models = useMemo(() => {
    if (!equipment) return [];

    const modelMap = new Map<string, EquipmentModelInfo>();

    equipment.forEach((eq) => {
      if (eq.model) {
        const existing = modelMap.get(eq.model);
        if (existing) {
          existing.count += 1;
        } else {
          modelMap.set(eq.model, {
            model: eq.model,
            make: eq.make || "Unknown",
            count: 1,
          });
        }
      }
    });

    // Sort by model name
    return Array.from(modelMap.values()).sort((a, b) => 
      a.model.localeCompare(b.model)
    );
  }, [equipment]);

  // Create lookup map: equipmentId -> model
  const equipmentIdToModel = useMemo(() => {
    if (!equipment) return new Map<string, string>();

    const map = new Map<string, string>();
    equipment.forEach((eq) => {
      if (eq.id && eq.model) {
        map.set(eq.id, eq.model);
      }
    });
    return map;
  }, [equipment]);

  // Get model from equipment ID
  const getModelByEquipmentId = (equipmentId: string): string | null => {
    return equipmentIdToModel.get(equipmentId) || null;
  };

  return {
    models,
    equipmentIdToModel,
    getModelByEquipmentId,
    isLoading,
  };
}
