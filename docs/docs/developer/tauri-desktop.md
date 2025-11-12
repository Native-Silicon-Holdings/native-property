---
sidebar_position: 3
---

# Tauri Desktop Application

The Estate Management Platform is available as a native desktop application built with Tauri v2. This provides enhanced performance, native system integration, and offline capabilities.

## Overview

Tauri transforms the React web application into a native desktop app with:

- **Native Performance**: Faster than web browsers with direct system access
- **Small Bundle Size**: ~10-15MB installers (vs 100MB+ with Electron)
- **System Integration**: Native menus, notifications, file system access
- **Security**: Sandboxed execution with granular permissions
- **Cross-Platform**: Windows, macOS, and Linux from a single codebase

## Architecture

### Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite 5.0 (build tool)
- Tauri API v2 (native bindings)

**Backend (Rust):**
- Tauri v2.0
- Tokio (async runtime)
- Reqwest (HTTP client)
- Serde (serialization)

### Key Components

```
frontend/
├── src/
│   ├── services/
│   │   └── tauri.service.ts    # Tauri API wrapper
│   └── hooks/
│       └── useTauri.ts          # React hooks for Tauri
└── src-tauri/
    ├── src/
    │   ├── main.rs              # Application entry
    │   ├── commands.rs          # Tauri commands
    │   ├── state.rs             # Application state
    │   ├── lib.rs               # Library exports
    │   └── tests.rs             # Rust tests
    ├── Cargo.toml               # Rust dependencies
    ├── tauri.conf.json          # Tauri configuration
    └── capabilities/
        └── main-capability.json # Security permissions
```

## Prerequisites

### System Requirements

**All Platforms:**
- Node.js 18 or higher
- Rust 1.70 or higher
- npm or yarn

**Linux:**
```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  patchelf \
  libssl-dev
```

**macOS:**
```bash
xcode-select --install
```

**Windows:**
- Visual Studio 2019 or newer with C++ development tools
- WebView2 (usually pre-installed on Windows 11)

### Install Rust

```bash
# Linux/macOS
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Windows
# Download from https://rustup.rs
```

## Development

### Setup

1. **Clone the repository:**
```bash
git clone <repository-url>
cd native-property
```

2. **Install dependencies:**
```bash
cd frontend
npm install
```

3. **Run in development mode:**
```bash
npm run tauri:dev
```

This starts:
- Vite dev server (http://localhost:3000)
- Tauri desktop window
- Hot reload for React changes
- Rust recompilation on changes

### Project Structure

**Frontend Service (`tauri.service.ts`):**
```typescript
import { invoke } from '@tauri-apps/api/core';

class TauriService {
  async saveAuthToken(token: string): Promise<void> {
    await invoke('save_auth_token', { token });
  }
}
```

**Rust Commands (`commands.rs`):**
```rust
#[tauri::command]
pub fn save_auth_token(
    token: String,
    state: State<Mutex<AppState>>,
) -> Result<(), ApiError> {
    let mut app_state = state.lock().unwrap();
    app_state.auth_token = Some(token);
    Ok(())
}
```

**React Integration:**
```typescript
import { useTauriContext } from '@/hooks/useTauri';

function MyComponent() {
  const isTauri = useTauriContext();

  if (isTauri) {
    // Use native features
  }
}
```

## Features

### 1. Native System Tray

The app runs in the system tray with quick actions:

- Show/Hide window
- Quick access menu
- Background operation
- Minimize to tray

**Implementation:**
```rust
// src-tauri/src/main.rs
fn create_system_tray() -> SystemTray {
    let show = CustomMenuItem::new("show", "Show Window");
    let hide = CustomMenuItem::new("hide", "Hide Window");
    let quit = CustomMenuItem::new("quit", "Quit");

    SystemTray::new().with_menu(
        SystemTrayMenu::new()
            .add_item(show)
            .add_item(hide)
            .add_item(quit)
    )
}
```

### 2. Native Notifications

Send desktop notifications:

```typescript
import tauriService from '@/services/tauri.service';

await tauriService.showNotification(
  'Task Complete',
  'Your maintenance request has been approved'
);
```

### 3. Secure Storage

Store sensitive data using Tauri Store:

```typescript
// Save data
await tauriService.storeSecureData('user_preferences', {
  theme: 'dark',
  notifications: true
});

// Retrieve data
const prefs = await tauriService.getSecureData('user_preferences');
```

**Data Location:**
- Windows: `%APPDATA%/com.estatemanagement.app/`
- macOS: `~/Library/Application Support/com.estatemanagement.app/`
- Linux: `~/.config/com.estatemanagement.app/`

### 4. File System Access

Export and import data:

```typescript
// Export data
const path = await tauriService.exportDataToFile(
  JSON.stringify(data),
  'export.json'
);

// Import data
const content = await tauriService.importDataFromFile();
```

### 5. Auto-Updates

Automatic update checking and installation:

```typescript
import { useAppUpdates } from '@/hooks/useTauri';

function UpdateChecker() {
  const { checkForUpdates, updateAvailable } = useAppUpdates();

  useEffect(() => {
    checkForUpdates();
  }, []);

  if (updateAvailable) {
    return <UpdateBanner />;
  }
}
```

### 6. Backend Connection Validation

Test API connectivity:

```typescript
const isConnected = await tauriService.validateBackendConnection(
  'http://localhost:5000'
);
```

## Building

### Development Build

```bash
npm run tauri:build:debug
```

Creates unoptimized builds with debugging symbols:
- **Linux**: `.deb`, `.appimage` in `src-tauri/target/debug/bundle/`
- **Windows**: `.exe`, `.msi` in `src-tauri/target/debug/bundle/`
- **macOS**: `.app`, `.dmg` in `src-tauri/target/debug/bundle/`

### Production Build

```bash
npm run tauri:build
```

Creates optimized, signed releases:
- Minified code
- Stripped debug symbols
- Code signing (if configured)
- Auto-update artifacts

**Build Configuration:**
```json
// tauri.conf.json
{
  "bundle": {
    "active": true,
    "targets": "all",
    "category": "Business",
    "icon": ["icons/32x32.png", "icons/icon.icns", "icons/icon.ico"],
    "createUpdaterArtifacts": true
  }
}
```

### Platform-Specific Builds

**Build only for current platform:**
```bash
npm run tauri build
```

**Cross-compilation:**
```bash
# Add target
rustup target add x86_64-pc-windows-gnu

# Build for specific target
cargo tauri build --target x86_64-pc-windows-gnu
```

## Testing

### Rust Unit Tests

```bash
cd frontend/src-tauri
cargo test
```

**Test Coverage:**
- Command handlers
- State management
- Error handling
- Concurrent access

**Example Test:**
```rust
#[test]
fn test_save_and_get_auth_token() {
    let state = create_mock_state();
    let token = "test_token_12345".to_string();

    save_auth_token(token.clone(), State::from(&state)).unwrap();
    let result = get_auth_token(State::from(&state)).unwrap();

    assert_eq!(result, Some(token));
}
```

### Frontend Service Tests

```bash
npm test -- src/__tests__/services/tauri.service.test.ts
```

### Integration Tests

```bash
npm run test:e2e
```

## Configuration

### Tauri Configuration

**`tauri.conf.json`:**
```json
{
  "productName": "Estate Management Platform",
  "version": "1.0.0",
  "identifier": "com.estatemanagement.app",
  "build": {
    "devUrl": "http://localhost:3000",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "title": "Estate Management Platform",
      "width": 1400,
      "height": 900,
      "minWidth": 1024,
      "minHeight": 768
    }],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:5000"
    }
  }
}
```

### Security Capabilities

**`capabilities/main-capability.json`:**
```json
{
  "identifier": "main-capability",
  "permissions": [
    "core:default",
    "store:default",
    "notification:default",
    "dialog:default",
    "fs:default",
    "shell:default",
    "updater:default"
  ]
}
```

### Environment Variables

Create `.env` in `frontend/`:

```bash
# API Configuration
VITE_API_URL=http://localhost:5000/api

# Tauri Configuration
TAURI_PLATFORM=linux
TAURI_DEBUG=0
```

## Deployment

### Code Signing

**macOS:**
```bash
# Set signing identity
export APPLE_CERTIFICATE="Developer ID Application: Your Name"
export APPLE_CERTIFICATE_PASSWORD="password"

# Build with signing
npm run tauri build
```

**Windows:**
```bash
# Set certificate
export WINDOWS_CERTIFICATE="path/to/cert.pfx"
export WINDOWS_CERTIFICATE_PASSWORD="password"

npm run tauri build
```

### Auto-Updates

**1. Configure update endpoint:**
```json
// tauri.conf.json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://releases.estatemanagement.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

**2. Generate update keys:**
```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

**3. Sign updates:**
```bash
npm run tauri signer sign target/release/bundle/msi/app.msi
```

**4. Implement update checker:**
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update?.available) {
  await update.downloadAndInstall();
  await relaunch();
}
```

### Distribution

**Linux:**
- `.deb` - Debian/Ubuntu packages
- `.appimage` - Universal Linux binary
- Publish to Snap Store or Flatpak

**Windows:**
- `.exe` - Standalone installer
- `.msi` - Windows Installer package
- Publish to Microsoft Store

**macOS:**
- `.dmg` - Disk image
- `.app` - Application bundle
- Publish to Mac App Store

## CI/CD

GitHub Actions workflow (`.github/workflows/tauri-ci.yml`):

```yaml
name: Tauri Desktop CI/CD

on:
  push:
    branches: [claude/dev-installable-*]

jobs:
  tauri-build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - uses: actions/setup-node@v4

      - name: Install system dependencies
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev

      - name: Build Tauri app
        run: npm run tauri:build
```

## Troubleshooting

### Common Issues

**1. Rust compilation errors:**
```bash
# Update Rust
rustup update

# Clean build cache
cargo clean
```

**2. WebKit errors (Linux):**
```bash
# Install missing dependencies
sudo apt-get install libwebkit2gtk-4.1-dev
```

**3. Window not showing:**
```typescript
// Check if window is hidden
const window = await getCurrentWindow();
await window.show();
```

**4. API connection issues:**
```typescript
// Validate backend connection
const connected = await tauriService.validateBackendConnection(
  import.meta.env.VITE_API_URL
);
```

### Debug Mode

Enable debug logging:

```bash
# Linux/macOS
RUST_LOG=debug npm run tauri:dev

# Windows (PowerShell)
$env:RUST_LOG="debug"
npm run tauri:dev
```

### Performance Profiling

```bash
# Build with profiling
cargo build --release --profile=profiling

# Run with profiling
cargo instruments -t time --release
```

## Best Practices

### 1. Graceful Degradation

Support both web and desktop:

```typescript
const isTauri = tauriService.isTauriContext();

if (isTauri) {
  // Use native storage
  await tauriService.storeSecureData('key', value);
} else {
  // Fallback to localStorage
  localStorage.setItem('key', JSON.stringify(value));
}
```

### 2. Error Handling

Always handle Tauri errors:

```typescript
try {
  await invoke('my_command');
} catch (error) {
  console.error('Tauri command failed:', error);
  // Show user-friendly message
}
```

### 3. Security

Follow security best practices:

- ✅ Use CSP policies
- ✅ Validate all user input
- ✅ Minimize permissions
- ✅ Use secure storage for sensitive data
- ✅ Keep dependencies updated

### 4. Performance

Optimize for performance:

- ✅ Use Rust for CPU-intensive tasks
- ✅ Minimize IPC calls
- ✅ Cache data appropriately
- ✅ Use async operations
- ✅ Profile and optimize hot paths

## Resources

- [Tauri Documentation](https://tauri.app/v2/guides/)
- [Tauri API Reference](https://tauri.app/v2/reference/js/)
- [Rust Book](https://doc.rust-lang.org/book/)
- [React + Tauri Guide](https://tauri.app/v2/guides/frontend/react/)

## Support

For issues and questions:
- GitHub Issues: `<repository-url>/issues`
- Tauri Discord: https://discord.gg/tauri
- Documentation: This guide
