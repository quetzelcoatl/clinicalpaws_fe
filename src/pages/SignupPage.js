// src/pages/SignupPage.js
import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Link, useNavigate } from "react-router-dom";

function SignupPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await AuthService.newSignupEmail(name, email, password);
      // Navigate to verify-otp page with email in the state and as a query parameter for backup
      navigate(`/verify-otp?email=${encodeURIComponent(email)}&purpose=signup`, { 
        state: { email, purpose: "signup" } 
      });
    } catch (err) {
      setError(err.message || "Signup failed. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Create account</h2>
        <form onSubmit={handleSignup}>
          {error && <div className="auth-error">{error}</div>}

          <input
            type="text"
            className="auth-input"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <input
            type="email"
            className="auth-input"
            placeholder="Email address*"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            className="auth-input"
            placeholder="Create password*"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="auth-button">
            Sign Up
          </button>
        </form>
        <div className="auth-footer-text">
          Already have an account?{" "}
          <Link to="/login" className="auth-footer-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SignupPage;
