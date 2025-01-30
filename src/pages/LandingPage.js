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
          <h1 className="landing-brand">ChatGPT🔮</h1>
          <h2 className="landing-title">Help me debug</h2>
          <p className="landing-subtext">
            why the linked list appears empty after I&apos;ve reversed it
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

          {/* Extra link or button; text: "Try it first" or "Login with OTP" */}
          <Link to="/otp-login" className="otp-link">
            Try it first
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LandingPage;
