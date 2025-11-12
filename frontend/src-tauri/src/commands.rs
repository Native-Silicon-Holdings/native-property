use crate::state::{AppState, UserPreferences};
use crate::ApiError;
use log::{error, info};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::{AppHandle, Manager, State};

#[derive(Debug, Serialize, Deserialize)]
pub struct SystemInfo {
    pub platform: String,
    pub arch: String,
    pub version: String,
    pub os_version: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub available: bool,
    pub version: Option<String>,
    pub release_notes: Option<String>,
}

// Basic greeting command
#[tauri::command]
pub fn greet(name: &str) -> String {
    info!("Greeting user: {}", name);
    format!("Hello, {}! Welcome to Estate Management Platform.", name)
}

// Get application version
#[tauri::command]
pub fn get_app_version(app: AppHandle) -> Result<String, ApiError> {
    match app.package_info().version.to_string() {
        version => {
            info!("App version: {}", version);
            Ok(version)
        }
    }
}

// Check for updates
#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<UpdateInfo, ApiError> {
    info!("Checking for updates");

    // This is a placeholder - actual implementation would use tauri-plugin-updater
    // In production, this would check the update server
    Ok(UpdateInfo {
        available: false,
        version: None,
        release_notes: None,
    })
}

// Save authentication token securely
#[tauri::command]
pub fn save_auth_token(
    token: String,
    state: State<Mutex<AppState>>,
) -> Result<(), ApiError> {
    info!("Saving auth token");
    let mut app_state = state.lock().map_err(|e| ApiError {
        message: format!("Failed to acquire state lock: {}", e),
        code: Some("LOCK_ERROR".to_string()),
    })?;

    app_state.auth_token = Some(token);
    Ok(())
}

// Get authentication token
#[tauri::command]
pub fn get_auth_token(state: State<Mutex<AppState>>) -> Result<Option<String>, ApiError> {
    info!("Retrieving auth token");
    let app_state = state.lock().map_err(|e| ApiError {
        message: format!("Failed to acquire state lock: {}", e),
        code: Some("LOCK_ERROR".to_string()),
    })?;

    Ok(app_state.auth_token.clone())
}

// Clear authentication token
#[tauri::command]
pub fn clear_auth_token(state: State<Mutex<AppState>>) -> Result<(), ApiError> {
    info!("Clearing auth token");
    let mut app_state = state.lock().map_err(|e| ApiError {
        message: format!("Failed to acquire state lock: {}", e),
        code: Some("LOCK_ERROR".to_string()),
    })?;

    app_state.auth_token = None;
    Ok(())
}

// Save user preferences
#[tauri::command]
pub fn save_user_preferences(
    preferences: UserPreferences,
    state: State<Mutex<AppState>>,
) -> Result<(), ApiError> {
    info!("Saving user preferences: {:?}", preferences);
    let mut app_state = state.lock().map_err(|e| ApiError {
        message: format!("Failed to acquire state lock: {}", e),
        code: Some("LOCK_ERROR".to_string()),
    })?;

    app_state.preferences = preferences;
    Ok(())
}

// Get user preferences
#[tauri::command]
pub fn get_user_preferences(
    state: State<Mutex<AppState>>,
) -> Result<UserPreferences, ApiError> {
    info!("Retrieving user preferences");
    let app_state = state.lock().map_err(|e| ApiError {
        message: format!("Failed to acquire state lock: {}", e),
        code: Some("LOCK_ERROR".to_string()),
    })?;

    Ok(app_state.preferences.clone())
}

// Show native notification
#[tauri::command]
pub async fn show_notification(
    title: String,
    body: String,
    app: AppHandle,
) -> Result<(), ApiError> {
    info!("Showing notification: {}", title);

    use tauri_plugin_notification::NotificationExt;

    app.notification()
        .builder()
        .title(title)
        .body(body)
        .show()
        .map_err(|e| ApiError {
            message: format!("Failed to show notification: {}", e),
            code: Some("NOTIFICATION_ERROR".to_string()),
        })?;

    Ok(())
}

// Open external URL
#[tauri::command]
pub async fn open_external_url(url: String, app: AppHandle) -> Result<(), ApiError> {
    info!("Opening external URL: {}", url);

    use tauri_plugin_shell::ShellExt;

    app.shell()
        .open(&url, None)
        .map_err(|e| ApiError {
            message: format!("Failed to open URL: {}", e),
            code: Some("SHELL_ERROR".to_string()),
        })?;

    Ok(())
}

// Get system information
#[tauri::command]
pub fn get_system_info() -> Result<SystemInfo, ApiError> {
    info!("Getting system info");

    Ok(SystemInfo {
        platform: std::env::consts::OS.to_string(),
        arch: std::env::consts::ARCH.to_string(),
        version: env!("CARGO_PKG_VERSION").to_string(),
        os_version: get_os_version(),
    })
}

// Helper function to get OS version
fn get_os_version() -> String {
    #[cfg(target_os = "windows")]
    {
        "Windows".to_string()
    }
    #[cfg(target_os = "macos")]
    {
        "macOS".to_string()
    }
    #[cfg(target_os = "linux")]
    {
        "Linux".to_string()
    }
    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        "Unknown".to_string()
    }
}

// Log event for analytics/debugging
#[tauri::command]
pub fn log_event(event: String, data: Option<String>) -> Result<(), ApiError> {
    info!("Event logged: {} - {:?}", event, data);
    Ok(())
}

// Export data to file
#[tauri::command]
pub async fn export_data_to_file(
    data: String,
    filename: String,
    app: AppHandle,
) -> Result<String, ApiError> {
    use tauri_plugin_dialog::{DialogExt, FilePath};

    info!("Exporting data to file: {}", filename);

    // Show save dialog
    let file_path = app
        .dialog()
        .file()
        .set_file_name(&filename)
        .blocking_save_file();

    match file_path {
        Some(FilePath::Path(path)) => {
            use tauri_plugin_fs::FsExt;

            // Write data to file
            app.fs()
                .write(&path, data.as_bytes())
                .map_err(|e| ApiError {
                    message: format!("Failed to write file: {}", e),
                    code: Some("FILE_WRITE_ERROR".to_string()),
                })?;

            Ok(path.to_string_lossy().to_string())
        }
        Some(FilePath::Url(_)) => Err(ApiError {
            message: "URL paths not supported".to_string(),
            code: Some("UNSUPPORTED_PATH".to_string()),
        }),
        None => Err(ApiError {
            message: "No file selected".to_string(),
            code: Some("CANCELLED".to_string()),
        }),
    }
}

// Import data from file
#[tauri::command]
pub async fn import_data_from_file(app: AppHandle) -> Result<String, ApiError> {
    use tauri_plugin_dialog::{DialogExt, FilePath};

    info!("Importing data from file");

    // Show open dialog
    let file_path = app.dialog().file().blocking_pick_file();

    match file_path {
        Some(FilePath::Path(path)) => {
            use tauri_plugin_fs::FsExt;

            // Read data from file
            let data = app.fs().read(&path).map_err(|e| ApiError {
                message: format!("Failed to read file: {}", e),
                code: Some("FILE_READ_ERROR".to_string()),
            })?;

            let content = String::from_utf8(data).map_err(|e| ApiError {
                message: format!("Invalid UTF-8 data: {}", e),
                code: Some("ENCODING_ERROR".to_string()),
            })?;

            Ok(content)
        }
        Some(FilePath::Url(_)) => Err(ApiError {
            message: "URL paths not supported".to_string(),
            code: Some("UNSUPPORTED_PATH".to_string()),
        }),
        None => Err(ApiError {
            message: "No file selected".to_string(),
            code: Some("CANCELLED".to_string()),
        }),
    }
}

// Validate backend connection
#[tauri::command]
pub async fn validate_backend_connection(backend_url: String) -> Result<bool, ApiError> {
    info!("Validating backend connection: {}", backend_url);

    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
        .map_err(|e| ApiError {
            message: format!("Failed to create HTTP client: {}", e),
            code: Some("CLIENT_ERROR".to_string()),
        })?;

    match client.get(&format!("{}/health", backend_url)).send().await {
        Ok(response) => Ok(response.status().is_success()),
        Err(e) => {
            error!("Backend connection failed: {}", e);
            Ok(false)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_greet() {
        let result = greet("John");
        assert!(result.contains("John"));
        assert!(result.contains("Estate Management Platform"));
    }

    #[test]
    fn test_get_system_info() {
        let info = get_system_info().unwrap();
        assert!(!info.platform.is_empty());
        assert!(!info.arch.is_empty());
        assert!(!info.version.is_empty());
    }

    #[test]
    fn test_log_event() {
        let result = log_event("test_event".to_string(), Some("test_data".to_string()));
        assert!(result.is_ok());
    }
}
