# Remote Keyboard

A virtual keyboard that is controlled through an MQTT connection.

There are two editions of this system included in this repository.

1. A modern desktop app made with Tauri.
2. Code for an Arduino and ESP board.

## App

The app connects to MQTT and listens for messages. When a message is received, the app will simulate a key press on the computer.

To try out a test version of the app, you will first need to install the following:

- WebView2 (usually already installed on Windows)
- Microsoft C++ Build Tools
- Rust (requires C++ Build Tools to be installed first)
- Node.js (pnpm is recommended)

You can find instructions on how to install all these components [in the Tauri documentation](https://v2.tauri.app/start/prerequisites/).

Finally, once you have everything installed, you can run the following commands to build the app:

```bash
pnpm install
```

```bash
pnpm tauri dev
```

## Boards

### ESP board

The ESP board connects to the MQTT server and listens for messages. When a message is received, it is sent over to the Arduino board over a software serial (SUART) on specific pins.

### Arduino board

The Arduino board registers itself as a keyboard on the computer it is connected to over USB. When it receives a message over the software serial, it simulates a key press on the computer.
