// @ts-ignore - httpntlm doesn't have TypeScript definitions
import httpntlm from 'httpntlm';

export interface D365Item {
  No: string;
  Description: string;
  Description_2?: string;
  Type?: string;
  Base_Unit_of_Measure?: string;
  Unit_Price?: number;
  Unit_Cost?: number;
  Inventory?: number;
  Vendor_No?: string;
  Vendor_Item_No?: string;
  Last_Date_Modified?: string;
}

export interface D365Equipment {
  No: string;
  Description: string;
  Description_2?: string;
  Make?: string;
  Model?: string;
  Serial_No?: string;
  Asset_No?: string;
  Plant_Number?: string;
  Unit_Price?: number;
  Type?: string;
}

export interface D365Settings {
  bcUrl: string;
  bcCompany: string;
  bcUsername: string;
  bcPassword: string;
}

/**
 * Fetch items from D365 using NTLM authentication
 */
export async function fetchItemsNTLM(
  settings: D365Settings,
  prefix?: string
): Promise<D365Item[]> {
  const { bcUrl, bcCompany, bcUsername, bcPassword } = settings;
  
  let url = `${bcUrl}/ODataV4/Company('${encodeURIComponent(bcCompany)}')/items`;
  
  if (prefix) {
    url += `?$filter=startswith(No, '${prefix}')`;
  }
  
  console.log(`Fetching D365 items with NTLM from: ${url}`);
  
  return new Promise((resolve, reject) => {
    httpntlm.get({
      url,
      username: bcUsername,
      password: bcPassword,
      workstation: '',
      domain: '',
    }, (err: any, res: any) => {
      if (err) {
        console.error('D365 NTLM fetch error:', err);
        reject(err);
      } else if (res.statusCode !== 200) {
        console.error(`D365 returned status ${res.statusCode}`);
        reject(new Error(`HTTP ${res.statusCode}: ${res.body || 'Unknown error'}`));
      } else {
        try {
          const data = JSON.parse(res.body);
          const items = data.value || [];
          console.log(`Fetched ${items.length} items from D365`);
          resolve(items);
        } catch (parseError) {
          console.error('Failed to parse D365 response:', parseError);
          reject(new Error('Failed to parse D365 response'));
        }
      }
    });
  });
}

/**
 * Fetch equipment/fixed assets from D365 using NTLM authentication
 */
export async function fetchEquipmentNTLM(
  settings: D365Settings,
  prefix?: string
): Promise<D365Equipment[]> {
  const { bcUrl, bcCompany, bcUsername, bcPassword } = settings;
  
  // Try multiple endpoint variations for equipment/fixed assets
  const endpoints = [
    'FixedAssets',
    'Fixed_Assets',
    'Fixed Assets',
    'Equipment',
  ];
  
  for (const endpoint of endpoints) {
    try {
      let url = `${bcUrl}/ODataV4/Company('${encodeURIComponent(bcCompany)}')/${endpoint}`;
      
      if (prefix) {
        url += `?$filter=startswith(No, '${prefix}') or startswith(Asset_No, '${prefix}')`;
      }
      
      console.log(`Trying D365 equipment endpoint: ${url}`);
      
      const equipment: D365Equipment[] = await new Promise((resolve, reject) => {
        httpntlm.get({
          url,
          username: bcUsername,
          password: bcPassword,
          workstation: '',
          domain: '',
        }, (err: any, res: any) => {
          if (err) {
            reject(err);
          } else if (res.statusCode === 404) {
            // Endpoint not found, try next one
            resolve([]);
          } else if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode}`));
          } else {
            try {
              const data = JSON.parse(res.body);
              resolve(data.value || []);
            } catch (parseError) {
              reject(new Error('Failed to parse response'));
            }
          }
        });
      });
      
      if (equipment.length > 0 || prefix) {
        // Found equipment or was filtered, return results
        console.log(`Fetched ${equipment.length} equipment from D365 using endpoint: ${endpoint}`);
        return equipment;
      }
    } catch (error) {
      // Try next endpoint
      console.log(`Endpoint ${endpoint} failed, trying next...`);
      continue;
    }
  }
  
  throw new Error('No valid equipment endpoint found in D365. Please check if Fixed Assets are published as OData.');
}
