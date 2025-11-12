/**
 * TOTP (Time-based One-Time Password) Utility
 *
 * Implements RFC 6238 TOTP for two-factor authentication
 * Compatible with Google Authenticator, Authy, Microsoft Authenticator
 */

import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

export interface TOTPSecret {
  secret: string;      // Base32 encoded secret
  qrCode: string;      // Data URL for QR code image
  backupCodes: string[]; // Backup codes for recovery
  otpauthUrl: string;  // otpauth:// URL
}

export interface TOTPSetup {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
  manualEntryKey: string; // For manual entry in authenticator apps
}

/**
 * Generate TOTP secret for a user
 *
 * @param email - User's email address
 * @param issuer - Application name (default: Estate Management Platform)
 * @returns TOTP secret and QR code
 */
export async function generateTOTPSecret(
  email: string,
  issuer: string = 'Estate Management Platform'
): Promise<TOTPSetup> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `${issuer} (${email})`,
    issuer: issuer,
    length: 32, // 256-bit secret
  });

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes (8 codes, 10 characters each)
  const backupCodes = generateBackupCodes(8);

  return {
    secret: secret.base32,
    qrCodeDataUrl,
    backupCodes,
    manualEntryKey: formatSecretForDisplay(secret.base32),
  };
}

/**
 * Verify TOTP token
 *
 * @param token - 6-digit token from authenticator app
 * @param secret - Base32 encoded secret
 * @param window - Number of time windows to check (allows clock drift)
 * @returns true if token is valid
 */
export function verifyTOTPToken(
  token: string,
  secret: string,
  window: number = 2
): boolean {
  // Remove spaces and dashes from token
  const sanitizedToken = token.replace(/[\s-]/g, '');

  // Verify token format (6 digits)
  if (!/^\d{6}$/.test(sanitizedToken)) {
    return false;
  }

  try {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: sanitizedToken,
      window: window, // Allows ±window time steps (30 seconds each)
    });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

/**
 * Generate backup codes for account recovery
 *
 * @param count - Number of backup codes to generate
 * @returns Array of backup codes
 */
export function generateBackupCodes(count: number = 8): string[] {
  const codes: string[] = [];

  for (let i = 0; i < count; i++) {
    // Generate 10-character alphanumeric code
    const code = Array.from({ length: 10 }, () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude similar-looking characters
      return chars[Math.floor(Math.random() * chars.length)];
    }).join('');

    // Format as: XXXX-XXXX-XX
    const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
    codes.push(formatted);
  }

  return codes;
}

/**
 * Hash backup code for storage (one-way)
 */
export function hashBackupCode(code: string): string {
  const crypto = require('crypto');
  return crypto
    .createHash('sha256')
    .update(code.replace(/[-\s]/g, ''))
    .digest('hex');
}

/**
 * Verify backup code
 *
 * @param code - Backup code entered by user
 * @param hashedCodes - Array of hashed backup codes from database
 * @returns Index of matched code, or -1 if not found
 */
export function verifyBackupCode(code: string, hashedCodes: string[]): number {
  const hashedInput = hashBackupCode(code);

  return hashedCodes.findIndex(hashedCode => {
    try {
      const crypto = require('crypto');
      return crypto.timingSafeEqual(
        Buffer.from(hashedCode, 'hex'),
        Buffer.from(hashedInput, 'hex')
      );
    } catch {
      return false;
    }
  });
}

/**
 * Format secret for manual entry
 * Adds spaces every 4 characters for readability
 *
 * Example: JBSWY3DPEHPK3PXP -> JBSW Y3DP EHPK 3PXP
 */
export function formatSecretForDisplay(secret: string): string {
  return secret.match(/.{1,4}/g)?.join(' ') || secret;
}

/**
 * Get current TOTP token (for testing/debugging only)
 */
export function getCurrentToken(secret: string): string {
  return speakeasy.totp({
    secret: secret,
    encoding: 'base32',
  });
}

/**
 * Get time remaining until next token
 * @returns Seconds until next token
 */
export function getTimeRemaining(): number {
  const now = Math.floor(Date.now() / 1000);
  const step = 30; // TOTP time step in seconds
  return step - (now % step);
}

/**
 * Validate TOTP setup
 * Ensures user can successfully generate tokens before enabling 2FA
 *
 * @param secret - Base32 encoded secret
 * @param token - Token provided by user
 * @returns true if setup is valid
 */
export function validateTOTPSetup(secret: string, token: string): {
  valid: boolean;
  message: string;
} {
  // Verify token
  const isValid = verifyTOTPToken(token, secret, 1); // Strict window for setup

  if (!isValid) {
    return {
      valid: false,
      message: 'Invalid verification code. Please ensure your device time is synchronized and try again.',
    };
  }

  return {
    valid: true,
    message: 'Two-factor authentication successfully configured!',
  };
}

/**
 * Check if user should be prompted for 2FA
 *
 * @param twoFactorEnabled - Whether 2FA is enabled for the user
 * @param trustedDevice - Whether this is a trusted device
 * @param rememberMe - Whether user selected "remember this device"
 * @returns true if 2FA is required
 */
export function requiresTwoFactor(
  twoFactorEnabled: boolean,
  trustedDevice: boolean = false,
  rememberMe: boolean = false
): boolean {
  if (!twoFactorEnabled) return false;
  if (rememberMe && trustedDevice) return false;
  return true;
}

/**
 * Generate trusted device token
 * Used to remember devices for 30 days
 */
export function generateTrustedDeviceToken(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Rate limiting for TOTP verification
 * Prevents brute force attacks
 */
export class TOTPRateLimiter {
  private attempts: Map<string, { count: number; resetAt: number }> = new Map();
  private readonly maxAttempts: number = 5;
  private readonly windowMs: number = 15 * 60 * 1000; // 15 minutes

  /**
   * Check if user can attempt TOTP verification
   */
  canAttempt(userId: string): boolean {
    const record = this.attempts.get(userId);
    const now = Date.now();

    if (!record) return true;

    // Reset if window has passed
    if (now >= record.resetAt) {
      this.attempts.delete(userId);
      return true;
    }

    return record.count < this.maxAttempts;
  }

  /**
   * Record a failed attempt
   */
  recordAttempt(userId: string): void {
    const now = Date.now();
    const record = this.attempts.get(userId);

    if (!record || now >= record.resetAt) {
      this.attempts.set(userId, {
        count: 1,
        resetAt: now + this.windowMs,
      });
    } else {
      record.count++;
    }
  }

  /**
   * Reset attempts for a user (after successful verification)
   */
  reset(userId: string): void {
    this.attempts.delete(userId);
  }

  /**
   * Get remaining attempts
   */
  getRemainingAttempts(userId: string): number {
    const record = this.attempts.get(userId);
    if (!record || Date.now() >= record.resetAt) {
      return this.maxAttempts;
    }
    return Math.max(0, this.maxAttempts - record.count);
  }

  /**
   * Get lockout time remaining in seconds
   */
  getLockoutRemaining(userId: string): number {
    const record = this.attempts.get(userId);
    if (!record) return 0;

    const now = Date.now();
    if (now >= record.resetAt) return 0;

    return Math.ceil((record.resetAt - now) / 1000);
  }
}

// Export singleton instance
export const totpRateLimiter = new TOTPRateLimiter();

export default {
  generateTOTPSecret,
  verifyTOTPToken,
  generateBackupCodes,
  hashBackupCode,
  verifyBackupCode,
  formatSecretForDisplay,
  getCurrentToken,
  getTimeRemaining,
  validateTOTPSetup,
  requiresTwoFactor,
  generateTrustedDeviceToken,
  rateLimiter: totpRateLimiter,
};
