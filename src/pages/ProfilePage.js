import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faUser, 
  faEnvelope, 
  faIdCard, 
  faCalendarAlt, 
  faArrowLeft,
  faEdit
} from "@fortawesome/free-solid-svg-icons";

function ProfilePage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  
  // Random color for the profile avatar
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

  // Fetch user details
  const fetchUserDetails = useCallback(async () => {
    setLoading(true);
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        setError("No access token found, please log in again.");
        navigate("/login");
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
        setError(errorData.message || "Failed to fetch user details");
        return;
      }

      const data = await response.json();
      setUserData(data.data);
    } catch (err) {
      setError("An error occurred while fetching user details");
      console.error("Error in fetchUserDetails:", err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Get profile initials
  const getProfileLetters = (name) => {
    if (!name) return "NA";
    return name.trim().slice(0, 2).toUpperCase();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Handle back button
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
        justifyContent: "space-between",
      }}>
        <div style={{
          display: "flex",
          alignItems: "center",
        }}>
          <button 
            onClick={handleBack}
            style={{
              background: "transparent",
              border: "none",
              color: "#60A5FA",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              fontSize: "16px",
              padding: "8px 12px",
              borderRadius: "8px",
              transition: "background-color 0.2s",
            }}
          >
            <FontAwesomeIcon icon={faArrowLeft} style={{ marginRight: "8px" }} />
            Back
          </button>
        </div>
        <div style={{
          fontWeight: "600",
          fontSize: "18px",
          color: "#60A5FA",
        }}>
          My Profile
        </div>
        <div style={{ width: "40px" }}></div>
      </div>

      {/* Main Content */}
      <div style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "40px 20px",
      }}>
        {loading ? (
          <div style={{
            display: "flex",
            justifyContent: "center",
            padding: "40px",
          }}>
            <div className="spinner" style={{
              width: "40px",
              height: "40px",
              border: "4px solid rgba(59, 130, 246, 0.2)",
              borderRadius: "50%",
              borderTop: "4px solid #60A5FA",
              animation: "spin 1s linear infinite",
            }}></div>
          </div>
        ) : error ? (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            borderRadius: "8px",
            color: "#F87171",
            textAlign: "center",
          }}>
            {error}
          </div>
        ) : userData ? (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}>
            {/* Profile Avatar */}
            <div style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${avatarBgColor}, ${avatarBgColor}dd)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: "600",
              fontSize: "40px",
              marginBottom: "24px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              border: "4px solid rgba(255,255,255,0.1)",
            }}>
              {getProfileLetters(userData.name)}
            </div>

            {/* User Info Card */}
            <div style={{
              width: "100%",
              backgroundColor: "#1f2937",
              borderRadius: "12px",
              padding: "30px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <h2 style={{
                fontSize: "24px",
                fontWeight: "600",
                marginBottom: "24px",
                textAlign: "center",
                color: "#f3f4f6",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "16px",
              }}>
                User Information
              </h2>

              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "20px",
              }}>
                {/* Name */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                }}>
                  <FontAwesomeIcon icon={faUser} style={{ 
                    color: "#60A5FA", 
                    marginRight: "16px",
                    width: "20px",
                  }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#9CA3AF" }}>Name</div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>{userData.name || "Not provided"}</div>
                  </div>
                </div>

                {/* Email */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                }}>
                  <FontAwesomeIcon icon={faEnvelope} style={{ 
                    color: "#60A5FA", 
                    marginRight: "16px",
                    width: "20px",
                  }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#9CA3AF" }}>Email</div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>{userData.email || "Not provided"}</div>
                  </div>
                </div>

                {/* User ID */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                }}>
                  <FontAwesomeIcon icon={faIdCard} style={{ 
                    color: "#60A5FA", 
                    marginRight: "16px",
                    width: "20px",
                  }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#9CA3AF" }}>User ID</div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>{userData.user_id || "Not available"}</div>
                  </div>
                </div>

                {/* Created At */}
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px 16px",
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: "8px",
                }}>
                  <FontAwesomeIcon icon={faCalendarAlt} style={{ 
                    color: "#60A5FA", 
                    marginRight: "16px",
                    width: "20px",
                  }} />
                  <div>
                    <div style={{ fontSize: "14px", color: "#9CA3AF" }}>Member Since</div>
                    <div style={{ fontSize: "16px", fontWeight: "500" }}>{formatDate(userData.created_at)}</div>
                  </div>
                </div>
              </div>

              {/* Edit Profile Button */}
              <button style={{
                marginTop: "30px",
                width: "100%",
                padding: "12px",
                backgroundColor: "transparent",
                color: "#60A5FA",
                border: "1px solid #60A5FA",
                borderRadius: "8px",
                fontSize: "16px",
                fontWeight: "500",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}>
                <FontAwesomeIcon icon={faEdit} style={{ marginRight: "8px" }} />
                Edit Profile
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            padding: "20px",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            borderRadius: "8px",
            color: "#60A5FA",
            textAlign: "center",
          }}>
            No user data available
          </div>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          button:hover {
            background-color: rgba(96, 165, 250, 0.1) !important;
          }
        `}
      </style>
    </div>
  );
}

export default ProfilePage;
