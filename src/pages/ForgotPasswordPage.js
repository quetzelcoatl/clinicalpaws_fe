import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [alert, setAlert] = useState({ variant: "", message: "" });

  const handleSendLink = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.resetPasswordLink(email);
      setAlert({ variant: "success", message: res.message });
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3>Forgot Password</h3>
      {alert.message && <Alert variant={alert.variant}>{alert.message}</Alert>}

      <Form onSubmit={handleSendLink}>
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
        <Button variant="primary" type="submit">Send Reset Link</Button>
      </Form>
    </div>
  );
}

export default ForgotPasswordPage;
