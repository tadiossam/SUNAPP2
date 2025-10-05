import {
  equipment,
  spareParts,
  partCompatibility,
  type Equipment,
  type InsertEquipment,
  type SparePart,
  type InsertSparePart,
  type SparePartWithCompatibility,
  type InsertPartCompatibility,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql } from "drizzle-orm";

export interface IStorage {
  // Equipment operations
  getAllEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | undefined>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  searchEquipment(params: {
    searchTerm?: string;
    equipmentType?: string;
    make?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Equipment[]; total: number }>;

  // Spare parts operations
  getAllParts(): Promise<SparePartWithCompatibility[]>;
  getPartById(id: string): Promise<SparePartWithCompatibility | undefined>;
  getPartByPartNumber(partNumber: string): Promise<SparePartWithCompatibility | undefined>;
  createPart(data: InsertSparePart, compatibility?: InsertPartCompatibility[]): Promise<SparePart>;
  updatePart(id: string, data: Partial<InsertSparePart>): Promise<SparePart | undefined>;
  updatePartModel(id: string, model3dPath: string): Promise<SparePart | undefined>;
  updatePartImages(id: string, imageUrls: string[]): Promise<SparePart | undefined>;
  addPartImages(id: string, newImageUrls: string[]): Promise<SparePart | undefined>;
  updatePartMaintenance(id: string, data: {
    locationInstructions?: string;
    tutorialVideoUrl?: string;
    requiredTools?: string[];
    installTimeEstimates?: string;
  }): Promise<SparePart | undefined>;
  searchParts(params: {
    searchTerm?: string;
    category?: string;
    stockStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: SparePartWithCompatibility[]; total: number }>;

  // Compatibility operations
  addPartCompatibility(partId: string, make: string, model?: string): Promise<void>;
  getPartCompatibility(partId: string): Promise<{ makes: string[]; models: string[] }>;
}

export class DatabaseStorage implements IStorage {
  // Equipment operations
  async getAllEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment);
  }

  async getEquipmentById(id: string): Promise<Equipment | undefined> {
    const [result] = await db.select().from(equipment).where(eq(equipment.id, id));
    return result || undefined;
  }

  async createEquipment(data: InsertEquipment): Promise<Equipment> {
    const [result] = await db.insert(equipment).values(data).returning();
    return result;
  }

  async searchEquipment(params: {
    searchTerm?: string;
    equipmentType?: string;
    make?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: Equipment[]; total: number }> {
    const conditions = [];

    if (params.searchTerm) {
      const term = `%${params.searchTerm}%`;
      conditions.push(
        or(
          ilike(equipment.model, term),
          ilike(equipment.plateNo, term),
          ilike(equipment.machineSerial, term),
          ilike(equipment.assetNo, term),
          ilike(equipment.newAssetNo, term)
        )
      );
    }

    if (params.equipmentType) {
      conditions.push(eq(equipment.equipmentType, params.equipmentType));
    }

    if (params.make) {
      conditions.push(eq(equipment.make, params.make));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(equipment)
      .where(whereClause);

    const items = await db
      .select()
      .from(equipment)
      .where(whereClause)
      .limit(params.limit || 100)
      .offset(params.offset || 0);

    return {
      items,
      total: Number(countResult.count),
    };
  }

  // Helper to enrich parts with compatibility info
  private async enrichPartWithCompatibility(part: SparePart): Promise<SparePartWithCompatibility> {
    const compatibility = await db
      .select()
      .from(partCompatibility)
      .where(eq(partCompatibility.partId, part.id));

    const makes = [...new Set(compatibility.map((c) => c.make))];
    const models = [...new Set(compatibility.filter((c) => c.model).map((c) => c.model!))];

    return {
      ...part,
      compatibleMakes: makes,
      compatibleModels: models,
    };
  }

  // Spare parts operations
  async getAllParts(): Promise<SparePartWithCompatibility[]> {
    const parts = await db.select().from(spareParts);
    return await Promise.all(parts.map((p) => this.enrichPartWithCompatibility(p)));
  }

  async getPartById(id: string): Promise<SparePartWithCompatibility | undefined> {
    const [result] = await db.select().from(spareParts).where(eq(spareParts.id, id));
    if (!result) return undefined;
    return await this.enrichPartWithCompatibility(result);
  }

  async getPartByPartNumber(partNumber: string): Promise<SparePartWithCompatibility | undefined> {
    const [result] = await db
      .select()
      .from(spareParts)
      .where(eq(spareParts.partNumber, partNumber));
    if (!result) return undefined;
    return await this.enrichPartWithCompatibility(result);
  }

  async createPart(data: InsertSparePart, compatibility?: InsertPartCompatibility[]): Promise<SparePart> {
    const [result] = await db.insert(spareParts).values(data).returning();

    if (compatibility && compatibility.length > 0) {
      await db.insert(partCompatibility).values(compatibility);
    }

    return result;
  }

  async updatePart(id: string, data: Partial<InsertSparePart>): Promise<SparePart | undefined> {
    const [result] = await db
      .update(spareParts)
      .set(data)
      .where(eq(spareParts.id, id))
      .returning();
    return result || undefined;
  }

  async updatePartModel(id: string, model3dPath: string): Promise<SparePart | undefined> {
    const [result] = await db
      .update(spareParts)
      .set({ model3dPath })
      .where(eq(spareParts.id, id))
      .returning();
    return result || undefined;
  }

  async updatePartImages(id: string, imageUrls: string[]): Promise<SparePart | undefined> {
    const [result] = await db
      .update(spareParts)
      .set({ imageUrls })
      .where(eq(spareParts.id, id))
      .returning();
    return result || undefined;
  }

  async addPartImages(id: string, newImageUrls: string[]): Promise<SparePart | undefined> {
    const part = await this.getPartById(id);
    if (!part) return undefined;
    
    const existingUrls = part.imageUrls || [];
    const updatedUrls = [...existingUrls, ...newImageUrls];
    
    const [result] = await db
      .update(spareParts)
      .set({ imageUrls: updatedUrls })
      .where(eq(spareParts.id, id))
      .returning();
    return result || undefined;
  }

  async updatePartMaintenance(id: string, data: {
    locationInstructions?: string;
    tutorialVideoUrl?: string;
    requiredTools?: string[];
    installTimeEstimates?: string;
  }): Promise<SparePart | undefined> {
    const [result] = await db
      .update(spareParts)
      .set(data)
      .where(eq(spareParts.id, id))
      .returning();
    return result || undefined;
  }

  async searchParts(params: {
    searchTerm?: string;
    category?: string;
    stockStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ items: SparePartWithCompatibility[]; total: number }> {
    const conditions = [];

    if (params.searchTerm) {
      const term = `%${params.searchTerm}%`;
      conditions.push(
        or(
          ilike(spareParts.partNumber, term),
          ilike(spareParts.partName, term),
          ilike(spareParts.description, term)
        )
      );
    }

    if (params.category) {
      conditions.push(eq(spareParts.category, params.category));
    }

    if (params.stockStatus) {
      conditions.push(eq(spareParts.stockStatus, params.stockStatus));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(spareParts)
      .where(whereClause);

    const items = await db
      .select()
      .from(spareParts)
      .where(whereClause)
      .limit(params.limit || 100)
      .offset(params.offset || 0);

    const enrichedItems = await Promise.all(items.map((p) => this.enrichPartWithCompatibility(p)));

    return {
      items: enrichedItems,
      total: Number(countResult.count),
    };
  }

  // Compatibility operations
  async addPartCompatibility(partId: string, make: string, model?: string): Promise<void> {
    await db.insert(partCompatibility).values({ partId, make, model });
  }

  async getPartCompatibility(partId: string): Promise<{ makes: string[]; models: string[] }> {
    const compatibility = await db
      .select()
      .from(partCompatibility)
      .where(eq(partCompatibility.partId, partId));

    const makes = [...new Set(compatibility.map((c) => c.make))];
    const models = [...new Set(compatibility.filter((c) => c.model).map((c) => c.model!))];

    return { makes, models };
  }
}

export const storage = new DatabaseStorage();
