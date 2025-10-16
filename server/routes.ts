import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
  insertRepairBaySchema,
  insertEmployeeSchema,
  insertWorkOrderSchema,
  insertStandardOperatingProcedureSchema,
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
} from "@shared/schema";
import multer from "multer";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { nanoid } from "nanoid";
import { isCEO, isCEOOrAdmin, verifyCredentials, generateToken } from "./auth";
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

  // Repair Bays
  app.get("/api/garages/:garageId/bays", async (req, res) => {
    try {
      const bays = await storage.getRepairBaysByGarage(req.params.garageId);
      res.json(bays);
    } catch (error) {
      console.error("Error fetching repair bays:", error);
      res.status(500).json({ error: "Failed to fetch repair bays" });
    }
  });

  app.post("/api/repair-bays", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertRepairBaySchema.parse(req.body);
      const bay = await storage.createRepairBay(validatedData);
      res.status(201).json(bay);
    } catch (error) {
      console.error("Error creating repair bay:", error);
      res.status(400).json({ error: "Invalid repair bay data" });
    }
  });

  app.put("/api/repair-bays/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertRepairBaySchema.parse(req.body);
      const bay = await storage.updateRepairBay(req.params.id, validatedData);
      res.json(bay);
    } catch (error) {
      console.error("Error updating repair bay:", error);
      res.status(400).json({ error: "Failed to update repair bay" });
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

  // Employee photo upload endpoint
  app.post("/api/employees/:id/photo", isCEOOrAdmin, upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get the public object storage path
      const publicPath = process.env.PUBLIC_OBJECT_SEARCH_PATHS?.split(',')[0] || '';
      if (!publicPath) {
        return res.status(500).json({ error: "Object storage not configured" });
      }

      // Save file to object storage
      await mkdir(join(publicPath, 'employees'), { recursive: true });

      const ext = req.file.originalname.split('.').pop();
      const filename = `${nanoid()}.${ext}`;
      const filePath = join(publicPath, 'employees', filename);
      
      await writeFile(filePath, req.file.buffer);
      const photoUrl = `/public/employees/${filename}`;

      // Update employee with photo URL
      const employee = await storage.updateEmployeePhoto(req.params.id, photoUrl);
      if (!employee) {
        return res.status(404).json({ error: "Employee not found" });
      }

      res.json(employee);
    } catch (error) {
      console.error("Error uploading employee photo:", error);
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  // Work Orders
  app.get("/api/work-orders", async (req, res) => {
    try {
      const { status, assignedToId, garageId } = req.query;
      const workOrders = await storage.getAllWorkOrders({
        status: status as string | undefined,
        assignedToId: assignedToId as string | undefined,
        garageId: garageId as string | undefined,
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

  // Get inspection by reception ID
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

  // Get all completed inspections
  app.get("/api/inspections/completed", async (req, res) => {
    try {
      const inspections = await storage.getAllCompletedInspections();
      res.json(inspections);
    } catch (error) {
      console.error("Error fetching completed inspections:", error);
      res.status(500).json({ error: "Failed to fetch completed inspections" });
    }
  });

  // Update inspection
  app.patch("/api/inspections/:id", async (req, res) => {
    try {
      const updatedInspection = await storage.updateInspection(req.params.id, req.body);
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

  // Create bulk checklist items
  app.post("/api/inspections/:inspectionId/checklist/bulk", async (req, res) => {
    try {
      const items = await storage.createBulkChecklistItems(req.body.items);
      res.status(201).json(items);
    } catch (error) {
      console.error("Error creating checklist items:", error);
      res.status(400).json({ error: "Failed to create checklist items" });
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

  // Standard Operating Procedures (SOPs)
  app.get("/api/sops", async (req, res) => {
    try {
      const { category, targetRole, language } = req.query;
      const sops = await storage.getAllSOPs({
        category: category as string | undefined,
        targetRole: targetRole as string | undefined,
        language: language as string | undefined,
      });
      res.json(sops);
    } catch (error) {
      console.error("Error fetching SOPs:", error);
      res.status(500).json({ error: "Failed to fetch SOPs" });
    }
  });

  app.get("/api/sops/:id", async (req, res) => {
    try {
      const sop = await storage.getSOPById(req.params.id);
      if (!sop) {
        return res.status(404).json({ error: "SOP not found" });
      }
      res.json(sop);
    } catch (error) {
      console.error("Error fetching SOP:", error);
      res.status(500).json({ error: "Failed to fetch SOP" });
    }
  });

  app.post("/api/sops", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertStandardOperatingProcedureSchema.parse(req.body);
      const sop = await storage.createSOP(validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'created', 'sop', sop.id, req.user.username, validatedData
        ));
      }
      
      res.status(201).json(sop);
    } catch (error) {
      console.error("Error creating SOP:", error);
      res.status(400).json({ error: "Invalid SOP data" });
    }
  });

  app.put("/api/sops/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertStandardOperatingProcedureSchema.parse(req.body);
      const sop = await storage.updateSOP(req.params.id, validatedData);
      
      if (req.user?.role === "admin") {
        await sendCEONotification(createNotification(
          'updated', 'sop', sop.id, req.user.username, validatedData
        ));
      }
      
      res.json(sop);
    } catch (error) {
      console.error("Error updating SOP:", error);
      res.status(400).json({ error: "Failed to update SOP" });
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
  app.get("/api/approvals", isCEOOrAdmin, async (req, res) => {
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
  app.post("/api/approvals/inspection", async (req, res) => {
    try {
      const { inspectionId, inspectionNumber, equipmentInfo, overallCondition, findings, recommendations } = req.body;
      
      if (!req.user || !req.user.employeeId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Find an admin or supervisor to assign the approval to
      const admins = await storage.getAllEmployees("admin");
      const assignedTo = admins[0]?.id;

      if (!assignedTo) {
        return res.status(400).json({ error: "No admin available to approve inspection" });
      }

      const approval = await storage.createApproval({
        approvalType: "inspection",
        referenceId: inspectionId,
        referenceNumber: inspectionNumber,
        requestedById: req.user.employeeId,
        assignedToId: assignedTo,
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

  app.put("/api/approvals/:id", isCEOOrAdmin, async (req, res) => {
    try {
      const validatedData = insertApprovalSchema.parse(req.body);
      const approval = await storage.updateApproval(req.params.id, validatedData);
      
      // If inspection approval is approved, auto-create work order
      if (approval.approvalType === "inspection" && approval.status === "approved" && approval.referenceId) {
        try {
          const inspection = await storage.getInspectionById(approval.referenceId);
          if (inspection && inspection.receptionId) {
            const reception = await storage.getEquipmentReceptionById(inspection.receptionId);
            if (reception) {
              // Auto-generate work order number
              const now = new Date();
              const year = now.getFullYear();
              const existingWorkOrders = await storage.getAllWorkOrders();
              const currentYearWorkOrders = existingWorkOrders.filter(wo => 
                wo.workOrderNumber?.startsWith(`WO-${year}`)
              );
              const nextNumber = currentYearWorkOrders.length + 1;
              const workOrderNumber = `WO-${year}-${String(nextNumber).padStart(3, '0')}`;

              // Determine work type from inspection findings
              const workType = inspection.overallCondition === "Poor" ? "Major Repair" : "Routine Maintenance";

              // Create work order
              await storage.createWorkOrder({
                workOrderNumber,
                equipmentId: reception.equipmentId,
                garageId: reception.garageId || undefined,
                workType,
                priority: inspection.overallCondition === "Poor" ? "High" : "Medium",
                description: `Work order auto-created from approved inspection ${inspection.inspectionNumber}`,
                estimatedDuration: null,
                scheduledStartDate: new Date().toISOString(),
                inspectionId: inspection.id,
                receptionId: reception.id,
                status: "pending",
              });
            }
          }
        } catch (error) {
          console.error("Error auto-creating work order from inspection:", error);
          // Don't fail the approval update if work order creation fails
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
    } catch (error) {
      console.error("Error searching for public object:", error);
      return res.status(500).json({ error: "Internal server error" });
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

  // Get device settings
  app.get("/api/attendance-device/settings", isCEOOrAdmin, async (_req, res) => {
    try {
      const settings = await storage.getAttendanceDeviceSettings();
      res.json(settings || null);
    } catch (error) {
      console.error("Error fetching device settings:", error);
      res.status(500).json({ error: "Failed to fetch device settings" });
    }
  });

  // Save device settings
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
        lastImportAt: new Date().toISOString(),
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

  const httpServer = createServer(app);

  return httpServer;
}
