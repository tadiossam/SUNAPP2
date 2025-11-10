import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, primaryKey, uniqueIndex } from "drizzle-orm/pg-core";
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

// REMOVED: Users table - now using employees table for all authentication
// All authentication is handled through the employees table
// Employees with role='admin' or role='ceo' have admin access

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

// User type is now an alias to Employee type (all authentication uses employees table)
export type User = Employee;
export type InsertUser = InsertEmployee;

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

// Workshops within garages
export const workshops = pgTable("workshops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  garageId: varchar("garage_id").notNull().references(() => garages.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // "Engine Workshop", "Hydraulics Shop", etc.
  foremanId: varchar("foreman_id").notNull().references(() => employees.id, { onDelete: "restrict" }), // Workshop foreman/boss (REQUIRED)
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  // Planning targets for dashboard reporting
  monthlyTarget: integer("monthly_target"), // Planned work orders per month
  q1Target: integer("q1_target"), // Q1 (Jan-Mar) target
  q2Target: integer("q2_target"), // Q2 (Apr-Jun) target
  q3Target: integer("q3_target"), // Q3 (Jul-Sep) target
  q4Target: integer("q4_target"), // Q4 (Oct-Dec) target
  annualTarget: integer("annual_target"), // Annual target
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Workshop members - junction table for workshop team members
export const workshopMembers = pgTable("workshop_members", {
  workshopId: varchar("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  role: text("role"), // "mechanic", "assistant", "specialist", etc.
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workshopId, table.employeeId] }),
}));

// Employees table - Comprehensive employee management (mechanics, wash staff, etc.)
export const employees = pgTable("employees", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: text("employee_id").notNull().unique(), // Company employee ID
  deviceUserId: text("device_user_id").unique(), // ZKTeco attendance device user ID
  fullName: text("full_name").notNull(),
  username: text("username").unique(), // Login username (optional for employees without system access)
  password: text("password"), // Hashed password (optional for employees without system access)
  role: text("role").notNull(), // "mechanic", "wash_employee", "supervisor", "painter", "body_worker", "electrician", "technician", "admin", "ceo", "user", "verifier", "store_manager"
  specialty: text("specialty"), // For mechanics: "Engine", "Hydraulic", "Electrical"
  phoneNumber: text("phone_number"),
  email: text("email"),
  profilePicture: text("profile_picture"), // Path to employee photo
  garageId: varchar("garage_id").references(() => garages.id), // Primary garage assignment
  department: text("department"), // Department assignment: "mechanical", "electrical", "paint", "body", "wash", "general"
  canApprove: boolean("can_approve").default(false), // Can approve work orders and parts requests
  approvalLimit: decimal("approval_limit", { precision: 12, scale: 2 }), // Maximum amount they can approve (in currency)
  supervisorId: varchar("supervisor_id").references((): any => employees.id), // Their supervisor/department head
  hourlyRate: decimal("hourly_rate", { precision: 10, scale: 2 }), // Hourly rate in ETB for labor cost calculation
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
  inspectionId: varchar("inspection_id"), // Link to inspection if created from inspection (FK added via migration)
  receptionId: varchar("reception_id"), // Link to maintenance/reception form (FK added via migration)
  // NOTE: garageId and workshopId removed - now using junction tables work_order_garages and work_order_workshops for multi-selection
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  workType: text("work_type").notNull(), // "repair", "maintenance", "inspection", "wash"
  description: text("description").notNull(),
  status: text("status").notNull().default("pending_allocation"), // pending_allocation, pending_foreman_assignment, pending_team_acceptance, active, awaiting_parts, waiting_purchase, in_progress, pending_verification, pending_supervisor, completed, rejected, cancelled
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  
  // DEPRECATED cost fields (kept for backward compatibility - read-only)
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }), // DEPRECATED: Use totalActualCost instead
  directMaintenanceCost: decimal("direct_maintenance_cost", { precision: 12, scale: 2 }), // DEPRECATED: Use actualLaborCost instead
  overtimeCost: decimal("overtime_cost", { precision: 12, scale: 2 }), // DEPRECATED: Included in actualLaborCost
  outsourceCost: decimal("outsource_cost", { precision: 12, scale: 2 }), // DEPRECATED: Use actualOutsourceCost instead
  overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }), // DEPRECATED: Use actualOverheadCost instead
  
  // NEW comprehensive cost tracking system
  // Planned costs (entered during work order creation/approval)
  plannedLaborCost: decimal("planned_labor_cost", { precision: 12, scale: 2 }),
  plannedLubricantCost: decimal("planned_lubricant_cost", { precision: 12, scale: 2 }),
  plannedOutsourceCost: decimal("planned_outsource_cost", { precision: 12, scale: 2 }),
  totalPlannedCost: decimal("total_planned_cost", { precision: 12, scale: 2 }), // Sum of all planned costs
  
  // Actual costs (auto-calculated from itemized entries)
  actualLaborCost: decimal("actual_labor_cost", { precision: 12, scale: 2 }), // Calculated from labor entries
  actualLubricantCost: decimal("actual_lubricant_cost", { precision: 12, scale: 2 }), // Calculated from lubricant entries
  actualOutsourceCost: decimal("actual_outsource_cost", { precision: 12, scale: 2 }), // Calculated from outsource entries
  actualOverheadCost: decimal("actual_overhead_cost", { precision: 12, scale: 2 }), // Auto-calculated as % of labor
  totalActualCost: decimal("total_actual_cost", { precision: 12, scale: 2 }), // Sum of all actual costs
  
  // Cost variance tracking
  costVariance: decimal("cost_variance", { precision: 12, scale: 2 }), // totalActualCost - totalPlannedCost
  costVariancePercent: decimal("cost_variance_percent", { precision: 5, scale: 2 }), // Percentage variance
  
  isOutsourced: boolean("is_outsourced").default(false), // Flag for outsourced work
  approvalStatus: text("approval_status").default("not_required"), // not_required, pending, approved, rejected
  approvedById: varchar("approved_by_id").references(() => employees.id), // Supervisor who approved
  approvedAt: timestamp("approved_at"),
  approvalNotes: text("approval_notes"),
  completionApprovalStatus: text("completion_approval_status").default("not_required"), // For job completion approval
  completionApprovedById: varchar("completion_approved_by_id").references(() => employees.id),
  completionApprovedAt: timestamp("completion_approved_at"),
  completionApprovalNotes: text("completion_approval_notes"),
  createdById: varchar("created_by_id").references(() => employees.id),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// DEPRECATED: Work Order Required Parts - No longer used, replaced by item_requisitions system
// Keeping table for historical data but new work orders use item requisitions
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

// ============ NEW WORK ORDER WORKFLOW SYSTEM ============

// Work Order Garages - Junction table for multi-garage assignment
export const workOrderGarages = pgTable("work_order_garages", {
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  garageId: varchar("garage_id").notNull().references(() => garages.id, { onDelete: "cascade" }),
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workOrderId, table.garageId] }),
}));

// Work Order Workshops - Junction table for multi-workshop assignment
export const workOrderWorkshops = pgTable("work_order_workshops", {
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  workshopId: varchar("workshop_id").notNull().references(() => workshops.id, { onDelete: "cascade" }),
  foremanId: varchar("foreman_id").references(() => employees.id), // Workshop foreman responsible
  isPrimary: boolean("is_primary").default(false), // Designate primary workshop
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.workOrderId, table.workshopId] }),
}));

// Work Order Memberships - Track all participants (foreman, team members, verifier, store manager)
export const workOrderMemberships = pgTable("work_order_memberships", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // "foreman", "team_member", "verifier", "store_manager"
  assignedBy: varchar("assigned_by").references(() => employees.id), // Who assigned this person
  assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  isActive: boolean("is_active").default(true).notNull(), // Can be deactivated if reassigned
  deactivatedAt: timestamp("deactivated_at"),
});

// Work Order Status History - Track all status changes with actors
export const workOrderStatusHistory = pgTable("work_order_status_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedById: varchar("changed_by_id").notNull().references(() => employees.id),
  changedByRole: text("changed_by_role"), // Role of person making change
  notes: text("notes"),
  metadata: text("metadata"), // JSON for additional context
  changedAt: timestamp("changed_at").defaultNow().notNull(),
});

// Work Order Time Tracking - Track pause/resume events for work timers
export const workOrderTimeTracking = pgTable("work_order_time_tracking", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  event: text("event").notNull(), // "pause", "resume", "start", "complete"
  reason: text("reason"), // Reason for pause: "awaiting_parts", "waiting_purchase", etc.
  triggeredById: varchar("triggered_by_id").references(() => employees.id),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// ============ COST TRACKING SYSTEM ============

// Work Order Labor Entries - Itemized labor cost tracking
export const workOrderLaborEntries = pgTable("work_order_labor_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "restrict" }),
  entryType: text("entry_type").notNull().default("actual"), // "planned", "actual"
  timeSource: text("time_source").notNull().default("manual"), // "timer", "manual" - how hours were captured
  hoursWorked: decimal("hours_worked", { precision: 5, scale: 2 }).notNull(), // Hours worked
  hourlyRateSnapshot: decimal("hourly_rate_snapshot", { precision: 10, scale: 2 }).notNull(), // Rate at time of entry (prevents historical drift)
  overtimeFactor: decimal("overtime_factor", { precision: 3, scale: 2 }).default("1.00"), // 1.0 = regular, 1.5 = time-and-half, 2.0 = double-time
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(), // hoursWorked × hourlyRate × overtimeFactor
  description: text("description"), // What work was performed
  workDate: timestamp("work_date"), // When the work was performed
  enteredById: varchar("entered_by_id").references(() => employees.id), // Who entered this record
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Index for efficient work order lookup
  workOrderIdx: uniqueIndex("work_order_labor_entries_work_order_idx").on(table.workOrderId),
}));

// Work Order Lubricant/Materials Entries - Itemized lubricant and materials cost tracking
export const workOrderLubricantEntries = pgTable("work_order_lubricant_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  entryType: text("entry_type").notNull().default("actual"), // "planned", "actual"
  sparePartId: varchar("spare_part_id").references(() => spareParts.id, { onDelete: "set null" }), // Optional link to parts catalog
  itemName: text("item_name").notNull(), // Lubricant/material name (denormalized for history)
  itemNumber: text("item_number"), // Part/item number
  category: text("category").default("lubricant"), // "lubricant", "oil", "grease", "filter", "material"
  quantity: decimal("quantity", { precision: 10, scale: 2 }).notNull(), // Amount used
  unit: text("unit").default("liter"), // "liter", "kg", "piece", "gallon", etc.
  unitCostSnapshot: decimal("unit_cost_snapshot", { precision: 12, scale: 2 }).notNull(), // Price per unit at time of use
  totalCost: decimal("total_cost", { precision: 12, scale: 2 }).notNull(), // quantity × unitCost
  supplier: text("supplier"), // Where it was purchased/sourced from
  description: text("description"), // Additional notes
  usedDate: timestamp("used_date"), // When it was used
  enteredById: varchar("entered_by_id").references(() => employees.id), // Who entered this record
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Index for efficient work order lookup
  workOrderIdx: uniqueIndex("work_order_lubricant_entries_work_order_idx").on(table.workOrderId),
}));

// Work Order Outsource Entries - Itemized outsource/contractor cost tracking
export const workOrderOutsourceEntries = pgTable("work_order_outsource_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  entryType: text("entry_type").notNull().default("actual"), // "planned", "actual"
  vendorName: text("vendor_name").notNull(), // Contractor/vendor name
  vendorContact: text("vendor_contact"), // Phone/email
  serviceDescription: text("service_description").notNull(), // What service was provided
  serviceCategory: text("service_category"), // "welding", "painting", "machining", "towing", "fabrication", etc.
  plannedCost: decimal("planned_cost", { precision: 12, scale: 2 }), // Original quote/estimate
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }).notNull(), // Final amount paid
  invoiceNumber: text("invoice_number"), // Vendor invoice reference
  invoiceDate: timestamp("invoice_date"), // Invoice date
  paymentStatus: text("payment_status").default("pending"), // "pending", "paid", "partial"
  paymentDate: timestamp("payment_date"), // When payment was made
  remarks: text("remarks"), // Notes about the service
  serviceDate: timestamp("service_date"), // When service was performed
  enteredById: varchar("entered_by_id").references(() => employees.id), // Who entered this record
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Index for efficient work order lookup
  workOrderIdx: uniqueIndex("work_order_outsource_entries_work_order_idx").on(table.workOrderId),
}));

// Approval Stages - Define multi-level approval workflow stages
export const approvalStages = pgTable("approval_stages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: text("code").notNull().unique(), // "foreman_assignment", "item_foreman_review", "item_store_review", "item_purchase_request", "verification", "supervisor_signoff"
  name: text("name").notNull(),
  description: text("description"),
  requiredRole: text("required_role").notNull(), // Role required to approve this stage: "foreman", "store_manager", "verifier", "supervisor"
  sequence: integer("sequence").notNull(), // Order of execution
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Work Order Approvals - Track approval decisions at each stage
export const workOrderApprovals = pgTable("work_order_approvals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  stageId: varchar("stage_id").notNull().references(() => approvalStages.id),
  approverId: varchar("approver_id").notNull().references(() => employees.id),
  approverRole: text("approver_role").notNull(), // Role of approver: "foreman", "store_manager", "verifier", "supervisor"
  status: text("status").notNull().default("pending"), // pending, approved, rejected, skipped
  decidedAt: timestamp("decided_at"),
  remarks: text("remarks"),
  metadata: text("metadata"), // JSON for additional stage-specific data
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate approvals for the same work order and stage
  uniqueWorkOrderStageIdx: uniqueIndex("work_order_approvals_unique_work_order_stage_idx").on(table.workOrderId, table.stageId),
}));

// Item Requisitions - Spare parts request form (based on Amharic form)
export const itemRequisitions = pgTable("item_requisitions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requisitionNumber: text("requisition_number").notNull().unique(), // REQ-2025-001
  workOrderId: varchar("work_order_id").notNull().references(() => workOrders.id, { onDelete: "cascade" }),
  requesterId: varchar("requester_id").notNull().references(() => employees.id), // Team member who requested
  workshopId: varchar("workshop_id").references(() => workshops.id), // Requesting workshop/department
  status: text("status").notNull().default("draft"), // draft, pending_foreman, pending_store, pending_purchase, approved, rejected, fulfilled
  foremanApprovalStatus: text("foreman_approval_status").default("pending"), // pending, approved, rejected
  foremanApprovedById: varchar("foreman_approved_by_id").references(() => employees.id),
  foremanApprovedAt: timestamp("foreman_approved_at"),
  foremanRemarks: text("foreman_remarks"),
  storeApprovalStatus: text("store_approval_status").default("pending"), // pending, approved, rejected
  storeApprovedById: varchar("store_approved_by_id").references(() => employees.id),
  storeApprovedAt: timestamp("store_approved_at"),
  storeRemarks: text("store_remarks"),
  neededBy: timestamp("needed_by"), // When parts are needed
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Item Requisition Lines - Individual items in requisition (table rows from Amharic form)
export const itemRequisitionLines = pgTable("item_requisition_lines", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  requisitionId: varchar("requisition_id").notNull().references(() => itemRequisitions.id, { onDelete: "cascade" }),
  lineNumber: integer("line_number").notNull(), // Row number in form
  sparePartId: varchar("spare_part_id").references(() => spareParts.id), // Link to parts catalog
  description: text("description").notNull(), // Detailed description (ዝርዝር መግለጫ)
  unitOfMeasure: text("unit_of_measure"), // Unit of measure (መለኪያ) - "pcs", "kg", "L", etc.
  quantityRequested: integer("quantity_requested").notNull(), // Quantity requested (መጠን)
  quantityApproved: integer("quantity_approved"), // Quantity approved by foreman/store
  status: text("status").notNull().default("pending"), // pending, approved, rejected, backordered, fulfilled
  remarks: text("remarks"), // Additional notes (አስተያየት)
  
  // Foreman approval fields - per-line approval/rejection
  foremanReviewerId: varchar("foreman_reviewer_id").references(() => employees.id), // Foreman who reviewed this line
  foremanDecisionAt: timestamp("foreman_decision_at"), // When foreman made decision
  foremanDecisionRemarks: text("foreman_decision_remarks"), // Foreman's notes on decision
  foremanApprovedQty: integer("foreman_approved_qty"), // Quantity approved by foreman (can differ from requested)
  foremanStatus: text("foreman_status").default("pending"), // pending, approved, rejected
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure unique line numbers within each requisition
  uniqueRequisitionLineIdx: uniqueIndex("item_requisition_lines_unique_requisition_line_idx").on(table.requisitionId, table.lineNumber),
}));

// Purchase Requests - Created when item is out of stock
export const purchaseRequests = pgTable("purchase_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  purchaseRequestNumber: text("purchase_request_number").notNull().unique(), // PO-2025-001
  requisitionLineId: varchar("requisition_line_id").notNull().references(() => itemRequisitionLines.id, { onDelete: "cascade" }),
  
  // Employee references
  requestedById: varchar("requested_by_id").notNull().references(() => employees.id), // Original requester (team member)
  foremanApprovedById: varchar("foreman_approved_by_id").references(() => employees.id), // Foreman who approved requisition
  storeManagerId: varchar("store_manager_id").notNull().references(() => employees.id), // Store manager who prepared purchase request
  
  quantityRequested: integer("quantity_requested").notNull(), // Quantity to be purchased
  quantityReceived: integer("quantity_received").default(0), // Quantity actually received
  status: text("status").notNull().default("pending"), // pending, ordered, received, cancelled
  
  // Dates
  dateRequested: timestamp("date_requested").notNull(), // Date when item requester asked for the item (from requisition)
  dateApproved: timestamp("date_approved").notNull(), // Date when store manager approved for purchase (current date)
  orderDate: timestamp("order_date"), // When order was actually placed with vendor
  receivedDate: timestamp("received_date"), // When items were received
  
  // Pricing (optional - can be filled later)
  unitPrice: text("unit_price"), // Store as text to avoid precision issues
  totalPrice: text("total_price"),
  currency: text("currency").default("ETB"), // ETB or USD
  
  // Notes
  notes: text("notes"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Parts Receipts - Track actual parts issued to work orders for display on dashboards
// NOTE: workOrderId does NOT cascade delete to preserve historical data when work orders are archived
export const partsReceipts = pgTable("parts_receipts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workOrderId: varchar("work_order_id").notNull(), // No FK constraint to preserve data when work orders are archived
  requisitionLineId: varchar("requisition_line_id").notNull().references(() => itemRequisitionLines.id, { onDelete: "cascade" }),
  sparePartId: varchar("spare_part_id").references(() => spareParts.id, { onDelete: "set null" }),
  quantityIssued: integer("quantity_issued").notNull(), // Actual quantity issued from stock
  issuedAt: timestamp("issued_at").defaultNow().notNull(), // When parts were issued
  issuedById: varchar("issued_by_id").notNull().references(() => employees.id), // Store manager who issued parts
  notes: text("notes"), // Additional notes about issuance
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Employee Performance Snapshots - Daily/monthly/yearly performance metrics
export const employeePerformanceSnapshots = pgTable("employee_performance_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  snapshotDate: timestamp("snapshot_date").notNull(), // Date of snapshot
  granularity: text("granularity").notNull(), // "daily", "monthly", "yearly"
  tasksCompleted: integer("tasks_completed").default(0),
  totalLaborMinutes: integer("total_labor_minutes").default(0), // Sum of labor time
  qualityScore: decimal("quality_score", { precision: 5, scale: 2 }), // Average quality rating
  workOrdersCompleted: integer("work_orders_completed").default(0),
  itemRequisitionsProcessed: integer("item_requisitions_processed").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Prevent duplicate snapshots for same employee, date, and granularity
  uniqueEmployeeSnapshotIdx: uniqueIndex("employee_performance_snapshots_unique_employee_snapshot_idx").on(table.employeeId, table.snapshotDate, table.granularity),
}));

// Employee Performance Totals - Denormalized totals for quick leaderboard queries
export const employeePerformanceTotals = pgTable("employee_performance_totals", {
  employeeId: varchar("employee_id").primaryKey().references(() => employees.id, { onDelete: "cascade" }),
  totalTasksCompleted: integer("total_tasks_completed").default(0),
  totalWorkOrdersCompleted: integer("total_work_orders_completed").default(0),
  totalLaborHours: decimal("total_labor_hours", { precision: 10, scale: 2 }).default('0'),
  averageQualityScore: decimal("average_quality_score", { precision: 5, scale: 2 }),
  employeeOfMonthCount: integer("employee_of_month_count").default(0), // How many times employee of month
  employeeOfYearCount: integer("employee_of_year_count").default(0), // How many times employee of year
  lastAwardDate: timestamp("last_award_date"), // Last time awarded
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
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
  workshopId: varchar("workshop_id").references(() => workshops.id),
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
  status: text("status").notNull().default("driver_submitted"), // driver_submitted, awaiting_mechanic, under_inspection, inspection_complete, work_order_created, closed
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
  approverId: varchar("approver_id").references(() => employees.id), // Selected approver for this inspection
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
  approvalType: text("approval_type").notNull(), // "work_order", "work_order_completion", "parts_request", "repair_estimate", "inspection"
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

// ============ DYNAMICS 365 INTEGRATION ============

// D365 Sync Log - Track D365 import/sync operations
export const d365SyncLogs = pgTable("d365_sync_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncType: text("sync_type").notNull(), // "items" or "equipment"
  status: text("status").notNull(), // "success", "failed", "partial"
  prefix: text("prefix"), // Prefix used for filtering (e.g., "SP-", "EQ-")
  recordsImported: integer("records_imported").default(0), // New records added
  recordsUpdated: integer("records_updated").default(0), // Existing records updated
  recordsSkipped: integer("records_skipped").default(0), // Records skipped
  totalRecords: integer("total_records").default(0), // Total records fetched from D365
  errorMessage: text("error_message"),
  importData: text("import_data"), // JSON data of imported records
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for garage management
export const garagesRelations = relations(garages, ({ many }) => ({
  workshops: many(workshops),
  employees: many(employees),
  partsLocations: many(partsStorageLocations),
  equipmentLocations: many(equipmentLocations),
  workOrderAssignments: many(workOrderGarages), // New: multi-garage assignments
}));

export const workshopsRelations = relations(workshops, ({ one, many }) => ({
  garage: one(garages, {
    fields: [workshops.garageId],
    references: [garages.id],
  }),
  foreman: one(employees, {
    fields: [workshops.foremanId],
    references: [employees.id],
  }),
  members: many(workshopMembers),
  equipmentLocations: many(equipmentLocations),
  workOrderAssignments: many(workOrderWorkshops), // New: multi-workshop assignments
  itemRequisitions: many(itemRequisitions), // New: requisitions from workshop
}));

export const workshopMembersRelations = relations(workshopMembers, ({ one }) => ({
  workshop: one(workshops, {
    fields: [workshopMembers.workshopId],
    references: [workshops.id],
  }),
  employee: one(employees, {
    fields: [workshopMembers.employeeId],
    references: [employees.id],
  }),
}));

export const employeesRelations = relations(employees, ({ one, many }) => ({
  garage: one(garages, {
    fields: [employees.garageId],
    references: [garages.id],
  }),
  workOrders: many(workOrders),
}));

export const workOrdersRelations = relations(workOrders, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [workOrders.equipmentId],
    references: [equipment.id],
  }),
  createdBy: one(employees, {
    fields: [workOrders.createdById],
    references: [employees.id],
  }),
  // New relations for workflow system
  garageAssignments: many(workOrderGarages),
  workshopAssignments: many(workOrderWorkshops),
  memberships: many(workOrderMemberships),
  statusHistory: many(workOrderStatusHistory),
  approvals: many(workOrderApprovals),
  itemRequisitions: many(itemRequisitions),
}));

// Relations for new workflow system
export const workOrderGaragesRelations = relations(workOrderGarages, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderGarages.workOrderId],
    references: [workOrders.id],
  }),
  garage: one(garages, {
    fields: [workOrderGarages.garageId],
    references: [garages.id],
  }),
}));

export const workOrderWorkshopsRelations = relations(workOrderWorkshops, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderWorkshops.workOrderId],
    references: [workOrders.id],
  }),
  workshop: one(workshops, {
    fields: [workOrderWorkshops.workshopId],
    references: [workshops.id],
  }),
  foreman: one(employees, {
    fields: [workOrderWorkshops.foremanId],
    references: [employees.id],
  }),
}));

export const workOrderMembershipsRelations = relations(workOrderMemberships, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderMemberships.workOrderId],
    references: [workOrders.id],
  }),
  employee: one(employees, {
    fields: [workOrderMemberships.employeeId],
    references: [employees.id],
  }),
  assignedByEmployee: one(employees, {
    fields: [workOrderMemberships.assignedBy],
    references: [employees.id],
  }),
}));

export const workOrderStatusHistoryRelations = relations(workOrderStatusHistory, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderStatusHistory.workOrderId],
    references: [workOrders.id],
  }),
  changedBy: one(employees, {
    fields: [workOrderStatusHistory.changedById],
    references: [employees.id],
  }),
}));

export const workOrderApprovalsRelations = relations(workOrderApprovals, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [workOrderApprovals.workOrderId],
    references: [workOrders.id],
  }),
  stage: one(approvalStages, {
    fields: [workOrderApprovals.stageId],
    references: [approvalStages.id],
  }),
  approver: one(employees, {
    fields: [workOrderApprovals.approverId],
    references: [employees.id],
  }),
}));

export const itemRequisitionsRelations = relations(itemRequisitions, ({ one, many }) => ({
  workOrder: one(workOrders, {
    fields: [itemRequisitions.workOrderId],
    references: [workOrders.id],
  }),
  requester: one(employees, {
    fields: [itemRequisitions.requesterId],
    references: [employees.id],
  }),
  workshop: one(workshops, {
    fields: [itemRequisitions.workshopId],
    references: [workshops.id],
  }),
  lines: many(itemRequisitionLines),
}));

export const itemRequisitionLinesRelations = relations(itemRequisitionLines, ({ one, many }) => ({
  requisition: one(itemRequisitions, {
    fields: [itemRequisitionLines.requisitionId],
    references: [itemRequisitions.id],
  }),
  sparePart: one(spareParts, {
    fields: [itemRequisitionLines.sparePartId],
    references: [spareParts.id],
  }),
  foremanReviewer: one(employees, {
    fields: [itemRequisitionLines.foremanReviewerId],
    references: [employees.id],
  }),
  purchaseRequests: many(purchaseRequests),
  partsReceipts: many(partsReceipts),
}));

export const purchaseRequestsRelations = relations(purchaseRequests, ({ one }) => ({
  requisitionLine: one(itemRequisitionLines, {
    fields: [purchaseRequests.requisitionLineId],
    references: [itemRequisitionLines.id],
  }),
  requestedBy: one(employees, {
    fields: [purchaseRequests.requestedById],
    references: [employees.id],
  }),
  foremanApprovedBy: one(employees, {
    fields: [purchaseRequests.foremanApprovedById],
    references: [employees.id],
  }),
  storeManager: one(employees, {
    fields: [purchaseRequests.storeManagerId],
    references: [employees.id],
  }),
}));

export const partsReceiptsRelations = relations(partsReceipts, ({ one }) => ({
  workOrder: one(workOrders, {
    fields: [partsReceipts.workOrderId],
    references: [workOrders.id],
  }),
  requisitionLine: one(itemRequisitionLines, {
    fields: [partsReceipts.requisitionLineId],
    references: [itemRequisitionLines.id],
  }),
  sparePart: one(spareParts, {
    fields: [partsReceipts.sparePartId],
    references: [spareParts.id],
  }),
  issuedBy: one(employees, {
    fields: [partsReceipts.issuedById],
    references: [employees.id],
  }),
}));

export const employeePerformanceSnapshotsRelations = relations(employeePerformanceSnapshots, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePerformanceSnapshots.employeeId],
    references: [employees.id],
  }),
}));

export const employeePerformanceTotalsRelations = relations(employeePerformanceTotals, ({ one }) => ({
  employee: one(employees, {
    fields: [employeePerformanceTotals.employeeId],
    references: [employees.id],
  }),
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
  workshop: one(workshops, {
    fields: [equipmentLocations.workshopId],
    references: [workshops.id],
  }),
}));

// Insert schemas for garage management
export const insertGarageSchema = createInsertSchema(garages).omit({
  id: true,
  createdAt: true,
});

export const insertWorkshopSchema = createInsertSchema(workshops).omit({
  id: true,
  createdAt: true,
});

export const insertWorkshopMemberSchema = createInsertSchema(workshopMembers).omit({
  assignedAt: true,
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  createdAt: true,
}).extend({
  hourlyRate: z.coerce.number().min(0, "Hourly rate must be positive").optional(),
  approvalLimit: z.coerce.number().min(0, "Approval limit must be positive").optional(),
});

export const insertWorkOrderSchema = createInsertSchema(workOrders).omit({
  id: true,
  createdAt: true,
}).extend({
  workOrderNumber: z.string().optional(),
});

export const insertWorkOrderRequiredPartSchema = createInsertSchema(workOrderRequiredParts).omit({
  id: true,
  createdAt: true,
});

// Insert schemas for new workflow system
export const insertWorkOrderGarageSchema = createInsertSchema(workOrderGarages).omit({
  assignedAt: true,
});

export const insertWorkOrderWorkshopSchema = createInsertSchema(workOrderWorkshops).omit({
  assignedAt: true,
});

export const insertWorkOrderMembershipSchema = createInsertSchema(workOrderMemberships).omit({
  id: true,
  assignedAt: true,
});

export const insertWorkOrderStatusHistorySchema = createInsertSchema(workOrderStatusHistory).omit({
  id: true,
  changedAt: true,
});

export const insertWorkOrderTimeTrackingSchema = createInsertSchema(workOrderTimeTracking).omit({
  id: true,
  timestamp: true,
});

// Cost tracking insert schemas
export const insertWorkOrderLaborEntrySchema = createInsertSchema(workOrderLaborEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  hoursWorked: z.coerce.number().min(0, "Hours worked must be positive"),
  hourlyRateSnapshot: z.coerce.number().min(0, "Hourly rate must be positive"),
  overtimeFactor: z.coerce.number().min(1, "Overtime factor must be at least 1.0").default(1.0),
  totalCost: z.coerce.number().min(0, "Total cost must be positive"),
  workDate: z.coerce.date().optional(),
});

export const insertWorkOrderLubricantEntrySchema = createInsertSchema(workOrderLubricantEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  entryType: z.enum(["planned", "actual"], {
    errorMap: () => ({ message: "Entry type must be either 'planned' or 'actual'" })
  }),
  quantity: z.coerce.number().min(0, "Quantity must be positive"),
  unitCostSnapshot: z.coerce.number().min(0, "Unit cost must be positive"),
  totalCost: z.coerce.number().min(0, "Total cost must be positive"),
  usedDate: z.coerce.date().optional(),
});

export const insertWorkOrderOutsourceEntrySchema = createInsertSchema(workOrderOutsourceEntries).omit({
  id: true,
  createdAt: true,
}).extend({
  plannedCost: z.coerce.number().min(0, "Planned cost must be positive").optional(),
  actualCost: z.coerce.number().min(0, "Actual cost must be positive"),
  serviceDate: z.coerce.date().optional(),
});

export const insertApprovalStageSchema = createInsertSchema(approvalStages).omit({
  id: true,
  createdAt: true,
});

export const insertWorkOrderApprovalSchema = createInsertSchema(workOrderApprovals).omit({
  id: true,
  createdAt: true,
});

export const insertItemRequisitionSchema = createInsertSchema(itemRequisitions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertItemRequisitionLineSchema = createInsertSchema(itemRequisitionLines).omit({
  id: true,
  createdAt: true,
});

export const insertPurchaseRequestSchema = createInsertSchema(purchaseRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeePerformanceSnapshotSchema = createInsertSchema(employeePerformanceSnapshots).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeePerformanceTotalSchema = createInsertSchema(employeePerformanceTotals).omit({
  lastUpdated: true,
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
export type Workshop = typeof workshops.$inferSelect;
export type WorkshopMember = typeof workshopMembers.$inferSelect;
export type InsertWorkshop = z.infer<typeof insertWorkshopSchema>;
export type InsertWorkshopMember = z.infer<typeof insertWorkshopMemberSchema>;
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type WorkOrder = typeof workOrders.$inferSelect;
export type InsertWorkOrder = z.infer<typeof insertWorkOrderSchema>;
export type WorkOrderRequiredPart = typeof workOrderRequiredParts.$inferSelect;
export type InsertWorkOrderRequiredPart = z.infer<typeof insertWorkOrderRequiredPartSchema>;
export type PartsStorageLocation = typeof partsStorageLocations.$inferSelect;
export type InsertPartsStorageLocation = z.infer<typeof insertPartsStorageLocationSchema>;
export type EquipmentLocation = typeof equipmentLocations.$inferSelect;
export type InsertEquipmentLocation = z.infer<typeof insertEquipmentLocationSchema>;

// Select types for new workflow system
export type WorkOrderGarage = typeof workOrderGarages.$inferSelect;
export type InsertWorkOrderGarage = z.infer<typeof insertWorkOrderGarageSchema>;
export type WorkOrderWorkshop = typeof workOrderWorkshops.$inferSelect;
export type InsertWorkOrderWorkshop = z.infer<typeof insertWorkOrderWorkshopSchema>;
export type WorkOrderMembership = typeof workOrderMemberships.$inferSelect;
export type InsertWorkOrderMembership = z.infer<typeof insertWorkOrderMembershipSchema>;
export type WorkOrderStatusHistory = typeof workOrderStatusHistory.$inferSelect;
export type InsertWorkOrderStatusHistory = z.infer<typeof insertWorkOrderStatusHistorySchema>;
export type WorkOrderTimeTracking = typeof workOrderTimeTracking.$inferSelect;
export type InsertWorkOrderTimeTracking = z.infer<typeof insertWorkOrderTimeTrackingSchema>;

// Cost tracking types
export type WorkOrderLaborEntry = typeof workOrderLaborEntries.$inferSelect;
export type InsertWorkOrderLaborEntry = z.infer<typeof insertWorkOrderLaborEntrySchema>;
export type WorkOrderLubricantEntry = typeof workOrderLubricantEntries.$inferSelect;
export type InsertWorkOrderLubricantEntry = z.infer<typeof insertWorkOrderLubricantEntrySchema>;
export type WorkOrderOutsourceEntry = typeof workOrderOutsourceEntries.$inferSelect;
export type InsertWorkOrderOutsourceEntry = z.infer<typeof insertWorkOrderOutsourceEntrySchema>;

// Enriched view types for cost entries (extends base types with joins and aliases)
export type WorkOrderLaborEntryView = Omit<WorkOrderLaborEntry, 'hoursWorked' | 'hourlyRateSnapshot' | 'overtimeFactor' | 'totalCost'> & {
  // Parsed decimal fields (database stores as decimal, we convert to number)
  hoursWorked: number;
  hourlyRateSnapshot: number;
  overtimeFactor: number;
  totalCost: number;
  // Enriched field from JOIN
  employeeName: string | null;
  // Backwards-compat alias
  hourlyRate: number;
};

export type WorkOrderLubricantEntryView = Omit<WorkOrderLubricantEntry, 'quantity' | 'unitCostSnapshot' | 'totalCost'> & {
  // Parsed decimal fields
  quantity: number;
  unitCostSnapshot: number;
  totalCost: number;
  // Backwards-compat aliases
  lubricantType: string;
  unitCost: number;
};

export type WorkOrderOutsourceEntryView = Omit<WorkOrderOutsourceEntry, 'plannedCost' | 'actualCost'> & {
  // Parsed decimal fields
  plannedCost: number | null;
  actualCost: number;
  // Backwards-compat alias
  cost: number;
};

export type ApprovalStage = typeof approvalStages.$inferSelect;
export type InsertApprovalStage = z.infer<typeof insertApprovalStageSchema>;
export type WorkOrderApproval = typeof workOrderApprovals.$inferSelect;
export type InsertWorkOrderApproval = z.infer<typeof insertWorkOrderApprovalSchema>;
export type ItemRequisition = typeof itemRequisitions.$inferSelect;
export type InsertItemRequisition = z.infer<typeof insertItemRequisitionSchema>;
export type ItemRequisitionLine = typeof itemRequisitionLines.$inferSelect;
export type InsertItemRequisitionLine = z.infer<typeof insertItemRequisitionLineSchema>;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type InsertPurchaseRequest = z.infer<typeof insertPurchaseRequestSchema>;
export type EmployeePerformanceSnapshot = typeof employeePerformanceSnapshots.$inferSelect;
export type InsertEmployeePerformanceSnapshot = z.infer<typeof insertEmployeePerformanceSnapshotSchema>;
export type EmployeePerformanceTotal = typeof employeePerformanceTotals.$inferSelect;
export type InsertEmployeePerformanceTotal = z.infer<typeof insertEmployeePerformanceTotalSchema>;

// Extended types with relations
export type GarageWithDetails = Garage & {
  workshops?: Workshop[];
  employees?: Employee[];
  workOrderAssignments?: WorkOrderGarage[];
};

export type WorkOrderWithDetails = WorkOrder & {
  equipment?: Equipment;
  createdBy?: Employee;
  // Equipment denormalized fields (populated from equipment join)
  equipmentModel?: string;
  equipmentMake?: string;
  // Convenience fields
  garage?: Garage;
  workshop?: Workshop;
  // New workflow relations
  garageAssignments?: (WorkOrderGarage & { garage?: Garage })[];
  workshopAssignments?: (WorkOrderWorkshop & { workshop?: Workshop; foreman?: Employee })[];
  memberships?: (WorkOrderMembership & { employee?: Employee })[];
  statusHistory?: (WorkOrderStatusHistory & { changedBy?: Employee })[];
  itemRequisitions?: ItemRequisition[];
  approvals?: WorkOrderApproval[];
  requiredParts?: WorkOrderRequiredPart[]; // Legacy - for historical data
};

export type WorkshopWithDetails = Workshop & {
  garage?: Garage;
  foreman?: Employee;
  members?: WorkshopMember[];
  membersList?: Employee[]; // Populated list of actual employee objects
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

// Insert schemas and types for D365 sync logs
export const insertD365SyncLogSchema = createInsertSchema(d365SyncLogs).omit({
  id: true,
  createdAt: true,
});

export type D365SyncLog = typeof d365SyncLogs.$inferSelect;
export type InsertD365SyncLog = z.infer<typeof insertD365SyncLogSchema>;

// Items table - synchronized from Dynamics 365 Business Central
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  itemNo: text("item_no").notNull().unique(), // D365 "No" field
  description: text("description").notNull(), // D365 "Description" field
  description2: text("description_2"), // D365 "Description 2" field
  type: text("type"), // D365 "Type" field (Inventory, Service, Non-Inventory)
  baseUnitOfMeasure: text("base_unit_of_measure"), // D365 "Base_Unit_of_Measure"
  unitPrice: decimal("unit_price", { precision: 12, scale: 2 }), // D365 "Unit_Price"
  unitCost: decimal("unit_cost", { precision: 12, scale: 2 }), // D365 "Unit_Cost"
  inventory: decimal("inventory", { precision: 12, scale: 2 }), // D365 "Inventory" (stock level)
  vendorNo: text("vendor_no"), // D365 "Vendor_No"
  vendorItemNo: text("vendor_item_no"), // D365 "Vendor_Item_No"
  lastDateModified: text("last_date_modified"), // D365 "Last_Date_Modified"
  syncedAt: timestamp("synced_at").defaultNow().notNull(), // When item was last synced from D365
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schema for items
export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  syncedAt: true,
});

// Select types for items
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;

// Dynamics 365 Settings table - for D365 Business Central connection configuration
export const dynamics365Settings = pgTable("dynamics365_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  bcUrl: text("bc_url").notNull(), // Dynamics 365 Business Central URL (e.g., http://192.168.0.16:7048)
  bcCompany: text("bc_company").notNull(), // Company name in D365
  bcUsername: text("bc_username").notNull(), // D365 username
  bcPassword: text("bc_password").notNull(), // D365 password (encrypted)
  bcDomain: text("bc_domain"), // Windows domain for NTLM authentication (optional)
  itemPrefix: text("item_prefix"), // Filter items by prefix (e.g., "SP-") - only sync items starting with this
  equipmentPrefix: text("equipment_prefix"), // Filter equipment by prefix (e.g., "FA-")
  syncIntervalHours: integer("sync_interval_hours").default(24), // Auto-sync interval in hours
  lastSyncDate: timestamp("last_sync_date"), // Last successful PowerShell sync
  isActive: boolean("is_active").default(true).notNull(), // Whether this configuration is active
  lastTestDate: timestamp("last_test_date"), // Last time connection was tested
  lastTestStatus: text("last_test_status"), // Last test result: 'success' or 'failed'
  lastTestMessage: text("last_test_message"), // Error message if test failed
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => employees.id), // Employee who made the change (CEO/Admin)
});

// Insert schema for D365 settings
export const insertDynamics365SettingsSchema = createInsertSchema(dynamics365Settings).omit({
  id: true,
  updatedAt: true,
  lastTestDate: true,
  lastTestStatus: true,
  lastTestMessage: true,
});

// Select types for D365 settings
export type Dynamics365Settings = typeof dynamics365Settings.$inferSelect;
export type InsertDynamics365Settings = z.infer<typeof insertDynamics365SettingsSchema>;

// D365 Preview/Staging table - temporary storage for items fetched by PowerShell before user review
export const d365ItemsPreview = pgTable("d365_items_preview", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  syncId: varchar("sync_id").notNull(), // Links to sync log
  itemNo: text("item_no").notNull(),
  description: text("description"),
  description2: text("description_2"),
  type: text("type"),
  baseUnitOfMeasure: text("base_unit_of_measure"),
  unitPrice: text("unit_price"),
  unitCost: text("unit_cost"),
  inventory: text("inventory"),
  vendorNo: text("vendor_no"),
  vendorItemNo: text("vendor_item_no"),
  lastDateModified: text("last_date_modified"),
  isSelected: boolean("is_selected").default(true).notNull(), // User can deselect before import
  alreadyExists: boolean("already_exists").default(false).notNull(), // Flag if item already in database
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type D365ItemPreview = typeof d365ItemsPreview.$inferSelect;
export const insertD365ItemPreviewSchema = createInsertSchema(d365ItemsPreview).omit({
  id: true,
  createdAt: true,
});

// System Settings table - for server configuration
export const systemSettings = pgTable("system_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  serverHost: text("server_host").notNull().default("0.0.0.0"), // Server IP/host
  serverPort: integer("server_port").notNull().default(3000), // Server port
  mellatechUsername: text("mellatech_username"), // MellaTech API username
  mellatechPassword: text("mellatech_password"), // MellaTech API password
  activeEthiopianYear: integer("active_ethiopian_year"), // Current active Ethiopian year (e.g., 2017)
  lastYearClosureDate: timestamp("last_year_closure_date"), // Date when year was last closed
  planningTargetsLocked: boolean("planning_targets_locked").default(true).notNull(), // Lock planning targets after setup
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => employees.id), // Employee who made the change (CEO/Admin)
});

// Employee Page Permissions - Control which pages employees can access
export const employeePagePermissions = pgTable("employee_page_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  employeeId: varchar("employee_id").notNull().references(() => employees.id, { onDelete: "cascade" }),
  pagePath: text("page_path").notNull(), // Route path: "/spare-parts", "/equipment", "/work-orders", etc.
  isAllowed: boolean("is_allowed").notNull().default(true), // true = allowed, false = denied
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Unique constraint: one permission record per employee per page
  uniqueEmployeePage: uniqueIndex("unique_employee_page").on(table.employeeId, table.pagePath),
}));

// Insert schema for system settings
export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  updatedAt: true,
});

// Select types for system settings
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;

// Insert schema for employee page permissions
export const insertEmployeePagePermissionSchema = createInsertSchema(employeePagePermissions).omit({
  id: true,
  createdAt: true,
});

// Select types for employee page permissions
export type EmployeePagePermission = typeof employeePagePermissions.$inferSelect;
export type InsertEmployeePagePermission = z.infer<typeof insertEmployeePagePermissionSchema>;

// App Customizations table - for branding and theming
export const appCustomizations = pgTable("app_customizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  appName: text("app_name").notNull().default("Gelan Terminal Maintenance"), // Application name
  logoUrl: text("logo_url"), // Path to uploaded logo image
  primaryColor: text("primary_color").default("#0ea5e9"), // Primary theme color (hex)
  themeMode: text("theme_mode").notNull().default("light"), // light, dark, or auto
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  updatedBy: varchar("updated_by").references(() => employees.id), // Employee who made the change (Admin/CEO)
});

// Insert schema for app customizations
export const insertAppCustomizationsSchema = createInsertSchema(appCustomizations).omit({
  id: true,
  updatedAt: true,
});

// Select types for app customizations
export type AppCustomizations = typeof appCustomizations.$inferSelect;
export type InsertAppCustomizations = z.infer<typeof insertAppCustomizationsSchema>;

// MellaTech Fleet Tracking - Vehicles synced from MellaTech
export const mellaTechVehicles = pgTable("mellatech_vehicles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  mellaTechId: text("mellatech_id").notNull().unique(), // MellaTech's vehicle ID
  name: text("name").notNull(), // Vehicle name/identifier
  plateNumber: text("plate_number"), // License plate
  equipmentId: varchar("equipment_id").references(() => equipment.id, { onDelete: "set null" }), // Link to our equipment table
  vehicleType: text("vehicle_type"), // Truck, Loader, etc.
  imei: text("imei"), // Device IMEI
  speed: decimal("speed", { precision: 6, scale: 2 }), // Current speed
  latitude: decimal("latitude", { precision: 10, scale: 7 }), // Current GPS latitude
  longitude: decimal("longitude", { precision: 10, scale: 7 }), // Current GPS longitude
  altitude: decimal("altitude", { precision: 8, scale: 2 }), // Current altitude
  angle: decimal("angle", { precision: 5, scale: 2 }), // Current heading/direction
  batteryLevel: decimal("battery_level", { precision: 5, scale: 2 }), // Battery percentage
  engineHours: decimal("engine_hours", { precision: 10, scale: 2 }), // Total engine hours
  distance: decimal("distance", { precision: 12, scale: 2 }), // Total distance traveled
  status: text("status"), // Stopped, Moving, Idle, etc.
  lastUpdate: timestamp("last_update"), // Last GPS update from MellaTech
  syncedAt: timestamp("synced_at").defaultNow().notNull(), // When we last synced this data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MellaTech Trip History - Historical trips/routes
export const mellaTechTrips = pgTable("mellatech_trips", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => mellaTechVehicles.id, { onDelete: "cascade" }),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  startLatitude: decimal("start_latitude", { precision: 10, scale: 7 }),
  startLongitude: decimal("start_longitude", { precision: 10, scale: 7 }),
  endLatitude: decimal("end_latitude", { precision: 10, scale: 7 }),
  endLongitude: decimal("end_longitude", { precision: 10, scale: 7 }),
  distance: decimal("distance", { precision: 12, scale: 2 }), // Trip distance
  duration: integer("duration"), // Trip duration in seconds
  maxSpeed: decimal("max_speed", { precision: 6, scale: 2 }),
  averageSpeed: decimal("average_speed", { precision: 6, scale: 2 }),
  idleTime: integer("idle_time"), // Idle time in seconds
  fuelConsumed: decimal("fuel_consumed", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MellaTech Location History - GPS breadcrumbs
export const mellaTechLocationHistory = pgTable("mellatech_location_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => mellaTechVehicles.id, { onDelete: "cascade" }),
  tripId: varchar("trip_id").references(() => mellaTechTrips.id, { onDelete: "set null" }),
  latitude: decimal("latitude", { precision: 10, scale: 7 }).notNull(),
  longitude: decimal("longitude", { precision: 10, scale: 7 }).notNull(),
  altitude: decimal("altitude", { precision: 8, scale: 2 }),
  speed: decimal("speed", { precision: 6, scale: 2 }),
  angle: decimal("angle", { precision: 5, scale: 2 }),
  timestamp: timestamp("timestamp").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// MellaTech Alerts/Geofence - Alerts and notifications
export const mellaTechAlerts = pgTable("mellatech_alerts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  vehicleId: varchar("vehicle_id").notNull().references(() => mellaTechVehicles.id, { onDelete: "cascade" }),
  alertType: text("alert_type").notNull(), // speeding, geofence, idle, etc.
  message: text("message").notNull(),
  severity: text("severity").notNull().default("info"), // info, warning, critical
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  isRead: boolean("is_read").default(false).notNull(),
  occurredAt: timestamp("occurred_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for MellaTech tables
export const mellaTechVehiclesRelations = relations(mellaTechVehicles, ({ one, many }) => ({
  equipment: one(equipment, {
    fields: [mellaTechVehicles.equipmentId],
    references: [equipment.id],
  }),
  trips: many(mellaTechTrips),
  locationHistory: many(mellaTechLocationHistory),
  alerts: many(mellaTechAlerts),
}));

export const mellaTechTripsRelations = relations(mellaTechTrips, ({ one, many }) => ({
  vehicle: one(mellaTechVehicles, {
    fields: [mellaTechTrips.vehicleId],
    references: [mellaTechVehicles.id],
  }),
  locations: many(mellaTechLocationHistory),
}));

export const mellaTechLocationHistoryRelations = relations(mellaTechLocationHistory, ({ one }) => ({
  vehicle: one(mellaTechVehicles, {
    fields: [mellaTechLocationHistory.vehicleId],
    references: [mellaTechVehicles.id],
  }),
  trip: one(mellaTechTrips, {
    fields: [mellaTechLocationHistory.tripId],
    references: [mellaTechTrips.id],
  }),
}));

export const mellaTechAlertsRelations = relations(mellaTechAlerts, ({ one }) => ({
  vehicle: one(mellaTechVehicles, {
    fields: [mellaTechAlerts.vehicleId],
    references: [mellaTechVehicles.id],
  }),
}));

// Insert schemas for MellaTech tables
export const insertMellaTechVehicleSchema = createInsertSchema(mellaTechVehicles).omit({
  id: true,
  syncedAt: true,
  createdAt: true,
});

export const insertMellaTechTripSchema = createInsertSchema(mellaTechTrips).omit({
  id: true,
  createdAt: true,
});

export const insertMellaTechLocationHistorySchema = createInsertSchema(mellaTechLocationHistory).omit({
  id: true,
  createdAt: true,
});

export const insertMellaTechAlertSchema = createInsertSchema(mellaTechAlerts).omit({
  id: true,
  createdAt: true,
});

// Select types for MellaTech tables
export type MellaTechVehicle = typeof mellaTechVehicles.$inferSelect;
export type InsertMellaTechVehicle = z.infer<typeof insertMellaTechVehicleSchema>;

export type MellaTechTrip = typeof mellaTechTrips.$inferSelect;
export type InsertMellaTechTrip = z.infer<typeof insertMellaTechTripSchema>;

export type MellaTechLocationHistory = typeof mellaTechLocationHistory.$inferSelect;
export type InsertMellaTechLocationHistory = z.infer<typeof insertMellaTechLocationHistorySchema>;

export type MellaTechAlert = typeof mellaTechAlerts.$inferSelect;
export type InsertMellaTechAlert = z.infer<typeof insertMellaTechAlertSchema>;

// ============================================
// ETHIOPIAN CALENDAR YEAR MANAGEMENT
// ============================================

// Work Orders Archive - Storage for completed work orders from previous years
export const workOrdersArchive = pgTable("work_orders_archive", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  originalWorkOrderId: varchar("original_work_order_id").notNull(), // Original work order ID before archiving
  workOrderNumber: text("work_order_number").notNull(),
  ethiopianYear: integer("ethiopian_year").notNull(), // Ethiopian year when this work order was completed
  equipmentId: varchar("equipment_id"),
  equipmentModel: text("equipment_model"),
  priority: text("priority"),
  workType: text("work_type"),
  description: text("description"),
  status: text("status"),
  actualHours: decimal("actual_hours", { precision: 5, scale: 2 }),
  actualCost: decimal("actual_cost", { precision: 12, scale: 2 }),
  directMaintenanceCost: decimal("direct_maintenance_cost", { precision: 12, scale: 2 }),
  overtimeCost: decimal("overtime_cost", { precision: 12, scale: 2 }),
  outsourceCost: decimal("outsource_cost", { precision: 12, scale: 2 }),
  overheadCost: decimal("overhead_cost", { precision: 12, scale: 2 }),
  isOutsourced: boolean("is_outsourced"),
  createdById: varchar("created_by_id"),
  createdByName: text("created_by_name"), // Denormalized for history
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at"),
  archivedAt: timestamp("archived_at").defaultNow().notNull(),
  archivedBy: varchar("archived_by").references(() => employees.id),
});

// Year Closure Logs - Track Ethiopian year closure events
export const yearClosureLogs = pgTable("year_closure_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  closedEthiopianYear: integer("closed_ethiopian_year").notNull(), // Year that was closed
  newEthiopianYear: integer("new_ethiopian_year").notNull(), // New year that was started
  workOrdersArchived: integer("work_orders_archived").default(0).notNull(), // Count of completed work orders archived
  workOrdersRolledOver: integer("work_orders_rolled_over").default(0).notNull(), // Count of pending work orders copied to new year
  workshopsReset: integer("workshops_reset").default(0).notNull(), // Count of workshops whose targets were reset
  closedAt: timestamp("closed_at").defaultNow().notNull(),
  closedBy: varchar("closed_by").notNull().references(() => employees.id),
  closedByName: text("closed_by_name"), // Denormalized for history
  notes: text("notes"), // Optional notes about the closure
});

// Insert schemas for Ethiopian year management
export const insertWorkOrdersArchiveSchema = createInsertSchema(workOrdersArchive).omit({
  id: true,
  archivedAt: true,
});

export const insertYearClosureLogSchema = createInsertSchema(yearClosureLogs).omit({
  id: true,
  closedAt: true,
});

// Select types for Ethiopian year management
export type WorkOrderArchive = typeof workOrdersArchive.$inferSelect;
export type InsertWorkOrderArchive = z.infer<typeof insertWorkOrdersArchiveSchema>;

export type YearClosureLog = typeof yearClosureLogs.$inferSelect;
export type InsertYearClosureLog = z.infer<typeof insertYearClosureLogSchema>;

// Extended type for archived work orders with parts
export type PartUsedInfo = {
  workOrderId: string;
  id: string;
  quantityIssued: number;
  issuedAt: Date;
  notes: string | null;
  partNumber: string | null;
  partName: string | null;
  description: string | null;
  unitOfMeasure: string | null;
};

export type WorkOrderArchiveWithParts = WorkOrderArchive & {
  partsUsed: PartUsedInfo[];
};
