import request from 'supertest';
import app from '../../index';
import prisma from '../../services/prisma.service';
import { hashPassword } from '../../utils/password.util';

describe('Auth API Integration Tests', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'newuser@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'HOMEOWNER',
        isActive: true,
        emailVerified: false,
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('newuser@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject registration with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'weak',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should reject registration with existing email', async () => {
      const existingUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'existing@example.com',
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'StrongPass123!',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with correct credentials', async () => {
      const password = 'StrongPass123!';
      const passwordHash = await hashPassword(password);

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'HOMEOWNER',
        isActive: true,
        emailVerified: true,
        property: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: password,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('user@example.com');
      expect(response.body.data.token).toBeDefined();
    });

    it('should reject login with incorrect password', async () => {
      const password = 'StrongPass123!';
      const passwordHash = await hashPassword(password);

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        role: 'HOMEOWNER',
        isActive: true,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login for non-existent user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'StrongPass123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject login for inactive user', async () => {
      const password = 'StrongPass123!';
      const passwordHash = await hashPassword(password);

      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        passwordHash,
        isActive: false,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: password,
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('deactivated');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get profile for authenticated user', async () => {
      const mockUser = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'user@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'HOMEOWNER',
        isActive: true,
        emailVerified: true,
        property: null,
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      // First login to get token
      const passwordHash = await hashPassword('StrongPass123!');
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        ...mockUser,
        passwordHash,
      });
      (prisma.user.update as jest.Mock).mockResolvedValue(mockUser);
      (prisma.activityLog.create as jest.Mock).mockResolvedValue({});

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@example.com',
          password: 'StrongPass123!',
        });

      const token = loginResponse.body.data.token;

      // Now get profile
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('user@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app).get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});
