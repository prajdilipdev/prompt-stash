//! Prompt Stash desktop shell.
//!
//! The desktop app reuses the exact same React frontend as the web build.
//! All data access goes straight from the webview to the configured Supabase
//! project over HTTPS; no secrets are embedded here — only the publishable
//! key is ever present, and Row Level Security enforces access server-side.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri::plugin::Builder::new("app").build())
        .run(tauri::generate_context!())
        .expect("error while running Prompt Stash");
}
