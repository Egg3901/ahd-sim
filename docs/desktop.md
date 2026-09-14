# Desktop builds

## Current status

The Tauri 2 shell is buildable on Linux. A verified release build produced
`.deb`, `.rpm`, and `.AppImage` packages under
`src-tauri/target/release/bundle`. The app uses the same Vite frontend and
IndexedDB persistence as the browser edition.

The checked-in master icon is
`public/brand/margin-of-victory-icon.png`. Tauri-generated Linux, Windows,
macOS, Android, and iOS icon sizes live under `src-tauri/icons`.

## Build

Install JavaScript dependencies and the platform requirements from the
official Tauri 2 documentation, then run:

```text
npm install
npm run tauri:dev
npm run tauri:build
```

The normal desktop build uses Vite mode `desktop-direct`, which permits the
existing Lakeside checkout. A Steam build uses a separate safety mode:

```text
npm run tauri:steam:build
```

The Steam mode removes external Lakeside store links and checkout actions.
Steam ownership verification is not implemented, so the Steam build must not
be sold until that adapter is complete.

## Remaining release work

- Build and smoke-test Windows packages on Windows.
- Build, sign, and notarize macOS packages on macOS.
- Acquire signing identities before public direct downloads.
- Implement and test Steam ownership before a Steam release.
- Verify install, upgrade, uninstall, save retention, and offline startup on
  every supported desktop operating system.

Unsigned local packages are suitable for development, not a paid public
release.
