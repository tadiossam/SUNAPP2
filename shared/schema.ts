import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, timestamp, boolean, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Equipment table - stores heavy machinery information
export const equipment = pgTable("equipment", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  equipmentType: text("equipment_type").notNull(), // DOZER, WHEEL LOADER, etc.
  make: text("make").notNull(), // CAT, KOMATSU, VOLVO, CATERPILLAR
  model: text("model").notNull(), // D8R, D155A-5, L-90C, etc.
  plateNo: text("plate_no"),
  assetNo: text("asset_no"),
  newAssetNo: text("new_asset_no"),
  machineSerial: text("machine_serial"),
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
export const equipmentRelations = relations(equipment, ({ many }) => ({
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
