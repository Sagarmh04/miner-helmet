## 🪖 IoT Smart Miner Helmet – Arduino Firmware Manual

### 📘 Overview

This project uses **two ESP8266 (NodeMCU)** boards to monitor and report miner safety conditions (temperature, GPS, emergency button).
All communication happens over **Wi-Fi using Firebase Realtime Database (HTTP REST API)** — no third-party MQTT broker is used.

---

## ⚙️ Node Setup

### 🅰️ **Node A – Emergency Unit**

Handles the **panic button**, **LED**, and **buzzer**.
It does not read sensors — it only listens for button presses and updates Firebase.

#### 🔁 Behavior Flow

1. Waits for a **button press** (INPUT_PULLUP).
2. When pressed:

   * Turns **ON buzzer + LED** for 5 seconds.
   * Sends to Firebase:

     * `commands/emergency = true`
     * `commands/reset = false`
3. After 5 seconds, turns **OFF buzzer + LED**.
4. Returns to idle listening.
5. The **reset flag** is only cleared by the **web app**, not automatically.

#### 📡 Firebase Paths (example)

```
helmets/
  helmet_01/
    commands/
      emergency: true/false
      reset: true/false
```

#### 🧪 Quick Tests

| Test                       | Expected Behavior                                                |
| -------------------------- | ---------------------------------------------------------------- |
| Press button once          | Buzzer + LED ON for ~5 sec, Firebase `commands/emergency` → true |
| Wait 5 sec                 | Buzzer + LED OFF, emergency remains true                         |
| Click "Reset" on dashboard | `commands/reset` → true, `commands/emergency` → false            |
| Press again                | Works again normally                                             |

---

### 🅱️ **Node B – Sensor & Telemetry Unit**

Handles **temperature (DHT11)**, **GPS**, **time sync**, and **data uploads** to Firebase.

#### 🔁 Behavior Flow

1. Connects to Wi-Fi and synchronizes time (NTP → IST).
2. Periodically reads:

   * `commands/emergency` from Firebase.
   * DHT temperature & GPS data.
3. Uploads:

   * `/current` – latest helmet status (temperature, GPS, timestamp, emergency flag).
   * `/history` – appended logs with timestamps.
4. Upload intervals:

   * **Normal:** every 60 seconds.
   * **Emergency:** every 10 seconds.
5. Performs time resync every 5 minutes.

#### 📡 Firebase Paths

```
helmets/
  helmet_01/
    current/
      latitude
      longitude
      temperature
      timestamp
      emergency
    history/
      <auto_id>/
        latitude
        longitude
        temperature
        timestamp
        emergency
```

#### 🧪 Quick Tests

| Test                   | Expected Result                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------- |
| Normal operation       | Data updates every 60 s in `/current`                                               |
| Press button on Node A | Upload rate increases to every 10 s, `emergency: true`                              |
| Dashboard “Reset”      | `commands/reset` → true, `commands/emergency` → false, upload returns to 60 s cycle |
| Power cycle Node B     | Auto-reconnects, re-syncs time, resumes uploads                                     |

---

## 🔧 Common Setup Notes

* **Wi-Fi credentials**: edit in both `.ino` files.
* **Firebase URLs**: update database links for your project.
* Both devices must share the **same helmet ID path** (e.g., `/helmets/helmet_01/`).
* Node A and Node B operate **independently but communicate via cloud flags**.

---

## 🧰 Tools & Libraries

Install via Arduino IDE → *Library Manager*:

| Library                | Purpose                  |
| ---------------------- | ------------------------ |
| **ESP8266WiFi**        | Wi-Fi connection         |
| **ESP8266HTTPClient**  | Firebase REST API (HTTP) |
| **WiFiClientSecure**   | HTTPS support            |
| **TinyGPSPlus**        | Parse NEO-6M GPS data    |
| **DHT Sensor Library** | Read DHT11 sensor        |
| **Time / time.h**      | Handle timestamps        |

---

## 📅 Timing Summary

| Task                    | Frequency |
| ----------------------- | --------- |
| Data upload (normal)    | 60 s      |
| Data upload (emergency) | 10 s      |
| Reset polling           | 10 s      |
| Time sync               | 5 min     |
| Button debounce         | 150 ms    |
| Buzzer duration         | 5 s       |

---

## 🧩 Integration Summary

| Component   | Role               | Firebase Interaction                                       |
| ----------- | ------------------ | ---------------------------------------------------------- |
| **Node A**  | Emergency trigger  | Writes `commands/emergency`, `commands/reset`              |
| **Node B**  | Telemetry          | Reads `commands/emergency`, writes `/current` & `/history` |
| **Web App** | Monitoring + Reset | Displays all data, sets reset flags                        |
