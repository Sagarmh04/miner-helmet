#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <TinyGPSPlus.h>
#include <SoftwareSerial.h>
#include "DHT.h"
#include <time.h>

// ---------------- WiFi Configuration ----------------
#define WIFI_SSID     "Sagar"
#define WIFI_PASSWORD "1223456789"

// ---------------- Firebase Endpoints ----------------
const char* FIREBASE_PUT  = "https://miner-helmet-18dce-default-rtdb.firebaseio.com/helmets/helmet_01/current.json";
const char* FIREBASE_POST = "https://miner-helmet-18dce-default-rtdb.firebaseio.com/helmets/helmet_01/history.json";
const char* FIREBASE_CMD  = "https://miner-helmet-18dce-default-rtdb.firebaseio.com/helmets/helmet_01/commands/emergency.json";

// ---------------- DHT Sensor ----------------
#define DHTPIN D0
#define DHTTYPE DHT11
DHT dht(DHTPIN, DHTTYPE);
bool hasDHT = false;
float temperature = 0.0;

// ---------------- GPS Setup ----------------
static const int GPS_RX_PIN = D1; // GPS TX -> D1
static const int GPS_TX_PIN = D2; // GPS RX -> D2
static const uint32_t GPSBaud = 9600;
TinyGPSPlus gps;
SoftwareSerial gpsSerial(GPS_RX_PIN, GPS_TX_PIN);

// ---------------- Time ----------------
time_t currentUtc = 0;
unsigned long lastTimeSync = 0;
const unsigned long timeSyncInterval = 5UL * 60UL * 1000UL; // every 5 mins

// ---------------- Upload Timers ----------------
unsigned long lastUpload = 0;
const unsigned long normalInterval = 60000UL;
const unsigned long emergencyInterval = 10000UL;

// ---------------- State ----------------
bool emergencyFlag = false;

// ---------------- WiFi ----------------
void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("\n[WiFi] Connecting to %s", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(250);
    Serial.print(".");
  }
  Serial.printf("\n[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
}

// ---------------- Time Sync (NTP) ----------------
bool syncTime() {
  Serial.println("[Time] Syncing NTP...");
  configTime(0, 0, "pool.ntp.org", "time.nist.gov");
  for (int i = 0; i < 20; i++) {
    time_t tnow = time(nullptr);
    if (tnow > 100000) {
      currentUtc = tnow;
      Serial.printf("[Time] Synced: %s\n", getTimestamp().c_str());
      return true;
    }
    delay(500);
  }
  Serial.println("[Time] Failed to sync");
  return false;
}

String getTimestamp() {
  time_t localTime = currentUtc + (5 * 3600) + (30 * 60);
  struct tm *ptm = gmtime(&localTime);
  char buf[30];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02d+05:30",
          ptm->tm_year + 1900, ptm->tm_mon + 1, ptm->tm_mday,
          ptm->tm_hour, ptm->tm_min, ptm->tm_sec);
  return String(buf);
}

// ---------------- Firebase HTTP Helpers ----------------
String firebaseGet(const char* url) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String payload = "";
  if (http.begin(client, url)) {
    int code = http.GET();
    if (code == 200) {
      payload = http.getString();
    }
    Serial.printf("[GET] %s -> %d\n", url, code);
    http.end();
  }
  return payload;
}

bool firebasePut(const char* url, const String& payload) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  bool ok = false;
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    int code = http.PUT(payload);
    Serial.printf("[PUT] %s -> %d\n", url, code);
    ok = (code == 200);
    http.end();
  }
  return ok;
}

bool firebasePost(const char* url, const String& payload) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  bool ok = false;
  if (http.begin(client, url)) {
    http.addHeader("Content-Type", "application/json");
    int code = http.POST(payload);
    Serial.printf("[POST] %s -> %d\n", url, code);
    ok = (code == 200);
    http.end();
  }
  return ok;
}

// ---------------- Read Emergency Flag ----------------
void updateEmergencyFlag() {
  String val = firebaseGet(FIREBASE_CMD);
  val.trim();
  emergencyFlag = (val == "true" || val == "true\n");
  Serial.printf("[CMD] Emergency = %s\n", emergencyFlag ? "TRUE" : "FALSE");
}

// ---------------- Prepare Payload ----------------
String buildPayload(float lat, float lng, float temp) {
  String json = "{";
  json += "\"latitude\":" + String(lat, 6) + ",";
  json += "\"longitude\":" + String(lng, 6) + ",";
  json += "\"temperature\":" + String(temp, 1) + ",";
  json += "\"active\":true,";
  json += "\"emergency\":" + String(emergencyFlag ? "true" : "false") + ",";
  json += "\"timestamp\":\"" + getTimestamp() + "\"";
  json += "}";
  return json;
}

// ---------------- Upload Data ----------------
void uploadData() {
  connectWiFi();

  float lat = gps.location.isValid() ? gps.location.lat() : 0.0;
  float lng = gps.location.isValid() ? gps.location.lng() : 0.0;
  if (hasDHT) {
    float t = dht.readTemperature();
    if (!isnan(t)) temperature = t;
  }

  currentUtc = time(nullptr);
  String payload = buildPayload(lat, lng, temperature);

  Serial.println("[UPLOAD] Payload:");
  Serial.println(payload);

  if (firebasePut(FIREBASE_PUT, payload)) {
    firebasePost(FIREBASE_POST, payload);
  }
}

// ---------------- Setup ----------------
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(GPSBaud);
  dht.begin();

  pinMode(DHTPIN, INPUT);
  hasDHT = !isnan(dht.readTemperature());

  connectWiFi();
  syncTime();
  lastTimeSync = millis();

  Serial.println("[System] Node-B initialized.");
}

// ---------------- Loop ----------------
void loop() {
  unsigned long now = millis();

  // Feed GPS data continuously
  if (gpsSerial.available()) gps.encode(gpsSerial.read());

  // Periodic time sync
  if (now - lastTimeSync >= timeSyncInterval) {
    syncTime();
    lastTimeSync = now;
  }

  // Determine upload interval based on emergency flag
  unsigned long interval = emergencyFlag ? emergencyInterval : normalInterval;

  // Upload cycle
  if (now - lastUpload >= interval) {
    updateEmergencyFlag();
    uploadData();
    lastUpload = now;
  }

  delay(10);
}
