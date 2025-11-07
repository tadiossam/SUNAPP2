/**
 * Parses equipment description to extract structured data.
 * 
 * Rules:
 * 1. Find Plate Number (P/N):
 *    - If "P/N" exists, extract the value following it
 *    - Otherwise, look for pattern like "3-35809ET" (number-dash-alphanumeric)
 * 2. Find Serial Number (S/N):
 *    - If "S/N" exists, extract the value following it
 *    - Otherwise, leave blank
 * 3. Find Equipment Name:
 *    - Everything before P/N, S/N, or fallback pattern
 * 4. Description:
 *    - Keep full original text
 * 
 * Examples:
 * - "High Bed P/N 3-84078 S/N LZZ5CLVBGW147496"
 *   → name: "High Bed", plateNumber: "3-84078", serialNumber: "LZZ5CLVBGW147496"
 * - "Pump 3-35809ET"
 *   → name: "Pump", plateNumber: "3-35809ET", serialNumber: ""
 */

interface ParsedEquipmentDescription {
  equipmentName: string;
  plateNumber: string;
  serialNumber: string;
  description: string;
}

export function parseEquipmentDescription(description: string): ParsedEquipmentDescription {
  if (!description || typeof description !== 'string') {
    return {
      equipmentName: "Unknown",
      plateNumber: "",
      serialNumber: "",
      description: description || "",
    };
  }

  const trimmedDesc = description.trim();
  let equipmentName = "Unknown";
  let plateNumber = "";
  let serialNumber = "";

  // Find Serial Number (S/N)
  const snMatch = trimmedDesc.match(/S\/N\s+([A-Z0-9]+)/i);
  if (snMatch) {
    serialNumber = snMatch[1].trim();
  }

  // Find Plate Number (P/N)
  const pnMatch = trimmedDesc.match(/P\/N\s+([\w-]+)/i);
  if (pnMatch) {
    plateNumber = pnMatch[1].trim();
    // Equipment name is everything before "P/N"
    const pnIndex = trimmedDesc.indexOf(pnMatch[0]);
    equipmentName = trimmedDesc.substring(0, pnIndex).trim() || "Unknown";
  } else {
    // Fallback: look for pattern like "3-35809ET" (digits-dash-alphanumeric)
    const fallbackPattern = /\b(\d+-[A-Z0-9]+)\b/i;
    const fallbackMatch = trimmedDesc.match(fallbackPattern);
    
    if (fallbackMatch) {
      plateNumber = fallbackMatch[1].trim();
      // Equipment name is everything before the fallback pattern
      const fallbackIndex = trimmedDesc.indexOf(fallbackMatch[0]);
      equipmentName = trimmedDesc.substring(0, fallbackIndex).trim() || "Unknown";
    } else {
      // No P/N pattern found, use entire description as equipment name
      // But check if there's an S/N that we can extract the name before
      if (snMatch) {
        const snIndex = trimmedDesc.indexOf(snMatch[0]);
        equipmentName = trimmedDesc.substring(0, snIndex).trim() || "Unknown";
      } else {
        equipmentName = trimmedDesc;
      }
    }
  }

  return {
    equipmentName: equipmentName || "Unknown",
    plateNumber,
    serialNumber,
    description: trimmedDesc,
  };
}
