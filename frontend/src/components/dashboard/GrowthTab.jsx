import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

export default function GrowthTab({
  selectedCropTab,
  activeStage,
  cropProfile
}) {
  return (
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
  );
}
