// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{error, info};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{
    AppHandle, CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu,
    SystemTrayMenuItem, WindowEvent,
};

mod commands;
mod state;

use commands::*;
use state::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ApiError {
    message: String,
    code: Option<String>,
}

impl From<reqwest::Error> for ApiError {
    fn from(err: reqwest::Error) -> Self {
        ApiError {
            message: err.to_string(),
            code: Some("NETWORK_ERROR".to_string()),
        }
    }
}

fn create_system_tray() -> SystemTray {
    let show = CustomMenuItem::new("show".to_string(), "Show Window");
    let hide = CustomMenuItem::new("hide".to_string(), "Hide Window");
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let separator = SystemTrayMenuItem::Separator;

    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_item(hide)
        .add_native_item(separator)
        .add_item(quit);

    SystemTray::new().with_menu(tray_menu)
}

fn handle_system_tray_event(app: &AppHandle, event: SystemTrayEvent) {
    match event {
        SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
            "show" => {
                if let Some(window) = app.get_window("main") {
                    window.show().unwrap();
                    window.set_focus().unwrap();
                }
            }
            "hide" => {
                if let Some(window) = app.get_window("main") {
                    window.hide().unwrap();
                }
            }
            "quit" => {
                std::process::exit(0);
            }
            _ => {}
        },
        SystemTrayEvent::DoubleClick { .. } => {
            if let Some(window) = app.get_window("main") {
                window.show().unwrap();
                window.set_focus().unwrap();
            }
        }
        _ => {}
    }
}

fn main() {
    env_logger::init();
    info!("Starting Estate Management Platform");

    let app_state = AppState::default();

    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(Mutex::new(app_state))
        .system_tray(create_system_tray())
        .on_system_tray_event(handle_system_tray_event)
        .on_window_event(|event| match event.event() {
            WindowEvent::CloseRequested { api, .. } => {
                event.window().hide().unwrap();
                api.prevent_close();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::greet,
            commands::get_app_version,
            commands::check_for_updates,
            commands::save_auth_token,
            commands::get_auth_token,
            commands::clear_auth_token,
            commands::save_user_preferences,
            commands::get_user_preferences,
            commands::show_notification,
            commands::open_external_url,
            commands::get_system_info,
            commands::log_event,
            commands::export_data_to_file,
            commands::import_data_from_file,
            commands::validate_backend_connection,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
