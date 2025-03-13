import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCheck,
  faCrown,
  faArrowLeft,
  faSpinner,
  faBolt,
  faShieldAlt,
  faMicrophone,
  faChartLine,
  faHeadset,
  faStar
} from "@fortawesome/free-solid-svg-icons";

function ProVersionPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Feature list for Pro version with icons
  const proFeatures = [
    { text: "Unlimited voice transcriptions", icon: faMicrophone },
    { text: "Priority processing", icon: faBolt },
    { text: "Advanced AI medical assistant", icon: faShieldAlt },
    { text: "Enhanced clinical analytics", icon: faChartLine },
    { text: "Premium customer support", icon: faHeadset },
    { text: "Early access to new features", icon: faStar }
  ];
  
  // Only monthly plan
  const plan = {
    id: "monthly",
    name: "Monthly",
    price: "£9.99",
    billingCycle: "per month",
    description: "Full access to all premium features"
  };
  
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // Add event listener to update isMobile state when window is resized
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        setError("Please log in to subscribe to Pro version");
        navigate("/login");
        return;
      }
      
      const response = await fetch(
        "https://clinicalpaws.com/api/signup/create-checkout-session",
        {
          method: "POST",
          headers: {
            "accept": "application/json",
            "token": accessToken,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            plan: "monthly"
          })
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to create checkout session");
      }
      
      // Redirect to Stripe checkout URL
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err) {
      console.error("Checkout error:", err);
      setError(err.message || "An error occurred during checkout");
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };
  
  return (
    <div style={{
      height: isMobile ? "auto" : "100vh", // Auto height on mobile, fixed on desktop
      minHeight: isMobile ? "100vh" : "auto", // Min height on mobile
      backgroundColor: "#0F172A",
      color: "#f3f4f6",
      fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: isMobile ? "auto" : "hidden" // Allow scrolling on mobile, prevent on desktop
    }}>
      {/* Header */}
      <div style={{
        height: isMobile ? "50px" : "60px", // Original height on desktop
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: isMobile ? "0 16px" : "0 24px", // Original padding on desktop
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.2)",
        position: isMobile ? "sticky" : "relative", // Only sticky on mobile
        top: 0,
        zIndex: 10,
      }}>
        <div style={{
          display: "flex",
          alignItems: "center", 
          gap: "8px", 
          cursor: "pointer"
        }} onClick={handleBack}>
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back</span>
        </div>
        
        <div style={{
          fontWeight: "700",
          fontSize: isMobile ? "16px" : "20px", // Original size on desktop
          background: "linear-gradient(135deg, #60A5FA, #8B5CF6)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "0.5px",
          display: "flex",
          alignItems: "center",
          gap: "8px"
        }}>
          <div style={{
            background: "linear-gradient(135deg, #F59E0B, #EC4899)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            <FontAwesomeIcon icon={faCrown} />
          </div>
          Clinical Paws Pro
        </div>
        
        <div style={{ width: "24px" }}></div> {/* Empty space for balance */}
      </div>
      
      {/* Main Content - Single Screen Layout */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: isMobile ? "center" : "center", // Center on both
        alignItems: "center",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: isMobile ? "12px 16px" : "24px 16px", // Original padding on desktop
        width: "100%",
        boxSizing: "border-box",
        background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08), transparent 70%)",
      }}>
        {/* Content Container */}
        <div style={{
          display: "flex",
          width: "100%",
          gap: isMobile ? "16px" : "30px", // Original gap on desktop
          alignItems: "center",
          justifyContent: "center",
          flexDirection: isMobile ? "column" : "row", // Original row layout on desktop
        }}>
          {/* Left Side: Features */}
          <div style={{
            flex: 1,
            maxWidth: isMobile ? "100%" : "500px", // Original width on desktop
            marginBottom: isMobile ? "16px" : "0", // No margin on desktop
          }}>
            <div style={{
              marginBottom: isMobile ? "12px" : "24px", // Original margin on desktop
              textAlign: "left",
            }}>
              <h1 style={{
                fontSize: isMobile ? "24px" : "36px", // Original size on desktop
                fontWeight: "800",
                marginBottom: isMobile ? "8px" : "16px", // Original margin on desktop
                background: "linear-gradient(135deg, #F5F5F5, #60A5FA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                textShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}>
                Upgrade to Clinical Paws Pro
              </h1>
              
              <p style={{
                fontSize: isMobile ? "14px" : "18px", // Original size on desktop
                color: "#D1D5DB",
                lineHeight: isMobile ? "1.4" : "1.6", // Original line height on desktop
                marginBottom: isMobile ? "12px" : "24px", // Original margin on desktop
              }}>
                Unlock the full potential of your clinical practice with premium features 
                and advanced AI assistance.
              </p>
            </div>
            
            {/* Features Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(2, 1fr)", // Same on both
              gap: isMobile ? "8px" : "16px", // Original gap on desktop
            }}>
              {proFeatures.map((feature, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: isMobile ? "8px" : "12px", // Original gap on desktop
                  padding: isMobile ? "10px" : "16px", // Original padding on desktop
                  backgroundColor: "rgba(30, 41, 59, 0.7)",
                  borderRadius: "12px",
                  border: "1px solid rgba(99, 102, 241, 0.2)",
                  backdropFilter: "blur(5px)",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
                  transform: "scale(1)",
                  ":hover": {
                    transform: "scale(1.02)",
                    boxShadow: "0 8px 16px rgba(99, 102, 241, 0.2)",
                  }
                }}>
                  <div style={{
                    width: isMobile ? "28px" : "36px", // Original size on desktop
                    height: isMobile ? "28px" : "36px", // Original size on desktop
                    borderRadius: isMobile ? "8px" : "10px", // Original radius on desktop
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}>
                    <FontAwesomeIcon icon={feature.icon} style={{ 
                      color: "#818CF8", 
                      fontSize: isMobile ? "12px" : "16px" // Original size on desktop
                    }} />
                  </div>
                  <span style={{ 
                    color: "#E5E7EB", 
                    fontSize: isMobile ? "12px" : "15px", // Original size on desktop
                    fontWeight: "500" 
                  }}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Side: Pricing Card */}
          <div style={{
            flex: "0 0 auto",
            width: isMobile ? "100%" : "340px", // Original width on desktop
          }}>
            <div style={{
              padding: isMobile ? "20px" : "32px", // Original padding on desktop
              borderRadius: "20px",
              background: "linear-gradient(145deg, rgba(30, 41, 59, 0.9), rgba(15, 23, 42, 0.9))",
              border: "1px solid rgba(99, 102, 241, 0.3)",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3), 0 0 80px rgba(99, 102, 241, 0.2)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Decorative elements */}
              <div style={{
                position: "absolute",
                top: "-30px",
                right: "-30px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(99, 102, 241, 0.3), transparent 70%)",
                zIndex: 0,
              }}></div>
              
              <div style={{
                position: "relative",
                zIndex: 1,
                textAlign: "center",
                width: "100%",
              }}>
                <div style={{
                  width: isMobile ? "50px" : "70px", // Original size on desktop
                  height: isMobile ? "50px" : "70px", // Original size on desktop
                  borderRadius: isMobile ? "15px" : "20px", // Original radius on desktop
                  background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: isMobile ? "0 auto 16px" : "0 auto 24px", // Original margin on desktop
                  boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
                }}>
                  <FontAwesomeIcon icon={faCrown} style={{ 
                    fontSize: isMobile ? "20px" : "28px", // Original size on desktop
                    color: "#fff" 
                  }} />
                </div>
                
                <h3 style={{
                  fontSize: isMobile ? "20px" : "24px", // Original size on desktop
                  fontWeight: "700",
                  marginBottom: isMobile ? "4px" : "8px", // Original margin on desktop
                  color: "#F9FAFB",
                }}>
                  {plan.name} Plan
                </h3>
                
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: "4px",
                  marginBottom: isMobile ? "4px" : "8px" // Original margin on desktop
                }}>
                  <span style={{
                    fontSize: isMobile ? "36px" : "48px", // Original size on desktop
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #60A5FA, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-1px",
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ 
                    color: "#9CA3AF", 
                    fontSize: isMobile ? "14px" : "16px", // Original size on desktop
                    fontWeight: "500" 
                  }}>
                    {plan.billingCycle}
                  </span>
                </div>
                
                <p style={{
                  color: "#D1D5DB",
                  fontSize: isMobile ? "13px" : "15px", // Original size on desktop
                  marginBottom: isMobile ? "20px" : "32px", // Original margin on desktop
                  padding: "0 10px",
                }}>
                  {plan.description}
                </p>
                
                {/* Error message */}
                {error && (
                  <div style={{
                    padding: isMobile ? "8px" : "12px", // Original padding on desktop
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#F87171",
                    marginBottom: isMobile ? "12px" : "16px", // Original margin on desktop
                    fontSize: isMobile ? "12px" : "14px", // Original size on desktop
                    textAlign: "center"
                  }}>
                    {error}
                  </div>
                )}
                
                {/* Subscribe Button */}
                <button
                  onClick={handleSubscribe}
                  disabled={isLoading}
                  style={{
                    padding: isMobile ? "12px 24px" : "16px 32px", // Original padding on desktop
                    width: "100%",
                    borderRadius: "12px",
                    background: isLoading 
                      ? "rgba(99, 102, 241, 0.5)" 
                      : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "#ffffff",
                    border: "none",
                    cursor: isLoading ? "wait" : "pointer",
                    fontSize: isMobile ? "14px" : "16px", // Original size on desktop
                    fontWeight: "600",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)",
                    gap: "12px",
                  }}
                >
                  {isLoading ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCrown} />
                      Subscribe Now
                    </>
                  )}
                </button>
                
                <p style={{
                  fontSize: isMobile ? "12px" : "14px", // Original size on desktop
                  color: "#9CA3AF",
                  marginTop: isMobile ? "12px" : "16px" // Original margin on desktop
                }}>
                  Cancel anytime. No hidden fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer - Simplified */}
      <div style={{
        textAlign: "center",
        padding: isMobile ? "10px" : "16px", // Original padding on desktop
        borderTop: "1px solid rgba(99, 102, 241, 0.15)",
        color: "#9CA3AF",
        fontSize: isMobile ? "12px" : "14px", // Original size on desktop
        background: "rgba(15, 23, 42, 0.95)",
      }}>
        <p>© {new Date().getFullYear()} Clinical Paws. All rights reserved.</p>
      </div>
      
      {/* Global styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body, html {
            margin: 0;
            padding: 0;
            background-color: #0F172A;
            overflow: auto;
            height: 100%;
          }
          
          * {
            box-sizing: border-box;
          }
          
          .fa-spin {
            animation: fa-spin 1s infinite linear;
          }
          
          @keyframes fa-spin {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          
          button:hover {
            transform: translateY(-2px);
            filter: brightness(110%);
            box-shadow: 0 10px 25px rgba(99, 102, 241, 0.6) !important;
          }
          
          button:active {
            transform: translateY(0);
          }
          
          /* Add responsive meta tag */
          @media (max-width: 768px) {
            body {
              font-size: 14px;
            }
          }
        `}
      </style>
      {/* Add viewport meta tag for proper mobile rendering */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    </div>
  );
}

export default ProVersionPage; 