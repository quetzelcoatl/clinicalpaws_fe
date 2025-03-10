// src/pages/ForgotPassword.js
import React, { useState } from "react";
import { Link } from "react-router-dom";
import AuthService from "../services/AuthService";
import "../styles/Auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Assuming AuthService has a method to handle password reset requests
      await AuthService.requestPasswordReset(email);
      setIsSubmitted(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {!isSubmitted ? (
          <>
            <h2 className="auth-title">Reset Password</h2>
            <p className="auth-subtitle">
              Enter your email address and we'll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit}>
              {error && <div className="auth-error">{error}</div>}

              <input
                type="email"
                className="auth-input"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <button type="submit" className="auth-button">
                Send Reset Link
              </button>
            </form>

            <div className="auth-footer-text">
              Remembered your password?{" "}
              <Link to="/login" className="auth-footer-link">
                Back to login
              </Link>
            </div>
          </>
        ) : (
          <div className="auth-success">
            <h2 className="auth-title">Check Your Email</h2>
            <p className="auth-message">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="auth-instructions">
              Please check your inbox and follow the instructions to reset your password.
              The link will expire in 30 minutes for security reasons.
            </p>
            <p className="auth-note">
              Don't see the email? Check your spam folder or{" "}
              <button
                className="auth-button"
                onClick={handleSubmit}
              >
                Resend the link
              </button>
            </p>
            <div className="auth-footer-text">
              <Link to="/login" className="auth-footer-link">
                Back to login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;
