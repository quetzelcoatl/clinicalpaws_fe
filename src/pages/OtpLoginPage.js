import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";

function OtpLoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [alert, setAlert] = useState({ variant: "", message: "" });

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.loginWithOtp(email);
      setAlert({ variant: "success", message: res.message });
      setOtpSent(true);
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.verifyOtp(email, Number(otp), "login");
      setAlert({ variant: "success", message: res.message });
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      // Possibly redirect to profile
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3>OTP Login</h3>
      {alert.message && <Alert variant={alert.variant}>{alert.message}</Alert>}

      {!otpSent && (
        <Form onSubmit={handleSendOtp}>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control 
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </Form.Group>
          <Button variant="primary" type="submit">Send OTP</Button>
        </Form>
      )}

      {otpSent && (
        <Form onSubmit={handleVerifyOtp}>
          <Form.Group className="mb-3">
            <Form.Label>OTP</Form.Label>
            <Form.Control 
              type="number"
              placeholder="123456"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required 
            />
          </Form.Group>
          <Button variant="primary" type="submit">Verify OTP</Button>
        </Form>
      )}
    </div>
  );
}

export default OtpLoginPage;
