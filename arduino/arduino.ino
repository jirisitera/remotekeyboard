#include <Keyboard.h>
#include <SoftwareSerial.h>

SoftwareSerial remoteKeyboard(10, 11);
const int inputPin = 2;
const int outputPin = 13;

void setup() {
  remoteKeyboard.begin(9600);
  pinMode(inputPin, INPUT_PULLUP);
  pinMode(outputPin, OUTPUT);
  Keyboard.begin();
}
void loop() {
  if (digitalRead(inputPin) == LOW) {
    digitalWrite(outputPin, HIGH);
    if (remoteKeyboard.available() > 0) {
      Keyboard.write((char) remoteKeyboard.read());
    }
  }
  else {
    digitalWrite(outputPin, LOW);
  }
}
