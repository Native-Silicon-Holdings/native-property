import { Request, Response } from 'express';
import prisma from '../services/prisma.service';
import { hashPassword, comparePassword, validatePasswordStrength } from '../utils/password.util';
import { generateToken } from '../utils/jwt.util';
import { sendSuccess, sendError, sendUnauthorized } from '../utils/response.util';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, firstName, lastName, phoneNumber, role, propertyId } = req.body;

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      sendError(res, passwordValidation.message || 'Invalid password', null, 400);
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      sendError(res, 'User with this email already exists', null, 409);
      return;
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        firstName,
        lastName,
        phoneNumber,
        role: role || 'HOMEOWNER',
        propertyId: propertyId || null
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_REGISTERED',
        module: 'AUTH',
        details: { email: user.email },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'User registered successfully', { user, token }, 201);
  } catch (error: any) {
    console.error('Registration error:', error);
    sendError(res, 'Failed to register user', error.message, 500);
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        property: true
      }
    });

    if (!user) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      sendUnauthorized(res, 'Account is deactivated. Please contact administrator.');
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      sendUnauthorized(res, 'Invalid email or password');
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        module: 'AUTH',
        details: { email: user.email },
        ipAddress: req.ip
      }
    });

    // Remove password hash from response
    const { passwordHash, ...userWithoutPassword } = user;

    sendSuccess(res, 'Login successful', { user: userWithoutPassword, token });
  } catch (error: any) {
    console.error('Login error:', error);
    sendError(res, 'Failed to login', error.message, 500);
  }
};

/**
 * Get current user profile
 */
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: {
        property: true
      }
    });

    if (!user) {
      sendError(res, 'User not found', null, 404);
      return;
    }

    sendSuccess(res, 'Profile retrieved successfully', user);
  } catch (error: any) {
    console.error('Get profile error:', error);
    sendError(res, 'Failed to get profile', error.message, 500);
  }
};

/**
 * Update user profile
 */
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }

    const { firstName, lastName, phoneNumber } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user.userId },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(phoneNumber && { phoneNumber })
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        emailVerified: true,
        createdAt: true
      }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PROFILE_UPDATED',
        module: 'AUTH',
        details: { updates: { firstName, lastName, phoneNumber } },
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Profile updated successfully', user);
  } catch (error: any) {
    console.error('Update profile error:', error);
    sendError(res, 'Failed to update profile', error.message, 500);
  }
};

/**
 * Change password
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'Not authenticated');
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // Validate new password strength
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      sendError(res, passwordValidation.message || 'Invalid password', null, 400);
      return;
    }

    // Get user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user) {
      sendError(res, 'User not found', null, 404);
      return;
    }

    // Verify current password
    const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);

    if (!isPasswordValid) {
      sendError(res, 'Current password is incorrect', null, 400);
      return;
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash }
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        action: 'PASSWORD_CHANGED',
        module: 'AUTH',
        ipAddress: req.ip
      }
    });

    sendSuccess(res, 'Password changed successfully');
  } catch (error: any) {
    console.error('Change password error:', error);
    sendError(res, 'Failed to change password', error.message, 500);
  }
};
