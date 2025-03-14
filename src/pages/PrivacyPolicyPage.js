import React, { useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate, Link } from "react-router-dom";
// Add FontAwesome for icons
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMicrophone, 
  faUser, 
  faCog, 
  faSignOutAlt,
  faChevronLeft
} from "@fortawesome/free-solid-svg-icons";

function PrivacyPolicyPage() {
  // States
  const [isMobile, setIsMobile] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState(""); 
  const navigate = useNavigate();

  // Check viewport size for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const accessToken = Cookies.get("accessToken");
        if (!accessToken) {
          // If no token, we don't display user-specific content
          return;
        }

        const response = await fetch(
          "https://clinicalpaws.com/api/signup/fetch_user_details",
          {
            method: "GET",
            headers: {
              token: accessToken,
              accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          console.error("Error fetching user details:", errorData);
          return;
        }

        const data = await response.json();
        if (data?.data?.name) {
          setUserName(data.data.name);
        }
      } catch (err) {
        console.error("Error in fetchUserDetails:", err);
      }
    };

    fetchUserDetails();
  }, []);

  // Random avatar color/initials
  const [avatarBgColor] = useState(() => {
    const colors = [
      "#4A90E2", // Blue
      "#50C878", // Emerald
      "#9370DB", // Medium Purple
      "#FF6B6B", // Light Red
      "#FFD700", // Gold
      "#20B2AA", // Light Sea Green
      "#FF7F50", // Coral
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  });

  // Compute initials from userName
  const initials = (() => {
    if (!userName) return "NA";
    return userName.trim().slice(0, 2).toUpperCase();
  })();

  // Profile dropdown logic
  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleMyProfile = () => {
    navigate("/profile");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    navigate("/login");
  };

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        backgroundColor: "#111827",
        fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        color: "#f3f4f6",
      }}
    >
      {/* Top Navigation Bar */}
      <div
        style={{
          height: isMobile ? "60px" : "70px",
          backgroundColor: "rgba(31, 41, 55, 0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          zIndex: 100,
          position: "sticky",
          top: 0,
          width: "100%",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        {/* Left side: Title and Back Button */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "16px"
        }}>
          {/* Back Button */}
          <button
            onClick={handleBack}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#60A5FA",
              display: "flex",
              alignItems: "center",
              fontSize: "14px",
              padding: "8px",
              borderRadius: "4px",
              transition: "background-color 0.2s",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
            }}
          >
            <FontAwesomeIcon icon={faChevronLeft} style={{ marginRight: "6px" }} />
            Back
          </button>

          {/* Title */}
          <div style={{
            fontWeight: "600",
            fontSize: "18px",
            color: "#60A5FA",
            letterSpacing: "0.5px"
          }}>
            Clinical Paws
          </div>
        </div>

        {/* Right side: Profile */}
        <div style={{ position: "relative" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: userName ? `linear-gradient(135deg, ${avatarBgColor}, ${avatarBgColor}dd)` : "#374151",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "600",
              cursor: "pointer",
              userSelect: "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
              border: "2px solid rgba(255,255,255,0.1)",
              transition: "transform 0.2s ease",
            }}
            onClick={toggleProfileMenu}
          >
            {userName ? initials : <FontAwesomeIcon icon={faUser} style={{ fontSize: "16px" }} />}
          </div>
          {showProfileMenu && (
            <div
              style={{
                position: "absolute",
                top: "55px",
                right: 0,
                backgroundColor: "#1f2937",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)",
                borderRadius: "12px",
                zIndex: 999,
                minWidth: isMobile ? "160px" : "200px",
                border: "1px solid rgba(255,255,255,0.08)",
                maxWidth: isMobile ? "calc(100vw - 40px)" : "auto",
                animation: "fadeIn 0.2s ease-out",
                overflow: "hidden",
              }}
            >
              {userName ? (
                <>
                  <div
                    style={{
                      padding: "16px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.08)",
                      fontWeight: "600",
                      color: "#f3f4f6",
                      wordBreak: "break-word",
                      fontSize: "15px"
                    }}
                  >
                    {userName}
                  </div>
                  <div
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#e2e8f0",
                      minHeight: "44px",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={handleMyProfile}
                  >
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: "12px", width: "16px", flexShrink: 0, color: "#60A5FA" }} />
                    <span style={{ whiteSpace: "nowrap", fontSize: "14px" }}>My Profile</span>
                  </div>
                  <div
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#e2e8f0",
                      minHeight: "44px",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={handleSettings}
                  >
                    <FontAwesomeIcon icon={faCog} style={{ marginRight: "12px", width: "16px", flexShrink: 0, color: "#60A5FA" }} />
                    <span style={{ whiteSpace: "nowrap", fontSize: "14px" }}>Settings</span>
                  </div>
                  <div
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#f87171",
                      borderTop: "1px solid rgba(255,255,255,0.08)",
                      minHeight: "44px",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={handleLogout}
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: "12px", width: "16px", flexShrink: 0, color: "#f87171" }} />
                    <span style={{ whiteSpace: "nowrap", fontSize: "14px" }}>Logout</span>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      padding: "12px 20px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      color: "#e2e8f0",
                      minHeight: "44px",
                      transition: "background-color 0.15s ease",
                    }}
                    onClick={() => navigate("/login")}
                  >
                    <FontAwesomeIcon icon={faUser} style={{ marginRight: "12px", width: "16px", flexShrink: 0, color: "#60A5FA" }} />
                    <span style={{ whiteSpace: "nowrap", fontSize: "14px" }}>Login</span>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          padding: isMobile ? "1.5rem 1rem" : "2rem",
          maxWidth: "1000px",
          margin: "0 auto",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(31, 41, 55, 0.4)",
            borderRadius: "12px",
            padding: isMobile ? "1.5rem" : "2.5rem",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
          }}
        >
          <h1 style={{ 
            color: "#60A5FA", 
            fontSize: isMobile ? "24px" : "30px",
            marginBottom: "1.5rem",
            fontWeight: "600"
          }}>
            Privacy Policy
          </h1>
          
          <div style={{ color: "#d1d5db", lineHeight: "1.6", fontSize: isMobile ? "15px" : "16px" }}>
            <p style={{ marginBottom: "1.5rem" }}>
              Last updated: July 15, 2023
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              1. Introduction
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Clinical Paws ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how your personal information is collected, used, and disclosed by Clinical Paws. This Privacy Policy applies to our website, clinicalpaws.com, and its associated services (collectively, our "Service").
            </p>
            <p style={{ marginBottom: "1rem" }}>
              By accessing or using our Service, you signify that you have read, understood, and agree to our collection, storage, use, and disclosure of your personal information as described in this Privacy Policy.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              2. Information We Collect
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We collect information that you provide directly to us when you:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Register for an account</li>
              <li style={{ marginBottom: "0.5rem" }}>Use the audio recording and transcription features</li>
              <li style={{ marginBottom: "0.5rem" }}>Complete forms or submit information through our Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Communicate with us via email, phone, or otherwise</li>
              <li style={{ marginBottom: "0.5rem" }}>Subscribe to our newsletter or promotional materials</li>
            </ul>
            <p style={{ marginBottom: "1rem" }}>
              The types of information we may collect include:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Personal identifiers (such as name, email address)</li>
              <li style={{ marginBottom: "0.5rem" }}>Professional information (such as your veterinary practice details)</li>
              <li style={{ marginBottom: "0.5rem" }}>Audio recordings and their transcriptions</li>
              <li style={{ marginBottom: "0.5rem" }}>Information about your use of our Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Other information you choose to provide</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              3. How We Use Your Information
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We use the information we collect for various purposes, including to:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Provide, maintain, and improve our Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Process and complete transactions</li>
              <li style={{ marginBottom: "0.5rem" }}>Transcribe and analyze audio recordings to provide veterinary insights</li>
              <li style={{ marginBottom: "0.5rem" }}>Send technical notices, updates, security alerts, and administrative messages</li>
              <li style={{ marginBottom: "0.5rem" }}>Respond to your comments, questions, and requests</li>
              <li style={{ marginBottom: "0.5rem" }}>Communicate with you about products, services, offers, and events</li>
              <li style={{ marginBottom: "0.5rem" }}>Monitor and analyze trends, usage, and activities in connection with our Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Detect, investigate, and prevent fraudulent transactions and other illegal activities</li>
              <li style={{ marginBottom: "0.5rem" }}>Personalize and improve the Service</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              4. Audio Recording Data
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Our Service includes features that allow you to record audio for veterinary consultations. Please note:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Audio recordings are processed to provide veterinary insights and recommendations</li>
              <li style={{ marginBottom: "0.5rem" }}>Transcripts of recordings are stored in your account history</li>
              <li style={{ marginBottom: "0.5rem" }}>We use industry-standard security measures to protect this sensitive information</li>
              <li style={{ marginBottom: "0.5rem" }}>You should obtain appropriate consent from clients before recording conversations that include their information</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              5. Sharing of Information
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We may share the information we collect in various ways, including:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>With vendors, consultants, and other service providers who need access to such information to carry out work on our behalf</li>
              <li style={{ marginBottom: "0.5rem" }}>In response to a request for information if we believe disclosure is in accordance with, or required by, any applicable law or legal process</li>
              <li style={{ marginBottom: "0.5rem" }}>If we believe your actions are inconsistent with our user agreements or policies, or to protect the rights, property, and safety of Clinical Paws or others</li>
              <li style={{ marginBottom: "0.5rem" }}>In connection with, or during negotiations of, any merger, sale of company assets, financing, or acquisition of all or a portion of our business by another company</li>
              <li style={{ marginBottom: "0.5rem" }}>With your consent or at your direction</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              6. Data Security
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We take reasonable measures to help protect information about you from loss, theft, misuse, unauthorized access, disclosure, alteration, and destruction. However, no internet or electronic communications service is ever completely secure or error-free.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              7. Your Rights and Choices
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              You have certain rights regarding your personal information:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Account Information: You may update, correct, or delete your account information at any time by logging into your account or contacting us</li>
              <li style={{ marginBottom: "0.5rem" }}>Cookies: Most web browsers are set to accept cookies by default. You can usually set your browser to remove or reject browser cookies</li>
              <li style={{ marginBottom: "0.5rem" }}>Promotional Communications: You may opt out of receiving promotional emails from us by following the instructions in those emails</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              8. International Data Transfers
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Clinical Paws is based in the United States. If you are accessing our Service from outside the United States, please be aware that your information may be transferred to, stored, and processed by us and our service providers in the United States and other countries where our servers are located.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              9. Children's Privacy
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Our Service is not directed to children under 18 years of age, and we do not knowingly collect personal information from children under 18. If we learn we have collected personal information from a child under 18, we will delete that information as quickly as possible.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              10. Changes to this Privacy Policy
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We may change this Privacy Policy from time to time. If we make changes, we will notify you by revising the date at the top of the policy and, in some cases, we may provide you with additional notice (such as adding a statement to our website or sending you a notification).
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              11. Contact Us
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <p style={{ marginBottom: "0.5rem" }}>Email: privacy@clinicalpaws.com</p>
            <p>Clinical Paws<br />
            123 Veterinary Way, Suite 100<br />
            San Francisco, CA 94105</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        padding: "1.5rem",
        textAlign: "center",
        borderTop: "1px solid rgba(255, 255, 255, 0.05)",
        marginTop: "2rem",
      }}>
        <div style={{
          display: "flex",
          justifyContent: "center",
          gap: "1rem",
          marginBottom: "1rem",
          flexWrap: "wrap",
        }}>
          <Link to="/" style={{ 
            color: "#d1d5db", 
            textDecoration: "none", 
            fontSize: "14px",
            transition: "color 0.2s"
          }}>
            Home
          </Link>
          <Link to="/privacy-policy" style={{ 
            color: "#60A5FA", 
            textDecoration: "none", 
            fontSize: "14px",
            transition: "color 0.2s",
            fontWeight: "600",
          }}>
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" style={{ 
            color: "#d1d5db", 
            textDecoration: "none", 
            fontSize: "14px",
            transition: "color 0.2s"
          }}>
            Terms of Service
          </Link>
        </div>
        <div style={{ color: "#9CA3AF", fontSize: "14px" }}>
          © {new Date().getFullYear()} Clinical Paws. All rights reserved.
        </div>
      </div>

      {/* Add styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            background-color: #111827;
          }

          #root {
            min-height: 100%;
            display: flex;
            flex-direction: column;
          }

          @media (max-width: 768px) {
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
              font-family: 'Inter', sans-serif;
            }
          }

          /* Improved scrollbar styling */
          ::-webkit-scrollbar {
            width: 6px;
            height: 6px;
          }

          ::-webkit-scrollbar-track {
            background: #1f2937;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 4px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: #60a5fa;
          }

          /* Animation for hover effects */
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }

          a:hover {
            color: #60A5FA !important;
          }
        `}
      </style>
    </div>
  );
}

export default PrivacyPolicyPage; 