// src/pages/LoginPage.js
import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import "../styles/Auth.css";

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await AuthService.verifyPassword(email, password);
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
        <h2 className="auth-title">Log in</h2>
        <form onSubmit={handleLogin}>
          {error && <div className="auth-error">{error}</div>}

          <input
            type="email"
            className="auth-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="auth-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            Log in
          </button>
        </form>

        <div className="auth-footer-text">
          <Link to="/otp-login" className="auth-footer-link">
            Log in with OTP instead
          </Link>
        </div>

        <div className="auth-footer-text">
          Don’t have an account?{" "}
          <Link to="/signup" className="auth-footer-link">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
