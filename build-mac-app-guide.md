# Building the Cloud Code Desktop App for macOS

This guide explains how to build the macOS version of your OpenCode / Cloud Code fork locally.

## Prerequisites

- **Bun**: Make sure you have the correct version of Bun installed, as specified in the `package.json` (`bun@1.3.10`).
- **Rust**: Ensure you have Rust installed and updated for Tauri (`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`).
- **Xcode Command Line Tools**: These are required for macOS builds. Run `xcode-select --install` in your terminal if you haven't already.

## Step 1: Pre-build the CLI/Backend Server
The desktop app relies on a pre-built CLI backend to function. This "sidecar" needs to be prepared before building the front-end Tauri app.

1. Open your terminal.
2. Navigate to the desktop package:
   ```bash
   cd packages/desktop
   ```
3. Run the prepare script, making sure to declare the **Apple Silicon (ARM64)** target.
   ```bash
   RUST_TARGET=aarch64-apple-darwin bun ./scripts/predev.ts
   ```
   *(Wait for this to finish successfully. It will copy the CLI binary into `src-tauri/sidecars/`)*.

## Step 2: Build the Tauri Desktop App
Now that the backend sidecar is securely in place, you are ready to build the actual frontend wrapper.

```bash
bun run tauri build
```

## Step 3: Locate Your Installer
If the build succeeds, Tauri will package your application into a beautifully bundled `.dmg` installer and an `.app` executable for macOS.

You can find them here:
- `packages/desktop/src-tauri/target/release/bundle/dmg/`
- `packages/desktop/src-tauri/target/release/bundle/macos/`

You can just double-click the `.dmg` or send it straight to your friend via Slack, Discord, or Google Drive!
