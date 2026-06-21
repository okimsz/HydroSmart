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
import './index.css';

// Crop image mapping (reusing existing assets in public/images)
const CROP_IMAGES = {
  lettuce: '/images/crop-lettuce.png',
  pechay: '/images/crop-pechay.png',
  spinach: '/images/crop-spinach.png',
  basil: '/images/crop-spinach.png'
};

const CROP_SPECIES = {
  lettuce: 'Lactuca sativa',
  pechay: 'Brassica rapa ssp. chinensis',
  spinach: 'Spinacia oleracea',
  basil: 'Ocimum basilicum'
};

const CROP_EMOJI = {
  lettuce: '🥬',
  pechay: '🥬',
  spinach: '🌿',
  basil: '🌱'
};

// Static Section List Layout (Re-based on thesis details)
const GREENHOUSE_SECTIONS = [
  { id: 1, name: 'Section 1', cropKey: 'spinach', baseHealth: 98, x: 20, y: 30, area: '25 m²' },
  { id: 2, name: 'Section 2', cropKey: 'lettuce', baseHealth: 78, x: 40, y: 35, area: '28 m²' },
  { id: 3, name: 'Section 3', cropKey: 'spinach', baseHealth: 89, x: 62, y: 35, area: '30 m²' },
  { id: 4, name: 'Section 4', cropKey: 'pechay', baseHealth: 41, x: 73, y: 45, area: '22 m²' },
  { id: 5, name: 'Section 5', cropKey: 'lettuce', baseHealth: 95, x: 35, y: 45, area: '32 m²' },
  { id: 6, name: 'Section 6', cropKey: 'spinach', baseHealth: 91, x: 44, y: 60, area: '24 m²' },
  { id: 7, name: 'Section 7', cropKey: 'pechay', baseHealth: 73, x: 90, y: 60, area: '26 m²' },
  { id: 8, name: 'Section 8', cropKey: 'lettuce', baseHealth: 93, x: 35, y: 25, area: '35 m²' }
];

// Helper to format dates cleanly
const formatShortDate = (date) => {
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

export default function App() {
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
  const [layoutMode, setLayoutMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('view') === 'mobile' ? 'mobile' : 'desktop';
  });

  // Desktop Tabs: 'overview' (Image 2 style) or 'map' (Image 1 style)
  const [desktopTab, setDesktopTab] = useState('overview');

  // Mobile Simulator States
  const [phoneTheme, setPhoneTheme] = useState('light'); // 'light' (Image 3) or 'dark' (Image 2)
  const [mobileScreen, setMobileScreen] = useState(1); // 1: List, 2: Detail, 3: Growth (for light theme)
  const [mobileCropsTab, setMobileCropsTab] = useState('lettuce');
  const [mobileNotifications, setMobileNotifications] = useState(true);
  const [energySaver, setEnergySaver] = useState(false);

  // Selected Greenhouse Section (Desktop Map & Drawer)
  const [activeSectionId, setActiveSectionId] = useState(3);

  // Dynamic Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Task Checklist state (Image 2 style)
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Watering', desc: 'Water plants with 1.5L of water in the morning', time: '07:00 AM - 07:15 AM', completed: true },
    { id: 2, title: 'Fertilizing', desc: 'Apply organic fertilizer to base of plants. Quantity: 50g per plant', time: '08:00 AM - 08:30 AM', completed: true },
    { id: 3, title: 'Plant Inspection', desc: 'Check leaves for any signs of pests or yellowing', time: '10:00 AM - 11:00 AM', completed: false },
    { id: 4, title: 'Soil Aeration', desc: 'Loosen soil around the roots', time: '02:00 PM - 03:00 PM', completed: false }
  ]);

  // Mobile Light Mode watering schedule selections (Image 3 middle screen)
  const [wateringDays, setWateringDays] = useState({
    M: true, T: false, W: true, T2: false, F: true, S: false, S2: false
  });

  // Advanced Watering Scheduler States
  const [wateringMode, setWateringMode] = useState('scheduled'); // 'auto', 'scheduled', 'manual'
  const [waterVolume, setWaterVolume] = useState(1500); // volume in mL
  const [wateringSlots, setWateringSlots] = useState([
    { id: 1, name: 'Morning Cycle', time: '07:00', duration: 15, volume: 1500, active: true },
    { id: 2, name: 'Evening Cycle', time: '17:00', duration: 15, volume: 1500, active: true }
  ]);
  const [isWateringNow, setIsWateringNow] = useState(false);

  // --- Clock Trigger ---
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // --- API Polling (Keeps all backend simulations live) ---
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
  const toggleOverride = async (device) => {
    try {
      const nextState = !overrides[device];
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device, state: nextState })
      });
      setOverrides(prev => ({ ...prev, [device]: nextState }));
    } catch (e) { /* fallback local */ }
  };

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

  const selectStage = async (stage) => {
    try {
      await fetch('/api/crop-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ crop: activeCrop, stage })
      });
      setActiveStage(stage);
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

  // --- Advanced Watering Helpers ---
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

  const [manualTimeLeft, setManualTimeLeft] = useState(0);

  const triggerManualWater = async () => {
    setIsWateringNow(true);
    setManualTimeLeft(10);

    // Turn ON physical ESP32 pump relay via Node API
    try {
      await fetch('/api/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device: 'waterPump', state: true })
      });
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
          fetch('/api/override', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device: 'waterPump', state: false })
          }).then(() => {
            setOverrides(prevOverrides => ({ ...prevOverrides, waterPump: false }));
          }).catch(err => console.error("Failed to turn off water pump:", err));
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

  // Compute offset section parameters to make drawer look realistic
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

            {/* VIEW: OVERVIEW TAB (Redesigned 2-column layout) */}
            {desktopTab === 'overview' && (
              <div className="dashboard-redesign-grid fade-in">
                {/* LEFT COLUMN: Main Content Banner, Telemetry Grid & Recommendations */}
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

                  {/* Hero Banner Card with background image and absolute floating hotspots */}
                  <div className="hero-banner-card">
                    <div className="hero-banner-overlay" />

                    {/* Absolute positioned interactive sensor hotspots overlay */}
                    <div className="hero-hotspots-container">
                      {/* Temperature hotspot */}
                      <div className="floating-hotspot temp-hotspot">
                        <span className="hotspot-badge" title="Air Temperature Sensor"><Thermometer size={14} /></span>
                        <span className="hotspot-label">Temperature</span>
                        <div className="hotspot-connector" />
                      </div>

                      {/* Light/EC hotspot */}
                      <div className="floating-hotspot light-hotspot">
                        <span className="hotspot-badge" title="EC Sensor Probe"><Sun size={14} /></span>
                        <span className="hotspot-label">Light</span>
                        <div className="hotspot-connector" />
                      </div>

                      {/* Water Level hotspot */}
                      <div className="floating-hotspot water-hotspot">
                        <span className="hotspot-badge" title="Ultrasonic Water Level Sensor"><Droplet size={14} /></span>
                        <span className="hotspot-label">Water</span>
                        <div className="hotspot-connector" />
                      </div>

                      {/* Air/pH hotspot */}
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
                        <span></span> Suggested Crops
                      </h3>
                      <a href="#see-all" className="recommendation-see-all" onClick={(e) => { e.preventDefault(); setDesktopTab('map'); }}>see all</a>
                    </div>

                    <div className="recommendations-grid">
                      {/* Crop Card 1: Lettuce */}
                      <div
                        className={`recommendation-item-card ${activeCrop === 'lettuce' ? 'active' : ''}`}
                        onClick={() => selectCrop('lettuce')}
                      >
                        <img src="/images/crop-lettuce.png" className="recommendation-item-img" alt="Lettuce" />
                        <div className="recommendation-item-info">
                          <span className="recommendation-item-name">Lettuce</span>
                          <span className="recommendation-item-species">(Lactuca Sativa)</span>
                        </div>
                      </div>

                      {/* Crop Card 2: Pechay */}
                      <div
                        className={`recommendation-item-card ${activeCrop === 'pechay' ? 'active' : ''}`}
                        onClick={() => selectCrop('pechay')}
                      >
                        <img src="/images/crop-pechay.png" className="recommendation-item-img" alt="Pechay" />
                        <div className="recommendation-item-info">
                          <span className="recommendation-item-name">Pechay</span>
                          <span className="recommendation-item-species">(Brassica Rapa)</span>
                        </div>
                      </div>

                      {/* Crop Card 3: Spinach */}
                      <div
                        className={`recommendation-item-card ${activeCrop === 'spinach' ? 'active' : ''}`}
                        onClick={() => selectCrop('spinach')}
                      >
                        <img src="/images/crop-spinach.png" className="recommendation-item-img" alt="Spinach" />
                        <div className="recommendation-item-info">
                          <span className="recommendation-item-name">Spinach</span>
                          <span className="recommendation-item-species">(Spinacia Oleracea)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 6-parameters grid below Hero Card */}
                  <div className="parameters-grid">
                    {/* Plant Health */}
                    <div className="param-card health-premium">
                      <div className="param-header-row">
                        <span className="param-label">Plant Health</span>
                        <div className="param-icon"><Leaf size={14} /></div>
                      </div>
                      <span className="param-value">94%</span>
                      <span className="param-info">The plants are showing excellent health status</span>
                    </div>

                    {/* EC (Electrical Conductivity) */}
                    <div className="param-card">
                      <div className="param-header-row">
                        <span className="param-label">EC (Nutrients)</span>
                        <div className="param-icon"><Activity size={14} /></div>
                      </div>
                      <span className="param-value">{sensors.ec} <span style={{ fontSize: '12px', fontWeight: 500 }}>mS/cm</span></span>
                      <span className="param-info">Optimal EC range: {cropProfile?.targets?.ec?.min || 1.2}-{cropProfile?.targets?.ec?.max || 1.8} mS/cm</span>
                    </div>

                    {/* Water Temp */}
                    <div className="param-card">
                      <div className="param-header-row">
                        <span className="param-label">Water Temp</span>
                        <div className="param-icon"><Thermometer size={14} /></div>
                      </div>
                      <span className="param-value">{sensors.waterTemp}°C</span>
                      <span className="param-info">DS18B20 Water Temperature Probe</span>
                    </div>

                    {/* pH Level */}
                    <div className="param-card">
                      <div className="param-header-row">
                        <span className="param-label">pH Level</span>
                        <div className="param-icon"><Droplet size={14} /></div>
                      </div>
                      <span className="param-value">{sensors.ph}</span>
                      <span className="param-info">Analog pH Sensor probe readings</span>
                    </div>

                    {/* Air Temperature & Humidity */}
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

                    {/* Water Level */}
                    <div className="param-card">
                      <div className="param-header-row">
                        <span className="param-label">Water Level</span>
                        <div className="param-icon"><Droplet size={14} /></div>
                      </div>
                      <span className="param-value">{sensors.waterLevel}%</span>
                      <span className="param-info">Ultrasonic Water Tank Level Sensor</span>
                    </div>
                  </div>

                  {/* INA219 Solar & Battery Energy Monitor Card */}
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

                    {/* Solar vs Load Dual Panel grid */}
                    <div className="energy-grid">
                      {/* Solar Panel Telemetry */}
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

                      {/* Load Telemetry */}
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

                    {/* Battery Status bar */}
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


                {/* RIGHT COLUMN: Weather & Real-time Action Controllers */}
                <div className="dashboard-redesign-col">

                  {/* Weather widget */}
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

                  {/* MLP Dosing Control Card */}
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
                        <div className="device-status-badge">
                          <div className="device-status-dot active" />
                        </div>
                      </div>

                      <div className="device-row">
                        <div className="device-info">
                          <div className="device-avatar"><Droplet size={16} /></div>
                          <div className="device-details">
                            <span className="device-name">Analog EC Sensor Probe</span>
                            <span className="device-sub">#EC2015 • Active</span>
                          </div>
                        </div>
                        <div className="device-status-badge">
                          <div className="device-status-dot active" />
                        </div>
                      </div>

                      <div className="device-row">
                        <div className="device-info">
                          <div className="device-avatar"><Droplet size={16} /></div>
                          <div className="device-details">
                            <span className="device-name">Analog pH Sensor Probe</span>
                            <span className="device-sub">#PH6012 • Active</span>
                          </div>
                        </div>
                        <div className="device-status-badge">
                          <div className="device-status-dot active" />
                        </div>
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

            {/* VIEW: GREENHOUSE MAP TAB (Image 1 design) */}
            {desktopTab === 'map' && (
              <div className="map-view-container fade-in">
                {/* Left Panel: Overall Health & Section List */}
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

                      {/* Dynamic Parameters Grid matching current telemetry */}
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

                      {/* System hardware metadata */}
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
              ☀️ Light UI (Image 3)
            </button>
            <button
              className={`phone-toggle-option ${phoneTheme === 'dark' ? 'active' : ''}`}
              onClick={() => setPhoneTheme('dark')}
            >
              🌙 Dark UI (Image 2)
            </button>
          </div>

          {/* iPhone Mockup Frame */}
          <div className={`mobile-phone-shell ${phoneTheme === 'light' ? 'phone-light-mode' : 'phone-dark-mode'}`}>
            <div className="mobile-phone-notch" />

            {/* iOS Status Bar */}
            <div className="simulated-status-bar">
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
              <div className="simulated-status-bar-right">
                <span>📶</span>
                <span>WiFi</span>
                <span>🔋 {Math.round(energy.batterySoC)}%</span>
              </div>
            </div>

            {/* Simulated scrollable app screen */}
            <div className="simulated-screen-content no-scrollbar">

              {/* Screen 1: Dashboard Overview (Field UI / Telemetry Summary) */}
              {mobileScreen === 1 && (
                <>
                  <div className="sim-mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px', marginTop: '4px' }}>
                    <img src="/logo.png" alt="Hydrosmart Logo" style={{ height: '26px', width: 'auto', objectFit: 'contain' }} />
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>HydroSmart</span>
                  </div>

                  <div className="sim-weather-card">
                    <span className="glass-weather-location" style={{ marginBottom: '4px' }}>Muntinlupa City, Philippines</span>
                    <span className="glass-weather-date">{formatShortDate(currentTime)}</span>
                    <span className="glass-weather-temp">{Math.round(sensors.airTemp)}°C</span>
                    <span className="glass-weather-desc">Sunny</span>
                  </div>

                  <div className="glass-conditions-row">
                    <div className="glass-condition-pill">
                      <span className="glass-condition-label">Air Temp</span>
                      <span className="glass-condition-value">{sensors.airTemp}°C</span>
                    </div>
                    <div className="glass-condition-pill">
                      <span className="glass-condition-label">EC Level</span>
                      <span className="glass-condition-value">{sensors.ec} mS</span>
                    </div>
                    <div className="glass-condition-pill">
                      <span className="glass-condition-label">Humidity</span>
                      <span className="glass-condition-value">{sensors.humidity}%</span>
                    </div>
                  </div>

                  {/* MLP Dosing Output Overview card */}
                  <div className="glass-panel-card" style={{ gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                      MLP Dosing Output
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>NUTRIENT A</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--primary)' }}>{dosing.nutrientA_ml} mL</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>NUTRIENT B</div>
                        <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--blue)' }}>{dosing.nutrientB_ml} mL</div>
                      </div>
                    </div>
                  </div>

                  {/* Dosing parameters panel */}
                  <div className="glass-panel-card" style={{ gap: '10px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                      IoT Real-time Metrics
                    </span>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>pH LEVEL</div>
                        <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--primary)' }}>{sensors.ph}</div>
                      </div>
                      <div style={{ padding: '8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                        <div style={{ fontSize: '9px', color: 'var(--text-tertiary)' }}>WATER LEVEL</div>
                        <div style={{ fontSize: '16px', fontWeight: 700 }}>{sensors.waterLevel}%</div>
                      </div>
                    </div>
                  </div>

                  {/* INA219 Energy Monitor (Mobile) */}
                  <div className="glass-panel-card" style={{ gap: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Zap size={14} style={{ color: 'var(--amber)' }} /> INA219 Power Monitor
                      </span>
                      <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', background: energy.gridActive ? 'var(--blue-glow)' : 'var(--primary-glow)', color: energy.gridActive ? 'var(--blue)' : 'var(--primary)' }}>
                        {energy.gridActive ? 'GRID' : 'SOLAR'}
                      </span>
                    </div>

                    <div className="battery-status-bar" style={{ padding: '8px 12px' }}>
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
                        <span className="battery-percent" style={{ fontSize: '13px' }}>{Math.round(energy.batterySoC)}% Capacity</span>
                        <span style={{ fontSize: '8px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
                          {energy.chargingState === 'solar' && 'SOLAR CHARGING ACTIVE'}
                          {energy.chargingState === 'grid' && 'GRID BYPASS CHARGING'}
                          {energy.chargingState === 'discharging' && 'BATTERY POWER DISCHARGING'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div className="mobile-energy-pill">
                        <span style={{ color: 'var(--text-secondary)' }}>Solar Harvesting</span>
                        <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{energy.solarPower.toFixed(1)} W <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-tertiary)' }}>({energy.solarVoltage.toFixed(1)}V @ {(energy.solarCurrent / 1000).toFixed(2)}A)</span></span>
                      </div>
                      <div className="mobile-energy-pill">
                        <span style={{ color: 'var(--text-secondary)' }}>System Load</span>
                        <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{energy.loadPower.toFixed(1)} W <span style={{ fontSize: '9px', fontWeight: 500, color: 'var(--text-tertiary)' }}>({energy.loadVoltage.toFixed(1)}V @ {(energy.loadCurrent / 1000).toFixed(2)}A)</span></span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Screen 2: Crop List / Monitor */}
              {mobileScreen === 2 && (
                <>
                  <div className="mobile-section-header">
                    <span className="mobile-title">Hydroponic Monitor</span>
                    <span className="mobile-subtitle">Monitor the growth of your hydroponic plants</span>
                  </div>

                  <div className="greenhouse-select-card pointer-cursor" onClick={() => setMobileScreen(3)}>
                    <div className="greenhouse-select-info">
                      <span className="greenhouse-select-title">Greenhouse #1</span>
                      <span className="greenhouse-select-count">7 Plants Active</span>
                    </div>
                    <div className="greenhouse-avatar-group">🌱🥬🌿</div>
                  </div>

                  <div className="crops-list-vertical">
                    {['lettuce', 'pechay', 'spinach'].map(crop => (
                      <div
                        key={crop}
                        className={`crop-mobile-row ${mobileCropsTab === crop ? 'active' : ''}`}
                        onClick={() => {
                          setMobileCropsTab(crop);
                          selectCrop(crop);
                          setMobileScreen(3);
                        }}
                      >
                        <div className="crop-mobile-row-left">
                          <img src={CROP_IMAGES[crop]} className="crop-mobile-avatar" alt={crop} />
                          <div>
                            <div className="crop-mobile-name">
                              {crop.charAt(0).toUpperCase() + crop.slice(1)} Plant
                            </div>
                            <div className="crop-mobile-species">{CROP_SPECIES[crop]}</div>
                          </div>
                        </div>
                        <span className="crop-mobile-status-pill" style={{ background: 'var(--primary-light)', color: 'var(--primary-hover)' }}>
                          94% Health
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Screen 3: Selected plant profile details & Advanced Scheduler */}
              {mobileScreen === 3 && (
                <>
                  <div className="crop-detail-hero-section fade-in">
                    <div className="crop-detail-img-container">
                      <img src={CROP_IMAGES[mobileCropsTab]} className="crop-detail-img" alt={mobileCropsTab} />
                    </div>
                    <div className="crop-detail-title">
                      {mobileCropsTab.charAt(0).toUpperCase() + mobileCropsTab.slice(1)} Plant
                    </div>
                    <div className="crop-detail-species">{CROP_SPECIES[mobileCropsTab]}</div>
                    <span className="crop-detail-badge-pill">{activeStage} Stage</span>
                  </div>

                  <div className="crop-detail-metrics-row">
                    <div className="crop-detail-metric-card">
                      <span className="crop-detail-metric-label">Water Flow</span>
                      <div className="crop-detail-metric-value">43 ml/h</div>
                      <span className="crop-detail-metric-sub">Circulation</span>
                    </div>
                    <div className="crop-detail-metric-card">
                      <span className="crop-detail-metric-label">EC Target</span>
                      <div className="crop-detail-metric-value" style={{ color: 'var(--blue)' }}>
                        {cropProfile?.targets?.ec?.optimal || 1.5} <span style={{ fontSize: '9px', fontWeight: 600 }}>mS</span>
                      </div>
                      <span className="crop-detail-metric-sub">Conductivity</span>
                    </div>
                    <div className="crop-detail-metric-card">
                      <span className="crop-detail-metric-label">Age</span>
                      <div className="crop-detail-metric-value">34 Days</div>
                      <span className="crop-detail-metric-sub">From Seed</span>
                    </div>
                  </div>

                  {/* Advanced Watering Scheduler Card */}
                  <div className="watering-schedule-card">
                    <div className="watering-schedule-header">
                      <span className="watering-schedule-title">Watering Scheduler</span>
                      <Settings size={12} className="text-secondary pointer-cursor" />
                    </div>

                    {/* Dynamic Countdown Banner */}
                    <div style={{
                      background: 'var(--primary-glow)',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '4px'
                    }}>
                      <Calendar size={16} style={{ color: 'var(--primary)' }} />
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Next Cycle</span>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>{getNextWateringText()}</span>
                      </div>
                    </div>

                    {/* Mode selection pills */}
                    <div style={{ display: 'flex', gap: '8px', background: 'var(--bg-card-hover)', padding: '4px', borderRadius: '8px', margin: '4px 0', border: '1px solid var(--border-color)' }}>
                      {['auto', 'scheduled', 'manual'].map(mode => (
                        <button
                          key={mode}
                          style={{
                            flex: 1,
                            border: 'none',
                            background: wateringMode === mode ? 'var(--primary)' : 'transparent',
                            color: wateringMode === mode ? 'white' : 'var(--text-secondary)',
                            padding: '6px 0',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: '6px',
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

                    {/* Content depending on selected mode */}
                    {wateringMode === 'scheduled' && (
                      <>
                        {/* Calendar Days selection grid */}
                        <div className="watering-days-grid" style={{ margin: '4px 0' }}>
                          {Object.entries(wateringDays).map(([dayKey, active]) => {
                            const label = dayKey.replace(/[0-9]/g, '');
                            return (
                              <div
                                key={dayKey}
                                className={`watering-day-btn ${active ? 'active' : ''}`}
                                onClick={() => setWateringDays(prev => ({ ...prev, [dayKey]: !prev[dayKey] }))}
                              >
                                <span className="watering-day-letter">{label}</span>
                                {active && <span className="watering-droplet">💧</span>}
                              </div>
                            );
                          })}
                        </div>

                        {/* Time Slots List */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-muted)' }}>TIME CYCLES</span>
                            <button
                              style={{ border: 'none', background: 'transparent', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                              onClick={addWateringSlot}
                            >
                              <Plus size={12} /> Add Cycle
                            </button>
                          </div>

                          {wateringSlots.map(slot => (
                            <div
                              key={slot.id}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                                background: 'var(--bg-card-hover)',
                                padding: '12px',
                                borderRadius: '10px',
                                border: '1px solid var(--border-color)'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                      fontSize: '13px',
                                      fontWeight: 700,
                                      color: 'var(--text-main)',
                                      width: '100px',
                                      padding: '2px 0'
                                    }}
                                  />
                                </div>
                                <button
                                  style={{ border: 'none', background: 'transparent', color: 'var(--red)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  onClick={() => deleteWateringSlot(slot.id)}
                                >
                                  <X size={15} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', opacity: slot.active ? 1 : 0.5 }}>
                                {/* Time Input */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-tertiary)' }}>START TIME</span>
                                  <input
                                    type="time"
                                    value={slot.time}
                                    onChange={(e) => updateSlotField(slot.id, 'time', e.target.value)}
                                    disabled={!slot.active}
                                    style={{
                                      background: 'var(--bg-panel)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      padding: '4px 6px',
                                      fontSize: '11px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%'
                                    }}
                                  />
                                </div>

                                {/* Duration Select */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-tertiary)' }}>DURATION</span>
                                  <select
                                    value={slot.duration}
                                    onChange={(e) => updateSlotField(slot.id, 'duration', Number(e.target.value))}
                                    disabled={!slot.active}
                                    style={{
                                      background: 'var(--bg-panel)',
                                      border: '1px solid var(--border-color)',
                                      borderRadius: '6px',
                                      padding: '4px 6px',
                                      fontSize: '11px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%'
                                    }}
                                  >
                                    <option value={5}>5 mins</option>
                                    <option value={10}>10 mins</option>
                                    <option value={15}>15 mins</option>
                                    <option value={20}>20 mins</option>
                                    <option value={30}>30 mins</option>
                                  </select>
                                </div>

                                {/* Volume Input */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  <span style={{ fontSize: '8px', fontWeight: 600, color: 'var(--text-tertiary)' }}>VOLUME (mL)</span>
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
                                      padding: '4px 6px',
                                      fontSize: '11px',
                                      color: 'var(--text-main)',
                                      fontWeight: 600,
                                      width: '100%'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {wateringMode === 'auto' && (
                      <div style={{ padding: '8px 0', fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 700, marginBottom: '6px' }}>
                          <Zap size={14} /> Feedback Control Active
                        </div>
                        Watering cycles are automatically triggered by ambient sensors.
                        The pumps will engage when water tank level drops below <b>45%</b> or when soil humidity drops below target.
                      </div>
                    )}

                    {wateringMode === 'manual' && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', gap: '12px' }}>
                        {isWateringNow ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--primary)', width: '100%' }}>
                            <div className="water-dispense-ring" style={{
                              position: 'relative',
                              width: '80px',
                              height: '80px',
                              borderRadius: '50%',
                              background: 'var(--primary-glow)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '3px solid var(--primary)',
                              boxShadow: '0 0 15px var(--primary-glow)'
                            }}>
                              <span style={{ fontSize: '32px', animation: 'bounce 1s infinite alternate' }}>💧</span>
                              <div style={{
                                position: 'absolute',
                                bottom: '-8px',
                                background: 'var(--primary)',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '10px'
                              }}>
                                {manualTimeLeft}s
                              </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                              <span style={{ fontWeight: 800, display: 'block', fontSize: '14px', color: 'var(--text-main)' }}>Dispensing Nutrient Mix</span>
                              <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Delivering {waterVolume}mL to {mobileCropsTab} beds</span>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="sim-btn"
                            style={{
                              width: '100%',
                              padding: '12px',
                              borderRadius: '12px',
                              background: 'var(--primary)',
                              color: 'white',
                              border: 'none',
                              fontSize: '13px',
                              fontWeight: 700,
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                              justifyContent: 'center',
                              display: 'flex'
                            }}
                            onClick={triggerManualWater}
                          >
                            💧 Water {mobileCropsTab.toUpperCase()} Now
                          </button>
                        )}
                      </div>
                    )}

                    {/* Water Volume Slider */}
                    {wateringMode !== 'auto' && (
                      <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', marginTop: '4px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
                          <span>WATER VOLUME PER CYCLE</span>
                          <span style={{ color: 'var(--primary)' }}>{(waterVolume / 1000).toFixed(1)}L ({waterVolume} mL)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '12px' }}>💧</span>
                          <input
                            type="range"
                            min="500"
                            max="3000"
                            step="250"
                            value={waterVolume}
                            onChange={(e) => setWaterVolume(Number(e.target.value))}
                            style={{ flex: 1, accentColor: 'var(--primary)', height: '4px', cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '16px' }}>🪣</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    className="sim-btn sim-btn-primary"
                    style={{ alignSelf: 'center', margin: '8px 0' }}
                    onClick={() => setMobileScreen(4)}
                  >
                    Track Growth Curve <ChevronRight size={14} />
                  </button>
                </>
              )}

              {/* Screen 4: Growth curves & tracking */}
              {mobileScreen === 4 && (
                <>
                  <div className="crop-detail-hero-section">
                    <div className="crop-detail-title" style={{ fontSize: '15px' }}>
                      {mobileCropsTab.toUpperCase()} GROWTH PROGRESSION
                    </div>
                    <span className="crop-detail-badge-pill">Section {activeSectionId}</span>
                  </div>

                  {/* Growth Curve Chart */}
                  <div className="growth-curve-card fade-in">
                    <div className="growth-header">
                      <span className="growth-title">Growth Track</span>
                      <div className="growth-toggle-period">
                        <span className="growth-period-btn">Day</span>
                        <span className="growth-period-btn active">Week</span>
                        <span className="growth-period-btn">Month</span>
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart
                        data={[
                          { name: 'Week 1', height: 2 },
                          { name: 'Week 2', height: 8 },
                          { name: 'Week 3', height: 16 },
                          { name: 'Week 4', height: 24 }
                        ]}
                        margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" tick={{ fontSize: 9 }} />
                        <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} label={{ value: 'Height (cm)', angle: -90, position: 'insideLeft', offset: 10, fontSize: 8 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="height" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sprout Progress Indicators */}
                  <div className="growth-sprout-progress-badge">
                    <span>🌱</span>
                    <div className="growth-sprout-text">Height: 24cm</div>
                  </div>

                  <div className="watering-schedule-card">
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
                      Week 4 Health Check
                    </span>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                      No leaves are showing tip-burn or magnesium deficiency. The roots show clear white tips indicating optimal oxygenation.
                    </p>
                  </div>

                  <button
                    className="sim-btn sim-btn-secondary"
                    style={{ alignSelf: 'center', margin: '8px 0' }}
                    onClick={() => setMobileScreen(2)}
                  >
                    Back to Monitor List
                  </button>
                </>
              )}

              {/* Screen 5: Settings & System Preference Config */}
              {mobileScreen === 5 && (
                <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="mobile-section-header">
                    <span className="mobile-title">System Settings</span>
                    <span className="mobile-subtitle">Configure system preferences and monitor setup</span>
                  </div>

                  {/* Owner Profile Card */}
                  <div className="sim-profile-card">
                    <div className="profile-avatar-container">
                      <div className="profile-avatar" style={{ overflow: 'hidden', position: 'relative' }}>
                        <span style={{ position: 'absolute', zIndex: 1 }}>CS</span>
                        <img
                          src="/images/cat1.jpg"
                          alt="Chyra San Juan"
                          onError={(e) => { e.target.style.display = 'none'; }}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', zIndex: 2, top: 0, left: 0 }}
                        />
                      </div>
                      <div className="profile-badge-online" />
                    </div>
                    <div className="profile-info">
                      <span className="profile-name">Chyra San Juan</span>
                      <span className="profile-role">Owner & Smart Farm Lead</span>
                    </div>
                  </div>

                  {/* Smart System Setup Preview Card with Uploaded Photo */}
                  <div>
                    <div className="settings-section-header">Hydroponics Setup</div>
                    <div className="settings-system-card">
                      <div className="settings-system-img-wrapper">
                        <img src="/images/hydro-system.jpg" className="settings-system-img" alt="NFT Hydroponics Setup" />
                        <div className="settings-system-img-overlay" />
                        <div className="settings-system-text">
                          <h4 className="settings-system-title">Block A - NFT System</h4>
                          <p className="settings-system-sub">Active Smart Hydroponics Rig</p>
                        </div>
                      </div>
                      <div className="settings-system-details">
                        <div className="system-details-row">
                          <span className="system-details-label">Main Controller</span>
                          <span className="system-details-val" style={{ fontFamily: 'var(--font-mono)' }}>Raspberry Pi Zero 2 W</span>
                        </div>
                        <div className="system-details-row">
                          <span className="system-details-label">Sensor Node</span>
                          <span className="system-details-val" style={{ fontFamily: 'var(--font-mono)' }}>ESP32-WROOM-32D</span>
                        </div>
                        <div className="system-details-row">
                          <span className="system-details-label">Telemetry Modules</span>
                          <span className="system-details-val">INA219 Power, DHT22, pH, EC</span>
                        </div>
                        <div className="system-details-row">
                          <span className="system-details-label">Power Source</span>
                          <span className="system-details-val" style={{ color: 'var(--primary)', fontWeight: 700 }}>Solar-Grid Hybrid</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Preferences Group */}
                  <div>
                    <div className="settings-section-header">Preferences</div>
                    <div className="settings-group-card">
                      {/* Dark Mode Toggle */}
                      <div className="settings-row">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#3b82f6' }}>
                            <Sun size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">Dark Theme</span>
                            <span className="settings-row-desc">Switch simulator color schemes</span>
                          </div>
                        </div>
                        <label className="sim-switch">
                          <input
                            type="checkbox"
                            checked={phoneTheme === 'dark'}
                            onChange={() => setPhoneTheme(phoneTheme === 'light' ? 'dark' : 'light')}
                          />
                          <span className="sim-slider"></span>
                        </label>
                      </div>

                      {/* Push Notifications Toggle */}
                      <div className="settings-row">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#10b981' }}>
                            <Bell size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">Critical Alerts</span>
                            <span className="settings-row-desc">Get notified for abnormal pH/EC levels</span>
                          </div>
                        </div>
                        <label className="sim-switch">
                          <input
                            type="checkbox"
                            checked={mobileNotifications}
                            onChange={() => setMobileNotifications(!mobileNotifications)}
                          />
                          <span className="sim-slider"></span>
                        </label>
                      </div>

                      {/* Eco Mode Toggle */}
                      <div className="settings-row">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#f59e0b' }}>
                            <Zap size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">Energy Saver Mode</span>
                            <span className="settings-row-desc">Dim lights and optimize pump intervals</span>
                          </div>
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

                  {/* System & Diagnostics Group */}
                  <div>
                    <div className="settings-section-header">System Diagnostics</div>
                    <div className="settings-group-card">
                      <div className="settings-row clickable">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#6366f1' }}>
                            <Cpu size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">Dosing Pumps Calibration</span>
                            <span className="settings-row-desc">Calibrate MLP peristaltic pumps flowrates</span>
                          </div>
                        </div>
                        <span className="settings-row-value">
                          {dosing.mlpConfidence}% Conf <ChevronRight size={14} />
                        </span>
                      </div>

                      <div className="settings-row clickable">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#ec4899' }}>
                            <Activity size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">Sensor Calibration</span>
                            <span className="settings-row-desc">Tune pH probe & EC conductivity sensor</span>
                          </div>
                        </div>
                        <span className="settings-row-value">
                          pH {sensors.ph} <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Help & Support Group */}
                  <div>
                    <div className="settings-section-header">Help & Support</div>
                    <div className="settings-group-card">
                      <div className="settings-row clickable">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#8b5cf6' }}>
                            <HelpCircle size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">User Manual & Guides</span>
                            <span className="settings-row-desc">Learn how to configure Smart Hydroponics</span>
                          </div>
                        </div>
                        <ChevronRight size={14} style={{ color: 'var(--text-tertiary)' }} />
                      </div>

                      <div className="settings-row clickable">
                        <div className="settings-row-left">
                          <div className="settings-row-icon-bg" style={{ background: '#f43f5e' }}>
                            <Info size={15} />
                          </div>
                          <div className="settings-row-text">
                            <span className="settings-row-title">System Specs & Hardware Details</span>
                            <span className="settings-row-desc">View firmware versions and pinouts</span>
                          </div>
                        </div>
                        <span className="settings-row-value">
                          v2.4.0 <ChevronRight size={14} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Simulator Footer Navigation */}
            <nav className="simulated-bottom-nav">
              <button
                className={`simulated-nav-item ${mobileScreen === 1 ? 'active' : ''}`}
                onClick={() => setMobileScreen(1)}
              >
                <Home size={18} />
                <span className="simulated-nav-label">Dashboard</span>
              </button>
              <button
                className={`simulated-nav-item ${mobileScreen === 2 ? 'active' : ''}`}
                onClick={() => setMobileScreen(2)}
              >
                <Compass size={18} />
                <span className="simulated-nav-label">Monitor</span>
              </button>
              <button
                className={`simulated-nav-item ${mobileScreen === 3 ? 'active' : ''}`}
                onClick={() => setMobileScreen(3)}
              >
                <Leaf size={18} />
                <span className="simulated-nav-label">Details</span>
              </button>
              <button
                className={`simulated-nav-item ${mobileScreen === 4 ? 'active' : ''}`}
                onClick={() => setMobileScreen(4)}
              >
                <BarChart2 size={18} />
                <span className="simulated-nav-label">Growth</span>
              </button>
              <button
                className={`simulated-nav-item ${mobileScreen === 5 ? 'active' : ''}`}
                onClick={() => setMobileScreen(5)}
              >
                <Settings size={18} />
                <span className="simulated-nav-label">Settings</span>
              </button>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
