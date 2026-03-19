# My AI Stack Desktop App

Desktop application using Tauri/Electrobun for the AI Agent platform.

## Features

- **Native Performance** - Rust-powered backend with web frontend
- **System Tray** - Quick access from taskbar
- **Global Shortcuts** - Keyboard commands anywhere
- **Offline Support** - Local-first architecture
- **Auto-updates** - Seamless version updates

## Tech Stack

- **Tauri** / **Electrobun** - Desktop framework
- **Nuxt** - Web frontend (shared with web app)
- **Rust** - Native backend (Tauri)
- **TypeScript** - Frontend code

## Development

```bash
# Install dependencies
bun install

# Start desktop dev server
bun run desktop:dev

# Build desktop app
bun run desktop:build
```

## Building

### macOS
```bash
bun run build:desktop
# Output: src-tauri/target/release/bundle/dmg/*.dmg
```

### Windows
```bash
bun run build:desktop
# Output: src-tauri/target/release/bundle/msi/*.msi
```

### Linux
```bash
bun run build:desktop
# Output: src-tauri/target/release/bundle/appimage/*.AppImage
```
