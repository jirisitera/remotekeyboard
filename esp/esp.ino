#include <WiFi.h>
#include <PubSubClient.h>
#include <SoftwareSerial.h>
#include <mqtt.h>

char ssid[] = SSID;
char password[] = PASS;
char mqttUrl[] = MQTT_URL;
char mqttTopic[] = MQTT_TOPIC;
char mqttUser[] = MQTT_USER;
char mqttPass[] = MQTT_PASS;
int mqttPort = MQTT_PORT;

WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);
SoftwareSerial remoteKeyboard(4, 5);

void setup() {
  remoteKeyboard.begin(9600);
  connectWiFi();
  mqttClient.setServer(mqttUrl, mqttPort);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();
}
void connectWiFi() {
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }
}
void connectMQTT() {
  while (!mqttClient.connected()) {
    String clientId = "esp-client-" + String(WiFi.macAddress());
    if (mqttClient.connect(clientId.c_str(), mqttUser, mqttPass)) {
      mqttClient.subscribe(mqttTopic);
      mqttClient.publish(mqttTopic, "Remote Keyboard connected!");
    } else {
      delay(5000);
    }
  }
}
void mqttCallback(char *topic, byte *payload, unsigned int length) {
  for (unsigned int i = 0; i < length; i++) {
    remoteKeyboard.write((char) payload[i]);
  }
}
void loop() {
  if (!mqttClient.connected()) {
    connectMQTT();
  }
  mqttClient.loop();
}
