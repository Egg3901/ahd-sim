# Pricing and payments: open work

This is a note about what is NOT built yet, not a pricing recommendation.

## Current state

Commerce for this game today runs through the Lakeside Games platform (the
studio's own site/store/checkout, see the `lakeside_landing_v2` and
`lakeside_rebrand_2026_07_11` internal notes). That path has nothing to do
with Steam and does not carry over to a Steam release automatically.

## What a Steam release actually needs

A Steam build cannot use the existing Lakeside checkout for the Steam
version of the game. Steam requires its own payment path if the game is
sold through Steam:

- **Steamworks entitlements**: the game needs to check Steam ownership
  (via the Steamworks SDK, `ISteamUser`/`ISteamApps` or the `steamworks.js`/
  equivalent wrapper for a webview based app like this one) rather than any
  existing account or license system, so a Steam customer's purchase is
  recognized correctly.
- **In-app purchases, if any exist or are planned**: those would need to go
  through Steam's Microtransaction API rather than the Lakeside checkout,
  or the Steam build would need to disable/replace whatever purchase flow
  exists in the web version.
- **Steamworks integration in the Tauri shell**: since this is a Tauri
  desktop wrapper around a web app (see `docs/desktop.md`), the Steamworks
  SDK calls need to happen from the Rust side (or a Tauri plugin) and be
  exposed to the web frontend through Tauri's IPC, since the SDK itself is
  native, not something the webview can call directly.
- **Steam pricing setup**: base price, regional pricing, and any discount
  or bundle plans are configured in the Steamworks partner backend
  separately from anything in this repo, once a price is decided.

None of this exists in the codebase yet. This note exists so the pricing
question is not silently skipped: before a Steam listing goes live, someone
needs to decide the price and build the Steamworks entitlement check, and
neither of those is done.
