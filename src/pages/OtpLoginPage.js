// src/pages/OtpLoginPage.js
import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../styles/Auth.css";

function OtpLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await AuthService.loginWithOtp(email);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await AuthService.verifyOtp(email, Number(otp), "login");
      const { access_token, refresh_token } = res.data;

      // Store tokens in cookies
      Cookies.set("accessToken", access_token, { path: "/", secure: false });
      Cookies.set("refreshToken", refresh_token, { path: "/", secure: false });

      // **Redirect** to the new audio page
      navigate("/record-audio");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Login via OTP</h2>
        {error && <div className="auth-error">{error}</div>}

        {!otpSent ? (
          <form onSubmit={handleSendOtp}>
            <input
              type="email"
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" className="auth-button">
              Send OTP
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <input
              type="number"
              className="auth-input"
              placeholder="OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />
            <button type="submit" className="auth-button">
              Verify OTP
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default OtpLoginPage;
