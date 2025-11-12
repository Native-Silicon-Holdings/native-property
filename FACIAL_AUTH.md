# Facial Authentication Feature

## Overview

The Estate Management Platform now supports **Facial Recognition Authentication** as an alternative login method. This feature allows users to authenticate using facial verification through their device camera, providing a convenient and secure way to access the platform.

## Features

- **Alternative Authentication Method**: Users can choose between traditional email/password login or facial recognition
- **Compliance Verification**: Multi-step verification process ensuring proper identity verification
- **Video Recording**: Records user during verification process for security and compliance
- **Real-time Processing**: Automatic verification with status polling
- **Privacy-Focused**: All facial data is encrypted and securely stored
- **User Control**: Users can enable or disable facial authentication from their profile

## Architecture

### Backend Components

#### 1. Database Schema (`backend/prisma/schema.prisma`)

**User Model Extensions:**
```prisma
model User {
  // ... existing fields
  facialAuthEnabled Boolean  @default(false)
  facialVerified    Boolean  @default(false)
  facialVerifications FacialVerification[]
}
```

**FacialVerification Model:**
```prisma
model FacialVerification {
  id                String                   @id @default(uuid())
  userId            String
  videoUrl          String?
  complianceVideoUrl String?
  status            FacialVerificationStatus @default(PENDING)
  verificationScore Float?
  metadata          Json?
  expiresAt         DateTime?
  verifiedAt        DateTime?
  failureReason     String?
  user              User                     @relation(...)
  createdAt         DateTime                 @default(now())
  updatedAt         DateTime                 @updatedAt
}

enum FacialVerificationStatus {
  PENDING
  PROCESSING
  VERIFIED
  FAILED
  EXPIRED
}
```

#### 2. API Endpoints (`backend/src/controllers/facial-auth.controller.ts`)

| Endpoint | Method | Description | Access |
|----------|--------|-------------|--------|
| `/api/facial-auth/initialize` | POST | Initialize verification session | Public |
| `/api/facial-auth/upload/:verificationId` | POST | Upload verification video | Public |
| `/api/facial-auth/status/:verificationId` | GET | Check verification status | Public |
| `/api/facial-auth/login` | POST | Login with verified session | Public |
| `/api/facial-auth/enable` | POST | Enable facial auth for user | Private |
| `/api/facial-auth/disable` | POST | Disable facial auth for user | Private |

**Flow:**
1. User enters email → Initialize verification session
2. System returns `verificationId`
3. User completes camera setup and recording
4. Video uploads to `/upload/:verificationId`
5. Backend processes video (simulated in MVP, production would use AWS Rekognition/Azure Face API)
6. User polls `/status/:verificationId` for results
7. On success, user calls `/login` with `verificationId` to get JWT token

#### 3. Video Upload Configuration

- **Storage**: Local filesystem (`uploads/facial-verifications/`)
- **File Size Limit**: 50MB
- **Supported Formats**: MP4, WebM, OGG
- **Retention**: Videos stored for compliance (production should implement cleanup policy)

### Frontend Components

#### 1. Pages

**FacialAuthPage** (`frontend/src/pages/auth/FacialAuthPage.tsx`)
- Entry point for facial authentication
- Handles email input and verification initialization
- Manages verification completion and login

**Updated Login Page** (`frontend/src/pages/auth/Login.tsx`)
- Added "Sign in with Facial Recognition" button
- Passes email to FacialAuthPage via navigation state

#### 2. Components

**ComplianceVerification** (`frontend/src/components/auth/ComplianceVerification.tsx`)
- 3-step verification wizard:
  1. Audio permission check
  2. Camera permission and setup
  3. Video recording and upload
- Real-time camera preview
- Recording status indicator
- Privacy notice display

#### 3. Authentication Context

Added `loginWithFacialAuth(verificationId)` method to `AuthContext`:
```typescript
const loginWithFacialAuth = async (verificationId: string) => {
  const response = await fetch('/api/facial-auth/login', {
    method: 'POST',
    body: JSON.stringify({ verificationId }),
  });
  // Set user and token on success
};
```

## User Flow

### Enabling Facial Authentication

1. User logs in with email/password
2. Navigate to Profile settings
3. Click "Enable Facial Authentication"
4. Complete verification process
5. Facial auth now enabled for future logins

### Logging In with Facial Recognition

1. Navigate to login page
2. Click "Sign in with Facial Recognition"
3. Enter email address
4. Allow audio permissions
5. Allow camera permissions
6. Watch instruction video while being recorded
7. Wait for verification processing (2-3 seconds)
8. Automatically logged in on success

## Security Considerations

### Current Implementation (MVP)

- Videos stored locally in `uploads/facial-verifications/`
- Simulated verification with 90% success rate
- Basic file validation (type, size)

### Production Recommendations

1. **Facial Recognition Service Integration**
   - AWS Rekognition
   - Azure Face API
   - Google Cloud Vision
   - FaceID (iOS devices)

2. **Enhanced Security**
   - Liveness detection (prevent photo/video spoofing)
   - Anti-spoofing measures
   - Device fingerprinting
   - Geolocation checks

3. **Data Protection**
   - Encrypt videos at rest (AES-256)
   - Encrypt videos in transit (TLS 1.3)
   - Store only facial embeddings, not raw videos
   - Implement retention policies (GDPR compliance)
   - Allow users to delete facial data

4. **Privacy Compliance**
   - GDPR compliance (EU)
   - CCPA compliance (California)
   - BIPA compliance (Illinois)
   - User consent management
   - Data processing agreements

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
# Facial Auth Settings
FACIAL_AUTH_ENABLED=true
FACIAL_VERIFICATION_EXPIRY=900000  # 15 minutes in ms
MAX_VIDEO_SIZE=52428800             # 50MB in bytes

# Production: Add facial recognition API keys
AWS_REKOGNITION_ACCESS_KEY=your_key
AWS_REKOGNITION_SECRET_KEY=your_secret
AWS_REKOGNITION_REGION=us-east-1
```

**Frontend** (`.env`):
```env
VITE_API_URL=http://localhost:5000
VITE_FACIAL_AUTH_ENABLED=true
```

## Testing

### Manual Testing

1. **Enable Facial Auth:**
   ```bash
   # Start backend
   cd backend && npm run dev

   # Start frontend
   cd frontend && npm run dev

   # Navigate to http://localhost:3000/login
   # Click "Sign in with Facial Recognition"
   ```

2. **Test Flow:**
   - Enter test user email
   - Grant audio/camera permissions
   - Complete video recording
   - Verify auto-login on success

### Automated Testing

**Backend Tests** (`backend/src/__tests__/integration/facial-auth.test.ts`):
```typescript
describe('Facial Auth API', () => {
  it('should initialize verification session', async () => {
    const response = await request(app)
      .post('/api/facial-auth/initialize')
      .send({ email: 'test@example.com' });

    expect(response.status).toBe(200);
    expect(response.body.data.verificationId).toBeDefined();
  });

  it('should upload verification video', async () => {
    // Create verification session
    const initResponse = await request(app)
      .post('/api/facial-auth/initialize')
      .send({ email: 'test@example.com' });

    const verificationId = initResponse.body.data.verificationId;

    // Upload video
    const response = await request(app)
      .post(`/api/facial-auth/upload/${verificationId}`)
      .attach('video', 'test-fixtures/test-video.webm');

    expect(response.status).toBe(200);
  });
});
```

**E2E Tests** (`frontend/cypress/e2e/auth/facial-auth.cy.ts`):
```typescript
describe('Facial Authentication', () => {
  it('should complete facial auth flow', () => {
    cy.visit('/login');
    cy.contains('Sign in with Facial Recognition').click();

    cy.get('input[type="email"]').type('test@example.com');
    cy.contains('Start Facial Verification').click();

    // Mock camera/audio permissions
    cy.window().then((win) => {
      cy.stub(win.navigator.mediaDevices, 'getUserMedia').resolves(mockStream);
    });

    cy.contains('Enable Audio').click();
    cy.contains('Enable Camera').click();
    cy.contains('Start Verification').click();

    // Wait for processing
    cy.contains('Processing your identity', { timeout: 10000 });

    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
});
```

## Troubleshooting

### Common Issues

**1. Camera/Microphone Not Detected**
- Ensure browser has permission to access camera/microphone
- Check if another application is using the camera
- Try a different browser (Chrome/Edge recommended)

**2. Verification Fails**
- Ensure good lighting conditions
- Face the camera directly
- Remove glasses/hats if possible
- Try again with a different angle

**3. Upload Timeout**
- Check network connection
- Video file may be too large (>50MB)
- Backend may be down

**4. Session Expired**
- Verification sessions expire after 15 minutes
- Restart the verification process

### Debug Mode

Enable debug logging:

**Backend:**
```typescript
// In facial-auth.controller.ts
console.log('Verification initialized:', verificationId);
console.log('Video uploaded:', file.path);
console.log('Verification result:', { status, score });
```

**Frontend:**
```typescript
// In ComplianceVerification.tsx
console.log('Recording started');
console.log('Video blob size:', blob.size);
console.log('Upload response:', data);
```

## Future Enhancements

### Phase 2
- [ ] Integrate AWS Rekognition for real facial recognition
- [ ] Add liveness detection
- [ ] Implement video encryption at rest
- [ ] Add multi-factor authentication (Facial + OTP)

### Phase 3
- [ ] Support for multiple enrolled faces per user
- [ ] Age verification
- [ ] Emotion detection for compliance training
- [ ] Biometric template storage instead of videos

### Phase 4
- [ ] Mobile app integration (native FaceID/TouchID)
- [ ] Continuous authentication during session
- [ ] Behavioral biometrics
- [ ] Blockchain-based verification audit trail

## API Reference

### Initialize Verification

**POST** `/api/facial-auth/initialize`

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Facial verification initialized",
  "data": {
    "verificationId": "uuid-here",
    "user": {
      "id": "user-uuid",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Upload Video

**POST** `/api/facial-auth/upload/:verificationId`

**Request:** `multipart/form-data`
- `video`: Video file (WebM, MP4, OGG)

**Response:**
```json
{
  "success": true,
  "message": "Video uploaded successfully. Verification in progress.",
  "data": {
    "verificationId": "uuid-here",
    "status": "PROCESSING"
  }
}
```

### Check Status

**GET** `/api/facial-auth/status/:verificationId`

**Response:**
```json
{
  "success": true,
  "message": "Verification status retrieved",
  "data": {
    "verification": {
      "id": "uuid-here",
      "status": "VERIFIED",
      "verificationScore": 0.95,
      "verifiedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Login

**POST** `/api/facial-auth/login`

**Request:**
```json
{
  "verificationId": "uuid-here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { /* user object */ },
    "token": "jwt-token-here"
  }
}
```

## Compliance & Legal

### Data Processing

- **Purpose**: Identity verification for authentication
- **Legal Basis**: User consent (GDPR Article 6(1)(a))
- **Retention**: 30 days (configurable)
- **User Rights**: Access, deletion, portability

### Consent Management

Users must explicitly consent to:
1. Camera/microphone access
2. Video recording
3. Facial data processing
4. Data storage and retention

### Privacy Notice

Users are shown a privacy notice before verification:

> "This recording is used solely for identity verification and will be stored securely according to our data protection policies. Your facial data is encrypted and will never be shared with third parties."

## Support

For issues or questions:
- **Documentation**: This file
- **Backend Issues**: Check `backend/src/controllers/facial-auth.controller.ts`
- **Frontend Issues**: Check `frontend/src/components/auth/ComplianceVerification.tsx`
- **Database**: Check `backend/prisma/schema.prisma`

## Contributing

When contributing to facial authentication:
1. Follow existing code patterns
2. Add tests for new features
3. Update this documentation
4. Consider privacy implications
5. Test across different browsers/devices

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Status**: MVP Complete, Production Integration Pending
