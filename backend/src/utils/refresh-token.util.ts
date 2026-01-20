// Simple in-memory refresh token store
// In production, consider using Redis or database storage
interface RefreshTokenData {
  userId: string;
  expiresAt: Date;
}

const refreshTokens = new Map<string, RefreshTokenData>();

/**
 * Store refresh token
 */
export const storeRefreshToken = (token: string, userId: string, expiresInDays: number = 7): void => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiresInDays);
  
  refreshTokens.set(token, {
    userId,
    expiresAt
  });
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): string | null => {
  const tokenData = refreshTokens.get(token);
  
  if (!tokenData) {
    return null;
  }
  
  if (new Date() > tokenData.expiresAt) {
    refreshTokens.delete(token);
    return null;
  }
  
  return tokenData.userId;
};

/**
 * Revoke refresh token
 */
export const revokeRefreshToken = (token: string): void => {
  refreshTokens.delete(token);
};

/**
 * Revoke all refresh tokens for a user
 */
export const revokeAllUserTokens = (userId: string): void => {
  for (const [token, data] of refreshTokens.entries()) {
    if (data.userId === userId) {
      refreshTokens.delete(token);
    }
  }
};

/**
 * Clean up expired tokens (call periodically)
 */
export const cleanupExpiredTokens = (): void => {
  const now = new Date();
  for (const [token, data] of refreshTokens.entries()) {
    if (now > data.expiresAt) {
      refreshTokens.delete(token);
    }
  }
};





