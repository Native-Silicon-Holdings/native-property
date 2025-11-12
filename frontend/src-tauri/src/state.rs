use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserPreferences {
    pub theme: String,
    pub language: String,
    pub notifications_enabled: bool,
    pub auto_update: bool,
    pub start_minimized: bool,
}

impl Default for UserPreferences {
    fn default() -> Self {
        Self {
            theme: "light".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
            auto_update: true,
            start_minimized: false,
        }
    }
}

#[derive(Debug, Clone, Default)]
pub struct AppState {
    pub preferences: UserPreferences,
    pub auth_token: Option<String>,
    pub cache: HashMap<String, String>,
}

impl AppState {
    pub fn new() -> Self {
        Self::default()
    }
}
