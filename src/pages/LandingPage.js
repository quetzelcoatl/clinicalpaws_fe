// src/pages/LandingPage.js
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // We'll define the styles next

function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if screen width is mobile-sized
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="landing-container">
      {/* Left Panel (gradient background) */}
      <div className="left-panel">
        <div className="left-content">
          <div className="brand-container">
            <h1 className="landing-brand">ClinicalPaws<span className="brand-emoji">🔮</span></h1>
          </div>
          <h2 className="landing-title">AI Assistant for Professionals</h2>
          <p className="landing-subtext">
            Will surf the web for you
          </p>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🔍</span>
              <span>Smart web search</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚡</span>
              <span>Fast responses</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🔒</span>
              <span>Secure & private</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (dark background) */}
      <div className="right-panel">
        <div className="right-content">
          <h2 className="get-started-title">Get started</h2>
          <p className="welcome-text">Join thousands of professionals using ClinicalPaws</p>
          <div className={`button-container ${isMobile ? 'mobile' : ''}`}>
            <Link to="/login" className="landing-btn login-btn">
              Log in
            </Link>
            <div className="divider">
              <span>or</span>
            </div>
            <Link to="/signup" className="landing-btn signup-btn">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
