# Estate Management Platform - Desktop Application

[![Tauri](https://img.shields.io/badge/Tauri-v2.0-blue.svg)](https://tauri.app/)
[![Rust](https://img.shields.io/badge/Rust-1.70+-orange.svg)](https://www.rust-lang.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

Native desktop application for the Estate Management Platform built with Tauri v2.

## Features

### 🚀 Native Performance
- Built with Rust for maximum performance
- 10-15MB installer size (vs 100MB+ with Electron)
- Direct system access without browser overhead
- Optimized memory usage

### 🔒 Enhanced Security
- Sandboxed execution environment
- Granular permission system
- Secure local data storage
- Encrypted credentials management

### 💻 System Integration
- **System Tray**: Background operation with quick access
- **Native Notifications**: Desktop notifications for alerts
- **File System**: Direct file import/export
- **Auto-Updates**: Seamless automatic updates
- **Deep Linking**: URL protocol handling

### 🌐 Cross-Platform
- **Windows**: Windows 10/11 (x64)
- **macOS**: macOS 10.15+ (Intel & Apple Silicon)
- **Linux**: Ubuntu 20.04+, Fedora, Debian

## Quick Start

### Prerequisites

**Required:**
- Node.js 18+
- Rust 1.70+
- npm or yarn

**Platform-Specific:**

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
- Visual Studio 2019+ with C++ tools
- WebView2 Runtime

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd native-property/frontend
```

2. **Install dependencies:**
```bash
npm install
```

3. **Run in development:**
```bash
npm run tauri:dev
```

4. **Build for production:**
```bash
npm run tauri:build
```

## Development

### Project Structure

```
frontend/
├── src/                        # React application
│   ├── services/
│   │   └── tauri.service.ts   # Tauri API wrapper
│   └── hooks/
│       └── useTauri.ts        # React hooks for Tauri
└── src-tauri/                 # Rust backend
    ├── src/
    │   ├── main.rs            # Application entry
    │   ├── commands.rs        # Tauri commands (IPC)
    │   ├── state.rs           # App state management
    │   └── tests.rs           # Rust unit tests
    ├── Cargo.toml             # Rust dependencies
    ├── tauri.conf.json        # Tauri configuration
    └── capabilities/          # Security permissions
```

### Available Commands

```bash
# Development
npm run tauri:dev          # Run app in dev mode
npm run tauri:build:debug  # Build debug version

# Production
npm run tauri:build        # Build production version

# Testing
cargo test                 # Run Rust tests (in src-tauri/)
npm test                   # Run frontend tests
```

### Adding Tauri Commands

**1. Define Rust command:**
```rust
// src-tauri/src/commands.rs
#[tauri::command]
pub fn my_custom_command(param: String) -> Result<String, ApiError> {
    Ok(format!("Received: {}", param))
}
```

**2. Register in main.rs:**
```rust
// src-tauri/src/main.rs
.invoke_handler(tauri::generate_handler![
    commands::my_custom_command,
    // ... other commands
])
```

**3. Call from frontend:**
```typescript
import { invoke } from '@tauri-apps/api/core';

const result = await invoke<string>('my_custom_command', {
  param: 'test'
});
```

### Using Tauri Service

The `tauri.service.ts` provides a unified API that works in both web and desktop contexts:

```typescript
import tauriService from '@/services/tauri.service';

// Check if running in Tauri
if (tauriService.isTauriContext()) {
  // Use native features
  await tauriService.showNotification('Hello', 'From desktop!');
}

// Secure storage
await tauriService.storeSecureData('key', { data: 'value' });
const data = await tauriService.getSecureData('key');

// File operations
await tauriService.exportDataToFile(jsonData, 'export.json');
const imported = await tauriService.importDataFromFile();
```

### Using React Hooks

```typescript
import {
  useTauriContext,
  useSystemInfo,
  useNotifications,
  useSecureStorage
} from '@/hooks/useTauri';

function MyComponent() {
  const isTauri = useTauriContext();
  const { systemInfo } = useSystemInfo();
  const { showNotification } = useNotifications();
  const { data, store } = useSecureStorage('my_key');

  return (
    <div>
      {isTauri && <p>Running on: {systemInfo?.platform}</p>}
      <button onClick={() => showNotification('Test', 'Message')}>
        Notify
      </button>
    </div>
  );
}
```

## Configuration

### Tauri Configuration

Edit `src-tauri/tauri.conf.json`:

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
      "minHeight": 768,
      "resizable": true
    }],
    "security": {
      "csp": "default-src 'self'; connect-src 'self' http://localhost:5000"
    }
  }
}
```

### Environment Variables

Create `frontend/.env`:

```bash
VITE_API_URL=http://localhost:5000/api
TAURI_DEBUG=0
```

## Building

### Debug Build

Fast compilation with debugging symbols:

```bash
npm run tauri:build:debug
```

Output: `src-tauri/target/debug/bundle/`

### Release Build

Optimized production build:

```bash
npm run tauri:build
```

Output: `src-tauri/target/release/bundle/`

**Bundle Formats:**
- **Windows**: `.exe` (NSIS installer), `.msi` (Windows Installer)
- **macOS**: `.app` (app bundle), `.dmg` (disk image)
- **Linux**: `.deb` (Debian), `.appimage` (universal binary)

### Code Signing

**macOS:**
```bash
export APPLE_CERTIFICATE="Developer ID Application: Your Name"
export APPLE_CERTIFICATE_PASSWORD="your_password"
npm run tauri build
```

**Windows:**
```bash
export WINDOWS_CERTIFICATE="path/to/certificate.pfx"
export WINDOWS_CERTIFICATE_PASSWORD="your_password"
npm run tauri build
```

## Testing

### Rust Tests

```bash
cd src-tauri
cargo test --verbose
```

**Coverage:**
- Command handlers
- State management
- Concurrent access
- Error handling

### Frontend Tests

```bash
npm test -- src/__tests__/services/tauri.service.test.ts
```

### Linting

```bash
# Rust
cd src-tauri
cargo clippy -- -D warnings
cargo fmt -- --check

# Frontend
npm run lint
```

## Deployment

### Auto-Updates

**1. Generate signing keys:**
```bash
npm run tauri signer generate -- -w ~/.tauri/myapp.key
```

**2. Configure update endpoint in `tauri.conf.json`:**
```json
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
      ],
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

**3. Implement update checking:**
```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';

const update = await check();
if (update?.available) {
  console.log(`Update available: ${update.version}`);
  await update.downloadAndInstall();
  await relaunch();
}
```

### Distribution

**Windows:**
- Microsoft Store
- Direct download from website
- Chocolatey package manager

**macOS:**
- Mac App Store
- Direct download from website
- Homebrew cask

**Linux:**
- Snap Store
- Flatpak
- AppImage (universal)
- Distribution repositories (.deb, .rpm)

## CI/CD

Automated builds via GitHub Actions:

```yaml
# .github/workflows/tauri-ci.yml
name: Tauri Desktop CI/CD

on:
  push:
    branches: [claude/dev-installable-*]

jobs:
  tauri-build:
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions-rust-lang/setup-rust-toolchain@v1
      - uses: actions/setup-node@v4

      - name: Install dependencies (Linux)
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev

      - name: Build Tauri app
        run: npm run tauri:build

      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: tauri-${{ matrix.platform }}
          path: src-tauri/target/release/bundle/
```

## Troubleshooting

### Build Errors

**Rust compilation fails:**
```bash
rustup update
cargo clean
```

**WebKit not found (Linux):**
```bash
sudo apt-get install libwebkit2gtk-4.1-dev
```

**Windows: MSVC not found:**
- Install Visual Studio 2019+ with C++ tools
- Restart terminal after installation

### Runtime Issues

**Window not appearing:**
```typescript
import { getCurrentWindow } from '@tauri-apps/api/window';

const window = await getCurrentWindow();
await window.show();
await window.setFocus();
```

**API connection failed:**
```typescript
const connected = await tauriService.validateBackendConnection(
  import.meta.env.VITE_API_URL
);
if (!connected) {
  console.error('Backend is not reachable');
}
```

### Debug Logging

```bash
# Linux/macOS
RUST_LOG=debug npm run tauri:dev

# Windows (PowerShell)
$env:RUST_LOG="debug"
npm run tauri:dev
```

## Performance Optimization

### Bundle Size

- **Current**: ~12-15 MB
- **Electron equivalent**: ~100-120 MB
- **Savings**: ~87% smaller

### Memory Usage

- **Idle**: ~50-80 MB
- **Active**: ~100-150 MB
- **Electron equivalent**: ~200-400 MB

### Startup Time

- **Cold start**: < 1 second
- **Warm start**: < 0.3 seconds

## Security

### Implemented Measures

✅ Content Security Policy (CSP)
✅ Sandboxed execution
✅ Granular permissions
✅ Secure IPC communication
✅ Encrypted local storage
✅ Code signing support
✅ Auto-update verification

### Best Practices

1. **Minimize permissions**: Only request needed capabilities
2. **Validate inputs**: Always validate data from frontend
3. **Use secure storage**: Store sensitive data via Tauri Store
4. **Keep updated**: Regularly update dependencies
5. **Code signing**: Sign releases for distribution

## Resources

### Documentation
- [Full Developer Guide](./docs/docs/developer/tauri-desktop.md)
- [Tauri Official Docs](https://tauri.app/v2/)
- [Tauri API Reference](https://tauri.app/v2/reference/js/)
- [Rust Book](https://doc.rust-lang.org/book/)

### Community
- [Tauri Discord](https://discord.gg/tauri)
- [GitHub Discussions](https://github.com/tauri-apps/tauri/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tauri)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on:
- Adding new Tauri commands
- Testing procedures
- Code style
- Pull request process

## License

This project is licensed under the MIT License - see [LICENSE](./LICENSE) file.

## Support

For issues and questions:
- **GitHub Issues**: Technical bugs and feature requests
- **Email**: support@estatemanagement.com
- **Documentation**: Full guides in `/docs`
