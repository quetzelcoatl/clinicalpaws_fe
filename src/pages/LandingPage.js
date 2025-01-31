// src/pages/LandingPage.js
import React from "react";
import { Link } from "react-router-dom";
import "./LandingPage.css"; // We'll define the styles next

function LandingPage() {
  return (
    <div className="landing-container">
      {/* Left Panel (dark purple) */}
      <div className="left-panel">
        <div className="left-content">
          <h1 className="landing-brand">ClinicalPaws🔮</h1>
          <h2 className="landing-title">AI Assistant for Professionals</h2>
          <p className="landing-subtext">
            Will surf the web for you
          </p>
        </div>
      </div>

      {/* Right Panel (black background) */}
      <div className="right-panel">
        <div className="right-content">
          <h2 className="get-started-title">Get started</h2>
          <div className="button-row">
            <Link to="/login" className="landing-btn primary-btn">
              Log in
            </Link>
            <Link to="/signup" className="landing-btn primary-btn">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
