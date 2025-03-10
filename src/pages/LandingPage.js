// src/pages/LandingPage.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  const [isMobile, setIsMobile] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for accessToken cookie
    const cookies = document.cookie.split(';');
    const accessTokenCookie = cookies.find(cookie => cookie.trim().startsWith('accessToken='));

    if (accessTokenCookie) {
      // If accessToken exists, navigate to audio recorder page
      navigate('/AudioRecorderPage');
    }

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
  }, [navigate]);

  return (
    <div className="landing-container">
      {/* Left Panel (veterinary-themed gradient background) */}
      <div className="left-panel">
        <div className="left-content">
          <div className="brand-container">
            <h0 className="landing-brand">ClinicalPaws<span className="brand-icon">🐾</span></h0>
          </div>
          <h2 className="landing-title">AI-Powered Clinical Assistant for Veterinarians</h2>
          <p className="landing-subtext">
            Your intelligent companion for evidence-based veterinary medicine
          </p>
          <div className="features-list">
            <div className="feature-item">
              <span className="feature-icon">🔬</span>
              <span>Real-time diagnostic assistance</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📚</span>
              <span>Access to latest veterinary research</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">🎙️</span>
              <span>Voice-activated clinical support</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⏱️</span>
              <span>Seconds to evidence-based insights</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel (professional veterinary theme) */}
      <div className="right-panel">
        <div className="right-content">
          <h2 className="get-started-title">Enhance Your Practice Today</h2>
          <p className="welcome-text">Join veterinary professionals elevating patient care with AI assistance</p>
          <div className="vet-benefits">
            <p>• Instant access to AI-analyzed veterinary research</p>
            <p>• Hands-free operation during examinations and procedures</p>
            <p>• Evidence-based differential diagnoses in seconds</p>
          </div>
          <div className={`button-container ${isMobile ? 'mobile' : ''}`}>
            <Link to="/login" className="landing-btn login-btn">
              Sign In
            </Link>
            <div className="divider">
              <span>or</span>
            </div>
            <Link to="/signup" className="landing-btn signup-btn">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
