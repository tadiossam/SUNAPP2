import XLSX from 'xlsx';
import { z } from 'zod';

export interface ExcelTemplateConfig {
  sheetName: string;
  headers: string[];
  fieldMapping: Record<string, string>; // Excel header -> database field
  requiredHeaders: string[];
  sampleData?: any[][];
}

export interface ExcelImportResult<T> {
  success: boolean;
  data?: T[];
  errors: ExcelImportError[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

export interface ExcelImportError {
  row: number;
  field?: string;
  message: string;
}

export function generateExcelTemplate(config: ExcelTemplateConfig): Buffer {
  const workbook = XLSX.utils.book_new();
  
  // Create worksheet with headers
  const worksheetData = [config.headers];
  
  // Add sample data if provided
  if (config.sampleData && config.sampleData.length > 0) {
    worksheetData.push(...config.sampleData);
  }
  
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Set column widths for better readability
  const colWidths = config.headers.map(() => ({ wch: 20 }));
  worksheet['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName);
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
}

export function parseExcelFile(buffer: Buffer, sheetName?: string): any[] {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Use first sheet if sheetName not specified
  const sheet = sheetName 
    ? workbook.Sheets[sheetName] 
    : workbook.Sheets[workbook.SheetNames[0]];
  
  if (!sheet) {
    throw new Error(`Sheet "${sheetName || workbook.SheetNames[0]}" not found`);
  }
  
  // Convert sheet to JSON
  const data = XLSX.utils.sheet_to_json(sheet, { defval: null });
  return data;
}

export function validateAndTransformExcelData<T>(
  rawData: any[],
  config: ExcelTemplateConfig,
  validator: z.ZodSchema<T>,
  transformer?: (row: any) => any
): ExcelImportResult<T> {
  const errors: ExcelImportError[] = [];
  const validData: T[] = [];
  
  // Check if required headers are present in first row
  if (rawData.length > 0) {
    const firstRow = rawData[0];
    const missingHeaders = config.requiredHeaders.filter(
      (header) => !(header in firstRow)
    );
    
    if (missingHeaders.length > 0) {
      errors.push({
        row: 0,
        message: `Missing required columns: ${missingHeaders.join(', ')}`,
      });
      
      return {
        success: false,
        errors,
        summary: {
          total: rawData.length,
          valid: 0,
          invalid: rawData.length,
        },
      };
    }
  }
  
  // Process each row
  rawData.forEach((row, index) => {
    try {
      // Map Excel headers to database fields
      const mappedRow: any = {};
      Object.keys(config.fieldMapping).forEach((excelHeader) => {
        const dbField = config.fieldMapping[excelHeader];
        mappedRow[dbField] = row[excelHeader];
      });
      
      // Apply custom transformer if provided
      const transformed = transformer ? transformer(mappedRow) : mappedRow;
      
      // Validate using Zod schema
      const result = validator.safeParse(transformed);
      
      if (result.success) {
        validData.push(result.data);
      } else {
        // Collect validation errors
        result.error.errors.forEach((err) => {
          errors.push({
            row: index + 2, // +2 because: +1 for 0-index, +1 for header row
            field: err.path.join('.'),
            message: err.message,
          });
        });
      }
    } catch (error) {
      errors.push({
        row: index + 2,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
  
  return {
    success: errors.length === 0,
    data: validData,
    errors,
    summary: {
      total: rawData.length,
      valid: validData.length,
      invalid: errors.length,
    },
  };
}

// Employee template configuration
export const employeeTemplateConfig: ExcelTemplateConfig = {
  sheetName: 'Employees',
  headers: [
    'Employee ID*',
    'Full Name*',
    'Role*',
    'Phone Number',
    'Email',
    'Specialty',
    'Department',
    'Device User ID',
  ],
  fieldMapping: {
    'Employee ID*': 'employeeId',
    'Full Name*': 'fullName',
    'Role*': 'role',
    'Phone Number': 'phoneNumber',
    'Email': 'email',
    'Specialty': 'specialty',
    'Department': 'department',
    'Device User ID': 'deviceUserId',
  },
  requiredHeaders: ['Employee ID*', 'Full Name*', 'Role*'],
  sampleData: [
    ['EMP001', 'John Doe', 'mechanic', '+251911234567', 'john@example.com', 'Engine', 'mechanical', '1001'],
    ['EMP002', 'Jane Smith', 'supervisor', '+251922345678', 'jane@example.com', '', 'mechanical', '1002'],
  ],
};

// Spare Parts template configuration
export const sparePartsTemplateConfig: ExcelTemplateConfig = {
  sheetName: 'Spare Parts',
  headers: [
    'Part Number*',
    'Part Name*',
    'Category*',
    'Description',
    'Price',
    'Stock Quantity',
    'Location Instructions',
  ],
  fieldMapping: {
    'Part Number*': 'partNumber',
    'Part Name*': 'partName',
    'Category*': 'category',
    'Description': 'description',
    'Price': 'price',
    'Stock Quantity': 'stockQuantity',
    'Location Instructions': 'locationInstructions',
  },
  requiredHeaders: ['Part Number*', 'Part Name*', 'Category*'],
  sampleData: [
    ['PN-001', 'Engine Oil Filter', 'Engine', 'Standard oil filter for CAT engines', '25.50', '100', 'Engine compartment, left side'],
    ['PN-002', 'Hydraulic Hose', 'Hydraulic', '1/2 inch hydraulic hose', '15.75', '50', 'Hydraulic system, main line'],
  ],
};

// Equipment template configuration
export const equipmentTemplateConfig: ExcelTemplateConfig = {
  sheetName: 'Equipment',
  headers: [
    'Equipment Type*',
    'Make*',
    'Model*',
    'Plate No',
    'Asset No',
    'New Asset No',
    'Machine Serial',
    'Plant Number',
    'Project Area',
    'Price',
    'Remarks',
  ],
  fieldMapping: {
    'Equipment Type*': 'equipmentType',
    'Make*': 'make',
    'Model*': 'model',
    'Plate No': 'plateNo',
    'Asset No': 'assetNo',
    'New Asset No': 'newAssetNo',
    'Machine Serial': 'machineSerial',
    'Plant Number': 'plantNumber',
    'Project Area': 'projectArea',
    'Price': 'price',
    'Remarks': 'remarks',
  },
  requiredHeaders: ['Equipment Type*', 'Make*', 'Model*'],
  sampleData: [
    ['DOZER', 'CAT', 'D8R', 'AA-12345', 'AST-001', 'NAST-001', 'SN123456', 'PLANT-01', 'Area A', '250000', ''],
    ['WHEEL LOADER', 'KOMATSU', 'WA470', 'AA-67890', 'AST-002', 'NAST-002', 'SN789012', 'PLANT-02', 'Area B', '180000', ''],
  ],
};
