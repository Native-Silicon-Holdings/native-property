import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.activityLog.deleteMany();
  await prisma.facialVerification.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.meetingAttendance.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.utilityReading.deleteMany();
  await prisma.announcementRead.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.documentVersion.deleteMany();
  await prisma.document.deleteMany();
  await prisma.user.deleteMany();
  await prisma.property.deleteMany();
  await prisma.billingCycle.deleteMany();

  // Create Properties
  console.log('🏠 Creating properties...');
  const property1 = await prisma.property.create({
    data: {
      unitNumber: 'A101',
      address: '123 Main Street, Apartment A101',
      propertyType: 'APARTMENT',
      squareMeters: 75.5,
      occupants: 2,
    },
  });

  const property2 = await prisma.property.create({
    data: {
      unitNumber: 'A102',
      address: '123 Main Street, Apartment A102',
      propertyType: 'APARTMENT',
      squareMeters: 90.0,
      occupants: 3,
    },
  });

  const property3 = await prisma.property.create({
    data: {
      unitNumber: 'B201',
      address: '123 Main Street, Apartment B201',
      propertyType: 'APARTMENT',
      squareMeters: 110.0,
      occupants: 4,
    },
  });

  await prisma.property.create({
    data: {
      unitNumber: 'HOUSE-01',
      address: '456 Oak Avenue',
      propertyType: 'HOUSE',
      squareMeters: 200.0,
      occupants: 5,
    },
  });

  // Create Users
  console.log('👥 Creating users...');
  const director = await prisma.user.create({
    data: {
      email: 'director@estate.com',
      passwordHash: await hashPassword('Director123!'),
      firstName: 'John',
      lastName: 'Director',
      phoneNumber: '+1234567890',
      role: 'DIRECTOR',
      isActive: true,
      emailVerified: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@estate.com',
      passwordHash: await hashPassword('Manager123!'),
      firstName: 'Jane',
      lastName: 'Manager',
      phoneNumber: '+1234567891',
      role: 'MANAGER',
      isActive: true,
      emailVerified: true,
    },
  });

  const homeowner1 = await prisma.user.create({
    data: {
      email: 'homeowner1@estate.com',
      passwordHash: await hashPassword('Homeowner123!'),
      firstName: 'Alice',
      lastName: 'Homeowner',
      phoneNumber: '+1234567892',
      role: 'HOMEOWNER',
      isActive: true,
      emailVerified: true,
      propertyId: property1.id,
    },
  });

  const homeowner2 = await prisma.user.create({
    data: {
      email: 'homeowner2@estate.com',
      passwordHash: await hashPassword('Homeowner123!'),
      firstName: 'Bob',
      lastName: 'Resident',
      phoneNumber: '+1234567893',
      role: 'HOMEOWNER',
      isActive: true,
      emailVerified: true,
      propertyId: property2.id,
    },
  });

  await prisma.user.create({
    data: {
      email: 'tenant@estate.com',
      passwordHash: await hashPassword('Tenant123!'),
      firstName: 'Charlie',
      lastName: 'Tenant',
      phoneNumber: '+1234567894',
      role: 'TENANT',
      isActive: true,
      emailVerified: true,
      propertyId: property3.id,
    },
  });

  const accountant = await prisma.user.create({
    data: {
      email: 'accountant@estate.com',
      passwordHash: await hashPassword('Accountant123!'),
      firstName: 'David',
      lastName: 'Accountant',
      phoneNumber: '+1234567895',
      role: 'ACCOUNTANT',
      isActive: true,
      emailVerified: true,
    },
  });

  // Create Announcements
  console.log('📢 Creating announcements...');
  await prisma.announcement.create({
    data: {
      title: 'Welcome to the Estate Management Platform',
      content: 'We are excited to introduce our new digital platform for managing your estate. Please explore the features and let us know if you have any questions.',
      category: 'GENERAL',
      priority: 'MEDIUM',
      isPinned: true,
      requiresAcknowledgment: false,
      postedById: director.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Scheduled Maintenance - Elevator Service',
      content: 'The elevator will be under maintenance on Saturday, 9 AM - 12 PM. Please use the stairs during this time.',
      category: 'MAINTENANCE',
      priority: 'HIGH',
      isPinned: false,
      requiresAcknowledgment: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      postedById: manager.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: 'Monthly Financial Report Available',
      content: 'The monthly financial report for this month is now available in the Documents section.',
      category: 'FINANCIAL',
      priority: 'MEDIUM',
      isPinned: false,
      requiresAcknowledgment: false,
      postedById: accountant.id,
    },
  });

  // Create Documents
  console.log('📄 Creating documents...');
  await prisma.document.create({
    data: {
      title: 'Monthly Financial Report - January 2024',
      description: 'Complete financial report for January 2024',
      category: 'FINANCIAL_REPORTS',
      fileUrl: '/uploads/documents/financial-report-jan-2024.pdf',
      fileSize: 1024000,
      version: 1,
      tags: ['financial', 'report', 'january'],
      isArchived: false,
      approvalStatus: 'APPROVED',
      uploadedById: accountant.id,
    },
  });

  await prisma.document.create({
    data: {
      title: 'AGM Minutes - 2024',
      description: 'Annual General Meeting minutes for 2024',
      category: 'AGM_MINUTES',
      fileUrl: '/uploads/documents/agm-minutes-2024.pdf',
      fileSize: 512000,
      version: 1,
      tags: ['agm', 'minutes', '2024'],
      isArchived: false,
      approvalStatus: 'APPROVED',
      uploadedById: director.id,
    },
  });

  // Create Meetings
  console.log('📅 Creating meetings...');
  await prisma.meeting.create({
    data: {
      title: 'Board Meeting - February 2024',
      type: 'BOARD',
      description: 'Monthly board meeting to discuss estate matters',
      scheduledDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
      location: 'Community Hall',
      status: 'SCHEDULED',
      requiredQuorum: 5,
      createdById: director.id,
    },
  });

  await prisma.meeting.create({
    data: {
      title: 'Annual General Meeting 2024',
      type: 'AGM',
      description: 'Annual General Meeting for all residents',
      scheduledDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
      location: 'Main Auditorium',
      status: 'SCHEDULED',
      requiredQuorum: 20,
      createdById: director.id,
    },
  });

  // Create Maintenance Requests
  console.log('🔧 Creating maintenance requests...');
  await prisma.maintenanceRequest.create({
    data: {
      propertyId: property1.id,
      submittedById: homeowner1.id,
      category: 'PLUMBING',
      priority: 'HIGH',
      description: 'Leaking faucet in the kitchen. Water is dripping continuously.',
      photos: ['/uploads/photos/leak-1.jpg'],
      status: 'SUBMITTED',
    },
  });

  await prisma.maintenanceRequest.create({
    data: {
      propertyId: property2.id,
      submittedById: homeowner2.id,
      category: 'ELECTRICAL',
      priority: 'MEDIUM',
      description: 'Light switch in bedroom not working properly.',
      photos: [],
      status: 'IN_PROGRESS',
      assignedTo: 'Maintenance Team A',
    },
  });

  // Create Utility Readings
  console.log('⚡ Creating utility readings...');
  await prisma.utilityReading.create({
    data: {
      propertyId: property1.id,
      utilityType: 'WATER',
      readingDate: new Date(),
      meterReading: 1250.5,
      previousReading: 1200.0,
      consumption: 50.5,
      rate: 15.5,
      amount: 782.75,
      recordedById: accountant.id,
    },
  });

  await prisma.utilityReading.create({
    data: {
      propertyId: property1.id,
      utilityType: 'ELECTRICITY',
      readingDate: new Date(),
      meterReading: 3500.0,
      previousReading: 3400.0,
      consumption: 100.0,
      rate: 12.0,
      amount: 1200.0,
      recordedById: accountant.id,
    },
  });

  // Create Payments
  console.log('💰 Creating payments...');
  await prisma.payment.create({
    data: {
      propertyId: property1.id,
      amount: 2500.0,
      paymentDate: new Date(),
      paymentMethod: 'BANK_TRANSFER',
      reference: 'PAY-2024-001',
      allocatedTo: {
        water: 782.75,
        electricity: 1200.0,
        levy: 517.25,
      },
      status: 'CLEARED',
    },
  });

  // Create Activity Logs
  console.log('📝 Creating activity logs...');
  await prisma.activityLog.create({
    data: {
      userId: director.id,
      action: 'USER_LOGIN',
      module: 'AUTH',
      details: { email: director.email },
      ipAddress: '192.168.1.100',
    },
  });

  await prisma.activityLog.create({
    data: {
      userId: homeowner1.id,
      action: 'MAINTENANCE_REQUEST_CREATED',
      module: 'MAINTENANCE',
      details: { requestId: 'req-001' },
      ipAddress: '192.168.1.101',
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('');
  console.log('📋 Test Accounts:');
  console.log('  Director:   director@estate.com / Director123!');
  console.log('  Manager:    manager@estate.com / Manager123!');
  console.log('  Homeowner1: homeowner1@estate.com / Homeowner123!');
  console.log('  Homeowner2: homeowner2@estate.com / Homeowner123!');
  console.log('  Tenant:     tenant@estate.com / Tenant123!');
  console.log('  Accountant: accountant@estate.com / Accountant123!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });




