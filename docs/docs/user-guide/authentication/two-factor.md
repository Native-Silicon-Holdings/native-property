---
sidebar_position: 3
---

# Two-Factor Authentication (2FA)

Add an extra layer of security to your account with Two-Factor Authentication (2FA)! Even if someone gets your password, they won't be able to access your account without your second factor.

## What is Two-Factor Authentication?

Two-Factor Authentication (also called 2FA or TOTP) requires two pieces of evidence to log in:
1. **Something you know** - Your password
2. **Something you have** - Your phone with an authenticator app

### Why Enable 2FA?

- 🔒 **Enhanced Security** - Protects against password theft and phishing
- 🛡️ **Industry Standard** - Used by banks, social media, and tech companies
- ✅ **Compliance Ready** - Required for many regulatory frameworks (SOC 2, ISO 27001)
- 📱 **Works Offline** - Codes generated on your device, no internet needed
- 🔐 **Privacy Focused** - No phone number required (unlike SMS 2FA)

### How It Works

1. Log in with your email and password
2. Open your authenticator app
3. Enter the 6-digit code shown in the app
4. Access granted! ✅

The code changes every 30 seconds, ensuring maximum security.

## Requirements

Before you start, you'll need:

- ✅ An active account on the platform
- ✅ A smartphone or tablet (iOS, Android, or other)
- ✅ An authenticator app installed (recommendations below)
- ✅ 5 minutes to complete setup

### Recommended Authenticator Apps

All of these apps are **free** and work with our platform:

| App | iOS | Android | Desktop | Features |
|-----|-----|---------|---------|----------|
| **Google Authenticator** | ✅ | ✅ | ❌ | Simple, reliable |
| **Microsoft Authenticator** | ✅ | ✅ | ❌ | Cloud backup, multi-device |
| **Authy** | ✅ | ✅ | ✅ | Cloud backup, desktop support |
| **1Password** | ✅ | ✅ | ✅ | Password manager + 2FA |
| **Bitwarden** | ✅ | ✅ | ✅ | Open source, password manager |

:::tip Our Recommendation
**Microsoft Authenticator** or **Authy** for cloud backup and multi-device support. If one device is lost, you can still access your codes from another device.
:::

## Enabling Two-Factor Authentication

### Step 1: Install an Authenticator App

If you don't have one already:

**iOS (iPhone/iPad)**:
1. Open the **App Store**
2. Search for "Microsoft Authenticator" or "Google Authenticator"
3. Tap **Get** → **Install**

**Android**:
1. Open the **Google Play Store**
2. Search for "Microsoft Authenticator" or "Google Authenticator"
3. Tap **Install**

### Step 2: Navigate to Security Settings

1. **Log in** to your Estate Management account
2. Click your **profile picture** in the top right corner
3. Select **"Profile Settings"**
4. Click the **"Security"** tab

### Step 3: Enable Two-Factor Authentication

1. Find the **"Two-Factor Authentication"** section
2. Click **"Enable 2FA"**
3. You may be asked to re-enter your password for security
4. Click **"Continue"**

### Step 4: Scan the QR Code

You'll see a screen with:
- A QR code
- A manual entry key (long string of letters)
- Backup codes (8 codes)

**To link your authenticator app:**

1. **Open your authenticator app** on your phone
2. Tap the **"+"** or **"Add account"** button
3. Select **"Scan QR code"**
4. **Point your camera** at the QR code on screen
5. The account will be added automatically!

**Can't scan the QR code?**

Use manual entry instead:
1. In your authenticator app, select **"Enter a setup key"**
2. **Account name**: Estate Management Platform
3. **Your email**: (your account email)
4. **Key**: (copy the key shown on screen)
5. **Time based**: Yes
6. Tap **"Add"**

### Step 5: Verify It Works

1. Your authenticator app will now show a **6-digit code**
2. The code changes every 30 seconds (watch the timer)
3. **Enter the current code** in the verification field
4. Click **"Verify and Enable"**

✅ Success! Two-Factor Authentication is now enabled.

### Step 6: Save Your Backup Codes

**CRITICAL**: Download and save your backup codes!

You'll see **8 backup codes** like this:
```
ABCD-EFGH-IJ
KLMN-OPQR-ST
UVWX-YZAB-CD
...
```

**What are backup codes?**
- Each code can be used **once** instead of your authenticator code
- Use them if you lose your phone or can't access your authenticator app
- Think of them as emergency access codes

**How to save them:**

1. Click **"Download Backup Codes"** - Saves as `.txt` file
2. **Print them** and store in a safe place (fireproof safe, safe deposit box)
3. **Store digitally** in your password manager (encrypted)
4. **Never share** them with anyone

:::danger Important
Store backup codes securely! If you lose your phone AND backup codes, you'll be locked out of your account and will need to contact support.
:::

### Step 7: Test Your Setup

Before closing the setup:

1. **Log out** of your account
2. **Log back in** with your email and password
3. When prompted, open your authenticator app
4. Enter the **6-digit code** shown
5. Click **"Verify"**

If successful, you're all set! 🎉

## Logging In with 2FA

### Standard Login Process

1. Navigate to the **login page**
2. Enter your **email address**
3. Enter your **password**
4. Click **"Sign In"**

### 2FA Verification

After entering your password, you'll see a **"Two-Factor Authentication"** screen:

1. **Open your authenticator app**
2. Find the **Estate Management Platform** entry
3. Note the **6-digit code** (e.g., `123 456`)
4. **Enter the code** in the verification field
5. (Optional) Check **"Trust this device for 30 days"**
6. Click **"Verify"**

✅ You're logged in!

### Trust This Device

Checking **"Trust this device for 30 days"** means:
- ✅ You won't need 2FA codes for 30 days on this device
- ✅ Convenient for your personal devices
- ❌ Don't use on shared or public computers
- 🔄 After 30 days, you'll need to verify again

**Trusted devices are stored securely** with encrypted tokens.

### Using a Backup Code

If you **lost your phone** or **can't access your authenticator app**:

1. On the 2FA verification screen, click **"Use a backup code"**
2. Enter **one of your 8 backup codes**
3. Click **"Verify"**

:::warning One-Time Use
Each backup code works **only once**. After using a code, it's invalidated. You'll have 7 remaining codes.
:::

**Lost all backup codes?**
- Contact your estate administrator
- Or email support@estatemanagement.com with proof of identity

## Managing Your 2FA Settings

### View Trusted Devices

**Settings → Security → Trusted Devices**

See all devices where you selected "Trust this device":
- Device name and browser
- Date trusted
- Last access date
- IP address

**Revoke a device:**
1. Click the **"X"** or **"Remove"** button
2. That device will need 2FA verification on next login

:::tip Security Best Practice
Review trusted devices monthly. Remove devices you no longer use or recognize.
:::

### Regenerate Backup Codes

If you've used several backup codes or lost them:

**Settings → Security → Two-Factor Authentication → Regenerate Backup Codes**

1. Click **"Regenerate Backup Codes"**
2. Confirm your password
3. **New 8 backup codes** will be generated
4. **Download and save** them immediately
5. Old backup codes are **invalidated**

:::danger Warning
Regenerating backup codes invalidates ALL old codes. Make sure to save the new ones!
:::

### Change Authenticator Device

Moving to a new phone? Here's how:

**Option 1: Transfer via Authenticator App**

Many apps support **cloud backup** or **account transfer**:

- **Google Authenticator**: Use "Transfer accounts" feature
- **Microsoft Authenticator**: Signs in with Microsoft account, auto-syncs
- **Authy**: Signs in with phone number, auto-syncs

**Option 2: Disable and Re-enable 2FA**

1. On your old phone, access your account
2. **Settings → Security → Two-Factor Authentication**
3. Click **"Disable 2FA"**
4. Confirm with your password and a 2FA code
5. On your new phone, **set up 2FA again** (scan new QR code)

**Option 3: Use Backup Code**

1. On new phone, install authenticator app
2. Try to log in to Estate Management
3. Use a backup code for verification
4. Once logged in, **disable and re-enable 2FA**
5. Scan new QR code with new phone

### Disabling Two-Factor Authentication

To turn off 2FA:

1. **Settings → Security → Two-Factor Authentication**
2. Click **"Disable Two-Factor Authentication"**
3. Enter your **password**
4. Enter a **6-digit 2FA code** or backup code
5. Click **"Disable"**

:::caution Security Risk
Disabling 2FA reduces your account security. Only disable if absolutely necessary.
:::

## Security Best Practices

### Do's ✅

- ✅ **Save backup codes** in a secure location
- ✅ **Use authenticator apps** (not SMS) for better security
- ✅ **Enable 2FA on all important accounts** (email, banking, social media)
- ✅ **Review trusted devices** regularly
- ✅ **Use apps with cloud backup** (Authy, Microsoft Authenticator)
- ✅ **Keep your phone secure** with a PIN/biometric lock
- ✅ **Enable 2FA even on your authenticator app** if it supports it

### Don'ts ❌

- ❌ **Don't share your 2FA codes** with anyone (not even support)
- ❌ **Don't take screenshots** of QR codes or backup codes
- ❌ **Don't store backup codes** in unsecured locations (notes app, email)
- ❌ **Don't use SMS 2FA** if authenticator app 2FA is available
- ❌ **Don't trust public/shared computers** for 30 days
- ❌ **Don't use the same password** across multiple accounts

### What If Someone Asks for Your 2FA Code?

🚨 **This is a SCAM!** 🚨

**Legitimate support will NEVER ask for:**
- Your password
- Your 2FA codes
- Your backup codes

If someone asks for these, **they are trying to hack your account**.

**What to do:**
1. **Do not provide** the code
2. **Report** to security@estatemanagement.com
3. **Change your password** immediately
4. **Review account activity** for suspicious logins

## Troubleshooting

### "Invalid verification code"

**Possible causes:**
- Code expired (they change every 30 seconds)
- Clock on your device is out of sync
- Wrong account selected in authenticator app
- Typo when entering code

**Solutions:**

1. **Wait for next code** - Codes change every 30 seconds. Try the new code.

2. **Check your device clock**:
   - **iOS**: Settings → General → Date & Time → "Set Automatically" (ON)
   - **Android**: Settings → System → Date & time → "Automatic date & time" (ON)

3. **Verify correct account**:
   - Open authenticator app
   - Confirm you're using "Estate Management Platform" entry
   - Check email matches your account

4. **Don't include spaces** when typing the code (some apps show spaces for readability)

### "Too many failed attempts"

For security, we limit 2FA attempts to **5 per 15 minutes**.

**If locked out:**
- Wait **15 minutes**
- Try again with the correct code
- Or use a **backup code** immediately

### "Lost my phone with authenticator app"

**Option 1: Use a backup code**
1. Click "Use a backup code" on the 2FA screen
2. Enter one of your saved backup codes
3. Log in successfully
4. **Immediately disable and re-enable 2FA** with your new device

**Option 2: Use cloud backup** (if you used Microsoft Authenticator or Authy)
1. Install the authenticator app on a new device
2. Sign in with your Microsoft account (MS Authenticator) or phone number (Authy)
3. Your 2FA codes will sync automatically
4. Use the code to log in

**Option 3: Contact support**
If you don't have backup codes or cloud backup:
1. Email support@estatemanagement.com
2. Subject: "2FA Account Recovery"
3. Provide proof of identity:
   - Account email
   - Recent documents you've accessed
   - Property/unit number
   - Answers to security questions (if set up)
4. Support will verify and help recover your account (24-48 hours)

### "Authenticator app deleted by accident"

**If you can still log in** (trusted device):
1. Log in to your account
2. **Settings → Security → Two-Factor Authentication**
3. Click **"Show QR Code"** or **"View Setup Key"**
4. Scan the QR code with your reinstalled authenticator app
5. Verify with a code to ensure it works

**If you can't log in**:
- Use a backup code to log in
- Then follow steps above to re-add to authenticator app

### "Backup codes not working"

**Possible causes:**
- Code already used (one-time use)
- Typo in the code
- Old codes (after regeneration)

**Solutions:**
1. **Check format**: `ABCD-EFGH-IJ` (10 characters with dashes)
2. **Try without dashes**: Some systems accept `ABCDEFGHIJ`
3. **Verify it's unused**: Check your saved codes and mark used ones
4. **Contact support** if all codes fail

### Codes are out of sync

**If codes never work despite correct entry:**

Your device clock may be severely out of sync.

**Fix:**
1. **Manually sync time**:
   - Open your authenticator app
   - Settings → Time correction
   - Sync now
2. **Or reset device time**:
   - Turn off automatic time
   - Set manually to current time
   - Turn automatic time back on
3. Try logging in again

### "Can't scan QR code"

**Camera issues:**
1. **Check browser permissions** - Allow camera access
2. **Try better lighting** - Point camera at screen
3. **Increase brightness** on both devices
4. **Clean camera lens**

**Alternative:**
Use **manual entry** instead:
1. Click "Can't scan? Enter code manually"
2. Copy the setup key
3. Add manually to authenticator app

## Frequently Asked Questions

### Q: Is 2FA required?

**A**: It depends on your role and estate policy:
- **Directors & Managers**: Often required (recommended for all)
- **Accountants**: Usually required (handles financial data)
- **Homeowners & Tenants**: Optional but strongly recommended

Check with your estate administrator for specific requirements.

### Q: Can I use SMS 2FA instead?

**A**: We use **TOTP (Time-based One-Time Password)** 2FA with authenticator apps, not SMS.

**Why not SMS?**
- ❌ SMS can be intercepted (SIM swapping attacks)
- ❌ Requires cell signal
- ❌ Privacy concerns (phone number exposed)
- ❌ Not compliant with some security standards

**Authenticator apps are:**
- ✅ More secure
- ✅ Work offline
- ✅ Industry standard
- ✅ Free

### Q: What if I have multiple accounts?

Each account needs **separate 2FA setup**:
- Add each account to your authenticator app
- Each will show as a separate entry
- Each generates unique codes

### Q: Does 2FA work on mobile/desktop app?

**Yes!** 2FA works across:
- ✅ Web browser (any device)
- ✅ Desktop app (Windows, macOS, Linux)
- ✅ Mobile web browser
- ✅ Future mobile apps (coming soon)

### Q: How secure is TOTP 2FA?

**Very secure!** TOTP 2FA:
- Uses **RFC 6238 standard** (industry standard)
- **256-bit secrets** for key generation
- **SHA-256 hashing** algorithm
- **30-second expiration** per code
- **±2 time steps** for clock drift tolerance

This is the same technology used by:
- Banks and financial institutions
- Google, Microsoft, Facebook
- Government services
- Healthcare systems

### Q: Can someone hack my authenticator app?

**Unlikely, but possible if:**
- Your phone is stolen AND unlocked
- Malware on your device
- Physical access to your device

**Protect yourself:**
- 🔒 **Lock your phone** with PIN/biometric
- 🛡️ **Keep OS updated** (security patches)
- 📱 **Don't jailbreak/root** your device
- 🔐 **Use reputable apps** only
- 💾 **Enable cloud backup** (with strong password)

### Q: What if my phone battery dies during login?

**Options:**
1. **Charge your phone** (5% charge is enough to open authenticator app)
2. **Use backup code** if you have them accessible
3. **Use another trusted device** (if within 30-day trust period)
4. **Ask someone to lend phone** with your authenticator app (if cloud backup enabled)

### Q: Do 2FA codes work offline?

**Yes!** TOTP codes are generated **locally on your device** using:
- The secret key (stored during setup)
- Your device's current time

**No internet needed** for code generation. Internet is only needed to verify the code with our servers.

### Q: Can I have 2FA on multiple devices?

**Yes!** Two approaches:

**Option 1: Cloud Backup (Recommended)**
- Use **Microsoft Authenticator** or **Authy**
- Sign in on multiple devices
- Codes sync automatically

**Option 2: Scan QR Code Multiple Times**
- During initial setup, scan the QR code with multiple devices
- Each device will generate identical codes
- **Don't close setup** until all devices are configured

### Q: How do I export/import 2FA to a new phone?

**Cloud Backup Apps** (easiest):
1. **Microsoft Authenticator**: Sign in with Microsoft account on new phone
2. **Authy**: Sign in with phone number on new phone
3. Codes sync automatically ✅

**Google Authenticator**:
1. Open on old phone → Menu → Transfer accounts → Export
2. Open on new phone → Menu → Transfer accounts → Import
3. Scan QR code shown on old phone

**Manual Method**:
1. Log in to Estate Management on computer
2. **Settings → Security → 2FA → Show QR Code**
3. Scan with new phone

## Advanced Topics

### Time Synchronization

TOTP codes depend on accurate time. How it works:

1. **Server time**: Our servers use NTP (Network Time Protocol)
2. **Your device time**: Should be auto-synced
3. **30-second windows**: Codes valid for 30 seconds
4. **Drift tolerance**: We accept ±60 seconds (2 steps) for clock differences

**If codes consistently fail**, your clock may be off by >60 seconds.

### Security Technical Details

For security professionals:

- **Algorithm**: TOTP (Time-based One-Time Password) per RFC 6238
- **Hash**: HMAC-SHA-256
- **Secret length**: 256 bits (32 bytes, 52 base32 characters)
- **Time step**: 30 seconds
- **Code length**: 6 digits
- **Drift tolerance**: ±2 steps (±60 seconds)
- **Rate limiting**: 5 attempts per 15 minutes per account
- **Backup codes**: SHA-256 hashed, 10 characters each (80 bits entropy)
- **Storage**: Secrets encrypted with AES-256-GCM
- **Trusted devices**: 30-day expiration, cryptographically secure tokens

### Compliance & Regulations

Our 2FA implementation meets:

- ✅ **NIST SP 800-63B** - Digital Identity Guidelines (AAL2)
- ✅ **PCI DSS 3.2** - Payment Card Industry Data Security Standard
- ✅ **GDPR** - General Data Protection Regulation
- ✅ **SOC 2** - System and Organization Controls
- ✅ **ISO 27001** - Information Security Management
- ✅ **HIPAA** - Health Insurance Portability and Accountability Act (if applicable)

### API Integration

Developers integrating with our API:

**Endpoints:**
- `POST /api/v1/auth/2fa/setup` - Initialize 2FA
- `POST /api/v1/auth/2fa/verify` - Verify TOTP code
- `POST /api/v1/auth/2fa/disable` - Disable 2FA
- `GET /api/v1/auth/2fa/backup-codes` - Get backup codes
- `POST /api/v1/auth/2fa/backup-codes/regenerate` - Regenerate backup codes

See [API Documentation](/docs/api/auth/two-factor) for details.

## Getting Help

### Documentation
- 📖 [Security Best Practices](/docs/enterprise/security)
- 🔐 [Facial Authentication](/docs/user-guide/authentication/facial-authentication)
- 🔑 [Password Management](/docs/user-guide/authentication/password-reset)
- 🐛 [Troubleshooting Guide](/docs/user-guide/troubleshooting)

### Support Channels
- 📧 **Email**: support@estatemanagement.com
- 🔒 **Security Team**: security@estatemanagement.com
- 💬 **Live Chat**: Available in-app (bottom right)
- 📋 **Issue Tracker**: [GitHub Issues](https://github.com/Coded-Shogun/native-property/issues)

### Emergency Access Recovery
- 📞 **24/7 Support**: +1-800-XXX-XXXX (enterprise customers)
- 📧 **Urgent Email**: urgent@estatemanagement.com
- ⏱️ **Response Time**: 2-4 hours for account lockouts

---

## Ready to Secure Your Account?

**[Enable Two-Factor Authentication Now →](#enabling-two-factor-authentication)**

:::tip Pro Tip
Set up 2FA during a quiet moment when you have 5-10 minutes. Have your phone, backup code storage (password manager), and printer ready.
:::

**Already enabled 2FA?** Great! Consider:
- ✅ [Adding Facial Recognition](/docs/user-guide/authentication/facial-authentication) for even faster login
- ✅ [Reviewing your trusted devices](#view-trusted-devices)
- ✅ [Testing your backup codes](#using-a-backup-code)

---

**Last updated**: November 2024 | **Version**: 2.0
