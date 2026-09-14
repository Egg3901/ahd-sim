# Pricing and payments: open work

This is a note about what is NOT built yet, not a pricing recommendation.

## Current state

Commerce for this game today runs through the Lakeside Games platform (the
studio's own site/store/checkout, see the `lakeside_landing_v2` and
`lakeside_rebrand_2026_07_11` internal notes). That path has nothing to do
with Steam and does not carry over to a Steam release automatically.

## What a Steam release actually needs

A Steam build cannot use the existing Lakeside checkout. The base game is
free, and scenario packs are sold as Steam DLC:

- **Steamworks DLC entitlements**: the game needs to check pack ownership
  (via the Steamworks SDK, `ISteamUser`/`ISteamApps` or the `steamworks.js`/
  equivalent wrapper for a webview based app like this one) rather than any
  existing account or license system, so each purchased pack is recognized.
- **Steamworks integration in the Tauri shell**: since this is a Tauri
  desktop wrapper around a web app (see `docs/desktop.md`), the Steamworks
  SDK calls need to happen from the Rust side (or a Tauri plugin) and be
  exposed to the web frontend through Tauri's IPC, since the SDK itself is
  native, not something the webview can call directly.
- **Steam pricing setup**: the base app is free. DLC prices, regional pricing,
  the complete collection bundle, and discounts are configured in Steamworks.

None of the Steamworks DLC adapter exists yet. Do not sell Steam packs until
ownership and restoration have been tested against real Steam test DLC.
