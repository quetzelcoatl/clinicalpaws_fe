// src/pages/LoginPage.js
import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Link, useNavigate } from "react-router-dom";
import Cookies from "js-cookie";

import "../styles/Auth.css"; // or wherever your CSS resides

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // POST to /api/signup/verify_password
      const res = await AuthService.verifyPassword(email, password);

      // res.data should look like:
      // {
      //   "access_token": "...",
      //   "refresh_token": "...",
      //   "token_type": "bearer",
      //   "email": "user@example.com",
      //   ...
      // }

      const { access_token, refresh_token } = res.data;

      // EXAMPLE: Store tokens in cookies with secure & sameSite attributes
      Cookies.set("accessToken", access_token, {
        // expires sets # days or a Date; e.g., expires: 1 => 1 day
        // For short-living access tokens, e.g. 15 minutes, pass a date or just omit for session cookie
        // expires: 1, // 1 day
        path: "/",
        secure: true,    // requires HTTPS in production
        sameSite: "strict",
      });

      Cookies.set("refreshToken", refresh_token, {
        // e.g., a longer expiry for refresh token
        expires: 30, // 30 days
        path: "/",
        secure: true,
        sameSite: "strict",
      });

      // Optionally store user’s email or user_id as well
      Cookies.set("userEmail", res.data.email, { path: "/", secure: true, sameSite: "strict" });

      // Now navigate to /profile or wherever
      navigate("/profile");
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
