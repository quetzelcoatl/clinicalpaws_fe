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

function TermsOfServicePage() {
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
            Terms of Service
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
              1. Agreement to Terms
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              By accessing or using the Clinical Paws website ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you disagree with any part of the terms, you may not access the Service.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              These Terms apply to all visitors, users, and others who access or use the Service. By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              2. Service Description
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Clinical Paws provides a platform for veterinary professionals to record, transcribe, and analyze conversations related to veterinary care. The Service uses artificial intelligence to process audio recordings and provide relevant veterinary insights.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              While our Service strives to provide accurate information, it is not intended to replace professional veterinary judgment. The information provided through our Service should be used as a supplementary tool in conjunction with your professional expertise and judgment.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              3. Accounts
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              When you create an account with us, you must provide accurate, complete, and current information. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              4. Subscription and Payments
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis ("Billing Cycle"). Billing cycles are set on a monthly or annual basis, depending on the type of subscription plan you select.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              At the end of each Billing Cycle, your subscription will automatically renew under the same conditions unless you cancel it or Clinical Paws cancels it. You may cancel your subscription renewal through your online account management page or by contacting our customer support team.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              A valid payment method, including credit card, is required to process the payment for your subscription. You shall provide Clinical Paws with accurate and complete billing information including full name, address, state, zip code, and valid payment method information. By submitting such payment information, you automatically authorize Clinical Paws to charge all subscription fees incurred through your account to any such payment instruments.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Should automatic billing fail to occur for any reason, Clinical Paws will issue an electronic invoice indicating that you must proceed manually, within a certain deadline date, with the full payment corresponding to the billing period as indicated on the invoice.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              5. Free Trial
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              Clinical Paws may, at its sole discretion, offer a subscription with a free trial for a limited period of time. You may be required to enter your billing information to sign up for the free trial.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              If you do enter your billing information when signing up for a free trial, you will not be charged by Clinical Paws until the free trial has expired. On the last day of the free trial period, unless you canceled your subscription, you will be automatically charged the applicable subscription fee for the type of subscription you have selected.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              At any time and without notice, Clinical Paws reserves the right to (i) modify the terms and conditions of the free trial offer, or (ii) cancel such free trial offer.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              6. Intellectual Property
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              The Service and its original content, features, and functionality are and will remain the exclusive property of Clinical Paws and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Clinical Paws.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              You retain ownership of the content you upload to the Service, including audio recordings and their transcriptions. However, by uploading content to the Service, you grant Clinical Paws a worldwide, non-exclusive, royalty-free license to use, reproduce, adapt, publish, translate, and distribute your content in connection with the Service. This license enables Clinical Paws to operate, promote, and improve the Service, and to develop new services.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              7. Prohibited Uses
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              You may only use the Service for lawful purposes and in accordance with these Terms. You agree not to use the Service:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>In any way that violates any applicable national or international law or regulation</li>
              <li style={{ marginBottom: "0.5rem" }}>To exploit, harm, or attempt to exploit or harm minors in any way</li>
              <li style={{ marginBottom: "0.5rem" }}>To transmit, or procure the sending of, any advertising or promotional material, including any "junk mail," "chain letter," "spam," or any other similar solicitation</li>
              <li style={{ marginBottom: "0.5rem" }}>To impersonate or attempt to impersonate Clinical Paws, a Clinical Paws employee, another user, or any other person or entity</li>
              <li style={{ marginBottom: "0.5rem" }}>To engage in any other conduct that restricts or inhibits anyone's use or enjoyment of the Service, or which may harm Clinical Paws or users of the Service</li>
            </ul>
            <p style={{ marginBottom: "1rem" }}>
              Additionally, you agree not to:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Use the Service in any manner that could disable, overburden, damage, or impair the site</li>
              <li style={{ marginBottom: "0.5rem" }}>Use any robot, spider, or other automatic device, process, or means to access the Service for any purpose, including monitoring or copying any of the material on the Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Use any manual process to monitor or copy any of the material on the Service or for any other unauthorized purpose</li>
              <li style={{ marginBottom: "0.5rem" }}>Use any device, software, or routine that interferes with the proper working of the Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Introduce any viruses, trojan horses, worms, logic bombs, or other material which is malicious or technologically harmful</li>
              <li style={{ marginBottom: "0.5rem" }}>Attempt to gain unauthorized access to, interfere with, damage, or disrupt any parts of the Service</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              8. Limitation of Liability
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              In no event shall Clinical Paws, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Your access to or use of or inability to access or use the Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Any conduct or content of any third party on the Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Any content obtained from the Service</li>
              <li style={{ marginBottom: "0.5rem" }}>Unauthorized access, use, or alteration of your transmissions or content</li>
            </ul>
            <p style={{ marginBottom: "1rem" }}>
              The Service is provided on an "AS IS" and "AS AVAILABLE" basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              9. Indemnification
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              You agree to defend, indemnify, and hold harmless Clinical Paws and its licensee and licensors, and their employees, contractors, agents, officers, and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney's fees), resulting from or arising out of:
            </p>
            <ul style={{ marginBottom: "1rem", paddingLeft: "1.5rem" }}>
              <li style={{ marginBottom: "0.5rem" }}>Your use and access of the Service, by you or any person using your account and password</li>
              <li style={{ marginBottom: "0.5rem" }}>A breach of these Terms</li>
              <li style={{ marginBottom: "0.5rem" }}>Content you upload to the Service</li>
            </ul>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              10. Termination
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              If you wish to terminate your account, you may simply discontinue using the Service, or notify us that you wish to delete your account.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              All provisions of the Terms which by their nature should survive termination shall survive termination, including, without limitation, ownership provisions, warranty disclaimers, indemnity, and limitations of liability.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              11. Governing Law
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              These Terms shall be governed and construed in accordance with the laws of the State of California, United States, without regard to its conflict of law provisions.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              12. Changes to Terms
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
            <p style={{ marginBottom: "1rem" }}>
              By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
            </p>

            <h2 style={{ 
              color: "#f3f4f6", 
              fontSize: isMobile ? "18px" : "22px", 
              marginTop: "2rem", 
              marginBottom: "1rem",
              fontWeight: "600" 
            }}>
              13. Contact Us
            </h2>
            <p style={{ marginBottom: "1rem" }}>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p style={{ marginBottom: "0.5rem" }}>Email: legal@clinicalpaws.com</p>
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
            color: "#d1d5db", 
            textDecoration: "none", 
            fontSize: "14px",
            transition: "color 0.2s"
          }}>
            Privacy Policy
          </Link>
          <Link to="/terms-of-service" style={{ 
            color: "#60A5FA", 
            textDecoration: "none", 
            fontSize: "14px",
            transition: "color 0.2s",
            fontWeight: "600",
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

export default TermsOfServicePage; 