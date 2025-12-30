/**
 * Field-Level Encryption Utility
 *
 * Provides AES-256-GCM encryption for sensitive data fields (PII)
 * Used for encrypting emails, phone numbers, and other sensitive information
 */

import crypto from 'crypto';
import { getSecurityConfig } from '../config/security.config';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
// const AUTH_TAG_LENGTH = 16; // 128 bits - not currently used
const SALT_LENGTH = 32; // 256 bits

/**
 * Derive encryption key from master key using PBKDF2
 */
function deriveKey(masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(masterKey, salt, 100000, 32, 'sha256');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 *
 * @param plaintext - The data to encrypt
 * @returns Encrypted string in format: salt:iv:authTag:ciphertext (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;

  try {
    const config = getSecurityConfig();
    const masterKey = config.encryptionKey;

    // Generate random salt and IV
    const salt = crypto.randomBytes(SALT_LENGTH);
    const iv = crypto.randomBytes(IV_LENGTH);

    // Derive key from master key
    const key = deriveKey(masterKey, salt);

    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    // Encrypt
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Return format: salt:iv:authTag:ciphertext
    return `${salt.toString('hex')}:${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data
 *
 * @param ciphertext - The encrypted string in format: salt:iv:authTag:ciphertext
 * @returns Decrypted plaintext
 */
export function decrypt(ciphertext: string): string {
  if (!ciphertext) return ciphertext;

  try {
    const config = getSecurityConfig();
    const masterKey = config.encryptionKey;

    // Parse encrypted data
    const parts = ciphertext.split(':');
    if (parts.length !== 4) {
      throw new Error('Invalid encrypted data format');
    }

    const salt = Buffer.from(parts[0], 'hex');
    const iv = Buffer.from(parts[1], 'hex');
    const authTag = Buffer.from(parts[2], 'hex');
    const encrypted = parts[3];

    // Derive key from master key
    const key = deriveKey(masterKey, salt);

    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Hash sensitive data for searching (one-way)
 * Used when you need to search encrypted fields
 *
 * @param data - Data to hash
 * @returns SHA-256 hash of the data
 */
export function hashForSearch(data: string): string {
  return crypto.createHash('sha256').update(data.toLowerCase().trim()).digest('hex');
}

/**
 * Encrypt email address
 * Stores both encrypted email and searchable hash
 */
export function encryptEmail(email: string): { encrypted: string; hash: string } {
  const normalized = email.toLowerCase().trim();
  return {
    encrypted: encrypt(normalized),
    hash: hashForSearch(normalized),
  };
}

/**
 * Encrypt phone number
 * Removes formatting before encryption
 */
export function encryptPhone(phone: string): { encrypted: string; hash: string } {
  // Remove all non-numeric characters
  const normalized = phone.replace(/\D/g, '');
  return {
    encrypted: encrypt(normalized),
    hash: hashForSearch(normalized),
  };
}

/**
 * Mask sensitive data for logging
 * Shows only first and last 2 characters
 */
export function maskSensitiveData(data: string, visibleChars: number = 2): string {
  if (!data || data.length <= visibleChars * 2) {
    return '*'.repeat(data?.length || 0);
  }

  const start = data.substring(0, visibleChars);
  const end = data.substring(data.length - visibleChars);
  const masked = '*'.repeat(Math.max(data.length - visibleChars * 2, 3));

  return `${start}${masked}${end}`;
}

/**
 * Mask email for display
 * Example: john.doe@example.com -> j***e@example.com
 */
export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@');
  if (!domain) return maskSensitiveData(email);

  const maskedLocal = localPart.length > 2
    ? `${localPart[0]}${'*'.repeat(Math.max(localPart.length - 2, 3))}${localPart[localPart.length - 1]}`
    : '*'.repeat(localPart.length);

  return `${maskedLocal}@${domain}`;
}

/**
 * Mask phone number for display
 * Example: +1234567890 -> +123***7890
 */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '*'.repeat(phone.length);

  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 4);
  const masked = '*'.repeat(Math.max(phone.length - 7, 3));

  return `${start}${masked}${end}`;
}

/**
 * Sanitize data for logging (removes sensitive information)
 */
export function sanitizeForLogging(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'creditCard',
    'ssn',
    'taxId',
  ];

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
      sanitized[key] = '[REDACTED]';
    } else if (key.toLowerCase().includes('email')) {
      sanitized[key] = typeof obj[key] === 'string' ? maskEmail(obj[key]) : obj[key];
    } else if (key.toLowerCase().includes('phone')) {
      sanitized[key] = typeof obj[key] === 'string' ? maskPhone(obj[key]) : obj[key];
    } else if (typeof obj[key] === 'object' && obj[key] !== null) {
      sanitized[key] = sanitizeForLogging(obj[key]);
    } else {
      sanitized[key] = obj[key];
    }
  }

  return sanitized;
}

/**
 * Verify data integrity using HMAC
 */
export function generateHMAC(data: string, secret?: string): string {
  const config = getSecurityConfig();
  const key = secret || config.encryptionKey;
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}

/**
 * Verify HMAC signature
 */
export function verifyHMAC(data: string, signature: string, secret?: string): boolean {
  const expectedSignature = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

/**
 * Generate secure random token
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(
      Buffer.from(a, 'utf8'),
      Buffer.from(b, 'utf8')
    );
  } catch {
    return false;
  }
}

export default {
  encrypt,
  decrypt,
  hashForSearch,
  encryptEmail,
  encryptPhone,
  maskSensitiveData,
  maskEmail,
  maskPhone,
  sanitizeForLogging,
  generateHMAC,
  verifyHMAC,
  generateSecureToken,
  timingSafeCompare,
};
