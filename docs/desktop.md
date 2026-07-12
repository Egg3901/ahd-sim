# Desktop build (Tauri)

## Status: scaffolded, not verified

This repo now has a `src-tauri/` directory with a Tauri v2 config, a
`Cargo.toml`, and a minimal `main.rs`. That is all that exists. Nobody has
run `tauri dev` or `tauri build` against this scaffold in this environment
(no Rust toolchain was installed, no binary was produced). Treat every
claim below about "it will work" as unverified until a human actually runs
it once and reports back.

What is verified:
- `npm run typecheck` and `npm run build` still pass with `src-tauri/`
  present and with `@tauri-apps/cli` added to `devDependencies`. TypeScript
  only picks up `src/` (see `tsconfig.json`'s `"include": ["src"]`), so the
  Rust project does not interfere with the web build.
- `package-lock.json` was regenerated with `@tauri-apps/cli` resolved, so
  `npm install` should pick it up without extra steps.

What is NOT verified:
- That the app actually launches in a webview.
- That the window opens at 1280x800 with the configured min size.
- That a release bundle actually builds on any platform.
- Icons: `tauri.conf.json` references `icons/32x32.png`, `icons/128x128.png`,
  `icons/128x128@2x.png`, `icons/icon.icns`, and `icons/icon.ico` under
  `src-tauri/icons/`. None of those files exist yet. `tauri build` will
  fail (or the CLI's `tauri icon` step needs to be run) until real icon
  assets are generated from source art.

## What a human needs to do to actually build this

### 1. Install the Rust toolchain
Tauri v2 apps are native Rust binaries with a webview shell. Install Rust
via [rustup](https://rustup.rs/):

```
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.org | sh
```

On Windows, install via the rustup-init.exe installer instead.

### 2. Install platform-specific dependencies

**Linux (Debian/Ubuntu):**
```
sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file \
  libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```
Package names vary by distro; consult the current Tauri v2 prerequisites
page since library names shift between releases (e.g. webkit2gtk 4.0 vs 4.1).

**macOS:**
Xcode Command Line Tools (`xcode-select --install`). No other system
packages are required. Building macOS bundles for distribution outside your
own machine additionally needs an Apple Developer account for code signing
and notarization.

**Windows:**
Microsoft C++ Build Tools (via Visual Studio Installer, "Desktop
development with C++" workload) plus WebView2, which ships with Windows 10
21H2+ and Windows 11 by default; older Windows 10 builds may need the
WebView2 runtime installed separately.

### 3. Generate real icons
Replace the placeholder icon paths in `src-tauri/tauri.conf.json` with real
artwork. From a single source PNG (ideally 1024x1024), the Tauri CLI can
generate the full icon set:
```
npx tauri icon path/to/source-icon.png
```
This writes the files into `src-tauri/icons/`. Until this is done, a
release build will fail on the icon step.

### 4. Install JS dependencies
```
npm install
```
This pulls in `@tauri-apps/cli`, already declared in `devDependencies`.
That install was not attempted end-to-end in the environment that produced
this scaffold beyond regenerating `package-lock.json` (which did succeed,
implying registry access works); a full `npm install` should be re-run and
watched for errors before relying on it.

### 5. Dev loop
```
npm run tauri:dev
```
This runs `tauri dev`, which starts the Vite dev server (`devUrl` in
`tauri.conf.json` points at `http://localhost:5173`) and opens it in a
native window.

### 6. Production build
```
npm run tauri:build
```
This runs `beforeBuildCommand` (`npm run build`, producing `dist/`) and
then compiles the Rust shell, embedding `dist/` per `frontendDist` in
`tauri.conf.json`. Output bundle locations (standard Tauri v2 layout,
under `src-tauri/target/release/bundle/`):
- Linux: `.deb`, `.rpm`, and/or AppImage under `bundle/deb`, `bundle/rpm`,
  `bundle/appimage`.
- macOS: `.app` and `.dmg` under `bundle/macos` and `bundle/dmg`.
- Windows: `.msi` and/or `.exe` (NSIS) under `bundle/msi` and `bundle/nsis`.

### 7. Signing (not set up)
No code signing identity, certificate, or notarization credentials are
configured anywhere in this repo. Unsigned builds will trigger OS warnings
(Gatekeeper on macOS, SmartScreen on Windows) and macOS builds cannot be
notarized without an Apple Developer account and a signing identity. This
is entirely open work, not started.

## Data and persistence
The game already runs against `localStorage`/IndexedDB in the browser (see
`src/persistence/local.ts`), which is why the desktop shell needs no custom
Rust storage code: the webview provides both APIs. No changes were made to
persistence code for this task.
