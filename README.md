# HydroSmart - Solar-Grid Hybrid Hydroponics Smart Farm IoT System

HydroSmart is a premium, real-time Internet of Things (IoT) monitoring and control dashboard for NFT (Nutrient Film Technique) hydroponics. It tracks essential parameters like pH, EC, water temperature, ambient humidity, and energy metrics (Battery Capacity, Solar vs. Grid status) while allowing automated, scheduled, and manual pump override cycles.

---

## ── TABLE OF CONTENTS ──
1. [System Architecture](#1-system-architecture)
2. [Firebase Realtime Database Setup](#2-firebase-realtime-database-setup)
3. [Hardware Integration Guide (ESP32 Pinouts)](#3-hardware-integration-guide-esp32-pinouts)
4. [ESP32 Arduino IDE Integration Code](#4-esp32-arduino-ide-integration-code)
5. [Local Development & Deployment Guide](#5-local-development--deployment-guide)

---

## 1. System Architecture

HydroSmart consists of three integrated layers:
- **IoT Node (ESP32 + Sensors)**: Collects sensor telemetry (pH, EC, Water Temp, Humidity, Battery State) and listens to relay control overrides from the database.
- **Backend Sync (Firebase Realtime Database)**: Acts as the low-latency real-time buffer syncing the hardware node and the web application.
- **Frontend Dashboard (React + Vite)**: A premium glassmorphic, responsive web dashboard containing widgets for telemetry, scheduler, analytics charts, and device preferences (supporting high-contrast Light/Dark themes).

---

## 2. Firebase Realtime Database Setup

To hook the hardware and the dashboard together using Firebase:

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a new project named `HydroSmart`.
2. **Provision Realtime Database**:
   - Navigate to **Build > Realtime Database** in the left menu.
   - Click **Create Database**, select a region, and choose **Start in test mode** (allows direct read/write access for testing).
3. **Database Rules Configuration**:
   - Go to the **Rules** tab and configure read/write permissions. For simple hardware/frontend API sync:
     ```json
     {
       "rules": {
         ".read": "true",
         ".write": "true"
       }
     }
     ```
     *(Note: Add authentication rules in production).*
4. **Copy URL**:
   - Copy the Database URL from the top of the console (e.g., `https://your-project-default-rtdb.firebaseio.com/`).
   - Paste it in `frontend/src/shared/firebaseService.js` and toggle `USE_FIREBASE = true`.

---

## 3. Hardware Integration Guide (ESP32 Pinouts)

The IoT node is anchored on an **ESP32 DevKit V1**. Connect the sensors and relay controllers according to this pin layout:

### Sensors Inputs
| Sensor | Interface Type | ESP32 GPIO Pin | Description |
| :--- | :--- | :--- | :--- |
| **Analog pH Sensor v2.0** | Analog | `GPIO 34` (ADC1_CH6) | Measures acidity/alkalinity of water reservoir. |
| **Analog EC Sensor v2.0** | Analog | `GPIO 35` (ADC1_CH7) | Measures Electrical Conductivity (Nutrient concentration). |
| **DS18B20 Water Temp** | OneWire (Digital) | `GPIO 22` | Measures water temperature in Celcius. (Requires 4.7kΩ pull-up resistor to 3.3V). |
| **DHT22 Temp & Humidity** | Digital (Single-Bus)| `GPIO 23` | Measures ambient temperature and air humidity. |
| **Ultrasonic Level Sensor**| Digital (Trigger/Echo)| `GPIO 18` (Trigger) / `GPIO 19` (Echo) | Tracks water levels in the nutrient tank. |
| **INA219 Power Monitor** | I2C (SDA/SCL) | `GPIO 21` (SDA) / `GPIO 22` (SCL) | Tracks solar panel/battery status (Voltage, current, SoC %). |

### Relay Output Channels (Acitve-Low 4-Channel Relay)
| Output Device | Control Type | ESP32 GPIO Pin | Description |
| :--- | :--- | :--- | :--- |
| **Water Reservoir Pump** | Digital Output | `GPIO 12` | Turns hydroponics channel irrigation on/off. |
| **Grow Lights** | Digital Output | `GPIO 13` | Controls supplemental LED arrays. |
| **Exhaust Fan** | Digital Output | `GPIO 14` | Ventilation control. |
| **Dosing Pump A/B** | Digital Output | `GPIO 15` / `GPIO 27` | Peristaltic pumps for pH adjustments / nutrient feeding. |

---

## 4. ESP32 Arduino IDE Integration Code

Use this Arduino sketch template in the ESP32 node to connect to WiFi, read analog/digital pins, construct the JSON payload, and sync it with Firebase Realtime Database.

> [!IMPORTANT]
> Install the following libraries via the Arduino IDE Library Manager before uploading:
> - **DHT sensor library** (by Adafruit)
> - **OneWire** (by Paul Stoffregen)
> - **DallasTemperature** (by Miles Burton)
> - **ArduinoJson** (by Benoit Blanchon)

```cpp
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include <OneWire.h>
#include <DallasTemperature.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Firebase Realtime Database Endpoint
const char* firebaseURL = "https://your-project-default-rtdb.firebaseio.com/telemetry.json";

// Pin Configurations
#define DHTPIN 23
#define DHTTYPE DHT22
#define ONE_WIRE_BUS 22
#define PH_PIN 34
#define EC_PIN 35
#define PUMP_RELAY_PIN 12

// Sensor Objects
DHT dht(DHTPIN, DHTTYPE);
OneWire oneWire(ONE_WIRE_BUS);
DallasTemperature waterTempSensor(&oneWire);

// Timer variables
unsigned long lastUpdate = 0;
const unsigned long updateInterval = 2500; // Push telemetry every 2.5 seconds

void setup() {
  Serial.begin(115200);
  
  // Initialize Relays
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  digitalWrite(PUMP_RELAY_PIN, HIGH); // Active-Low Relay OFF by default

  // Initialize Sensors
  dht.begin();
  waterTempSensor.begin();

  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected!");
}

void loop() {
  if (millis() - lastUpdate >= updateInterval) {
    lastUpdate = millis();
    
    // 1. Read Sensor values
    float airTemp = dht.readTemperature();
    float humidity = dht.readHumidity();
    
    waterTempSensor.requestTemperatures();
    float waterTemp = waterTempSensor.getTempCByIndex(0);

    // Read analog sensors & convert to pH / EC formulas
    int phRaw = analogRead(PH_PIN);
    float ph = 3.5 * (phRaw * (3.3 / 4095.0)) + 0.0; // Simulated linear calibration
    
    int ecRaw = analogRead(EC_PIN);
    float ec = 1.0 * (ecRaw * (3.3 / 4095.0)); // Simulated EC calculation
    
    // Handle sensor read failures
    if (isnan(airTemp) || isnan(humidity)) {
      airTemp = 24.5;
      humidity = 60.0;
    }

    // 2. Fetch Relay states from Firebase before pushing (to see manual overrides)
    checkFirebaseOverrides();

    // 3. Create JSON payload and PATCH to Firebase RTDB
    if (WiFi.status() == WL_CONNECTED) {
      HTTPClient http;
      http.begin(firebaseURL);
      http.addHeader("Content-Type", "application/json");

      JsonDocument doc;
      
      // Structure corresponding to the React dashboard expectations
      JsonObject sensorsObj = doc["sensors"].to<JsonObject>();
      sensorsObj["ph"] = ph;
      sensorsObj["ec"] = ec;
      sensorsObj["waterTemp"] = waterTemp;
      sensorsObj["airTemp"] = airTemp;
      sensorsObj["humidity"] = humidity;
      sensorsObj["waterLevel"] = 80; // Placeholder

      JsonObject energyObj = doc["energy"].to<JsonObject>();
      energyObj["batterySoC"] = 88.5; // INA219 details
      energyObj["chargingState"] = "solar";

      JsonObject dosingObj = doc["dosing"].to<JsonObject>();
      dosingObj["nutrientA_ml"] = 2.4;
      dosingObj["nutrientB_ml"] = 1.8;
      dosingObj["mlpConfidence"] = 95.0;

      String jsonString;
      serializeJson(doc, jsonString);

      int httpResponseCode = http.sendRequest("PATCH", jsonString);
      if (httpResponseCode > 0) {
        Serial.println("Telemetry successfully pushed to Firebase!");
      } else {
        Serial.printf("Error pushing telemetry: %s\n", http.errorToString(httpResponseCode).c_str());
      }
      http.end();
    }
  }
}

/**
 * Check if the web dashboard triggered a manual pump override
 */
void checkFirebaseOverrides() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    // Query only overrides node
    String overrideURL = String(firebaseURL).replace("telemetry.json", "telemetry/overrides/waterPump.json");
    http.begin(overrideURL);
    
    int httpResponseCode = http.GET();
    if (httpResponseCode == 200) {
      String payload = http.getString();
      bool pumpOverride = (payload == "true");
      
      if (pumpOverride) {
        digitalWrite(PUMP_RELAY_PIN, LOW); // Turn pump ON (Active-Low)
        Serial.println("→ MANUAL IRRIGATION PUMP OVERRIDE ACTIVE (ON)");
      } else {
        digitalWrite(PUMP_RELAY_PIN, HIGH); // Turn pump OFF (Active-Low)
      }
    }
    http.end();
  }
}
```

---

## 5. Local Development & Deployment Guide

### Local Development Setup
1. Clone the repository to your desktop machine.
2. Install root server dependencies:
   ```bash
   npm install
   ```
3. Install React client dependencies:
   ```bash
   cd frontend
   npm install
   ```
4. Run the development server (runs mock Express server on port `5000` and Vite client):
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to `http://localhost:5000`.

### Production Deployment to Render
To deploy this system to **Render.com** (serving both the API and client from a single Web Service):
1. Create a Render account and link your GitHub repository.
2. Create a new **Web Service**.
3. Configure the build parameters:
   - **Environment**: `Node`
   - **Build Command**: `npm run build` *(This builds both client bundles and moves them to Express static public folder)*
   - **Start Command**: `node server.js`
4. The service will build, bundle the React production package, and host the live IoT dashboard publicly!
