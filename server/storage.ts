import {
  equipmentCategories,
  equipment,
  spareParts,
  partCompatibility,
  mechanics,
  maintenanceRecords,
  partsUsageHistory,
  operatingBehaviorReports,
  garages,
  workshops,
  workshopMembers,
  employees,
  workOrders,
  workOrderGarages,
  workOrderWorkshops,
  workOrderMemberships,
  workOrderStatusHistory,
  workOrderTimeTracking,
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
  itemRequisitions,
  itemRequisitionLines,
  partsReceipts,
  purchaseRequests,
  attendanceDeviceSettings,
  deviceImportLogs,
  equipmentInspections,
  inspectionChecklistItems,
  items,
  dynamics365Settings,
  systemSettings,
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
  type Item,
  type InsertItem,
  type Dynamics365Settings,
  type InsertDynamics365Settings,
  type SystemSettings,
  type InsertSystemSettings,
} from "@shared/schema";
import { db } from "./db";
import { eq, ilike, or, and, sql, desc, inArray, isNull } from "drizzle-orm";

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
  deletePart(id: string): Promise<boolean>;
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
  getAllGarages(): Promise<GarageWithDetails[]>;
  getGarageById(id: string): Promise<GarageWithDetails | undefined>;
  createGarage(data: InsertGarage): Promise<Garage>;
  updateGarage(id: string, data: Partial<InsertGarage>): Promise<Garage>;
  deleteGarage(id: string): Promise<void>;

  // Repair Bays
  getAllWorkshops(): Promise<WorkshopWithDetails[]>;
  getWorkshopsByGarage(garageId: string): Promise<WorkshopWithDetails[]>;
  createWorkshop(data: InsertWorkshop): Promise<Workshop>;
  updateWorkshop(id: string, data: Partial<InsertWorkshop>): Promise<Workshop>;
  deleteWorkshop(id: string): Promise<void>;
  addWorkshopMember(data: InsertWorkshopMember): Promise<WorkshopMember>;
  removeWorkshopMember(workshopId: string, employeeId: string): Promise<void>;
  getWorkshopMembers(workshopId: string): Promise<Employee[]>;
  getWorkshopDetails(workshopId: string): Promise<any>;

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
  getForemanPendingWorkOrders(foremanId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]>;
  getForemanActiveWorkOrders(foremanId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]>;
  getWorkOrdersByTeamMember(teamMemberId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]>;
  assignTeamToWorkOrder(workOrderId: string, teamMemberIds: string[], foremanId: string): Promise<void>;
  getVerifierPendingWorkOrders(): Promise<WorkOrderWithDetails[]>;
  approveWorkOrderVerification(workOrderId: string, verifierId: string, notes?: string): Promise<void>;
  rejectWorkOrderVerification(workOrderId: string, verifierId: string, rejectionNotes: string): Promise<void>;
  markWorkComplete(workOrderId: string, teamMemberId: string): Promise<void>;
  approveWorkCompletion(workOrderId: string, foremanId: string, notes?: string): Promise<void>;
  getSupervisorPendingWorkOrders(): Promise<WorkOrderWithDetails[]>;
  approveSupervisorSignoff(workOrderId: string, supervisorId: string, notes?: string): Promise<void>;
  rejectSupervisorSignoff(workOrderId: string, supervisorId: string, rejectionNotes: string): Promise<void>;
  
  // Work Order Required Parts
  getWorkOrderRequiredParts(workOrderId: string): Promise<WorkOrderRequiredPart[]>;
  replaceWorkOrderRequiredParts(workOrderId: string, parts: InsertWorkOrderRequiredPart[]): Promise<void>;

  // Work Order Time Tracking
  getWorkOrderTimeTracking(workOrderId: string): Promise<WorkOrderTimeTracking[]>;
  createTimeTrackingEvent(workOrderId: string, event: string, reason?: string, triggeredById?: string): Promise<void>;
  pauseWorkOrderTimer(workOrderId: string, reason: string, triggeredById?: string): Promise<void>;
  resumeWorkOrderTimer(workOrderId: string, triggeredById?: string): Promise<void>;

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

  // Item Requisitions
  createItemRequisition(requisitionData: any, lines: any[]): Promise<any>;
  getItemRequisitionsByForeman(foremanId: string, isAdmin?: boolean): Promise<any[]>;
  getItemRequisitionsByStoreManager(): Promise<any[]>;
  approveItemRequisitionByForeman(requisitionId: string, foremanId: string, remarks?: string): Promise<void>;
  rejectItemRequisitionByForeman(requisitionId: string, foremanId: string, remarks?: string): Promise<void>;
  approveItemRequisitionByStoreManager(requisitionId: string, storeManagerId: string, remarks?: string): Promise<void>;
  rejectItemRequisitionByStoreManager(requisitionId: string, storeManagerId: string, remarks?: string): Promise<void>;
  processItemRequisitionLineDecisions(requisitionId: string, storeManagerId: string, lineDecisions: Array<{lineId: string; action: 'approve' | 'reject' | 'backorder'; quantityApproved?: number; remarks?: string}>, generalRemarks?: string): Promise<void>;
  getPurchaseRequests(): Promise<any[]>;
  confirmPartsReceipt(requisitionId: string, teamMemberId: string): Promise<void>;
  markWorkComplete(workOrderId: string, teamMemberId: string): Promise<void>;
  approveWorkCompletion(workOrderId: string, foremanId: string, notes?: string): Promise<void>;

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

  // Dynamics 365 Settings Operations
  getDynamics365Settings(): Promise<Dynamics365Settings | undefined>;
  saveDynamics365Settings(data: InsertDynamics365Settings, updatedById: string): Promise<Dynamics365Settings>;
  updateDynamics365TestResult(testStatus: string, testMessage?: string): Promise<void>;

  // System Settings Operations
  getSystemSettings(): Promise<SystemSettings | undefined>;
  saveSystemSettings(data: InsertSystemSettings, updatedById: string): Promise<SystemSettings>;
  
  // Items (D365) Operations
  getAllItems(): Promise<Item[]>;
  getItemById(id: string): Promise<Item | undefined>;
  getItemByItemNo(itemNo: string): Promise<Item | undefined>;
  createItem(data: InsertItem): Promise<Item>;
  updateItem(id: string, data: Partial<InsertItem>): Promise<Item>;
  deleteItem(id: string): Promise<void>;
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
      .where(whereClause);

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

  async deletePart(id: string): Promise<boolean> {
    const result = await db
      .delete(spareParts)
      .where(eq(spareParts.id, id))
      .returning();
    return result.length > 0;
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
      .where(whereClause);

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

  // User operations (using employees table)
  async updateUserLanguage(userId: string, language: string): Promise<void> {
    await db
      .update(employees)
      .set({ language })
      .where(eq(employees.id, userId));
  }

  // ============================================
  // GARAGE MANAGEMENT IMPLEMENTATIONS
  // ============================================

  // Garages
  async getAllGarages(): Promise<GarageWithDetails[]> {
    const allGarages = await db.select().from(garages).orderBy(garages.name);
    
    // Fetch workshops for each garage
    const garagesWithDetails = await Promise.all(
      allGarages.map(async (garage) => {
        const workshopsList = await this.getWorkshopsByGarage(garage.id);
        return {
          ...garage,
          workshops: workshopsList,
          employees: [],
          workOrders: [],
        };
      })
    );
    
    return garagesWithDetails;
  }

  async getAllWorkshops(): Promise<WorkshopWithDetails[]> {
    const allWorkshops = await db.select().from(workshops).orderBy(workshops.name);
    
    // Fetch details for each workshop
    const workshopsWithDetails = await Promise.all(
      allWorkshops.map(async (workshop) => {
        // Get garage info
        const garage = workshop.garageId
          ? await db.select().from(garages).where(eq(garages.id, workshop.garageId)).limit(1)
          : [];
        
        // Get foreman info
        const foreman = workshop.foremanId
          ? await db.select().from(employees).where(eq(employees.id, workshop.foremanId)).limit(1)
          : [];
        
        // Get team members
        const teamMembers = await db
          .select()
          .from(workshopMembers)
          .innerJoin(employees, eq(workshopMembers.employeeId, employees.id))
          .where(eq(workshopMembers.workshopId, workshop.id));
        
        return {
          ...workshop,
          garage: garage[0] || null,
          foreman: foreman[0] || null,
          teamMembers: teamMembers.map(tm => tm.employees),
        };
      })
    );
    
    return workshopsWithDetails;
  }

  async getGarageById(id: string): Promise<GarageWithDetails | undefined> {
    const [garage] = await db.select().from(garages).where(eq(garages.id, id));
    if (!garage) return undefined;

    // Fetch workshops with full details (foreman and members)
    const workshopsList = await this.getWorkshopsByGarage(id);
    const employeesList = await db.select().from(employees).where(eq(employees.garageId, id));
    
    // Fetch work orders for this garage using the junction table
    const garageWorkOrders = await db
      .select({ workOrderId: workOrderGarages.workOrderId })
      .from(workOrderGarages)
      .where(eq(workOrderGarages.garageId, id));
    
    const workOrderIds = garageWorkOrders.map(wo => wo.workOrderId);
    const orders = workOrderIds.length > 0 
      ? await db.select().from(workOrders).where(inArray(workOrders.id, workOrderIds))
      : [];

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

  async getWorkshopDetails(workshopId: string): Promise<any> {
    // Get workshop info
    const [workshop] = await db.select().from(workshops).where(eq(workshops.id, workshopId));
    if (!workshop) {
      return null;
    }

    // Get workshop members
    const members = await this.getWorkshopMembers(workshopId);

    // Get foreman info
    let foreman = null;
    if (workshop.foremanId) {
      const [foremanData] = await db.select().from(employees).where(eq(employees.id, workshop.foremanId));
      foreman = foremanData || null;
    }

    // Get work orders assigned to this workshop
    const workOrderAssignments = await db
      .select()
      .from(workOrderWorkshops)
      .where(eq(workOrderWorkshops.workshopId, workshopId));

    const workOrderIds = workOrderAssignments.map(a => a.workOrderId);

    let workOrdersData = [];
    let statusBreakdown: Record<string, number> = {};

    if (workOrderIds.length > 0) {
      workOrdersData = await db
        .select()
        .from(workOrders)
        .where(inArray(workOrders.id, workOrderIds));

      // Calculate status breakdown
      statusBreakdown = workOrdersData.reduce((acc, wo) => {
        acc[wo.status] = (acc[wo.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    }

    return {
      workshop,
      foreman,
      members,
      workOrders: workOrdersData,
      statusBreakdown,
      stats: {
        totalWorkOrders: workOrdersData.length,
        totalMembers: members.length,
        completedWorkOrders: workOrdersData.filter(wo => wo.status === 'completed').length,
      },
    };
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
    
    if (orders.length === 0) return [];

    // Collect all unique IDs for batch fetching (performance optimization)
    const equipmentIds = Array.from(new Set(orders.map((o: any) => o.equipmentId).filter(Boolean))) as string[];
    const garageIds = Array.from(new Set(orders.map((o: any) => o.garageId).filter(Boolean))) as string[];
    const workshopIds = Array.from(new Set(orders.map((o: any) => o.workshopId).filter(Boolean))) as string[];
    const userIds = Array.from(new Set(orders.map((o: any) => o.createdById).filter(Boolean))) as string[];
    const workOrderIds = orders.map((o: any) => o.id);

    // Batch fetch all related data in parallel instead of N queries per order
    const [equipmentList, garageList, workshopList, userList, requiredPartsList, memberships] = await Promise.all([
      equipmentIds.length > 0 ? db.select().from(equipment).where(inArray(equipment.id, equipmentIds)) : Promise.resolve([]),
      garageIds.length > 0 ? db.select().from(garages).where(inArray(garages.id, garageIds)) : Promise.resolve([]),
      workshopIds.length > 0 ? db.select().from(workshops).where(inArray(workshops.id, workshopIds)) : Promise.resolve([]),
      userIds.length > 0 ? db.select().from(employees).where(inArray(employees.id, userIds)) : Promise.resolve([]),
      db.select().from(workOrderRequiredParts).where(inArray(workOrderRequiredParts.workOrderId, workOrderIds)),
      db.select({
        membership: workOrderMemberships,
        employee: employees,
      })
        .from(workOrderMemberships)
        .leftJoin(employees, eq(workOrderMemberships.employeeId, employees.id))
        .where(inArray(workOrderMemberships.workOrderId, workOrderIds)),
    ]);

    // Create lookup maps for O(1) access
    const equipmentMap = new Map(equipmentList.map((e: any) => [e.id, e]));
    const garageMap = new Map(garageList.map((g: any) => [g.id, g]));
    const workshopMap = new Map(workshopList.map((w: any) => [w.id, w]));
    const userMap = new Map(userList.map((u: any) => [u.id, u]));
    
    // Group required parts by work order ID
    const requiredPartsMap = new Map<string, typeof requiredPartsList>();
    for (const part of requiredPartsList) {
      if (!requiredPartsMap.has(part.workOrderId)) {
        requiredPartsMap.set(part.workOrderId, []);
      }
      requiredPartsMap.get(part.workOrderId)!.push(part);
    }

    // Group employees by work order ID (from memberships)
    const employeesMap = new Map<string, any[]>();
    for (const m of memberships) {
      if (m.employee) {
        if (!employeesMap.has(m.membership.workOrderId)) {
          employeesMap.set(m.membership.workOrderId, []);
        }
        // Only add unique employees (avoid duplicates if they have multiple roles)
        const existingEmployee = employeesMap.get(m.membership.workOrderId)!.find(e => e.id === m.employee!.id);
        if (!existingEmployee) {
          employeesMap.get(m.membership.workOrderId)!.push(m.employee);
        }
      }
    }

    // Map related data back to work orders
    return orders.map((order: any) => ({
      ...order,
      equipment: equipmentMap.get(order.equipmentId),
      garage: order.garageId ? garageMap.get(order.garageId) : undefined,
      workshop: order.workshopId ? workshopMap.get(order.workshopId) : undefined,
      assignedToList: employeesMap.get(order.id) || [],
      createdBy: order.createdById ? userMap.get(order.createdById) : undefined,
      requiredParts: requiredPartsMap.get(order.id) || [],
    }));
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
      [createdBy] = await db.select().from(employees).where(eq(employees.id, order.createdById));
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
    
    // Retry loop for handling duplicate work order numbers (up to 5 attempts)
    const maxRetries = 5;
    let attempt = 0;
    
    while (attempt < maxRetries) {
      try {
        if (!workOrderNumber || attempt > 0) {
          const currentYear = new Date().getFullYear();
          const pattern = `WO-${currentYear}-%`;
          
          // Query all work orders for this year and extract numbers
          const existingOrders = await db
            .select()
            .from(workOrders)
            .where(sql`${workOrders.workOrderNumber} LIKE ${pattern}`)
            .orderBy(desc(workOrders.createdAt));
          
          let nextNumber = 1;
          if (existingOrders.length > 0) {
            // Filter orders that match the simple format WO-YYYY-XXX (not quarter format)
            const simpleFormatOrders = existingOrders.filter(order => 
              /^WO-\d{4}-\d+$/.test(order.workOrderNumber)
            );
            
            if (simpleFormatOrders.length > 0) {
              // Extract all numbers and find the maximum
              const numbers = simpleFormatOrders
                .map(order => {
                  const match = order.workOrderNumber.match(/WO-\d{4}-(\d+)$/);
                  return match && match[1] ? parseInt(match[1], 10) : 0;
                })
                .filter(n => !isNaN(n));
              
              if (numbers.length > 0) {
                nextNumber = Math.max(...numbers) + 1 + attempt; // Add attempt number to handle race conditions
              }
            }
          }
          
          workOrderNumber = `WO-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
        }
        
        const [result] = await db.insert(workOrders).values({
          ...data,
          workOrderNumber,
        }).returning();
        
        return result;
      } catch (error: any) {
        // Check if it's a duplicate key error
        if (error.code === '23505' && error.constraint === 'work_orders_work_order_number_unique') {
          attempt++;
          if (attempt >= maxRetries) {
            throw new Error(`Failed to generate unique work order number after ${maxRetries} attempts`);
          }
          // Force regeneration of work order number on next attempt
          workOrderNumber = '';
          continue;
        }
        // Re-throw other errors
        throw error;
      }
    }
    
    throw new Error('Failed to create work order after maximum retries');
  }

  async updateWorkOrder(id: string, data: Partial<InsertWorkOrder>): Promise<WorkOrder> {
    const [result] = await db.update(workOrders).set(data).where(eq(workOrders.id, id)).returning();
    return result;
  }

  async deleteWorkOrder(id: string): Promise<void> {
    await db.delete(workOrders).where(eq(workOrders.id, id));
  }

  async getForemanPendingWorkOrders(foremanId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]> {
    // If admin, return all pending work orders for all foremen
    if (isAdmin) {
      const pendingOrders = await db
        .select()
        .from(workOrders)
        .where(
          or(
            eq(workOrders.status, "pending_allocation"),
            eq(workOrders.status, "pending_foreman_assignment"),
            eq(workOrders.status, "pending_team_acceptance")
          )
        );
      
      // Get full details for each order
      const ordersWithDetails = await Promise.all(
        pendingOrders.map(order => this.getWorkOrderById(order.id))
      );
      
      return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
    }
    
    // Get workshops where this employee is the foreman
    const foremanWorkshops = await db
      .select()
      .from(workshops)
      .where(eq(workshops.foremanId, foremanId));
    
    if (foremanWorkshops.length === 0) {
      return [];
    }
    
    const workshopIds = foremanWorkshops.map(w => w.id);
    
    // Get work orders assigned to these workshops that need team assignment
    const workOrderWorkshopLinks = await db
      .select()
      .from(workOrderWorkshops)
      .where(inArray(workOrderWorkshops.workshopId, workshopIds));
    
    const workOrderIds = workOrderWorkshopLinks.map(link => link.workOrderId);
    
    if (workOrderIds.length === 0) {
      return [];
    }
    
    // Get work orders with status pending_allocation, pending_foreman_assignment or pending_team_acceptance
    const pendingOrders = await db
      .select()
      .from(workOrders)
      .where(
        and(
          inArray(workOrders.id, workOrderIds),
          or(
            eq(workOrders.status, "pending_allocation"),
            eq(workOrders.status, "pending_foreman_assignment"),
            eq(workOrders.status, "pending_team_acceptance")
          )
        )
      );
    
    // Get full details for each order
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(order => this.getWorkOrderById(order.id))
    );
    
    return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
  }

  async getForemanActiveWorkOrders(foremanId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]> {
    // If admin, return all active work orders for all foremen
    if (isAdmin) {
      const activeOrders = await db
        .select()
        .from(workOrders)
        .where(
          or(
            eq(workOrders.status, "active"),
            eq(workOrders.status, "in_progress"),
            eq(workOrders.status, "awaiting_parts"),
            eq(workOrders.status, "waiting_purchase")
          )
        );
      
      // Get full details for each order
      const ordersWithDetails = await Promise.all(
        activeOrders.map(order => this.getWorkOrderById(order.id))
      );
      
      return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
    }
    
    // Get work orders where the foreman is assigned
    const foremanMemberships = await db
      .select()
      .from(workOrderMemberships)
      .where(
        and(
          eq(workOrderMemberships.employeeId, foremanId),
          eq(workOrderMemberships.role, "foreman"),
          eq(workOrderMemberships.isActive, true)
        )
      );
    
    if (foremanMemberships.length === 0) {
      return [];
    }
    
    const workOrderIds = foremanMemberships.map(m => m.workOrderId);
    
    // Get work orders with active statuses
    const activeOrders = await db
      .select()
      .from(workOrders)
      .where(
        and(
          inArray(workOrders.id, workOrderIds),
          or(
            eq(workOrders.status, "active"),
            eq(workOrders.status, "in_progress"),
            eq(workOrders.status, "awaiting_parts"),
            eq(workOrders.status, "waiting_purchase")
          )
        )
      );
    
    // Get full details for each order
    const ordersWithDetails = await Promise.all(
      activeOrders.map(order => this.getWorkOrderById(order.id))
    );
    
    return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
  }

  async getWorkOrdersByTeamMember(teamMemberId: string, isAdmin?: boolean): Promise<WorkOrderWithDetails[]> {
    // If admin, return all work orders with team member assignments
    if (isAdmin) {
      const allOrders = await db
        .select()
        .from(workOrders)
        .orderBy(desc(workOrders.createdAt));
      
      // Get full details for each order
      const ordersWithDetails = await Promise.all(
        allOrders.map(order => this.getWorkOrderById(order.id))
      );
      
      return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
    }
    
    // Get work orders where the user is a team member
    const teamMemberships = await db
      .select()
      .from(workOrderMemberships)
      .where(
        and(
          eq(workOrderMemberships.employeeId, teamMemberId),
          eq(workOrderMemberships.role, "team_member"),
          eq(workOrderMemberships.isActive, true)
        )
      );
    
    if (teamMemberships.length === 0) {
      return [];
    }
    
    const workOrderIds = teamMemberships.map(m => m.workOrderId);
    
    // Get work orders (all active statuses)
    const assignedOrders = await db
      .select()
      .from(workOrders)
      .where(inArray(workOrders.id, workOrderIds))
      .orderBy(desc(workOrders.createdAt));
    
    // Get full details for each order
    const ordersWithDetails = await Promise.all(
      assignedOrders.map(order => this.getWorkOrderById(order.id))
    );
    
    return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
  }

  async assignTeamToWorkOrder(workOrderId: string, teamMemberIds: string[], foremanId: string): Promise<void> {
    // Insert foreman membership if not exists
    const existingForemanMembership = await db
      .select()
      .from(workOrderMemberships)
      .where(
        and(
          eq(workOrderMemberships.workOrderId, workOrderId),
          eq(workOrderMemberships.employeeId, foremanId),
          eq(workOrderMemberships.role, "foreman")
        )
      );
    
    if (existingForemanMembership.length === 0) {
      await db.insert(workOrderMemberships).values({
        workOrderId,
        employeeId: foremanId,
        role: "foreman",
        assignedBy: foremanId,
      });
    }
    
    // Insert team member memberships
    const teamMemberValues = teamMemberIds.map(memberId => ({
      workOrderId,
      employeeId: memberId,
      role: "team_member",
      assignedBy: foremanId,
    }));
    
    if (teamMemberValues.length > 0) {
      await db.insert(workOrderMemberships).values(teamMemberValues);
    }
    
    // Update work order status to active and set startedAt timestamp
    const now = new Date();
    await db
      .update(workOrders)
      .set({ 
        status: "active",
        startedAt: now
      })
      .where(eq(workOrders.id, workOrderId));
    
    // Create timer start event in time tracking
    await db.insert(workOrderTimeTracking).values({
      workOrderId,
      event: "start",
      reason: "team_assigned",
      triggeredById: foremanId,
    });
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

  // Work Order Time Tracking
  async getWorkOrderTimeTracking(workOrderId: string): Promise<WorkOrderTimeTracking[]> {
    return await db
      .select()
      .from(workOrderTimeTracking)
      .where(eq(workOrderTimeTracking.workOrderId, workOrderId))
      .orderBy(workOrderTimeTracking.timestamp);
  }

  async createTimeTrackingEvent(workOrderId: string, event: string, reason?: string, triggeredById?: string): Promise<void> {
    await db.insert(workOrderTimeTracking).values({
      workOrderId,
      event,
      reason,
      triggeredById,
    });
  }

  async pauseWorkOrderTimer(workOrderId: string, reason: string, triggeredById?: string): Promise<void> {
    await this.createTimeTrackingEvent(workOrderId, "pause", reason, triggeredById);
  }

  async resumeWorkOrderTimer(workOrderId: string, triggeredById?: string): Promise<void> {
    await this.createTimeTrackingEvent(workOrderId, "resume", undefined, triggeredById);
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

    if (receptions.length === 0) return [];

    // Collect all unique IDs for batch fetching (performance optimization)
    const equipmentIds = Array.from(new Set(receptions.map((r: any) => r.equipmentId).filter(Boolean))) as string[];
    const employeeIds = Array.from(new Set([
      ...receptions.map((r: any) => r.driverId),
      ...receptions.map((r: any) => r.mechanicId),
      ...receptions.map((r: any) => r.inspectionOfficerId),
    ].filter(Boolean))) as string[];
    const workOrderIds = Array.from(new Set(receptions.map((r: any) => r.workOrderId).filter(Boolean))) as string[];

    // Batch fetch all related data in just 3 queries instead of N queries
    const [equipmentList, employeeList, workOrderList] = await Promise.all([
      equipmentIds.length > 0 ? db.select().from(equipment).where(inArray(equipment.id, equipmentIds)) : Promise.resolve([]),
      employeeIds.length > 0 ? db.select().from(employees).where(inArray(employees.id, employeeIds)) : Promise.resolve([]),
      workOrderIds.length > 0 ? db.select().from(workOrders).where(inArray(workOrders.id, workOrderIds)) : Promise.resolve([]),
    ]);

    // Create lookup maps for O(1) access
    const equipmentMap = new Map(equipmentList.map((e: any) => [e.id, e]));
    const employeeMap = new Map(employeeList.map((e: any) => [e.id, e]));
    const workOrderMap = new Map(workOrderList.map((w: any) => [w.id, w]));

    // Map related data back to receptions
    return receptions.map((reception: any) => ({
      ...reception,
      equipment: reception.equipmentId ? equipmentMap.get(reception.equipmentId) : undefined,
      driver: reception.driverId ? employeeMap.get(reception.driverId) : undefined,
      mechanic: reception.mechanicId ? employeeMap.get(reception.mechanicId) : undefined,
      inspectionOfficer: reception.inspectionOfficerId ? employeeMap.get(reception.inspectionOfficerId) : undefined,
      workOrder: reception.workOrderId ? workOrderMap.get(reception.workOrderId) : undefined,
    }));
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
      .where(
        or(
          eq(equipmentInspections.status, "completed"),
          eq(equipmentInspections.status, "approved")
        )
      )
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

  // Item Requisitions
  async createItemRequisition(requisitionData: any, lines: any[]): Promise<any> {
    // Generate requisition number
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const existingReqs = await db
      .select()
      .from(itemRequisitions)
      .where(sql`${itemRequisitions.requisitionNumber} LIKE ${prefix + '%'}`)
      .orderBy(desc(itemRequisitions.requisitionNumber));
    
    let nextNumber = 1;
    if (existingReqs.length > 0) {
      const lastNumber = existingReqs[0].requisitionNumber.split('-')[2];
      nextNumber = parseInt(lastNumber) + 1;
    }
    
    const requisitionNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
    
    // Create requisition
    const [requisition] = await db.insert(itemRequisitions).values({
      ...requisitionData,
      requisitionNumber,
      status: 'pending_foreman',
    }).returning();
    
    // Create requisition lines
    if (lines.length > 0) {
      const linesWithReqId = lines.map((line, index) => ({
        ...line,
        requisitionId: requisition.id,
        lineNumber: index + 1,
      }));
      await db.insert(itemRequisitionLines).values(linesWithReqId);
    }
    
    return requisition;
  }

  async getItemRequisitionsByForeman(foremanId: string, isAdmin?: boolean): Promise<any[]> {
    let requisitions;
    
    // If admin, return all requisitions with pending foreman approval
    if (isAdmin) {
      requisitions = await db
        .select()
        .from(itemRequisitions)
        .where(eq(itemRequisitions.foremanApprovalStatus, 'pending'))
        .orderBy(desc(itemRequisitions.createdAt));
    } else {
      // Get workshops where this employee is the foreman
      const foremanWorkshops = await db
        .select()
        .from(workshops)
        .where(eq(workshops.foremanId, foremanId));
      
      if (foremanWorkshops.length === 0) {
        return [];
      }
      
      const workshopIds = foremanWorkshops.map(w => w.id);
      
      // Get work orders assigned to the foreman's workshops
      const workOrderIds = await db
        .selectDistinct({ workOrderId: workOrderWorkshops.workOrderId })
        .from(workOrderWorkshops)
        .where(inArray(workOrderWorkshops.workshopId, workshopIds));
      
      const woIds = workOrderIds.map(wo => wo.workOrderId);
      
      if (woIds.length === 0) {
        return [];
      }
      
      // Get requisitions for these work orders with pending foreman approval
      requisitions = await db
        .select()
        .from(itemRequisitions)
        .where(
          and(
            inArray(itemRequisitions.workOrderId, woIds),
            eq(itemRequisitions.foremanApprovalStatus, 'pending')
          )
        )
        .orderBy(desc(itemRequisitions.createdAt));
    }
    
    // Get lines and requester for each requisition
    const requisitionsWithLines = await Promise.all(
      requisitions.map(async (req) => {
        const lines = await db
          .select()
          .from(itemRequisitionLines)
          .where(eq(itemRequisitionLines.requisitionId, req.id))
          .orderBy(itemRequisitionLines.lineNumber);
        
        const [requester] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, req.requesterId));
        
        const [workOrder] = await db
          .select()
          .from(workOrders)
          .where(eq(workOrders.id, req.workOrderId));
        
        return { ...req, lines, requester, workOrder };
      })
    );
    
    return requisitionsWithLines;
  }

  async getItemRequisitionsByStoreManager(): Promise<any[]> {
    // Get requisitions that have been approved by foreman and are pending store review
    const requisitions = await db
      .select()
      .from(itemRequisitions)
      .where(eq(itemRequisitions.status, 'pending_store'))
      .orderBy(desc(itemRequisitions.createdAt));
    
    // Get lines, requester, and work order for each requisition
    const requisitionsWithLines = await Promise.all(
      requisitions.map(async (req) => {
        // Only get lines that have been approved by foreman
        const lines = await db
          .select()
          .from(itemRequisitionLines)
          .where(
            and(
              eq(itemRequisitionLines.requisitionId, req.id),
              eq(itemRequisitionLines.foremanStatus, 'approved')
            )
          )
          .orderBy(itemRequisitionLines.lineNumber);
        
        // Calculate available stock for each line
        const linesWithStock = await Promise.all(
          lines.map(async (line) => {
            if (line.sparePartId) {
              // Get the spare part to check its stock quantity
              const [part] = await db
                .select()
                .from(spareParts)
                .where(eq(spareParts.id, line.sparePartId));
              
              const totalStock = part?.stockQuantity || 0;
              
              // Determine stock status
              let stockStatus = 'out_of_stock';
              if (totalStock >= line.quantityRequested) {
                stockStatus = 'in_stock';
              } else if (totalStock > 0) {
                stockStatus = 'low_stock';
              }
              
              return { 
                ...line, 
                availableStock: totalStock,
                stockStatus
              };
            }
            return { ...line, availableStock: 0, stockStatus: 'unknown' };
          })
        );
        
        const [requester] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, req.requesterId));
        
        const [workOrder] = req.workOrderId
          ? await db.select().from(workOrders).where(eq(workOrders.id, req.workOrderId))
          : [null];
        
        return { ...req, lines: linesWithStock, requester, workOrder };
      })
    );
    
    return requisitionsWithLines;
  }

  async approveItemRequisitionByForeman(requisitionId: string, foremanId: string, remarks?: string): Promise<void> {
    await db
      .update(itemRequisitions)
      .set({
        foremanApprovalStatus: 'approved',
        foremanApprovedById: foremanId,
        foremanApprovedAt: new Date(),
        foremanRemarks: remarks,
        status: 'pending_store',
      })
      .where(eq(itemRequisitions.id, requisitionId));
  }

  async rejectItemRequisitionByForeman(requisitionId: string, foremanId: string, remarks?: string): Promise<void> {
    await db
      .update(itemRequisitions)
      .set({
        foremanApprovalStatus: 'rejected',
        foremanApprovedById: foremanId,
        foremanApprovedAt: new Date(),
        foremanRemarks: remarks,
        status: 'rejected',
      })
      .where(eq(itemRequisitions.id, requisitionId));
  }

  async approveItemRequisitionByStoreManager(requisitionId: string, storeManagerId: string, remarks?: string): Promise<void> {
    // Execute everything in a transaction to prevent race conditions
    await db.transaction(async (tx) => {
      // Get requisition details with row lock
      const [requisition] = await tx
        .select()
        .from(itemRequisitions)
        .where(eq(itemRequisitions.id, requisitionId))
        .for('update')
        .limit(1);

      if (!requisition) {
        throw new Error("Requisition not found");
      }

      // Get all requisition lines
      const lines = await tx
        .select()
        .from(itemRequisitionLines)
        .where(eq(itemRequisitionLines.requisitionId, requisitionId));

      let hasBackorders = false;

      // Process each line for stock deduction and purchase requests
      for (const line of lines) {
        if (line.sparePartId) {
          const quantityNeeded = line.quantityApproved || line.quantityRequested;
          
          // Get available stock for this part with row lock
          const [part] = await tx
            .select()
            .from(spareParts)
            .where(eq(spareParts.id, line.sparePartId))
            .for('update');

          if (!part) continue;

          const availableStock = part.stockQuantity || 0;
          let remainingQuantity = quantityNeeded;
          
          // Deduct from available stock
          if (availableStock > 0) {
            const deductQuantity = Math.min(availableStock, quantityNeeded);
            const newQuantity = availableStock - deductQuantity;
            
            // Update the stock quantity
            await tx
              .update(spareParts)
              .set({ stockQuantity: newQuantity })
              .where(eq(spareParts.id, line.sparePartId));
            
            // Create parts receipt record to track issued parts
            if (requisition.workOrderId && deductQuantity > 0) {
              await tx.insert(partsReceipts).values({
                workOrderId: requisition.workOrderId,
                requisitionLineId: line.id,
                sparePartId: line.sparePartId,
                quantityIssued: deductQuantity,
                issuedById: storeManagerId,
                issuedAt: new Date(),
              });
            }
            
            remainingQuantity -= deductQuantity;
          }

          // If stock is insufficient, create purchase request
          if (remainingQuantity > 0) {
            hasBackorders = true;
            
            // Generate purchase request number atomically using PostgreSQL advisory lock
            const currentYear = new Date().getFullYear();
            const prefix = `PO-${currentYear}-`;
            
            // Use advisory lock to ensure atomic number generation even when table is empty
            // Lock key is hash of year to ensure separate sequences per year
            const lockKey = currentYear; // Advisory lock key
            
            // Acquire advisory lock first
            await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
            
            // Then get the next number using a simpler approach
            const pattern = `PO-${currentYear}-%`;
            const result = await tx.execute(sql`
              SELECT COALESCE(
                MAX(
                  CAST(
                    SUBSTRING(purchase_request_number FROM LENGTH(${prefix}) + 1) AS INTEGER
                  )
                ), 0) + 1 AS num
              FROM purchase_requests
              WHERE purchase_request_number LIKE ${pattern}
            `);
            
            const nextNum = (result.rows[0] as any).num;
            const purchaseRequestNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

            // Create purchase request
            await tx.insert(purchaseRequests).values({
              purchaseRequestNumber,
              requisitionLineId: line.id,
              storeManagerId,
              quantityRequested: remainingQuantity,
              status: 'pending',
            });

            // Update line status to indicate backorder
            await tx
              .update(itemRequisitionLines)
              .set({ 
                status: 'backordered',
                remarks: `Pending purchase: ${remainingQuantity} units ordered`
              })
              .where(eq(itemRequisitionLines.id, line.id));
          } else {
            // Sufficient stock - mark as fulfilled
            await tx
              .update(itemRequisitionLines)
              .set({ status: 'fulfilled' })
              .where(eq(itemRequisitionLines.id, line.id));
          }
        }
      }

      // Determine final requisition status
      const finalStatus = hasBackorders ? 'waiting_purchase' : 'approved';

      // Update requisition status
      await tx
        .update(itemRequisitions)
        .set({
          storeApprovalStatus: 'approved',
          storeApprovedById: storeManagerId,
          storeApprovedAt: new Date(),
          storeRemarks: remarks,
          status: finalStatus,
        })
        .where(eq(itemRequisitions.id, requisitionId));

      // If work order is waiting for these parts and no backorders, update to in_progress
      if (!hasBackorders && requisition.workOrderId) {
        const [workOrder] = await tx
          .select()
          .from(workOrders)
          .where(eq(workOrders.id, requisition.workOrderId))
          .limit(1);

        if (workOrder && workOrder.status === 'awaiting_parts') {
          await tx
            .update(workOrders)
            .set({ status: 'in_progress' })
            .where(eq(workOrders.id, requisition.workOrderId));
          
          // Resume timer when items are issued
          await tx.insert(workOrderTimeTracking).values({
            workOrderId: requisition.workOrderId,
            event: "resume",
            reason: "parts_issued",
            triggeredById: storeManagerId,
          });
        }
      }
    });
  }

  async rejectItemRequisitionByStoreManager(requisitionId: string, storeManagerId: string, remarks?: string): Promise<void> {
    await db
      .update(itemRequisitions)
      .set({
        storeApprovalStatus: 'rejected',
        storeApprovedById: storeManagerId,
        storeApprovedAt: new Date(),
        storeRemarks: remarks,
        status: 'rejected',
      })
      .where(eq(itemRequisitions.id, requisitionId));
  }

  async processItemRequisitionLineDecisions(
    requisitionId: string,
    storeManagerId: string,
    lineDecisions: Array<{
      lineId: string;
      action: 'approve' | 'reject' | 'backorder';
      quantityApproved?: number;
      remarks?: string;
    }>,
    generalRemarks?: string
  ): Promise<void> {
    await db.transaction(async (tx) => {
      // Get requisition details with row lock
      const [requisition] = await tx
        .select()
        .from(itemRequisitions)
        .where(eq(itemRequisitions.id, requisitionId))
        .for('update')
        .limit(1);

      if (!requisition) {
        throw new Error("Requisition not found");
      }

      let hasBackorders = false;
      let hasRejected = false;
      let hasApproved = false;

      // Process each line decision
      for (const decision of lineDecisions) {
        const [line] = await tx
          .select()
          .from(itemRequisitionLines)
          .where(eq(itemRequisitionLines.id, decision.lineId))
          .limit(1);

        if (!line) continue;

        if (decision.action === 'reject') {
          // Reject the line
          hasRejected = true;
          await tx
            .update(itemRequisitionLines)
            .set({
              status: 'rejected',
              quantityApproved: 0,
              remarks: decision.remarks || 'Rejected by store manager',
            })
            .where(eq(itemRequisitionLines.id, decision.lineId));
        } else if (decision.action === 'approve') {
          // Approve the line
          hasApproved = true;
          const quantityNeeded = decision.quantityApproved || line.quantityRequested;

          if (line.sparePartId) {
            // Get available stock for this part with row lock
            const [part] = await tx
              .select()
              .from(spareParts)
              .where(eq(spareParts.id, line.sparePartId))
              .for('update');

            if (!part) {
              // Part not found, skip
              continue;
            }

            const availableStock = part.stockQuantity || 0;
            let remainingQuantity = quantityNeeded;

            // Deduct from available stock
            if (availableStock > 0) {
              const deductQuantity = Math.min(availableStock, quantityNeeded);
              const newQuantity = availableStock - deductQuantity;

              // Update the stock quantity
              await tx
                .update(spareParts)
                .set({ stockQuantity: newQuantity })
                .where(eq(spareParts.id, line.sparePartId));

              // Create parts receipt record to track issued parts
              if (requisition.workOrderId && deductQuantity > 0) {
                await tx.insert(partsReceipts).values({
                  workOrderId: requisition.workOrderId,
                  requisitionLineId: line.id,
                  sparePartId: line.sparePartId,
                  quantityIssued: deductQuantity,
                  issuedById: storeManagerId,
                  issuedAt: new Date(),
                });
              }

              remainingQuantity -= deductQuantity;
            }

            // If stock is insufficient, create purchase request
            if (remainingQuantity > 0) {
              hasBackorders = true;

              // Generate purchase request number
              const currentYear = new Date().getFullYear();
              const prefix = `PO-${currentYear}-`;
              const lockKey = currentYear;

              // Acquire advisory lock first
              await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
              
              // Then get the next number using a simpler approach
              const pattern = `PO-${currentYear}-%`;
              const result = await tx.execute(sql`
                SELECT COALESCE(
                  MAX(
                    CAST(
                      SUBSTRING(purchase_request_number FROM LENGTH(${prefix}) + 1) AS INTEGER
                    )
                  ), 0) + 1 AS num
                FROM purchase_requests
                WHERE purchase_request_number LIKE ${pattern}
              `);

              const nextNum = (result.rows[0] as any).num;
              const purchaseRequestNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

              // Create purchase request
              await tx.insert(purchaseRequests).values({
                purchaseRequestNumber,
                requisitionLineId: line.id,
                requestedById: requisition.requesterId,
                foremanApprovedById: requisition.foremanApprovedById || null,
                storeManagerId,
                quantityRequested: remainingQuantity,
                status: 'pending',
                dateRequested: requisition.createdAt,
                dateApproved: new Date(),
              });

              // Update line status to backordered with partial fulfillment
              await tx
                .update(itemRequisitionLines)
                .set({
                  status: 'backordered',
                  quantityApproved: quantityNeeded - remainingQuantity,
                  remarks: decision.remarks || `Partial fulfillment: ${quantityNeeded - remainingQuantity} issued, ${remainingQuantity} units on order (${purchaseRequestNumber})`,
                })
                .where(eq(itemRequisitionLines.id, decision.lineId));
            } else {
              // Sufficient stock - mark as fulfilled
              await tx
                .update(itemRequisitionLines)
                .set({
                  status: 'fulfilled',
                  quantityApproved: quantityNeeded,
                  remarks: decision.remarks,
                })
                .where(eq(itemRequisitionLines.id, decision.lineId));
            }
          } else {
            // No spare part ID, just mark as approved
            await tx
              .update(itemRequisitionLines)
              .set({
                status: 'approved',
                quantityApproved: quantityNeeded,
                remarks: decision.remarks,
              })
              .where(eq(itemRequisitionLines.id, decision.lineId));
          }
        } else if (decision.action === 'backorder') {
          // Manually backorder the line
          hasBackorders = true;

          // Generate purchase request number
          const currentYear = new Date().getFullYear();
          const prefix = `PO-${currentYear}-`;
          const lockKey = currentYear;

          // Acquire advisory lock first
          await tx.execute(sql`SELECT pg_advisory_xact_lock(${lockKey})`);
          
          // Then get the next number using a simpler approach
          const pattern = `PO-${currentYear}-%`;
          const result = await tx.execute(sql`
            SELECT COALESCE(
              MAX(
                CAST(
                  SUBSTRING(purchase_request_number FROM LENGTH(${prefix}) + 1) AS INTEGER
                )
              ), 0) + 1 AS num
            FROM purchase_requests
            WHERE purchase_request_number LIKE ${pattern}
          `);

          const nextNum = (result.rows[0] as any).num;
          const purchaseRequestNumber = `${prefix}${String(nextNum).padStart(3, '0')}`;

          const quantityNeeded = decision.quantityApproved || line.quantityRequested;

          // Create purchase request
          await tx.insert(purchaseRequests).values({
            purchaseRequestNumber,
            requisitionLineId: line.id,
            requestedById: requisition.requesterId,
            foremanApprovedById: requisition.foremanApprovedById || null,
            storeManagerId,
            quantityRequested: quantityNeeded,
            status: 'pending',
            dateRequested: requisition.createdAt,
            dateApproved: new Date(),
          });

          // Update line status to backordered
          await tx
            .update(itemRequisitionLines)
            .set({
              status: 'backordered',
              quantityApproved: 0,
              remarks: decision.remarks || `Backordered: ${quantityNeeded} units ordered (${purchaseRequestNumber})`,
            })
            .where(eq(itemRequisitionLines.id, decision.lineId));
        }
      }

      // Determine final requisition status
      let finalStatus = 'pending_store';
      if (hasRejected && !hasApproved && !hasBackorders) {
        finalStatus = 'rejected';
      } else if (hasApproved && !hasBackorders) {
        // All items approved with sufficient stock
        finalStatus = 'approved';
      } else if (hasBackorders) {
        // Some or all items need to be purchased
        finalStatus = 'waiting_purchase';
      }

      // Update requisition status
      await tx
        .update(itemRequisitions)
        .set({
          storeApprovalStatus: hasApproved || hasBackorders ? 'approved' : hasRejected ? 'rejected' : 'pending',
          storeApprovedById: storeManagerId,
          storeApprovedAt: new Date(),
          storeRemarks: generalRemarks,
          status: finalStatus,
        })
        .where(eq(itemRequisitions.id, requisitionId));

      // Update work order status based on requisition outcome
      if (requisition.workOrderId) {
        const [workOrder] = await tx
          .select()
          .from(workOrders)
          .where(eq(workOrders.id, requisition.workOrderId))
          .limit(1);

        if (workOrder) {
          let newWorkOrderStatus = workOrder.status;

          if (hasBackorders && !hasApproved) {
            // All items on backorder - waiting for purchase
            newWorkOrderStatus = 'waiting_purchase';
          } else if (hasBackorders && hasApproved) {
            // Partial fulfillment - some items issued, some on backorder
            newWorkOrderStatus = 'waiting_purchase';
          } else if (hasApproved && !hasBackorders) {
            // All items issued - can proceed to work
            newWorkOrderStatus = 'in_progress';
          }

          if (newWorkOrderStatus !== workOrder.status) {
            await tx
              .update(workOrders)
              .set({ status: newWorkOrderStatus })
              .where(eq(workOrders.id, requisition.workOrderId));
            
            // Pause timer when waiting for purchase, resume when items issued
            if (newWorkOrderStatus === 'waiting_purchase') {
              await tx.insert(workOrderTimeTracking).values({
                workOrderId: requisition.workOrderId,
                event: "pause",
                reason: "waiting_purchase",
                triggeredById: storeManagerId,
              });
            } else if (newWorkOrderStatus === 'in_progress' && 
                      (workOrder.status === 'awaiting_parts' || workOrder.status === 'waiting_purchase')) {
              await tx.insert(workOrderTimeTracking).values({
                workOrderId: requisition.workOrderId,
                event: "resume",
                reason: "parts_issued",
                triggeredById: storeManagerId,
              });
            }
          }
        }
      }
    });
  }

  async getPurchaseRequests(): Promise<any[]> {
    const requests = await db
      .select()
      .from(purchaseRequests)
      .orderBy(desc(purchaseRequests.createdAt));

    // Enrich with line item, requisition, spare part, and employee details
    const enrichedRequests = await Promise.all(
      requests.map(async (request) => {
        const [line] = await db
          .select()
          .from(itemRequisitionLines)
          .where(eq(itemRequisitionLines.id, request.requisitionLineId))
          .limit(1);

        let requisition = null;
        let sparePart = null;
        let requestedBy = null;
        let foremanApprovedBy = null;
        let storeManager = null;

        if (line) {
          [requisition] = await db
            .select()
            .from(itemRequisitions)
            .where(eq(itemRequisitions.id, line.requisitionId))
            .limit(1);

          if (line.sparePartId) {
            [sparePart] = await db
              .select()
              .from(spareParts)
              .where(eq(spareParts.id, line.sparePartId))
              .limit(1);
          }
        }

        // Get employee details
        if (request.requestedById) {
          [requestedBy] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, request.requestedById))
            .limit(1);
        }

        if (request.foremanApprovedById) {
          [foremanApprovedBy] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, request.foremanApprovedById))
            .limit(1);
        }

        if (request.storeManagerId) {
          [storeManager] = await db
            .select()
            .from(employees)
            .where(eq(employees.id, request.storeManagerId))
            .limit(1);
        }

        return {
          ...request,
          lineItem: line,
          requisition,
          sparePart,
          requestedBy,
          foremanApprovedBy,
          storeManager,
        };
      })
    );

    return enrichedRequests;
  }

  async getPurchaseRequestById(id: string): Promise<any> {
    const [request] = await db
      .select()
      .from(purchaseRequests)
      .where(eq(purchaseRequests.id, id))
      .limit(1);

    if (!request) {
      throw new Error("Purchase request not found");
    }

    // Enrich with line item, requisition, spare part, and employee details
    const [line] = await db
      .select()
      .from(itemRequisitionLines)
      .where(eq(itemRequisitionLines.id, request.requisitionLineId))
      .limit(1);

    let requisition = null;
    let sparePart = null;
    let requestedBy = null;
    let foremanApprovedBy = null;
    let storeManager = null;

    if (line) {
      [requisition] = await db
        .select()
        .from(itemRequisitions)
        .where(eq(itemRequisitions.id, line.requisitionId))
        .limit(1);

      if (line.sparePartId) {
        [sparePart] = await db
          .select()
          .from(spareParts)
          .where(eq(spareParts.id, line.sparePartId))
          .limit(1);
      }
    }

    // Get employee details
    if (request.requestedById) {
      [requestedBy] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, request.requestedById))
        .limit(1);
    }

    if (request.foremanApprovedById) {
      [foremanApprovedBy] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, request.foremanApprovedById))
        .limit(1);
    }

    if (request.storeManagerId) {
      [storeManager] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, request.storeManagerId))
        .limit(1);
    }

    return {
      ...request,
      lineItem: line,
      requisition,
      sparePart,
      requestedBy,
      foremanApprovedBy,
      storeManager,
    };
  }

  async updatePurchaseRequest(id: string, data: Partial<typeof purchaseRequests.$inferInsert>): Promise<void> {
    await db.transaction(async (tx) => {
      // Get the purchase request
      const [purchaseRequest] = await tx
        .select()
        .from(purchaseRequests)
        .where(eq(purchaseRequests.id, id))
        .limit(1);

      if (!purchaseRequest) {
        throw new Error("Purchase request not found");
      }

      // If marking as received, update stock
      if (data.status === 'received' && data.quantityReceived) {
        const [line] = await tx
          .select()
          .from(itemRequisitionLines)
          .where(eq(itemRequisitionLines.id, purchaseRequest.requisitionLineId))
          .limit(1);

        if (line && line.sparePartId) {
          // Add received quantity to stock
          const [part] = await tx
            .select()
            .from(spareParts)
            .where(eq(spareParts.id, line.sparePartId))
            .limit(1);

          if (part) {
            const newStock = (part.stockQuantity || 0) + data.quantityReceived;
            await tx
              .update(spareParts)
              .set({ stockQuantity: newStock })
              .where(eq(spareParts.id, line.sparePartId));
          }
        }
      }

      // Update the purchase request
      await tx
        .update(purchaseRequests)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(purchaseRequests.id, id));
    });
  }

  async confirmPartsReceipt(requisitionId: string, teamMemberId: string): Promise<void> {
    const requisition = await db.select().from(itemRequisitions).where(eq(itemRequisitions.id, requisitionId)).limit(1);
    
    if (requisition.length === 0) {
      throw new Error("Requisition not found");
    }

    if (requisition[0].requesterId !== teamMemberId) {
      throw new Error("Access denied: You can only confirm receipt for your own requisitions");
    }

    if (requisition[0].status !== 'approved') {
      throw new Error("Only approved requisitions can be confirmed as fulfilled");
    }

    const workOrderId = requisition[0].workOrderId;

    await db
      .update(itemRequisitions)
      .set({
        status: 'fulfilled',
        updatedAt: new Date(),
      })
      .where(eq(itemRequisitions.id, requisitionId));

    await db
      .update(workOrders)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async markWorkComplete(workOrderId: string, teamMemberId: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    const membership = await db
      .select()
      .from(workOrderMemberships)
      .where(and(
        eq(workOrderMemberships.workOrderId, workOrderId),
        eq(workOrderMemberships.employeeId, teamMemberId),
        eq(workOrderMemberships.role, "team_member")
      ))
      .limit(1);

    if (membership.length === 0) {
      throw new Error("Access denied: You are not assigned to this work order");
    }

    if (workOrder[0].status !== 'in_progress') {
      throw new Error("Only work orders in progress can be marked as complete");
    }

    await db
      .update(workOrders)
      .set({
        completionApprovalStatus: 'pending',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async approveWorkCompletion(workOrderId: string, foremanId: string, notes?: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    const foremanWorkshops = await db
      .select()
      .from(workOrderWorkshops)
      .innerJoin(workshops, eq(workshops.id, workOrderWorkshops.workshopId))
      .where(and(
        eq(workOrderWorkshops.workOrderId, workOrderId),
        eq(workshops.foremanId, foremanId)
      ))
      .limit(1);

    if (foremanWorkshops.length === 0) {
      throw new Error("Access denied: You are not the foreman for this work order's workshop");
    }

    if (workOrder[0].completionApprovalStatus !== 'pending') {
      throw new Error("Work order completion is not pending approval");
    }

    await db
      .update(workOrders)
      .set({
        completionApprovalStatus: 'approved',
        completionApprovedById: foremanId,
        completionApprovedAt: new Date(),
        completionApprovalNotes: notes,
        status: 'pending_verification',
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async getVerifierPendingWorkOrders(): Promise<WorkOrderWithDetails[]> {
    const pendingOrders = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.status, "pending_verification"));
    
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(order => this.getWorkOrderById(order.id))
    );
    
    return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
  }

  async approveWorkOrderVerification(workOrderId: string, verifierId: string, notes?: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    if (workOrder[0].status !== 'pending_verification') {
      throw new Error("Work order is not pending verification");
    }

    await db
      .update(workOrders)
      .set({
        verificationStatus: 'approved',
        verifiedById: verifierId,
        verifiedAt: new Date(),
        verificationNotes: notes,
        status: 'verified',
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }
  
  async markWorkOrderAsCompleted(workOrderId: string, completedById: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    if (workOrder[0].status !== 'verified') {
      throw new Error("Work order must be verified before completion");
    }

    // Check if the user is the creator of the work order
    if (workOrder[0].createdById !== completedById) {
      throw new Error("Only the work order creator can mark it as completed");
    }

    await db
      .update(workOrders)
      .set({
        status: 'completed',
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async rejectWorkOrderVerification(workOrderId: string, verifierId: string, rejectionNotes: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    if (workOrder[0].status !== 'pending_verification') {
      throw new Error("Work order is not pending verification");
    }

    await db
      .update(workOrders)
      .set({
        verificationStatus: 'rejected',
        verifiedById: verifierId,
        verifiedAt: new Date(),
        verificationNotes: rejectionNotes,
        status: 'in_progress',
        completionApprovalStatus: null,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async getSupervisorPendingWorkOrders(): Promise<WorkOrderWithDetails[]> {
    const pendingOrders = await db
      .select()
      .from(workOrders)
      .where(eq(workOrders.status, "pending_supervisor"));
    
    const ordersWithDetails = await Promise.all(
      pendingOrders.map(order => this.getWorkOrderById(order.id))
    );
    
    return ordersWithDetails.filter(order => order !== undefined) as WorkOrderWithDetails[];
  }

  async approveSupervisorSignoff(workOrderId: string, supervisorId: string, notes?: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    if (workOrder[0].status !== 'pending_supervisor') {
      throw new Error("Work order is not pending supervisor approval");
    }

    await db
      .update(workOrders)
      .set({
        approvalStatus: 'approved',
        approvedById: supervisorId,
        approvedAt: new Date(),
        approvalNotes: notes,
        status: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
  }

  async rejectSupervisorSignoff(workOrderId: string, supervisorId: string, rejectionNotes: string): Promise<void> {
    const workOrder = await db.select().from(workOrders).where(eq(workOrders.id, workOrderId)).limit(1);
    
    if (workOrder.length === 0) {
      throw new Error("Work order not found");
    }

    if (workOrder[0].status !== 'pending_supervisor') {
      throw new Error("Work order is not pending supervisor approval");
    }

    await db
      .update(workOrders)
      .set({
        approvalStatus: 'rejected',
        approvedById: supervisorId,
        approvedAt: new Date(),
        approvalNotes: rejectionNotes,
        status: 'pending_verification',
        verificationStatus: null,
        updatedAt: new Date(),
      })
      .where(eq(workOrders.id, workOrderId));
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

  // Dynamics 365 Settings Operations
  async getDynamics365Settings(): Promise<Dynamics365Settings | undefined> {
    const [result] = await db
      .select()
      .from(dynamics365Settings)
      .where(eq(dynamics365Settings.isActive, true))
      .limit(1);
    return result || undefined;
  }

  async saveDynamics365Settings(data: InsertDynamics365Settings, updatedById: string): Promise<Dynamics365Settings> {
    // Deactivate all existing settings
    await db
      .update(dynamics365Settings)
      .set({ isActive: false });

    // Create new active settings
    const [result] = await db
      .insert(dynamics365Settings)
      .values({
        ...data,
        isActive: true,
        updatedBy: updatedById,
      })
      .returning();
    return result;
  }

  async updateDynamics365TestResult(testStatus: string, testMessage?: string): Promise<void> {
    const settings = await this.getDynamics365Settings();
    if (settings) {
      await db
        .update(dynamics365Settings)
        .set({
          lastTestDate: new Date(),
          lastTestStatus: testStatus,
          lastTestMessage: testMessage || null,
        })
        .where(eq(dynamics365Settings.id, settings.id));
    }
  }

  // System Settings Operations
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [result] = await db
      .select()
      .from(systemSettings)
      .limit(1);
    return result || undefined;
  }

  async saveSystemSettings(data: InsertSystemSettings, updatedById: string): Promise<SystemSettings> {
    const existing = await this.getSystemSettings();
    
    if (existing) {
      // Update existing settings
      const [result] = await db
        .update(systemSettings)
        .set({
          ...data,
          updatedBy: updatedById,
          updatedAt: new Date(),
        })
        .where(eq(systemSettings.id, existing.id))
        .returning();
      return result;
    } else {
      // Create new settings
      const [result] = await db
        .insert(systemSettings)
        .values({
          ...data,
          updatedBy: updatedById,
        })
        .returning();
      return result;
    }
  }

  // Items (D365) Operations
  async getAllItems(): Promise<Item[]> {
    return await db
      .select()
      .from(items)
      .orderBy(desc(items.syncedAt));
  }

  async getItemById(id: string): Promise<Item | undefined> {
    const [result] = await db
      .select()
      .from(items)
      .where(eq(items.id, id));
    return result || undefined;
  }

  async getItemByItemNo(itemNo: string): Promise<Item | undefined> {
    const [result] = await db
      .select()
      .from(items)
      .where(eq(items.itemNo, itemNo));
    return result || undefined;
  }

  async createItem(data: InsertItem): Promise<Item> {
    const [result] = await db
      .insert(items)
      .values(data)
      .returning();
    return result;
  }

  async updateItem(id: string, data: Partial<InsertItem>): Promise<Item> {
    const [result] = await db
      .update(items)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(items.id, id))
      .returning();
    return result;
  }

  async deleteItem(id: string): Promise<void> {
    await db
      .delete(items)
      .where(eq(items.id, id));
  }
}

export const storage = new DatabaseStorage();
