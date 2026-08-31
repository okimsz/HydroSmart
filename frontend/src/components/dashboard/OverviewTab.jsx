import React from 'react';
import {
  Leaf, Thermometer, Sun, Droplet, Wind, Zap, Cpu, RefreshCw, Check, ChevronRight, Activity
} from 'lucide-react';
import { CROP_IMAGES, CROP_SPECIES, formatShortDate } from '../../shared/constants';

export default function OverviewTab({
  sensors,
  energy,
  dosing,
  activeCrop,
  activeStage,
  selectCrop,
  cropProfile,
  tasks,
  toggleTask,
  getCompletedTasksCount,
  fetchData,
  currentTime,
  farmLocation,
  setDesktopTab
}) {
  return (
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
  );
}
