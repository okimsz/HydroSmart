// Firebase Realtime Database REST Integration Service
// This utility allows the HydroSmart dashboard to connect directly to Firebase Realtime Database 
// without pulling in the bulky Firebase npm package, keeping the compiled web client extremely lightweight.

// TO ACTIVATE FIREBASE LIVE DATA: Change this flag to true and set your database URL below.
export const USE_FIREBASE = false;

// Set your Firebase Realtime Database REST URL (e.g., https://your-project-rtdb.firebaseio.com)
const FIREBASE_DB_URL = "https://hydrosmart-default-rtdb.firebaseio.com";

/**
 * Fetch the complete live telemetry payload from Firebase Realtime Database
 */
export async function getTelemetryFromFirebase() {
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/telemetry.json`);
    if (!response.ok) throw new Error("Firebase RTDB fetch failed");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("[Firebase Service] Error fetching telemetry:", error);
    return null;
  }
}

/**
 * Update a physical hardware override relay state in Firebase
 * @param {string} device - Name of the relay device (e.g., 'waterPump', 'growLights')
 * @param {boolean} state - Active state of the device (true = ON, false = OFF)
 */
export async function updateOverrideInFirebase(device, state) {
  if (!USE_FIREBASE) return { success: true };
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/telemetry/overrides.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [device]: state })
    });
    if (!response.ok) throw new Error("Firebase RTDB override update failed");
    return await response.json();
  } catch (error) {
    console.error(`[Firebase Service] Error updating override for ${device}:`, error);
    return null;
  }
}

/**
 * Set the active crop and growth stage in Firebase Realtime Database
 * @param {string} crop - Selected crop key (e.g., 'lettuce', 'pechay', 'spinach')
 * @param {string} stage - Crop growth stage (e.g., 'Seedling', 'Vegetative', 'Harvest')
 */
export async function selectCropInFirebase(crop, stage) {
  if (!USE_FIREBASE) return { success: true };
  try {
    const response = await fetch(`${FIREBASE_DB_URL}/telemetry.json`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activeCrop: crop, activeStage: stage })
    });
    if (!response.ok) throw new Error("Firebase RTDB crop selection failed");
    return await response.json();
  } catch (error) {
    console.error("[Firebase Service] Error setting crop profile:", error);
    return null;
  }
}
