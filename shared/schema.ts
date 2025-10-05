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
  // Maintenance information
  locationInstructions: text("location_instructions"), // Where to find the part on machinery
  tutorialVideoUrl: text("tutorial_video_url"), // Video tutorial for replacement
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
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas for users
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

// Select types for users
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Extended types with relations
export type SparePartWithCompatibility = SparePart & {
  compatibleMakes?: string[];
  compatibleModels?: string[];
};
