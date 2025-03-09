// src/pages/VerifyOtpPage.js
import React, { useState, useEffect } from "react";
import AuthService from "../services/AuthService";
import { Link, useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie"; // Add this import

function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [email, setEmail] = useState("");
  const [purpose, setPurpose] = useState("signup");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    // Try to get email from location state first
    const stateEmail = location.state?.email;
    const statePurpose = location.state?.purpose || "signup";

    // If not available in state, try to get from URL parameters
    const queryParams = new URLSearchParams(location.search);
    const queryEmail = queryParams.get('email');
    const queryPurpose = queryParams.get('purpose') || "signup";

    // Set the email and purpose, prioritizing state over URL parameters
    const finalEmail = stateEmail || queryEmail;
    const finalPurpose = statePurpose || queryPurpose;

    if (finalEmail) {
      setEmail(finalEmail);
      setPurpose(finalPurpose);
    } else {
      setError("Email is missing. Please try again or contact support.");
    }
  }, [location]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    try {
      // Convert otp from string to integer before sending to the API
      const otpNumber = parseInt(otp, 10);

      if (isNaN(otpNumber)) {
        setError("Please enter a valid numeric code");
        return;
      }

      if (!email) {
        setError("Email is missing. Please try again or contact support.");
        return;
      }

      // Pass all required parameters to the verification method
      const res = await AuthService.verifyOtp(email, otpNumber, purpose);

      // Extract tokens from response
      const { access_token, refresh_token } = res.data;

      // Store tokens + timestamp + email in cookies
      Cookies.set("accessToken", access_token, { path: "/", secure: false });
      Cookies.set("refreshToken", refresh_token, { path: "/", secure: false });
      Cookies.set("lastRefreshedAt", Date.now().toString(), { path: "/" });
      Cookies.set("email", email, { path: "/" });
      
      setSuccess(true);
      // Navigate to the audio recorder page after successful verification
      setTimeout(() => navigate("/AudioRecorderPage"), 2000);
    } catch (err) {
      setError(err.message || "Failed to verify OTP. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    try {
      setResending(true);
      setError("");
      
      if (!email) {
        setError("Email is missing. Please try again or contact support.");
        return;
      }
      
      // Pass the email to resend OTP
      await AuthService.resendOtp(email, purpose);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 3000);
    } catch (err) {
      setError(err.message || "Failed to resend verification code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="auth-title">Verify Your Email</h2>
        <p className="auth-subtitle">
          We've sent a verification code to {email || "your email"}. Please enter it below.
        </p>
        
        {success ? (
          <div className="auth-success">
            Email verified successfully! Redirecting...
          </div>
        ) : (
          <form onSubmit={handleVerify}>
            {error && <div className="auth-error">{error}</div>}
            {resendSuccess && <div className="auth-success">Verification code sent! Please check your email.</div>}

            <input
              type="text"
              className="auth-input"
              placeholder="Enter verification code"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
            />

            <button type="submit" className="auth-button">
              Verify
            </button>
            
            <div className="auth-footer-text">
              Didn't receive the code?{" "}
              <button 
                className="auth-button auth-button-secondary" 
                onClick={handleResendOtp}
                disabled={resending}
                type="button"
              >
                {resending ? "Sending..." : "Resend Code"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default VerifyOtpPage;
