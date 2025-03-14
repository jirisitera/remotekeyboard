# Remote Keyboard

A virtual keyboard that is controlled through an MQTT connection.

There are two editions of this system included in this repository.

1. An app made with Tauri.
2. Code for an Arduino and ESP board.

## App

The app connects to MQTT and listens for messages. When a message is received, the app will simulate a key press on the computer.

## Boards

### ESP board

The ESP board connects to the MQTT server and listens for messages. When a message is received, it is sent over to the Arduino board over a software serial (SUART) on specific pins.

### Arduino board

The Arduino board registers itself as a keyboard on the computer it is connected to over USB. When it receives a message over the software serial, it simulates a key press on the computer.
