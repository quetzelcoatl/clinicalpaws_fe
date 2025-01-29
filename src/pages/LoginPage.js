import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ variant: "", message: "" });

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.verifyPassword(email, password);
      setAlert({ variant: "success", message: res.message });
      // Save tokens, e.g., localStorage
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      // Possibly redirect to profile
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3 className="mb-3">Login</h3>
      {alert.message && <Alert variant={alert.variant}>{alert.message}</Alert>}
      <Form onSubmit={handleLogin}>
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
          <Form.Label>Password</Form.Label>
          <Form.Control 
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
        </Form.Group>
        <Button variant="primary" type="submit">Login</Button>
      </Form>
    </div>
  );
}

export default LoginPage;
