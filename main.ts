import mqtt from "mqtt"
const chatbox = document.getElementById("chatbox") as HTMLElement;
const sendButton = document.getElementById("sendButton") as HTMLButtonElement;
const connectButton = window.document.getElementById("connectButton") as HTMLInputElement;
const connectionStatus = window.document.getElementById("connectionStatus") as HTMLElement;
const textInput = document.getElementById("textInput") as HTMLInputElement;
const urlInput = window.document.getElementById("urlInput") as HTMLInputElement;
const portInput = window.document.getElementById("portInput") as HTMLInputElement;
const topicSendInput = window.document.getElementById("topicSendInput") as HTMLInputElement;
const topicReceiveInput = window.document.getElementById("topicReceiveInput") as HTMLInputElement;
let url: string;
let port: string;
let topicSend: string[];
let topicReceive: string[];
let client: mqtt.MqttClient;
connectButton.addEventListener("click", connect);
function connect() {
    if (connectButton.disabled) {
        return;
    }
    connectButton.disabled = true;
    if (!connectButton.checked) {
        client.end();
        connectionStatus.innerHTML = '<span class="inline-flex items-center bg-red-100 text-red-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-red-900 dark:text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Disconnected</span>';
        setTimeout(() => {
            connectButton.disabled = false;
        }, 2000);
        return;
    }
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
        client.end();
        connectButton.checked = false;
        window.alert("Connection failed. Double-check the URL and port.");
    });
    client.on("connect", () => {
        connectionStatus.innerHTML = '<span class="inline-flex items-center bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full dark:bg-green-900 dark:text-green-300"><span class="w-2 h-2 me-1 bg-green-500 rounded-full"></span>Connected</span>';
        client.subscribe(topicReceive);
    });
    client.on("message", (_topic, message) => {
        receive(message.toString());
    });
    setTimeout(() => {
        connectButton.disabled = false;
    }, 2000);
}
function receive(message: string) {
    const messageElement = document.createElement("div");
    messageElement.classList.add("mb-2");
    messageElement.innerHTML = `<p class="bg-gray-700 text-white rounded-lg py-2 px-4 inline-block">${message}</p>`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}
sendButton.addEventListener("click", send);
textInput.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
        send();
    }
});
function send() {
    const message = textInput.value;
    if (message.trim() == "") {
        return;
    }
    const messageElement = document.createElement("div");
    messageElement.classList.add("mb-2", "text-right");
    messageElement.innerHTML = `<p class="bg-blue-500 text-white rounded-lg py-2 px-4 inline-block">${message}</p>`;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
    for (const topic of topicSend) {
        client.publish(topic, message);
    }
    textInput.value = "";
}