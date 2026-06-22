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

  // --- UI Presentation State ---
  const [layoutMode, setLayoutMode] = useState('desktop'); // 'desktop' or 'mobile' (simulator)
  const [desktopTab, setDesktopTab] = useState('overview'); // 'overview' or 'map'

  // Mobile Simulator settings
  const [phoneTheme, setPhoneTheme] = useState('light');

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
      const res = await fetch('/api/telemetry');
      const data = await res.json();
      setSensors(data.sensors);
      setEnergy(data.energy);
      setDosing(data.dosing);
      setOverrides(data.overrides);
      setActiveCrop(data.activeCrop);
      setActiveStage(data.activeStage);
      setCropProfile(data.cropProfile);
      setHistory(data.history);
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
      await fetch('/api/crop-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop, stage: activeStage })
      });
      setActiveCrop(crop);
    } catch (e) { /* swallow */ }
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
    <div className="app-container">
      {/* ── HEADER ── */}
      <header className="app-header">
        <div className="header-left">
          <img src="/logo.png" alt="Hydrosmart Logo" style={{ height: '36px', width: 'auto', marginRight: '8px', objectFit: 'contain' }} />
          <h1 className="brand-name">HydroSmart</h1>
        </div>

        <div className="header-center">
          <div className="view-mode-selector">
            <button
              className={`view-mode-btn ${layoutMode === 'desktop' ? 'active' : ''}`}
              onClick={() => setLayoutMode('desktop')}
            >
              <Monitor size={15} /> Dashboard
            </button>
            <button
              className={`view-mode-btn ${layoutMode === 'mobile' ? 'active' : ''}`}
              onClick={() => setLayoutMode('mobile')}
            >
              <Smartphone size={15} /> Mobile View
            </button>
          </div>
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
      {layoutMode === 'desktop' && (
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
            <button className="sidebar-nav-item" title="Device Configuration">
              <Cpu size={20} />
            </button>
            <button className="sidebar-nav-item" title="Analytics & Charts">
              <Activity size={20} />
            </button>
            <button className="sidebar-nav-item" title="Settings">
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
                          <span className="weather-location">Muntinlupa City, Philippines</span>
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
          </main>
        </div>
      )}

      {/* ── MOBILE APP SIMULATOR MODE ── */}
      {layoutMode === 'mobile' && (
        <div className="mobile-simulator-layout">
          {/* Simulator options sidebar */}
          <div className="phone-theme-toggle">
            <button
              className={`phone-toggle-option ${phoneTheme === 'light' ? 'active' : ''}`}
              onClick={() => setPhoneTheme('light')}
            >
              ☀️ Light UI
            </button>
            <button
              className={`phone-toggle-option ${phoneTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setPhoneTheme('dark')}
            >
              🌙 Dark UI
            </button>
            {/* Pop-out link for actual fullscreen testing */}
            <a
              href={`/mobile?theme=${phoneTheme}`}
              target="_blank"
              rel="noopener noreferrer"
              className="phone-toggle-option"
              style={{ textDecoration: 'none', background: 'var(--bg-panel)', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              🚀 Fullscreen App <Maximize2 size={12} />
            </a>
          </div>

          {/* iPhone Mockup Frame containing iframe */}
          <div className={`mobile-phone-shell ${phoneTheme === 'light' ? 'phone-light-mode' : 'phone-dark-mode'}`}>
            <iframe
              src={`/mobile?sim=true&theme=${phoneTheme}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                background: 'transparent',
                borderRadius: '28px',
                overflow: 'hidden'
              }}
              title="HydroSmart Mobile App Simulator"
            />
          </div>
        </div>
      )}
    </div>
  );
}
