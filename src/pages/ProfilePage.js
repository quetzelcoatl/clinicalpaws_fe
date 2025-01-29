import React, { useEffect, useState } from "react";
import AuthService from "../services/AuthService";
import { Alert, Button } from "react-bootstrap";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState({ variant: "", message: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      setAlert({ variant: "danger", message: "No access token. Please log in." });
      return;
    }
    try {
      const res = await AuthService.fetchUserDetails(accessToken);
      setUser(res.data);
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  const handleRefreshToken = async () => {
    try {
      const email = user?.email;
      if (!email) throw new Error("No user email to refresh token");
      const refreshToken = localStorage.getItem("refreshToken");
      const res = await AuthService.getAccessTokenFromRefresh(email, refreshToken);
      localStorage.setItem("accessToken", res.data.access_token);
      localStorage.setItem("refreshToken", res.data.refresh_token);
      setAlert({ variant: "success", message: "Access token refreshed!" });
    } catch (err) {
      setAlert({ variant: "danger", message: err.message });
    }
  };

  if (alert.message) {
    return <Alert variant={alert.variant}>{alert.message}</Alert>;
  }
  if (!user) {
    return <p>Loading profile...</p>;
  }

  return (
    <div>
      <h3>Profile</h3>
      <p><strong>User ID:</strong> {user.user_id}</p>
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>

      <Button variant="secondary" onClick={handleRefreshToken}>
        Refresh Access Token
      </Button>
    </div>
  );
}

export default ProfilePage;
