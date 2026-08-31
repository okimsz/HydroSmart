import React, { useState, useEffect, useCallback } from 'react';
import {
  Battery, Zap, Sun, AlertTriangle, Activity, Cpu,
  Droplet, Thermometer, Wind, Leaf, ChevronRight, RefreshCw,
  Power, Monitor, Smartphone, Home, Camera, Search, Settings,
  User, Check, X, Maximize2, Plus, Calendar, Compass, BarChart2,
  Bell, HelpCircle, Info
} from 'lucide-react';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Area, AreaChart
} from 'recharts';
import {
  CROP_IMAGES, CROP_SPECIES, CROP_EMOJI, GREENHOUSE_SECTIONS,
  formatShortDate
} from '../shared/constants';
import {
  USE_FIREBASE, getTelemetryFromFirebase, updateOverrideInFirebase, selectCropInFirebase
} from '../shared/firebaseService';

const fallbackCropProfiles = {
  lettuce: { phMin: 5.5, phMax: 6.5, ecMin: 1.2, ecMax: 1.8, tempMin: 18, tempMax: 24, ratioA: 2.0, ratioB: 2.0 },
  pechay: { phMin: 6.0, phMax: 7.0, ecMin: 1.5, ecMax: 2.5, tempMin: 20, tempMax: 30, ratioA: 2.5, ratioB: 2.5 },
  spinach: { phMin: 6.0, phMax: 6.8, ecMin: 1.8, ecMax: 2.3, tempMin: 15, tempMax: 20, ratioA: 1.8, ratioB: 1.8 }
};

export default function DesktopDashboard() {
  // --- System Live State (Fetched from Backend API) ---
  const [sensors, setSensors] = useState({
    ph: 6.2, ec: 1.5, waterTemp: 21.5, airTemp: 24.5, humidity: 62, waterLevel: 85
  });
  const [energy, setEnergy] = useState({
    batterySoC: 78, solarVoltage: 18.4, solarCurrent: 1250, solarPower: 23.0,
    loadVoltage: 12.1, loadCurrent: 890, loadPower: 10.8,
    gridActive: false, chargingState: 'solar', loadShedding: false,
    pumpPriority: ['Water Pump', 'Grow Lights', 'Exhaust Fan', 'Peristaltic Pumps']
  });
  const [dosing, setDosing] = useState({
    nutrientA_ml: 2.4, nutrientB_ml: 1.8, phUp_ml: 0.0, phDown_ml: 0.6,
    mlpConfidence: 94.2, lastInference: new Date().toISOString(), manualOverride: false
  });
  const [overrides, setOverrides] = useState({
    waterPump: true, growLights: true, exhaustFan: false, dosingPumps: true
  });
  const [activeCrop, setActiveCrop] = useState('lettuce');
  const [activeStage, setActiveStage] = useState('Vegetative');
  const [cropProfile, setCropProfile] = useState(null);
  const [history, setHistory] = useState([]);
  const [connected, setConnected] = useState(true);

  // --- Scheduler & Settings Integration (from Mobile) ---
  const [selectedCropTab, setSelectedCropTab] = useState('lettuce');
  const [wateringDays, setWateringDays] = useState({
    M: true, T: false, W: true, T2: false, F: true, S: false, S2: false
  });
  const [wateringMode, setWateringMode] = useState('scheduled'); // 'auto', 'scheduled', 'manual'
  const [waterVolume, setWaterVolume] = useState(1500); // volume in mL
  const [wateringSlots, setWateringSlots] = useState([
    { id: 1, name: 'Morning Cycle', time: '07:00', duration: 15, volume: 1500, active: true },
    { id: 2, name: 'Evening Cycle', time: '17:00', duration: 15, volume: 1500, active: true }
  ]);
  const [isWateringNow, setIsWateringNow] = useState(false);
  const [manualTimeLeft, setManualTimeLeft] = useState(0);
  const [criticalAlerts, setCriticalAlerts] = useState(true);
  const [energySaver, setEnergySaver] = useState(false);
  const [dashboardTheme, setDashboardTheme] = useState('dark');

  // --- Editable Owner Info States ---
  const [ownerName, setOwnerName] = useState('Chyra San Juan');
  const [ownerRole, setOwnerRole] = useState('Owner & Smart Farm Lead');
  const [isEditingOwner, setIsEditingOwner] = useState(false);
  const [ownerAvatar, setOwnerAvatar] = useState('/images/cat1.jpg');
  const [ownerPhone, setOwnerPhone] = useState('+63 917 123 4567');
  const [ownerEmail, setOwnerEmail] = useState('chyra.sanjuan@hydrosmart.com');
  const [farmLocation, setFarmLocation] = useState('Muntinlupa City, Philippines');

  // --- UI Presentation State ---
  const [desktopTab, setDesktopTab] = useState('overview'); // 'overview' or 'map'

  // Selected Greenhouse Section
  const [activeSectionId, setActiveSectionId] = useState(3);

  // Dynamic Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Task Checklist state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Watering', desc: 'Water plants with 1.5L of water in the morning', time: '07:00 AM - 07:15 AM', completed: true },
    { id: 2, title: 'Fertilizing', desc: 'Apply organic fertilizer to base of plants. Quantity: 50g per plant', time: '08:00 AM - 08:30 AM', completed: true },
    { id: 3, title: 'Plant Inspection', desc: 'Check leaves for any signs of pests or yellowing', time: '10:00 AM - 11:00 AM', completed: false },
    { id: 4, title: 'Soil Aeration', desc: 'Loosen soil around the roots', time: '02:00 PM - 03:00 PM', completed: false }
  ]);

  // --- Clock Trigger ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- API Polling ---
  const fetchData = useCallback(async () => {
    try {
      let data;
      if (USE_FIREBASE) {
        data = await getTelemetryFromFirebase();
        if (!data) throw new Error("Could not retrieve telemetry from Firebase Realtime Database");
      } else {
        const res = await fetch('/api/telemetry');
        data = await res.json();
      }
      setSensors(data.sensors);
      setEnergy(data.energy);
      setDosing(data.dosing);
      setOverrides(data.overrides);
      setActiveCrop(data.activeCrop);
      setActiveStage(data.activeStage);
      setCropProfile(data.cropProfile || fallbackCropProfiles[data.activeCrop || 'lettuce']);
      setHistory(data.history || []);
      setConnected(true);
    } catch (e) {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2500);
    return () => clearInterval(interval);
  }, [fetchData]);

  // --- API Interactive Actions ---
  const selectCrop = async (crop) => {
    try {
      if (USE_FIREBASE) {
        await selectCropInFirebase(crop, activeStage);
      } else {
        await fetch('/api/crop-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crop, stage: activeStage })
        });
      }
      setActiveCrop(crop);
    } catch (e) { /* swallow */ }
  };

  // --- Watering Scheduler Actions ---
  const addWateringSlot = () => {
    const nextId = wateringSlots.length > 0 ? Math.max(...wateringSlots.map(s => s.id)) + 1 : 1;
    const newSlot = {
      id: nextId,
      name: `Cycle ${nextId}`,
      time: '12:00',
      duration: 10,
      volume: 1000,
      active: true
    };
    setWateringSlots([...wateringSlots, newSlot]);
  };

  const updateSlotField = (id, field, value) => {
    setWateringSlots(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteWateringSlot = (id) => {
    setWateringSlots(prev => prev.filter(s => s.id !== id));
  };

  const triggerManualWater = async () => {
    setIsWateringNow(true);
    setManualTimeLeft(10);

    // Turn ON physical ESP32 pump relay
    try {
      if (USE_FIREBASE) {
        await updateOverrideInFirebase('waterPump', true);
      } else {
        await fetch('/api/override', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ device: 'waterPump', state: true })
        });
      }
      setOverrides(prev => ({ ...prev, waterPump: true }));
    } catch (e) {
      console.error("Failed to turn on water pump:", e);
    }
  };

  useEffect(() => {
    if (manualTimeLeft <= 0) return;

    const interval = setInterval(async () => {
      setManualTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsWateringNow(false);
          // Turn OFF physical pump
          if (USE_FIREBASE) {
            updateOverrideInFirebase('waterPump', false).then(() => {
              setOverrides(prevOverrides => ({ ...prevOverrides, waterPump: false }));
            }).catch(err => console.error("Failed to turn off water pump:", err));
          } else {
            fetch('/api/override', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ device: 'waterPump', state: false })
            }).then(() => {
              setOverrides(prevOverrides => ({ ...prevOverrides, waterPump: false }));
            }).catch(err => console.error("Failed to turn off water pump:", err));
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [manualTimeLeft]);

  const getNextWateringText = () => {
    if (wateringMode === 'auto') {
      return 'Automatic (Sensor Controlled)';
    }
    if (wateringMode === 'manual') {
      return 'Manual Overrides Enabled';
    }

    const activeSlots = wateringSlots.filter(s => s.active);
    if (activeSlots.length === 0) return 'No cycles scheduled';

    const sorted = [...activeSlots].sort((a, b) => a.time.localeCompare(b.time));
    const now = new Date();
    const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let nextSlot = sorted.find(s => s.time.localeCompare(currentHourMin) > 0);
    let isTomorrow = false;

    if (!nextSlot) {
      nextSlot = sorted[0];
      isTomorrow = true;
    }

    const [h, m] = nextSlot.time.split(':').map(Number);
    const displayHour = h % 12 === 0 ? 12 : h % 12;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const timeStr = `${displayHour}:${String(m).padStart(2, '0')} ${ampm}`;

    return `${isTomorrow ? 'Tomorrow' : 'Today'} at ${timeStr} (${nextSlot.volume}mL)`;
  };

  // --- UI Helpers ---
  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getCompletedTasksCount = () => tasks.filter(t => t.completed).length;

  const getSectionHealthColor = (health) => {
    if (health >= 90) return 'good';
    if (health >= 70) return 'warning';
    return 'critical';
  };

  const getSectionSensors = (sectionId) => {
    const seed = sectionId * 1.5;
    return {
      ph: +(sensors.ph + (Math.sin(seed) * 0.15)).toFixed(1),
      ec: +(sensors.ec + (Math.cos(seed) * 0.1)).toFixed(2),
      humidity: Math.round(sensors.humidity + (Math.cos(seed) * 4)),
      waterLevel: Math.round(sensors.waterLevel + (Math.sin(seed * 2) * 3)),
      temperature: +(sensors.waterTemp + (Math.cos(seed * 1.5) * 1.2)).toFixed(1)
    };
  };

  const activeSectionData = GREENHOUSE_SECTIONS.find(s => s.id === activeSectionId);
  const activeSectionSensors = activeSectionData ? getSectionSensors(activeSectionData.id) : null;

  return (
    <div className={`app-container ${dashboardTheme === 'dark' ? 'phone-dark-mode' : ''}`}>
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-left">
          <img src="/logo.png" alt="Hydrosmart Logo" style={{ height: '46px', width: 'auto', marginRight: '8px', objectFit: 'contain' }} />
          <h1 className="brand-name">HydroSmart</h1>
        </div>


        <div className="header-right">
          <div className="system-status-indicator">
            <div className="status-indicator-dot" />
            <span>{connected ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
          </span>
        </div>
      </header>

      {/* ── DESKTOP DASHBOARD MODE ── */}
      <div className="desktop-layout">
        {/* Sidebar */}
        <nav className="desktop-sidebar">
          <button
            className={`sidebar-nav-item ${desktopTab === 'overview' ? 'active' : ''}`}
            onClick={() => setDesktopTab('overview')}
            title="Overview Dashboard"
          >
            <Home size={20} />
          </button>
          <button
            className={`sidebar-nav-item ${desktopTab === 'map' ? 'active' : ''}`}
            onClick={() => setDesktopTab('map')}
            title="Greenhouse Section Map"
          >
            <Compass size={20} />
          </button>
          <div className="sidebar-divider" />
          <button
            className={`sidebar-nav-item ${desktopTab === 'monitor' ? 'active' : ''}`}
            onClick={() => setDesktopTab('monitor')}
            title="Watering & Device Monitor"
          >
            <Cpu size={20} />
          </button>
          <button
            className={`sidebar-nav-item ${desktopTab === 'growth' ? 'active' : ''}`}
            onClick={() => setDesktopTab('growth')}
            title="Analytics & Growth Track"
          >
            <Activity size={20} />
          </button>
          <button
            className={`sidebar-nav-item ${desktopTab === 'settings' ? 'active' : ''}`}
            onClick={() => setDesktopTab('settings')}
            title="Settings & Calibrations"
          >
            <Settings size={20} />
          </button>
        </nav>

        {/* Content Pane */}
        <main className="desktop-content">
          {/* VIEW: OVERVIEW TAB */}
          {desktopTab === 'overview' && (
            <div className="dashboard-redesign-grid fade-in">
              {/* LEFT COLUMN */}
              <div className="dashboard-redesign-col">
                {/* Notification Banner */}
                <div className="dashboard-notification-banner">
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="notif-banner-badge-container">
                      <span className="notif-banner-days">14</span>
                      <span className="notif-banner-days-lbl">Days</span>
                    </div>
                    <div className="notif-banner-divider" />
                    <span className="notif-banner-text">
                      Watering cycle pending for your <span style={{ textTransform: 'capitalize' }}>{activeCrop}</span> plants. Harvest in 14 days.
                    </span>
                  </div>
                  <div className="notif-banner-icon-bg">
                    <Leaf size={16} style={{ color: '#5b8e3b' }} />
                  </div>
                </div>

                {/* Hero Banner Card */}
                <div className="hero-banner-card">
                  <div className="hero-banner-overlay" />
                  <div className="hero-hotspots-container">
                    <div className="floating-hotspot temp-hotspot">
                      <span className="hotspot-badge" title="Air Temperature Sensor"><Thermometer size={14} /></span>
                      <span className="hotspot-label">Temperature</span>
                      <div className="hotspot-connector" />
                    </div>
                    <div className="floating-hotspot light-hotspot">
                      <span className="hotspot-badge" title="EC Sensor Probe"><Sun size={14} /></span>
                      <span className="hotspot-label">Light</span>
                      <div className="hotspot-connector" />
                    </div>
                    <div className="floating-hotspot water-hotspot">
                      <span className="hotspot-badge" title="Ultrasonic Water Level Sensor"><Droplet size={14} /></span>
                      <span className="hotspot-label">Water</span>
                      <div className="hotspot-connector" />
                    </div>
                    <div className="floating-hotspot air-hotspot">
                      <span className="hotspot-badge" title="pH Sensor Probe"><Wind size={14} /></span>
                      <span className="hotspot-label">Air Circulation</span>
                      <div className="hotspot-connector" />
                    </div>
                  </div>

                  <div className="hero-banner-content">
                    <div className="hero-banner-title">
                      Revolutionize Your Yield with Smart Hydroponics
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
                      <button className="hero-banner-btn" onClick={() => setDesktopTab('map')}>
                        Get Started <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Crop Recommendations Row */}
                <div className="recommendation-section">
                  <div className="recommendation-section-title-row">
                    <h3 className="recommendation-section-title">
                      Suggested Crops
                    </h3>
                    <a href="#see-all" className="recommendation-see-all" onClick={(e) => { e.preventDefault(); setDesktopTab('map'); }}>see all</a>
                  </div>

                  <div className="recommendations-grid">
                    {['lettuce', 'pechay', 'spinach'].map(crop => (
                      <div
                        key={crop}
                        className={`recommendation-item-card ${activeCrop === crop ? 'active' : ''}`}
                        onClick={() => selectCrop(crop)}
                      >
                        <img src={CROP_IMAGES[crop]} className="recommendation-item-img" alt={crop} />
                        <div className="recommendation-item-info">
                          <span className="recommendation-item-name" style={{ textTransform: 'capitalize' }}>{crop}</span>
                          <span className="recommendation-item-species">({CROP_SPECIES[crop]})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 6-parameters grid */}
                <div className="parameters-grid">
                  <div className="param-card health-premium">
                    <div className="param-header-row">
                      <span className="param-label">Plant Health</span>
                      <div className="param-icon"><Leaf size={14} /></div>
                    </div>
                    <span className="param-value">94%</span>
                    <span className="param-info">The plants are showing excellent health status</span>
                  </div>

                  <div className="param-card">
                    <div className="param-header-row">
                      <span className="param-label">EC (Nutrients)</span>
                      <div className="param-icon"><Activity size={14} /></div>
                    </div>
                    <span className="param-value">{sensors.ec} <span style={{ fontSize: '12px', fontWeight: 500 }}>mS/cm</span></span>
                    <span className="param-info">Optimal EC range: {cropProfile?.targets?.ec?.min || 1.2}-{cropProfile?.targets?.ec?.max || 1.8} mS/cm</span>
                  </div>

                  <div className="param-card">
                    <div className="param-header-row">
                      <span className="param-label">Water Temp</span>
                      <div className="param-icon"><Thermometer size={14} /></div>
                    </div>
                    <span className="param-value">{sensors.waterTemp}°C</span>
                    <span className="param-info">DS18B20 Water Temperature Probe</span>
                  </div>

                  <div className="param-card">
                    <div className="param-header-row">
                      <span className="param-label">pH Level</span>
                      <div className="param-icon"><Droplet size={14} /></div>
                    </div>
                    <span className="param-value">{sensors.ph}</span>
                    <span className="param-info">Analog pH Sensor probe readings</span>
                  </div>

                  <div className="param-card">
                    <div className="param-header-row">
                      <span className="param-label">Air Temp / Humid</span>
                      <div className="param-icon"><Wind size={14} /></div>
                    </div>
                    <span className="param-value" style={{ fontSize: '20px', marginTop: '4px' }}>
                      {sensors.airTemp}°C / {sensors.humidity}%
                    </span>
                    <span className="param-info">DHT22 Ambient Environment Sensor</span>
                  </div>

                  <div className="param-card">
                    <div className="param-header-row">
                      <span className="param-label">Water Level</span>
                      <div className="param-icon"><Droplet size={14} /></div>
                    </div>
                    <span className="param-value">{sensors.waterLevel}%</span>
                    <span className="param-info">Ultrasonic Water Tank Level Sensor</span>
                  </div>
                </div>

                {/* INA219 Energy Monitor */}
                <div className="energy-monitor-card">
                  <div className="energy-header">
                    <div className="energy-title">
                      <Zap size={16} style={{ color: 'var(--amber)' }} />
                      <span>INA219 Solar & Battery Energy Monitor</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                      {energy.gridActive ? 'GRID BYPASS' : 'SOLAR HYBRID ACTIVE'}
                    </span>
                  </div>
                  <span className="energy-subtitle">Integrated INA219 current & voltage sensor tracking solar harvesting, consumption, and battery state</span>

                  <div className="energy-grid">
                    <div className="energy-card-sub">
                      <div className="energy-sub-title" style={{ color: 'var(--amber)' }}>
                        <Sun size={14} /> Solar Harvesting (INA219)
                      </div>
                      <div className="energy-metrics-list">
                        <div className="energy-metric-row">
                          <span className="energy-metric-label">Voltage</span>
                          <span className="energy-metric-val">{energy.solarVoltage.toFixed(1)} V</span>
                        </div>
                        <div className="energy-metric-row">
                          <span className="energy-metric-label">Current</span>
                          <span className="energy-metric-val">{(energy.solarCurrent / 1000).toFixed(2)} A</span>
                        </div>
                        <div className="energy-metric-row" style={{ borderTop: '1px dotted var(--border-color)', paddingTop: '4px', marginTop: '2px' }}>
                          <span className="energy-metric-label" style={{ fontWeight: 600 }}>Harvest Power</span>
                          <span className="energy-metric-val" style={{ color: 'var(--amber)' }}>{energy.solarPower.toFixed(1)} W</span>
                        </div>
                      </div>
                    </div>

                    <div className="energy-card-sub">
                      <div className="energy-sub-title" style={{ color: 'var(--blue)' }}>
                        <Cpu size={14} /> System Load (INA219)
                      </div>
                      <div className="energy-metrics-list">
                        <div className="energy-metric-row">
                          <span className="energy-metric-label">Voltage</span>
                          <span className="energy-metric-val">{energy.loadVoltage.toFixed(1)} V</span>
                        </div>
                        <div className="energy-metric-row">
                          <span className="energy-metric-label">Current</span>
                          <span className="energy-metric-val">{(energy.loadCurrent / 1000).toFixed(2)} A</span>
                        </div>
                        <div className="energy-metric-row" style={{ borderTop: '1px dotted var(--border-color)', paddingTop: '4px', marginTop: '2px' }}>
                          <span className="energy-metric-label" style={{ fontWeight: 600 }}>Load Power</span>
                          <span className="energy-metric-val" style={{ color: 'var(--blue)' }}>{energy.loadPower.toFixed(1)} W</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="battery-status-bar">
                    <div className="battery-visual-container">
                      <div className="battery-icon-simulated">
                        <div
                          className="battery-level-fill"
                          style={{
                            width: `${energy.batterySoC}%`,
                            background: energy.batterySoC >= 50 ? 'var(--primary)' : energy.batterySoC >= 20 ? 'var(--amber)' : 'var(--red)'
                          }}
                        />
                      </div>
                    </div>
                    <div className="battery-text-info">
                      <span className="battery-percent">{Math.round(energy.batterySoC)}% Capacity</span>
                      <div className={`battery-charging-status ${energy.chargingState === 'discharging' ? 'discharging' : ''}`}>
                        {energy.chargingState === 'solar' && '⚡ SOLAR CHARGING ACTIVE'}
                        {energy.chargingState === 'grid' && '🔌 GRID CHARGING ACTIVE'}
                        {energy.chargingState === 'discharging' && '⚠️ DISCHARGING (BATTERY RUNNING)'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN */}
              <div className="dashboard-redesign-col">
                {/* Weather Widget */}
                <div className="panel-card weather-widget">
                  <div className="weather-header">
                    <div className="drawer-title-group">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="weather-location">{farmLocation}</span>
                      </div>
                      <span className="weather-date">{formatShortDate(currentTime)}</span>
                    </div>
                    <span style={{ fontSize: '20px' }}>☀️</span>
                  </div>
                  <div className="weather-main">
                    <div className="weather-temp-container">
                      <span className="weather-temp">{Math.round(sensors.airTemp)}</span>
                      <span className="weather-temp-unit">°C</span>
                    </div>
                    <div className="weather-icon-desc">
                      <div className="weather-desc">Sunny</div>
                      <div className="weather-minmax">H: 34°C &nbsp; L: 24°C</div>
                    </div>
                  </div>
                  <div className="garden-info-banner">
                    <div className="garden-banner-item">
                      <span className="garden-banner-label">Active Crop</span>
                      <span className="garden-banner-val" style={{ textTransform: 'capitalize' }}>{activeCrop}</span>
                    </div>
                    <div className="garden-banner-item" style={{ alignItems: 'flex-end' }}>
                      <span className="garden-banner-label">Growth Stage</span>
                      <span className="garden-banner-val">{activeStage}</span>
                    </div>
                  </div>
                </div>

                {/* MLP Dosing Control */}
                <div className="panel-card">
                  <div className="panel-card-title">
                    <span>MLP Dosing Control</span>
                    <span style={{ fontSize: '11px', color: 'var(--blue)', fontWeight: 600 }}>v2.1-NEURAL</span>
                  </div>
                  <span className="panel-card-subtitle">Neural network peristaltic pump controller</span>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
                    <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)' }}>NUTRIENT A</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--primary)', marginTop: '2px' }}>
                        {dosing.nutrientA_ml} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>mL</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)' }}>NUTRIENT B</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--blue)', marginTop: '2px' }}>
                        {dosing.nutrientB_ml} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>mL</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)' }}>pH-UP</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--amber)', marginTop: '2px' }}>
                        {dosing.phUp_ml} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>mL</span>
                      </div>
                    </div>
                    <div style={{ background: 'var(--bg-card-hover)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)' }}>pH-DOWN</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--red)', marginTop: '2px' }}>
                        {dosing.phDown_ml} <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)' }}>mL</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '10px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-main)' }}>MLP Confidence</span>
                      <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>Inference accuracy</span>
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--primary)' }}>{dosing.mlpConfidence}%</span>
                  </div>
                </div>

                {/* Telemetry Nodes & Sensors */}
                <div className="panel-card">
                  <div className="panel-card-title">
                    <span>Telemetry Nodes & Sensors</span>
                    <RefreshCw size={14} className="pointer-cursor text-tertiary" onClick={fetchData} />
                  </div>
                  <span className="panel-card-subtitle">List of active sensors and controllers</span>

                  <div className="devices-list">
                    <div className="device-row">
                      <div className="device-info">
                        <div className="device-avatar"><Cpu size={16} /></div>
                        <div className="device-details">
                          <span className="device-name">ESP32 Node</span>
                          <span className="device-sub">Sensor Hub • Active</span>
                        </div>
                      </div>
                      <div className="device-status-badge"><div className="device-status-dot active" /></div>
                    </div>
                    <div className="device-row">
                      <div className="device-info">
                        <div className="device-avatar"><Droplet size={16} /></div>
                        <div className="device-details">
                          <span className="device-name">Analog EC Sensor Probe</span>
                          <span className="device-sub">#EC2015 • Active</span>
                        </div>
                      </div>
                      <div className="device-status-badge"><div className="device-status-dot active" /></div>
                    </div>
                    <div className="device-row">
                      <div className="device-info">
                        <div className="device-avatar"><Droplet size={16} /></div>
                        <div className="device-details">
                          <span className="device-name">Analog pH Sensor Probe</span>
                          <span className="device-sub">#PH6012 • Active</span>
                        </div>
                      </div>
                      <div className="device-status-badge"><div className="device-status-dot active" /></div>
                    </div>
                    <div className="device-row warning-state">
                      <div className="device-info">
                        <div className="device-avatar" style={{ background: 'var(--amber-glow)', color: 'var(--amber)' }}><Thermometer size={16} /></div>
                        <div className="device-details">
                          <span className="device-name">DHT22 Ambient Sensor</span>
                          <span className="device-sub">Replacement in 22h 30m</span>
                        </div>
                      </div>
                      <div className="device-status-badge" style={{ color: 'var(--amber)' }}>
                        <span>Warn</span>
                        <div className="device-status-dot warn" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tasks List */}
                <div className="panel-card">
                  <div className="task-header">
                    <div className="drawer-title-group">
                      <span className="drawer-title" style={{ fontSize: '15px' }}>Task Checklist</span>
                      <span className="drawer-subtitle">Manage daily greenhouse tasks</span>
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)' }}>
                      {Math.round((getCompletedTasksCount() / tasks.length) * 100)}% Completed
                    </span>
                  </div>

                  <div className="task-progress-bar-container">
                    <div
                      className="task-progress-bar-fill"
                      style={{ width: `${(getCompletedTasksCount() / tasks.length) * 100}%` }}
                    />
                  </div>

                  <div className="task-list">
                    {tasks.map(t => (
                      <div className={`task-item ${t.completed ? 'completed' : ''}`} key={t.id}>
                        <div className="task-item-left">
                          <div className="task-checkbox-wrapper">
                            <div
                              className={`task-checkbox ${t.completed ? 'checked' : ''}`}
                              onClick={() => toggleTask(t.id)}
                            >
                              {t.completed && <Check size={10} />}
                            </div>
                          </div>
                          <div className="task-details">
                            <span className="task-title">{t.title}</span>
                            <span className="task-desc">{t.desc}</span>
                          </div>
                        </div>
                        <span className="task-time">{t.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GREENHOUSE MAP TAB */}
          {desktopTab === 'map' && (
            <div className="map-view-container fade-in">
              {/* Left Panel: Overall Health */}
              <div className="map-left-panel">
                <div className="overall-health-card">
                  <div className="overall-health-number">92%</div>
                  <div className="overall-health-details">
                    <span className="overall-health-badge">Good Health</span>
                    <div className="overall-health-desc">Crops are growing normally and showing stable nutrient absorption.</div>
                  </div>
                </div>

                <div className="sections-list">
                  {GREENHOUSE_SECTIONS.map(s => {
                    const computedHealth = s.id === 4 ? 41 : (s.id === 2 || s.id === 7 ? 75 : s.baseHealth);
                    const healthColor = getSectionHealthColor(computedHealth);
                    return (
                      <div
                        className={`section-item-row ${activeSectionId === s.id ? 'active' : ''}`}
                        key={s.id}
                        onClick={() => setActiveSectionId(s.id)}
                      >
                        <div>
                          <div className="section-item-name">{s.name}</div>
                          <div className="section-item-crop">
                            {s.cropKey.charAt(0).toUpperCase() + s.cropKey.slice(1)} • {s.area}
                          </div>
                        </div>
                        <span className={`section-health-badge ${healthColor}`}>
                          {computedHealth}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Center Panel: Greenhouse Image Hotspots */}
              <div className="map-canvas-container">
                <div className="map-canvas-header">
                  <div className="drawer-title-group">
                    <span className="drawer-title" style={{ fontSize: '15px' }}>Greenhouse Layout Map</span>
                    <span className="drawer-subtitle">Click markers to overlay section parameters</span>
                  </div>
                </div>

                <div className="map-canvas-view">
                  <img src="/images/hydro-bg.jpg" className="map-bg-image" alt="Greenhouse Map background" />

                  {GREENHOUSE_SECTIONS.map(s => {
                    const computedHealth = s.id === 4 ? 41 : (s.id === 2 || s.id === 7 ? 75 : s.baseHealth);
                    const healthColor = getSectionHealthColor(computedHealth);
                    return (
                      <div
                        key={s.id}
                        className={`map-hotspot ${activeSectionId === s.id ? 'active' : ''} health-${healthColor}`}
                        style={{ left: `${s.x}%`, top: `${s.y}%` }}
                        onClick={() => setActiveSectionId(s.id)}
                      >
                        {s.id}
                        {activeSectionId === s.id && (
                          <span className="map-hotspot-label">{s.name}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Panel: Detail Panel Drawer */}
              <div className="map-right-panel">
                {activeSectionData && activeSectionSensors && (
                  <div className="section-drawer-card fade-in">
                    <div className="drawer-header">
                      <div className="drawer-title-group">
                        <span className="drawer-title">{activeSectionData.name}</span>
                        <span className="drawer-subtitle">{CROP_SPECIES[activeSectionData.cropKey]}</span>
                      </div>
                      <button className="drawer-close-btn" onClick={() => setActiveSectionId(null)}><X size={12} /></button>
                    </div>

                    <div className="drawer-stat-row">
                      <span className="drawer-stat-label">Species</span>
                      <span className="drawer-stat-value">
                        {activeSectionData.cropKey.charAt(0).toUpperCase() + activeSectionData.cropKey.slice(1)}
                      </span>
                    </div>

                    <div className="drawer-stat-row">
                      <span className="drawer-stat-label">Section Health</span>
                      <span className={`drawer-stat-value health-text ${getSectionHealthColor(activeSectionData.id === 4 ? 41 : activeSectionData.baseHealth)}`}>
                        {activeSectionData.id === 4 ? '41% - Critical' : activeSectionData.id === 2 || activeSectionData.id === 7 ? '75% - Warning' : `${activeSectionData.baseHealth}% - Good`}
                      </span>
                    </div>

                    <div className="drawer-stat-row">
                      <span className="drawer-stat-label">Coverage Area</span>
                      <span className="drawer-stat-value">{activeSectionData.area}</span>
                    </div>

                    <div className="drawer-stat-row">
                      <span className="drawer-stat-label">Last Watered</span>
                      <span className="drawer-stat-value">19/09/2024</span>
                    </div>

                    <div className="drawer-stat-row">
                      <span className="drawer-stat-label">Fertilization Planned</span>
                      <span className="drawer-stat-value" style={{ color: 'var(--amber)', fontWeight: 600 }}>20/09/2024 - Hi-Fos</span>
                    </div>

                    {/* Parameters Grid */}
                    <div style={{ marginTop: '10px' }}>
                      <h4 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
                        Real-time Readings
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span className="text-secondary">pH Level</span>
                          <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{activeSectionSensors.ph}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span className="text-secondary">EC Value</span>
                          <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{activeSectionSensors.ec} mS/cm</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span className="text-secondary">Water Level</span>
                          <span style={{ fontWeight: 700 }}>{activeSectionSensors.waterLevel}%</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                          <span className="text-secondary">Water Temp</span>
                          <span style={{ fontWeight: 700 }}>{activeSectionSensors.temperature}°C</span>
                        </div>
                      </div>
                    </div>

                    {/* Hardware details */}
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px', marginTop: '6px' }}>
                      <h4 style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        System Nodes
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Central Hub</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>Pi Zero 2 W</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Sensor Node</span>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>ESP32</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* VIEW: MONITOR TAB */}
          {desktopTab === 'monitor' && (
            <div className="map-view-container fade-in">
              {/* Left Panel: Crop List & Selected Crop Details */}
              <div className="map-left-panel">
                {/* Crop Monitor Header */}
                <div className="panel-card" style={{ gap: '8px', padding: '20px' }}>
                  <div className="panel-card-title">
                    <span>Hydroponic Monitor</span>
                    <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>NFT System</span>
                  </div>
                  <span className="panel-card-subtitle" style={{ margin: 0 }}>Monitor and schedule nutrients & watering for active crops</span>
                </div>

                {/* Crop list */}
                <div className="sections-list">
                  {['lettuce', 'pechay', 'spinach'].map(crop => (
                    <div
                      key={crop}
                      className={`section-item-row ${selectedCropTab === crop ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedCropTab(crop);
                        selectCrop(crop);
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={CROP_IMAGES[crop]} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} alt={crop} />
                        <div>
                          <div className="section-item-name" style={{ textTransform: 'capitalize' }}>{crop} Plant</div>
                          <div className="section-item-crop" style={{ fontStyle: 'italic' }}>{CROP_SPECIES[crop]}</div>
                        </div>
                      </div>
                      <span className="section-health-badge good">94% Health</span>
                    </div>
                  ))}
                </div>

                {/* Selected Crop Detail Panel */}
                <div className="section-drawer-card" style={{ padding: '20px', gap: '16px' }}>
                  <div className="drawer-header" style={{ paddingBottom: '12px' }}>
                    <div className="drawer-title-group">
                      <span className="drawer-title" style={{ textTransform: 'capitalize', fontSize: '16px' }}>
                        {selectedCropTab} Detail Profile
                      </span>
                      <span className="drawer-subtitle">{CROP_SPECIES[selectedCropTab]}</span>
                    </div>
                    <span className="overall-health-badge" style={{ fontSize: '10px' }}>{activeStage} Stage</span>
                  </div>

                  <div className="drawer-stat-row" style={{ padding: '6px 0' }}>
                    <span className="drawer-stat-label">Species</span>
                    <span className="drawer-stat-value" style={{ fontStyle: 'italic' }}>{CROP_SPECIES[selectedCropTab]}</span>
                  </div>

                  <div className="drawer-stat-row" style={{ padding: '6px 0' }}>
                    <span className="drawer-stat-label">Age</span>
                    <span className="drawer-stat-value">34 Days (from seed)</span>
                  </div>

                  <div className="drawer-stat-row" style={{ padding: '6px 0' }}>
                    <span className="drawer-stat-label">Estimated Water Flow</span>
                    <span className="drawer-stat-value">43 mL/h</span>
                  </div>

                  <div className="drawer-stat-row" style={{ padding: '6px 0' }}>
                    <span className="drawer-stat-label">EC Target (Optimal)</span>
                    <span className="drawer-stat-value" style={{ color: 'var(--blue)' }}>
                      {cropProfile?.targets?.ec?.optimal || 1.5} mS/cm
                    </span>
                  </div>

                  <div className="drawer-stat-row" style={{ padding: '6px 0' }}>
                    <span className="drawer-stat-label">pH Target (Optimal)</span>
                    <span className="drawer-stat-value" style={{ color: 'var(--primary)' }}>
                      {cropProfile?.targets?.ph?.optimal || 6.0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Panel */}
              <div className="map-canvas-container" style={{ gridColumn: 'span 2', display: 'flex', flexDirection: 'column' }}>
                <div className="map-canvas-header" style={{ padding: '16px 20px' }}>
                  <div className="drawer-title-group">
                    <span className="drawer-title" style={{ fontSize: '15px' }}>Advanced Watering Scheduler</span>
                    <span className="drawer-subtitle">Configure automated timing, custom cycles, and volume outputs</span>
                  </div>
                </div>

                <div className="panel-card" style={{ border: 'none', boxShadow: 'none', background: 'transparent', flex: 1, padding: '20px', gap: '20px', overflowY: 'auto' }}>
                  {/* Countdown banner */}
                  <div style={{
                    background: 'var(--primary-glow)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px'
                  }}>
                    <Calendar size={20} style={{ color: 'var(--primary)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Next Cycle Breakdown</span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-main)' }}>{getNextWateringText()}</span>
                    </div>
                  </div>

                  {/* Mode Tabs */}
                  <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-main)', padding: '5px', borderRadius: '10px', border: '1px solid var(--border-color)', maxWidth: '400px' }}>
                    {['auto', 'scheduled', 'manual'].map(mode => (
                      <button
                        key={mode}
                        style={{
                          flex: 1,
                          border: 'none',
                          background: wateringMode === mode ? 'var(--primary)' : 'transparent',
                          color: wateringMode === mode ? 'white' : 'var(--text-secondary)',
                          padding: '8px 16px',
                          fontSize: '12px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textTransform: 'capitalize',
                          transition: 'all 0.15s ease'
                        }}
                        onClick={() => setWateringMode(mode)}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>

                  {/* Scheduled Mode Section */}
                  {wateringMode === 'scheduled' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="fade-in">
                      {/* Weekday selector */}
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Active Calendar Days</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {Object.entries(wateringDays).map(([dayKey, active]) => {
                            const label = dayKey.replace(/[0-9]/g, '');
                            return (
                              <button
                                key={dayKey}
                                className={`sim-btn ${active ? 'active' : ''}`}
                                style={{
                                  width: '40px',
                                  height: '40px',
                                  borderRadius: '50%',
                                  padding: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontWeight: 700,
                                  fontSize: '13px',
                                  background: active ? 'var(--primary)' : 'var(--bg-card)',
                                  color: active ? 'white' : 'var(--text-main)',
                                  borderColor: active ? 'var(--primary)' : 'var(--border-color)',
                                }}
                                onClick={() => setWateringDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }))}
                              >
                                {label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Cycles List */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Configured Cycle Slots</span>
                          <button
                            onClick={addWateringSlot}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              color: 'var(--primary)',
                              fontSize: '12px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              cursor: 'pointer'
                            }}
                          >
                            <Plus size={14} /> Add Cycle
                          </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                          {wateringSlots.map(slot => (
                            <div
                              key={slot.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                background: 'var(--bg-card-hover)',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <label className="sim-switch">
                                    <input
                                      type="checkbox"
                                      checked={slot.active}
                                      onChange={() => updateSlotField(slot.id, 'active', !slot.active)}
                                    />
                                    <span className="sim-slider"></span>
                                  </label>
                                  <input
                                    type="text"
                                    value={slot.name}
                                    onChange={(e) => updateSlotField(slot.id, 'name', e.target.value)}
                                    style={{
                                      background: 'transparent',
                                      border: 'none',
                                      fontSize: '14px',
                                      fontWeight: 700,
                                      color: 'var(--text-main)',
                                      width: '120px',
                                      padding: '2px 0',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => deleteWateringSlot(slot.id)}
                                  style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                >
                                  <X size={16} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', opacity: slot.active ? 1 : 0.5 }}>
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)' }}>START TIME</span>
                                  <input
                                    type="time"
                                    value={slot.time}
                                    onChange={(e) => updateSlotField(slot.id, 'time', e.target.value)}
                                    disabled={!slot.active}
                                    style={{
                                      background: 'var(--bg-panel)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%',
                                      outline: 'none'
                                    }}
                                  />
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)' }}>DURATION</span>
                                  <select
                                    value={slot.duration}
                                    onChange={(e) => updateSlotField(slot.id, 'duration', Number(e.target.value))}
                                    disabled={!slot.active}
                                    style={{
                                      background: 'var(--bg-panel)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%',
                                      outline: 'none'
                                    }}
                                  >
                                    <option value={5}>5 mins</option>
                                    <option value={10}>10 mins</option>
                                    <option value={15}>15 mins</option>
                                    <option value={20}>20 mins</option>
                                    <option value={30}>30 mins</option>
                                  </select>
                                </div>

                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-tertiary)' }}>VOLUME (mL)</span>
                                  <input
                                    type="number"
                                    min={100}
                                    max={5000}
                                    step={100}
                                    value={slot.volume}
                                    onChange={(e) => updateSlotField(slot.id, 'volume', Number(e.target.value))}
                                    disabled={!slot.active}
                                    style={{
                                      background: 'var(--bg-panel)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      padding: '6px 8px',
                                      fontSize: '12px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%',
                                      outline: 'none'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Auto Mode Section */}
                  {wateringMode === 'auto' && (
                    <div style={{ padding: '16px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }} className="fade-in">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '8px', fontSize: '14px' }}>
                        <Zap size={16} /> Sensor-Driven Feedback Control Active
                      </div>
                      Watering cycles are automatically regulated using live telemetry.
                      The physical water pump will engage when the ultrasonic water tank level drops below <b>45%</b> or when soil humidity sensors register below optimal crop target settings.
                    </div>
                  )}

                  {/* Manual Mode Section */}
                  {wateringMode === 'manual' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border-color)', gap: '16px' }} className="fade-in">
                      {isWateringNow ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', color: 'var(--primary)', width: '100%' }}>
                          <div style={{
                            position: 'relative',
                            width: '100px',
                            height: '100px',
                            borderRadius: '50%',
                            background: 'var(--primary-glow)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '3px solid var(--primary)',
                            boxShadow: '0 0 20px var(--primary-glow)'
                          }}>
                            <span style={{ fontSize: '40px', animation: 'bounce 1s infinite alternate' }}>💧</span>
                            <div style={{
                              position: 'absolute',
                              bottom: '-8px',
                              background: 'var(--primary)',
                              color: 'white',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '12px'
                            }}>
                              {manualTimeLeft}s left
                            </div>
                          </div>
                          <div style={{ textAlign: 'center' }}>
                            <span style={{ fontWeight: 800, display: 'block', fontSize: '16px', color: 'var(--text-main)' }}>Dispensing Nutrient Solution</span>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'block' }}>Delivering {waterVolume}mL to active grow channels</span>
                          </div>
                        </div>
                      ) : (
                        <button
                          className="sim-btn"
                          style={{
                            padding: '14px 28px',
                            borderRadius: '30px',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            fontSize: '14px',
                            fontWeight: 700,
                            boxShadow: '0 6px 16px rgba(16, 185, 129, 0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer'
                          }}
                          onClick={triggerManualWater}
                        >
                          💧 Water {selectedCropTab.toUpperCase()} Now
                        </button>
                      )}
                    </div>
                  )}

                  {/* Volume Slider */}
                  {wateringMode !== 'auto' && (
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px', marginTop: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                        <span>WATER VOLUME PER CYCLE</span>
                        <span style={{ color: 'var(--primary)' }}>{(waterVolume / 1000).toFixed(1)}L ({waterVolume} mL)</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <span style={{ fontSize: '14px' }}>💧</span>
                        <input
                          type="range"
                          min="500"
                          max="3000"
                          step="250"
                          value={waterVolume}
                          onChange={(e) => setWaterVolume(Number(e.target.value))}
                          style={{ flex: 1, accentColor: 'var(--primary)', height: '6px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '18px' }}>🪣</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* VIEW: GROWTH TAB */}
          {desktopTab === 'growth' && (
            <div className="map-view-container fade-in" style={{ gridTemplateColumns: '1fr 340px' }}>
              {/* Left Panel: Recharts Analytics Growth Curve */}
              <div className="map-canvas-container" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="growth-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>
                      {selectedCropTab.toUpperCase()} GROWTH PROGRESSION
                    </h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>Interactive height tracking and staging index analytics</p>
                  </div>
                  <div className="growth-toggle-period" style={{ display: 'flex', background: '#f3f4f6', padding: '3px', borderRadius: '8px' }}>
                    <span className="growth-period-btn" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}>Day</span>
                    <span className="growth-period-btn active" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer', background: 'white', fontWeight: 600, boxShadow: 'var(--shadow-sm)' }}>Week</span>
                    <span className="growth-period-btn" style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px', cursor: 'pointer' }}>Month</span>
                  </div>
                </div>

                <div style={{ flex: 1, minHeight: '300px', background: 'var(--bg-card-hover)', borderRadius: '12px', border: '1px solid var(--border-color)', padding: '20px 20px 0 20px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { name: 'Week 1', height: 2 },
                        { name: 'Week 2', height: 8 },
                        { name: 'Week 3', height: 16 },
                        { name: 'Week 4', height: 24 }
                      ]}
                      margin={{ top: 10, right: 10, left: -20, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#94a3b8', fontSize: '12px', fontWeight: 500 } }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="height" stroke="var(--primary)" strokeWidth={3} activeDot={{ r: 8 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Right Panel: Growth Diagnostics */}
              <div className="map-right-panel">
                <div className="panel-card" style={{ gap: '14px' }}>
                  <div className="panel-card-title">Staging Diagnostics</div>
                  <span className="panel-card-subtitle">AI Diagnostic Insights</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>🌱</span>
                      <span>Your crop is currently indexing at the <b>{activeStage}</b> stage.</span>
                    </div>
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>🧪</span>
                      <span>The Neural Dosing MLP network recommends maintaining a target EC of <b>{cropProfile?.targets?.ec?.min || 1.2}–{cropProfile?.targets?.ec?.max || 1.8} mS/cm</b> to avoid crop tipburn.</span>
                    </div>
                    <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '10px', display: 'flex', gap: '10px' }}>
                      <span style={{ fontSize: '16px' }}>☀️</span>
                      <span>Maintain stable ambient environments (DHT22 sensor reads) between 20°C and 25°C for maximum leaf volume development.</span>
                    </div>
                  </div>
                </div>

                <div className="panel-card" style={{ padding: '20px', gap: '12px' }}>
                  <span className="panel-card-title">Yield Projection</span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                    <span style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)' }}>14 Days</span>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Until Harvest</span>
                  </div>
                  <span className="panel-info">Projected yield weight: ~240g/head base crop spacing profile index.</span>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: SETTINGS TAB */}
          {desktopTab === 'settings' && (
            <div className="map-view-container fade-in" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Left Column: Profile & NFT Hardware Specs */}
              <div className="map-left-panel" style={{ overflowY: 'auto' }}>
                {/* Profile Card */}
                <div className="panel-card" style={{ gap: '16px', padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div className="profile-avatar-container" style={{ position: 'relative' }}>
                      <div className="profile-avatar" style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#3b82f6', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '20px', overflow: 'hidden', position: 'relative' }}>
                        <span style={{ position: 'absolute', zIndex: 1 }}>
                          {ownerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </span>
                        {ownerAvatar && (
                          <img
                            src={ownerAvatar}
                            alt={ownerName}
                            onError={(e) => { e.target.style.display = 'none'; }}
                            style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2, top: 0, left: 0 }}
                          />
                        )}
                      </div>
                      {isEditingOwner && (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setOwnerAvatar(reader.result);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            style={{ display: 'none' }}
                            id="avatar-upload-input"
                          />
                          <label htmlFor="avatar-upload-input" style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            background: 'var(--primary)',
                            color: 'white',
                            width: '22px',
                            height: '22px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '11px',
                            cursor: 'pointer',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                            border: '2px solid white'
                          }} title="Change Photo">
                            📷
                          </label>
                        </>
                      )}
                      {!isEditingOwner && (
                        <div className="profile-badge-online" style={{ position: 'absolute', bottom: 0, right: 0, width: '14px', height: '14px', background: 'var(--primary)', border: '2px solid white', borderRadius: '50%' }} />
                      )}
                    </div>

                    {!isEditingOwner ? (
                      <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)' }}>{ownerName}</span>
                        <span style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{ownerRole}</span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                        <input
                          type="text"
                          value={ownerName}
                          onChange={(e) => setOwnerName(e.target.value)}
                          placeholder="Owner Name"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '13px',
                            color: 'var(--text-main)',
                            fontWeight: 700,
                            outline: 'none',
                            width: '100%'
                          }}
                        />
                        <input
                          type="text"
                          value={ownerRole}
                          onChange={(e) => setOwnerRole(e.target.value)}
                          placeholder="Role"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: 'var(--text-secondary)',
                            fontWeight: 500,
                            outline: 'none',
                            width: '100%'
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {!isEditingOwner ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Location</span>
                        <span style={{ fontWeight: 600 }}>{farmLocation}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Contact Number</span>
                        <span style={{ fontWeight: 600 }}>{ownerPhone}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span className="text-secondary">Email Address</span>
                        <span style={{ fontWeight: 600 }}>{ownerEmail}</span>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Location</span>
                        <input
                          type="text"
                          value={farmLocation}
                          onChange={(e) => setFarmLocation(e.target.value)}
                          placeholder="Location (e.g. Muntinlupa City, Philippines)"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: 'var(--text-main)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Contact Number</span>
                        <input
                          type="text"
                          value={ownerPhone}
                          onChange={(e) => setOwnerPhone(e.target.value)}
                          placeholder="Contact Number"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: 'var(--text-main)',
                            outline: 'none'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Email Address</span>
                        <input
                          type="email"
                          value={ownerEmail}
                          onChange={(e) => setOwnerEmail(e.target.value)}
                          placeholder="Email Address"
                          style={{
                            background: 'var(--bg-panel)',
                            border: '1px solid var(--border-color)',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: 'var(--text-main)',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                    {!isEditingOwner ? (
                      <button
                        onClick={() => setIsEditingOwner(true)}
                        className="sim-btn"
                        style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '15px' }}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingOwner(false)}
                        className="sim-btn"
                        style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '15px', background: 'var(--primary)', color: 'white', borderColor: 'var(--primary)' }}
                      >
                        Save Profile
                      </button>
                    )}
                  </div>
                </div>

                {/* NFT Hardware specs */}
                <div className="panel-card" style={{ gap: '16px' }}>
                  <div className="panel-card-title">NFT Hydroponics Setup Configuration</div>
                  <span className="panel-card-subtitle">Live hardware telemetry details</span>

                  <div style={{ width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}>
                    <img src="/images/hydro-system.jpg" style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Hydroponics System Rig" />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.7))' }} />
                    <div style={{ position: 'absolute', bottom: '12px', left: '16px', color: 'white' }}>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700 }}>Block A - NFT System</h4>
                      <p style={{ margin: '2px 0 0 0', fontSize: '11px', opacity: 0.8 }}>Active smart hydroponics channels</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span className="text-secondary">Main Controller</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>Raspberry Pi Zero 2 W</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span className="text-secondary">Sensor Node</span>
                      <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>ESP32-WROOM-32D</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                      <span className="text-secondary">Telemetry Modules</span>
                      <span style={{ fontWeight: 600 }}>INA219 Power, DHT22, pH, EC</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="text-secondary">Power Source</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>Solar-Grid Hybrid</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column: Preferences & Calibration */}
              <div className="map-right-panel" style={{ overflowY: 'auto' }}>
                {/* System Preferences Card */}
                <div className="panel-card" style={{ gap: '16px' }}>
                  <div className="panel-card-title">System Preferences</div>
                  <span className="panel-card-subtitle">Configure notification and power alerts</span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Theme Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Dark Theme Mode</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Enable/disable simulator color scheme</span>
                      </div>
                      <label className="sim-switch">
                        <input
                          type="checkbox"
                          checked={dashboardTheme === 'dark'}
                          onChange={() => setDashboardTheme(dashboardTheme === 'light' ? 'dark' : 'light')}
                        />
                        <span className="sim-slider"></span>
                      </label>
                    </div>

                    {/* Alerts toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Critical Notifications</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Get alerts for abnormal EC/pH levels</span>
                      </div>
                      <label className="sim-switch">
                        <input
                          type="checkbox"
                          checked={criticalAlerts}
                          onChange={() => setCriticalAlerts(!criticalAlerts)}
                        />
                        <span className="sim-slider"></span>
                      </label>
                    </div>

                    {/* Energy Saver Toggle */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', paddingTop: '12px' }}>
                      <div>
                        <span style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>Energy Saver Mode</span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>Optimize light and pump duty cycles</span>
                      </div>
                      <label className="sim-switch">
                        <input
                          type="checkbox"
                          checked={energySaver}
                          onChange={() => setEnergySaver(!energySaver)}
                        />
                        <span className="sim-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Diagnostics and Support */}
                <div className="panel-card" style={{ gap: '16px' }}>
                  <div className="panel-card-title">Diagnostics & Support</div>
                  <span className="panel-card-subtitle">Calibrate probes and view documents</span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', alignItems: 'center' }}>
                      <span className="text-secondary">Dosing Calibration</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{dosing.mlpConfidence}% Confidence Index</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', alignItems: 'center' }}>
                      <span className="text-secondary">Sensor Calibration</span>
                      <span style={{ fontWeight: 600 }}>pH: {sensors.ph} / EC: {sensors.ec}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="text-secondary">System Specs & Hardware Details</span>
                      <span style={{ fontWeight: 600, color: 'var(--text-tertiary)' }}>Firmware v2.4.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
