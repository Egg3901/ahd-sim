// Entry point for the Electioneer desktop shell.
// Tauri v2 loads the built Vite output (frontendDist in tauri.conf.json)
// or the dev server (devUrl) and renders it in a native webview. There is
// no custom Rust logic yet: the game runs entirely against localStorage/
// IndexedDB in the webview, same as in a browser.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running Electioneer");
}
