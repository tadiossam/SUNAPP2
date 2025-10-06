import {
  equipment,
  spareParts,
  partCompatibility,
  mechanics,
  maintenanceRecords,
  partsUsageHistory,
  operatingBehaviorReports,
  users,
  type Equipment,
  type InsertEquipment,
  type SparePart,
  type InsertSparePart,
  type SparePartWithCompatibility,
  type InsertPartCompatibility,
  type Mechanic,
  type InsertMechanic,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type MaintenanceRecordWithDetails,
  type PartsUsageHistory,
  type InsertPartsUsageHistory,
  type OperatingBehaviorReport,
  type InsertOperatingBehaviorReport,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql, desc } from "drizzle-orm";

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

  // Maintenance operations
  // Mechanics
  getAllMechanics(): Promise<Mechanic[]>;
  getMechanicById(id: string): Promise<Mechanic | undefined>;
  createMechanic(data: InsertMechanic): Promise<Mechanic>;
  updateMechanic(id: string, data: Partial<InsertMechanic>): Promise<Mechanic | undefined>;

  // Maintenance Records
  getMaintenanceRecordsByEquipment(equipmentId: string): Promise<MaintenanceRecordWithDetails[]>;
  getMaintenanceRecordById(id: string): Promise<MaintenanceRecordWithDetails | undefined>;
  createMaintenanceRecord(data: InsertMaintenanceRecord): Promise<MaintenanceRecord>;
  updateMaintenanceRecord(id: string, data: Partial<InsertMaintenanceRecord>): Promise<MaintenanceRecord | undefined>;

  // Parts Usage History
  addPartsToMaintenance(maintenanceId: string, parts: InsertPartsUsageHistory[]): Promise<void>;
  getPartsUsageByEquipment(equipmentId: string): Promise<(PartsUsageHistory & { part?: SparePart })[]>;

  // Operating Behavior Reports
  getOperatingReportsByEquipment(equipmentId: string): Promise<OperatingBehaviorReport[]>;
  createOperatingReport(data: InsertOperatingBehaviorReport): Promise<OperatingBehaviorReport>;
  
  // User operations
  updateUserLanguage(userId: string, language: string): Promise<void>;
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

    const makes = Array.from(new Set(compatibility.map((c) => c.make)));
    const models = Array.from(new Set(compatibility.filter((c) => c.model).map((c) => c.model!)));

    return { makes, models };
  }

  // Maintenance operations implementation
  // Mechanics
  async getAllMechanics(): Promise<Mechanic[]> {
    return await db.select().from(mechanics).where(eq(mechanics.isActive, true));
  }

  async getMechanicById(id: string): Promise<Mechanic | undefined> {
    const [result] = await db.select().from(mechanics).where(eq(mechanics.id, id));
    return result || undefined;
  }

  async createMechanic(data: InsertMechanic): Promise<Mechanic> {
    const [result] = await db.insert(mechanics).values(data).returning();
    return result;
  }

  async updateMechanic(id: string, data: Partial<InsertMechanic>): Promise<Mechanic | undefined> {
    const [result] = await db
      .update(mechanics)
      .set(data)
      .where(eq(mechanics.id, id))
      .returning();
    return result || undefined;
  }

  // Maintenance Records
  async getMaintenanceRecordsByEquipment(equipmentId: string): Promise<MaintenanceRecordWithDetails[]> {
    const records = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.equipmentId, equipmentId))
      .orderBy(desc(maintenanceRecords.maintenanceDate));

    // Enrich with mechanic and parts used
    const enriched = await Promise.all(
      records.map(async (record) => {
        const mechanic = record.mechanicId
          ? await this.getMechanicById(record.mechanicId)
          : undefined;

        const partsUsed = await db
          .select()
          .from(partsUsageHistory)
          .where(eq(partsUsageHistory.maintenanceRecordId, record.id));

        const enrichedParts = await Promise.all(
          partsUsed.map(async (usage) => {
            const [part] = await db
              .select()
              .from(spareParts)
              .where(eq(spareParts.id, usage.partId));
            return { ...usage, part };
          })
        );

        return {
          ...record,
          mechanic,
          partsUsed: enrichedParts,
        };
      })
    );

    return enriched;
  }

  async getMaintenanceRecordById(id: string): Promise<MaintenanceRecordWithDetails | undefined> {
    const [record] = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id));

    if (!record) return undefined;

    const mechanic = record.mechanicId
      ? await this.getMechanicById(record.mechanicId)
      : undefined;

    const partsUsed = await db
      .select()
      .from(partsUsageHistory)
      .where(eq(partsUsageHistory.maintenanceRecordId, record.id));

    const enrichedParts = await Promise.all(
      partsUsed.map(async (usage) => {
        const [part] = await db
          .select()
          .from(spareParts)
          .where(eq(spareParts.id, usage.partId));
        return { ...usage, part };
      })
    );

    return {
      ...record,
      mechanic,
      partsUsed: enrichedParts,
    };
  }

  async createMaintenanceRecord(data: InsertMaintenanceRecord): Promise<MaintenanceRecord> {
    const [result] = await db.insert(maintenanceRecords).values(data).returning();
    return result;
  }

  async updateMaintenanceRecord(
    id: string,
    data: Partial<InsertMaintenanceRecord>
  ): Promise<MaintenanceRecord | undefined> {
    const [result] = await db
      .update(maintenanceRecords)
      .set(data)
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return result || undefined;
  }

  // Parts Usage History
  async addPartsToMaintenance(maintenanceId: string, parts: InsertPartsUsageHistory[]): Promise<void> {
    if (parts.length > 0) {
      await db.insert(partsUsageHistory).values(parts);
    }
  }

  async getPartsUsageByEquipment(equipmentId: string): Promise<(PartsUsageHistory & { part?: SparePart })[]> {
    const records = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.equipmentId, equipmentId));

    const allParts: (PartsUsageHistory & { part?: SparePart })[] = [];

    for (const record of records) {
      const partsUsed = await db
        .select()
        .from(partsUsageHistory)
        .where(eq(partsUsageHistory.maintenanceRecordId, record.id));

      for (const usage of partsUsed) {
        const [part] = await db
          .select()
          .from(spareParts)
          .where(eq(spareParts.id, usage.partId));
        allParts.push({ ...usage, part });
      }
    }

    return allParts;
  }

  // Operating Behavior Reports
  async getOperatingReportsByEquipment(equipmentId: string): Promise<OperatingBehaviorReport[]> {
    return await db
      .select()
      .from(operatingBehaviorReports)
      .where(eq(operatingBehaviorReports.equipmentId, equipmentId))
      .orderBy(desc(operatingBehaviorReports.reportDate));
  }

  async createOperatingReport(data: InsertOperatingBehaviorReport): Promise<OperatingBehaviorReport> {
    const [result] = await db.insert(operatingBehaviorReports).values(data).returning();
    return result;
  }

  // User operations
  async updateUserLanguage(userId: string, language: string): Promise<void> {
    await db
      .update(users)
      .set({ language })
      .where(eq(users.id, userId));
  }
}

export const storage = new DatabaseStorage();
