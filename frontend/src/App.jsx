import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DesktopDashboard from './pages/DesktopDashboard';
import MobileApp from './pages/MobileApp';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<DesktopDashboard />} />
        <Route path="/mobile" element={<MobileApp />} />
      </Routes>
    </Router>
  );
}
