import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";

function VerifyOtpPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [alert, setAlert] = useState({ variant: "", message: "" });

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    try {
      // default purpose = "signup"
      const res = await AuthService.verifyOtp(email, Number(otp), "signup");
      setAlert({ variant: "success", message: res.message });
      // Possibly navigate to /login or a welcome screen
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  const handleResendOtp = async () => {
    try {
      const res = await AuthService.resendOtp(email);
      setAlert({ variant: "info", message: res.message });
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3 className="mb-3">Verify OTP</h3>
      {alert.message && (
        <Alert variant={alert.variant}>{alert.message}</Alert>
      )}
      <Form onSubmit={handleVerifyOtp}>
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
        <Button variant="primary" type="submit">Verify</Button>
        <Button variant="link" onClick={handleResendOtp}>
          Resend OTP
        </Button>
      </Form>
    </div>
  );
}

export default VerifyOtpPage;
