import React from 'react';

export default function SplashScreen({ fadeOut }) {
  return (
    <div className={`splash-container ${fadeOut ? 'fade-out' : ''}`}>
      <div className="mascot-container">
        <div className="sprout-leaves">
          <div className="sprout-leaf-left"></div>
          <div className="sprout-leaf-right"></div>
        </div>
        <div className="droplet-body">
          <div className="mascot-face">
            <div className="mascot-eyes">
              <div className="mascot-eye"></div>
              <div className="mascot-eye"></div>
            </div>
            <div className="mascot-mouth"></div>
          </div>
        </div>
      </div>
      <h1 className="splash-brand">HydroSmart</h1>
      <div className="splash-loading-bar-container">
        <div className="splash-loading-bar-fill"></div>
      </div>
    </div>
  );
}
