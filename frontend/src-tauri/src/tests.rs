#[cfg(test)]
mod tests {
    use crate::commands::*;
    use crate::state::{AppState, UserPreferences};
    use std::sync::Mutex;
    use tauri::State;

    // Helper function to create a mock state
    fn create_mock_state() -> Mutex<AppState> {
        Mutex::new(AppState::default())
    }

    #[test]
    fn test_greet_with_name() {
        let result = greet("Alice");
        assert!(result.contains("Alice"));
        assert!(result.contains("Estate Management Platform"));
    }

    #[test]
    fn test_greet_with_empty_name() {
        let result = greet("");
        assert!(result.contains("Hello"));
    }

    #[test]
    fn test_greet_with_special_characters() {
        let result = greet("John-Doe_123");
        assert!(result.contains("John-Doe_123"));
    }

    #[test]
    fn test_save_and_get_auth_token() {
        let state = create_mock_state();
        let token = "test_token_12345".to_string();

        // Save token
        let save_result = save_auth_token(token.clone(), State::from(&state));
        assert!(save_result.is_ok());

        // Get token
        let get_result = get_auth_token(State::from(&state));
        assert!(get_result.is_ok());
        assert_eq!(get_result.unwrap(), Some(token));
    }

    #[test]
    fn test_clear_auth_token() {
        let state = create_mock_state();
        let token = "test_token_12345".to_string();

        // Save token
        save_auth_token(token, State::from(&state)).unwrap();

        // Clear token
        let clear_result = clear_auth_token(State::from(&state));
        assert!(clear_result.is_ok());

        // Verify token is cleared
        let get_result = get_auth_token(State::from(&state));
        assert!(get_result.is_ok());
        assert_eq!(get_result.unwrap(), None);
    }

    #[test]
    fn test_save_and_get_user_preferences() {
        let state = create_mock_state();
        let preferences = UserPreferences {
            theme: "dark".to_string(),
            language: "es".to_string(),
            notifications_enabled: false,
            auto_update: false,
            start_minimized: true,
        };

        // Save preferences
        let save_result = save_user_preferences(preferences.clone(), State::from(&state));
        assert!(save_result.is_ok());

        // Get preferences
        let get_result = get_user_preferences(State::from(&state));
        assert!(get_result.is_ok());
        let retrieved_prefs = get_result.unwrap();
        assert_eq!(retrieved_prefs.theme, "dark");
        assert_eq!(retrieved_prefs.language, "es");
        assert!(!retrieved_prefs.notifications_enabled);
        assert!(!retrieved_prefs.auto_update);
        assert!(retrieved_prefs.start_minimized);
    }

    #[test]
    fn test_get_system_info() {
        let result = get_system_info();
        assert!(result.is_ok());
        let info = result.unwrap();
        assert!(!info.platform.is_empty());
        assert!(!info.arch.is_empty());
        assert!(!info.version.is_empty());
        assert!(!info.os_version.is_empty());
    }

    #[test]
    fn test_log_event_without_data() {
        let result = log_event("test_event".to_string(), None);
        assert!(result.is_ok());
    }

    #[test]
    fn test_log_event_with_data() {
        let result = log_event(
            "user_action".to_string(),
            Some("clicked_button".to_string()),
        );
        assert!(result.is_ok());
    }

    #[test]
    fn test_default_user_preferences() {
        let prefs = UserPreferences::default();
        assert_eq!(prefs.theme, "light");
        assert_eq!(prefs.language, "en");
        assert!(prefs.notifications_enabled);
        assert!(prefs.auto_update);
        assert!(!prefs.start_minimized);
    }

    #[test]
    fn test_app_state_default() {
        let state = AppState::default();
        assert!(state.auth_token.is_none());
        assert_eq!(state.preferences.theme, "light");
        assert!(state.cache.is_empty());
    }

    #[test]
    fn test_app_state_new() {
        let state = AppState::new();
        assert!(state.auth_token.is_none());
        assert!(state.cache.is_empty());
    }

    #[test]
    fn test_multiple_token_operations() {
        let state = create_mock_state();

        // Save first token
        save_auth_token("token1".to_string(), State::from(&state)).unwrap();
        let result1 = get_auth_token(State::from(&state)).unwrap();
        assert_eq!(result1, Some("token1".to_string()));

        // Update token
        save_auth_token("token2".to_string(), State::from(&state)).unwrap();
        let result2 = get_auth_token(State::from(&state)).unwrap();
        assert_eq!(result2, Some("token2".to_string()));

        // Clear token
        clear_auth_token(State::from(&state)).unwrap();
        let result3 = get_auth_token(State::from(&state)).unwrap();
        assert_eq!(result3, None);
    }

    #[test]
    fn test_preferences_update() {
        let state = create_mock_state();

        // Save initial preferences
        let prefs1 = UserPreferences {
            theme: "light".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
            auto_update: true,
            start_minimized: false,
        };
        save_user_preferences(prefs1, State::from(&state)).unwrap();

        // Update preferences
        let prefs2 = UserPreferences {
            theme: "dark".to_string(),
            language: "fr".to_string(),
            notifications_enabled: false,
            auto_update: false,
            start_minimized: true,
        };
        save_user_preferences(prefs2, State::from(&state)).unwrap();

        // Verify updated preferences
        let result = get_user_preferences(State::from(&state)).unwrap();
        assert_eq!(result.theme, "dark");
        assert_eq!(result.language, "fr");
        assert!(!result.notifications_enabled);
        assert!(!result.auto_update);
        assert!(result.start_minimized);
    }

    #[test]
    fn test_concurrent_state_access() {
        use std::thread;

        let state = create_mock_state();
        let state_clone = &state;

        // Simulate concurrent access
        let handle1 = thread::spawn(move || {
            save_auth_token("token_thread1".to_string(), State::from(state_clone)).unwrap();
        });

        let handle2 = thread::spawn(move || {
            get_auth_token(State::from(state_clone)).unwrap();
        });

        handle1.join().unwrap();
        handle2.join().unwrap();
    }
}

#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_full_user_workflow() {
        let state = create_mock_state();

        // 1. User logs in - save token
        save_auth_token("user_session_token".to_string(), State::from(&state)).unwrap();

        // 2. User sets preferences
        let preferences = UserPreferences {
            theme: "dark".to_string(),
            language: "en".to_string(),
            notifications_enabled: true,
            auto_update: true,
            start_minimized: false,
        };
        save_user_preferences(preferences, State::from(&state)).unwrap();

        // 3. Verify user session is active
        let token = get_auth_token(State::from(&state)).unwrap();
        assert!(token.is_some());

        // 4. Verify preferences are saved
        let saved_prefs = get_user_preferences(State::from(&state)).unwrap();
        assert_eq!(saved_prefs.theme, "dark");

        // 5. User logs out - clear token
        clear_auth_token(State::from(&state)).unwrap();
        let token_after_logout = get_auth_token(State::from(&state)).unwrap();
        assert!(token_after_logout.is_none());
    }
}
