import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import DesktopDashboard from './pages/DesktopDashboard';
import SplashScreen from './components/SplashScreen';
import './index.css';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimeout = setTimeout(() => {
      setFadeOut(true);
    }, 2000); // Start fade-out animation at 2.0s

    const removeTimeout = setTimeout(() => {
      setShowSplash(false);
    }, 2500); // Completely unmount splash screen at 2.5s

    return () => {
      clearTimeout(fadeTimeout);
      clearTimeout(removeTimeout);
    };
  }, []);

  return (
    <>
      {showSplash && <SplashScreen fadeOut={fadeOut} />}
      <Router>
        <Routes>
          <Route path="/" element={<DesktopDashboard />} />
        </Routes>
      </Router>
    </>
  );
}


