import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import DesktopDashboard from './pages/DesktopDashboard';
import MobileApp from './pages/MobileApp';
import './index.css';

export default function App() {
  // If running inside Android/iOS native wrappers, boot straight into Mobile UI
  if (Capacitor.isNativePlatform()) {
    return <MobileApp />;
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<DesktopDashboard />} />
        <Route path="/mobile" element={<MobileApp />} />
      </Routes>
    </Router>
  );
}

