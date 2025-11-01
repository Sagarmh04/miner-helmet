# 🪖 Smart Miner Helmet – IoT Safety Monitoring System [Demo] (https://miner-helmet.vercel.app/)
> A complete IoT-based real-time monitoring system for miner safety using ESP8266, Firebase Realtime Database, and Next.js dashboard.

---

## 🚀 Project Overview

The **Smart Miner Helmet** continuously monitors a worker’s safety through:

* 🌡️ **Temperature sensing**
* 📡 **GPS location tracking**
* 🆘 **Emergency button trigger**
* 📶 **Real-time cloud updates** using Firebase
* 💻 **Web dashboard** for monitoring and alert control

Built for **low-latency** communication and **field reliability**, this system uses **two NodeMCU boards** that work independently but sync through Firebase.

---

## 🧩 System Architecture

```
┌───────────────┐
│   Node A      │  ---> Handles button, LED, buzzer
│ (Emergency)   │  ---> Writes /commands/emergency & /commands/reset
└─────┬─────────┘
      │
      │ Cloud Sync (HTTP Firebase REST)
      ▼
┌───────────────┐
│   Firebase    │  ---> Realtime Database (helmets/<id>/)
└─────┬─────────┘
      │
      ▼
┌───────────────┐
│   Node B      │  ---> Reads commands, sends temp & GPS data
│ (Telemetry)   │  ---> Writes /current and /history
└─────┬─────────┘
      │
      ▼
┌───────────────┐
│  Web App      │  ---> Live Dashboard (Next.js)
│ (Monitoring)  │  ---> Displays emergency, alerts, maps
└───────────────┘
```

---

## 🪛 Hardware Components

| Component          | Quantity | Description            |
| ------------------ | -------- | ---------------------- |
| ESP8266 NodeMCU    | 2        | Wi-Fi microcontrollers |
| DHT11              | 1        | Temperature sensor     |
| NEO-6M GPS         | 1        | Location tracking      |
| Push Button        | 1        | Emergency trigger      |
| Buzzer             | 1        | Audible alert          |
| LED                | 1        | Emergency indicator    |
| Breadboard + wires | —        | Prototyping            |

---

## ⚙️ Firmware

### 🅰️ Node A (Emergency Unit)

* Listens for button presses
* Activates buzzer + LED for 5 seconds
* Updates Firebase:

  ```json
  "commands": {
    "emergency": true,
    "reset": false
  }
  ```
* Waits for web reset → `commands/reset=true`

📂 File: `nodeA_emergency.ino`

---

### 🅱️ Node B (Telemetry Unit)

* Reads temperature (DHT11) & GPS
* Syncs time via NTP (IST timezone)
* Reads `commands/emergency`
* Uploads:

  * `/current` – Latest live data
  * `/history` – Historical logs
* Upload interval:

  * Normal mode → every 60s
  * Emergency → every 10s
* Resyncs time every 5 minutes

📂 File: `nodeB_sensor.ino`

---

## 🖥️ Web Dashboard (Next.js + Firebase)

### 📊 Features

* Real-time monitoring via Firebase RTDB
* Automatic emergency and offline detection
* Temperature alert panel for extreme conditions
* Google Maps integration for live location
* Dynamic status updates (“Active”, “Inactive”, “Emergency”)
* Secure Firebase keys in `.env.local`

### 🧠 Reset Logic

When the **"Reset Emergency"** button is clicked:

1. `commands/emergency` → false
2. `commands/reset` → true
3. `/current` is overwritten with emergency=false for instant UI update

### 🔔 Alert Panels

| Alert                 | Trigger Condition           |
| --------------------- | --------------------------- |
| **Emergency Panel**   | `commands/emergency = true` |
| **Temperature Panel** | Temp > 50°C or < 15°C       |
| **Offline Panel**     | No data for > 2 min         |

📂 Main files:

* `app/components/dashboard/LiveDashboard.tsx`
* `app/components/dashboard/HelmetCard.tsx`
* `app/components/dashboard/OfflineAlertPanel.tsx`
* `app/lib/firebase.ts` (Firebase SDK config)

---

## ☁️ Firebase Database Structure

```json
helmets: {
  "helmet_01": {
    "current": {
      "latitude": 12.9716,
      "longitude": 77.5946,
      "temperature": 29.4,
      "timestamp": "2025-11-01T12:34:56+05:30",
      "emergency": false
    },
    "history": {
      "-Nh23...": { ...data... },
      "-Nh24...": { ...data... }
    },
    "commands": {
      "emergency": false,
      "reset": false
    }
  }
}
```

---

## 🔧 Setup Instructions

### 1️⃣ Firebase

* Create a Firebase Realtime Database project
* Set read/write rules to public (for testing):

  ```json
  {
    "rules": {
      ".read": true,
      ".write": true
    }
  }
  ```
* Copy your database URL into both Arduino `.ino` files and `.env.local` in Next.js.

### 2️⃣ NodeMCU (Arduino IDE)

Install these libraries:

```
ESP8266WiFi
ESP8266HTTPClient
WiFiClientSecure
TinyGPSPlus
DHT Sensor Library
Time
```

Flash Node A and Node B with the respective `.ino` codes.

### 3️⃣ Web Dashboard

```bash
# Clone the repo
git clone https://github.com/Sagarmh04/miner-helmet.git
cd smart-miner-helmet

# Install dependencies
npm install

# Add Firebase credentials
touch .env.local
# Fill with:
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_DATABASE_URL=...

# Run locally
npm run dev
```

Deploy to **Vercel** (already integrated).

---

## 🧠 System Behavior Summary

| Mode           | Node A                  | Node B                              | Web             |
| -------------- | ----------------------- | ----------------------------------- | --------------- |
| Normal         | Idle                    | Uploads every 60s                   | Shows “Active”  |
| Button Press   | Triggers emergency=true | Uploads faster                      | Emergency Alert |
| Reset from Web | Sets reset=true         | Reads reset → continues normal mode | Clears alert    |

---

## 🧪 Quick Tests

| Test                          | Expected Result               |
| ----------------------------- | ----------------------------- |
| Press button on Node A        | Buzzer ON 5s, emergency=true  |
| Dashboard shows emergency     | Red ring & alert panel        |
| Click reset on dashboard      | emergency=false, reset=true   |
| Node B uploads again normally | “Active” status returns       |
| Unplug Node B                 | Offline panel after 2 minutes |
| Overheat DHT (>50°C)          | Temperature alert panel       |

---

## 📜 License

MIT License — free to modify, distribute, and use.

---

## 🧑‍💻 Author

**Shankar Halyal**
🎓 Student | 🚀 DevOps & IoT Enthusiast
🔗 [LinkedIn](www.linkedin.com/in/shankar-halyal) | [GitHub](https://github.com/Sagarmh04)

---
