import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Layout from "./components/Layout";
import SignupPage from "./pages/SignupPage";
import VerifyOtpPage from "./pages/VerifyOtpPage";
import LoginPage from "./pages/LoginPage";
import OtpLoginPage from "./pages/OtpLoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import SetNewPasswordPage from "./pages/SetNewPasswordPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SignupPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/otp-login" element={<OtpLoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/set-new-password" element={<SetNewPasswordPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
