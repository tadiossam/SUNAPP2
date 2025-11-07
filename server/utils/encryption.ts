import crypto from 'crypto';

// Use environment variable or fallback to a default key (should be set in production)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'gelan-terminal-maintenance-encryption-key-32-chars!!';
const ALGORITHM = 'aes-256-cbc';

// Ensure key is exactly 32 bytes for AES-256
const getKey = () => {
  return crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
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
