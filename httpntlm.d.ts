// Type declarations for httpntlm module
declare module 'httpntlm' {
  interface NTLMOptions {
    url: string;
    username: string;
    password: string;
    domain: string;
    workstation: string;
  }

  interface NTLMResponse {
    statusCode: number;
    statusMessage?: string;
    body: string;
  }

  type NTLMCallback = (err: any, result: NTLMResponse) => void;

  export function get(options: NTLMOptions, callback: NTLMCallback): void;
  export function post(options: NTLMOptions, callback: NTLMCallback): void;
}
