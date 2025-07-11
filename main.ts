import mqtt from "mqtt"
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { load } from '@tauri-apps/plugin-store';
// get elements from document
const table = document.getElementById("keybinds") as HTMLTableElement;
const addButton = window.document.getElementById("addButton") as HTMLButtonElement;
const removeButton = window.document.getElementById("removeButton") as HTMLButtonElement;
const saveButton = window.document.getElementById("saveButton") as HTMLButtonElement;
const connectButton = window.document.getElementById("connectButton") as HTMLInputElement;
const connectionStatus = window.document.getElementById("connectionStatus") as HTMLElement;
const listenButton = window.document.getElementById("listenButton") as HTMLInputElement;
const urlInput = window.document.getElementById("urlInput") as HTMLInputElement;
const portInput = window.document.getElementById("portInput") as HTMLInputElement;
const topicReceiveInput = window.document.getElementById("topicReceiveInput") as HTMLInputElement;
// load saved data
const savedData = await load('saved_data.json', { autoSave: false });
const savedUrl = await savedData.get("url") as string;
const savedPort = await savedData.get("port") as string;
const savedTopicReceive = await savedData.get("topicReceive") as string;
const savedKeys = await savedData.get("keys") as string[];
const savedTopics = await savedData.get("topics") as string[];
const savedMessages = await savedData.get("messages") as string[];
if (savedUrl !== undefined) {
    urlInput.value = savedUrl;
}
if (savedPort !== undefined) {
    portInput.value = savedPort;
}
if (savedTopicReceive !== undefined) {
    topicReceiveInput.value = savedTopicReceive;
}
const rowTemplate = table.rows[1].cloneNode(true);
if (savedKeys !== undefined) {
    const keys = savedKeys;
    for (let i = 1; i < keys.length; i++) {
        let row = table.rows[i];
        if (row === undefined) {
            row = rowTemplate.cloneNode(true) as HTMLTableRowElement;
            table.appendChild(row);
        }
        row.cells[0].getElementsByTagName("input")[0].value = keys[i];
    }
}
if (savedTopics !== undefined) {
    const topics = savedTopics;
    for (let i = 1; i < topics.length; i++) {
        let row = table.rows[i];
        if (row === undefined) {
            row = rowTemplate.cloneNode(true) as HTMLTableRowElement;
            table.appendChild(row);
        }
        row.cells[1].getElementsByTagName("input")[0].value = topics[i];
    }
}
if (savedMessages !== undefined) {
    const messages = savedMessages;
    for (let i = 1; i < messages.length; i++) {
        let row = table.rows[i];
        if (row === undefined) {
            row = rowTemplate.cloneNode(true) as HTMLTableRowElement;
            table.appendChild(row);
        }
        row.cells[2].getElementsByTagName("input")[0].value = messages[i];
    }
}
// prepare variables
let url: string;
let port: string;
let topicReceive: string[];
let client: mqtt.MqttClient;
// add event listeners to buttons and inputs
connectButton.addEventListener("click", connect);
addButton.addEventListener("click", addKeybind);
function addKeybind() {
    table.appendChild(rowTemplate.cloneNode(true));
}
removeButton.addEventListener("click", removeKeybind);
function removeKeybind() {
    if (table.rows.length > 2) {
        table.deleteRow(table.rows.length - 1);
    }
}
saveButton.addEventListener("click", save);
async function save() {
    const rows = table.rows;
    const keys = [""];
    const topics = [""];
    const messages = [""];
    for (let i = 1; i < rows.length; i++) {
        keys.push(rows[i].cells[0].getElementsByTagName("input")[0].value);
        topics.push(rows[i].cells[1].getElementsByTagName("input")[0].value);
        messages.push(rows[i].cells[2].getElementsByTagName("input")[0].value);
    }
    await savedData.set("url", urlInput.value);
    await savedData.set("port", portInput.value);
    await savedData.set("topicReceive", topicReceiveInput.value);
    await savedData.set("keys", keys);
    await savedData.set("topics", topics);
    await savedData.set("messages", messages);
    await savedData.save();
}
// connect to mqtt broker
function connect() {
    if (connectButton.disabled) {
        return;
    }
    connectButton.disabled = true;
    if (!connectButton.checked) {
        client.end();
        // disconnected state
        connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Disconnected</span>';
        setTimeout(() => {
            connectButton.disabled = false;
        }, 500);
        return;
    }
    // connecting state
    connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-orange-900 text-orange-300"><span class="w-2 h-2 me-1 bg-orange-500 rounded-full"></span>Connecting</span>';
    url = urlInput.value;
    port = portInput.value;
    topicReceive = topicReceiveInput.value.split(",");
    if (url == "") {
        url = "test.mosquitto.org";
    }
    if (port == "") {
        port = "8081";
    }
    if (topicReceive.toString() == "") {
        topicReceive = ["remotekeyboard/receive"];
    }
    client = mqtt.connect("wss://" + url + ":" + port + "/mqtt");
    client.stream.on('error', () => {
        // failure state
        connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Failed</span>';
        connectButton.checked = false;
        setTimeout(() => {
            // return to disconnected state
            connectionStatus.innerHTML = '<span class="inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full bg-red-900 text-red-300"><span class="w-2 h-2 me-1 bg-red-500 rounded-full"></span>Disconnected</span>';
            connectButton.disabled = false;
        }, 2000);
    });
    client.on("connect", () => {
        // connected state
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
    // send message to backend
    invoke('press_keys', { key: message });
}
// send messages to topics
listen('input', (event) => {
    if (!listenButton.checked) {
        return;
    }
    const input = event.payload as string;
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const key = (row.cells[0].getElementsByTagName("input")[0] as HTMLInputElement).value;
        if (input !== key) {
            continue;
        }
        const topics = (row.cells[1].getElementsByTagName("input")[0] as HTMLInputElement).value;
        const message = (row.cells[2].getElementsByTagName("input")[0] as HTMLInputElement).value;
        // send gesture
        for (const topic of topics.split(",")) {
            client.publish(topic, message);
        }
    }
});
