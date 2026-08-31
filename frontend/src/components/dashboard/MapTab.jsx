import React from 'react';
import { X } from 'lucide-react';
import { GREENHOUSE_SECTIONS, CROP_SPECIES } from '../../shared/constants';

export default function MapTab({
  activeSectionId,
  setActiveSectionId,
  activeSectionData,
  activeSectionSensors,
  getSectionHealthColor
}) {
  return (
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
  );
}
