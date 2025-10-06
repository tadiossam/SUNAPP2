import fs from 'fs';
import pdf from 'pdf-parse';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pdfPath = path.join(__dirname, '../attached_assets/SERP2536-30-01-ALL-1 copy copy_1759788158814.pdf');

async function extractParts() {
  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    
    console.log('PDF Pages:', data.numpages);
    console.log('PDF Info:', data.info);
    console.log('\nExtracting parts...\n');
    
    const text = data.text;
    const lines = text.split('\n');
    
    // Regex for CAT part numbers (format: 1R-1808, 326-1642, etc.)
    const partNumberRegex = /\b([0-9]{1,3}[A-Z]?-[0-9]{4,6})\b/g;
    
    const parts = [];
    let currentSection = 'General';
    
    // Track sections from table of contents
    const sectionPatterns = [
      'LUBRICATION SYSTEM',
      'COOLING SYSTEM',
      'AIR INLET AND EXHAUST SYSTEM',
      'FUEL SYSTEM',
      'ELECTRICAL AND STARTING SYSTEM',
      'POWER TRAIN',
      'HYDRAULIC SYSTEM',
      'STEERING AND BRAKING SYSTEM',
      'FRAME AND BODY',
      'UNDERCARRIAGE',
      'IMPLEMENTS',
      'WORK TOOLS',
      'OPERATOR STATION'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Update current section
      for (const section of sectionPatterns) {
        if (line.includes(section)) {
          currentSection = section;
          break;
        }
      }
      
      // Find part numbers
      const matches = [...line.matchAll(partNumberRegex)];
      
      for (const match of matches) {
        const partNumber = match[1];
        
        // Get description from the same line and next few lines
        let description = line.replace(partNumberRegex, '').trim();
        
        // Clean up common noise
        description = description.replace(/^[.\s-]+|[.\s-]+$/g, '');
        description = description.replace(/\s+/g, ' ');
        
        if (description && description.length > 3 && description.length < 200) {
          parts.push({
            partNumber,
            description,
            category: currentSection,
            line: i + 1
          });
        }
      }
    }
    
    // Deduplicate by part number
    const uniqueParts = [];
    const seen = new Set();
    
    for (const part of parts) {
      if (!seen.has(part.partNumber)) {
        seen.add(part.partNumber);
        uniqueParts.push(part);
      }
    }
    
    console.log(`Found ${uniqueParts.length} unique parts`);
    
    // Save to JSON
    const outputPath = path.join(__dirname, 'extracted-parts.json');
    fs.writeFileSync(outputPath, JSON.stringify(uniqueParts, null, 2));
    
    console.log(`\nParts saved to: ${outputPath}`);
    console.log('\nSample parts:');
    console.log(uniqueParts.slice(0, 10).map(p => `${p.partNumber} - ${p.description} [${p.category}]`).join('\n'));
    
  } catch (error) {
    console.error('Error extracting parts:', error);
  }
}

extractParts();
