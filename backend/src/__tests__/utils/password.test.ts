import { hashPassword, comparePassword, validatePasswordStrength } from '../../utils/password.util';

describe('Password Utilities', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const result = await comparePassword(password, hash);

      expect(result).toBe(true);
    });

    it('should return false for non-matching password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const result = await comparePassword(wrongPassword, hash);

      expect(result).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should accept a strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');

      expect(result.valid).toBe(true);
    });

    it('should reject a password that is too short', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('at least 8 characters');
    });

    it('should reject a password without uppercase', () => {
      const result = validatePasswordStrength('lowercase123!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('uppercase');
    });

    it('should reject a password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE123!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('lowercase');
    });

    it('should reject a password without a number', () => {
      const result = validatePasswordStrength('NoNumbers!');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('number');
    });

    it('should reject a password without special character', () => {
      const result = validatePasswordStrength('NoSpecial123');

      expect(result.valid).toBe(false);
      expect(result.message).toContain('special character');
    });
  });
});
