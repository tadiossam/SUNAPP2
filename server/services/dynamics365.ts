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
      // Construct the OData URL for Items
      const encodedCompany = encodeURIComponent(this.company);
      let url = `/ODataV4/Company('${encodedCompany}')/Item`;

      // Add filter if provided
      if (filter) {
        url += `?$filter=${encodeURIComponent(filter)}`;
      }

      console.log(`Fetching items from D365: ${url}`);
      
      const response = await this.client.get(url);
      
      if (response.data && response.data.value) {
        return response.data.value;
      }

      return [];
    } catch (error: any) {
      console.error('Error fetching items from D365:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw new Error(`Failed to fetch items from Dynamics 365: ${error.message}`);
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
}

// Export singleton instance
export const d365Service = new Dynamics365Service();
