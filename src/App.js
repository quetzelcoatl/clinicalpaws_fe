// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Cookies from "js-cookie";
import AuthService from "./services/AuthService";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OtpLoginPage from "./pages/OtpLoginPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import AudioRecorderPage from "./pages/AudioRecorderPage";

function App() {
  useEffect(() => {
    const checkTokenRefresh = async () => {
      const refreshToken = Cookies.get("refreshToken");
      const lastRefreshedAt = Cookies.get("lastRefreshedAt");
      const userEmail = Cookies.get("email");
      if (!refreshToken || !lastRefreshedAt || !userEmail) return;

      const now = Date.now();
      const elapsed = now - parseInt(lastRefreshedAt, 10);
      const fifteenMinutes = 15 * 60 * 1000;

      if (elapsed >= fifteenMinutes) {
        try {
          await AuthService.getAccessTokenFromRefresh(userEmail, refreshToken);
          console.log("Refreshed access token");
        } catch (err) {
          console.error("Failed to refresh token:", err);
          // Optionally: handle logout
        }
      }
    };

    // Check immediately on mount
    checkTokenRefresh();
    // Then check every 1 minute
    const intervalId = setInterval(checkTokenRefresh, 60 * 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/VerifyOtpPage" element={<VerifyOtpPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/otp-login" element={<OtpLoginPage />} />
        <Route path="/AudioRecorderPage" element={<AudioRecorderPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
      </Routes>
    </Router>
  );
}

export default App;
