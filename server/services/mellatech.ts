import axios, { AxiosInstance } from 'axios';

interface MellaTechConfig {
  baseUrl: string;
  username: string;
  password: string;
}

interface MellaTechVehicleData {
  id: string;
  name: string;
  plateNumber?: string;
  speed?: number;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  angle?: number;
  battery?: number;
  distance?: number;
  status?: string;
  lastUpdate?: Date;
  engineHours?: number;
}

interface MellaTechLoginResponse {
  success: boolean;
  uat?: string;
  error?: string;
}

interface MellaTechObjectsResponse {
  [key: string]: {
    w?: boolean;
    e?: boolean;
    s?: boolean;
    evtac?: boolean;
    evtoloc?: boolean;
    a?: string;
    l?: number[];
    d?: {
      battery?: number;
      distance?: number;
      event_s?: number;
      host?: number;
    }[];
  };
}

class MellaTechService {
  private config: MellaTechConfig;
  private axiosInstance: AxiosInstance;
  private sessionCookies: string = '';
  private uat: string = '';
  private isAuthenticated: boolean = false;

  constructor(config: MellaTechConfig) {
    this.config = config;
    
    this.axiosInstance = axios.create({
      baseURL: config.baseUrl,
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
      },
      maxRedirects: 5,
      withCredentials: true,
    });

    this.axiosInstance.interceptors.response.use(
      (response) => {
        const setCookieHeaders = response.headers['set-cookie'];
        if (setCookieHeaders) {
          this.sessionCookies = setCookieHeaders.join('; ');
        }
        return response;
      },
      (error) => {
        return Promise.reject(error);
      }
    );
  }

  async login(): Promise<MellaTechLoginResponse> {
    try {
      console.log('🔐 Attempting MellaTech login...');
      console.log('   Username:', this.config.username);
      
      // First, fetch the login page to check for CSRF tokens or field names
      console.log('   Fetching login page to check form structure...');
      const loginPageResponse = await this.axiosInstance.get('/et/index.php');
      const loginPageHtml = loginPageResponse.data;
      
      // Check for CSRF token in the form
      const csrfMatch = loginPageHtml.match(/name=["\']csrf["\'].*?value=["\'](.*?)["\']/i);
      const csrfToken = csrfMatch ? csrfMatch[1] : null;
      
      // Check actual form field names
      const usernameFieldMatch = loginPageHtml.match(/<input[^>]*name=["\'](login|username|user)["\'][^>]*>/i);
      const passwordFieldMatch = loginPageHtml.match(/<input[^>]*type=["\'](password)["\'][^>]*name=["\'](.*?)["\']/i);
      
      console.log('   Form analysis:');
      console.log('   - CSRF token:', csrfToken ? 'Found' : 'Not found');
      console.log('   - Username field:', usernameFieldMatch ? usernameFieldMatch[1] : 'login (default)');
      console.log('   - Password field:', passwordFieldMatch ? passwordFieldMatch[2] : 'password (default)');

      const loginData = new URLSearchParams();
      loginData.append('login', this.config.username);
      loginData.append('password', this.config.password);
      
      if (csrfToken) {
        loginData.append('csrf', csrfToken);
        console.log('   Added CSRF token to request');
      }

      const response = await this.axiosInstance.post('/et/index.php', loginData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Origin': this.config.baseUrl,
          'Referer': `${this.config.baseUrl}/et/index.php`,
        },
        maxRedirects: 0, // Disable automatic redirects to check manually
        validateStatus: (status) => status < 400, // Accept 3xx status codes
      });

      const cookies = response.headers['set-cookie'];
      if (cookies) {
        this.sessionCookies = cookies.join('; ');
        console.log('   Cookies received:', cookies.length);
      }

      console.log('   Response status:', response.status);
      const locationHeader = response.headers['location'] || '';
      console.log('   Location header:', locationHeader);
      
      // Check if we got a redirect (302/301) to cpanel.php or tracking.php
      if ((response.status === 302 || response.status === 301) && locationHeader) {
        if (locationHeader.includes('cpanel.php') || locationHeader.includes('tracking.php')) {
          console.log('✅ MellaTech login successful - server redirecting to', locationHeader);
          this.isAuthenticated = true;
          
          await this.fetchUat();
          
          return { success: true, uat: this.uat };
        }
      }
      
      const redirectUrl = response.request?.res?.responseUrl || response.request?.path || '';
      console.log('   Final URL:', redirectUrl);

      if (response.status === 200) {
        const responseText = typeof response.data === 'string' ? response.data : '';
        console.log('   Response length:', responseText.length);
        
        // Check if successfully redirected to tracking page OR cpanel.php (MellaTech's actual redirect)
        if (redirectUrl.includes('tracking.php') || redirectUrl.includes('cpanel.php')) {
          console.log('✅ MellaTech login successful - redirected to', redirectUrl.includes('cpanel.php') ? 'cpanel' : 'tracking page');
          this.isAuthenticated = true;
          
          await this.fetchUat();
          
          return { success: true, uat: this.uat };
        }
        
        // Check if we have valid session cookies - MellaTech uses JavaScript redirect
        // If we got cookies and status 200, try to access cpanel.php and tracking.php directly
        if (this.sessionCookies && cookies && cookies.length > 0) {
          console.log('   Attempting to access cpanel.php and tracking.php with session cookies...');
          
          try {
            // Try cpanel.php first (MellaTech's actual landing page after login)
            const cpanelResponse = await this.axiosInstance.get('/et/cpanel.php', {
              headers: {
                'Cookie': this.sessionCookies,
                'Referer': `${this.config.baseUrl}/et/index.php`,
              },
              maxRedirects: 5,
              validateStatus: (status) => status < 400,
            });
            
            // Check if we were NOT redirected back to login
            const cpanelUrl = cpanelResponse.request?.res?.responseUrl || cpanelResponse.request?.path || '';
            if (cpanelResponse.status === 200 && !cpanelUrl.includes('index.php')) {
              console.log('✅ MellaTech login successful - cpanel.php accessible');
              this.isAuthenticated = true;
              
              // Now try to get UAT from tracking page
              try {
                const trackingResponse = await this.axiosInstance.get('/et/tracking.php', {
                  headers: {
                    'Cookie': this.sessionCookies,
                    'Referer': `${this.config.baseUrl}/et/cpanel.php`,
                  },
                });
                
                const trackingHtml = trackingResponse.data;
                const uatMatch = trackingHtml.match(/"uat"\s*:\s*"(\d+)"/);
                if (uatMatch && uatMatch[1]) {
                  this.uat = uatMatch[1];
                  console.log('   Extracted UAT token:', this.uat);
                }
              } catch (uatError) {
                console.log('   Could not extract UAT, but login successful');
              }
              
              return { success: true, uat: this.uat };
            }
          } catch (cpanelError) {
            console.log('   Could not access cpanel.php - trying tracking.php...');
            
            // Fallback: try tracking.php directly
            try {
              const trackingResponse = await this.axiosInstance.get('/et/tracking.php', {
                headers: {
                  'Cookie': this.sessionCookies,
                  'Referer': `${this.config.baseUrl}/et/index.php`,
                },
              });
              
              const trackingUrl = trackingResponse.request?.res?.responseUrl || trackingResponse.request?.path || '';
              if (trackingResponse.status === 200 && !trackingUrl.includes('index.php')) {
                console.log('✅ MellaTech login successful - tracking.php accessible');
                this.isAuthenticated = true;
                
                const trackingHtml = trackingResponse.data;
                const uatMatch = trackingHtml.match(/"uat"\s*:\s*"(\d+)"/);
                if (uatMatch && uatMatch[1]) {
                  this.uat = uatMatch[1];
                  console.log('   Extracted UAT token:', this.uat);
                }
                
                return { success: true, uat: this.uat };
              }
            } catch (trackingError) {
              console.log('   Could not access tracking page - likely invalid credentials');
            }
          }
        }
        
        // Look for error indicators in the HTML response
        if (responseText.toLowerCase().includes('invalid') || 
            responseText.toLowerCase().includes('incorrect') ||
            responseText.toLowerCase().includes('wrong') ||
            responseText.toLowerCase().includes('error')) {
          console.log('❌ Login failed - error keywords found in response');
          return { success: false, error: 'Invalid username or password - MellaTech rejected login' };
        }
        
        // If we stayed on index.php, it's likely invalid credentials
        if (redirectUrl.includes('index.php') || !redirectUrl.includes('tracking')) {
          console.log('❌ Login failed - stayed on login page (invalid credentials)');
          return { success: false, error: 'Invalid username or password - please verify your credentials' };
        }
      }

      console.log('❌ MellaTech login failed - unexpected response');
      return { success: false, error: 'Login failed - unexpected response from MellaTech' };

    } catch (error: any) {
      console.error('❌ MellaTech login error:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data?.substring(0, 200));
      }
      return { success: false, error: error.message };
    }
  }

  private async fetchUat(): Promise<void> {
    try {
      const response = await this.axiosInstance.get('/et/tracking.php', {
        headers: {
          'Cookie': this.sessionCookies,
          'Referer': `${this.config.baseUrl}/et/index.php`,
        },
      });

      const htmlContent = response.data;
      const uatMatch = htmlContent.match(/"uat"\s*:\s*"(\d+)"/);
      
      if (uatMatch && uatMatch[1]) {
        this.uat = uatMatch[1];
        console.log('✅ Extracted UAT token:', this.uat);
      } else {
        console.warn('⚠️ Could not extract UAT from tracking page');
      }
    } catch (error: any) {
      console.error('❌ Error fetching UAT:', error.message);
    }
  }

  async getVehicles(): Promise<MellaTechVehicleData[]> {
    if (!this.isAuthenticated) {
      const loginResult = await this.login();
      if (!loginResult.success) {
        throw new Error('Authentication failed');
      }
    }

    try {
      console.log('🚗 Fetching vehicles from MellaTech...');

      const payload = {
        uat: this.uat,
        ser: []
      };

      const response = await this.axiosInstance.post<MellaTechObjectsResponse>(
        '/et/func/fn_objects.php',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Cookie': this.sessionCookies,
            'Origin': this.config.baseUrl,
            'Referer': `${this.config.baseUrl}/et/tracking.php`,
            'X-Requested-With': 'XMLHttpRequest',
          },
        }
      );

      console.log('✅ Received vehicle data from MellaTech');

      const vehicles: MellaTechVehicleData[] = [];

      for (const [vehicleId, vehicleData] of Object.entries(response.data)) {
        if (vehicleId === 'uat' || vehicleId === 'ser') continue;

        const gpsData = vehicleData.l || [];
        const detailsArray = vehicleData.d || [];
        const details = detailsArray.length > 0 ? detailsArray[0] : {};

        const vehicle: MellaTechVehicleData = {
          id: vehicleId,
          name: vehicleData.a || `Vehicle ${vehicleId}`,
          latitude: gpsData[2] || undefined,
          longitude: gpsData[3] || undefined,
          altitude: gpsData[4] || undefined,
          battery: details.battery || undefined,
          distance: details.distance || undefined,
          status: this.getVehicleStatus(vehicleData),
          lastUpdate: gpsData[0] ? new Date(gpsData[0] * 1000) : undefined,
        };

        vehicles.push(vehicle);
      }

      console.log(`✅ Processed ${vehicles.length} vehicles`);
      return vehicles;

    } catch (error: any) {
      console.error('❌ Error fetching vehicles:', error.message);
      
      if (error.response?.status === 401 || error.response?.status === 403) {
        this.isAuthenticated = false;
        console.log('🔄 Session expired, re-authenticating...');
        const loginResult = await this.login();
        if (loginResult.success) {
          return this.getVehicles();
        }
      }
      
      throw error;
    }
  }

  private getVehicleStatus(vehicleData: any): string {
    if (vehicleData.s === false) return 'Stopped';
    if (vehicleData.w === true) return 'Moving';
    if (vehicleData.e === false) return 'Idle';
    return 'Unknown';
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const loginResult = await this.login();
      if (!loginResult.success) {
        return { success: false, message: loginResult.error || 'Login failed' };
      }

      const vehicles = await this.getVehicles();
      return {
        success: true,
        message: `Successfully connected. Found ${vehicles.length} vehicles.`
      };
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  isConnected(): boolean {
    return this.isAuthenticated;
  }

  async refreshSession(): Promise<boolean> {
    const result = await this.login();
    return result.success;
  }
}

let mellaTechServiceInstance: MellaTechService | null = null;

export async function getMellaTechService(): Promise<MellaTechService> {
  if (mellaTechServiceInstance) {
    return mellaTechServiceInstance;
  }

  // Try to get credentials from database first
  let username = '';
  let password = '';

  try {
    const { db } = await import('../db');
    const { systemSettings } = await import('@shared/schema');
    const { decrypt } = await import('../utils/encryption');

    const settings = await db.select().from(systemSettings).limit(1);
    
    if (settings.length > 0 && settings[0].mellatechUsername && settings[0].mellatechPassword) {
      // Decrypt credentials from database
      username = decrypt(settings[0].mellatechUsername);
      password = decrypt(settings[0].mellatechPassword);
      console.log('✅ Using MellaTech credentials from database');
    }
  } catch (error) {
    console.log('⚠️ Could not read MellaTech credentials from database, falling back to environment variables');
  }

  // Fall back to environment variables if not in database
  if (!username || !password) {
    username = process.env.MELLATECH_USERNAME || '';
    password = process.env.MELLATECH_PASSWORD || '';
    if (username && password) {
      console.log('✅ Using MellaTech credentials from environment variables');
    }
  }

  const config: MellaTechConfig = {
    baseUrl: 'https://mellatech.et',
    username,
    password,
  };

  if (!config.username || !config.password) {
    throw new Error('MellaTech credentials not configured. Please configure them in Admin Settings or set MELLATECH_USERNAME and MELLATECH_PASSWORD environment variables.');
  }

  mellaTechServiceInstance = new MellaTechService(config);

  return mellaTechServiceInstance;
}

export { MellaTechService, MellaTechVehicleData };
