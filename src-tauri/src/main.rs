use enigo::Key;
use enigo::{Enigo, Keyboard, Settings};
use rdev::{listen, Event};
use std::sync::mpsc;
use std::thread;
use tauri::{AppHandle, Emitter, Manager};
#[tauri::command]
fn press_keys(key: &str) {
    let mut enigo = Enigo::new(&Settings::default()).unwrap();
    for c in key.chars() {
        enigo.key(Key::Unicode(c), enigo::Direction::Click).unwrap();
    }
}
fn callback(event: Event, app_handle: &AppHandle) {
    match event.name {
        Some(string) => {
            if let Err(e) = app_handle.emit("input", string) {
                eprintln!("Failed to emit: {}", e);
            }
        }
        None => (),
    }
}
fn main() {
    let (tx, rx) = mpsc::channel::<AppHandle>();
    // Start rdev thread before app initialization
    thread::spawn(move || {
        // Wait for the app handle to be sent
        if let Ok(app_handle) = rx.recv() {
            if let Err(error) = listen(move |event| {
                callback(event, &app_handle);
            }) {
                eprintln!("Error in rdev listener: {:?}", error);
            }
        }
    });
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .invoke_handler(tauri::generate_handler![press_keys])
        .setup(move |app| {
            // Send the app handle to the waiting thread
            let app_handle = app.app_handle().clone();
            if let Err(e) = tx.send(app_handle) {
                eprintln!("Failed to send app handle: {}", e);
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
