// src/pages/ResetPasswordPage.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AuthService from "../services/AuthService";
import "../styles/Auth.css";

function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [resetId, setResetId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Parse URL parameters
    const searchParams = new URLSearchParams(location.search);
    const emailParam = searchParams.get("email");
    const resetIdParam = searchParams.get("reset_id");
    const actionParam = searchParams.get("action");

    if (emailParam && resetIdParam && actionParam === "set-new-password") {
      setEmail(emailParam);
      setResetId(resetIdParam);
    } else {
      setError("Invalid or missing reset parameters");
    }
  }, [location]);

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // Validate password strength (optional)
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    try {
      // Call the API to set the new password
      await AuthService.setPassword(email, resetId, newPassword);

      setSuccess(true);

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to reset password. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Reset Password</h2>

        {success ? (
          <div className="auth-success">
            Password successfully reset! Redirecting to login page...
          </div>
        ) : (
          <form onSubmit={handleResetPassword}>
            {error && <div className="auth-error">{error}</div>}

            <input
              type="password"
              className="auth-input"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />

            <input
              type="password"
              className="auth-input"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />

            <button type="submit" className="auth-button">
              Reset Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
