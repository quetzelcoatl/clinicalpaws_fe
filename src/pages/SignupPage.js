import React, { useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";

function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [alert, setAlert] = useState({ variant: "", message: "" });

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.newSignupEmail(name, email, password);
      setAlert({ variant: "success", message: res.message });
      // Possibly navigate to /verify-otp or prompt user to enter OTP
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3 className="mb-3">Sign Up</h3>
      {alert.message && (
        <Alert variant={alert.variant}>{alert.message}</Alert>
      )}
      <Form onSubmit={handleSignup}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control 
            type="text"
            placeholder="Jane Doe"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required 
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Email address</Form.Label>
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
        <Button variant="primary" type="submit">Sign Up</Button>
      </Form>
    </div>
  );
}

export default SignupPage;
