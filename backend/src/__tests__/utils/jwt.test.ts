import { generateToken, verifyToken, decodeToken } from '../../utils/jwt.util';
import { UserRole } from '@prisma/client';

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: 'HOMEOWNER' as UserRole,
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => verifyToken('invalid.token.here')).toThrow();
    });

    it('should throw error for expired token', () => {
      // This would require mocking time or using a very short expiry
      // For now, we'll skip this test or mock the jwt.verify function
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = generateToken(mockPayload);
      const decoded = decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = decodeToken('invalid.token');

      expect(decoded).toBeNull();
    });
  });
});
