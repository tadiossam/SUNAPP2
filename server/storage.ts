import {
  equipmentCategories,
  equipment,
  spareParts,
  partCompatibility,
  mechanics,
  maintenanceRecords,
  partsUsageHistory,
  operatingBehaviorReports,
  users,
  garages,
  workshops,
  workshopMembers,
  employees,
  workOrders,
  workOrderRequiredParts,
  partsStorageLocations,
  equipmentLocations,
  equipmentReceptions,
  receptionChecklists,
  receptionInspectionItems,
  damageReports,
  repairEstimates,
  partsRequests,
  approvals,
  attendanceDeviceSettings,
  deviceImportLogs,
  equipmentInspections,
  inspectionChecklistItems,
  type EquipmentCategory,
  type InsertEquipmentCategory,
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
  type Garage,
  type InsertGarage,
  type GarageWithDetails,
  type Workshop,
  type InsertWorkshop,
  type WorkshopWithDetails,
  type WorkshopMember,
  type InsertWorkshopMember,
  type Employee,
  type InsertEmployee,
  type WorkOrder,
  type InsertWorkOrder,
  type WorkOrderWithDetails,
  type WorkOrderRequiredPart,
  type InsertWorkOrderRequiredPart,
  type PartsStorageLocation,
  type InsertPartsStorageLocation,
  type PartsStorageLocationWithDetails,
  type EquipmentLocation,
  type InsertEquipmentLocation,
  type EquipmentReception,
  type InsertEquipmentReception,
  type EquipmentReceptionWithDetails,
  type ReceptionChecklist,
  type InsertReceptionChecklist,
  type ReceptionInspectionItem,
  type InsertReceptionInspectionItem,
  type DamageReport,
  type InsertDamageReport,
  type RepairEstimate,
  type InsertRepairEstimate,
  type PartsRequest,
  type InsertPartsRequest,
  type PartsRequestWithDetails,
  type Approval,
  type InsertApproval,
  type ApprovalWithDetails,
  type EquipmentInspection,
  type InsertEquipmentInspection,
  type InspectionChecklistItem,
  type InsertInspectionChecklistItem,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql, desc, inArray } from "drizzle-orm";

export interface IStorage {
  // Equipment Category operations
  getAllEquipmentCategories(): Promise<EquipmentCategory[]>;
  getEquipmentCategoryById(id: string): Promise<EquipmentCategory | undefined>;
  getEquipmentCategoryByName(name: string): Promise<EquipmentCategory | undefined>;
  createEquipmentCategory(data: InsertEquipmentCategory): Promise<EquipmentCategory>;
  updateEquipmentCategory(id: string, data: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory | undefined>;
  deleteEquipmentCategory(id: string): Promise<boolean>;

  // Equipment operations
  getAllEquipment(): Promise<Equipment[]>;
  getEquipmentById(id: string): Promise<Equipment | undefined>;
  createEquipment(data: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: string, data: InsertEquipment): Promise<Equipment | undefined>;
  deleteEquipment(id: string): Promise<boolean>;
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

  // Garage Management Operations
  // Garages
  getAllGarages(): Promise<Garage[]>;
  getGarageById(id: string): Promise<GarageWithDetails | undefined>;
  createGarage(data: InsertGarage): Promise<Garage>;
  updateGarage(id: string, data: Partial<InsertGarage>): Promise<Garage>;
  deleteGarage(id: string): Promise<void>;

  // Repair Bays
  getWorkshopsByGarage(garageId: string): Promise<WorkshopWithDetails[]>;
  createWorkshop(data: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop>;
  deleteWorkshop(id: string): Promise<void>;
  addWorkshopMember(data: InsertWorkshopMember): Promise<WorkshopMember>;
  removeWorkshopMember(workshopId: string, employeeId: string): Promise<void>;
  getWorkshopMembers(workshopId: string): Promise<Employee[]>;

  // Employees
  getAllEmployees(role?: string, garageId?: string): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee | undefined>;
  createEmployee(data: InsertEmployee): Promise<Employee>;
  updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee>;
  updateEmployeePhoto(id: string, photoUrl: string): Promise<Employee | undefined>;
  deleteEmployee(id: string): Promise<void>;

  // Work Orders
  getAllWorkOrders(filters?: { status?: string; assignedToId?: string; garageId?: string; workshopId?: string }): Promise<WorkOrderWithDetails[]>;
  getWorkOrderById(id: string): Promise<WorkOrderWithDetails | undefined>;
  getWorkOrdersByPrefix(prefix: string): Promise<WorkOrder[]>;
  createWorkOrder(data: InsertWorkOrder): Promise<WorkOrder>;
  updateWorkOrder(id: string, data: Partial<InsertWorkOrder>): Promise<WorkOrder>;
  deleteWorkOrder(id: string): Promise<void>;
  
  // Work Order Required Parts
  getWorkOrderRequiredParts(workOrderId: string): Promise<WorkOrderRequiredPart[]>;
  replaceWorkOrderRequiredParts(workOrderId: string, parts: InsertWorkOrderRequiredPart[]): Promise<void>;

  // Standard Operating Procedures
  getAllSOPs(filters?: { category?: string; targetRole?: string; language?: string }): Promise<StandardOperatingProcedure[]>;
  getSOPById(id: string): Promise<StandardOperatingProcedure | undefined>;
  createSOP(data: InsertStandardOperatingProcedure): Promise<StandardOperatingProcedure>;
  updateSOP(id: string, data: Partial<InsertStandardOperatingProcedure>): Promise<StandardOperatingProcedure>;

  // Parts Storage Locations
  getPartStorageLocations(partId: string): Promise<PartsStorageLocationWithDetails[]>;
  getGaragePartsInventory(garageId: string): Promise<PartsStorageLocationWithDetails[]>;
  createPartsStorageLocation(data: InsertPartsStorageLocation): Promise<PartsStorageLocation>;
  updatePartsStorageLocation(id: string, data: Partial<InsertPartsStorageLocation>): Promise<PartsStorageLocation>;

  // Equipment Location Tracking
  getEquipmentLocationHistory(equipmentId: string): Promise<EquipmentLocation[]>;
  getEquipmentCurrentLocation(equipmentId: string): Promise<EquipmentLocation | undefined>;
  createEquipmentLocation(data: InsertEquipmentLocation): Promise<EquipmentLocation>;
  updateEquipmentLocation(id: string, data: Partial<InsertEquipmentLocation>): Promise<EquipmentLocation>;

  // Equipment Reception/Check-in Operations
  getAllReceptions(filters?: { status?: string; garageId?: string }): Promise<EquipmentReceptionWithDetails[]>;
  getReceptionById(id: string): Promise<EquipmentReceptionWithDetails | undefined>;
  getReceptionsByEquipment(equipmentId: string): Promise<EquipmentReceptionWithDetails[]>;
  getReceptionsByPrefix(prefix: string): Promise<EquipmentReception[]>;
  createReception(data: InsertEquipmentReception): Promise<EquipmentReception>;
  updateReception(id: string, data: Partial<InsertEquipmentReception>): Promise<EquipmentReception>;
  
  // Reception Checklists (Templates)
  getChecklistTemplates(filters?: { equipmentType?: string; role?: string }): Promise<ReceptionChecklist[]>;
  createChecklistTemplate(data: InsertReceptionChecklist): Promise<ReceptionChecklist>;
  
  // Inspection Items
  getInspectionItemsByReception(receptionId: string): Promise<ReceptionInspectionItem[]>;
  createInspectionItem(data: InsertReceptionInspectionItem): Promise<ReceptionInspectionItem>;
  createBulkInspectionItems(items: InsertReceptionInspectionItem[]): Promise<ReceptionInspectionItem[]>;
  
  // Equipment Inspections
  getInspectionById(id: string): Promise<EquipmentInspection | undefined>;
  getInspectionByReceptionId(receptionId: string): Promise<EquipmentInspection | undefined>;
  getInspectionsByInspector(inspectorId: string): Promise<EquipmentInspection[]>;
  getInspectionsByPrefix(prefix: string): Promise<EquipmentInspection[]>;
  getAllInspections(): Promise<any[]>;
  getAllCompletedInspections(): Promise<any[]>;
  getCanceledInspections(): Promise<any[]>;
  createInspection(data: InsertEquipmentInspection): Promise<EquipmentInspection>;
  updateInspection(id: string, data: Partial<InsertEquipmentInspection>): Promise<EquipmentInspection>;
  cancelReception(receptionId: string): Promise<void>;
  
  // Inspection Checklist Items
  getChecklistItemsByInspection(inspectionId: string): Promise<InspectionChecklistItem[]>;
  createChecklistItem(data: InsertInspectionChecklistItem): Promise<InspectionChecklistItem>;
  createBulkChecklistItems(items: InsertInspectionChecklistItem[]): Promise<InspectionChecklistItem[]>;
  updateChecklistItem(id: string, data: Partial<InsertInspectionChecklistItem>): Promise<InspectionChecklistItem>;
  deleteChecklistItemsByInspection(inspectionId: string): Promise<void>;
  upsertChecklistItems(inspectionId: string, items: InsertInspectionChecklistItem[]): Promise<InspectionChecklistItem[]>;
  
  // Damage Reports
  getDamageReportsByReception(receptionId: string): Promise<DamageReport[]>;
  createDamageReport(data: InsertDamageReport): Promise<DamageReport>;
  
  // Repair Estimates
  getRepairEstimateByReception(receptionId: string): Promise<RepairEstimate | undefined>;
  createRepairEstimate(data: InsertRepairEstimate): Promise<RepairEstimate>;
  updateRepairEstimate(id: string, data: Partial<InsertRepairEstimate>): Promise<RepairEstimate>;

  // Approval System
  // Parts Requests
  getAllPartsRequests(filters?: { status?: string; approvalStatus?: string; requestedById?: string }): Promise<PartsRequestWithDetails[]>;
  getPartsRequestById(id: string): Promise<PartsRequestWithDetails | undefined>;
  getPartsRequestsByWorkOrder(workOrderId: string): Promise<PartsRequest[]>;
  createPartsRequest(data: InsertPartsRequest): Promise<PartsRequest>;
  updatePartsRequest(id: string, data: Partial<InsertPartsRequest>): Promise<PartsRequest>;
  
  // Approvals
  getAllApprovals(filters?: { status?: string; assignedToId?: string; approvalType?: string }): Promise<ApprovalWithDetails[]>;
  getApprovalById(id: string): Promise<ApprovalWithDetails | undefined>;
  getPendingApprovalsByEmployee(employeeId: string): Promise<ApprovalWithDetails[]>;
  createApproval(data: InsertApproval): Promise<Approval>;
  updateApproval(id: string, data: Partial<InsertApproval>): Promise<Approval>;
  
  // Approval Actions
  approveWorkOrder(workOrderId: string, approvedById: string, notes?: string): Promise<void>;
  rejectWorkOrder(workOrderId: string, approvedById: string, notes?: string): Promise<void>;
  approveWorkOrderCompletion(workOrderId: string, approvedById: string, notes?: string): Promise<void>;
  approvePartsRequest(partsRequestId: string, approvedById: string, notes?: string): Promise<void>;
  rejectPartsRequest(partsRequestId: string, approvedById: string, notes?: string): Promise<void>;

  // Attendance Device Operations
  getAllAttendanceDevices(): Promise<any[]>;
  getAttendanceDeviceSettings(): Promise<any | undefined>;
  getAttendanceDeviceById(id: string): Promise<any | undefined>;
  createAttendanceDevice(data: any): Promise<any>;
  saveAttendanceDeviceSettings(data: any): Promise<any>;
  updateAttendanceDeviceSettings(id: string, data: Partial<any>): Promise<any>;
  setActiveDevice(id: string): Promise<any>;
  deleteAttendanceDevice(id: string): Promise<void>;
  getEmployeeByDeviceUserId(deviceUserId: string): Promise<Employee | undefined>;
  getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined>;
  getEmployeeByName(fullName: string): Promise<Employee | undefined>;
  createDeviceImportLog(data: any): Promise<any>;
  getDeviceImportLogs(): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  // Equipment Category operations
  async getAllEquipmentCategories(): Promise<EquipmentCategory[]> {
    return await db.select().from(equipmentCategories);
  }

  async getEquipmentCategoryById(id: string): Promise<EquipmentCategory | undefined> {
    const [result] = await db.select().from(equipmentCategories).where(eq(equipmentCategories.id, id));
    return result || undefined;
  }

  async getEquipmentCategoryByName(name: string): Promise<EquipmentCategory | undefined> {
    const [result] = await db.select().from(equipmentCategories).where(eq(equipmentCategories.name, name));
    return result || undefined;
  }

  async createEquipmentCategory(data: InsertEquipmentCategory): Promise<EquipmentCategory> {
    const [result] = await db.insert(equipmentCategories).values(data).returning();
    return result;
  }

  async updateEquipmentCategory(id: string, data: Partial<InsertEquipmentCategory>): Promise<EquipmentCategory | undefined> {
    const [result] = await db.update(equipmentCategories).set(data).where(eq(equipmentCategories.id, id)).returning();
    return result || undefined;
  }

  async deleteEquipmentCategory(id: string): Promise<boolean> {
    const result = await db.delete(equipmentCategories).where(eq(equipmentCategories.id, id)).returning();
    return result.length > 0;
  }

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

  async updateEquipment(id: string, data: InsertEquipment): Promise<Equipment | undefined> {
    const [result] = await db.update(equipment).set(data).where(eq(equipment.id, id)).returning();
    return result || undefined;
  }

  async deleteEquipment(id: string): Promise<boolean> {
    const result = await db.delete(equipment).where(eq(equipment.id, id)).returning();
    return result.length > 0;
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
      .limit(params.limit || 10000)  // Increased limit to handle large fleets
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

    const makes = Array.from(new Set(compatibility.map((c) => c.make)));
    const models = Array.from(new Set(compatibility.filter((c) => c.model).map((c) => c.model!)));

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

  // ============================================
  // GARAGE MANAGEMENT IMPLEMENTATIONS
  // ============================================

  // Garages
  async getAllGarages(): Promise<Garage[]> {
    return await db.select().from(garages).orderBy(garages.name);
  }

  async getGarageById(id: string): Promise<GarageWithDetails | undefined> {
    const [garage] = await db.select().from(garages).where(eq(garages.id, id));
    if (!garage) return undefined;

    // Fetch workshops with full details (foreman and members)
    const workshopsList = await this.getWorkshopsByGarage(id);
    const employeesList = await db.select().from(employees).where(eq(employees.garageId, id));
    const orders = await db.select().from(workOrders).where(eq(workOrders.garageId, id));

    return {
      ...garage,
      workshops: workshopsList,
      employees: employeesList,
      workOrders: orders,
    };
  }

  async createGarage(data: InsertGarage): Promise<Garage> {
    const [result] = await db.insert(garages).values(data).returning();
    return result;
  }

  async updateGarage(id: string, data: Partial<InsertGarage>): Promise<Garage> {
    const [result] = await db.update(garages).set(data).where(eq(garages.id, id)).returning();
    return result;
  }

  async deleteGarage(id: string): Promise<void> {
    // Check if garage exists
    const [garage] = await db.select().from(garages).where(eq(garages.id, id));
    if (!garage) {
      throw new Error("Garage not found");
    }

    // Check for dependencies that don't have cascade delete
    const employeesList = await db.select().from(employees).where(eq(employees.garageId, id));
    const workOrdersList = await db.select().from(workOrders).where(eq(workOrders.garageId, id));
    const storageLocations = await db.select().from(partsStorageLocations).where(eq(partsStorageLocations.garageId, id));
    const equipmentLocationsList = await db.select().from(equipmentLocations).where(eq(equipmentLocations.garageId, id));

    if (employeesList.length > 0) {
      throw new Error("Cannot delete garage: has assigned employees");
    }
    if (workOrdersList.length > 0) {
      throw new Error("Cannot delete garage: has active work orders");
    }
    if (storageLocations.length > 0) {
      throw new Error("Cannot delete garage: has parts storage locations");
    }
    if (equipmentLocationsList.length > 0) {
      throw new Error("Cannot delete garage: has equipment locations");
    }

    // Delete the garage (repair bays will be cascade deleted)
    await db.delete(garages).where(eq(garages.id, id));
  }

  // Workshops
  async getWorkshopsByGarage(garageId: string): Promise<WorkshopWithDetails[]> {
    const workshopsList = await db.select().from(workshops).where(eq(workshops.garageId, garageId));
    
    const workshopsWithDetails = await Promise.all(
      workshopsList.map(async (workshop) => {
        const [garage] = await db.select().from(garages).where(eq(garages.id, workshop.garageId));
        let foreman = undefined;
        if (workshop.foremanId) {
          [foreman] = await db.select().from(employees).where(eq(employees.id, workshop.foremanId));
        }
        
        // Get workshop members
        const memberRecords = await db.select().from(workshopMembers).where(eq(workshopMembers.workshopId, workshop.id));
        const membersList = await Promise.all(
          memberRecords.map(async (member) => {
            const [employee] = await db.select().from(employees).where(eq(employees.id, member.employeeId));
            return employee;
          })
        );
        
        return { ...workshop, garage, foreman, members: memberRecords, membersList };
      })
    );
    
    return workshopsWithDetails;
  }

  async createWorkshop(data: InsertWorkshop): Promise<Workshop> {
    const [result] = await db.insert(workshops).values(data).returning();
    return result;
  }

  async updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop> {
    const [result] = await db.update(workshops).set(data).where(eq(workshops.id, id)).returning();
    return result;
  }

  async deleteWorkshop(id: string): Promise<void> {
    // Check if workshop exists
    const [workshop] = await db.select().from(workshops).where(eq(workshops.id, id));
    if (!workshop) {
      throw new Error("Workshop not found");
    }

    // Check for dependencies
    const workOrdersList = await db.select().from(workOrders).where(eq(workOrders.workshopId, id));
    
    if (workOrdersList.length > 0) {
      throw new Error("Cannot delete workshop: has active work orders");
    }

    // Delete workshop members first (though CASCADE should handle this)
    await db.delete(workshopMembers).where(eq(workshopMembers.workshopId, id));
    
    // Delete the workshop
    await db.delete(workshops).where(eq(workshops.id, id));
  }

  async addWorkshopMember(data: InsertWorkshopMember): Promise<WorkshopMember> {
    const [result] = await db.insert(workshopMembers).values(data).returning();
    return result;
  }

  async removeWorkshopMember(workshopId: string, employeeId: string): Promise<void> {
    await db.delete(workshopMembers)
      .where(and(
        eq(workshopMembers.workshopId, workshopId),
        eq(workshopMembers.employeeId, employeeId)
      ));
  }

  async getWorkshopMembers(workshopId: string): Promise<Employee[]> {
    const memberRecords = await db.select().from(workshopMembers).where(eq(workshopMembers.workshopId, workshopId));
    const membersList = await Promise.all(
      memberRecords.map(async (member) => {
        const [employee] = await db.select().from(employees).where(eq(employees.id, member.employeeId));
        return employee;
      })
    );
    return membersList.filter(Boolean) as Employee[];
  }

  // Employees
  async getAllEmployees(role?: string, garageId?: string): Promise<Employee[]> {
    const conditions = [];
    
    if (role) {
      conditions.push(eq(employees.role, role));
    }
    if (garageId) {
      conditions.push(eq(employees.garageId, garageId));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    return await db.select().from(employees).where(whereClause).orderBy(employees.fullName);
  }

  async getEmployeeById(id: string): Promise<Employee | undefined> {
    const [result] = await db.select().from(employees).where(eq(employees.id, id));
    return result || undefined;
  }

  async createEmployee(data: InsertEmployee): Promise<Employee> {
    const [result] = await db.insert(employees).values(data).returning();
    return result;
  }

  async updateEmployee(id: string, data: Partial<InsertEmployee>): Promise<Employee> {
    const [result] = await db.update(employees).set(data).where(eq(employees.id, id)).returning();
    return result;
  }

  async updateEmployeePhoto(id: string, photoUrl: string): Promise<Employee | undefined> {
    const [result] = await db.update(employees).set({ profilePicture: photoUrl }).where(eq(employees.id, id)).returning();
    return result || undefined;
  }

  async deleteEmployee(id: string): Promise<void> {
    await db.delete(employees).where(eq(employees.id, id));
  }

  // Work Orders
  async getAllWorkOrders(filters?: { status?: string; assignedToId?: string; garageId?: string; workshopId?: string }): Promise<WorkOrderWithDetails[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(workOrders.status, filters.status));
    }
    if (filters?.assignedToId) {
      // Filter by checking if assignedToId is in the assignedToIds array
      conditions.push(sql`${filters.assignedToId} = ANY(${workOrders.assignedToIds})`);
    }
    if (filters?.garageId) {
      conditions.push(eq(workOrders.garageId, filters.garageId));
    }
    if (filters?.workshopId) {
      conditions.push(eq(workOrders.workshopId, filters.workshopId));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    const orders = await db.select().from(workOrders).where(whereClause).orderBy(desc(workOrders.createdAt));
    
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        const [equipmentData] = await db.select().from(equipment).where(eq(equipment.id, order.equipmentId));
        let garage = undefined;
        if (order.garageId) {
          [garage] = await db.select().from(garages).where(eq(garages.id, order.garageId));
        }
        let workshop = undefined;
        if (order.workshopId) {
          [workshop] = await db.select().from(workshops).where(eq(workshops.id, order.workshopId));
        }
        
        // Get assigned employees from assignedToIds array
        let assignedToList: Employee[] = [];
        if (order.assignedToIds && order.assignedToIds.length > 0) {
          assignedToList = await db.select().from(employees).where(inArray(employees.id, order.assignedToIds));
        }
        
        let createdBy = undefined;
        if (order.createdById) {
          [createdBy] = await db.select().from(users).where(eq(users.id, order.createdById));
        }
        
        // Get required parts
        const requiredParts = await this.getWorkOrderRequiredParts(order.id);
        
        return {
          ...order,
          equipment: equipmentData,
          garage,
          workshop,
          assignedToList,
          createdBy,
          requiredParts,
        };
      })
    );
    
    return ordersWithDetails;
  }

  async getWorkOrderById(id: string): Promise<WorkOrderWithDetails | undefined> {
    const [order] = await db.select().from(workOrders).where(eq(workOrders.id, id));
    if (!order) return undefined;
    
    const [equipmentData] = await db.select().from(equipment).where(eq(equipment.id, order.equipmentId));
    let garage = undefined;
    if (order.garageId) {
      [garage] = await db.select().from(garages).where(eq(garages.id, order.garageId));
    }
    let workshop = undefined;
    if (order.workshopId) {
      [workshop] = await db.select().from(workshops).where(eq(workshops.id, order.workshopId));
    }
    
    // Get assigned employees from assignedToIds array
    let assignedToList: Employee[] = [];
    if (order.assignedToIds && order.assignedToIds.length > 0) {
      assignedToList = await db.select().from(employees).where(inArray(employees.id, order.assignedToIds));
    }
    
    let createdBy = undefined;
    if (order.createdById) {
      [createdBy] = await db.select().from(users).where(eq(users.id, order.createdById));
    }
    
    // Get required parts
    const requiredParts = await this.getWorkOrderRequiredParts(order.id);
    
    return {
      ...order,
      equipment: equipmentData,
      garage,
      workshop,
      assignedToList,
      createdBy,
      requiredParts,
    };
  }

  async getWorkOrdersByPrefix(prefix: string): Promise<WorkOrder[]> {
    const pattern = `${prefix}%`;
    return await db
      .select()
      .from(workOrders)
      .where(sql`${workOrders.workOrderNumber} LIKE ${pattern}`)
      .orderBy(desc(workOrders.workOrderNumber));
  }

  async createWorkOrder(data: InsertWorkOrder): Promise<WorkOrder> {
    // Auto-generate work order number if not provided
    let workOrderNumber = data.workOrderNumber;
    
    if (!workOrderNumber) {
      const currentYear = new Date().getFullYear();
      const prefix = `WO-${currentYear}-`;
      
      // Find the highest existing number for this year
      const existingOrders = await this.getWorkOrdersByPrefix(prefix);
      
      let nextNumber = 1;
      if (existingOrders.length > 0) {
        const lastNumber = existingOrders[0].workOrderNumber.split('-')[2];
        nextNumber = parseInt(lastNumber) + 1;
      }
      
      workOrderNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    }
    
    const [result] = await db.insert(workOrders).values({
      ...data,
      workOrderNumber,
    }).returning();
    return result;
  }

  async updateWorkOrder(id: string, data: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [result] = await db.update(workOrders).set(data).where(eq(workOrders.id, id)).returning();
    return result;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }

  async getWorkOrderRequiredParts(workOrderId: string): Promise<WorkOrderRequiredPart[]> {
    return await db.select().from(workOrderRequiredParts).where(eq(workOrderRequiredParts.workOrderId, workOrderId));
  }

  async replaceWorkOrderRequiredParts(workOrderId: string, parts: InsertWorkOrderRequiredPart[]): Promise<void> {
    // Delete existing parts
    await db.delete(workOrderRequiredParts).where(eq(workOrderRequiredParts.workOrderId, workOrderId));
    
    // Insert new parts if any
    if (parts.length > 0) {
      const partsWithWorkOrderId = parts.map(part => ({
        ...part,
        workOrderId,
      }));
      await db.insert(workOrderRequiredParts).values(partsWithWorkOrderId);
    }
  }

  // Standard Operating Procedures
  async getAllSOPs(filters?: { category?: string; targetRole?: string; language?: string }): Promise<StandardOperatingProcedure[]> {
    const conditions = [eq(standardOperatingProcedures.isActive, true)];
    
    if (filters?.category) {
      conditions.push(eq(standardOperatingProcedures.category, filters.category));
    }
    if (filters?.targetRole) {
      conditions.push(eq(standardOperatingProcedures.targetRole, filters.targetRole));
    }
    if (filters?.language) {
      conditions.push(eq(standardOperatingProcedures.language, filters.language));
    }
    
    const whereClause = and(...conditions);
    
    return await db.select().from(standardOperatingProcedures).where(whereClause).orderBy(standardOperatingProcedures.title);
  }

  async getSOPById(id: string): Promise<StandardOperatingProcedure | undefined> {
    const [result] = await db.select().from(standardOperatingProcedures).where(eq(standardOperatingProcedures.id, id));
    return result || undefined;
  }

  async createSOP(data: InsertStandardOperatingProcedure): Promise<StandardOperatingProcedure> {
    const [result] = await db.insert(standardOperatingProcedures).values(data).returning();
    return result;
  }

  async updateSOP(id: string, data: Partial<InsertStandardOperatingProcedure>): Promise<StandardOperatingProcedure> {
    const [result] = await db.update(standardOperatingProcedures).set({
      ...data,
      updatedAt: new Date(),
    }).where(eq(standardOperatingProcedures.id, id)).returning();
    return result;
  }

  // Parts Storage Locations
  async getPartStorageLocations(partId: string): Promise<PartsStorageLocationWithDetails[]> {
    const locations = await db.select().from(partsStorageLocations).where(eq(partsStorageLocations.partId, partId));
    
    const locationsWithDetails = await Promise.all(
      locations.map(async (location) => {
        const [part] = await db.select().from(spareParts).where(eq(spareParts.id, location.partId));
        let garage = undefined;
        if (location.garageId) {
          [garage] = await db.select().from(garages).where(eq(garages.id, location.garageId));
        }
        return { ...location, part, garage };
      })
    );
    
    return locationsWithDetails;
  }

  async getGaragePartsInventory(garageId: string): Promise<PartsStorageLocationWithDetails[]> {
    const locations = await db.select().from(partsStorageLocations).where(eq(partsStorageLocations.garageId, garageId));
    
    const locationsWithDetails = await Promise.all(
      locations.map(async (location) => {
        const [part] = await db.select().from(spareParts).where(eq(spareParts.id, location.partId));
        const [garage] = await db.select().from(garages).where(eq(garages.id, garageId));
        return { ...location, part, garage };
      })
    );
    
    return locationsWithDetails;
  }

  async createPartsStorageLocation(data: InsertPartsStorageLocation): Promise<PartsStorageLocation> {
    const [result] = await db.insert(partsStorageLocations).values(data).returning();
    return result;
  }

  async updatePartsStorageLocation(id: string, data: Partial<InsertPartsStorageLocation>): Promise<PartsStorageLocation> {
    const [result] = await db.update(partsStorageLocations).set(data).where(eq(partsStorageLocations.id, id)).returning();
    return result;
  }

  // Equipment Location Tracking
  async getEquipmentLocationHistory(equipmentId: string): Promise<EquipmentLocation[]> {
    return await db
      .select()
      .from(equipmentLocations)
      .where(eq(equipmentLocations.equipmentId, equipmentId))
      .orderBy(desc(equipmentLocations.arrivedAt));
  }

  async getEquipmentCurrentLocation(equipmentId: string): Promise<EquipmentLocation | undefined> {
    const [result] = await db
      .select()
      .from(equipmentLocations)
      .where(and(
        eq(equipmentLocations.equipmentId, equipmentId),
        sql`${equipmentLocations.departedAt} IS NULL`
      ))
      .orderBy(desc(equipmentLocations.arrivedAt))
      .limit(1);
    
    return result || undefined;
  }

  async createEquipmentLocation(data: InsertEquipmentLocation): Promise<EquipmentLocation> {
    const [result] = await db.insert(equipmentLocations).values(data).returning();
    return result;
  }

  async updateEquipmentLocation(id: string, data: Partial<InsertEquipmentLocation>): Promise<EquipmentLocation> {
    const [result] = await db.update(equipmentLocations).set(data).where(eq(equipmentLocations.id, id)).returning();
    return result;
  }

  // Equipment Reception/Check-in Operations
  async getAllReceptions(filters?: { status?: string; garageId?: string }): Promise<EquipmentReceptionWithDetails[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(equipmentReceptions.status, filters.status));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const receptions = await db
      .select()
      .from(equipmentReceptions)
      .where(whereClause)
      .orderBy(desc(equipmentReceptions.arrivalDate));

    // Get related data for each reception
    const results: EquipmentReceptionWithDetails[] = [];
    for (const reception of receptions) {
      const equipmentData = reception.equipmentId
        ? await this.getEquipmentById(reception.equipmentId)
        : undefined;
      const driverData = reception.driverId
        ? await this.getEmployeeById(reception.driverId)
        : undefined;
      const mechanicData = reception.mechanicId
        ? await this.getEmployeeById(reception.mechanicId)
        : undefined;
      const inspectionOfficerData = reception.inspectionOfficerId
        ? await this.getEmployeeById(reception.inspectionOfficerId)
        : undefined;
      const workOrderData = reception.workOrderId
        ? await this.getWorkOrderById(reception.workOrderId)
        : undefined;

      results.push({
        ...reception,
        equipment: equipmentData,
        driver: driverData,
        mechanic: mechanicData,
        inspectionOfficer: inspectionOfficerData,
        workOrder: workOrderData,
      });
    }
    return results;
  }

  async getReceptionById(id: string): Promise<EquipmentReceptionWithDetails | undefined> {
    const [reception] = await db
      .select()
      .from(equipmentReceptions)
      .where(eq(equipmentReceptions.id, id));

    if (!reception) return undefined;

    const equipmentData = reception.equipmentId
      ? await this.getEquipmentById(reception.equipmentId)
      : undefined;
    const driverData = reception.driverId
      ? await this.getEmployeeById(reception.driverId)
      : undefined;
    const mechanicData = reception.mechanicId
      ? await this.getEmployeeById(reception.mechanicId)
      : undefined;
    const inspectionOfficerData = reception.inspectionOfficerId
      ? await this.getEmployeeById(reception.inspectionOfficerId)
      : undefined;
    const workOrderData = reception.workOrderId
      ? await this.getWorkOrderById(reception.workOrderId)
      : undefined;
    const inspectionItems = await this.getInspectionItemsByReception(id);
    const damageReportsData = await this.getDamageReportsByReception(id);
    const repairEstimateData = await this.getRepairEstimateByReception(id);

    return {
      ...reception,
      equipment: equipmentData,
      driver: driverData,
      mechanic: mechanicData,
      inspectionOfficer: inspectionOfficerData,
      workOrder: workOrderData,
      inspectionItems,
      damageReports: damageReportsData,
      repairEstimate: repairEstimateData,
    };
  }

  async getReceptionsByEquipment(equipmentId: string): Promise<EquipmentReceptionWithDetails[]> {
    const receptions = await db
      .select()
      .from(equipmentReceptions)
      .where(eq(equipmentReceptions.equipmentId, equipmentId))
      .orderBy(desc(equipmentReceptions.arrivalDate));

    const results: EquipmentReceptionWithDetails[] = [];
    for (const reception of receptions) {
      const driverData = reception.driverId
        ? await this.getEmployeeById(reception.driverId)
        : undefined;
      const mechanicData = reception.mechanicId
        ? await this.getEmployeeById(reception.mechanicId)
        : undefined;

      results.push({
        ...reception,
        driver: driverData,
        mechanic: mechanicData,
      });
    }
    return results;
  }

  async createReception(data: InsertEquipmentReception): Promise<EquipmentReception> {
    const [result] = await db.insert(equipmentReceptions).values(data).returning();
    return result;
  }

  async updateReception(id: string, data: Partial<InsertEquipmentReception>): Promise<EquipmentReception> {
    const updated = { ...data, updatedAt: new Date() };
    const [result] = await db
      .update(equipmentReceptions)
      .set(updated)
      .where(eq(equipmentReceptions.id, id))
      .returning();
    return result;
  }

  async getReceptionsByPrefix(prefix: string): Promise<EquipmentReception[]> {
    return await db
      .select()
      .from(equipmentReceptions)
      .where(sql`${equipmentReceptions.receptionNumber} LIKE ${prefix + '%'}`);
  }

  // Reception Checklists (Templates)
  async getChecklistTemplates(filters?: { equipmentType?: string; role?: string }): Promise<ReceptionChecklist[]> {
    const conditions = [eq(receptionChecklists.isActive, true)];
    
    if (filters?.equipmentType) {
      conditions.push(
        or(
          eq(receptionChecklists.equipmentType, filters.equipmentType),
          eq(receptionChecklists.equipmentType, "ALL")
        )!
      );
    }
    if (filters?.role) {
      conditions.push(eq(receptionChecklists.role, filters.role));
    }

    return await db
      .select()
      .from(receptionChecklists)
      .where(and(...conditions))
      .orderBy(receptionChecklists.sortOrder);
  }

  async createChecklistTemplate(data: InsertReceptionChecklist): Promise<ReceptionChecklist> {
    const [result] = await db.insert(receptionChecklists).values(data).returning();
    return result;
  }

  // Inspection Items
  async getInspectionItemsByReception(receptionId: string): Promise<ReceptionInspectionItem[]> {
    return await db
      .select()
      .from(receptionInspectionItems)
      .where(eq(receptionInspectionItems.receptionId, receptionId));
  }

  async createInspectionItem(data: InsertReceptionInspectionItem): Promise<ReceptionInspectionItem> {
    const [result] = await db.insert(receptionInspectionItems).values(data).returning();
    return result;
  }

  async createBulkInspectionItems(items: InsertReceptionInspectionItem[]): Promise<ReceptionInspectionItem[]> {
    if (items.length === 0) return [];
    const results = await db.insert(receptionInspectionItems).values(items).returning();
    return results;
  }

  // Equipment Inspections
  async getInspectionById(id: string): Promise<any | undefined> {
    const [inspection] = await db
      .select()
      .from(equipmentInspections)
      .where(eq(equipmentInspections.id, id));
    
    if (!inspection) return undefined;

    // Fetch related reception data
    const reception = inspection.receptionId
      ? await this.getReceptionById(inspection.receptionId)
      : undefined;

    // Fetch inspector data
    const inspector = inspection.inspectorId
      ? await this.getEmployeeById(inspection.inspectorId)
      : undefined;

    return {
      ...inspection,
      reception,
      inspector,
    };
  }

  async getInspectionByReceptionId(receptionId: string): Promise<EquipmentInspection | undefined> {
    const [result] = await db
      .select()
      .from(equipmentInspections)
      .where(eq(equipmentInspections.receptionId, receptionId));
    return result || undefined;
  }

  async getInspectionsByInspector(inspectorId: string): Promise<EquipmentInspection[]> {
    return await db
      .select()
      .from(equipmentInspections)
      .where(eq(equipmentInspections.inspectorId, inspectorId))
      .orderBy(desc(equipmentInspections.inspectionDate));
  }

  async getInspectionsByPrefix(prefix: string): Promise<EquipmentInspection[]> {
    return await db
      .select()
      .from(equipmentInspections)
      .where(ilike(equipmentInspections.inspectionNumber, `${prefix}%`))
      .orderBy(desc(equipmentInspections.inspectionNumber));
  }

  async createInspection(data: InsertEquipmentInspection): Promise<EquipmentInspection> {
    const [result] = await db.insert(equipmentInspections).values(data).returning();
    return result;
  }

  async updateInspection(id: string, data: Partial<InsertEquipmentInspection>): Promise<EquipmentInspection> {
    const [result] = await db
      .update(equipmentInspections)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(equipmentInspections.id, id))
      .returning();
    return result;
  }

  async getAllInspections(): Promise<any[]> {
    const results = await db
      .select({
        id: equipmentInspections.id,
        inspectionNumber: equipmentInspections.inspectionNumber,
        receptionId: equipmentInspections.receptionId,
        inspectorId: equipmentInspections.inspectorId,
        serviceType: equipmentInspections.serviceType,
        status: equipmentInspections.status,
        overallCondition: equipmentInspections.overallCondition,
        findings: equipmentInspections.findings,
        recommendations: equipmentInspections.recommendations,
        createdAt: equipmentInspections.createdAt,
        updatedAt: equipmentInspections.updatedAt,
        inspectionDate: equipmentInspections.inspectionDate,
        reception: equipmentReceptions,
        inspector: employees,
      })
      .from(equipmentInspections)
      .leftJoin(equipmentReceptions, eq(equipmentInspections.receptionId, equipmentReceptions.id))
      .leftJoin(employees, eq(equipmentInspections.inspectorId, employees.id))
      .orderBy(desc(equipmentInspections.createdAt));
    
    // Fetch equipment details for each reception
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        if (result.reception) {
          const equipment = result.reception.equipmentId 
            ? await this.getEquipmentById(result.reception.equipmentId)
            : null;
          return {
            ...result,
            reception: {
              ...result.reception,
              equipment,
            },
          };
        }
        return result;
      })
    );

    return enrichedResults;
  }

  async getAllCompletedInspections(): Promise<any[]> {
    const results = await db
      .select({
        id: equipmentInspections.id,
        inspectionNumber: equipmentInspections.inspectionNumber,
        receptionId: equipmentInspections.receptionId,
        inspectorId: equipmentInspections.inspectorId,
        serviceType: equipmentInspections.serviceType,
        status: equipmentInspections.status,
        overallCondition: equipmentInspections.overallCondition,
        findings: equipmentInspections.findings,
        recommendations: equipmentInspections.recommendations,
        completedAt: equipmentInspections.updatedAt, // Using updatedAt as completedAt
        inspectionDate: equipmentInspections.inspectionDate,
        reception: equipmentReceptions,
        inspector: employees,
      })
      .from(equipmentInspections)
      .leftJoin(equipmentReceptions, eq(equipmentInspections.receptionId, equipmentReceptions.id))
      .leftJoin(employees, eq(equipmentInspections.inspectorId, employees.id))
      .where(eq(equipmentInspections.status, "completed"))
      .orderBy(desc(equipmentInspections.updatedAt));
    
    // Fetch equipment and driver details for each reception
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        if (result.reception) {
          const equipment = result.reception.equipmentId 
            ? await this.getEquipmentById(result.reception.equipmentId)
            : null;
          
          // Fetch driver information if driverId exists
          const driver = result.reception.driverId
            ? await this.getEmployeeById(result.reception.driverId)
            : null;
          
          return {
            ...result,
            reception: {
              ...result.reception,
              equipment,
              driver,
            },
          };
        }
        return result;
      })
    );

    return enrichedResults;
  }

  async getCanceledInspections(): Promise<any[]> {
    const results = await db
      .select({
        id: equipmentInspections.id,
        inspectionNumber: equipmentInspections.inspectionNumber,
        receptionId: equipmentInspections.receptionId,
        inspectorId: equipmentInspections.inspectorId,
        serviceType: equipmentInspections.serviceType,
        status: equipmentInspections.status,
        overallCondition: equipmentInspections.overallCondition,
        findings: equipmentInspections.findings,
        recommendations: equipmentInspections.recommendations,
        updatedAt: equipmentInspections.updatedAt,
        inspectionDate: equipmentInspections.inspectionDate,
        reception: equipmentReceptions,
        inspector: employees,
      })
      .from(equipmentInspections)
      .leftJoin(equipmentReceptions, eq(equipmentInspections.receptionId, equipmentReceptions.id))
      .leftJoin(employees, eq(equipmentInspections.inspectorId, employees.id))
      .where(eq(equipmentInspections.status, "canceled"))
      .orderBy(desc(equipmentInspections.updatedAt));
    
    // Fetch equipment details for each reception
    const enrichedResults = await Promise.all(
      results.map(async (result) => {
        if (result.reception) {
          const equipment = result.reception.equipmentId 
            ? await this.getEquipmentById(result.reception.equipmentId)
            : null;
          return {
            ...result,
            reception: {
              ...result.reception,
              equipment,
            },
          };
        }
        return result;
      })
    );

    return enrichedResults;
  }

  async cancelReception(receptionId: string): Promise<void> {
    // Update reception status to canceled
    await db
      .update(equipmentReceptions)
      .set({ status: "canceled", updatedAt: new Date() })
      .where(eq(equipmentReceptions.id, receptionId));

    // Check if an inspection exists for this reception
    const inspection = await this.getInspectionByReceptionId(receptionId);
    
    if (inspection) {
      // Update inspection status to canceled
      await db
        .update(equipmentInspections)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(equipmentInspections.id, inspection.id));
    }
  }

  // Inspection Checklist Items
  async getChecklistItemsByInspection(inspectionId: string): Promise<InspectionChecklistItem[]> {
    return await db
      .select()
      .from(inspectionChecklistItems)
      .where(eq(inspectionChecklistItems.inspectionId, inspectionId))
      .orderBy(inspectionChecklistItems.itemNumber);
  }

  async createChecklistItem(data: InsertInspectionChecklistItem): Promise<InspectionChecklistItem> {
    const [result] = await db.insert(inspectionChecklistItems).values(data).returning();
    return result;
  }

  async createBulkChecklistItems(items: InsertInspectionChecklistItem[]): Promise<InspectionChecklistItem[]> {
    if (items.length === 0) return [];
    const results = await db.insert(inspectionChecklistItems).values(items).returning();
    return results;
  }

  async updateChecklistItem(id: string, data: Partial<InsertInspectionChecklistItem>): Promise<InspectionChecklistItem> {
    const [result] = await db
      .update(inspectionChecklistItems)
      .set(data)
      .where(eq(inspectionChecklistItems.id, id))
      .returning();
    return result;
  }

  async deleteChecklistItemsByInspection(inspectionId: string): Promise<void> {
    await db
      .delete(inspectionChecklistItems)
      .where(eq(inspectionChecklistItems.inspectionId, inspectionId));
  }

  async upsertChecklistItems(inspectionId: string, items: InsertInspectionChecklistItem[]): Promise<InspectionChecklistItem[]> {
    // Use a transaction to ensure atomicity: delete and insert happen together or not at all
    return await db.transaction(async (tx) => {
      // Delete existing checklist items for this inspection
      await tx
        .delete(inspectionChecklistItems)
        .where(eq(inspectionChecklistItems.inspectionId, inspectionId));
      
      // Insert new checklist items
      if (items.length === 0) return [];
      const results = await tx.insert(inspectionChecklistItems).values(items).returning();
      return results;
    });
  }

  // Damage Reports
  async getDamageReportsByReception(receptionId: string): Promise<DamageReport[]> {
    return await db
      .select()
      .from(damageReports)
      .where(eq(damageReports.receptionId, receptionId));
  }

  async createDamageReport(data: InsertDamageReport): Promise<DamageReport> {
    const [result] = await db.insert(damageReports).values(data).returning();
    return result;
  }

  // Repair Estimates
  async getRepairEstimateByReception(receptionId: string): Promise<RepairEstimate | undefined> {
    const [result] = await db
      .select()
      .from(repairEstimates)
      .where(eq(repairEstimates.receptionId, receptionId));
    return result || undefined;
  }

  async createRepairEstimate(data: InsertRepairEstimate): Promise<RepairEstimate> {
    const [result] = await db.insert(repairEstimates).values(data).returning();
    return result;
  }

  async updateRepairEstimate(id: string, data: Partial<InsertRepairEstimate>): Promise<RepairEstimate> {
    const [result] = await db
      .update(repairEstimates)
      .set(data)
      .where(eq(repairEstimates.id, id))
      .returning();
    return result;
  }

  // Approval System - Parts Requests
  async getAllPartsRequests(filters?: { status?: string; approvalStatus?: string; requestedById?: string }): Promise<PartsRequestWithDetails[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(partsRequests.status, filters.status));
    }
    if (filters?.approvalStatus) {
      conditions.push(eq(partsRequests.approvalStatus, filters.approvalStatus));
    }
    if (filters?.requestedById) {
      conditions.push(eq(partsRequests.requestedById, filters.requestedById));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const requests = await db
      .select()
      .from(partsRequests)
      .where(whereClause)
      .orderBy(desc(partsRequests.createdAt));

    const results: PartsRequestWithDetails[] = [];
    for (const request of requests) {
      const requestedBy = request.requestedById ? await this.getEmployeeById(request.requestedById) : undefined;
      const approvedBy = request.approvedById ? await this.getEmployeeById(request.approvedById) : undefined;
      const workOrder = request.workOrderId ? await this.getWorkOrderById(request.workOrderId) : undefined;

      results.push({
        ...request,
        requestedBy,
        approvedBy,
        workOrder,
      });
    }
    return results;
  }

  async getPartsRequestById(id: string): Promise<PartsRequestWithDetails | undefined> {
    const [request] = await db
      .select()
      .from(partsRequests)
      .where(eq(partsRequests.id, id));

    if (!request) return undefined;

    const requestedBy = request.requestedById ? await this.getEmployeeById(request.requestedById) : undefined;
    const approvedBy = request.approvedById ? await this.getEmployeeById(request.approvedById) : undefined;
    const workOrder = request.workOrderId ? await this.getWorkOrderById(request.workOrderId) : undefined;

    return {
      ...request,
      requestedBy,
      approvedBy,
      workOrder,
    };
  }

  async getPartsRequestsByWorkOrder(workOrderId: string): Promise<PartsRequest[]> {
    return await db
      .select()
      .from(partsRequests)
      .where(eq(partsRequests.workOrderId, workOrderId));
  }

  async createPartsRequest(data: InsertPartsRequest): Promise<PartsRequest> {
    const [result] = await db.insert(partsRequests).values(data).returning();
    return result;
  }

  async updatePartsRequest(id: string, data: Partial<InsertPartsRequest>): Promise<PartsRequest> {
    const [result] = await db
      .update(partsRequests)
      .set(data)
      .where(eq(partsRequests.id, id))
      .returning();
    return result;
  }

  // Approval System - Approvals
  async getAllApprovals(filters?: { status?: string; assignedToId?: string; approvalType?: string }): Promise<ApprovalWithDetails[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(approvals.status, filters.status));
    }
    if (filters?.assignedToId) {
      conditions.push(eq(approvals.assignedToId, filters.assignedToId));
    }
    if (filters?.approvalType) {
      conditions.push(eq(approvals.approvalType, filters.approvalType));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const approvalsList = await db
      .select()
      .from(approvals)
      .where(whereClause)
      .orderBy(desc(approvals.createdAt));

    const results: ApprovalWithDetails[] = [];
    for (const approval of approvalsList) {
      const requestedBy = await this.getEmployeeById(approval.requestedById);
      const assignedTo = await this.getEmployeeById(approval.assignedToId);
      const escalatedTo = approval.escalatedToId ? await this.getEmployeeById(approval.escalatedToId) : undefined;

      results.push({
        ...approval,
        requestedBy,
        assignedTo,
        escalatedTo,
      });
    }
    return results;
  }

  async getApprovalById(id: string): Promise<ApprovalWithDetails | undefined> {
    const [approval] = await db
      .select()
      .from(approvals)
      .where(eq(approvals.id, id));

    if (!approval) return undefined;

    const requestedBy = await this.getEmployeeById(approval.requestedById);
    const assignedTo = await this.getEmployeeById(approval.assignedToId);
    const escalatedTo = approval.escalatedToId ? await this.getEmployeeById(approval.escalatedToId) : undefined;

    return {
      ...approval,
      requestedBy,
      assignedTo,
      escalatedTo,
    };
  }

  async getPendingApprovalsByEmployee(employeeId: string): Promise<ApprovalWithDetails[]> {
    return await this.getAllApprovals({ assignedToId: employeeId, status: "pending" });
  }

  async createApproval(data: InsertApproval): Promise<Approval> {
    const [result] = await db.insert(approvals).values(data).returning();
    return result;
  }

  async updateApproval(id: string, data: Partial<InsertApproval>): Promise<Approval> {
    const [result] = await db
      .update(approvals)
      .set(data)
      .where(eq(approvals.id, id))
      .returning();
    return result;
  }

  // Approval Actions
  async approveWorkOrder(workOrderId: string, approvedById: string, notes?: string): Promise<void> {
    await db
      .update(workOrders)
      .set({
        approvalStatus: "approved",
        approvedById,
        approvedAt: new Date(),
        approvalNotes: notes,
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async rejectWorkOrder(workOrderId: string, approvedById: string, notes?: string): Promise<void> {
    await db
      .update(workOrders)
      .set({
        approvalStatus: "rejected",
        approvedById,
        approvedAt: new Date(),
        approvalNotes: notes,
        status: "cancelled",
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async approveWorkOrderCompletion(workOrderId: string, approvedById: string, notes?: string): Promise<void> {
    await db
      .update(workOrders)
      .set({
        completionApprovalStatus: "approved",
        completionApprovedById: approvedById,
        completionApprovedAt: new Date(),
        completionApprovalNotes: notes,
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async approvePartsRequest(partsRequestId: string, approvedById: string, notes?: string): Promise<void> {
    await db
      .update(partsRequests)
      .set({
        approvalStatus: "approved",
        approvedById,
        approvedAt: new Date(),
        approvalNotes: notes,
        status: "approved",
      })
      .where(eq(partsRequests.id, partsRequestId));
  }

  async rejectPartsRequest(partsRequestId: string, approvedById: string, notes?: string): Promise<void> {
    await db
      .update(partsRequests)
      .set({
        approvalStatus: "rejected",
        approvedById,
        approvedAt: new Date(),
        approvalNotes: notes,
        status: "rejected",
      })
      .where(eq(partsRequests.id, partsRequestId));
  }

  // Attendance Device Operations
  async getAllAttendanceDevices(): Promise<any[]> {
    return await db
      .select()
      .from(attendanceDeviceSettings)
      .orderBy(desc(attendanceDeviceSettings.isActive), attendanceDeviceSettings.deviceName);
  }

  async getAttendanceDeviceSettings(): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(attendanceDeviceSettings)
      .where(eq(attendanceDeviceSettings.isActive, true))
      .limit(1);
    return result || undefined;
  }

  async getAttendanceDeviceById(id: string): Promise<any | undefined> {
    const [result] = await db
      .select()
      .from(attendanceDeviceSettings)
      .where(eq(attendanceDeviceSettings.id, id));
    return result || undefined;
  }

  async createAttendanceDevice(data: any): Promise<any> {
    const [result] = await db
      .insert(attendanceDeviceSettings)
      .values({ ...data, isActive: false })
      .returning();
    return result;
  }

  async saveAttendanceDeviceSettings(data: any): Promise<any> {
    // Deactivate all existing settings
    await db
      .update(attendanceDeviceSettings)
      .set({ isActive: false });

    // Create new active setting
    const [result] = await db
      .insert(attendanceDeviceSettings)
      .values({ ...data, isActive: true })
      .returning();
    return result;
  }

  async updateAttendanceDeviceSettings(id: string, data: Partial<any>): Promise<any> {
    const [result] = await db
      .update(attendanceDeviceSettings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(attendanceDeviceSettings.id, id))
      .returning();
    return result;
  }

  async setActiveDevice(id: string): Promise<any> {
    // Deactivate all devices
    await db
      .update(attendanceDeviceSettings)
      .set({ isActive: false });

    // Activate the selected device
    const [result] = await db
      .update(attendanceDeviceSettings)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(attendanceDeviceSettings.id, id))
      .returning();
    return result;
  }

  async deleteAttendanceDevice(id: string): Promise<void> {
    await db
      .delete(attendanceDeviceSettings)
      .where(eq(attendanceDeviceSettings.id, id));
  }

  async getEmployeeByDeviceUserId(deviceUserId: string): Promise<Employee | undefined> {
    const [result] = await db
      .select()
      .from(employees)
      .where(eq(employees.deviceUserId, deviceUserId))
      .limit(1);
    return result || undefined;
  }

  async getEmployeeByEmployeeId(employeeId: string): Promise<Employee | undefined> {
    const [result] = await db
      .select()
      .from(employees)
      .where(eq(employees.employeeId, employeeId))
      .limit(1);
    return result || undefined;
  }

  async getEmployeeByName(fullName: string): Promise<Employee | undefined> {
    const normalizedSearch = fullName.toLowerCase().trim();
    const [result] = await db
      .select()
      .from(employees)
      .where(sql`LOWER(TRIM(${employees.fullName})) = ${normalizedSearch}`)
      .limit(1);
    return result || undefined;
  }

  async createDeviceImportLog(data: any): Promise<any> {
    const [result] = await db
      .insert(deviceImportLogs)
      .values(data)
      .returning();
    return result;
  }

  async getDeviceImportLogs(): Promise<any[]> {
    return await db
      .select()
      .from(deviceImportLogs)
      .orderBy(desc(deviceImportLogs.createdAt))
      .limit(50);
  }
}

export const storage = new DatabaseStorage();
