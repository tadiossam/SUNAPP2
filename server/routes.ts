import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { eq, or, ilike, sql, desc } from "drizzle-orm";
import { z } from "zod";
import { 
  insertEquipmentCategorySchema,
  insertEquipmentSchema, 
  insertSparePartSchema,
  insertMechanicSchema,
  insertMaintenanceRecordSchema,
  insertPartsUsageHistorySchema,
  insertOperatingBehaviorReportSchema,
  insertGarageSchema,
  insertWorkshopSchema,
  insertWorkshopMemberSchema,
  insertEmployeeSchema,
  insertWorkOrderSchema,
  insertPartsStorageLocationSchema,
  insertEquipmentLocationSchema,
  insertEquipmentReceptionSchema,
  insertReceptionChecklistSchema,
  insertReceptionInspectionItemSchema,
  insertDamageReportSchema,
  insertRepairEstimateSchema,
  insertPartsRequestSchema,
  insertApprovalSchema,
  insertEquipmentInspectionSchema,
  insertInspectionChecklistItemSchema,
  items,
  insertItemSchema,
  equipment,
  d365SyncLogs,
  insertD365SyncLogSchema,
} from "@shared/schema";
import multer from "multer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { isCEO, isCEOOrAdmin, isAuthenticated, canApprove, verifyCredentials, generateToken } from "./auth";
import { sendCEONotification, createNotification } from "./email-service";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import express from "express";
import bcrypt from "bcrypt";

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (_req, file, cb) => {
    // Accept images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  }
});

// Configure multer for 3D model files
const upload3DModel = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit for 3D models
  fileFilter: (_req, file, cb) => {
    // Accept 3D model formats
    const allowedMimeTypes = [
      'model/gltf-binary', // GLB
      'model/gltf+json',   // GLTF
      'model/obj',         // OBJ
      'application/octet-stream', // Fallback for GLB files
    ];
    const allowedExtensions = ['.glb', '.gltf', '.obj'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
    
    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Only 3D model files (GLB, GLTF, OBJ) are allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Serve stock images as static files
  app.use('/stock_images', express.static(join(process.cwd(), 'attached_assets', 'stock_images')));

  // Authentication endpoints
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password, language } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password required" });
      }

      const user = await verifyCredentials(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update user language preference if provided
      if (language && (language === 'en' || language === 'am')) {
        await storage.updateUserLanguage(user.id, language);
        user.language = language;
      }

      const token = generateToken(user);
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ 
        user: userWithoutPassword,
        token 
      });
    } catch (error) {
      res.status(500).json({ message: "Authentication error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    // With JWT, logout is handled client-side by removing the token
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.user) {
      const { password, ...userWithoutPassword } = req.user as any;
      res.json({ user: userWithoutPassword });
    } else {
      res.json({ user: null });
    }
  });

  // User language preference update
  app.post("/api/user/language", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const { language } = req.body;
      
      if (!language || (language !== 'en' && language !== 'am')) {
        return res.status(400).json({ message: "Invalid language. Must be 'en' or 'am'" });
      }

      await storage.updateUserLanguage(req.user.id, language);
      
      res.json({ message: "Language preference updated successfully" });
    } catch (error) {
      console.error("Error updating language preference:", error);
      res.status(500).json({ message: "Failed to update language preference" });
    }
  });

  // Equipment Category endpoints
  app.get("/api/equipment-categories", async (req, res) => {
    try {
      const categories = await storage.getAllEquipmentCategories();
      
      // Prevent caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching equipment categories:", error);
      res.status(500).json({ error: "Failed to fetch equipment categories" });
    }
  });

  app.get("/api/equipment-categories/:id", async (req, res) => {
    try {
      const category = await storage.getEquipmentCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching equipment category:", error);
      res.status(500).json({ error: "Failed to fetch equipment category" });
    }
  });

  // Protected: Only CEO/Admin can create categories
  app.post("/api/equipment-categories", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentCategorySchema.parse(req.body);
      const category = await storage.createEquipmentCategory(validatedData);
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created',
          'equipment_category',
          category.id,
          req.user.username,
          validatedData
        ));
      }
      
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating equipment category:", error);
      res.status(500).json({ error: "Failed to create equipment category" });
    }
  });

  // Protected: Only CEO/Admin can update categories
  app.put("/api/equipment-categories/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentCategorySchema.partial().parse(req.body);
      const category = await storage.updateEquipmentCategory(req.params.id, validatedData);
      
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated',
          'equipment_category',
          category.id,
          req.user.username,
          validatedData
        ));
      }
      
      res.json(category);
    } catch (error) {
      console.error("Error updating equipment category:", error);
      res.status(500).json({ error: "Failed to update equipment category" });
    }
  });

  // Protected: Only CEO/Admin can delete categories
  app.delete("/api/equipment-categories/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEquipmentCategory(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'deleted',
          'equipment_category',
          req.params.id,
          req.user.username,
          { id: req.params.id }
        ));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting equipment category:", error);
      res.status(500).json({ error: "Failed to delete equipment category" });
    }
  });

  // Equipment endpoints with server-side search
  app.get("/api/equipment", async (req, res) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const equipmentType = req.query.equipmentType as string | undefined;
      const make = req.query.make as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await storage.searchEquipment({
        searchTerm,
        equipmentType: equipmentType !== "all" ? equipmentType : undefined,
        make: make !== "all" ? make : undefined,
        limit,
        offset,
      });

      // Prevent caching to ensure fresh data
      res.set({
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
      res.json(result.items);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  app.get("/api/equipment/:id", async (req, res) => {
    try {
      const equipment = await storage.getEquipmentById(req.params.id);
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ error: "Failed to fetch equipment" });
    }
  });

  // Protected: Only CEO/Admin can create equipment
  app.post("/api/equipment", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.createEquipment(validatedData);
      
      // Send email notification if user is admin (CEO gets notified about admin actions)
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created',
          'equipment',
          equipment.id,
          req.user.username,
          validatedData
        ));
      }
      
      res.status(201).json(equipment);
    } catch (error) {
      console.error("Error creating equipment:", error);
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  // Protected: Only CEO/Admin can update equipment
  app.put("/api/equipment/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment = await storage.updateEquipment(req.params.id, validatedData);
      
      if (!equipment) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated',
          'equipment',
          equipment.id,
          req.user.username,
          validatedData
        ));
      }
      
      res.json(equipment);
    } catch (error) {
      console.error("Error updating equipment:", error);
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  // Protected: Only CEO/Admin can delete equipment
  app.delete("/api/equipment/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteEquipment(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Equipment not found" });
      }
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'deleted',
          'equipment',
          req.params.id,
          req.user.username,
          { id: req.params.id }
        ));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting equipment:", error);
      res.status(500).json({ error: "Failed to delete equipment" });
    }
  });

  // Protected: Only CEO/Admin can import equipment from Excel
  app.post("/api/equipment/import", isCEOOrAdmin, async (req, res) => {
    try {
      const { equipment: equipmentList } = req.body;
      
      if (!Array.isArray(equipmentList) || equipmentList.length === 0) {
        return res.status(400).json({ error: "Invalid equipment list" });
      }
      
      // Validate all equipment data
      const validatedEquipment = equipmentList.map(item => insertEquipmentSchema.parse(item));
      
      // Create all equipment
      const created = await Promise.all(
        validatedEquipment.map(data => storage.createEquipment(data))
      );
      
      // Send email notification if user is admin
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created',
          'equipment',
          'bulk',
          req.user.username,
          { action: 'bulk import', count: created.length }
        ));
      }
      
      res.status(201).json({ success: true, count: created.length, equipment: created });
    } catch (error) {
      console.error("Error importing equipment:", error);
      res.status(400).json({ error: "Invalid equipment data" });
    }
  });

  // Spare parts endpoints with server-side search
  app.get("/api/parts", async (req, res) => {
    try {
      const searchTerm = req.query.search as string | undefined;
      const category = req.query.category as string | undefined;
      const stockStatus = req.query.stockStatus as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const offset = req.query.offset ? parseInt(req.query.offset as string) : 0;

      const result = await storage.searchParts({
        searchTerm,
        category: category !== "all" ? category : undefined,
        stockStatus: stockStatus !== "all" ? stockStatus : undefined,
        limit,
        offset,
      });

      res.json(result.items);
    } catch (error) {
      console.error("Error fetching parts:", error);
      res.status(500).json({ error: "Failed to fetch parts" });
    }
  });

  app.get("/api/parts/:id", async (req, res) => {
    try {
      const part = await storage.getPartById(req.params.id);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      res.json(part);
    } catch (error) {
      console.error("Error fetching part:", error);
      res.status(500).json({ error: "Failed to fetch part" });
    }
  });

  app.post("/api/parts", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.parse(req.body);
      const part = await storage.createPart(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'spare_part', part.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(part);
    } catch (error) {
      console.error("Error creating part:", error);
      res.status(400).json({ error: "Invalid part data" });
    }
  });

  app.put("/api/parts/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertSparePartSchema.partial().parse(req.body);
      const part = await storage.updatePart(req.params.id, validatedData);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, validatedData
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating part:", error);
      res.status(400).json({ error: "Invalid part data" });
    }
  });

  // Upload 3D model file to object storage
  app.post("/api/parts/:id/upload-model", isCEOOrAdmin, upload3DModel.single('modelFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const partId = req.params.id;
      const part = await storage.getPartById(partId);
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      // Generate unique filename with part number
      const fileExtension = req.file.originalname.substring(req.file.originalname.lastIndexOf('.'));
      const fileName = `${part.partNumber}-${nanoid(8)}${fileExtension}`;
      
      // Get the public object storage path
      const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
      if (!publicPath) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Create models directory if it doesn't exist
      await mkdir(join(publicPath, 'models'), { recursive: true });

      // Write file to object storage
      const filePath = join(publicPath, 'models', fileName);
      await writeFile(filePath, req.file.buffer);

      // Update part with publicly accessible URL path
      const publicUrl = `/public/models/${fileName}`;
      const updatedPart = await storage.updatePartModel(partId, publicUrl);

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, { action: '3D model uploaded', fileName }
        ));
      }

      res.json({ 
        message: "3D model uploaded successfully",
        part: updatedPart,
        modelPath: publicUrl
      });
    } catch (error) {
      console.error("Error uploading 3D model:", error);
      res.status(500).json({ error: "Failed to upload 3D model" });
    }
  });

  app.put("/api/parts/:id/model", isCEOOrAdmin, async (req, res) => {
    try {
      const { model3dPath } = req.body;
      if (!model3dPath) {
        return res.status(400).json({ error: "model3dPath is required" });
      }
      const part = await storage.updatePartModel(req.params.id, model3dPath);
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, { model3dPath }
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating part model:", error);
      res.status(500).json({ error: "Failed to update part model" });
    }
  });

  // Maintenance information update endpoint
  app.put("/api/parts/:id/maintenance", isCEOOrAdmin, async (req, res) => {
    try {
      const { locationInstructions, requiredTools, installTimeEstimates } = req.body;
      const part = await storage.updatePartMaintenance(req.params.id, {
        locationInstructions,
        requiredTools,
        installTimeEstimates,
      });
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, 
          { locationInstructions, requiredTools, installTimeEstimates }
        ));
      }
      
      res.json(part);
    } catch (error) {
      console.error("Error updating maintenance info:", error);
      res.status(500).json({ error: "Failed to update maintenance information" });
    }
  });

  // Note: Tutorial video and image uploads now use presigned URLs
  // See /api/parts/:id/tutorial/upload-url, PUT /api/parts/:id/tutorial
  // And /api/parts/:id/images/upload-urls, PUT /api/parts/:id/images endpoints

  // Maintenance History endpoints
  // Mechanics
  app.get("/api/mechanics", async (req, res) => {
    try {
      const mechanics = await storage.getAllMechanics();
      res.json(mechanics);
    } catch (error) {
      console.error("Error fetching mechanics:", error);
      res.status(500).json({ error: "Failed to fetch mechanics" });
    }
  });

  app.get("/api/mechanics/:id", async (req, res) => {
    try {
      const mechanic = await storage.getMechanicById(req.params.id);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      res.json(mechanic);
    } catch (error) {
      console.error("Error fetching mechanic:", error);
      res.status(500).json({ error: "Failed to fetch mechanic" });
    }
  });

  app.post("/api/mechanics", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertMechanicSchema.parse(req.body);
      const mechanic = await storage.createMechanic(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'maintenance', mechanic.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(mechanic);
    } catch (error) {
      console.error("Error creating mechanic:", error);
      res.status(400).json({ error: "Invalid mechanic data" });
    }
  });

  app.put("/api/mechanics/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const mechanic = await storage.updateMechanic(req.params.id, req.body);
      if (!mechanic) {
        return res.status(404).json({ error: "Mechanic not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'maintenance', mechanic.id, req.user.username, req.body
        ));
      }
      
      res.json(mechanic);
    } catch (error) {
      console.error("Error updating mechanic:", error);
      res.status(400).json({ error: "Failed to update mechanic" });
    }
  });

  // Maintenance Records
  app.get("/api/equipment/:equipmentId/maintenance", async (req, res) => {
    try {
      const records = await storage.getMaintenanceRecordsByEquipment(req.params.equipmentId);
      res.json(records);
    } catch (error) {
      console.error("Error fetching maintenance records:", error);
      res.status(500).json({ error: "Failed to fetch maintenance records" });
    }
  });

  app.get("/api/maintenance/:id", async (req, res) => {
    try {
      const record = await storage.getMaintenanceRecordById(req.params.id);
      if (!record) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      res.json(record);
    } catch (error) {
      console.error("Error fetching maintenance record:", error);
      res.status(500).json({ error: "Failed to fetch maintenance record" });
    }
  });

  app.post("/api/maintenance", isCEOOrAdmin, async (req, res) => {
    try {
      const { partsUsed, ...recordData } = req.body;
      
      // Validate maintenance record data
      const validatedRecord = insertMaintenanceRecordSchema.parse(recordData);
      const record = await storage.createMaintenanceRecord(validatedRecord);

      // Add parts if provided
      if (partsUsed && Array.isArray(partsUsed) && partsUsed.length > 0) {
        const validatedParts = partsUsed.map((part: any) => ({
          ...part,
          maintenanceRecordId: record.id,
        }));
        await storage.addPartsToMaintenance(record.id, validatedParts);
      }

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'maintenance', record.id, req.user.username, recordData
        ));
      }

      res.status(201).json(record);
    } catch (error) {
      console.error("Error creating maintenance record:", error);
      res.status(400).json({ error: "Invalid maintenance record data" });
    }
  });

  app.put("/api/maintenance/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const record = await storage.updateMaintenanceRecord(req.params.id, req.body);
      if (!record) {
        return res.status(404).json({ error: "Maintenance record not found" });
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'maintenance', record.id, req.user.username, req.body
        ));
      }
      
      res.json(record);
    } catch (error) {
      console.error("Error updating maintenance record:", error);
      res.status(400).json({ error: "Failed to update maintenance record" });
    }
  });

  // Parts Usage History
  app.get("/api/equipment/:equipmentId/parts-usage", async (req, res) => {
    try {
      const partsUsage = await storage.getPartsUsageByEquipment(req.params.equipmentId);
      res.json(partsUsage);
    } catch (error) {
      console.error("Error fetching parts usage:", error);
      res.status(500).json({ error: "Failed to fetch parts usage" });
    }
  });

  app.post("/api/maintenance/:maintenanceId/parts", isCEOOrAdmin, async (req, res) => {
    try {
      const parts = req.body.parts || [];
      const validatedParts = parts.map((part: any) => 
        insertPartsUsageHistorySchema.parse({
          ...part,
          maintenanceRecordId: req.params.maintenanceId,
        })
      );
      await storage.addPartsToMaintenance(req.params.maintenanceId, validatedParts);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'parts_usage', req.params.maintenanceId, req.user.username, { parts }
        ));
      }
      
      res.status(201).json({ message: "Parts added successfully" });
    } catch (error) {
      console.error("Error adding parts to maintenance:", error);
      res.status(400).json({ error: "Invalid parts data" });
    }
  });

  // Operating Behavior Reports
  app.get("/api/equipment/:equipmentId/operating-reports", async (req, res) => {
    try {
      const reports = await storage.getOperatingReportsByEquipment(req.params.equipmentId);
      res.json(reports);
    } catch (error) {
      console.error("Error fetching operating reports:", error);
      res.status(500).json({ error: "Failed to fetch operating reports" });
    }
  });

  app.post("/api/operating-reports", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertOperatingBehaviorReportSchema.parse(req.body);
      const report = await storage.createOperatingReport(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'operating_report', report.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(report);
    } catch (error) {
      console.error("Error creating operating report:", error);
      res.status(400).json({ error: "Invalid operating report data" });
    }
  });

  // ============================================
  // GARAGE MANAGEMENT ROUTES
  // ============================================

  // Garages/Workshops
  app.get("/api/garages", async (req, res) => {
    try {
      const garages = await storage.getAllGarages();
      res.json(garages);
    } catch (error) {
      console.error("Error fetching garages:", error);
      res.status(500).json({ error: "Failed to fetch garages" });
    }
  });

  app.get("/api/garages/:id", async (req, res) => {
    try {
      const garage = await storage.getGarageById(req.params.id);
      if (!garage) {
        return res.status(404).json({ error: "Garage not found" });
      }
      res.json(garage);
    } catch (error) {
      console.error("Error fetching garage:", error);
      res.status(500).json({ error: "Failed to fetch garage" });
    }
  });

  app.post("/api/garages", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertGarageSchema.parse(req.body);
      const garage = await storage.createGarage(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'garage', garage.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(garage);
    } catch (error) {
      console.error("Error creating garage:", error);
      res.status(400).json({ error: "Invalid garage data" });
    }
  });

  app.put("/api/garages/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertGarageSchema.parse(req.body);
      const garage = await storage.updateGarage(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'garage', garage.id, req.user.username, validatedData
        ));
      }
      
      res.json(garage);
    } catch (error) {
      console.error("Error updating garage:", error);
      res.status(400).json({ error: "Failed to update garage" });
    }
  });

  app.delete("/api/garages/:id", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.deleteGarage(req.params.id);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'deleted', 'garage', req.params.id, req.user.username, {}
        ));
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting garage:", error);
      
      // Handle specific error messages
      if (error instanceof Error) {
        if (error.message === "Garage not found") {
          return res.status(404).json({ error: error.message });
        }
        if (error.message.startsWith("Cannot delete garage:")) {
          return res.status(400).json({ error: error.message });
        }
      }
      
      res.status(500).json({ error: "Failed to delete garage" });
    }
  });

  // Workshops
  app.get("/api/garages/:garageId/workshops", async (req, res) => {
    try {
      const workshopsList = await storage.getWorkshopsByGarage(req.params.garageId);
      res.json(workshopsList);
    } catch (error) {
      console.error("Error fetching workshops:", error);
      res.status(500).json({ error: "Failed to fetch workshops" });
    }
  });

  app.post("/api/workshops", isCEOOrAdmin, async (req, res) => {
    try {
      const { memberIds, ...workshopData } = req.body;
      console.log("[Workshop Create] Request body:", JSON.stringify(req.body));
      const validatedData = insertWorkshopSchema.parse(workshopData);
      const workshop = await storage.createWorkshop(validatedData);
      console.log("[Workshop Create] Created workshop ID:", workshop.id);
      
      // Add members if provided
      if (memberIds && Array.isArray(memberIds)) {
        console.log("[Workshop Create] Adding", memberIds.length, "members to workshop", workshop.id);
        for (const employeeId of memberIds) {
          console.log("[Workshop Create] Adding member:", employeeId, "to workshop:", workshop.id);
          await storage.addWorkshopMember({
            workshopId: workshop.id,
            employeeId: employeeId,
          });
        }
      }
      
      res.status(201).json(workshop);
    } catch (error) {
      console.error("Error creating workshop:", error);
      res.status(400).json({ error: "Invalid workshop data" });
    }
  });

  app.put("/api/workshops/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const { memberIds, ...workshopData } = req.body;
      const validatedData = insertWorkshopSchema.parse(workshopData);
      const workshop = await storage.updateWorkshop(req.params.id, validatedData);
      
      // Update members if provided
      if (memberIds && Array.isArray(memberIds)) {
        // Get existing members
        const existingMembers = await storage.getWorkshopMembers(req.params.id);
        const existingMemberIds = existingMembers.map(m => m.id);
        
        // Remove members that are not in the new list
        for (const existingId of existingMemberIds) {
          if (!memberIds.includes(existingId)) {
            await storage.removeWorkshopMember(req.params.id, existingId);
          }
        }
        
        // Add new members
        for (const employeeId of memberIds) {
          if (!existingMemberIds.includes(employeeId)) {
            await storage.addWorkshopMember({
              workshopId: req.params.id,
              employeeId: employeeId,
            });
          }
        }
      }
      
      res.json(workshop);
    } catch (error) {
      console.error("Error updating workshop:", error);
      res.status(400).json({ error: "Failed to update workshop" });
    }
  });

  app.delete("/api/workshops/:id", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.deleteWorkshop(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting workshop:", error);
      res.status(500).json({ error: "Failed to delete workshop" });
    }
  });

  // Workshop Members
  app.post("/api/workshops/:workshopId/members", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertWorkshopMemberSchema.parse({
        ...req.body,
        workshopId: req.params.workshopId,
      });
      const member = await storage.addWorkshopMember(validatedData);
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding workshop member:", error);
      res.status(400).json({ error: "Failed to add workshop member" });
    }
  });

  app.delete("/api/workshops/:workshopId/members/:employeeId", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.removeWorkshopMember(req.params.workshopId, req.params.employeeId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error removing workshop member:", error);
      res.status(500).json({ error: "Failed to remove workshop member" });
    }
  });

  app.get("/api/workshops/:workshopId/members", async (req, res) => {
    try {
      const members = await storage.getWorkshopMembers(req.params.workshopId);
      res.json(members);
    } catch (error) {
      console.error("Error fetching workshop members:", error);
      res.status(500).json({ error: "Failed to fetch workshop members" });
    }
  });

  // Employees
  app.get("/api/employees", async (req, res) => {
    try {
      const { role, garageId } = req.query;
      const employees = await storage.getAllEmployees(
        role as string | undefined, 
        garageId as string | undefined
      );
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ error: "Failed to fetch employees" });
    }
  });

  app.get("/api/employees/:id", async (req, res) => {
    try {
      const employee = await storage.getEmployeeById(req.params.id);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }
      res.json(employee);
    } catch (error) {
      console.error("Error fetching employee:", error);
      res.status(500).json({ error: "Failed to fetch employee" });
    }
  });

  app.post("/api/employees", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Hash password if provided
      if (validatedData.password) {
        validatedData.password = await bcrypt.hash(validatedData.password, 10);
      }
      
      const employee = await storage.createEmployee(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'employee', employee.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(employee);
    } catch (error) {
      console.error("Error creating employee:", error);
      res.status(400).json({ error: "Invalid employee data" });
    }
  });

  app.put("/api/employees/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEmployeeSchema.parse(req.body);
      
      // Hash password if provided (update scenario)
      if (validatedData.password) {
        validatedData.password = await bcrypt.hash(validatedData.password, 10);
      }
      
      const employee = await storage.updateEmployee(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'employee', employee.id, req.user.username, validatedData
        ));
      }
      
      res.json(employee);
    } catch (error) {
      console.error("Error updating employee:", error);
      res.status(400).json({ error: "Failed to update employee" });
    }
  });

  app.delete("/api/employees/:id", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.deleteEmployee(req.params.id);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'deleted', 'employee', req.params.id, req.user.username, {}
        ));
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting employee:", error);
      res.status(400).json({ error: "Failed to delete employee" });
    }
  });

  // Get presigned upload URL for employee photo
  app.post("/api/employees/:id/photo/upload-url", isCEOOrAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getPublicObjectUploadURL();
      
      // Extract the object path from the upload URL (before query parameters)
      const url = new URL(uploadURL);
      const objectPath = objectStorageService.normalizePublicObjectPath(url.origin + url.pathname);
      
      res.json({ uploadURL, objectPath });
    } catch (error) {
      console.error("Error generating photo upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Update employee with photo URL after upload
  app.put("/api/employees/:id/photo", isCEOOrAdmin, async (req, res) => {
    try {
      if (!req.body.photoUrl) {
        return res.status(400).json({ error: "photoUrl is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizePublicObjectPath(req.body.photoUrl);

      // Update employee with photo URL
      const employee = await storage.updateEmployeePhoto(req.params.id, objectPath);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error updating employee photo:", error);
      res.status(500).json({ error: "Failed to update photo" });
    }
  });

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const { status, assignedToId, garageId, workshopId } = req.query;
      const workOrders = await storage.getAllWorkOrders({
        status: status as string | undefined,
        assignedToId: assignedToId as string | undefined,
        garageId: garageId as string | undefined,
        workshopId: workshopId as string | undefined,
      });
      res.json(workOrders);
    } catch (error) {
      console.error("Error fetching work orders:", error);
      res.status(500).json({ error: "Failed to fetch work orders" });
    }
  });

  app.get("/api/work-orders/generate-number", async (_req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `WO-${currentYear}-`;
      
      const existingOrders = await storage.getWorkOrdersByPrefix(prefix);
      const existingNumbers = new Set(existingOrders.map(o => o.workOrderNumber));
      
      let nextNumber = 1;
      let generatedNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      
      // Find next available number (handle gaps from deleted orders)
      while (existingNumbers.has(generatedNumber)) {
        nextNumber++;
        generatedNumber = `${prefix}${String(nextNumber).padStart(3, '0')}`;
      }
      
      res.json({ workOrderNumber: generatedNumber });
    } catch (error) {
      console.error("Error generating work order number:", error);
      res.status(500).json({ error: "Failed to generate work order number" });
    }
  });

  app.get("/api/work-orders/:id", async (req, res) => {
    try {
      const workOrder = await storage.getWorkOrderById(req.params.id);
      if (!workOrder) {
        return res.status(404).json({ error: "Work order not found" });
      }
      res.json(workOrder);
    } catch (error) {
      console.error("Error fetching work order:", error);
      res.status(500).json({ error: "Failed to fetch work order" });
    }
  });

  app.post("/api/work-orders", isCEOOrAdmin, async (req, res) => {
    try {
      // Extract requiredParts from body
      const { requiredParts, ...workOrderData } = req.body;
      
      // Remove empty work order number to allow auto-generation
      if (!workOrderData.workOrderNumber || workOrderData.workOrderNumber.trim() === '') {
        delete workOrderData.workOrderNumber;
      }
      
      const validatedData = insertWorkOrderSchema.parse({
        ...workOrderData,
        createdById: req.user?.id,
      });
      const workOrder = await storage.createWorkOrder(validatedData);
      
      // Save required parts if provided
      if (requiredParts && Array.isArray(requiredParts) && requiredParts.length > 0) {
        const partsToInsert = requiredParts.map((part: any) => ({
          workOrderId: workOrder.id,
          sparePartId: part.partId || null,
          partName: part.partName,
          partNumber: part.partNumber,
          stockStatus: part.stockStatus || null,
          quantity: part.quantity || 1,
        }));
        await storage.replaceWorkOrderRequiredParts(workOrder.id, partsToInsert);
      }
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'work_order', workOrder.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(workOrder);
    } catch (error) {
      console.error("Error creating work order:", error);
      res.status(400).json({ error: "Invalid work order data" });
    }
  });

  app.put("/api/work-orders/:id", isCEOOrAdmin, async (req, res) => {
    try {
      // Extract requiredParts from body
      const { requiredParts, ...workOrderData } = req.body;
      
      const validatedData = insertWorkOrderSchema.parse(workOrderData);
      const workOrder = await storage.updateWorkOrder(req.params.id, validatedData);
      
      // Update required parts if provided
      if (requiredParts && Array.isArray(requiredParts)) {
        const partsToInsert = requiredParts.map((part: any) => ({
          workOrderId: req.params.id,
          sparePartId: part.partId || part.id || null,
          partName: part.partName,
          partNumber: part.partNumber,
          stockStatus: part.stockStatus || null,
          quantity: part.quantity || 1,
        }));
        await storage.replaceWorkOrderRequiredParts(req.params.id, partsToInsert);
      }
      
      res.json(workOrder);
    } catch (error) {
      console.error("Error updating work order:", error);
      res.status(400).json({ error: "Failed to update work order" });
    }
  });

  app.delete("/api/work-orders/:id", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.deleteWorkOrder(req.params.id);
      res.json({ message: "Work order deleted successfully" });
    } catch (error) {
      console.error("Error deleting work order:", error);
      res.status(400).json({ error: "Failed to delete work order" });
    }
  });

  // Equipment Reception endpoints (admin only - full access)
  app.get("/api/equipment-receptions", isCEOOrAdmin, async (_req, res) => {
    try {
      const receptions = await storage.getAllReceptions();
      res.json(receptions);
    } catch (error) {
      console.error("Error fetching equipment receptions:", error);
      res.status(500).json({ error: "Failed to fetch equipment receptions" });
    }
  });

  // Get single equipment reception (authenticated users can view)
  app.get("/api/equipment-receptions/:id", async (req, res) => {
    try {
      const reception = await storage.getReceptionById(req.params.id);
      if (!reception) {
        return res.status(404).json({ error: "Reception not found" });
      }
      res.json(reception);
    } catch (error) {
      console.error("Error fetching equipment reception:", error);
      res.status(500).json({ error: "Failed to fetch equipment reception" });
    }
  });

  app.post("/api/equipment-receptions", async (req, res) => {
    try {
      // Generate reception number
      const currentYear = new Date().getFullYear();
      const prefix = `REC-${currentYear}-`;
      const existingReceptions = await storage.getReceptionsByPrefix(prefix);
      const nextNumber = (existingReceptions.length + 1).toString().padStart(3, '0');
      const receptionNumber = `${prefix}${nextNumber}`;
      
      // Validate and coerce data
      const validatedData = insertEquipmentReceptionSchema.parse({
        ...req.body,
        receptionNumber,
        status: "driver_submitted",
        arrivalDate: req.body.arrivalDate ? new Date(req.body.arrivalDate) : new Date(),
        kilometreRiding: req.body.kilometreRiding ? String(req.body.kilometreRiding) : null,
      });
      
      const reception = await storage.createReception(validatedData);
      res.status(201).json(reception);
    } catch (error) {
      console.error("Error creating equipment reception:", error);
      res.status(400).json({ error: "Failed to create equipment reception" });
    }
  });

  app.patch("/api/equipment-receptions/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const updates = {
        ...req.body,
        updatedAt: new Date(),
      };
      
      const updatedReception = await storage.updateReception(req.params.id, updates);
      res.json(updatedReception);
    } catch (error) {
      console.error("Error updating equipment reception:", error);
      res.status(400).json({ error: "Failed to update equipment reception" });
    }
  });

  // Get equipment receptions assigned to current user (for inspection officers)
  app.get("/api/my-inspections", async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const allReceptions = await storage.getAllReceptions();
      const myInspections = allReceptions.filter(
        (reception) => 
          reception.inspectionOfficerId === userId &&
          reception.status === "awaiting_mechanic"
      );
      
      res.json(myInspections);
    } catch (error) {
      console.error("Error fetching my inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  // Equipment Inspections
  // Get all inspections (authenticated users)
  app.get("/api/inspections", async (req, res) => {
    try {
      const inspections = await storage.getAllInspections();
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching all inspections:", error);
      res.status(500).json({ error: "Failed to fetch inspections" });
    }
  });

  // Create new inspection with auto-generated inspection number
  app.post("/api/inspections", async (req, res) => {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `INS-${currentYear}-`;
      
      // Get existing inspections for this year
      const existingInspections = await storage.getInspectionsByPrefix(prefix);
      
      // Generate next inspection number
      const nextNumber = (existingInspections.length + 1).toString().padStart(3, '0');
      const inspectionNumber = `${prefix}${nextNumber}`;
      
      const validatedData = insertEquipmentInspectionSchema.parse({
        ...req.body,
        inspectionNumber,
        inspectionDate: req.body.inspectionDate ? new Date(req.body.inspectionDate) : new Date(),
      });
      
      const inspection = await storage.createInspection(validatedData);
      res.status(201).json(inspection);
    } catch (error) {
      console.error("Error creating inspection:", error);
      res.status(400).json({ error: "Failed to create inspection" });
    }
  });

  // Get all completed inspections (must be before /:id route)
  app.get("/api/inspections/completed", async (req, res) => {
    try {
      const inspections = await storage.getAllCompletedInspections();
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching completed inspections:", error);
      res.status(500).json({ error: "Failed to fetch completed inspections" });
    }
  });

  // Get all canceled inspections (must be before /:id route)
  app.get("/api/inspections/canceled", async (req, res) => {
    try {
      const inspections = await storage.getCanceledInspections();
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching canceled inspections:", error);
      res.status(500).json({ error: "Failed to fetch canceled inspections" });
    }
  });

  // Get inspection by reception ID (must be before /:id route)
  app.get("/api/inspections/by-reception/:receptionId", async (req, res) => {
    try {
      const inspection = await storage.getInspectionByReceptionId(req.params.receptionId);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  // Get single inspection by ID (authenticated users can view)
  app.get("/api/inspections/:id", async (req, res) => {
    try {
      const inspection = await storage.getInspectionById(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }
      res.json(inspection);
    } catch (error) {
      console.error("Error fetching inspection:", error);
      res.status(500).json({ error: "Failed to fetch inspection" });
    }
  });

  // Update inspection
  app.patch("/api/inspections/:id", async (req, res) => {
    try {
      const updatedInspection = await storage.updateInspection(req.params.id, req.body);
      
      // If inspection status is being changed to "waiting_for_approval", update reception status to "inspection_complete"
      if (req.body.status === "waiting_for_approval" && updatedInspection.receptionId) {
        try {
          await storage.updateReception(updatedInspection.receptionId, { status: "inspection_complete" });
        } catch (error) {
          console.error("Error updating reception status:", error);
          // Don't fail the inspection update if reception update fails
        }
      }
      
      res.json(updatedInspection);
    } catch (error) {
      console.error("Error updating inspection:", error);
      res.status(400).json({ error: "Failed to update inspection" });
    }
  });

  // Inspection Checklist Items
  // Get checklist items for an inspection
  app.get("/api/inspections/:inspectionId/checklist", async (req, res) => {
    try {
      const items = await storage.getChecklistItemsByInspection(req.params.inspectionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ error: "Failed to fetch checklist items" });
    }
  });

  // Create/Update bulk checklist items (upsert with transaction)
  app.post("/api/inspections/:inspectionId/checklist/bulk", async (req, res) => {
    try {
      // Validate request body first
      if (!req.body.items || !Array.isArray(req.body.items)) {
        return res.status(400).json({ error: "Invalid request: items array required" });
      }

      // Use transaction to ensure atomicity: delete and insert together
      const items = await storage.upsertChecklistItems(req.params.inspectionId, req.body.items);
      res.status(201).json(items);
    } catch (error) {
      console.error("Error upserting checklist items:", error);
      res.status(400).json({ error: "Failed to upsert checklist items" });
    }
  });

  // Update single checklist item
  app.patch("/api/checklist-items/:id", async (req, res) => {
    try {
      const updatedItem = await storage.updateChecklistItem(req.params.id, req.body);
      res.json(updatedItem);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(400).json({ error: "Failed to update checklist item" });
    }
  });

  // Approve inspection
  app.post("/api/inspections/:id/approve", isAuthenticated, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      
      if (!approvedById) {
        return res.status(400).json({ error: "Approver ID is required" });
      }

      const inspection = await storage.getInspectionById(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      // Update inspection status to "completed"
      const updatedInspection = await storage.updateInspection(req.params.id, { 
        status: "completed"
      });

      // Auto-create work order if inspection has associated reception
      if (inspection.receptionId) {
        try {
          const reception = await storage.getReceptionById(inspection.receptionId);
          if (reception) {
            // Auto-generate work order number using MAX to avoid duplicates
            const now = new Date();
            const year = now.getFullYear();
            const existingWorkOrders = await storage.getAllWorkOrders();
            const currentYearWorkOrders = existingWorkOrders.filter(wo => 
              wo.workOrderNumber?.startsWith(`WO-${year}`)
            );
            
            // Find the highest suffix number to avoid collisions (supports any number of digits)
            let maxSuffix = 0;
            for (const wo of currentYearWorkOrders) {
              const match = wo.workOrderNumber?.match(/WO-\d{4}-(\d+)/);
              if (match) {
                const suffix = parseInt(match[1], 10);
                if (suffix > maxSuffix) {
                  maxSuffix = suffix;
                }
              }
            }
            const nextNumber = maxSuffix + 1;
            const workOrderNumber = `WO-${year}-${String(nextNumber).padStart(3, '0')}`;

            // Determine work type from inspection findings
            const workType = inspection.overallCondition === "Poor" ? "Major Repair" : "Routine Maintenance";

            // Create work order - let any errors propagate to indicate failure
            await storage.createWorkOrder({
              workOrderNumber,
              equipmentId: reception.equipmentId,
              workType,
              priority: inspection.overallCondition === "Poor" ? "High" : "Medium",
              description: `Work order auto-created from approved inspection ${inspection.inspectionNumber}`,
              scheduledDate: new Date(),
              inspectionId: inspection.id,
              receptionId: reception.id,
              status: "pending",
            });
            
            // Update reception status to "work_order_created" after work order is created
            await storage.updateReception(inspection.receptionId, { status: "work_order_created" });
            
            console.log(`Successfully created work order ${workOrderNumber} from inspection ${inspection.inspectionNumber}`);
          }
        } catch (error) {
          console.error("Error auto-creating work order from inspection:", error);
          // Rollback inspection status if work order creation fails
          await storage.updateInspection(req.params.id, { status: "waiting_for_approval" });
          return res.status(500).json({ 
            error: "Failed to create work order from approved inspection. Please try again or create work order manually." 
          });
        }
      }

      res.json(updatedInspection);
    } catch (error) {
      console.error("Error approving inspection:", error);
      res.status(500).json({ error: "Failed to approve inspection" });
    }
  });

  // Reject inspection
  app.post("/api/inspections/:id/reject", isAuthenticated, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      
      if (!approvedById) {
        return res.status(400).json({ error: "Approver ID is required" });
      }

      const inspection = await storage.getInspectionById(req.params.id);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      // Update inspection status to "rejected"
      const updatedInspection = await storage.updateInspection(req.params.id, { 
        status: "rejected"
      });

      res.json(updatedInspection);
    } catch (error) {
      console.error("Error rejecting inspection:", error);
      res.status(500).json({ error: "Failed to reject inspection" });
    }
  });

  // Parts Storage Locations
  app.get("/api/parts/:partId/locations", async (req, res) => {
    try {
      const locations = await storage.getPartStorageLocations(req.params.partId);
      res.json(locations);
    } catch (error) {
      console.error("Error fetching part locations:", error);
      res.status(500).json({ error: "Failed to fetch part locations" });
    }
  });

  app.get("/api/garages/:garageId/parts-inventory", async (req, res) => {
    try {
      const inventory = await storage.getGaragePartsInventory(req.params.garageId);
      res.json(inventory);
    } catch (error) {
      console.error("Error fetching garage inventory:", error);
      res.status(500).json({ error: "Failed to fetch garage inventory" });
    }
  });

  app.post("/api/parts-storage", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsStorageLocationSchema.parse(req.body);
      const location = await storage.createPartsStorageLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating parts storage location:", error);
      res.status(400).json({ error: "Invalid parts storage data" });
    }
  });

  app.put("/api/parts-storage/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsStorageLocationSchema.parse(req.body);
      const location = await storage.updatePartsStorageLocation(req.params.id, validatedData);
      res.json(location);
    } catch (error) {
      console.error("Error updating parts storage location:", error);
      res.status(400).json({ error: "Failed to update parts storage location" });
    }
  });

  // Equipment Location Tracking
  app.get("/api/equipment/:equipmentId/location-history", async (req, res) => {
    try {
      const history = await storage.getEquipmentLocationHistory(req.params.equipmentId);
      res.json(history);
    } catch (error) {
      console.error("Error fetching location history:", error);
      res.status(500).json({ error: "Failed to fetch location history" });
    }
  });

  app.get("/api/equipment/:equipmentId/current-location", async (req, res) => {
    try {
      const location = await storage.getEquipmentCurrentLocation(req.params.equipmentId);
      res.json(location);
    } catch (error) {
      console.error("Error fetching current location:", error);
      res.status(500).json({ error: "Failed to fetch current location" });
    }
  });

  app.post("/api/equipment-locations", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentLocationSchema.parse(req.body);
      const location = await storage.createEquipmentLocation(validatedData);
      res.status(201).json(location);
    } catch (error) {
      console.error("Error creating equipment location:", error);
      res.status(400).json({ error: "Invalid equipment location data" });
    }
  });

  app.put("/api/equipment-locations/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentLocationSchema.parse(req.body);
      const location = await storage.updateEquipmentLocation(req.params.id, validatedData);
      res.json(location);
    } catch (error) {
      console.error("Error updating equipment location:", error);
      res.status(400).json({ error: "Failed to update equipment location" });
    }
  });

  // Equipment Reception/Check-in Routes
  app.get("/api/receptions", isCEOOrAdmin, async (req, res) => {
    try {
      const { status, garageId } = req.query;
      const receptions = await storage.getAllReceptions({
        status: status as string,
        garageId: garageId as string,
      });
      res.json(receptions);
    } catch (error) {
      console.error("Error fetching receptions:", error);
      res.status(500).json({ error: "Failed to fetch receptions" });
    }
  });

  app.get("/api/receptions/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const reception = await storage.getReceptionById(req.params.id);
      if (!reception) {
        return res.status(404).json({ error: "Reception not found" });
      }
      res.json(reception);
    } catch (error) {
      console.error("Error fetching reception:", error);
      res.status(500).json({ error: "Failed to fetch reception" });
    }
  });

  app.get("/api/equipment/:equipmentId/receptions", isCEOOrAdmin, async (req, res) => {
    try {
      const receptions = await storage.getReceptionsByEquipment(req.params.equipmentId);
      res.json(receptions);
    } catch (error) {
      console.error("Error fetching equipment receptions:", error);
      res.status(500).json({ error: "Failed to fetch equipment receptions" });
    }
  });

  app.post("/api/receptions", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentReceptionSchema.parse(req.body);
      const reception = await storage.createReception(validatedData);
      res.status(201).json(reception);
    } catch (error) {
      console.error("Error creating reception:", error);
      res.status(400).json({ error: "Invalid reception data" });
    }
  });

  app.put("/api/receptions/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertEquipmentReceptionSchema.parse(req.body);
      const reception = await storage.updateReception(req.params.id, validatedData);
      res.json(reception);
    } catch (error) {
      console.error("Error updating reception:", error);
      res.status(400).json({ error: "Failed to update reception" });
    }
  });

  // Cancel reception/inspection
  app.post("/api/receptions/:receptionId/cancel", async (req, res) => {
    try {
      await storage.cancelReception(req.params.receptionId);
      res.json({ message: "Reception and inspection canceled successfully" });
    } catch (error) {
      console.error("Error canceling reception:", error);
      res.status(400).json({ error: "Failed to cancel reception" });
    }
  });

  // Reception Checklists
  app.get("/api/reception-checklists", isCEOOrAdmin, async (req, res) => {
    try {
      const { equipmentType, role } = req.query;
      const checklists = await storage.getChecklistTemplates({
        equipmentType: equipmentType as string,
        role: role as string,
      });
      res.json(checklists);
    } catch (error) {
      console.error("Error fetching checklists:", error);
      res.status(500).json({ error: "Failed to fetch checklists" });
    }
  });

  app.post("/api/reception-checklists", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertReceptionChecklistSchema.parse(req.body);
      const checklist = await storage.createChecklistTemplate(validatedData);
      res.status(201).json(checklist);
    } catch (error) {
      console.error("Error creating checklist:", error);
      res.status(400).json({ error: "Invalid checklist data" });
    }
  });

  // Inspection Items
  app.get("/api/receptions/:receptionId/inspections", isCEOOrAdmin, async (req, res) => {
    try {
      const items = await storage.getInspectionItemsByReception(req.params.receptionId);
      res.json(items);
    } catch (error) {
      console.error("Error fetching inspection items:", error);
      res.status(500).json({ error: "Failed to fetch inspection items" });
    }
  });

  app.post("/api/receptions/:receptionId/inspections", isCEOOrAdmin, async (req, res) => {
    try {
      if (Array.isArray(req.body)) {
        const items = await storage.createBulkInspectionItems(req.body);
        return res.status(201).json(items);
      }
      const validatedData = insertReceptionInspectionItemSchema.parse(req.body);
      const item = await storage.createInspectionItem(validatedData);
      res.status(201).json(item);
    } catch (error) {
      console.error("Error creating inspection items:", error);
      res.status(400).json({ error: "Invalid inspection data" });
    }
  });

  // Damage Reports
  app.get("/api/receptions/:receptionId/damages", isCEOOrAdmin, async (req, res) => {
    try {
      const damages = await storage.getDamageReportsByReception(req.params.receptionId);
      res.json(damages);
    } catch (error) {
      console.error("Error fetching damage reports:", error);
      res.status(500).json({ error: "Failed to fetch damage reports" });
    }
  });

  app.post("/api/receptions/:receptionId/damages", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertDamageReportSchema.parse(req.body);
      const damage = await storage.createDamageReport(validatedData);
      res.status(201).json(damage);
    } catch (error) {
      console.error("Error creating damage report:", error);
      res.status(400).json({ error: "Invalid damage report data" });
    }
  });

  // Repair Estimates
  app.get("/api/receptions/:receptionId/estimate", isCEOOrAdmin, async (req, res) => {
    try {
      const estimate = await storage.getRepairEstimateByReception(req.params.receptionId);
      res.json(estimate);
    } catch (error) {
      console.error("Error fetching repair estimate:", error);
      res.status(500).json({ error: "Failed to fetch repair estimate" });
    }
  });

  app.post("/api/receptions/:receptionId/estimate", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertRepairEstimateSchema.parse(req.body);
      const estimate = await storage.createRepairEstimate(validatedData);
      res.status(201).json(estimate);
    } catch (error) {
      console.error("Error creating repair estimate:", error);
      res.status(400).json({ error: "Invalid estimate data" });
    }
  });

  // ============ APPROVAL SYSTEM ROUTES ============
  
  // Parts Requests
  app.get("/api/parts-requests", isCEOOrAdmin, async (req, res) => {
    try {
      const { status, approvalStatus, requestedById } = req.query;
      const requests = await storage.getAllPartsRequests({
        status: status as string,
        approvalStatus: approvalStatus as string,
        requestedById: requestedById as string,
      });
      res.json(requests);
    } catch (error) {
      console.error("Error fetching parts requests:", error);
      res.status(500).json({ error: "Failed to fetch parts requests" });
    }
  });

  app.get("/api/parts-requests/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const request = await storage.getPartsRequestById(req.params.id);
      if (!request) {
        return res.status(404).json({ error: "Parts request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error("Error fetching parts request:", error);
      res.status(500).json({ error: "Failed to fetch parts request" });
    }
  });

  app.get("/api/work-orders/:workOrderId/parts-requests", isCEOOrAdmin, async (req, res) => {
    try {
      const requests = await storage.getPartsRequestsByWorkOrder(req.params.workOrderId);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching work order parts requests:", error);
      res.status(500).json({ error: "Failed to fetch work order parts requests" });
    }
  });

  app.post("/api/parts-requests", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsRequestSchema.parse(req.body);
      const request = await storage.createPartsRequest(validatedData);
      res.status(201).json(request);
    } catch (error) {
      console.error("Error creating parts request:", error);
      res.status(400).json({ error: "Invalid parts request data" });
    }
  });

  app.put("/api/parts-requests/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertPartsRequestSchema.parse(req.body);
      const request = await storage.updatePartsRequest(req.params.id, validatedData);
      res.json(request);
    } catch (error) {
      console.error("Error updating parts request:", error);
      res.status(400).json({ error: "Failed to update parts request" });
    }
  });

  // Approvals
  app.get("/api/approvals", canApprove, async (req, res) => {
    try {
      const { status, assignedToId, approvalType } = req.query;
      const approvals = await storage.getAllApprovals({
        status: status as string,
        assignedToId: assignedToId as string,
        approvalType: approvalType as string,
      });
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching approvals:", error);
      res.status(500).json({ error: "Failed to fetch approvals" });
    }
  });

  app.get("/api/approvals/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const approval = await storage.getApprovalById(req.params.id);
      if (!approval) {
        return res.status(404).json({ error: "Approval not found" });
      }
      res.json(approval);
    } catch (error) {
      console.error("Error fetching approval:", error);
      res.status(500).json({ error: "Failed to fetch approval" });
    }
  });

  app.get("/api/employees/:employeeId/pending-approvals", isCEOOrAdmin, async (req, res) => {
    try {
      const approvals = await storage.getPendingApprovalsByEmployee(req.params.employeeId);
      res.json(approvals);
    } catch (error) {
      console.error("Error fetching pending approvals:", error);
      res.status(500).json({ error: "Failed to fetch pending approvals" });
    }
  });

  // Create inspection approval (specialized endpoint for inspection workflow)
  app.post("/api/approvals/inspection", isAuthenticated, async (req, res) => {
    try {
      const { inspectionId, inspectionNumber, equipmentInfo, overallCondition, findings, recommendations, approverId } = req.body;

      if (!approverId) {
        return res.status(400).json({ error: "Approver ID is required" });
      }

      // Get the inspection to find the inspector's ID (which is an employee ID)
      const inspection = await storage.getInspectionById(inspectionId);
      if (!inspection) {
        return res.status(404).json({ error: "Inspection not found" });
      }

      // Use the inspector's ID as the requester (inspector is always an employee)
      const requestedById = inspection.inspectorId;

      // Update inspection status to "waiting_for_approval" when submitted
      await storage.updateInspection(inspectionId, { status: "waiting_for_approval" });

      const approval = await storage.createApproval({
        approvalType: "inspection",
        referenceId: inspectionId,
        referenceNumber: inspectionNumber,
        requestedById: requestedById, // Inspector's employee ID
        assignedToId: approverId, // Selected approver's employee ID
        status: "pending",
        priority: "medium",
        description: `Inspection ${inspectionNumber} completed for ${equipmentInfo}`,
        requestNotes: `Overall Condition: ${overallCondition}\n\nFindings: ${findings || "None"}\n\nRecommendations: ${recommendations || "None"}`,
      });

      res.status(201).json(approval);
    } catch (error) {
      console.error("Error creating inspection approval:", error);
      res.status(500).json({ error: "Failed to create inspection approval" });
    }
  });

  app.post("/api/approvals", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertApprovalSchema.parse(req.body);
      const approval = await storage.createApproval(validatedData);
      res.status(201).json(approval);
    } catch (error) {
      console.error("Error creating approval:", error);
      res.status(400).json({ error: "Invalid approval data" });
    }
  });

  app.put("/api/approvals/:id", canApprove, async (req, res) => {
    try {
      const validatedData = insertApprovalSchema.parse(req.body);
      const approval = await storage.updateApproval(req.params.id, validatedData);
      
      // If inspection approval is approved, update inspection status and auto-create work order
      if (approval.approvalType === "inspection" && approval.status === "approved" && approval.referenceId) {
        let inspection = null;
        try {
          inspection = await storage.getInspectionById(approval.referenceId);
          if (inspection && inspection.receptionId) {
            // Update inspection status to "completed"
            await storage.updateInspection(inspection.id, { status: "completed" });
            
            const reception = await storage.getReceptionById(inspection.receptionId);
            if (reception) {
              // Auto-generate work order number using MAX to avoid duplicates (supports any number of digits)
              const now = new Date();
              const year = now.getFullYear();
              const existingWorkOrders = await storage.getAllWorkOrders();
              const currentYearWorkOrders = existingWorkOrders.filter(wo => 
                wo.workOrderNumber?.startsWith(`WO-${year}`)
              );
              
              // Find the highest suffix number to avoid collisions (supports any number of digits)
              let maxSuffix = 0;
              for (const wo of currentYearWorkOrders) {
                const match = wo.workOrderNumber?.match(/WO-\d{4}-(\d+)/);
                if (match) {
                  const suffix = parseInt(match[1], 10);
                  if (suffix > maxSuffix) {
                    maxSuffix = suffix;
                  }
                }
              }
              const nextNumber = maxSuffix + 1;
              const workOrderNumber = `WO-${year}-${String(nextNumber).padStart(3, '0')}`;

              // Determine work type from inspection findings
              const workType = inspection.overallCondition === "Poor" ? "Major Repair" : "Routine Maintenance";

              // Create work order
              await storage.createWorkOrder({
                workOrderNumber,
                equipmentId: reception.equipmentId,
                workType,
                priority: inspection.overallCondition === "Poor" ? "High" : "Medium",
                description: `Work order auto-created from approved inspection ${inspection.inspectionNumber}`,
                scheduledDate: new Date(),
                inspectionId: inspection.id,
                receptionId: reception.id,
                status: "pending",
              });
              
              // Update reception status to "work_order_created" after work order is created
              await storage.updateReception(inspection.receptionId, { status: "work_order_created" });
              
              console.log(`Successfully created work order ${workOrderNumber} from inspection ${inspection.inspectionNumber}`);
            }
          }
        } catch (error) {
          console.error("Error auto-creating work order from inspection:", error);
          // Rollback inspection status if work order creation fails
          if (inspection) {
            await storage.updateInspection(inspection.id, { status: "waiting_for_approval" });
          }
          // Rollback approval status as well
          await storage.updateApproval(req.params.id, { status: "pending" });
          return res.status(500).json({ 
            error: "Failed to create work order from approved inspection. Please try again or create work order manually." 
          });
        }
      }

      res.json(approval);
    } catch (error) {
      console.error("Error updating approval:", error);
      res.status(400).json({ error: "Failed to update approval" });
    }
  });

  // Approval Actions
  app.post("/api/work-orders/:id/approve", isCEOOrAdmin, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      await storage.approveWorkOrder(req.params.id, approvedById, notes);
      res.json({ message: "Work order approved successfully" });
    } catch (error) {
      console.error("Error approving work order:", error);
      res.status(400).json({ error: "Failed to approve work order" });
    }
  });

  app.post("/api/work-orders/:id/reject", isCEOOrAdmin, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      await storage.rejectWorkOrder(req.params.id, approvedById, notes);
      res.json({ message: "Work order rejected successfully" });
    } catch (error) {
      console.error("Error rejecting work order:", error);
      res.status(400).json({ error: "Failed to reject work order" });
    }
  });

  app.post("/api/work-orders/:id/approve-completion", isCEOOrAdmin, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      await storage.approveWorkOrderCompletion(req.params.id, approvedById, notes);
      res.json({ message: "Work order completion approved successfully" });
    } catch (error) {
      console.error("Error approving work order completion:", error);
      res.status(400).json({ error: "Failed to approve work order completion" });
    }
  });

  app.post("/api/parts-requests/:id/approve", isCEOOrAdmin, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      await storage.approvePartsRequest(req.params.id, approvedById, notes);
      res.json({ message: "Parts request approved successfully" });
    } catch (error) {
      console.error("Error approving parts request:", error);
      res.status(400).json({ error: "Failed to approve parts request" });
    }
  });

  app.post("/api/parts-requests/:id/reject", isCEOOrAdmin, async (req, res) => {
    try {
      const { approvedById, notes } = req.body;
      await storage.rejectPartsRequest(req.params.id, approvedById, notes);
      res.json({ message: "Parts request rejected successfully" });
    } catch (error) {
      console.error("Error rejecting parts request:", error);
      res.status(400).json({ error: "Failed to reject parts request" });
    }
  });

  // Debug test page - use API route to ensure it's not caught by Vite
  app.get("/api/debug-test", (_req, res) => {
    res.send(`<!DOCTYPE html>
<html>
<head>
    <title>Debug Test</title>
    <style>
        body { 
            font-family: Arial; 
            padding: 40px; 
            background: #f0f0f0;
        }
        .box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .success { color: green; font-weight: bold; }
    </style>
</head>
<body>
    <div class="box">
        <h1 class="success">✓ Server Connection Working!</h1>
        <p>If you can see this page, your browser can connect to the server.</p>
        <p>Current time: <span id="time"></span></p>
        <button onclick="testAPI()">Test API Connection</button>
        <div id="result"></div>
        <hr>
        <a href="/" style="color: blue;">Go to Main App</a>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleTimeString();
        
        async function testAPI() {
            try {
                const res = await fetch('/api/auth/me');
                const data = await res.json();
                document.getElementById('result').innerHTML = 
                    '<p style="color: green;">API works! Response: ' + JSON.stringify(data) + '</p>';
            } catch (err) {
                document.getElementById('result').innerHTML = 
                    '<p style="color: red;">API error: ' + err.message + '</p>';
            }
        }
    </script>
</body>
</html>`);
  });

  // Object Storage endpoints
  
  // Serve public objects from object storage
  app.get("/public-objects/:filePath(*)", async (req, res) => {
    const filePath = req.params.filePath;
    const objectStorageService = new ObjectStorageService();
    try {
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        return res.status(404).json({ error: "File not found" });
      }
      objectStorageService.downloadObject(file, res);
    } catch (error: any) {
      // Suppress verbose errors when not in Replit environment (Windows/local development)
      const isReplitConnectionError = error?.code === 'ECONNREFUSED' && error?.message?.includes('127.0.0.1:1106');
      if (!isReplitConnectionError) {
        console.error("Error searching for public object:", error);
      }
      return res.status(404).json({ error: "Object storage not available" });
    }
  });

  // Get presigned upload URL for tutorial videos
  app.post("/api/parts/:id/tutorial/upload-url", isCEOOrAdmin, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      
      // Extract the object path from the upload URL (before query parameters)
      const url = new URL(uploadURL);
      const objectPath = objectStorageService.normalizeObjectEntityPath(url.origin + url.pathname);
      
      res.json({ 
        uploadURL,      // For uploading the file
        objectPath      // For storing in database
      });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Update part with tutorial video URL after upload
  app.put("/api/parts/:id/tutorial", isCEOOrAdmin, async (req, res) => {
    try {
      if (!req.body.tutorialVideoURL) {
        return res.status(400).json({ error: "tutorialVideoURL is required" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.tutorialVideoURL,
      );

      // Update part with tutorial video URL
      const part = await storage.updatePartMaintenance(req.params.id, {
        tutorialVideoUrl: objectPath,
      });
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, 
          { action: 'tutorial video uploaded', videoUrl: objectPath }
        ));
      }

      res.json({ 
        part,
        objectPath 
      });
    } catch (error) {
      console.error("Error updating tutorial video:", error);
      res.status(500).json({ error: "Failed to update tutorial video" });
    }
  });

  // Get presigned upload URLs for part images (multiple images)
  app.post("/api/parts/:id/images/upload-urls", isCEOOrAdmin, async (req, res) => {
    try {
      const { count } = req.body;
      
      if (!count || count < 1 || count > 10) {
        return res.status(400).json({ error: "Count must be between 1 and 10" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const uploadData = [];
      
      // Generate a presigned URL for each image
      for (let i = 0; i < count; i++) {
        const uploadURL = await objectStorageService.getObjectEntityUploadURL();
        
        // Extract the object path from the upload URL (before query parameters)
        const url = new URL(uploadURL);
        const objectPath = objectStorageService.normalizeObjectEntityPath(url.origin + url.pathname);
        
        uploadData.push({
          uploadURL,      // For uploading the file
          objectPath      // For storing in database
        });
      }
      
      res.json({ uploadData });
    } catch (error) {
      console.error("Error generating image upload URLs:", error);
      res.status(500).json({ error: "Failed to generate upload URLs" });
    }
  });

  // Update part with image URLs after upload
  app.put("/api/parts/:id/images", isCEOOrAdmin, async (req, res) => {
    try {
      if (!req.body.imageUrls || !Array.isArray(req.body.imageUrls)) {
        return res.status(400).json({ error: "imageUrls array is required" });
      }

      const objectStorageService = new ObjectStorageService();
      
      // Normalize all object paths
      const normalizedPaths = req.body.imageUrls.map((url: string) => 
        objectStorageService.normalizeObjectEntityPath(url)
      );

      // Get existing part to append new images
      const existingPart = await storage.getPartById(req.params.id);
      if (!existingPart) {
        return res.status(404).json({ error: "Part not found" });
      }

      // Append new images to existing images
      const allImageUrls = [...(existingPart.imageUrls || []), ...normalizedPaths];

      // Update part with all image URLs
      const part = await storage.updatePart(req.params.id, {
        imageUrls: allImageUrls,
      });
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, 
          { action: 'images uploaded', count: normalizedPaths.length }
        ));
      }

      res.json({ part });
    } catch (error) {
      console.error("Error updating part images:", error);
      res.status(500).json({ error: "Failed to update part images" });
    }
  });

  // Delete a specific image from a part
  app.delete("/api/parts/:id/images", isCEOOrAdmin, async (req, res) => {
    try {
      const { imageUrl } = req.body;
      
      if (!imageUrl) {
        return res.status(400).json({ error: "imageUrl is required" });
      }

      // Get existing part
      const existingPart = await storage.getPartById(req.params.id);
      if (!existingPart) {
        return res.status(404).json({ error: "Part not found" });
      }

      // Remove the specific image from the array
      const updatedImageUrls = (existingPart.imageUrls || []).filter(
        url => url !== imageUrl
      );

      // Update part with filtered image URLs
      const part = await storage.updatePart(req.params.id, {
        imageUrls: updatedImageUrls,
      });
      
      if (!part) {
        return res.status(404).json({ error: "Part not found" });
      }

      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'spare_part', part.id, req.user.username, 
          { action: 'image deleted', imageUrl }
        ));
      }

      res.json({ part });
    } catch (error) {
      console.error("Error deleting part image:", error);
      res.status(500).json({ error: "Failed to delete part image" });
    }
  });

  // ============ ATTENDANCE DEVICE ROUTES ============

  // Zod schemas for validation
  const deviceSettingsSchema = z.object({
    deviceName: z.string().min(1),
    deviceModel: z.string().optional().nullable(),
    serialNumber: z.string().optional().nullable(),
    ipAddress: z.string().ip(),
    port: z.number().int().min(1).max(65535),
    timeout: z.number().int().min(1000).max(30000),
  });

  const testConnectionSchema = z.object({
    ipAddress: z.string().ip(),
    port: z.number().int().min(1).max(65535),
    timeout: z.number().int().min(1000).max(30000),
  });

  const importSelectedUsersSchema = z.object({
    userIds: z.array(z.string()).min(1, "At least one user must be selected"),
    ipAddress: z.string().ip(),
    port: z.number().int().min(1).max(65535),
    timeout: z.number().int().min(1000).max(30000),
  });

  // Get all devices
  app.get("/api/attendance-devices", isCEOOrAdmin, async (_req, res) => {
    try {
      const devices = await storage.getAllAttendanceDevices();
      res.json(devices);
    } catch (error) {
      console.error("Error fetching devices:", error);
      res.status(500).json({ error: "Failed to fetch devices" });
    }
  });

  // Get single device by ID
  app.get("/api/attendance-devices/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const device = await storage.getAttendanceDeviceById(req.params.id);
      if (!device) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json(device);
    } catch (error) {
      console.error("Error fetching device:", error);
      res.status(500).json({ error: "Failed to fetch device" });
    }
  });

  // Create new device
  app.post("/api/attendance-devices", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = deviceSettingsSchema.parse(req.body);
      const device = await storage.createAttendanceDevice(validatedData);
      res.status(201).json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid device data", details: error.errors });
      }
      console.error("Error creating device:", error);
      res.status(500).json({ error: "Failed to create device" });
    }
  });

  // Update device
  app.patch("/api/attendance-devices/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = deviceSettingsSchema.partial().parse(req.body);
      const device = await storage.updateAttendanceDeviceSettings(req.params.id, validatedData);
      res.json(device);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid device data", details: error.errors });
      }
      console.error("Error updating device:", error);
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  // Set active device
  app.patch("/api/attendance-devices/:id/activate", isCEOOrAdmin, async (req, res) => {
    try {
      const device = await storage.setActiveDevice(req.params.id);
      res.json(device);
    } catch (error) {
      console.error("Error activating device:", error);
      res.status(500).json({ error: "Failed to activate device" });
    }
  });

  // Delete device
  app.delete("/api/attendance-devices/:id", isCEOOrAdmin, async (req, res) => {
    try {
      await storage.deleteAttendanceDevice(req.params.id);
      res.json({ message: "Device deleted successfully" });
    } catch (error) {
      console.error("Error deleting device:", error);
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // Get device settings (backward compatibility - returns active device)
  app.get("/api/attendance-device/settings", isCEOOrAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAttendanceDeviceSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching device settings:", error);
      res.status(500).json({ error: "Failed to fetch device settings" });
    }
  });

  // Save device settings (backward compatibility - creates device and sets as active)
  app.post("/api/attendance-device/settings", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = deviceSettingsSchema.parse(req.body);
      const settings = await storage.saveAttendanceDeviceSettings(validatedData);
      res.json(settings);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid device settings", details: error.errors });
      }
      console.error("Error saving device settings:", error);
      res.status(500).json({ error: "Failed to save device settings" });
    }
  });

  // Test device connection
  app.post("/api/attendance-device/test-connection", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = testConnectionSchema.parse(req.body);
      const { ipAddress, port, timeout } = validatedData;
      const { createDeviceService } = await import('./deviceService');
      const deviceService = createDeviceService(ipAddress, port, timeout);
      const result = await deviceService.testConnection();
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid connection parameters", 
          details: error.errors 
        });
      }
      console.error("Device connection test error:", error);
      res.json({
        success: false,
        message: "Connection failed",
        error: error.message
      });
    }
  });

  // Fetch users from device (preview without importing)
  app.post("/api/attendance-device/fetch-users", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = testConnectionSchema.parse(req.body);
      const { ipAddress, port, timeout } = validatedData;
      const { createDeviceService } = await import('./deviceService');
      const deviceService = createDeviceService(ipAddress, port, timeout);
      
      const deviceUsers = await deviceService.getAllUsersWithConnection();
      
      res.json({
        success: true,
        users: deviceUsers,
        count: deviceUsers.length
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          error: "Invalid parameters", 
          details: error.errors 
        });
      }
      console.error("Fetch users error:", error);
      res.status(500).json({
        success: false,
        message: "Failed to fetch users",
        error: error.message
      });
    }
  });

  // Import all users from device
  app.post("/api/attendance-device/import-users", isCEOOrAdmin, async (req, res) => {
    try {
      const settings = await storage.getAttendanceDeviceSettings();
      if (!settings) {
        return res.status(400).json({ 
          success: false, 
          message: "Device settings not configured" 
        });
      }

      const { createDeviceService } = await import('./deviceService');
      const deviceService = createDeviceService(
        settings.ipAddress, 
        settings.port, 
        settings.timeout
      );

      const deviceUsers = await deviceService.getAllUsersWithConnection();
      
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const deviceUser of deviceUsers) {
        try {
          // Try multiple matching strategies to find existing employee
          let existingEmployee = await storage.getEmployeeByDeviceUserId(deviceUser.userId);
          
          // If not found by deviceUserId, try matching by employeeId (if deviceUserId is badge number)
          if (!existingEmployee) {
            existingEmployee = await storage.getEmployeeByEmployeeId(deviceUser.userId);
          }
          
          // If still not found, try matching by normalized name
          if (!existingEmployee && deviceUser.name) {
            existingEmployee = await storage.getEmployeeByName(deviceUser.name.trim());
          }
          
          if (existingEmployee) {
            // Update existing employee with device ID
            await storage.updateEmployee(existingEmployee.id, {
              deviceUserId: deviceUser.userId,
              fullName: deviceUser.name || existingEmployee.fullName,
            });
            updated++;
          } else {
            // Only create new employee if no match found
            await storage.createEmployee({
              employeeId: `EMP-${deviceUser.userId}`,
              deviceUserId: deviceUser.userId,
              fullName: deviceUser.name || `User ${deviceUser.userId}`,
              role: 'technician',
              phoneNumber: '',
              email: '',
              garageId: null,
            });
            imported++;
          }
        } catch (error: any) {
          console.error(`Error processing user ${deviceUser.userId}:`, error);
          errors.push(`User ${deviceUser.userId}: ${error.message}`);
          skipped++;
        }
      }

      await storage.createDeviceImportLog({
        deviceId: settings.id,
        operationType: 'import',
        status: errors.length > 0 ? 'partial' : 'success',
        usersImported: imported,
        usersUpdated: updated,
        usersSkipped: skipped,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        importData: JSON.stringify(deviceUsers),
      });

      await storage.updateAttendanceDeviceSettings(settings.id, {
        lastImportAt: new Date(),
      });

      res.json({
        success: true,
        imported,
        updated,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("User import error:", error);
      res.status(500).json({
        success: false,
        message: "Import failed",
        error: error.message
      });
    }
  });

  // Import selected users from device
  app.post("/api/attendance-device/import-selected", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = importSelectedUsersSchema.parse(req.body);
      const { userIds: selectedUserIds, ipAddress, port, timeout } = validatedData;

      const { createDeviceService } = await import('./deviceService');
      const deviceService = createDeviceService(ipAddress, port, timeout);
      
      const allDeviceUsers = await deviceService.getAllUsersWithConnection();
      
      // Filter to only selected users
      const selectedUsers = allDeviceUsers.filter(user => 
        selectedUserIds.includes(user.userId)
      );
      
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const deviceUser of selectedUsers) {
        try {
          // Try multiple matching strategies to find existing employee
          let existingEmployee = await storage.getEmployeeByDeviceUserId(deviceUser.userId);
          
          // If not found by deviceUserId, try matching by employeeId (if deviceUserId is badge number)
          if (!existingEmployee) {
            existingEmployee = await storage.getEmployeeByEmployeeId(deviceUser.userId);
          }
          
          // If still not found, try matching by normalized name
          if (!existingEmployee && deviceUser.name) {
            existingEmployee = await storage.getEmployeeByName(deviceUser.name.trim());
          }
          
          if (existingEmployee) {
            // Update existing employee with device ID
            await storage.updateEmployee(existingEmployee.id, {
              deviceUserId: deviceUser.userId,
              fullName: deviceUser.name || existingEmployee.fullName,
            });
            updated++;
          } else {
            // Only create new employee if no match found
            await storage.createEmployee({
              employeeId: `EMP-${deviceUser.userId}`,
              deviceUserId: deviceUser.userId,
              fullName: deviceUser.name || `User ${deviceUser.userId}`,
              role: 'technician',
              phoneNumber: '',
              email: '',
              garageId: null,
            });
            imported++;
          }
        } catch (error: any) {
          console.error(`Error importing user ${deviceUser.userId}:`, error);
          errors.push(`User ${deviceUser.userId}: ${error.message}`);
          skipped++;
        }
      }

      // Log the import operation
      const settings = await storage.getAttendanceDeviceSettings();
      if (settings) {
        await storage.createDeviceImportLog({
          deviceId: settings.id,
          operationType: 'selected_import',
          status: errors.length > 0 ? 'partial' : 'success',
          usersImported: imported,
          usersUpdated: updated,
          usersSkipped: skipped,
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
          importData: JSON.stringify(selectedUsers),
        });

        await storage.updateAttendanceDeviceSettings(settings.id, {
          lastImportAt: new Date(),
        });
      }

      res.json({
        success: true,
        imported,
        updated,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false,
          message: "Invalid request data", 
          details: error.errors 
        });
      }
      console.error("Selected user import error:", error);
      res.status(500).json({
        success: false,
        message: "Import failed",
        error: error.message
      });
    }
  });

  // Sync new users from device
  app.post("/api/attendance-device/sync-users", isCEOOrAdmin, async (req, res) => {
    try {
      const settings = await storage.getAttendanceDeviceSettings();
      if (!settings) {
        return res.status(400).json({ 
          success: false, 
          message: "Device settings not configured" 
        });
      }

      const { createDeviceService } = await import('./deviceService');
      const deviceService = createDeviceService(
        settings.ipAddress, 
        settings.port, 
        settings.timeout
      );

      const deviceUsers = await deviceService.getAllUsersWithConnection();
      
      let newUsers = 0;
      const errors: string[] = [];

      for (const deviceUser of deviceUsers) {
        try {
          // Try multiple matching strategies to find existing employee
          let existingEmployee = await storage.getEmployeeByDeviceUserId(deviceUser.userId);
          
          // If not found by deviceUserId, try matching by employeeId (if deviceUserId is badge number)
          if (!existingEmployee) {
            existingEmployee = await storage.getEmployeeByEmployeeId(deviceUser.userId);
          }
          
          // If still not found, try matching by normalized name
          if (!existingEmployee && deviceUser.name) {
            existingEmployee = await storage.getEmployeeByName(deviceUser.name.trim());
          }
          
          if (!existingEmployee) {
            // Only create new employee if no match found
            await storage.createEmployee({
              employeeId: `EMP-${deviceUser.userId}`,
              deviceUserId: deviceUser.userId,
              fullName: deviceUser.name || `User ${deviceUser.userId}`,
              role: 'technician',
              phoneNumber: '',
              email: '',
              garageId: null,
            });
            newUsers++;
          } else if (!existingEmployee.deviceUserId) {
            // If employee exists but doesn't have deviceUserId, update it
            await storage.updateEmployee(existingEmployee.id, {
              deviceUserId: deviceUser.userId,
            });
            newUsers++;
          }
        } catch (error: any) {
          console.error(`Error syncing user ${deviceUser.userId}:`, error);
          errors.push(`User ${deviceUser.userId}: ${error.message}`);
        }
      }

      await storage.createDeviceImportLog({
        deviceId: settings.id,
        operationType: 'sync',
        status: errors.length > 0 ? 'partial' : 'success',
        usersImported: newUsers,
        usersUpdated: 0,
        usersSkipped: deviceUsers.length - newUsers,
        errorMessage: errors.length > 0 ? errors.join('; ') : null,
        importData: JSON.stringify(deviceUsers.filter(u => !errors.some(e => e.includes(u.userId)))),
      });

      await storage.updateAttendanceDeviceSettings(settings.id, {
        lastSyncAt: new Date().toISOString(),
      });

      res.json({
        success: true,
        newUsers,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("User sync error:", error);
      res.status(500).json({
        success: false,
        message: "Sync failed",
        error: error.message
      });
    }
  });

  // Get import logs
  app.get("/api/attendance-device/logs", isCEOOrAdmin, async (_req, res) => {
    try {
      const logs = await storage.getDeviceImportLogs();
      res.json(logs);
    } catch (error) {
      console.error("Error fetching import logs:", error);
      res.status(500).json({ error: "Failed to fetch import logs" });
    }
  });

  // ==================== Dynamics 365 Business Central Integration ====================

  // Get D365 settings
  app.get("/api/dynamics365/settings", isCEOOrAdmin, async (_req, res) => {
    try {
      const settings = await storage.getDynamics365Settings();
      if (settings) {
        // Don't send password to frontend
        const { bcPassword, ...safeSettings } = settings;
        res.json(safeSettings);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching D365 settings:", error);
      res.status(500).json({ error: "Failed to fetch D365 settings" });
    }
  });

  // Save D365 settings
  app.post("/api/dynamics365/settings", isCEOOrAdmin, async (req, res) => {
    try {
      const user = (req as any).user;
      const { bcPassword, ...otherSettings } = req.body;
      
      // Get existing settings to preserve password if not provided
      const existingSettings = await storage.getDynamics365Settings();
      
      // Prepare data: keep existing password if new one is empty
      const dataToSave = {
        ...otherSettings,
        bcPassword: bcPassword && bcPassword.trim() !== "" 
          ? bcPassword 
          : existingSettings?.bcPassword || bcPassword,
      };
      
      const settings = await storage.saveDynamics365Settings(dataToSave, user.id);
      
      // Don't send password to frontend
      const { bcPassword: _, ...safeSettings } = settings;
      res.json(safeSettings);
    } catch (error) {
      console.error("Error saving D365 settings:", error);
      res.status(500).json({ error: "Failed to save D365 settings" });
    }
  });

  // Test D365 connection with provided settings
  app.post("/api/dynamics365/test", isCEOOrAdmin, async (req, res) => {
    try {
      let { bcUrl, bcUsername, bcPassword, bcCompany } = req.body;
      
      // If password is empty, try to get it from saved settings
      if (!bcPassword || bcPassword.trim() === "") {
        const existingSettings = await storage.getDynamics365Settings();
        if (existingSettings?.bcPassword) {
          bcPassword = existingSettings.bcPassword;
        } else {
          return res.status(400).json({ 
            success: false, 
            message: "Password is required. Please enter a password or save settings first." 
          });
        }
      }
      
      if (!bcUrl || !bcUsername || !bcCompany) {
        return res.status(400).json({ 
          success: false, 
          message: "URL, username, and company name are required" 
        });
      }

      // Test connection - try NTLM first, then Basic Auth
      const testUrl = `${bcUrl}/ODataV4/Company('${encodeURIComponent(bcCompany)}')/items?$top=1`;
      console.log(`Testing D365 connection:`, {
        url: testUrl,
        username: bcUsername,
        company: bcCompany,
      });
      
      let response: any = null;
      let authMethod = '';
      
      // Try NTLM authentication first
      try {
        console.log('Attempting NTLM authentication...');
        const httpntlm = (await import('httpntlm')).default;
        
        response = await new Promise((resolve, reject) => {
          httpntlm.get({
            url: testUrl,
            username: bcUsername,
            password: bcPassword,
            workstation: '',
            domain: '',
          }, (err: any, res: any) => {
            if (err) {
              reject(err);
            } else {
              resolve(res);
            }
          });
        });
        authMethod = 'NTLM';
      } catch (ntlmError: any) {
        console.log('NTLM failed, trying Basic Authentication...', ntlmError.message);
        
        // Fall back to Basic Authentication
        const axios = (await import('axios')).default;
        
        try {
          const axiosResponse = await axios.get(testUrl, {
            auth: {
              username: bcUsername,
              password: bcPassword,
            },
            timeout: 10000,
          });
          
          response = {
            statusCode: axiosResponse.status,
            body: JSON.stringify(axiosResponse.data),
          };
          authMethod = 'Basic';
        } catch (basicError: any) {
          // Both failed, throw the basic auth error
          throw basicError;
        }
      }
      
      try {

        if (response.statusCode === 200 || response.status === 200) {
          // Update test result in database if settings exist
          await storage.updateDynamics365TestResult('success', `Connection successful using ${authMethod} authentication`);
          
          console.log(`D365 connection successful using ${authMethod} authentication`);
          
          res.json({ 
            success: true, 
            message: `Connection successful! Successfully connected to Dynamics 365 Business Central using ${authMethod} authentication.` 
          });
        } else {
          const statusCode = response.statusCode || response.status || 503;
          await storage.updateDynamics365TestResult('failed', `Unexpected response: ${statusCode}`);
          res.status(503).json({ 
            success: false, 
            message: `Connection failed with status ${statusCode}` 
          });
        }
      } catch (authError: any) {
        let errorMessage = "Connection failed";
        let statusCode = 503;
        
        console.error('D365 connection error:', authError);
        
        if (authError.code === 'ECONNREFUSED') {
          errorMessage = "Cannot connect to server. Please check the URL and ensure the D365 Business Central server is running.";
          statusCode = 503;
        } else if (authError.code === 'ETIMEDOUT' || authError.code === 'ECONNABORTED') {
          errorMessage = "Connection timeout. The server is not responding.";
          statusCode = 504;
        } else if (authError.response?.status === 401 || authError.statusCode === 401) {
          errorMessage = "Authentication failed. Please check username and password.";
          statusCode = 401;
        } else if (authError.response?.status === 403 || authError.statusCode === 403) {
          errorMessage = "Access forbidden. Please check user permissions in D365.";
          statusCode = 403;
        } else if (authError.response?.status === 404 || authError.statusCode === 404) {
          errorMessage = "Resource not found. Please check the company name and URL path.";
          statusCode = 404;
        } else if (authError.response?.status === 503 || authError.statusCode === 503) {
          errorMessage = "Service unavailable (503). The Dynamics 365 Business Central service is not running or is temporarily down.";
          statusCode = 503;
        } else if (authError.response?.status === 500 || authError.statusCode === 500) {
          errorMessage = "Server error (500). The Dynamics 365 server encountered an internal error.";
          statusCode = 500;
        } else if (authError.response?.status || authError.statusCode) {
          const code = authError.response?.status || authError.statusCode;
          errorMessage = `HTTP Error ${code}: ${authError.message || 'Unknown error'}`;
          statusCode = code;
        } else {
          errorMessage = authError.message || "Unknown connection error. Ensure D365 Business Central Web Services are enabled.";
          statusCode = 503;
        }
        
        await storage.updateDynamics365TestResult('failed', errorMessage);
        
        res.status(statusCode).json({ 
          success: false, 
          message: errorMessage 
        });
      }
    } catch (error: any) {
      console.error("D365 connection test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Connection test failed", 
        error: error.message 
      });
    }
  });

  // Test Dynamics 365 connection (using environment variables - legacy)
  app.get("/api/dynamics365/test-connection", isCEOOrAdmin, async (_req, res) => {
    try {
      const { d365Service } = await import('./services/dynamics365');
      const isConnected = await d365Service.testConnection();
      
      if (isConnected) {
        res.json({ success: true, message: "Connection successful" });
      } else {
        res.status(503).json({ success: false, message: "Connection failed" });
      }
    } catch (error: any) {
      console.error("D365 connection test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Connection test failed", 
        error: error.message 
      });
    }
  });

  // Diagnostic endpoint to test all OData endpoints
  app.get("/api/dynamics365/test-endpoints", isCEOOrAdmin, async (_req, res) => {
    try {
      const axios = (await import('axios')).default;
      const url = process.env.D365_BC_URL;
      const username = process.env.D365_BC_USERNAME;
      const password = process.env.D365_BC_PASSWORD;
      const company = process.env.D365_BC_COMPANY;
      
      if (!url || !username || !password || !company) {
        return res.status(500).json({ 
          success: false, 
          message: "D365 credentials not configured" 
        });
      }

      // Try different company name variations
      const companyVariations = [
        company, // Original: "Sunshine Construction PLC(Test"
        `${company})`, // Add closing parenthesis: "Sunshine Construction PLC(Test)"
        company.replace('(Test', ''), // Remove (Test: "Sunshine Construction PLC"
        company.replace('(Test', '(Test)'), // Fix parenthesis: "Sunshine Construction PLC(Test)"
      ];
      
      const endpoints: string[] = [];
      
      // Test each company name variation with different endpoint patterns
      for (const companyName of companyVariations) {
        const encodedCompany = encodeURIComponent(companyName);
        
        // Note: baseURL already includes /SUNCONBC1/, don't duplicate it
        endpoints.push(
          // BC published web service format (lowercase 'items')
          `ODataV4/Company('${encodedCompany}')/items`,
          `ODataV4/Company('${encodedCompany}')/Item`,
          `ODataV4/Company('${encodedCompany}')/Items`,
          `OData/Company('${encodedCompany}')/items`,
          `api/v2.0/companies('${encodedCompany}')/items`,
        );
      }
      
      // Also test without company
      endpoints.push(
        `ODataV4/items`,
        `ODataV4/Item`,
        `ODataV4/Items`,
      );

      const results = [];
      
      for (const endpoint of endpoints) {
        try {
          const fullUrl = `${url}${endpoint}`;
          console.log(`Testing: ${fullUrl}`);
          
          const response = await axios.get(fullUrl, {
            auth: { username, password },
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 10000,
          });
          
          results.push({
            endpoint,
            status: response.status,
            success: true,
            itemCount: response.data?.value?.length || (Array.isArray(response.data) ? response.data.length : 0),
          });
          
          console.log(`✓ Success: ${endpoint} - ${response.status}`);
        } catch (error: any) {
          results.push({
            endpoint,
            status: error.response?.status || 'Network Error',
            success: false,
            error: error.response?.data?.error?.message || error.message,
          });
          
          console.log(`✗ Failed: ${endpoint} - ${error.response?.status || 'Network Error'}`);
        }
      }
      
      const successfulEndpoint = results.find(r => r.success);
      
      res.json({
        success: !!successfulEndpoint,
        message: successfulEndpoint 
          ? `Found working endpoint: ${successfulEndpoint.endpoint}` 
          : 'No working endpoint found',
        workingEndpoint: successfulEndpoint?.endpoint || null,
        results,
      });
    } catch (error: any) {
      console.error("D365 endpoint test error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Endpoint test failed", 
        error: error.message 
      });
    }
  });

  // Sync items from Dynamics 365 (items starting with "SP-")
  app.post("/api/dynamics365/sync-items", isCEOOrAdmin, async (_req, res) => {
    try {
      const { d365Service } = await import('./services/dynamics365');
      
      // Fetch items starting with "SP-"
      const d365Items = await d365Service.fetchItemsByPrefix('SP-');
      
      console.log(`Fetched ${d365Items.length} items from Dynamics 365`);
      
      // Save items to database
      let savedCount = 0;
      let updatedCount = 0;
      
      for (const d365Item of d365Items) {
        try {
          // Check if item exists
          const existingItem = await db.select()
            .from(items)
            .where(eq(items.itemNo, d365Item.No))
            .limit(1);
          
          const itemData = {
            itemNo: d365Item.No,
            description: d365Item.Description,
            description2: d365Item.Description_2 || null,
            type: d365Item.Type || null,
            baseUnitOfMeasure: d365Item.Base_Unit_of_Measure || null,
            unitPrice: d365Item.Unit_Price?.toString() || null,
            unitCost: d365Item.Unit_Cost?.toString() || null,
            inventory: d365Item.Inventory?.toString() || null,
            vendorNo: d365Item.Vendor_No || null,
            vendorItemNo: d365Item.Vendor_Item_No || null,
            lastDateModified: d365Item.Last_Date_Modified || null,
            syncedAt: new Date(),
            updatedAt: new Date(),
          };
          
          if (existingItem.length > 0) {
            // Update existing item
            await db.update(items)
              .set(itemData)
              .where(eq(items.itemNo, d365Item.No));
            updatedCount++;
          } else {
            // Insert new item
            await db.insert(items).values(itemData);
            savedCount++;
          }
        } catch (itemError: any) {
          console.error(`Error saving item ${d365Item.No}:`, itemError.message);
        }
      }
      
      console.log(`Saved ${savedCount} new items, updated ${updatedCount} items`);
      
      res.json({
        success: true,
        itemsCount: d365Items.length,
        savedCount,
        updatedCount,
        syncedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("D365 items sync error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Sync failed", 
        error: error.message 
      });
    }
  });

  // Get a specific item from Dynamics 365
  app.get("/api/dynamics365/items/:itemNo", isCEOOrAdmin, async (req, res) => {
    try {
      const { itemNo } = req.params;
      const { d365Service } = await import('./services/dynamics365');
      
      const item = await d365Service.fetchItemByNumber(itemNo);
      
      if (item) {
        res.json(item);
      } else {
        res.status(404).json({ error: "Item not found" });
      }
    } catch (error: any) {
      console.error("D365 item fetch error:", error);
      res.status(500).json({ 
        error: "Failed to fetch item", 
        message: error.message 
      });
    }
  });

  // Preview items from Dynamics 365 with prefix filtering
  app.post("/api/dynamics365/preview-items", isCEOOrAdmin, async (req, res) => {
    try {
      const { prefix } = req.body;
      
      if (!prefix || typeof prefix !== 'string') {
        return res.status(400).json({ error: "Prefix is required" });
      }

      // Get D365 settings from database
      const d365Settings = await storage.getDynamics365Settings();
      if (!d365Settings) {
        return res.status(400).json({ 
          success: false,
          error: "D365 settings not configured. Please save settings first." 
        });
      }

      const { fetchItemsNTLM } = await import('./services/dynamics365-ntlm');
      
      // Fetch items with the specified prefix using NTLM
      const d365Items = await fetchItemsNTLM({
        bcUrl: d365Settings.bcUrl,
        bcCompany: d365Settings.bcCompany,
        bcUsername: d365Settings.bcUsername,
        bcPassword: d365Settings.bcPassword,
      }, prefix);
      
      console.log(`Found ${d365Items.length} items with prefix "${prefix}" from Dynamics 365`);
      
      // Check which items already exist in database
      const itemsWithStatus = await Promise.all(d365Items.map(async (d365Item) => {
        const existingItem = await db.select()
          .from(items)
          .where(eq(items.itemNo, d365Item.No))
          .limit(1);
        
        return {
          ...d365Item,
          existsInDb: existingItem.length > 0,
        };
      }));
      
      res.json({
        success: true,
        items: itemsWithStatus,
        totalCount: d365Items.length,
        newCount: itemsWithStatus.filter(i => !i.existsInDb).length,
        existingCount: itemsWithStatus.filter(i => i.existsInDb).length,
      });
    } catch (error: any) {
      console.error("D365 preview items error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to preview items", 
        error: error.message 
      });
    }
  });

  // Preview equipment from Dynamics 365 with prefix filtering
  app.post("/api/dynamics365/preview-equipment", isCEOOrAdmin, async (req, res) => {
    try {
      const { prefix } = req.body;
      
      if (!prefix || typeof prefix !== 'string') {
        return res.status(400).json({ error: "Prefix is required" });
      }

      // Get D365 settings from database
      const d365Settings = await storage.getDynamics365Settings();
      if (!d365Settings) {
        return res.status(400).json({ 
          success: false,
          error: "D365 settings not configured. Please save settings first." 
        });
      }

      const { fetchEquipmentNTLM } = await import('./services/dynamics365-ntlm');
      
      // Fetch equipment with the specified prefix using NTLM
      const d365Equipment = await fetchEquipmentNTLM({
        bcUrl: d365Settings.bcUrl,
        bcCompany: d365Settings.bcCompany,
        bcUsername: d365Settings.bcUsername,
        bcPassword: d365Settings.bcPassword,
      }, prefix);
      
      console.log(`Found ${d365Equipment.length} equipment with prefix "${prefix}" from Dynamics 365`);
      
      // Check which equipment already exist in database
      const equipmentWithStatus = await Promise.all(d365Equipment.map(async (d365Equip) => {
        // Check by asset number or other unique identifier
        const existingEquip = await db.select()
          .from(equipment)
          .where(eq(equipment.assetNo, d365Equip.Asset_No || d365Equip.No))
          .limit(1);
        
        return {
          ...d365Equip,
          existsInDb: existingEquip.length > 0,
        };
      }));
      
      res.json({
        success: true,
        equipment: equipmentWithStatus,
        totalCount: d365Equipment.length,
        newCount: equipmentWithStatus.filter(e => !e.existsInDb).length,
        existingCount: equipmentWithStatus.filter(e => e.existsInDb).length,
      });
    } catch (error: any) {
      console.error("D365 preview equipment error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to preview equipment", 
        error: error.message 
      });
    }
  });

  // Receive data from PowerShell script (uses API key for auth)
  app.post("/api/dynamics365/receive-data", async (req, res) => {
    try {
      const { apiKey, items: receivedItems, equipment: receivedEquipment, syncType } = req.body;
      
      // Validate API key (should match D365 settings or system secret)
      const d365Settings = await storage.getDynamics365Settings();
      if (!d365Settings || apiKey !== d365Settings.id) {
        return res.status(401).json({ 
          success: false,
          error: "Invalid API key" 
        });
      }

      let savedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];

      // Process items if provided
      if (receivedItems && Array.isArray(receivedItems)) {
        for (const d365Item of receivedItems) {
          try {
            const existingItem = await db.select()
              .from(items)
              .where(eq(items.itemNo, d365Item.No))
              .limit(1);
            
            const itemData = {
              itemNo: d365Item.No,
              description: d365Item.Description,
              description2: d365Item.Description_2 || null,
              type: d365Item.Type || null,
              baseUnitOfMeasure: d365Item.Base_Unit_of_Measure || null,
              unitPrice: d365Item.Unit_Price?.toString() || null,
              unitCost: d365Item.Unit_Cost?.toString() || null,
              inventory: d365Item.Inventory?.toString() || null,
              vendorNo: d365Item.Vendor_No || null,
              vendorItemNo: d365Item.Vendor_Item_No || null,
              lastDateModified: d365Item.Last_Date_Modified || null,
              syncedAt: new Date(),
              updatedAt: new Date(),
            };
            
            if (existingItem.length > 0) {
              await db.update(items)
                .set(itemData)
                .where(eq(items.itemNo, d365Item.No));
              updatedCount++;
            } else {
              await db.insert(items).values(itemData);
              savedCount++;
            }
          } catch (itemError: any) {
            console.error(`Error saving item ${d365Item.No}:`, itemError.message);
            errors.push(`${d365Item.No}: ${itemError.message}`);
            skippedCount++;
          }
        }
      }

      // Process equipment if provided
      if (receivedEquipment && Array.isArray(receivedEquipment)) {
        for (const d365Equip of receivedEquipment) {
          try {
            // Skip equipment sync for now - requires category assignment
            skippedCount++;
          } catch (equipError: any) {
            console.error(`Error saving equipment ${d365Equip.No}:`, equipError.message);
            errors.push(`${d365Equip.No}: ${equipError.message}`);
            skippedCount++;
          }
        }
      }

      // Log the sync
      await db.insert(d365SyncLogs).values({
        syncType: syncType || "powershell_import",
        status: errors.length > 0 ? (errors.length === (receivedItems?.length || 0) + (receivedEquipment?.length || 0) ? "failed" : "partial") : "success",
        prefix: null,
        recordsImported: savedCount,
        recordsUpdated: updatedCount,
        recordsSkipped: skippedCount,
        totalRecords: (receivedItems?.length || 0) + (receivedEquipment?.length || 0),
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
      });

      console.log(`PowerShell sync: ${savedCount} new, ${updatedCount} updated, ${skippedCount} skipped`);

      res.json({
        success: true,
        savedCount,
        updatedCount,
        skippedCount,
        errors: errors.length > 0 ? errors : undefined,
      });
    } catch (error: any) {
      console.error("Receive data error:", error);
      res.status(500).json({ 
        success: false, 
        error: error.message 
      });
    }
  });

  // Import selected items from D365 preview
  app.post("/api/dynamics365/import-items", isCEOOrAdmin, async (req, res) => {
    try {
      const { items: selectedItems, prefix } = req.body;
      
      if (!Array.isArray(selectedItems) || selectedItems.length === 0) {
        return res.status(400).json({ error: "No items selected for import" });
      }

      let savedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      for (const d365Item of selectedItems) {
        try {
          // Check if item exists
          const existingItem = await db.select()
            .from(items)
            .where(eq(items.itemNo, d365Item.No))
            .limit(1);
          
          const itemData = {
            itemNo: d365Item.No,
            description: d365Item.Description,
            description2: d365Item.Description_2 || null,
            type: d365Item.Type || null,
            baseUnitOfMeasure: d365Item.Base_Unit_of_Measure || null,
            unitPrice: d365Item.Unit_Price?.toString() || null,
            unitCost: d365Item.Unit_Cost?.toString() || null,
            inventory: d365Item.Inventory?.toString() || null,
            vendorNo: d365Item.Vendor_No || null,
            vendorItemNo: d365Item.Vendor_Item_No || null,
            lastDateModified: d365Item.Last_Date_Modified || null,
            syncedAt: new Date(),
            updatedAt: new Date(),
          };
          
          if (existingItem.length > 0) {
            // Update existing item
            await db.update(items)
              .set(itemData)
              .where(eq(items.itemNo, d365Item.No));
            updatedCount++;
          } else {
            // Insert new item
            await db.insert(items).values(itemData);
            savedCount++;
          }
        } catch (itemError: any) {
          console.error(`Error saving item ${d365Item.No}:`, itemError.message);
          errors.push(`${d365Item.No}: ${itemError.message}`);
          skippedCount++;
        }
      }
      
      // Create sync log entry
      const logStatus = errors.length > 0 ? (errors.length === selectedItems.length ? "failed" : "partial") : "success";
      await db.insert(d365SyncLogs).values({
        syncType: "items",
        status: logStatus,
        prefix: prefix || null,
        recordsImported: savedCount,
        recordsUpdated: updatedCount,
        recordsSkipped: skippedCount,
        totalRecords: selectedItems.length,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
        importData: JSON.stringify(selectedItems.slice(0, 10)), // Store first 10 items as sample
      });
      
      console.log(`Imported ${savedCount} new items, updated ${updatedCount} items`);
      
      res.json({
        success: true,
        savedCount,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        totalProcessed: selectedItems.length,
      });
    } catch (error: any) {
      console.error("D365 import items error:", error);
      
      // Log the failed import
      try {
        await db.insert(d365SyncLogs).values({
          syncType: "items",
          status: "failed",
          prefix: req.body.prefix || null,
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          totalRecords: req.body.items?.length || 0,
          errorMessage: error.message,
        });
      } catch (logError) {
        console.error("Failed to log import error:", logError);
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Import failed", 
        error: error.message 
      });
    }
  });

  // Import selected equipment from D365 preview
  app.post("/api/dynamics365/import-equipment", isCEOOrAdmin, async (req, res) => {
    try {
      const { equipment: selectedEquipment, defaultCategoryId, prefix } = req.body;
      
      if (!Array.isArray(selectedEquipment) || selectedEquipment.length === 0) {
        return res.status(400).json({ error: "No equipment selected for import" });
      }

      let savedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const errors: string[] = [];
      
      for (const d365Equip of selectedEquipment) {
        try {
          // Check if equipment exists by asset number
          const assetNo = d365Equip.Asset_No || d365Equip.No;
          const existingEquip = await db.select()
            .from(equipment)
            .where(eq(equipment.assetNo, assetNo))
            .limit(1);
          
          const equipData = {
            categoryId: defaultCategoryId || null,
            equipmentType: d365Equip.Type || d365Equip.Description?.split(' ')[0] || 'UNKNOWN',
            make: d365Equip.Make || 'UNKNOWN',
            model: d365Equip.Model || d365Equip.Description || 'UNKNOWN',
            assetNo: assetNo,
            machineSerial: d365Equip.Serial_No || null,
            plantNumber: d365Equip.Plant_Number || null,
            price: d365Equip.Unit_Price?.toString() || null,
            remarks: `Imported from Dynamics 365 - ${d365Equip.Description}`,
          };
          
          if (existingEquip.length > 0) {
            // Update existing equipment
            await db.update(equipment)
              .set(equipData)
              .where(eq(equipment.assetNo, assetNo));
            updatedCount++;
          } else {
            // Insert new equipment
            await db.insert(equipment).values(equipData);
            savedCount++;
          }
        } catch (equipError: any) {
          console.error(`Error saving equipment ${d365Equip.No}:`, equipError.message);
          errors.push(`${d365Equip.No}: ${equipError.message}`);
          skippedCount++;
        }
      }
      
      // Create sync log entry
      const logStatus = errors.length > 0 ? (errors.length === selectedEquipment.length ? "failed" : "partial") : "success";
      await db.insert(d365SyncLogs).values({
        syncType: "equipment",
        status: logStatus,
        prefix: prefix || null,
        recordsImported: savedCount,
        recordsUpdated: updatedCount,
        recordsSkipped: skippedCount,
        totalRecords: selectedEquipment.length,
        errorMessage: errors.length > 0 ? errors.join("; ") : null,
        importData: JSON.stringify(selectedEquipment.slice(0, 10)), // Store first 10 items as sample
      });
      
      console.log(`Imported ${savedCount} new equipment, updated ${updatedCount} equipment`);
      
      res.json({
        success: true,
        savedCount,
        updatedCount,
        errors: errors.length > 0 ? errors : undefined,
        totalProcessed: selectedEquipment.length,
      });
    } catch (error: any) {
      console.error("D365 import equipment error:", error);
      
      // Log the failed import
      try {
        await db.insert(d365SyncLogs).values({
          syncType: "equipment",
          status: "failed",
          prefix: req.body.prefix || null,
          recordsImported: 0,
          recordsUpdated: 0,
          recordsSkipped: 0,
          totalRecords: req.body.equipment?.length || 0,
          errorMessage: error.message,
        });
      } catch (logError) {
        console.error("Failed to log import error:", logError);
      }
      
      res.status(500).json({ 
        success: false, 
        message: "Import failed", 
        error: error.message 
      });
    }
  });

  // Generate PowerShell script for D365 data sync
  app.get("/api/dynamics365/generate-script", isCEOOrAdmin, async (req, res) => {
    try {
      const d365Settings = await storage.getDynamics365Settings();
      if (!d365Settings) {
        return res.status(400).json({ error: "D365 settings not configured" });
      }

      // Get system settings for app URL
      const systemSettings = await storage.getSystemSettings();
      const appUrl = `http://${systemSettings?.serverHost || '192.168.0.34'}:${systemSettings?.serverPort || 3000}`;

      // Generate PowerShell script
      const script = `# Dynamics 365 Business Central Data Sync Script
# Generated: ${new Date().toISOString()}
# This script fetches data from D365 and sends it to the Gelan Terminal Maintenance app

# Configuration
$D365Url = "${d365Settings.bcUrl}"
$CompanyName = "${d365Settings.bcCompany}"
$AppUrl = "${appUrl}"
$ApiKey = "${d365Settings.id}"

# Function to fetch data from D365
function Get-D365Data {
    param(
        [string]$Endpoint
    )
    
    $encodedCompany = [System.Web.HttpUtility]::UrlEncode($CompanyName)
    $url = "$D365Url/ODataV4/Company('$encodedCompany')/$Endpoint"
    
    Write-Host "Fetching from: $url"
    
    try {
        # Use Windows Integrated Authentication (works automatically on D365 server)
        $response = Invoke-RestMethod -Uri $url -Method Get -UseDefaultCredentials
        return $response.value
    }
    catch {
        Write-Host "Error fetching data: $_"
        return $null
    }
}

# Function to send data to app
function Send-ToApp {
    param(
        [array]$Items,
        [array]$Equipment,
        [string]$SyncType
    )
    
    $body = @{
        apiKey = $ApiKey
        items = $Items
        equipment = $Equipment
        syncType = $SyncType
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "$AppUrl/api/dynamics365/receive-data" \`
            -Method Post \`
            -Body $body \`
            -ContentType "application/json"
        
        Write-Host "✓ Sync successful!"
        Write-Host "  - Saved: $($response.savedCount)"
        Write-Host "  - Updated: $($response.updatedCount)"
        Write-Host "  - Skipped: $($response.skippedCount)"
        
        return $response
    }
    catch {
        Write-Host "✗ Error sending data to app: $_"
        return $null
    }
}

# Main execution
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  D365 Data Sync" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Fetch items
Write-Host "Fetching items from D365..." -ForegroundColor Yellow
$items = Get-D365Data -Endpoint "items"

# Filter by prefix if specified
$itemPrefix = "${d365Settings.itemPrefix || ''}"
if ($itemPrefix -and $items) {
    $itemsBefore = $items.Count
    $items = $items | Where-Object { $_.No -like "$itemPrefix*" }
    Write-Host "Filtered items: $($items.Count) of $itemsBefore match prefix '$itemPrefix'" -ForegroundColor Cyan
}

if ($items) {
    Write-Host "Found $($items.Count) items" -ForegroundColor Green
} else {
    Write-Host "No items found or error occurred" -ForegroundColor Red
}

# Fetch equipment (try different endpoints)
Write-Host "Fetching equipment from D365..." -ForegroundColor Yellow
$equipment = Get-D365Data -Endpoint "FixedAssets"

if (-not $equipment) {
    $equipment = Get-D365Data -Endpoint "Fixed_Assets"
}

# Filter by prefix if specified
$equipmentPrefix = "${d365Settings.equipmentPrefix || ''}"
if ($equipmentPrefix -and $equipment) {
    $equipBefore = $equipment.Count
    $equipment = $equipment | Where-Object { $_.No -like "$equipmentPrefix*" }
    Write-Host "Filtered equipment: $($equipment.Count) of $equipBefore match prefix '$equipmentPrefix'" -ForegroundColor Cyan
}

if ($equipment) {
    Write-Host "Found $($equipment.Count) equipment" -ForegroundColor Green
} else {
    Write-Host "No equipment found or endpoint not available" -ForegroundColor Yellow
}

# Send to app
if ($items -or $equipment) {
    Write-Host ""
    Write-Host "Sending data to Gelan Terminal app..." -ForegroundColor Yellow
    $result = Send-ToApp -Items $items -Equipment $equipment -SyncType "powershell_sync"
    
    if ($result) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  Sync Complete!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
    }
} else {
    Write-Host ""
    Write-Host "No data to sync" -ForegroundColor Red
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
`;

      // Return as downloadable file
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="D365-Sync.ps1"');
      res.send(script);
    } catch (error: any) {
      console.error("Generate script error:", error);
      res.status(500).json({ error: "Failed to generate script" });
    }
  });

  // Get D365 sync logs
  app.get("/api/dynamics365/sync-logs", isCEOOrAdmin, async (req, res) => {
    try {
      const logs = await db.select()
        .from(d365SyncLogs)
        .orderBy(sql`${d365SyncLogs.createdAt} DESC`)
        .limit(50); // Last 50 sync operations
      
      res.json(logs);
    } catch (error: any) {
      console.error("Error fetching D365 sync logs:", error);
      res.status(500).json({ error: "Failed to fetch sync logs" });
    }
  });

  // ==================== Items CRUD Routes ====================
  
  // Get all items from database
  app.get("/api/items", async (req, res) => {
    try {
      const { search } = req.query;
      
      let query = db.select().from(items).$dynamic();
      
      if (search && typeof search === 'string') {
        query = query.where(
          or(
            ilike(items.itemNo, `%${search}%`),
            ilike(items.description, `%${search}%`)
          )
        );
      }
      
      const allItems = await query;
      res.json(allItems);
    } catch (error: any) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  // Get a single item by ID
  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await db.select()
        .from(items)
        .where(eq(items.id, req.params.id))
        .limit(1);
      
      if (item.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(item[0]);
    } catch (error: any) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  // Create a new item
  app.post("/api/items", isCEOOrAdmin, async (req, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      
      const newItem = await db.insert(items)
        .values({
          ...itemData,
          syncedAt: new Date(),
        })
        .returning();
      
      res.status(201).json(newItem[0]);
    } catch (error: any) {
      console.error("Error creating item:", error);
      
      if (error.code === '23505') {
        return res.status(400).json({ error: "Item with this number already exists" });
      }
      
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Update an item
  app.patch("/api/items/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const itemData = insertItemSchema.partial().parse(req.body);
      
      const updatedItem = await db.update(items)
        .set({
          ...itemData,
          updatedAt: new Date(),
        })
        .where(eq(items.id, req.params.id))
        .returning();
      
      if (updatedItem.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json(updatedItem[0]);
    } catch (error: any) {
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // Delete an item
  app.delete("/api/items/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const deletedItem = await db.delete(items)
        .where(eq(items.id, req.params.id))
        .returning();
      
      if (deletedItem.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
    }
  });

  // ==================== SYSTEM SETTINGS ROUTES ====================
  
  // Get system settings
  app.get("/api/system-settings", isCEOOrAdmin, async (_req, res) => {
    try {
      const { systemSettings } = await import("@shared/schema");
      const settings = await db.select().from(systemSettings).limit(1);
      
      if (settings.length === 0) {
        // Return default settings if none exist
        return res.json({
          serverHost: "0.0.0.0",
          serverPort: 3000,
        });
      }
      
      res.json(settings[0]);
    } catch (error: any) {
      console.error("Error fetching system settings:", error);
      res.status(500).json({ error: "Failed to fetch system settings" });
    }
  });

  // Update system settings
  app.patch("/api/system-settings", isCEOOrAdmin, async (req, res) => {
    try {
      const { systemSettings, insertSystemSettingsSchema } = await import("@shared/schema");
      const settingsData = insertSystemSettingsSchema.partial().parse(req.body);
      
      // Get current user ID from session
      const userId = (req.user as any)?.id;
      
      // Check if settings exist
      const existing = await db.select().from(systemSettings).limit(1);
      
      let updated;
      if (existing.length === 0) {
        // Create new settings
        updated = await db.insert(systemSettings)
          .values({
            ...settingsData,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .returning();
      } else {
        // Update existing settings
        updated = await db.update(systemSettings)
          .set({
            ...settingsData,
            updatedBy: userId,
            updatedAt: new Date(),
          })
          .where(eq(systemSettings.id, existing[0].id))
          .returning();
      }
      
      res.json(updated[0]);
    } catch (error: any) {
      console.error("Error updating system settings:", error);
      res.status(500).json({ error: "Failed to update system settings" });
    }
  });

  // Dashboard analytics endpoint - dynamic data with filters
  app.get("/api/dashboard/analytics", isAuthenticated, async (req, res) => {
    try {
      const { workOrders, workshops, workOrderRequiredParts, spareParts } = await import("@shared/schema");
      const { sql: drizzleSql, and, gte, lte, between } = await import("drizzle-orm");
      
      // Parse query parameters
      const timePeriod = req.query.timePeriod as string || 'annual'; // daily, weekly, monthly, q1, q2, q3, q4, annual
      const workshopId = req.query.workshopId as string | undefined; // Optional workshop filter
      const year = parseInt(req.query.year as string) || new Date().getFullYear();
      
      // Build date filter based on time period
      let dateFilter: any = {};
      const startOfYear = new Date(year, 0, 1);
      const endOfYear = new Date(year, 11, 31, 23, 59, 59);
      
      if (timePeriod === 'q1') {
        dateFilter = {
          start: new Date(year, 0, 1),
          end: new Date(year, 2, 31, 23, 59, 59)
        };
      } else if (timePeriod === 'q2') {
        dateFilter = {
          start: new Date(year, 3, 1),
          end: new Date(year, 5, 30, 23, 59, 59)
        };
      } else if (timePeriod === 'q3') {
        dateFilter = {
          start: new Date(year, 6, 1),
          end: new Date(year, 8, 30, 23, 59, 59)
        };
      } else if (timePeriod === 'q4') {
        dateFilter = {
          start: new Date(year, 9, 1),
          end: new Date(year, 11, 31, 23, 59, 59)
        };
      } else if (timePeriod === 'monthly') {
        const month = parseInt(req.query.month as string) || new Date().getMonth();
        const lastDay = new Date(year, month + 1, 0).getDate();
        dateFilter = {
          start: new Date(year, month, 1),
          end: new Date(year, month, lastDay, 23, 59, 59)
        };
      } else if (timePeriod === 'weekly') {
        // Week starts on the date specified
        const weekStart = req.query.weekStart ? new Date(req.query.weekStart as string) : new Date();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        weekEnd.setHours(23, 59, 59);
        dateFilter = { start: weekStart, end: weekEnd };
      } else if (timePeriod === 'daily') {
        const day = req.query.date ? new Date(req.query.date as string) : new Date();
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59);
        dateFilter = { start: day, end: dayEnd };
      } else {
        // Annual
        dateFilter = { start: startOfYear, end: endOfYear };
      }
      
      // Build filters array
      const filters: any[] = [];
      
      // Add workshop filter if specified
      if (workshopId && workshopId !== 'all') {
        filters.push(eq(workOrders.workshopId, workshopId));
      }
      
      // Add date filter for completed work orders
      if (dateFilter.start && dateFilter.end) {
        filters.push(gte(workOrders.completedAt, dateFilter.start));
        filters.push(lte(workOrders.completedAt, dateFilter.end));
      }
      
      // Fetch completed work orders with filters
      const completedOrders = await db.select().from(workOrders)
        .where(and(
          eq(workOrders.status, 'completed'),
          ...filters
        ));
      
      // Fetch all work orders in the date range (for planned count)
      const allOrdersFilters: any[] = [];
      if (workshopId && workshopId !== 'all') {
        allOrdersFilters.push(eq(workOrders.workshopId, workshopId));
      }
      if (dateFilter.start && dateFilter.end) {
        allOrdersFilters.push(gte(workOrders.createdAt, dateFilter.start));
        allOrdersFilters.push(lte(workOrders.createdAt, dateFilter.end));
      }
      
      const allOrders = await db.select().from(workOrders)
        .where(and(...allOrdersFilters));
      
      // Fetch workshops data
      const workshopsData = await db.select().from(workshops);
      
      // Calculate KPIs
      const totalPlanned = allOrders.length;
      const totalCompleted = completedOrders.length;
      const accomplishmentRate = totalPlanned > 0 ? (totalCompleted / totalPlanned) * 100 : 0;
      
      // Calculate total costs
      let totalDirectCost = 0;
      let totalOvertimeCost = 0;
      let totalOutsourceCost = 0;
      let totalOverheadCost = 0;
      let totalCost = 0;
      
      for (const order of completedOrders) {
        const directCost = parseFloat(order.directMaintenanceCost || '0');
        const overtimeCost = parseFloat(order.overtimeCost || '0');
        const outsourceCost = parseFloat(order.outsourceCost || '0');
        const overheadCost = parseFloat(order.overheadCost || '0');
        
        totalDirectCost += directCost;
        totalOvertimeCost += overtimeCost;
        totalOutsourceCost += outsourceCost;
        totalOverheadCost += overheadCost;
        
        // If no breakdown, use actualCost
        if (directCost === 0 && overtimeCost === 0 && outsourceCost === 0) {
          const actualCost = parseFloat(order.actualCost || '0');
          totalDirectCost += actualCost * 0.7; // Assume 70% direct
          totalOverheadCost += actualCost * 0.3; // 30% overhead
          totalCost += actualCost;
        } else {
          totalCost += directCost + overtimeCost + outsourceCost + overheadCost;
        }
      }
      
      // Active workshops count
      const activeWorkshops = workshopsData.filter((w: any) => w.isActive).length;
      
      // Calculate quarterly data for the year
      const quarterlyData = [];
      const quarters = [
        { name: 'Q1', start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59), months: [0, 1, 2] },
        { name: 'Q2', start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59), months: [3, 4, 5] },
        { name: 'Q3', start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59), months: [6, 7, 8] },
        { name: 'Q4', start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59), months: [9, 10, 11] },
      ];
      
      for (const quarter of quarters) {
        const qFilters: any[] = [];
        if (workshopId && workshopId !== 'all') {
          qFilters.push(eq(workOrders.workshopId, workshopId));
        }
        qFilters.push(gte(workOrders.createdAt, quarter.start));
        qFilters.push(lte(workOrders.createdAt, quarter.end));
        
        const qAllOrders = await db.select().from(workOrders)
          .where(and(...qFilters));
        
        const qCompletedOrders = qAllOrders.filter((o: any) => o.status === 'completed');
        
        let qDirectCost = 0;
        let qOvertimeCost = 0;
        let qOutsourceCost = 0;
        let qOverheadCost = 0;
        
        for (const order of qCompletedOrders) {
          const directCost = parseFloat(order.directMaintenanceCost || '0');
          const overtimeCost = parseFloat(order.overtimeCost || '0');
          const outsourceCost = parseFloat(order.outsourceCost || '0');
          const overheadCost = parseFloat(order.overheadCost || '0');
          
          if (directCost === 0 && overtimeCost === 0 && outsourceCost === 0) {
            const actualCost = parseFloat(order.actualCost || '0');
            qDirectCost += actualCost * 0.7;
            qOverheadCost += actualCost * 0.3;
          } else {
            qDirectCost += directCost;
            qOvertimeCost += overtimeCost;
            qOutsourceCost += outsourceCost;
            qOverheadCost += overheadCost;
          }
        }
        
        const qTotalCost = qDirectCost + qOvertimeCost + qOutsourceCost + qOverheadCost;
        const qAccomplishment = qAllOrders.length > 0 ? (qCompletedOrders.length / qAllOrders.length) * 100 : 0;
        
        quarterlyData.push({
          quarter: quarter.name,
          planned: qAllOrders.length,
          completed: qCompletedOrders.length,
          accomplishment: parseFloat(qAccomplishment.toFixed(2)),
          cost: parseFloat(qTotalCost.toFixed(2)),
          directCost: parseFloat(qDirectCost.toFixed(2)),
          overtimeCost: parseFloat(qOvertimeCost.toFixed(2)),
          outsourceCost: parseFloat(qOutsourceCost.toFixed(2)),
          overhead: parseFloat(qOverheadCost.toFixed(2)),
        });
      }
      
      // Calculate workshop/department performance
      const workshopPerformance = [];
      for (const workshop of workshopsData) {
        if (!workshop.isActive) continue;
        
        // Get work orders for this workshop
        const workshopOrders = allOrders.filter((o: any) => o.workshopId === workshop.id);
        const workshopCompleted = completedOrders.filter((o: any) => o.workshopId === workshop.id);
        
        // Calculate quarterly accomplishment for this workshop
        const q1Orders = workshopOrders.filter((o: any) => {
          const created = new Date(o.createdAt);
          return created >= quarters[0].start && created <= quarters[0].end;
        });
        const q1Completed = q1Orders.filter((o: any) => o.status === 'completed');
        
        const q2Orders = workshopOrders.filter((o: any) => {
          const created = new Date(o.createdAt);
          return created >= quarters[1].start && created <= quarters[1].end;
        });
        const q2Completed = q2Orders.filter((o: any) => o.status === 'completed');
        
        const q3Orders = workshopOrders.filter((o: any) => {
          const created = new Date(o.createdAt);
          return created >= quarters[2].start && created <= quarters[2].end;
        });
        const q3Completed = q3Orders.filter((o: any) => o.status === 'completed');
        
        const q4Orders = workshopOrders.filter((o: any) => {
          const created = new Date(o.createdAt);
          return created >= quarters[3].start && created <= quarters[3].end;
        });
        const q4Completed = q4Orders.filter((o: any) => o.status === 'completed');
        
        // Calculate average cost for this workshop
        let workshopTotalCost = 0;
        for (const order of workshopCompleted) {
          const directCost = parseFloat(order.directMaintenanceCost || '0');
          const overtimeCost = parseFloat(order.overtimeCost || '0');
          const outsourceCost = parseFloat(order.outsourceCost || '0');
          const overheadCost = parseFloat(order.overheadCost || '0');
          
          if (directCost === 0 && overtimeCost === 0 && outsourceCost === 0) {
            const actualCost = parseFloat(order.actualCost || '0');
            workshopTotalCost += actualCost;
          } else {
            workshopTotalCost += directCost + overtimeCost + outsourceCost + overheadCost;
          }
        }
        
        const avgCost = workshopCompleted.length > 0 ? workshopTotalCost / workshopCompleted.length : 0;
        
        workshopPerformance.push({
          name: workshop.name,
          q1: q1Orders.length > 0 ? parseFloat(((q1Completed.length / q1Orders.length) * 100).toFixed(2)) : 0,
          q2: q2Orders.length > 0 ? parseFloat(((q2Completed.length / q2Orders.length) * 100).toFixed(2)) : 0,
          q3: q3Orders.length > 0 ? parseFloat(((q3Completed.length / q3Orders.length) * 100).toFixed(2)) : 0,
          q4: q4Orders.length > 0 ? parseFloat(((q4Completed.length / q4Orders.length) * 100).toFixed(2)) : 0,
          avgCost: parseFloat(avgCost.toFixed(2)),
          totalCost: parseFloat(workshopTotalCost.toFixed(2)),
        });
      }
      
      // Return analytics data
      res.json({
        kpis: {
          totalWorkOrders: totalCompleted,
          totalPlanned: totalPlanned,
          accomplishmentRate: parseFloat(accomplishmentRate.toFixed(2)),
          totalCost: parseFloat(totalCost.toFixed(2)),
          activeWorkshops: activeWorkshops,
        },
        costBreakdown: {
          directMaintenance: parseFloat(totalDirectCost.toFixed(2)),
          overtime: parseFloat(totalOvertimeCost.toFixed(2)),
          outsource: parseFloat(totalOutsourceCost.toFixed(2)),
          overhead: parseFloat(totalOverheadCost.toFixed(2)),
        },
        quarterlyData,
        workshopPerformance,
        workshops: workshopsData.filter((w: any) => w.isActive).map((w: any) => ({
          id: w.id,
          name: w.name,
        })),
      });
    } catch (error: any) {
      console.error("Error fetching dashboard analytics:", error);
      res.status(500).json({ error: "Failed to fetch dashboard analytics" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
