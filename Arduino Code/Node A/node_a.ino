#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>

// ---------------- WiFi Config ----------------
#define WIFI_SSID     "Sagar"
#define WIFI_PASSWORD "1223456789"

// ---------------- Firebase Paths ----------------
const char* FIREBASE_EMERGENCY_URL = "https://miner-helmet-18dce-default-rtdb.firebaseio.com/helmets/helmet_01/commands/emergency.json";
const char* FIREBASE_RESET_URL     = "https://miner-helmet-18dce-default-rtdb.firebaseio.com/helmets/helmet_01/commands/reset.json";

// ---------------- Pins ----------------
#define BUTTON_PIN D5
#define LED_PIN    D6
#define BUZZER_PIN D7

// ---------------- Timing ----------------
unsigned long lastButtonPress = 0;
const unsigned long debounceDelay = 150;     // mechanical debounce
const unsigned long buzzerDuration = 5000;   // 5s buzzer ON

// ---------------- State ----------------
bool emergencyActive = false;
bool buzzerOn = false;
unsigned long buzzerStartTime = 0;
bool lastButtonState = HIGH;  // because INPUT_PULLUP

// ---------------- Wi-Fi ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
}

// ---------------- Firebase PUT ----------------
void firebasePut(const char* url, const char* value) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  if (!http.begin(client, url)) {
    Serial.println("[HTTP] Begin failed");
    return;
  }

  http.addHeader("Content-Type", "application/json");
  int code = http.PUT(value);
  Serial.printf("[HTTP] PUT %s -> %d\n", url, code);
  http.end();
}

// ---------------- Emergency Trigger ----------------
void triggerEmergency() {
  Serial.println("[EVENT] Emergency Triggered!");
  digitalWrite(LED_PIN, HIGH);
  digitalWrite(BUZZER_PIN, HIGH);
  emergencyActive = true;
  buzzerOn = true;
  buzzerStartTime = millis();

  // Update Firebase once per press
  firebasePut(FIREBASE_EMERGENCY_URL, "true");
  firebasePut(FIREBASE_RESET_URL, "false");
}

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);

  digitalWrite(LED_PIN, LOW);
  digitalWrite(BUZZER_PIN, LOW);

  connectWiFi();

  // Clean start in Firebase
  firebasePut(FIREBASE_EMERGENCY_URL, "false");
  firebasePut(FIREBASE_RESET_URL, "false");

  Serial.println("[System] Node-A ready and waiting for button press...");
}

// ---------------- Loop ----------------
void loop() {
  connectWiFi();

  int reading = digitalRead(BUTTON_PIN);
  unsigned long now = millis();

  // --- Debounce and trigger ---
  if (reading == LOW && lastButtonState == HIGH && (now - lastButtonPress > debounceDelay)) {
    lastButtonPress = now;
    if (!emergencyActive) {
      triggerEmergency();
    }
  }

  // --- Stop buzzer after 5s ---
  if (buzzerOn && (now - buzzerStartTime >= buzzerDuration)) {
    digitalWrite(BUZZER_PIN, LOW);
    digitalWrite(LED_PIN, LOW);
    buzzerOn = false;

    // ✅ Re-arm button for next trigger
    emergencyActive = false;

    Serial.println("[INFO] Buzzer stopped; device ready for next press.");
  }

  lastButtonState = reading;
  delay(10);
}
