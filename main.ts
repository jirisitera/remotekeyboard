import mqtt from "mqtt"
import { invoke } from '@tauri-apps/api/core';
// get elements from document
const chatbox = document.getElementById("chatbox") as HTMLElement;
const sendButton = document.getElementById("sendButton") as HTMLButtonElement;
const connectButton = window.document.getElementById("connectButton") as HTMLInputElement;
const connectionStatus = window.document.getElementById("connectionStatus") as HTMLElement;
const textInput = document.getElementById("textInput") as HTMLInputElement;
const urlInput = window.document.getElementById("urlInput") as HTMLInputElement;
const portInput = window.document.getElementById("portInput") as HTMLInputElement;
const topicSendInput = window.document.getElementById("topicSendInput") as HTMLInputElement;
const topicReceiveInput = window.document.getElementById("topicReceiveInput") as HTMLInputElement;
// prepare variables
let url: string;
let port: string;
let topicSend: string[];
let topicReceive: string[];
let client: mqtt.MqttClient;
// add event listeners to buttons and inputs
connectButton.addEventListener("click", connect);
sendButton.addEventListener("click", send);
textInput.addEventListener("keyup", (event) => {
  if (event.key === "Enter") {
    send();
  }
});
// connect to mqtt broker
function connect() {
  if (connectButton.disabled) {
    return;
  }
  connectButton.disabled = true;
  if (!connectButton.checked) {
    client.end();
    connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Disconnected</span>';
    setTimeout(() => {
      connectButton.disabled = false;
    }, 500);
    return;
  }
  connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-orange-900 text-orange-300"><span class="w-2 h-2 me-1 bg-orange-500 rounded-full"></span>Connecting</span>';
  url = urlInput.value;
  port = portInput.value;
  topicSend = topicSendInput.value.split(",");
  topicReceive = topicReceiveInput.value.split(",");
  if (url == "") {
    url = "test.mosquitto.org";
  }
  if (port == "") {
    port = "8081";
  }
  if (topicSend.toString() == "") {
    topicSend = ["iotcraft/send"];
  }
  if (topicReceive.toString() == "") {
    topicReceive = ["iotcraft/receive"];
  }
  client = mqtt.connect("wss://" + url + ":" + port + "/mqtt");
  client.stream.on('error', () => {
    connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Failed</span>';
    connectButton.checked = false;
    setTimeout(() => {
      connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Disconnected</span>';
      connectButton.disabled = false;
    }, 2000);
  });
  client.on("connect", () => {
    connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-green-900 text-green-300"><span class="w-2 h-2 me-1 bg-green-500 rounded-full"></span>Connected</span>';
    client.subscribe(topicReceive);
    setTimeout(() => {
      connectButton.disabled = false;
    }, 500);
  });
  client.on("message", (_topic, message) => {
    receive(message.toString());
  });
}
// handle received messages
function receive(message: string) {
  // add message to chatbox
  const messageElement = document.createElement("div");
  messageElement.classList.add("mb-2");
  messageElement.innerHTML = `<p class="bg-gray-700 text-white rounded-lg py-2 px-4 inline-block">${message}</p>`;
  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
  // send message to backend
  invoke('press_keys', { key: message });
}
// send messages to topics
function send() {
  const message = textInput.value;
  // don't send empty messages
  if (message.trim() == "") {
    return;
  }
  // clear input field
  textInput.value = "";
  // add message to chatbox
  const messageElement = document.createElement("div");
  messageElement.classList.add("mb-2", "text-right");
  messageElement.innerHTML = `<p class="bg-blue-500 text-white rounded-lg py-2 px-4 inline-block">${message}</p>`;
  chatbox.appendChild(messageElement);
  chatbox.scrollTop = chatbox.scrollHeight;
  // publish message to topics
  for (const topic of topicSend) {
    client.publish(topic, message);
  }
}
