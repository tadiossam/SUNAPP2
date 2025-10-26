import axios, { AxiosInstance } from 'axios';

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

export class Dynamics365Service {
  private client: AxiosInstance;
  private baseUrl: string;
  private company: string;

  constructor() {
    const url = process.env.D365_BC_URL;
    const username = process.env.D365_BC_USERNAME;
    const password = process.env.D365_BC_PASSWORD;
    const company = process.env.D365_BC_COMPANY;

    if (!url || !username || !password || !company) {
      throw new Error('Dynamics 365 credentials not configured');
    }

    this.baseUrl = url;
    this.company = company;

    // Create axios instance with basic authentication
    this.client = axios.create({
      baseURL: this.baseUrl,
      auth: {
        username,
        password,
      },
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  /**
   * Test connection to Dynamics 365 Business Central
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await this.client.get('/ODataV4/$metadata');
      return response.status === 200;
    } catch (error) {
      console.error('D365 connection test failed:', error);
      return false;
    }
  }

  /**
   * Fetch all items from Dynamics 365 Business Central
   * @param filter Optional OData filter string
   */
  async fetchItems(filter?: string): Promise<D365Item[]> {
    try {
      const encodedCompany = encodeURIComponent(this.company);
      
      // Try different endpoint variations for Business Central OData
      // Note: baseURL already includes /SUNCONBC1/, don't duplicate it
      const endpoints = [
        // BC published web service format (lowercase 'items')
        `ODataV4/Company('${encodedCompany}')/items`,
        
        // Standard OData V4 patterns with Company
        `ODataV4/Company('${encodedCompany}')/Item`,
        `ODataV4/Company('${encodedCompany}')/Items`,
        `OData/Company('${encodedCompany}')/items`,
        `OData/Company('${encodedCompany}')/Item`,
        `OData/Company('${encodedCompany}')/Items`,
        
        // Without Company wrapper
        `ODataV4/items`,
        `ODataV4/Item`,
        `ODataV4/Items`,
        `OData/items`,
        `OData/Item`,
        `OData/Items`,
        
        // API route variations
        `api/v2.0/companies(${encodedCompany})/items`,
        `api/v1.0/companies(${encodedCompany})/items`,
        
        // Web services variations
        `WS/Company('${encodedCompany}')/Page/items`,
        `WS/Company('${encodedCompany}')/Page/Item`,
        `WS/${encodedCompany}/Page/items`,
        `WS/items`,
      ];

      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          let url = endpoint;
          
          // Add filter if provided
          if (filter) {
            url += `?$filter=${encodeURIComponent(filter)}`;
          }

          console.log(`Trying D365 endpoint: ${url}`);
          
          const response = await this.client.get(url);
          
          // Check for various response formats
          if (response.data) {
            // OData format
            if (response.data.value && Array.isArray(response.data.value)) {
              console.log(`✓ Success! Found ${response.data.value.length} items using endpoint: ${endpoint}`);
              return response.data.value;
            }
            // Direct array format
            if (Array.isArray(response.data)) {
              console.log(`✓ Success! Found ${response.data.length} items using endpoint: ${endpoint}`);
              return response.data;
            }
          }
        } catch (error: any) {
          const statusCode = error.response?.status;
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`✗ Endpoint ${endpoint} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
          lastError = error;
          // Continue to next endpoint
        }
      }
      
      // If all endpoints failed, throw the last error
      console.error('All D365 endpoints failed. Last error:', {
        message: lastError?.message,
        status: lastError?.response?.status,
        data: lastError?.response?.data,
      });
      throw new Error(`Failed to fetch items from Dynamics 365. Tried ${endpoints.length} different endpoints. Last error: ${lastError?.message}`);
    } catch (error: any) {
      console.error('Error fetching items from D365:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Fetch items that start with a specific prefix (e.g., "SP-")
   */
  async fetchItemsByPrefix(prefix: string): Promise<D365Item[]> {
    const filter = `startswith(No, '${prefix}')`;
    return this.fetchItems(filter);
  }

  /**
   * Fetch a single item by number
   */
  async fetchItemByNumber(itemNo: string): Promise<D365Item | null> {
    try {
      const encodedCompany = encodeURIComponent(this.company);
      const encodedItemNo = encodeURIComponent(itemNo);
      const url = `/ODataV4/Company('${encodedCompany}')/Item('${encodedItemNo}')`;

      console.log(`Fetching item from D365: ${url}`);
      
      const response = await this.client.get(url);
      
      if (response.data) {
        return response.data;
      }

      return null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('Error fetching item from D365:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to fetch item from Dynamics 365: ${error.message}`);
    }
  }

  /**
   * Fetch all equipment/fixed assets from Dynamics 365 Business Central
   * This attempts to fetch from Fixed Asset or Item tables based on filters
   */
  async fetchEquipment(filter?: string): Promise<D365Equipment[]> {
    try {
      const encodedCompany = encodeURIComponent(this.company);
      
      // Try different endpoint variations for equipment/fixed assets
      const endpoints = [
        // Fixed Asset endpoints
        `ODataV4/Company('${encodedCompany}')/FixedAsset`,
        `ODataV4/Company('${encodedCompany}')/Fixed_Asset`,
        `OData/Company('${encodedCompany}')/FixedAsset`,
        `OData/Company('${encodedCompany}')/Fixed_Asset`,
        
        // Could also be in Items table with specific type
        `ODataV4/Company('${encodedCompany}')/items`,
        `ODataV4/Company('${encodedCompany}')/Item`,
        
        // API route variations
        `api/v2.0/companies(${encodedCompany})/fixedAssets`,
        `api/v1.0/companies(${encodedCompany})/fixedAssets`,
      ];

      let lastError: any = null;
      
      for (const endpoint of endpoints) {
        try {
          let url = endpoint;
          
          // Add filter if provided
          if (filter) {
            url += `?$filter=${encodeURIComponent(filter)}`;
          }

          console.log(`Trying D365 equipment endpoint: ${url}`);
          
          const response = await this.client.get(url);
          
          // Check for various response formats
          if (response.data) {
            // OData format
            if (response.data.value && Array.isArray(response.data.value)) {
              console.log(`✓ Success! Found ${response.data.value.length} equipment using endpoint: ${endpoint}`);
              return response.data.value;
            }
            // Direct array format
            if (Array.isArray(response.data)) {
              console.log(`✓ Success! Found ${response.data.length} equipment using endpoint: ${endpoint}`);
              return response.data;
            }
          }
        } catch (error: any) {
          const statusCode = error.response?.status;
          const errorMsg = error.response?.data?.error?.message || error.message;
          console.log(`✗ Equipment endpoint ${endpoint} failed: ${statusCode || 'Network Error'} - ${errorMsg}`);
          lastError = error;
          // Continue to next endpoint
        }
      }
      
      // If all endpoints failed, throw the last error
      console.error('All D365 equipment endpoints failed. Last error:', {
        message: lastError?.message,
        status: lastError?.response?.status,
        data: lastError?.response?.data,
      });
      throw new Error(`Failed to fetch equipment from Dynamics 365. Tried ${endpoints.length} different endpoints. Last error: ${lastError?.message}`);
    } catch (error: any) {
      console.error('Error fetching equipment from D365:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  }

  /**
   * Fetch equipment that start with a specific prefix (e.g., "EQ-")
   */
  async fetchEquipmentByPrefix(prefix: string): Promise<D365Equipment[]> {
    const filter = `startswith(No, '${prefix}')`;
    return this.fetchEquipment(filter);
  }
}

// Export singleton instance
export const d365Service = new Dynamics365Service();
