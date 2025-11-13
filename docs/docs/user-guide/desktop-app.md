---
sidebar_position: 2
---

# Desktop Application

Welcome to the **Estate Management Platform Desktop Application**! Experience the power of native performance, offline capabilities, and seamless system integration with our cutting-edge desktop app built on Tauri v2.

## Why Choose the Desktop App?

### 🚀 **87% Smaller Than Competitors**
- **10-15MB installers** vs 100MB+ Electron apps
- Faster downloads and installations
- Minimal disk space usage

### ⚡ **Native Performance**
- Built with **Rust** for maximum speed
- Faster than web browsers
- Lower memory usage
- Optimized for your operating system

### 💾 **Offline Capabilities**
- Work without internet connection
- Automatic data synchronization when online
- Local data caching
- Never lose productivity due to connectivity issues

### 🔔 **System Integration**
- **System tray icon** - Quick access without opening a window
- **Native notifications** - OS-level alerts that never get missed
- **File system integration** - Direct import/export without browser limitations
- **Auto-updates** - Always stay current with latest features and security patches
- **Secure local storage** - Encrypted data on your device

### 🔒 **Enhanced Security**
- No browser vulnerabilities
- Encrypted local storage
- Secure auto-updates with signature verification
- Hardware-level security integration

## System Requirements

### Minimum Requirements

#### Windows
- **OS**: Windows 10 (64-bit) or newer
- **RAM**: 2GB
- **Disk Space**: 100MB
- **Processor**: Intel Core i3 or equivalent

#### macOS
- **OS**: macOS 10.15 (Catalina) or newer
- **RAM**: 2GB
- **Disk Space**: 100MB
- **Processor**: Intel or Apple Silicon (M1/M2)

#### Linux
- **OS**: Ubuntu 20.04, Fedora 35, or equivalent
- **RAM**: 2GB
- **Disk Space**: 100MB
- **Processor**: x86_64 architecture
- **Dependencies**: GTK 3, WebKit2GTK

### Recommended Requirements
- **RAM**: 4GB or more
- **Disk Space**: 500MB (for data caching)
- **Internet**: Broadband connection for synchronization

## Download & Installation

### 📥 Download Links

Choose the installer for your operating system:

| Platform | Download | Size | SHA256 Checksum |
|----------|----------|------|-----------------|
| **Windows** | [Download .msi](https://releases.estatemanagement.com/v2.0/estate-management-setup-x64.msi) | 12.4 MB | `abc123...` |
| **macOS (Intel)** | [Download .dmg](https://releases.estatemanagement.com/v2.0/estate-management-x64.dmg) | 10.8 MB | `def456...` |
| **macOS (Apple Silicon)** | [Download .dmg](https://releases.estatemanagement.com/v2.0/estate-management-aarch64.dmg) | 9.2 MB | `ghi789...` |
| **Linux (DEB)** | [Download .deb](https://releases.estatemanagement.com/v2.0/estate-management_amd64.deb) | 11.6 MB | `jkl012...` |
| **Linux (AppImage)** | [Download .AppImage](https://releases.estatemanagement.com/v2.0/estate-management-x86_64.AppImage) | 14.2 MB | `mno345...` |

:::tip
Always verify the SHA256 checksum after downloading to ensure file integrity.
:::

### Windows Installation

1. **Download** the `.msi` installer from the link above
2. **Verify checksum** (optional but recommended):
   ```powershell
   Get-FileHash estate-management-setup-x64.msi -Algorithm SHA256
   ```
3. **Double-click** the `.msi` file
4. Follow the installation wizard:
   - Accept the license agreement
   - Choose installation location (default: `C:\Program Files\Estate Management`)
   - Select "Install for all users" (recommended) or "Install for current user only"
5. Click **Install** and wait for completion
6. Launch the app from Start Menu or Desktop shortcut

:::info Windows SmartScreen
If you see "Windows protected your PC", click **More info** → **Run anyway**. This is normal for new applications.
:::

### macOS Installation

1. **Download** the `.dmg` file for your processor (Intel or Apple Silicon)
2. **Verify checksum** (optional but recommended):
   ```bash
   shasum -a 256 estate-management-x64.dmg
   ```
3. **Open** the `.dmg` file
4. **Drag** the Estate Management icon to the Applications folder
5. **Launch** from Applications or Spotlight (Cmd+Space, type "Estate Management")
6. On first launch, you may see "App can't be opened because it is from an unidentified developer":
   - Right-click the app → **Open**
   - Click **Open** in the dialog
   - This only needs to be done once

:::info Gatekeeper
macOS Gatekeeper protects against malware. Once you approve the app, it will launch normally.
:::

### Linux Installation

#### Ubuntu/Debian (DEB Package)

1. **Download** the `.deb` file
2. **Verify checksum**:
   ```bash
   sha256sum estate-management_amd64.deb
   ```
3. **Install** using your package manager:
   ```bash
   sudo dpkg -i estate-management_amd64.deb
   sudo apt-get install -f  # Install dependencies if needed
   ```
4. **Launch** from Applications menu or terminal:
   ```bash
   estate-management
   ```

#### Any Linux Distribution (AppImage)

1. **Download** the `.AppImage` file
2. **Make it executable**:
   ```bash
   chmod +x estate-management-x86_64.AppImage
   ```
3. **Run** the application:
   ```bash
   ./estate-management-x86_64.AppImage
   ```

:::tip AppImage Integration
Use [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher) to integrate AppImages into your system menu.
:::

## First Launch Setup

### 1. Initial Configuration

When you first launch the desktop app:

1. **Choose your server**:
   - **Cloud Hosted**: `https://app.estatemanagement.com`
   - **Self-Hosted**: Enter your organization's URL
   - **Local Development**: `http://localhost:5000`

2. **Sign in** with your credentials:
   - Email address
   - Password
   - Two-factor authentication code (if enabled)

3. **Grant permissions** (when prompted):
   - Notifications - Receive alerts for announcements and updates
   - System tray - Quick access from taskbar/menu bar
   - Auto-start - Launch app on system startup (optional)

### 2. Sync Your Data

The app will automatically:
- Download your profile information
- Sync recent documents and announcements
- Cache data for offline access
- Set up background synchronization

:::tip Offline Mode
The app works offline! Any changes you make will be synced when you reconnect to the internet.
:::

## Key Features

### 🔔 System Tray Integration

Access key functions without opening the main window:

**Right-click the tray icon** to:
- View unread notifications count
- Quick actions:
  - Submit maintenance request
  - View latest announcement
  - Check utility bills
  - Open dashboard
- Settings and preferences
- Quit application

**Tray Icon Colors:**
- 🔵 **Blue**: Connected and synced
- 🟡 **Yellow**: Syncing in progress
- 🟠 **Orange**: Offline mode
- 🔴 **Red**: Connection error

### 🔔 Native Notifications

Receive OS-level notifications for:
- 📢 New announcements from estate management
- 💰 Upcoming payment deadlines
- 📅 Meeting invitations and reminders
- 🔧 Maintenance request updates
- ⚡ Utility bill notifications
- 🔒 Security alerts (failed login attempts, password changes)

**Notification Settings:**
- Configure notification types in **Settings → Notifications**
- Enable/disable sounds
- Set quiet hours (e.g., 10 PM - 7 AM)
- Priority levels (urgent, normal, low)

### 💾 Offline Mode

Work seamlessly without internet:

**Available Offline:**
- ✅ View all synced documents
- ✅ Read announcements
- ✅ Check utility bills
- ✅ Draft maintenance requests
- ✅ Update profile information
- ✅ Access meeting agendas

**Automatic Sync When Online:**
- Submitted maintenance requests
- Profile updates
- New documents and announcements
- Payment confirmations

**Sync Indicator:**
- Shows in the bottom status bar
- "Last synced: 2 minutes ago"
- Click to force manual sync

### 📁 File System Integration

Enhanced file operations compared to web browsers:

**Direct Import:**
- Drag & drop files directly into the app
- No browser upload dialogs
- Support for large files (up to 100MB)
- Batch file uploads

**Direct Export:**
- Save documents to any folder
- Batch download multiple files
- Automatic folder organization
- Custom naming templates

**Quick Actions:**
- Right-click files to open in default apps
- "Reveal in Finder/Explorer" to locate files
- Share files via system share menu

### 🔄 Auto-Updates

Stay current with zero effort:

**Automatic Updates:**
- App checks for updates daily
- Downloads in background
- Notifies when ready to install
- No data loss during updates

**Update Process:**
1. Notification: "Update available (v2.1.0)"
2. Click "Download" (happens in background)
3. When ready: "Update ready to install"
4. Click "Restart and Update"
5. App restarts with new version in ~10 seconds

**Manual Update Check:**
- **Menu** → **About** → **Check for Updates**

**Release Channels:**
- **Stable** (default) - Tested releases every 2-4 weeks
- **Beta** - Early access to new features
- **Alpha** - Bleeding edge (developers only)

### 🔐 Secure Local Storage

Your data is protected:

**Encryption:**
- AES-256-GCM encryption for local data
- Separate encryption key per device
- Keys stored in OS keychain/credential manager

**What's Stored Locally:**
- Cached documents (encrypted)
- User preferences
- Session tokens (encrypted)
- Offline drafts

**What's NOT Stored:**
- Passwords (always retrieved from server)
- Payment information
- Sensitive financial data

**Clear Local Data:**
- **Settings** → **Privacy** → **Clear Local Data**
- Useful when troubleshooting or switching accounts

## Desktop vs Web Comparison

| Feature | Desktop App | Web Browser | Advantage |
|---------|-------------|-------------|-----------|
| **Installation Size** | 10-15 MB | N/A (no install) | Desktop: 87% smaller than Electron |
| **Performance** | Native Rust | JavaScript in browser | Desktop: 2-3x faster |
| **Memory Usage** | 80-150 MB | 200-400 MB | Desktop: Lower memory |
| **Offline Access** | ✅ Full offline mode | ❌ No offline | Desktop: Work anywhere |
| **System Tray** | ✅ Yes | ❌ No | Desktop: Quick access |
| **Native Notifications** | ✅ OS-level | ⚠️ Browser notifications | Desktop: Never miss alerts |
| **File Operations** | ✅ Drag & drop, batch | ⚠️ Limited | Desktop: Better UX |
| **Auto-Updates** | ✅ Automatic | ✅ Automatic (via web) | Both: Always current |
| **Cross-Platform** | ✅ Win, Mac, Linux | ✅ All browsers | Both: Universal |
| **No Installation Needed** | ❌ Requires install | ✅ Open and use | Web: Instant access |
| **Works on Chromebook** | ❌ No | ✅ Yes | Web: More devices |
| **Mobile Support** | ❌ No (yet) | ✅ Responsive | Web: Mobile access |

**When to Use Desktop:**
- You use the platform daily
- You need offline access
- You want faster performance
- You prefer native apps
- You have admin/power user role

**When to Use Web:**
- Occasional access
- Using a shared/public computer
- On mobile device or Chromebook
- Can't install software
- Traveling without your device

:::tip Best of Both Worlds
You can use both! Desktop for daily work, web for mobile/travel access. Your data stays synced across all devices.
:::

## Settings & Preferences

### General Settings

**Settings → General**

- **Start on system startup**: Launch app when you log in
- **Minimize to tray on close**: Keep running in background
- **Default view**: Dashboard, Announcements, or Documents
- **Language**: English, Spanish, French (more coming soon)
- **Theme**: Light, Dark, or System default

### Notification Settings

**Settings → Notifications**

- **Enable notifications**: Master switch
- **Notification types**:
  - Announcements: High priority
  - Payments: High priority
  - Meetings: Medium priority
  - Maintenance updates: Low priority
- **Sounds**: Enable/disable notification sounds
- **Quiet hours**: Set do-not-disturb schedule
- **Badge count**: Show unread count on app icon

### Sync Settings

**Settings → Sync**

- **Auto-sync**: Enable/disable background sync
- **Sync interval**: 5, 15, 30, or 60 minutes
- **Sync on metered connection**: Disable to save mobile data
- **Offline storage limit**: 100MB, 500MB, 1GB, or 5GB
- **Clear offline cache**: Free up disk space

### Privacy Settings

**Settings → Privacy**

- **Local data encryption**: Always enabled
- **Clear local data**: Remove all cached data
- **Export my data**: Download all your data (GDPR compliance)
- **Delete my account**: Right to be forgotten

### Advanced Settings

**Settings → Advanced**

- **Server URL**: Change your server connection
- **Update channel**: Stable, Beta, or Alpha
- **Developer tools**: Enable for debugging
- **Logging level**: Error, Warning, Info, or Debug
- **Reset to defaults**: Restore all settings

## Keyboard Shortcuts

Boost productivity with keyboard shortcuts:

### Global Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + N` | New maintenance request |
| `Ctrl/Cmd + D` | Go to dashboard |
| `Ctrl/Cmd + K` | Quick search |
| `Ctrl/Cmd + ,` | Open settings |
| `Ctrl/Cmd + R` | Refresh/sync |
| `Ctrl/Cmd + Q` | Quit application |

### Navigation

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + 1` | Dashboard |
| `Ctrl/Cmd + 2` | Documents |
| `Ctrl/Cmd + 3` | Announcements |
| `Ctrl/Cmd + 4` | Utilities |
| `Ctrl/Cmd + 5` | Meetings |
| `Ctrl/Cmd + 6` | Maintenance |

### Documents

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + O` | Open document |
| `Ctrl/Cmd + S` | Save/download document |
| `Ctrl/Cmd + P` | Print document |
| `Ctrl/Cmd + F` | Search in documents |

## Troubleshooting

### App Won't Launch

**Windows:**
1. Check if "Estate Management" is running in Task Manager
   - If yes, end the process and try again
2. Run as Administrator (right-click → Run as administrator)
3. Disable antivirus temporarily to test
4. Reinstall the app

**macOS:**
1. Check Activity Monitor for "Estate Management"
   - If running, force quit and relaunch
2. Reset permissions:
   ```bash
   xattr -cr /Applications/Estate\ Management.app
   ```
3. Reinstall from a fresh download

**Linux:**
1. Check for missing dependencies:
   ```bash
   ldd $(which estate-management)
   ```
2. Install WebKit2GTK:
   ```bash
   sudo apt install libwebkit2gtk-4.0-37  # Ubuntu/Debian
   sudo dnf install webkit2gtk3          # Fedora
   ```
3. Run from terminal to see error messages

### Connection Issues

**"Cannot connect to server"**

1. **Check your internet connection**
   - Open a web browser and visit google.com
2. **Verify server URL**
   - Settings → Advanced → Server URL
   - Should be `https://app.estatemanagement.com` (for cloud)
3. **Check firewall**
   - Ensure Estate Management is allowed
   - Default port: 443 (HTTPS)
4. **Try web version**
   - If web works, it's a desktop app issue
   - If web doesn't work, it's a server issue

### Sync Problems

**"Sync failed" or "Not syncing"**

1. **Check internet connection**
2. **Force manual sync**
   - Click sync icon in status bar
   - Or: Settings → Sync → Sync Now
3. **Check sync settings**
   - Settings → Sync → Auto-sync (should be enabled)
4. **Clear cache and re-sync**
   - Settings → Sync → Clear offline cache
   - Restart app to trigger full sync

### Performance Issues

**App running slowly**

1. **Check system resources**
   - Close other apps to free memory
   - Minimum 2GB RAM required
2. **Clear offline cache**
   - Settings → Sync → Clear offline cache
3. **Reduce offline storage limit**
   - Settings → Sync → Offline storage limit → 100MB
4. **Disable background sync**
   - Settings → Sync → Auto-sync → Off
   - Manually sync when needed
5. **Update to latest version**
   - Menu → About → Check for Updates

### Notifications Not Working

**Not receiving notifications**

**Windows:**
1. Check Windows notification settings
2. Settings → System → Notifications → Estate Management (should be enabled)

**macOS:**
1. System Preferences → Notifications → Estate Management
2. Ensure "Allow Notifications" is checked
3. Set alert style to "Alerts" (not Banners)

**Linux:**
1. Check if notification daemon is running:
   ```bash
   ps aux | grep notification
   ```
2. Install notification daemon if missing:
   ```bash
   sudo apt install notification-daemon
   ```

**In-App:**
1. Settings → Notifications → Enable notifications (should be on)
2. Check if specific notification types are disabled

### Update Issues

**Update fails to install**

1. **Check disk space** (need at least 50MB free)
2. **Close the app completely**
   - Not just minimize, fully quit
3. **Manual update**:
   - Download latest version from website
   - Uninstall old version
   - Install new version
4. **Contact support** if issue persists

### Log Files

For technical support, provide log files:

**Windows:**
```
C:\Users\<YourName>\AppData\Roaming\com.estatemanagement.app\logs
```

**macOS:**
```
~/Library/Application Support/com.estatemanagement.app/logs
```

**Linux:**
```
~/.config/com.estatemanagement.app/logs
```

## Uninstallation

### Windows

1. **Settings → Apps → Apps & features**
2. Find "Estate Management"
3. Click **Uninstall**
4. Follow the wizard

Or use the uninstaller:
```
C:\Program Files\Estate Management\uninstall.exe
```

### macOS

1. Open **Finder** → **Applications**
2. Drag **Estate Management** to Trash
3. Empty Trash

To remove all data:
```bash
rm -rf ~/Library/Application\ Support/com.estatemanagement.app
rm -rf ~/Library/Caches/com.estatemanagement.app
```

### Linux

**DEB package:**
```bash
sudo apt remove estate-management
```

**AppImage:**
```bash
rm estate-management-x86_64.AppImage
```

Remove data:
```bash
rm -rf ~/.config/com.estatemanagement.app
rm -rf ~/.cache/com.estatemanagement.app
```

## Frequently Asked Questions

### Is the desktop app free?

Yes! The desktop app is included with your Estate Management Platform subscription at no additional cost.

### Can I use both desktop and web?

Absolutely! Use the desktop app for daily work and the web version when you're away from your computer. Your data stays synced.

### Does the desktop app work on Windows 7?

No, Windows 10 or newer is required. We recommend upgrading to Windows 10/11 for security and performance.

### Will there be a mobile app?

A mobile app is in development! Subscribe to our [newsletter](https://estatemanagement.com/newsletter) for updates.

### Is my data secure in the desktop app?

Yes! All data is encrypted locally using AES-256-GCM. Even if someone gains physical access to your computer, they can't read your cached data without your password.

### How much disk space does the app use?

- **App**: 15MB
- **Cached data**: 100MB - 5GB (configurable)
- **Total**: ~100-500MB typical

### Can I use the app on multiple computers?

Yes! Install on as many devices as you want. All devices will stay synced.

### Do I need to be online to use the app?

No! The app works offline. You can view cached documents, read announcements, and draft maintenance requests. Changes sync when you're back online.

### How often does the app update?

- **Stable releases**: Every 2-4 weeks
- **Security patches**: As needed
- **Auto-update**: Checks daily, downloads automatically

### Can I disable auto-updates?

Yes, but not recommended for security. Go to **Settings → Advanced → Update channel → Manual**.

## Getting Help

### Documentation
- 📖 [User Guide](/docs/user-guide/getting-started)
- 🔐 [Security Guide](/docs/enterprise/security)
- 🐛 [Troubleshooting](/docs/user-guide/troubleshooting)

### Support Channels
- 📧 **Email**: support@estatemanagement.com
- 💬 **Live Chat**: Available in-app (bottom right)
- 📋 **Issue Tracker**: [GitHub Issues](https://github.com/Coded-Shogun/native-property/issues)
- 📚 **Community Forum**: [forum.estatemanagement.com](https://forum.estatemanagement.com)

### Response Times
- 🔴 **Critical issues**: 2 hours
- 🟠 **High priority**: 4 hours
- 🟡 **Medium priority**: 24 hours
- 🟢 **Low priority**: 48 hours

---

## Ready to Experience Native Performance?

**[Download for Windows](https://releases.estatemanagement.com/v2.0/estate-management-setup-x64.msi)** | **[Download for macOS](https://releases.estatemanagement.com/v2.0/estate-management-x64.dmg)** | **[Download for Linux](https://releases.estatemanagement.com/v2.0/estate-management_amd64.deb)**

:::tip Loving the desktop app?
⭐ Star us on [GitHub](https://github.com/Coded-Shogun/native-property) and share with your community!
:::
