import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Equipment Categories table - main categories for equipment
export const equipmentCategories = pgTable("equipment_categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull().unique(), // DOZER, WHEEL LOADER, EXCAVATOR, etc.
  description: text("description"),
  backgroundImage: text("background_image"), // Path to category background image
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Equipment table - stores heavy machinery information (units within categories)
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").references(() => equipmentCategories.id, { onDelete: "set null" }),
  equipmentType: text("equipment_type").notNull(), // DOZER, WHEEL LOADER, etc. (kept for backward compatibility)
  make: text("make").notNull(), // CAT, KOMATSU, VOLVO, CATERPILLAR
  model: text("model").notNull(), // D8R, D155A-5, L-90C, etc.
  plateNo: text("plate_no"),
  assetNo: text("asset_no"),
  newAssetNo: text("new_asset_no"),
  machineSerial: text("machine_serial"),
  plantNumber: text("plant_number"), // Plant/site number where equipment is assigned
  projectArea: text("project_area"), // Project area where equipment operates
  assignedDriverId: varchar("assigned_driver_id").references(() => employees.id, { onDelete: "set null" }), // Driver assigned to this equipment
  price: decimal("price", { precision: 12, scale: 2 }), // Equipment price in USD
  remarks: text("remarks"), // Notes, missing data info, special conditions
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Spare parts catalog
export const spareParts = pgTable("spare_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partNumber: text("part_number").notNull().unique(),
  partName: text("part_name").notNull(),
  description: text("description"),
  category: text("category").notNull(), // Engine, Transmission, Hydraulic, etc.
  price: decimal("price", { precision: 10, scale: 2 }),
  stockQuantity: integer("stock_quantity").default(0),
  stockStatus: text("stock_status").notNull().default("in_stock"), // in_stock, low_stock, out_of_stock
  model3dPath: text("model_3d_path"), // Path to 3D model file in object storage
  imageUrls: text("image_urls").array(), // Array of image URLs from object storage
  specifications: text("specifications"), // JSON string of technical specs
  // Manufacturing specifications - for CNC/milling/3D printing
  manufacturingSpecs: text("manufacturing_specs"), // JSON: {dimensions: {length, width, height, unit}, material, tolerance, weight, cadFormats: ["STL", "STEP", "GLTF"]}
  // Maintenance information
  locationInstructions: text("location_instructions"), // Where to find the part on machinery
  tutorialVideoUrl: text("tutorial_video_url"), // Video tutorial for replacement
  tutorialAnimationUrl: text("tutorial_animation_url"), // Animated tutorial (GIF/WebM for offline support)
  requiredTools: text("required_tools").array(), // List of tools needed
  installTimeMinutes: integer("install_time_minutes"), // Time estimate in minutes (JSON: {beginner, average, expert})
  installTimeEstimates: text("install_time_estimates"), // JSON string: {"beginner": 120, "average": 60, "expert": 30}
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Join table for equipment-parts compatibility
export const equipmentPartsCompatibility = pgTable("equipment_parts_compatibility", {
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  partId: varchar("part_id").notNull().references(() => spareParts.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.equipmentId, table.partId] }),
}));

// Make/Model compatibility table for parts
export const partCompatibility = pgTable("part_compatibility", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => spareParts.id, { onDelete: "cascade" }),
  make: text("make").notNull(), // CAT, KOMATSU, etc.
  model: text("model"), // D8R, L-90C, etc. (null means compatible with all models of this make)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const equipmentCategoriesRelations = relations(equipmentCategories, ({ many }) => ({
  equipment: many(equipment),
}));

export const equipmentRelations = relations(equipment, ({ one, many }) => ({
  category: one(equipmentCategories, {
    fields: [equipment.categoryId],
    references: [equipmentCategories.id],
  }),
  compatibilityRecords: many(equipmentPartsCompatibility),
}));

export const sparePartsRelations = relations(spareParts, ({ many }) => ({
  compatibilityRecords: many(equipmentPartsCompatibility),
  makeModelCompatibility: many(partCompatibility),
}));

export const equipmentPartsCompatibilityRelations = relations(equipmentPartsCompatibility, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentPartsCompatibility.equipmentId],
    references: [equipment.id],
  }),
  part: one(spareParts, {
    fields: [equipmentPartsCompatibility.partId],
    references: [spareParts.id],
  }),
}));

export const partCompatibilityRelations = relations(partCompatibility, ({ one }) => ({
  part: one(spareParts, {
    fields: [partCompatibility.partId],
    references: [spareParts.id],
  }),
}));

// Insert schemas
export const insertEquipmentCategorySchema = createInsertSchema(equipmentCategories).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentSchema = createInsertSchema(equipment).omit({
  id: true,
  createdAt: true,
});

export const insertSparePartSchema = createInsertSchema(spareParts).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentPartsCompatibilitySchema = createInsertSchema(equipmentPartsCompatibility).omit({
  createdAt: true,
});

export const insertPartCompatibilitySchema = createInsertSchema(partCompatibility).omit({
  id: true,
  createdAt: true,
});

// Select types
export type EquipmentCategory = typeof equipmentCategories.$inferSelect;
export type InsertEquipmentCategory = z.infer<typeof insertEquipmentCategorySchema>;
export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type SparePart = typeof spareParts.$inferSelect;
export type InsertSparePart = z.infer<typeof insertSparePartSchema>;
export type EquipmentPartsCompatibility = typeof equipmentPartsCompatibility.$inferSelect;
export type InsertEquipmentPartsCompatibility = z.infer<typeof insertEquipmentPartsCompatibilitySchema>;
export type PartCompatibility = typeof partCompatibility.$inferSelect;
export type InsertPartCompatibility = z.infer<typeof insertPartCompatibilitySchema>;

// Users table for authentication and authorization
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(), // Hashed password
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("user"), // CEO, admin, user
  language: text("language").notNull().default("en"), // en, am (English, Amharic)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Mechanics/Technicians table
export const mechanics = pgTable("mechanics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  specialty: text("specialty"), // Engine, Hydraulic, Electrical, etc.
  phoneNumber: text("phone_number"),
  email: text("email"),
  employeeId: text("employee_id"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Maintenance Records table
export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  mechanicId: varchar("mechanic_id").references(() => mechanics.id),
  maintenanceType: text("maintenance_type").notNull(), // Routine, Repair, Emergency, Inspection
  description: text("description").notNull(),
  operatingHours: integer("operating_hours"), // Machine hours at time of maintenance
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }), // Hours spent on maintenance
  cost: decimal("cost", { precision: 10, scale: 2 }), // Total maintenance cost
  status: text("status").notNull().default("completed"), // scheduled, in_progress, completed
  maintenanceDate: timestamp("maintenance_date").notNull(),
  completedDate: timestamp("completed_date"),
  notes: text("notes"), // Additional observations
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Parts usage history - tracks parts used during maintenance
export const partsUsageHistory = pgTable("parts_usage_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  maintenanceRecordId: varchar("maintenance_record_id").notNull().references(() => maintenanceRecords.id, { onDelete: "cascade" }),
  partId: varchar("part_id").notNull().references(() => spareParts.id),
  quantity: integer("quantity").notNull().default(1),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  notes: text("notes"), // Condition, replacement reason, etc.
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Operating behavior reports
export const operatingBehaviorReports = pgTable("operating_behavior_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  reportDate: timestamp("report_date").notNull(),
  operatingHours: integer("operating_hours").notNull(), // Total hours at time of report
  fuelConsumption: decimal("fuel_consumption", { precision: 10, scale: 2 }), // Liters/gallons
  productivity: text("productivity"), // Performance metrics
  issuesReported: text("issues_reported"), // Any problems noted
  operatorNotes: text("operator_notes"),
  performanceRating: integer("performance_rating"), // 1-5 scale
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for maintenance system
export const mechanicsRelations = relations(mechanics, ({ many }) => ({
  maintenanceRecords: many(maintenanceRecords),
}));

export const maintenanceRecordsRelations = relations(maintenanceRecords, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [maintenanceRecords.equipmentId],
    references: [equipment.id],
  }),
  mechanic: one(mechanics, {
    fields: [maintenanceRecords.mechanicId],
    references: [mechanics.id],
  }),
  partsUsed: many(partsUsageHistory),
}));

export const partsUsageHistoryRelations = relations(partsUsageHistory, ({ one }) => ({
  maintenanceRecord: one(maintenanceRecords, {
    fields: [partsUsageHistory.maintenanceRecordId],
    references: [maintenanceRecords.id],
  }),
  part: one(spareParts, {
    fields: [partsUsageHistory.partId],
    references: [spareParts.id],
  }),
}));

export const operatingBehaviorReportsRelations = relations(operatingBehaviorReports, ({ one }) => ({
  equipment: one(equipment, {
    fields: [operatingBehaviorReports.equipmentId],
    references: [equipment.id],
  }),
}));

// Insert schemas for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for maintenance system
export const insertMechanicSchema = createInsertSchema(mechanics).omit({
  id: true,
  createdAt: true,
});

export const insertMaintenanceRecordSchema = createInsertSchema(maintenanceRecords).omit({
  id: true,
  createdAt: true,
});

export const insertPartsUsageHistorySchema = createInsertSchema(partsUsageHistory).omit({
  id: true,
  createdAt: true,
});

export const insertOperatingBehaviorReportSchema = createInsertSchema(operatingBehaviorReports).omit({
  id: true,
  createdAt: true,
});

// Select types for users
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Select types for maintenance system
export type Mechanic = typeof mechanics.$inferSelect;
export type InsertMechanic = z.infer<typeof insertMechanicSchema>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;
export type InsertMaintenanceRecord = z.infer<typeof insertMaintenanceRecordSchema>;
export type PartsUsageHistory = typeof partsUsageHistory.$inferSelect;
export type InsertPartsUsageHistory = z.infer<typeof insertPartsUsageHistorySchema>;
export type OperatingBehaviorReport = typeof operatingBehaviorReports.$inferSelect;
export type InsertOperatingBehaviorReport = z.infer<typeof insertOperatingBehaviorReportSchema>;

// Extended types with relations
export type SparePartWithCompatibility = SparePart & {
  compatibleMakes?: string[];
  compatibleModels?: string[];
};

export type MaintenanceRecordWithDetails = MaintenanceRecord & {
  mechanic?: Mechanic;
  partsUsed?: (PartsUsageHistory & { part?: SparePart })[];
};

export type EquipmentWithMaintenanceHistory = Equipment & {
  maintenanceRecords?: MaintenanceRecordWithDetails[];
  operatingReports?: OperatingBehaviorReport[];
};

// ============================================
// GARAGE MANAGEMENT SYSTEM
// ============================================

// Garages/Workshops table - Physical locations for equipment and maintenance
export const garages = pgTable("garages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // "Main Workshop", "Field Station 1", etc.
  location: text("location").notNull(), // Address or site location
  type: text("type").notNull(), // "workshop", "field_station", "warehouse"
  capacity: integer("capacity"), // Max equipment capacity
  contactPerson: text("contact_person"),
  phoneNumber: text("phone_number"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Repair Bays within garages
export const repairBays = pgTable("repair_bays", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id, { onDelete: "cascade" }),
  bayNumber: text("bay_number").notNull(), // "Bay 1", "A-1", etc.
  bayType: text("bay_type").notNull(), // "heavy_equipment", "light_vehicle", "diagnostic", "wash"
  status: text("status").notNull().default("available"), // available, occupied, maintenance, closed
  currentEquipmentId: varchar("current_equipment_id").references(() => equipment.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employees table - Comprehensive employee management (mechanics, wash staff, etc.)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull().unique(), // Company employee ID
  deviceUserId: text("device_user_id").unique(), // ZKTeco attendance device user ID
  fullName: text("full_name").notNull(),
  role: text("role").notNull(), // "mechanic", "wash_employee", "supervisor", "painter", "body_worker", "electrician", "technician"
  specialty: text("specialty"), // For mechanics: "Engine", "Hydraulic", "Electrical"
  phoneNumber: text("phone_number"),
  email: text("email"),
  profilePicture: text("profile_picture"), // Path to employee photo
  garageId: varchar("garage_id").references(() => garages.id), // Primary garage assignment
  department: text("department"), // Department assignment: "mechanical", "electrical", "paint", "body", "wash", "general"
  canApprove: boolean("can_approve").default(false), // Can approve work orders and parts requests
  approvalLimit: decimal("approval_limit", { precision: 12, scale: 2 }), // Maximum amount they can approve (in currency)
  supervisorId: varchar("supervisor_id").references((): any => employees.id), // Their supervisor/department head
  isActive: boolean("is_active").default(true).notNull(),
  hireDate: timestamp("hire_date"),
  certifications: text("certifications").array(), // List of certifications
  language: text("language").default("en"), // Preferred language: en, am
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Work Orders - Proper workflow for mechanics
export const workOrders = pgTable("work_orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderNumber: text("work_order_number").notNull().unique(), // WO-2025-001
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  garageId: varchar("garage_id").references(() => garages.id),
  repairBayId: varchar("repair_bay_id").references(() => repairBays.id),
  assignedToIds: text("assigned_to_ids").array(), // Array of assigned employee IDs (team assignment)
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  workType: text("work_type").notNull(), // "repair", "maintenance", "inspection", "wash"
  description: text("description").notNull(),
  status: text("status").notNull().default("pending"), // pending, assigned, in_progress, completed, cancelled
  estimatedHours: decimal("estimated_hours", { precision: 5, scale: 2 }),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  estimatedCost: decimal("estimated_cost", { precision: 12, scale: 2 }), // Estimated total cost
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }), // Actual total cost
  approvalStatus: text("approval_status").default("not_required"), // not_required, pending, approved, rejected
  approvedById: varchar("approved_by_id").references(() => employees.id), // Supervisor who approved
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  completionApprovalStatus: text("completion_approval_status").default("not_required"), // For job completion approval
  completionApprovedById: varchar("completion_approved_by_id").references(() => employees.id),
  completionApprovedAt: timestamp("completion_approved_at"),
  completionApprovalNotes: text("completion_approval_notes"),
  notes: text("notes"),
  createdById: varchar("created_by_id").references(() => users.id),
  scheduledDate: timestamp("scheduled_date"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Work Order Required Parts - Junction table for parts needed in work orders
export const workOrderRequiredParts = pgTable("work_order_required_parts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  sparePartId: varchar("spare_part_id").references(() => spareParts.id, { onDelete: "set null" }),
  partName: text("part_name").notNull(), // Denormalized for history
  partNumber: text("part_number").notNull(), // Denormalized for history
  stockStatus: text("stock_status"), // Denormalized snapshot
  quantity: integer("quantity").default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Standard Operating Procedures (SOPs) - For wash staff and other tasks
export const standardOperatingProcedures = pgTable("standard_operating_procedures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sopCode: text("sop_code").notNull().unique(), // SOP-WASH-001, SOP-MAINT-001
  title: text("title").notNull(),
  category: text("category").notNull(), // "wash", "maintenance", "safety", "inspection"
  targetRole: text("target_role").notNull(), // "wash_staff", "mechanic", "all"
  description: text("description").notNull(),
  steps: text("steps").notNull(), // JSON array of step objects: [{step: 1, instruction: "...", safetyNote: "..."}]
  requiredEquipment: text("required_equipment").array(), // Tools/equipment needed
  estimatedTimeMinutes: integer("estimated_time_minutes"),
  safetyRequirements: text("safety_requirements").array(), // PPE, safety measures
  videoUrl: text("video_url"), // Tutorial video
  documentUrl: text("document_url"), // PDF or document link
  language: text("language").default("en"), // en, am for bilingual support
  version: text("version").default("1.0"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parts Storage Locations - Track where parts are stored
export const partsStorageLocations = pgTable("parts_storage_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => spareParts.id, { onDelete: "cascade" }),
  garageId: varchar("garage_id").references(() => garages.id),
  location: text("location").notNull(), // "Shelf A-12", "Bin 45", "Warehouse Zone C"
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").default(0), // Reorder level
  notes: text("notes"),
  lastRestocked: timestamp("last_restocked"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Equipment Location Tracking - Track which equipment is in which garage
export const equipmentLocations = pgTable("equipment_locations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id, { onDelete: "cascade" }),
  garageId: varchar("garage_id").references(() => garages.id),
  locationStatus: text("location_status").notNull().default("in_field"), // in_field, in_garage, in_repair, in_wash, transported
  repairBayId: varchar("repair_bay_id").references(() => repairBays.id),
  arrivedAt: timestamp("arrived_at").notNull().defaultNow(),
  departedAt: timestamp("departed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ WAREHOUSE MANAGEMENT SYSTEM ============

// Warehouses - Dedicated parts storage facilities
export const warehouses = pgTable("warehouses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // "WH-001", "WH-ADDIS", "WH-TERMINAL"
  name: text("name").notNull(),
  location: text("location").notNull(),
  type: text("type").notNull().default("main"), // main, satellite, mobile
  capacity: integer("capacity"), // Total storage capacity
  managerId: varchar("manager_id").references(() => employees.id),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Warehouse Zones - Areas/sections within warehouses
export const warehouseZones = pgTable("warehouse_zones", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  warehouseId: varchar("warehouse_id").notNull().references(() => warehouses.id, { onDelete: "cascade" }),
  zoneCode: text("zone_code").notNull(), // "A", "B1", "RACK-12"
  name: text("name").notNull(), // "Zone A - Filters", "Rack 12 - Hydraulics"
  type: text("type").notNull(), // "shelf", "bin", "rack", "floor", "cage"
  row: text("row"), // For warehouse map: "A", "B"
  column: text("column"), // For warehouse map: "1", "2"
  level: integer("level"), // Shelf level: 1, 2, 3
  capacity: integer("capacity"),
  currentLoad: integer("current_load").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stock Ledger - Double-entry transaction log for all stock movements
export const stockLedger = pgTable("stock_ledger", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  transactionType: text("transaction_type").notNull(), // receive, issue, transfer, adjust, return
  partId: varchar("part_id").notNull().references(() => spareParts.id),
  fromWarehouseId: varchar("from_warehouse_id").references(() => warehouses.id),
  fromZoneId: varchar("from_zone_id").references(() => warehouseZones.id),
  toWarehouseId: varchar("to_warehouse_id").references(() => warehouses.id),
  toZoneId: varchar("to_zone_id").references(() => warehouseZones.id),
  quantity: integer("quantity").notNull(),
  unitCost: decimal("unit_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  referenceType: text("reference_type"), // work_order, purchase_order, transfer, audit
  referenceId: varchar("reference_id"), // ID of the source document
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  performedById: varchar("performed_by_id").references(() => employees.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Stock Reservations - Parts reserved for work orders
export const stockReservations = pgTable("stock_reservations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  partId: varchar("part_id").notNull().references(() => spareParts.id),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  zoneId: varchar("zone_id").references(() => warehouseZones.id),
  quantityReserved: integer("quantity_reserved").notNull(),
  quantityIssued: integer("quantity_issued").default(0),
  status: text("status").notNull().default("reserved"), // reserved, partially_issued, fully_issued, cancelled
  reservedById: varchar("reserved_by_id").references(() => employees.id),
  expiresAt: timestamp("expires_at"), // Auto-release after X hours
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reorder Rules - Automatic reorder thresholds and supplier info
export const reorderRules = pgTable("reorder_rules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  partId: varchar("part_id").notNull().references(() => spareParts.id, { onDelete: "cascade" }),
  warehouseId: varchar("warehouse_id").references(() => warehouses.id),
  minQuantity: integer("min_quantity").notNull(), // Trigger reorder
  reorderQuantity: integer("reorder_quantity").notNull(), // How much to order
  maxQuantity: integer("max_quantity"), // Maximum stock level
  leadTimeDays: integer("lead_time_days").default(7),
  supplierName: text("supplier_name"),
  supplierContact: text("supplier_contact"),
  preferredSupplier: text("preferred_supplier"),
  lastOrderDate: timestamp("last_order_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ EQUIPMENT RECEPTION/CHECK-IN SYSTEM ============

// Equipment Receptions - Check-in records when equipment arrives at garage
export const equipmentReceptions = pgTable("equipment_receptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receptionNumber: text("reception_number").notNull().unique(), // REC-2025-001
  equipmentId: varchar("equipment_id").notNull().references(() => equipment.id),
  plantNumber: text("plant_number"), // Auto-populated from equipment
  projectArea: text("project_area"), // Auto-populated from equipment
  arrivalDate: timestamp("arrival_date").notNull(), // Date of arrival (default today, user can change)
  kilometreRiding: decimal("kilometre_riding", { precision: 10, scale: 2 }), // Kilometrage at drop-off
  fuelLevel: text("fuel_level"), // "full", "3/4", "1/2", "1/4", "empty"
  reasonOfMaintenance: text("reason_of_maintenance").notNull(), // "Service", "Accident", "Damage"
  issuesReported: text("issues_reported"), // Driver's reported problems
  driverId: varchar("driver_id").notNull().references(() => employees.id), // Driver who dropped off equipment
  driverSignature: text("driver_signature"), // Base64 or URL to signature image
  
  // Admin processing fields
  serviceType: text("service_type"), // "long_term", "short_term"
  adminIssuesReported: text("admin_issues_reported"), // Issues reported by Administration Officer
  inspectionOfficerId: varchar("inspection_officer_id").references(() => employees.id), // Assigned inspection officer
  
  mechanicId: varchar("mechanic_id").references(() => employees.id),
  status: text("status").notNull().default("driver_submitted"), // driver_submitted, awaiting_mechanic, inspection_complete, work_order_created, closed
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Reception Checklists - Template for standardized inspection items
export const receptionChecklists = pgTable("reception_checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentType: text("equipment_type").notNull(), // "DOZER", "WHEEL LOADER", "EXCAVATOR", "ALL"
  role: text("role").notNull(), // "driver", "mechanic"
  category: text("category").notNull(), // "engine", "hydraulic", "electrical", "undercarriage", "cabin", "safety"
  sortOrder: integer("sort_order").default(0),
  itemDescription: text("item_description").notNull(), // "Check engine oil level", "Inspect hydraulic hoses"
  defaultSeverity: text("default_severity").default("ok"), // ok, minor, critical
  requiresPhoto: boolean("requires_photo").default(false),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reception Inspection Items - Actual inspection results
export const receptionInspectionItems = pgTable("reception_inspection_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receptionId: varchar("reception_id").notNull().references(() => equipmentReceptions.id, { onDelete: "cascade" }),
  checklistItemId: varchar("checklist_item_id").references(() => receptionChecklists.id),
  status: text("status").notNull(), // "pass", "fail", "attention_required", "not_applicable"
  severity: text("severity").notNull().default("ok"), // "ok", "minor", "critical"
  notes: text("notes"),
  requiresParts: boolean("requires_parts").default(false),
  partsSuggested: text("parts_suggested"), // JSON array of part IDs or descriptions
  photoUrl: text("photo_url"),
  recordedById: varchar("recorded_by_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Damage Reports - Visual damage marking with coordinates on equipment diagrams
export const damageReports = pgTable("damage_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receptionId: varchar("reception_id").notNull().references(() => equipmentReceptions.id, { onDelete: "cascade" }),
  viewAngle: text("view_angle").notNull(), // "front", "rear", "left", "right", "top"
  coordinateX: decimal("coordinate_x", { precision: 5, scale: 4 }), // 0.0 to 1.0 (percentage of image width)
  coordinateY: decimal("coordinate_y", { precision: 5, scale: 4 }), // 0.0 to 1.0 (percentage of image height)
  severity: text("severity").notNull(), // "minor", "moderate", "critical"
  damageType: text("damage_type"), // "dent", "scratch", "crack", "missing_part", "leak", "worn"
  description: text("description").notNull(),
  photoUrl: text("photo_url"),
  estimatedCost: decimal("estimated_cost", { precision: 10, scale: 2 }),
  markedById: varchar("marked_by_id").references(() => employees.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Repair Estimates - Generated from mechanic inspection
export const repairEstimates = pgTable("repair_estimates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  receptionId: varchar("reception_id").notNull().references(() => equipmentReceptions.id, { onDelete: "cascade" }),
  laborHours: decimal("labor_hours", { precision: 5, scale: 2 }),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),
  partsCost: decimal("parts_cost", { precision: 10, scale: 2 }),
  totalCost: decimal("total_cost", { precision: 10, scale: 2 }),
  recommendation: text("recommendation").notNull(), // "return_to_service", "repair_required", "major_overhaul", "grounded"
  priority: text("priority").notNull().default("medium"), // "low", "medium", "high", "urgent"
  estimatedCompletionDays: integer("estimated_completion_days"),
  generatedById: varchar("generated_by_id").references(() => employees.id),
  approvedById: varchar("approved_by_id").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Equipment Inspections - Formal inspection records with auto-generated numbers
export const equipmentInspections = pgTable("equipment_inspections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionNumber: text("inspection_number").notNull().unique(), // INS-YYYY-XXX
  receptionId: varchar("reception_id").notNull().references(() => equipmentReceptions.id, { onDelete: "cascade" }),
  serviceType: text("service_type").notNull(), // "long_term", "short_term"
  inspectorId: varchar("inspector_id").notNull().references(() => employees.id),
  inspectionDate: timestamp("inspection_date").defaultNow().notNull(),
  status: text("status").notNull().default("in_progress"), // in_progress, completed, approved
  overallCondition: text("overall_condition"), // "excellent", "good", "fair", "poor", "critical"
  findings: text("findings"), // General findings/notes
  recommendations: text("recommendations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Inspection Checklist Items - Individual checklist responses for inspections
export const inspectionChecklistItems = pgTable("inspection_checklist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  inspectionId: varchar("inspection_id").notNull().references(() => equipmentInspections.id, { onDelete: "cascade" }),
  itemNumber: integer("item_number").notNull(), // Sequential number in checklist
  itemDescription: text("item_description").notNull(), // Amharic item text
  hasItem: boolean("has_item"), // አለዉ
  doesNotHave: boolean("does_not_have"), // የለዉም
  isWorking: boolean("is_working"), // የሚሰራ
  notWorking: boolean("not_working"), // የማይሰራ
  isBroken: boolean("is_broken"), // የተሰበረ
  isCracked: boolean("is_cracked"), // የተሰነጠቀ
  additionalComments: text("additional_comments"), // ተጨማሪ አስተያየት
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ APPROVAL SYSTEM ============

// Parts Requests - When parts are needed for work orders
export const partsRequests = pgTable("parts_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requestNumber: text("request_number").notNull().unique(), // PR-2025-001
  workOrderId: varchar("work_order_id").references(() => workOrders.id),
  receptionId: varchar("reception_id").references(() => equipmentReceptions.id),
  requestedById: varchar("requested_by_id").notNull().references(() => employees.id),
  partsData: text("parts_data").notNull(), // JSON array of {partId, partNumber, quantity, unitCost, description}
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }),
  urgency: text("urgency").notNull().default("normal"), // low, normal, high, critical
  justification: text("justification"), // Why these parts are needed
  status: text("status").notNull().default("pending"), // pending, approved, rejected, fulfilled, cancelled
  approvalStatus: text("approval_status").default("pending"), // pending, approved, rejected
  approvedById: varchar("approved_by_id").references(() => employees.id),
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  fulfilledAt: timestamp("fulfilled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Approvals - Universal approval tracking for all approval workflows
export const approvals = pgTable("approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  approvalType: text("approval_type").notNull(), // "work_order", "work_order_completion", "parts_request", "repair_estimate"
  referenceId: varchar("reference_id").notNull(), // ID of the work order, parts request, etc.
  referenceNumber: text("reference_number"), // WO-2025-001, PR-2025-001, etc.
  requestedById: varchar("requested_by_id").notNull().references(() => employees.id),
  assignedToId: varchar("assigned_to_id").notNull().references(() => employees.id), // Supervisor who needs to approve
  status: text("status").notNull().default("pending"), // pending, approved, rejected, escalated
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  amount: decimal("amount", { precision: 12, scale: 2 }), // Cost/amount if applicable
  description: text("description").notNull(),
  requestNotes: text("request_notes"),
  responseNotes: text("response_notes"),
  respondedAt: timestamp("responded_at"),
  escalatedToId: varchar("escalated_to_id").references(() => employees.id), // If escalated to higher authority
  escalatedAt: timestamp("escalated_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============ ATTENDANCE DEVICE INTEGRATION ============

// Device Settings - Store attendance device configuration
export const attendanceDeviceSettings = pgTable("attendance_device_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceName: text("device_name").notNull(), // iFace990 Plus
  deviceModel: text("device_model"), // Device model/type
  serialNumber: text("serial_number"), // CKPG222360158
  ipAddress: text("ip_address").notNull(), // 192.168.40.2
  port: integer("port").notNull().default(4370), // Default ZKTeco port
  timeout: integer("timeout").default(5000), // Connection timeout in ms
  isActive: boolean("is_active").default(true), // Whether this device is currently active
  lastSyncAt: timestamp("last_sync_at"), // Last successful sync timestamp
  lastImportAt: timestamp("last_import_at"), // Last full import timestamp
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Device Import Log - Track import/sync operations
export const deviceImportLogs = pgTable("device_import_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceId: varchar("device_id").notNull().references(() => attendanceDeviceSettings.id, { onDelete: "cascade" }),
  operationType: text("operation_type").notNull(), // "import" or "sync"
  status: text("status").notNull(), // "success", "failed", "partial"
  usersImported: integer("users_imported").default(0),
  usersUpdated: integer("users_updated").default(0),
  usersSkipped: integer("users_skipped").default(0),
  errorMessage: text("error_message"),
  importData: text("import_data"), // JSON data of imported users
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for garage management
export const garagesRelations = relations(garages, ({ many }) => ({
  repairBays: many(repairBays),
  employees: many(employees),
  workOrders: many(workOrders),
  partsLocations: many(partsStorageLocations),
  equipmentLocations: many(equipmentLocations),
}));

export const repairBaysRelations = relations(repairBays, ({ one, many }) => ({
  garage: one(garages, {
    fields: [repairBays.garageId],
    references: [garages.id],
  }),
  currentEquipment: one(equipment, {
    fields: [repairBays.currentEquipmentId],
    references: [equipment.id],
  }),
  workOrders: many(workOrders),
  equipmentLocations: many(equipmentLocations),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  garage: one(garages, {
    fields: [employees.garageId],
    references: [garages.id],
  }),
  workOrders: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one }) => ({
  equipment: one(equipment, {
    fields: [workOrders.equipmentId],
    references: [equipment.id],
  }),
  garage: one(garages, {
    fields: [workOrders.garageId],
    references: [garages.id],
  }),
  repairBay: one(repairBays, {
    fields: [workOrders.repairBayId],
    references: [repairBays.id],
  }),
  createdBy: one(users, {
    fields: [workOrders.createdById],
    references: [users.id],
  }),
  // Note: assignedToIds is an array, so assigned employees are fetched separately
}));

export const partsStorageLocationsRelations = relations(partsStorageLocations, ({ one }) => ({
  part: one(spareParts, {
    fields: [partsStorageLocations.partId],
    references: [spareParts.id],
  }),
  garage: one(garages, {
    fields: [partsStorageLocations.garageId],
    references: [garages.id],
  }),
}));

export const equipmentLocationsRelations = relations(equipmentLocations, ({ one }) => ({
  equipment: one(equipment, {
    fields: [equipmentLocations.equipmentId],
    references: [equipment.id],
  }),
  garage: one(garages, {
    fields: [equipmentLocations.garageId],
    references: [garages.id],
  }),
  repairBay: one(repairBays, {
    fields: [equipmentLocations.repairBayId],
    references: [repairBays.id],
  }),
}));

// Insert schemas for garage management
export const insertGarageSchema = createInsertSchema(garages).omit({
  id: true,
  createdAt: true,
});

export const insertRepairBaySchema = createInsertSchema(repairBays).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
}).extend({
  workOrderNumber: z.string().optional(),
  scheduledDate: z.string().optional().nullable().transform(val => val ? new Date(val) : null),
});

export const insertWorkOrderRequiredPartSchema = createInsertSchema(workOrderRequiredParts).omit({
  id: true,
  createdAt: true,
});

export const insertStandardOperatingProcedureSchema = createInsertSchema(standardOperatingProcedures).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPartsStorageLocationSchema = createInsertSchema(partsStorageLocations).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentLocationSchema = createInsertSchema(equipmentLocations).omit({
  id: true,
  createdAt: true,
});

// Select types for garage management
export type Garage = typeof garages.$inferSelect;
export type InsertGarage = z.infer<typeof insertGarageSchema>;
export type RepairBay = typeof repairBays.$inferSelect;
export type InsertRepairBay = z.infer<typeof insertRepairBaySchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrderRequiredPart = typeof workOrderRequiredParts.$inferSelect;
export type InsertWorkOrderRequiredPart = z.infer<typeof insertWorkOrderRequiredPartSchema>;
export type StandardOperatingProcedure = typeof standardOperatingProcedures.$inferSelect;
export type InsertStandardOperatingProcedure = z.infer<typeof insertStandardOperatingProcedureSchema>;
export type PartsStorageLocation = typeof partsStorageLocations.$inferSelect;
export type InsertPartsStorageLocation = z.infer<typeof insertPartsStorageLocationSchema>;
export type EquipmentLocation = typeof equipmentLocations.$inferSelect;
export type InsertEquipmentLocation = z.infer<typeof insertEquipmentLocationSchema>;

// Extended types with relations
export type GarageWithDetails = Garage & {
  repairBays?: RepairBay[];
  employees?: Employee[];
  workOrders?: WorkOrder[];
};

export type WorkOrderWithDetails = WorkOrder & {
  equipment?: Equipment;
  garage?: Garage;
  repairBay?: RepairBay;
  assignedToList?: Employee[]; // Array of assigned employees (team)
  createdBy?: User;
  requiredParts?: WorkOrderRequiredPart[];
};

export type RepairBayWithDetails = RepairBay & {
  garage?: Garage;
  currentEquipment?: Equipment;
};

export type PartsStorageLocationWithDetails = PartsStorageLocation & {
  part?: SparePart;
  garage?: Garage;
};

// Insert schemas for warehouse management
export const insertWarehouseSchema = createInsertSchema(warehouses).omit({
  id: true,
  createdAt: true,
});

export const insertWarehouseZoneSchema = createInsertSchema(warehouseZones).omit({
  id: true,
  createdAt: true,
});

export const insertStockLedgerSchema = createInsertSchema(stockLedger).omit({
  id: true,
  createdAt: true,
});

export const insertStockReservationSchema = createInsertSchema(stockReservations).omit({
  id: true,
  createdAt: true,
});

export const insertReorderRuleSchema = createInsertSchema(reorderRules).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for equipment reception
export const insertEquipmentReceptionSchema = createInsertSchema(equipmentReceptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReceptionChecklistSchema = createInsertSchema(receptionChecklists).omit({
  id: true,
  createdAt: true,
});

export const insertReceptionInspectionItemSchema = createInsertSchema(receptionInspectionItems).omit({
  id: true,
  createdAt: true,
});

export const insertDamageReportSchema = createInsertSchema(damageReports).omit({
  id: true,
  createdAt: true,
});

export const insertRepairEstimateSchema = createInsertSchema(repairEstimates).omit({
  id: true,
  createdAt: true,
});

export const insertEquipmentInspectionSchema = createInsertSchema(equipmentInspections).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInspectionChecklistItemSchema = createInsertSchema(inspectionChecklistItems).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for approval system
export const insertPartsRequestSchema = createInsertSchema(partsRequests).omit({
  id: true,
  createdAt: true,
});

export const insertApprovalSchema = createInsertSchema(approvals).omit({
  id: true,
  createdAt: true,
});

// Select types for warehouse management
export type Warehouse = typeof warehouses.$inferSelect;
export type InsertWarehouse = z.infer<typeof insertWarehouseSchema>;
export type WarehouseZone = typeof warehouseZones.$inferSelect;
export type InsertWarehouseZone = z.infer<typeof insertWarehouseZoneSchema>;
export type StockLedger = typeof stockLedger.$inferSelect;
export type InsertStockLedger = z.infer<typeof insertStockLedgerSchema>;
export type StockReservation = typeof stockReservations.$inferSelect;
export type InsertStockReservation = z.infer<typeof insertStockReservationSchema>;
export type ReorderRule = typeof reorderRules.$inferSelect;
export type InsertReorderRule = z.infer<typeof insertReorderRuleSchema>;

// Select types for equipment reception
export type EquipmentReception = typeof equipmentReceptions.$inferSelect;
export type InsertEquipmentReception = z.infer<typeof insertEquipmentReceptionSchema>;
export type ReceptionChecklist = typeof receptionChecklists.$inferSelect;
export type InsertReceptionChecklist = z.infer<typeof insertReceptionChecklistSchema>;
export type ReceptionInspectionItem = typeof receptionInspectionItems.$inferSelect;
export type InsertReceptionInspectionItem = z.infer<typeof insertReceptionInspectionItemSchema>;
export type DamageReport = typeof damageReports.$inferSelect;
export type InsertDamageReport = z.infer<typeof insertDamageReportSchema>;
export type RepairEstimate = typeof repairEstimates.$inferSelect;
export type InsertRepairEstimate = z.infer<typeof insertRepairEstimateSchema>;
export type EquipmentInspection = typeof equipmentInspections.$inferSelect;
export type InsertEquipmentInspection = z.infer<typeof insertEquipmentInspectionSchema>;
export type InspectionChecklistItem = typeof inspectionChecklistItems.$inferSelect;
export type InsertInspectionChecklistItem = z.infer<typeof insertInspectionChecklistItemSchema>;

// Extended types with relations for reception
export type EquipmentReceptionWithDetails = EquipmentReception & {
  equipment?: Equipment;
  driver?: Employee;
  mechanic?: Employee;
  inspectionOfficer?: Employee;
  workOrder?: WorkOrder;
  inspectionItems?: ReceptionInspectionItem[];
  damageReports?: DamageReport[];
  repairEstimate?: RepairEstimate;
};

// Select types for approval system
export type PartsRequest = typeof partsRequests.$inferSelect;
export type InsertPartsRequest = z.infer<typeof insertPartsRequestSchema>;
export type Approval = typeof approvals.$inferSelect;
export type InsertApproval = z.infer<typeof insertApprovalSchema>;

// Extended types with relations for approvals
export type PartsRequestWithDetails = PartsRequest & {
  requestedBy?: Employee;
  approvedBy?: Employee;
  workOrder?: WorkOrder;
};

export type ApprovalWithDetails = Approval & {
  requestedBy?: Employee;
  assignedTo?: Employee;
  escalatedTo?: Employee;
};

// Insert schemas for attendance device
export const insertAttendanceDeviceSettingsSchema = createInsertSchema(attendanceDeviceSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeviceImportLogSchema = createInsertSchema(deviceImportLogs).omit({
  id: true,
  createdAt: true,
});

// Select types for attendance device
export type AttendanceDeviceSettings = typeof attendanceDeviceSettings.$inferSelect;
export type InsertAttendanceDeviceSettings = z.infer<typeof insertAttendanceDeviceSettingsSchema>;
export type DeviceImportLog = typeof deviceImportLogs.$inferSelect;
export type InsertDeviceImportLog = z.infer<typeof insertDeviceImportLogSchema>;
