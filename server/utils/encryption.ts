import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

// Get encryption key from environment variable
// For production deployment, user must set ENCRYPTION_KEY environment variable
// For development on Replit, a generated key is acceptable
const getEncryptionKey = (): string => {
  if (process.env.ENCRYPTION_KEY) {
    return process.env.ENCRYPTION_KEY;
  }
  
  // In development, generate a session-specific key
  // This means credentials saved in one session won't decrypt in another
  // but it's acceptable for development/testing
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ ENCRYPTION_KEY not set - using temporary development key');
    console.warn('⚠️ Credentials will need to be re-entered after server restart');
    return 'dev-temp-key-gelan-terminal-maintenance-' + process.pid;
  }
  
  // In production, fail fast if key is not set
  throw new Error('ENCRYPTION_KEY environment variable must be set in production');
};

// Ensure key is exactly 32 bytes for AES-256
const getKey = () => {
  const keyString = getEncryptionKey();
  return crypto.createHash('sha256').update(keyString).digest();
};

export function encrypt(text: string): string {
  if (!text) return '';
  
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  // Return IV + encrypted data (both in hex)
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return '';
    
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}
