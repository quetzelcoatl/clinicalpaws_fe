import React, { useState } from "react";
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
      height: "100vh",
      backgroundColor: "#0F172A", // Darker background
      color: "#f3f4f6",
      fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden" // Prevent scrolling
    }}>
      {/* Header */}
      <div style={{
        height: "60px",
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        borderBottom: "1px solid rgba(99, 102, 241, 0.2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        boxShadow: "0 4px 20px rgba(99, 102, 241, 0.2)",
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
          fontSize: "20px",
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
        justifyContent: "center",
        alignItems: "center",
        maxWidth: "1100px",
        margin: "0 auto",
        padding: "0 24px",
        width: "100%",
        boxSizing: "border-box",
        background: "radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.08), transparent 70%)",
      }}>
        {/* Content Container */}
        <div style={{
          display: "flex",
          width: "100%",
          gap: "30px",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* Left Side: Features */}
          <div style={{
            flex: 1,
            maxWidth: "500px",
          }}>
            <div style={{
              marginBottom: "24px",
              textAlign: "left",
            }}>
              <h1 style={{
                fontSize: "36px",
                fontWeight: "800",
                marginBottom: "16px",
                background: "linear-gradient(135deg, #F5F5F5, #60A5FA)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                textShadow: "0 10px 20px rgba(0,0,0,0.2)",
              }}>
                Upgrade to Clinical Paws Pro
              </h1>
              
              <p style={{
                fontSize: "18px",
                color: "#D1D5DB",
                lineHeight: "1.6",
                marginBottom: "24px",
              }}>
                Unlock the full potential of your clinical practice with premium features 
                and advanced AI assistance.
              </p>
            </div>
            
            {/* Features Grid - 3x2 layout */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}>
              {proFeatures.map((feature, index) => (
                <div key={index} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "16px",
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
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(99, 102, 241, 0.1))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    border: "1px solid rgba(99, 102, 241, 0.3)",
                  }}>
                    <FontAwesomeIcon icon={feature.icon} style={{ color: "#818CF8", fontSize: "16px" }} />
                  </div>
                  <span style={{ color: "#E5E7EB", fontSize: "15px", fontWeight: "500" }}>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Right Side: Pricing Card */}
          <div style={{
            flex: "0 0 auto",
            width: "340px",
          }}>
            <div style={{
              padding: "32px",
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
                  width: "70px",
                  height: "70px",
                  borderRadius: "20px",
                  background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 24px",
                  boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
                }}>
                  <FontAwesomeIcon icon={faCrown} style={{ fontSize: "28px", color: "#fff" }} />
                </div>
                
                <h3 style={{
                  fontSize: "24px",
                  fontWeight: "700",
                  marginBottom: "8px",
                  color: "#F9FAFB",
                }}>
                  {plan.name} Plan
                </h3>
                
                <div style={{
                  display: "flex",
                  alignItems: "baseline",
                  justifyContent: "center",
                  gap: "4px",
                  marginBottom: "8px"
                }}>
                  <span style={{
                    fontSize: "48px",
                    fontWeight: "800",
                    background: "linear-gradient(135deg, #60A5FA, #8B5CF6)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    letterSpacing: "-1px",
                  }}>
                    {plan.price}
                  </span>
                  <span style={{ color: "#9CA3AF", fontSize: "16px", fontWeight: "500" }}>
                    {plan.billingCycle}
                  </span>
                </div>
                
                <p style={{
                  color: "#D1D5DB",
                  fontSize: "15px",
                  marginBottom: "32px",
                  padding: "0 10px",
                }}>
                  {plan.description}
                </p>
                
                {/* Error message */}
                {error && (
                  <div style={{
                    padding: "12px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#F87171",
                    marginBottom: "16px",
                    fontSize: "14px",
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
                    padding: "16px 32px",
                    width: "100%",
                    borderRadius: "12px",
                    background: isLoading 
                      ? "rgba(99, 102, 241, 0.5)" 
                      : "linear-gradient(135deg, #6366F1, #8B5CF6)",
                    color: "#ffffff",
                    border: "none",
                    cursor: isLoading ? "wait" : "pointer",
                    fontSize: "16px",
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
                  fontSize: "14px",
                  color: "#9CA3AF",
                  marginTop: "16px"
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
        padding: "16px",
        borderTop: "1px solid rgba(99, 102, 241, 0.15)",
        color: "#9CA3AF",
        fontSize: "14px",
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
            overflow: hidden;
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
        `}
      </style>
    </div>
  );
}

export default ProVersionPage; 