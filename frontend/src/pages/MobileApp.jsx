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

export default function MobileApp() {
  // Check if simulated via URL param
  const isSimulated = new URLSearchParams(window.location.search).get('sim') === 'true';

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
  const [phoneTheme, setPhoneTheme] = useState(() => {
    // Sync with main page or search param if available
    const theme = new URLSearchParams(window.location.search).get('theme');
    return theme === 'light' ? 'light' : 'dark';
  });
  const [mobileScreen, setMobileScreen] = useState(1); // 1: Dashboard, 2: Monitor, 3: Details/Scheduler, 4: Growth, 5: Settings
  const [mobileCropsTab, setMobileCropsTab] = useState('lettuce');
  const [mobileNotifications, setMobileNotifications] = useState(true);
  const [energySaver, setEnergySaver] = useState(false);

  // Dynamic Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Task Checklist state
  const [tasks, setTasks] = useState([
    { id: 1, title: 'Watering', desc: 'Water plants with 1.5L of water in the morning', time: '07:00 AM - 07:15 AM', completed: true },
    { id: 2, title: 'Fertilizing', desc: 'Apply organic fertilizer to base of plants. Quantity: 50g per plant', time: '08:00 AM - 08:30 AM', completed: true },
    { id: 3, title: 'Plant Inspection', desc: 'Check leaves for any signs of pests or yellowing', time: '10:00 AM - 11:00 AM', completed: false },
    { id: 4, title: 'Soil Aeration', desc: 'Loosen soil around the roots', time: '02:00 PM - 03:00 PM', completed: false }
  ]);

  // Mobile Light Mode watering schedule selections
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
  const [manualTimeLeft, setManualTimeLeft] = useState(0);

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

  // --- UI Helpers ---
  const toggleTask = (id) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const getCompletedTasksCount = () => tasks.filter(t => t.completed).length;

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

  // Build the app structure.
  // When standalone (isSimulated = false), we expand viewport size, remove notched phone casing.
  const themeClass = phoneTheme === 'light' ? 'phone-light-mode' : 'phone-dark-mode';

  const screenRender = () => {
    return (
      <div className={`simulated-screen-content no-scrollbar ${themeClass}`}>
        {/* Screen 1: Dashboard Overview */}
        {mobileScreen === 1 && (
          <>
            <div className="sim-mobile-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '18px', marginTop: '8px' }}>
              <img src="/logo.png" alt="Hydrosmart Logo" style={{ height: '38px', width: 'auto', objectFit: 'contain' }} />
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>HydroSmart</span>
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
            <div className="glass-panel-card" style={{ gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                MLP Dosing Output
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>NUTRIENT A</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{dosing.nutrientA_ml} mL</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>NUTRIENT B</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--blue)', marginTop: '4px' }}>{dosing.nutrientB_ml} mL</div>
                </div>
              </div>
            </div>

            {/* Dosing parameters panel */}
            <div className="glass-panel-card" style={{ gap: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase' }}>
                IoT Real-time Metrics
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>pH LEVEL</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--primary)', marginTop: '4px' }}>{sensors.ph}</div>
                </div>
                <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-card-hover)' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>WATER LEVEL</div>
                  <div style={{ fontSize: '22px', fontWeight: 700, marginTop: '4px' }}>{sensors.waterLevel}%</div>
                </div>
              </div>
            </div>

            {/* INA219 Energy Monitor (Mobile) */}
            <div className="glass-panel-card" style={{ gap: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} style={{ color: 'var(--amber)' }} /> INA219 Power Monitor
                </span>
                <span style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '12px', background: energy.gridActive ? 'var(--blue-glow)' : 'var(--primary-glow)', color: energy.gridActive ? 'var(--blue)' : 'var(--primary)' }}>
                  {energy.gridActive ? 'GRID' : 'SOLAR'}
                </span>
              </div>

              <div className="battery-status-bar" style={{ padding: '10px 14px' }}>
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
                  <span className="battery-percent" style={{ fontSize: '16px', fontWeight: 700 }}>{Math.round(energy.batterySoC)}% Capacity</span>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600, marginTop: '2px' }}>
                    {energy.chargingState === 'solar' && 'SOLAR CHARGING ACTIVE'}
                    {energy.chargingState === 'grid' && 'GRID BYPASS CHARGING'}
                    {energy.chargingState === 'discharging' && 'BATTERY POWER DISCHARGING'}
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="mobile-energy-pill">
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Solar Harvesting</span>
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>{energy.solarPower.toFixed(1)} W <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)' }}>({energy.solarVoltage.toFixed(1)}V @ {(energy.solarCurrent / 1000).toFixed(2)}A)</span></span>
                </div>
                <div className="mobile-energy-pill">
                  <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>System Load</span>
                  <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{energy.loadPower.toFixed(1)} W <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-tertiary)' }}>({energy.loadVoltage.toFixed(1)}V @ {(energy.loadCurrent / 1000).toFixed(2)}A)</span></span>
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
                    <div style={{ display: 'flex', justifycontent: 'space-between', alignItems: 'center' }}>
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

        {/* Screen 4: Growth curves */}
        {mobileScreen === 4 && (
          <>
            <div className="crop-detail-hero-section">
              <div className="crop-detail-title" style={{ fontSize: '15px' }}>
                {mobileCropsTab.toUpperCase()} GROWTH PROGRESSION
              </div>
              <span className="crop-detail-badge-pill">Section 3</span>
            </div>

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
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="height" stroke="var(--primary)" strokeWidth={2} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Growth stages description block */}
            <div className="glass-panel-card" style={{ gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase' }}>
                Stage Diagnostics
              </span>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>
                YourPeas plants are currently in the <b>{activeStage}</b> stage.
                The neural dosing network recommends maintaining an EC level of <b>1.4–1.8 mS</b> to prevent tipburn.
              </p>
            </div>

            <button
              className="sim-btn"
              style={{ alignSelf: 'center', margin: '8px 0' }}
              onClick={() => setMobileScreen(2)}
            >
              Back to Monitor List
            </button>
          </>
        )}

        {/* Screen 5: Settings */}
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

            {/* Setup info card */}
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
                {/* Theme toggle */}
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

                {/* Notifications */}
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

                {/* Energy saver */}
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

            {/* Diagnostics */}
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

            {/* Help / Docs */}
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
    );
  };

  const navRender = () => {
    return (
      <nav className={`simulated-bottom-nav ${themeClass}`}>
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
    );
  };

  // If in simulator mode, wrap inside the iPhone hardware border box frame
  if (isSimulated) {
    return (
      <div className="mobile-simulator-layout" style={{ background: 'transparent', padding: 0 }}>
        <div className={`mobile-phone-shell ${themeClass}`} style={{ border: 'none', boxShadow: 'none', width: '100%', height: '100%', borderRadius: 0 }}>
          <div className="mobile-phone-notch" />
          <div className="simulated-status-bar">
            <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
            <div className="simulated-status-bar-right">
              <span>📶</span>
              <span>WiFi</span>
              <span>🔋 {Math.round(energy.batterySoC)}%</span>
            </div>
          </div>
          {screenRender()}
          {navRender()}
        </div>
      </div>
    );
  }

  // Standalone Fullscreen mode (Real browser, PWA, or Capacitor)
  return (
    <div className={`mobile-standalone-root ${themeClass}`} style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      background: phoneTheme === 'light' ? '#f8fafc' : '#0f172a',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Real Mobile Status spacer (compensates for iOS notch safe areas if installed as PWA) */}
      <div style={{ height: 'env(safe-area-inset-top, 12px)', background: 'transparent' }} />
      {screenRender()}
      {navRender()}
    </div>
  );
}
