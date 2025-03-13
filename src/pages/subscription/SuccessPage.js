import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheckCircle,
  faCrown,
  faArrowLeft
} from "@fortawesome/free-solid-svg-icons";

function SuccessPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  
  // Auto-redirect to main page after 5 seconds
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else {
      navigate("/"); // Redirect to home page
    }
  }, [countdown, navigate]);
  
  const handleBack = () => {
    navigate("/"); // Go back to main app
  };
  
  // Detect mobile screens
  const isMobile = window.innerWidth < 768;
  
  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#111827",
      color: "#f3f4f6",
      fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        height: isMobile ? "60px" : "70px",
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center", 
          gap: "8px", 
          cursor: "pointer"
        }} onClick={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to App</span>
        </div>
        
        <div style={{
          fontWeight: "600",
          fontSize: "18px",
          color: "#60A5FA",
          letterSpacing: "0.5px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <FontAwesomeIcon icon={faCrown} style={{ color: "#F59E0B" }} />
          Clinical Paws Pro
        </div>
        
        <div style={{ width: "24px" }}></div> {/* Empty space for balance */}
      </div>
      
      {/* Success Content */}
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}>
        <div style={{
          maxWidth: "600px",
          width: "100%",
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "rgba(31, 41, 55, 0.6)",
          borderRadius: "16px",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.2)",
          animation: "fadeInUp 0.5s ease-out"
        }}>
          <div style={{
            width: "100px",
            height: "100px",
            borderRadius: "50%",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
          }}>
            <FontAwesomeIcon 
              icon={faCheckCircle} 
              style={{ 
                fontSize: "48px", 
                color: "#10B981" 
              }} 
            />
          </div>
          
          <h1 style={{
            fontSize: isMobile ? "24px" : "32px",
            fontWeight: "700",
            color: "#F3F4F6",
            marginBottom: "16px"
          }}>
            Subscription Successful!
          </h1>
          
          <div style={{
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #F59E0B, #D97706)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "24px auto",
            boxShadow: "0 8px 20px rgba(245, 158, 11, 0.3)"
          }}>
            <FontAwesomeIcon icon={faCrown} style={{ fontSize: "32px", color: "#fff" }} />
          </div>
          
          <p style={{
            fontSize: "18px",
            color: "#D1D5DB",
            marginBottom: "32px",
            lineHeight: "1.6"
          }}>
            Thank you for upgrading to Clinical Paws Pro! Your account has been successfully upgraded, and you now have access to all premium features.
          </p>
          
          <p style={{
            fontSize: "16px",
            color: "#9CA3AF",
            marginBottom: "32px"
          }}>
            Redirecting to main app in <b>{countdown}</b> seconds...
          </p>
          
          <button
            onClick={handleBack}
            style={{
              padding: "16px 32px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
              color: "#ffffff",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "600",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
              gap: "8px"
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            Return to App Now
          </button>
        </div>
      </div>
      
      {/* Footer */}
      <div style={{
        textAlign: "center",
        padding: "24px",
        color: "#9CA3AF",
        fontSize: "14px"
      }}>
        <p>© {new Date().getFullYear()} Clinical Paws. All rights reserved.</p>
      </div>
      
      {/* Global styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body, html {
            margin: 0;
            padding: 0;
            background-color: #111827;
          }
          
          * {
            box-sizing: border-box;
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 15px rgba(59, 130, 246, 0.4);
          }
          
          button:active {
            transform: translateY(0);
          }
        `}
      </style>
    </div>
  );
}

export default SuccessPage; 