import httpntlm from "httpntlm";

export interface D365Config {
  server: string;
  company: string;
  username: string;
  password: string;
  domain?: string;
}

export interface D365Response {
  success: boolean;
  data?: any;
  error?: string;
  statusCode?: number;
}

/**
 * Build D365 OData V4 endpoint URL
 */
function buildD365Url(config: D365Config, endpoint: string): string {
  const encodedCompany = encodeURIComponent(config.company);
  return `${config.server}/ODataV4/Company('${encodedCompany}')/${endpoint}`;
}

/**
 * Make NTLM authenticated request to D365 Business Central
 */
function makeNTLMRequest(url: string, config: D365Config): Promise<D365Response> {
  return new Promise((resolve) => {
    const options = {
      url,
      username: config.username,
      password: config.password,
      domain: config.domain || "",
      workstation: "",
    };

    httpntlm.get(options, (err: any, result: any) => {
      if (err) {
        resolve({
          success: false,
          error: err.message || "Unknown error occurred",
        });
        return;
      }

      if (result.statusCode === 200) {
        try {
          const data = JSON.parse(result.body);
          resolve({
            success: true,
            data,
            statusCode: result.statusCode,
          });
        } catch (parseError) {
          resolve({
            success: false,
            error: "Failed to parse response from D365",
            statusCode: result.statusCode,
          });
        }
      } else {
        resolve({
          success: false,
          error: `HTTP ${result.statusCode}: ${result.statusMessage || "Request failed"}`,
          statusCode: result.statusCode,
        });
      }
    });
  });
}

/**
 * Test connection to D365 Business Central
 */
export async function testD365Connection(config: D365Config): Promise<D365Response> {
  const url = buildD365Url(config, "customers?$top=1");
  return makeNTLMRequest(url, config);
}

/**
 * Fetch customers from D365 Business Central
 */
export async function fetchD365Customers(config: D365Config, top: number = 100): Promise<D365Response> {
  const url = buildD365Url(config, `customers?$top=${top}`);
  return makeNTLMRequest(url, config);
}

/**
 * Fetch items from D365 Business Central
 */
export async function fetchD365Items(config: D365Config, prefix?: string, top: number = 1000): Promise<D365Response> {
  let endpoint = `items?$top=${top}`;
  
  // Apply prefix filter if provided (URL-encode for safety)
  if (prefix) {
    const encodedPrefix = encodeURIComponent(prefix);
    endpoint += `&$filter=startswith(No,'${encodedPrefix}')`;
  }
  
  const url = buildD365Url(config, endpoint);
  return makeNTLMRequest(url, config);
}

/**
 * Fetch equipment (fixed assets) from D365 Business Central
 */
export async function fetchD365Equipment(config: D365Config, prefix?: string, top: number = 1000): Promise<D365Response> {
  let endpoint = `fixedAssets?$top=${top}`;
  
  // Apply prefix filter if provided (URL-encode for safety)
  if (prefix) {
    const encodedPrefix = encodeURIComponent(prefix);
    endpoint += `&$filter=startswith(No,'${encodedPrefix}')`;
  }
  
  const url = buildD365Url(config, endpoint);
  return makeNTLMRequest(url, config);
}
