import os
import sys
from threading import Timer
import tkinter as tk
from tkinter import messagebox
import paho.mqtt.client as mqtt
import pyautogui
import sv_ttk
import darkdetect
import pywinstyles
from tkinter import Canvas, StringVar, ttk

def on_connect(client, userdata, flags, reason_code, properties):
  canvas.delete("all")
  canvas.create_image(20, 20, image=connected)
  statusInfo.config(text="Connected")
  currentTopic = topic.get()
  if currentTopic == "":
    currentTopic = "#"
  client.subscribe(currentTopic)

def on_disconnect(client, userdata, flags, reason_code, properties):
  canvas.delete("all")
  canvas.create_image(20, 20, image=disconnected)
  statusInfo.config(text="Not Connected")

def on_message(client, userdata, msg):
  keys = msg.payload.decode("utf-8").split("-")
  key1 = keys[0]
  key2 = keys[1]
  print(key1)
  print(key2)
  pyautogui.hotkey(key1,key2)

def apply_theme_to_titlebar(root):
  version = sys.getwindowsversion()
  if version.major == 10 and version.build >= 22000:
    pywinstyles.change_header_color(root, "#1c1c1c" if sv_ttk.get_theme() == "dark" else "#fafafa")
  elif version.major == 10:
    pywinstyles.apply_style(root, "dark" if sv_ttk.get_theme() == "dark" else "normal")
    root.wm_attributes("-alpha", 0.99)
    root.wm_attributes("-alpha", 1)

def center(toplevel):
  toplevel.update_idletasks()
  screen_width = toplevel.winfo_screenwidth()
  screen_height = toplevel.winfo_screenheight()
  size = tuple(int(_) for _ in toplevel.geometry().split('+')[0].split('x'))
  x = screen_width/2 - size[0]/2
  y = screen_height/2 - size[1]/2
  toplevel.geometry("+%d+%d" % (x, y))

def on_closing():
  if messagebox.askyesno("Remote Keyboard", "Are you sure you want to close?"):
    mqttClient.loop_stop()
    mqttClient.disconnect()
    root.destroy()

def reenableButton():
  checkbutton.state(["!disabled"])

def attemptConnection():
  if activationLabel.get() == "On":
    activationLabel.set("Off")
    mqttClient.loop_stop()
    mqttClient.disconnect()
  else:
    try:
      mqttClient.on_connect = on_connect
      mqttClient.on_message = on_message
      mqttClient.on_disconnect = on_disconnect
      currentPort = port.get()
      if currentPort == "":
        currentPort = 1883
      mqttClient.connect(url.get(), int(currentPort), 60)
      mqttClient.loop_start()
      activationLabel.set("On")
    except:
      messagebox.showerror("Remote Keyboard", "Could not connect to the MQTT broker. Please check whether the URL and port are correct and try again.")
      checkButtonValue.set(0)
  checkbutton.state(["disabled"])
  Timer(0.5, reenableButton).start()

def resource_path(relative_path):
    base_path = getattr(sys, '_MEIPASS', os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(base_path, relative_path)

mqttClient = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
assets = resource_path("assets")
# setup app window
root = tk.Tk()
root.minsize(500, 700)
root.geometry("850x850")
root.iconphoto(False, tk.PhotoImage(file=assets + "/icon.png"))
root.title("Remote Keyboard")
center(root)
sv_ttk.set_theme(darkdetect.theme())
if os.name == 'nt':
  apply_theme_to_titlebar(root)

# setup contents
app = ttk.Frame(root, padding=20, style="Card.TFrame")
app.pack(expand=True)

ttk.Label(app, text="Remote Keyboard", font=("Segoe UI Variable Display Semibold", 25)).pack(padx=10, pady=10)
ttk.Label(app, text="Enter the required information, then flip the switch to connect.").pack(padx=10, pady=10)

settings = ttk.Frame(app, padding=20, style="Card.TFrame")
settings.pack(padx=10, pady=10)

ttk.Label(settings, text="URL of the MQTT broker:").pack(padx=10, pady=10)
url = ttk.Entry(settings, width=42)
url.pack(padx=10, pady=10)

ttk.Label(settings, text="Port of the MQTT broker:").pack(padx=10, pady=10)
port = ttk.Entry(settings, width=42)
port.pack(padx=10, pady=10)

ttk.Label(settings, text="Main topic to listen on:").pack(padx=10, pady=10)
topic = ttk.Entry(settings, width=42)
topic.pack(padx=10, pady=10)

activate = ttk.Frame(app, padding=20, style="Card.TFrame")
activate.pack(padx=10, pady=10)

ttk.Label(activate, text="Activate Remote Keyboard").pack(side=tk.LEFT, padx=(0, 50))

checkButtonValue = tk.IntVar()
checkbutton = ttk.Checkbutton(activate, command=attemptConnection, style="Switch.TCheckbutton", variable=checkButtonValue, onvalue=1, offvalue=0)
checkbutton.pack(side=tk.RIGHT)

activationLabel = StringVar()
activationLabel.set("Off")
activation = ttk.Label(activate, textvariable=activationLabel)
activation.pack(side=tk.RIGHT, padx=(0, 10))

status = ttk.Frame(app, padding=20, style="Card.TFrame")
status.pack(padx=10, pady=10)

canvas = Canvas(status, width=40, height=40, bg = root["bg"], offset=tk.S)
canvas.pack(side=tk.LEFT, padx=0, pady=0)

connected = tk.PhotoImage(file=assets + "/connected.png")
disconnected = tk.PhotoImage(file=assets + "/disconnected.png")
canvas.create_image(20, 20, image=disconnected)

statusInfo = ttk.Label(status, text="Not Connected")
statusInfo.pack(side=tk.LEFT, padx=0, pady=0)

# run app
root.protocol("WM_DELETE_WINDOW", on_closing)
root.mainloop()
