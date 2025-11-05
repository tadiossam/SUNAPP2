import ZKLib from 'zkteco-js';

export interface DeviceUser {
  uid: number;
  userId: string;
  name: string;
  password?: string;
  cardno?: string;
  role: number;
}

export interface ConnectionResult {
  success: boolean;
  userCount?: number;
  users?: DeviceUser[];
  message?: string;
  error?: string;
}

export class AttendanceDeviceService {
  private zkInstance: any = null;
  private ipAddress: string;
  private port: number;
  private timeout: number;

  constructor(ipAddress: string, port: number = 4370, timeout: number = 5000) {
    this.ipAddress = ipAddress;
    this.port = port;
    this.timeout = timeout;
  }

  async connect(): Promise<boolean> {
    try {
      this.zkInstance = new ZKLib(this.ipAddress, this.port, this.timeout, 2000);
      await this.zkInstance.createSocket();
      return true;
    } catch (error) {
      console.error('Device connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.zkInstance) {
        await this.zkInstance.disconnect();
        this.zkInstance = null;
      }
    } catch (error) {
      console.error('Device disconnect error:', error);
    }
  }

  async testConnection(): Promise<ConnectionResult> {
    try {
      await this.connect();
      const users = await this.zkInstance.getUsers();
      await this.disconnect();

      return {
        success: true,
        userCount: users?.data?.length || 0,
        users: users?.data || [],
        message: 'Connection successful'
      };
    } catch (error: any) {
      await this.disconnect();
      return {
        success: false,
        message: 'Connection failed',
        error: error.message || 'Unknown error'
      };
    }
  }

  async getUsers(): Promise<DeviceUser[]> {
    try {
      if (!this.zkInstance) {
        await this.connect();
      }

      const result = await this.zkInstance.getUsers();
      
      if (result && result.data) {
        console.log('📋 Sample raw user data from device:', JSON.stringify(result.data[0], null, 2));
        
        return result.data.map((user: any) => {
          // The ZKTeco device may have separate firstName and surname fields,
          // or just a single name field. We'll construct the full name.
          let fullName = '';
          
          if (user.name) {
            fullName = user.name;
          }
          
          // Some devices store first and last names separately
          if (user.firstName || user.surname) {
            const parts = [];
            if (user.firstName) parts.push(user.firstName);
            if (user.surname) parts.push(user.surname);
            fullName = parts.join(' ');
          }
          
          // Fall back to just name if nothing else
          if (!fullName && user.name) {
            fullName = user.name;
          }
          
          return {
            uid: user.uid || user.userId,
            userId: String(user.userId || user.uid),
            name: fullName || '',
            password: user.password || '',
            cardno: user.cardno || '',
            role: user.role || 0
          };
        });
      }

      return [];
    } catch (error) {
      console.error('Error fetching users from device:', error);
      throw error;
    }
  }

  async getAllUsersWithConnection(): Promise<DeviceUser[]> {
    try {
      await this.connect();
      const users = await this.getUsers();
      await this.disconnect();
      return users;
    } catch (error) {
      await this.disconnect();
      throw error;
    }
  }
}

export function createDeviceService(ipAddress: string, port: number = 4370, timeout: number = 5000) {
  return new AttendanceDeviceService(ipAddress, port, timeout);
}
