// src/App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import OtpLoginPage from "./pages/OtpLoginPage";
import AudioRecorderPage from "./pages/AudioRecorderPage";
import "./styles/Auth.css";
// ... plus other pages if needed

function App() {
  return (
    <Router>
      <Routes>
        {/* Show the brand-new landing page at the root path */}
        <Route path="/" element={<LandingPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/otp-login" element={<OtpLoginPage />} />
        {/* ... other routes as needed */}
      </Routes>
    </Router>
  );
}

export default App;
