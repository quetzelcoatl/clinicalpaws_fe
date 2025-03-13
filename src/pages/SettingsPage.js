import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCog,
  faArrowLeft,
  faCrown,
  faCalendarAlt,
  faCreditCard,
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faSpinner
} from "@fortawesome/free-solid-svg-icons";

function SettingsPage() {
  const navigate = useNavigate();
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [cancelError, setCancelError] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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

  // Fetch subscription details
  const fetchSubscriptionDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        setError("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "https://clinicalpaws.com/api/signup/current",
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
        throw new Error(errorData.message || "Failed to fetch subscription details");
      }

      const data = await response.json();
      setSubscriptionData(data);
      console.log("Subscription data:", data);
    } catch (err) {
      console.error("Error fetching subscription details:", err);
      setError(err.message || "An error occurred while fetching subscription details");
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    
    try {
      // Parse ISO date string or convert timestamp
      let dateObj;
      
      if (typeof dateString === 'string') {
        dateObj = new Date(dateString);
      } else if (dateString instanceof Date) {
        dateObj = dateString;
      } else {
        // Assume it's a timestamp
        dateObj = new Date(dateString * 1000);
      }
      
      // Validate the date is reasonable (between 2000 and 2100)
      const year = dateObj.getFullYear();
      if (year < 2000 || year > 2100) {
        console.error("Invalid date year:", year);
        return "Invalid date";
      }
      
      return dateObj.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric'
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Calculate end date based on start date and plan
  const calculateEndDate = (startDateString, plan) => {
    if (!startDateString) return null;
    
    try {
      const startDate = new Date(startDateString);
      const endDate = new Date(startDate);
      
      if (plan === "monthly") {
        endDate.setMonth(endDate.getMonth() + 1);
      } else if (plan === "yearly" || plan === "annual") {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else if (plan === "quarterly") {
        endDate.setMonth(endDate.getMonth() + 3);
      } else if (plan === "biannual" || plan === "semiannual") {
        endDate.setMonth(endDate.getMonth() + 6);
      } else {
        // Default to monthly if plan is unknown
        endDate.setMonth(endDate.getMonth() + 1);
      }
      
      return endDate;
    } catch (error) {
      console.error("Error calculating end date:", error);
      return null;
    }
  };

  // Format currency based on currency code
  const formatCurrency = (amount, currencyCode = "USD") => {
    if (amount === undefined || amount === null) return "N/A";
    
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode || 'USD',
        minimumFractionDigits: 2
      }).format(amount);
    } catch (error) {
      console.error("Error formatting currency:", error);
      return `${currencyCode} ${amount}`;
    }
  };

  // Calculate next billing date (one month from start date)
  const calculateNextBillingDate = (startDateString) => {
    if (!startDateString) return null;
    
    try {
      const startDate = new Date(startDateString);
      
      // Validate the date is reasonable
      const year = startDate.getFullYear();
      if (year < 2000 || year > 2100 || isNaN(year)) {
        console.error("Invalid start date year:", year);
        return null;
      }
      
      const nextBillingDate = new Date(startDate);
      
      // Get current month and year
      const currentMonth = nextBillingDate.getMonth();
      const currentYear = nextBillingDate.getFullYear();
      const currentDay = nextBillingDate.getDate();
      
      // Set to next month, same day
      nextBillingDate.setMonth(currentMonth + 1);
      
      // Handle month rollover issues (e.g., Jan 31 -> Feb 28)
      if (nextBillingDate.getDate() !== currentDay) {
        // Set to last day of previous month
        nextBillingDate.setDate(0);
      }
      
      return nextBillingDate;
    } catch (error) {
      console.error("Error calculating next billing date:", error);
      return null;
    }
  };

  // Load subscription data on component mount
  useEffect(() => {
    fetchSubscriptionDetails();
  }, [fetchSubscriptionDetails]);

  // Cancel subscription
  const cancelSubscription = async () => {
    setIsCancelling(true);
    setCancelError(null);
    
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        setCancelError("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      // This is a placeholder for the actual API endpoint
      // Replace with the actual endpoint when available
      const response = await fetch(
        "https://clinicalpaws.com/api/signup/cancel_subscription",
        {
          method: "POST",
          headers: {
            token: accessToken,
            accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscription_id: subscriptionData?.stripe_subscription_id
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel subscription");
      }

      // If successful, set success state and refetch subscription details
      setCancelSuccess(true);
      fetchSubscriptionDetails();
      
      // Hide confirmation dialog
      setTimeout(() => {
        setShowCancelConfirm(false);
      }, 3000);
      
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      setCancelError(err.message || "An error occurred while cancelling your subscription");
    } finally {
      setIsCancelling(false);
    }
  };

  // Handle back button click
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div style={{
      minHeight: "100vh",
      backgroundColor: "#111827",
      color: "#f3f4f6",
      fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
    }}>
      {/* Header */}
      <div style={{
        height: "70px",
        backgroundColor: "rgba(31, 41, 55, 0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        position: "sticky",
        top: 0,
        zIndex: 100,
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
      }}>
        <button 
          onClick={handleBack}
          style={{
            background: "none",
            border: "none",
            color: "#60A5FA",
            fontSize: "24px",
            cursor: "pointer",
            marginRight: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </button>
        <h1 style={{
          margin: 0,
          fontSize: "20px",
          fontWeight: "600",
          color: "#f3f4f6",
          display: "flex",
          alignItems: "center",
        }}>
          <FontAwesomeIcon icon={faCog} style={{ marginRight: "12px", color: "#60A5FA" }} />
          Settings
        </h1>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: isMobile ? "20px" : "40px",
      }}>
        <div style={{
          backgroundColor: "#1f2937",
          borderRadius: "12px",
          padding: "24px",
          marginBottom: "24px",
          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}>
          <h2 style={{
            fontSize: "20px",
            fontWeight: "600",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            color: "#f3f4f6",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            paddingBottom: "12px",
          }}>
            <FontAwesomeIcon icon={faCrown} style={{ marginRight: "12px", color: "#F59E0B" }} />
            Subscription Details
          </h2>

          {isLoading ? (
            <div style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "40px 0",
            }}>
              <FontAwesomeIcon 
                icon={faSpinner} 
                spin 
                style={{ 
                  fontSize: "24px", 
                  color: "#60A5FA",
                  marginRight: "12px"
                }} 
              />
              <span>Loading subscription details...</span>
            </div>
          ) : error ? (
            <div style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              borderRadius: "8px",
              padding: "16px",
              color: "#f87171",
              display: "flex",
              alignItems: "center",
            }}>
              <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "12px" }} />
              {error}
            </div>
          ) : !subscriptionData || !subscriptionData.is_active ? (
            <div style={{
              backgroundColor: "rgba(75, 85, 99, 0.2)",
              borderRadius: "8px",
              padding: "20px",
              textAlign: "center",
            }}>
              <p style={{ fontSize: "16px", marginBottom: "16px" }}>
                You don't have an active subscription.
              </p>
              <button
                onClick={() => navigate("/pro-version")}
                style={{
                  padding: "10px 20px",
                  borderRadius: "8px",
                  background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                  color: "#ffffff",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "500",
                  boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
                }}
              >
                Get Pro Version
              </button>
            </div>
          ) : (
            <div>
              {/* Subscription Status */}
              <div style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "24px",
                padding: "16px",
                backgroundColor: "rgba(245, 158, 11, 0.1)",
                borderRadius: "8px",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}>
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "16px",
                  flexShrink: 0,
                }}>
                  <FontAwesomeIcon icon={faCrown} style={{ color: "#fff" }} />
                </div>
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", fontWeight: "600", color: "#F59E0B" }}>
                    Pro Subscription Active
                  </h3>
                  <p style={{ margin: 0, fontSize: "14px", color: "#d1d5db" }}>
                    You have access to all premium features
                  </p>
                </div>
              </div>

              {/* Subscription Details */}
              <div style={{ marginBottom: "24px" }}>
                <h3 style={{ 
                  fontSize: "16px", 
                  fontWeight: "600", 
                  marginBottom: "16px",
                  color: "#e2e8f0",
                }}>
                  Plan Details
                </h3>
                
                <div style={{ 
                  display: "grid", 
                  gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
                  gap: "16px" 
                }}>
                  {/* Plan Name */}
                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "8px" }}>
                      Plan
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>
                      {subscriptionData.plan ? `${subscriptionData.plan.charAt(0).toUpperCase() + subscriptionData.plan.slice(1)} Plan` : "Pro Plan"}
                    </div>
                  </div>
                  
                  {/* Price */}
                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "8px" }}>
                      Price
                    </div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>
                      {formatCurrency(subscriptionData.price, subscriptionData.currency)} / {subscriptionData.plan || "month"}
                    </div>
                  </div>
                  
                  {/* Start Date */}
                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <FontAwesomeIcon 
                      icon={faCalendarAlt} 
                      style={{ 
                        color: "#60A5FA", 
                        marginRight: "12px",
                        fontSize: "16px"
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "4px" }}>
                        Start Date
                      </div>
                      <div style={{ fontSize: "15px" }}>
                        {formatDate(subscriptionData.start_date)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Next Billing Date */}
                  <div style={{ 
                    padding: "16px", 
                    backgroundColor: "rgba(31, 41, 55, 0.5)",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.05)",
                    display: "flex",
                    alignItems: "center",
                  }}>
                    <FontAwesomeIcon 
                      icon={faCreditCard} 
                      style={{ 
                        color: "#60A5FA", 
                        marginRight: "12px",
                        fontSize: "16px"
                      }} 
                    />
                    <div>
                      <div style={{ fontSize: "14px", color: "#9CA3AF", marginBottom: "4px" }}>
                        Next Billing Date
                      </div>
                      <div style={{ fontSize: "15px" }}>
                        {formatDate(calculateNextBillingDate(subscriptionData.start_date))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cancel Subscription */}
              <div style={{ marginTop: "32px" }}>
                <h3 style={{ 
                  fontSize: "16px", 
                  fontWeight: "600", 
                  marginBottom: "16px",
                  color: "#e2e8f0",
                }}>
                  Subscription Management
                </h3>
                
                {!showCancelConfirm ? (
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    style={{
                      padding: "12px 20px",
                      borderRadius: "8px",
                      backgroundColor: "rgba(239, 68, 68, 0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "500",
                      display: "flex",
                      alignItems: "center",
                      transition: "all 0.3s ease",
                    }}
                  >
                    <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: "8px" }} />
                    Cancel Subscription
                  </button>
                ) : (
                  <div style={{
                    padding: "20px",
                    borderRadius: "8px",
                    backgroundColor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    marginBottom: "20px",
                  }}>
                    <h4 style={{ 
                      margin: "0 0 16px 0", 
                      color: "#f87171", 
                      fontSize: "16px",
                      fontWeight: "600",
                      display: "flex",
                      alignItems: "center",
                    }}>
                      <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: "8px" }} />
                      Are You Sure You Want to Cancel?
                    </h4>
                    
                    <p style={{ 
                      margin: "0 0 20px 0", 
                      fontSize: "14px",
                      lineHeight: "1.6",
                      color: "#d1d5db",
                    }}>
                      You'll continue to have access to Pro features until the end of your current billing period on {formatDate(calculateNextBillingDate(subscriptionData.start_date))}.
                    </p>

                    {/* Benefits the user will miss out on */}
                    <div style={{
                      backgroundColor: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.3)",
                      borderRadius: "8px",
                      padding: "16px",
                      marginBottom: "20px",
                    }}>
                      <h5 style={{
                        margin: "0 0 12px 0",
                        fontSize: "15px",
                        fontWeight: "600",
                        color: "#60A5FA",
                        display: "flex",
                        alignItems: "center",
                      }}>
                        <FontAwesomeIcon icon={faCrown} style={{ marginRight: "8px", color: "#F59E0B" }} />
                        Here's what you'll miss out on:
                      </h5>
                      
                      <ul style={{
                        margin: "0 0 0 8px",
                        padding: "0 0 0 16px",
                        color: "#d1d5db",
                        fontSize: "14px",
                        lineHeight: "1.6",
                      }}>
                        <li style={{ marginBottom: "8px" }}>
                          <span style={{ color: "#60A5FA", fontWeight: "500" }}>Unlimited AI consultations</span> - Get expert veterinary insights anytime you need
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <span style={{ color: "#60A5FA", fontWeight: "500" }}>Priority support</span> - Skip the queue with faster response times
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <span style={{ color: "#60A5FA", fontWeight: "500" }}>Advanced diagnostics</span> - Access to our premium diagnostic tools
                        </li>
                        <li style={{ marginBottom: "8px" }}>
                          <span style={{ color: "#60A5FA", fontWeight: "500" }}>Personalized care plans</span> - Tailored recommendations for your pet's health
                        </li>
                        <li>
                          <span style={{ color: "#60A5FA", fontWeight: "500" }}>Exclusive content</span> - Premium articles and videos from top veterinarians
                        </li>
                      </ul>
                    </div>
                    
                    {cancelSuccess && (
                      <div style={{
                        padding: "12px",
                        backgroundColor: "rgba(16, 185, 129, 0.1)",
                        border: "1px solid rgba(16, 185, 129, 0.3)",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        color: "#10B981",
                      }}>
                        <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "8px" }} />
                        Your subscription has been successfully cancelled.
                      </div>
                    )}
                    
                    {cancelError && (
                      <div style={{
                        padding: "12px",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        borderRadius: "6px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        color: "#f87171",
                      }}>
                        <FontAwesomeIcon icon={faTimesCircle} style={{ marginRight: "8px" }} />
                        {cancelError}
                      </div>
                    )}
                    
                    <div style={{ display: "flex", gap: "12px" }}>
                      <button
                        onClick={() => setShowCancelConfirm(false)}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          backgroundColor: "#3B82F6",
                          color: "#ffffff",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "8px" }} />
                        Keep My Benefits
                      </button>
                      
                      <button
                        onClick={cancelSubscription}
                        disabled={isCancelling || cancelSuccess}
                        style={{
                          padding: "10px 16px",
                          borderRadius: "8px",
                          backgroundColor: cancelSuccess ? "rgba(16, 185, 129, 0.2)" : "rgba(239, 68, 68, 0.8)",
                          color: "#ffffff",
                          border: "none",
                          cursor: isCancelling || cancelSuccess ? "not-allowed" : "pointer",
                          fontSize: "14px",
                          fontWeight: "500",
                          flex: 1,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          opacity: isCancelling || cancelSuccess ? 0.7 : 1,
                        }}
                      >
                        {isCancelling ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin style={{ marginRight: "8px" }} />
                            Processing...
                          </>
                        ) : cancelSuccess ? (
                          <>
                            <FontAwesomeIcon icon={faCheckCircle} style={{ marginRight: "8px" }} />
                            Cancelled
                          </>
                        ) : (
                          "Cancel Anyway"
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CSS Styles */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

          html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            overflow-x: hidden;
            overflow-y: auto;
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

          /* Apply scrollbar styling to Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: #4b5563 #1f2937;
          }

          /* Button hover effects */
          button:hover:not(:disabled) {
            filter: brightness(1.1);
            transform: translateY(-1px);
          }

          button:active:not(:disabled) {
            transform: translateY(0);
          }
        `}
      </style>
    </div>
  );
}

export default SettingsPage; 