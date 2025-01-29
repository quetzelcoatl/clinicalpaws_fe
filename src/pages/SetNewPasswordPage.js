import React, { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { Form, Button, Alert } from "react-bootstrap";
import { useSearchParams } from "react-router-dom";

function SetNewPasswordPage() {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [resetId, setResetId] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [alert, setAlert] = useState({ variant: "", message: "" });

  useEffect(() => {
    // e.g., /set-new-password?email=jane@example.com&reset_id=xxxxx
    setEmail(searchParams.get("email") || "");
    setResetId(searchParams.get("reset_id") || "");
  }, [searchParams]);

  const handleSetPassword = async (e) => {
    e.preventDefault();
    try {
      const res = await AuthService.setPassword(email, resetId, newPassword);
      setAlert({ variant: "success", message: res.message });
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h3>Set New Password</h3>
      {alert.message && <Alert variant={alert.variant}>{alert.message}</Alert>}
      <Form onSubmit={handleSetPassword}>
        <Form.Group className="mb-3">
          <Form.Label>New Password</Form.Label>
          <Form.Control
            type="password"
            placeholder="Enter new password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
        </Form.Group>
        <Button variant="primary" type="submit">Update Password</Button>
      </Form>
    </div>
  );
}

export default SetNewPasswordPage;
