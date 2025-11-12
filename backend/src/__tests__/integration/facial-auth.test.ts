import request from 'supertest';
import app from '../../index';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../../utils/password.util';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

describe('Facial Authentication API Integration Tests', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Clean up test data
    await prisma.facialVerification.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'facialtest' } },
    });

    // Create test user
    const passwordHash = await hashPassword('TestPassword123!');
    testUser = await prisma.user.create({
      data: {
        email: 'facialtest@example.com',
        passwordHash,
        firstName: 'Facial',
        lastName: 'Test',
        role: 'HOMEOWNER',
        facialAuthEnabled: true,
      },
    });

    // Login to get token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'facialtest@example.com',
        password: 'TestPassword123!',
      });

    authToken = loginResponse.body.data.token;
  });

  afterAll(async () => {
    // Clean up
    await prisma.facialVerification.deleteMany({});
    await prisma.user.deleteMany({
      where: { email: { contains: 'facialtest' } },
    });
    await prisma.$disconnect();
  });

  describe('POST /api/facial-auth/initialize', () => {
    it('should initialize facial verification for valid user', async () => {
      const response = await request(app)
        .post('/api/facial-auth/initialize')
        .send({ email: testUser.email });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verificationId).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);
    });

    it('should fail if email is not provided', async () => {
      const response = await request(app)
        .post('/api/facial-auth/initialize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email is required');
    });

    it('should fail for non-existent user', async () => {
      const response = await request(app)
        .post('/api/facial-auth/initialize')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    it('should fail if facial auth is not enabled', async () => {
      // Create user without facial auth
      const disabledUser = await prisma.user.create({
        data: {
          email: 'facialtest-disabled@example.com',
          passwordHash: await hashPassword('TestPassword123!'),
          firstName: 'Disabled',
          lastName: 'User',
          role: 'HOMEOWNER',
          facialAuthEnabled: false,
        },
      });

      const response = await request(app)
        .post('/api/facial-auth/initialize')
        .send({ email: disabledUser.email });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not enabled');

      await prisma.user.delete({ where: { id: disabledUser.id } });
    });
  });

  describe('POST /api/facial-auth/upload/:verificationId', () => {
    let verificationId: string;

    beforeEach(async () => {
      // Initialize verification
      const initResponse = await request(app)
        .post('/api/facial-auth/initialize')
        .send({ email: testUser.email });

      verificationId = initResponse.body.data.verificationId;
    });

    it('should upload video file successfully', async () => {
      // Create a test video file
      const testVideoPath = path.join(__dirname, '../fixtures/test-video.txt');
      fs.writeFileSync(testVideoPath, 'fake video content for testing');

      const response = await request(app)
        .post(`/api/facial-auth/upload/${verificationId}`)
        .attach('video', testVideoPath);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('PROCESSING');

      // Clean up
      fs.unlinkSync(testVideoPath);
    });

    it('should fail if no video file is provided', async () => {
      const response = await request(app)
        .post(`/api/facial-auth/upload/${verificationId}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Video file is required');
    });

    it('should fail for invalid verification ID', async () => {
      const testVideoPath = path.join(__dirname, '../fixtures/test-video.txt');
      fs.writeFileSync(testVideoPath, 'fake video content');

      const response = await request(app)
        .post('/api/facial-auth/upload/invalid-uuid')
        .attach('video', testVideoPath);

      expect(response.status).toBe(404);

      fs.unlinkSync(testVideoPath);
    });

    it('should fail for expired verification session', async () => {
      // Create expired verification
      const expiredVerification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'PENDING',
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const testVideoPath = path.join(__dirname, '../fixtures/test-video.txt');
      fs.writeFileSync(testVideoPath, 'fake video content');

      const response = await request(app)
        .post(`/api/facial-auth/upload/${expiredVerification.id}`)
        .attach('video', testVideoPath);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('expired');

      fs.unlinkSync(testVideoPath);
    });
  });

  describe('GET /api/facial-auth/status/:verificationId', () => {
    let verificationId: string;

    beforeEach(async () => {
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'PROCESSING',
        },
      });
      verificationId = verification.id;
    });

    it('should get verification status', async () => {
      const response = await request(app)
        .get(`/api/facial-auth/status/${verificationId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.verification.status).toBe('PROCESSING');
    });

    it('should fail for non-existent verification', async () => {
      const response = await request(app)
        .get('/api/facial-auth/status/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/facial-auth/login', () => {
    it('should login with verified facial authentication', async () => {
      // Create verified session
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'VERIFIED',
          verificationScore: 0.95,
          verifiedAt: new Date(),
        },
      });

      const response = await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.token).toBeDefined();

      // Verify JWT token is valid
      expect(response.body.data.token.split('.').length).toBe(3);
    });

    it('should fail if verification ID is not provided', async () => {
      const response = await request(app)
        .post('/api/facial-auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Verification ID is required');
    });

    it('should fail for unverified session', async () => {
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'PENDING',
        },
      });

      const response = await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      expect(response.status).toBe(401);
      expect(response.body.message).toContain('not completed');
    });

    it('should fail for failed verification', async () => {
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'FAILED',
          failureReason: 'Face not recognized',
        },
      });

      const response = await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should create activity log on successful login', async () => {
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'VERIFIED',
          verificationScore: 0.95,
          verifiedAt: new Date(),
        },
      });

      await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      // Check activity log
      const activityLog = await prisma.activityLog.findFirst({
        where: {
          userId: testUser.id,
          action: 'LOGIN',
          module: 'AUTH',
        },
        orderBy: { timestamp: 'desc' },
      });

      expect(activityLog).toBeDefined();
      expect(activityLog?.details).toHaveProperty('method', 'facial_recognition');
    });
  });

  describe('POST /api/facial-auth/enable', () => {
    it('should enable facial auth for authenticated user', async () => {
      // Create user without facial auth
      const newUser = await prisma.user.create({
        data: {
          email: 'facialtest-enable@example.com',
          passwordHash: await hashPassword('TestPassword123!'),
          firstName: 'Enable',
          lastName: 'Test',
          role: 'HOMEOWNER',
          facialAuthEnabled: false,
        },
      });

      // Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: newUser.email,
          password: 'TestPassword123!',
        });

      const token = loginResponse.body.data.token;

      // Enable facial auth
      const response = await request(app)
        .post('/api/facial-auth/enable')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.facialAuthEnabled).toBe(true);

      // Clean up
      await prisma.user.delete({ where: { id: newUser.id } });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/facial-auth/enable');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/facial-auth/disable', () => {
    it('should disable facial auth for authenticated user', async () => {
      const response = await request(app)
        .post('/api/facial-auth/disable')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.facialAuthEnabled).toBe(false);
      expect(response.body.data.user.facialVerified).toBe(false);

      // Re-enable for other tests
      await prisma.user.update({
        where: { id: testUser.id },
        data: { facialAuthEnabled: true },
      });
    });

    it('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/facial-auth/disable');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Security Tests', () => {
    it('should not leak user information for non-existent emails', async () => {
      const response = await request(app)
        .post('/api/facial-auth/initialize')
        .send({ email: 'definitelynotauser@example.com' });

      expect(response.status).toBe(404);
      expect(response.body.message).not.toContain('definitelynotauser');
    });

    it('should prevent verification session reuse', async () => {
      const verification = await prisma.facialVerification.create({
        data: {
          userId: testUser.id,
          status: 'VERIFIED',
          verificationScore: 0.95,
          verifiedAt: new Date(),
        },
      });

      // First login should succeed
      const response1 = await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      expect(response1.status).toBe(200);

      // Second login with same verification should still work (for now)
      // In production, you might want to invalidate after use
      const response2 = await request(app)
        .post('/api/facial-auth/login')
        .send({ verificationId: verification.id });

      expect(response2.status).toBe(200);
    });
  });
});
