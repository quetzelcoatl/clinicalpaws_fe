// src/pages/AudioRecorderPage.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
// Add FontAwesome for the microphone icon
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faMicrophone, 
  faMicrophoneSlash, 
  faUser, 
  faCog, 
  faSignOutAlt, 
  faHistory,
  faChevronLeft,
  faChevronRight
} from "@fortawesome/free-solid-svg-icons";

function AudioRecorderPage() {
  // ---------------------------
  // STATES
  // ---------------------------
  // Recorder-related
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  // Processing status
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Polling / Order
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  // History + infinite scroll
  const [historyData, setHistoryData] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false); // Default to hidden on mobile
  
  // Responsive states
  const [isMobile, setIsMobile] = useState(false);

  // Selected history item
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  // Profile-related
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [userName, setUserName] = useState(""); // Actual user name from the API

  // For scroll direction checks (infinite scroll)
  const lastScrollTopRef = useRef(0);

  // Audio chunks
  const chunksRef = useRef([]);
  const navigate = useNavigate();
  const historyPanelRef = useRef(null);

  // ---------------------------
  // Ref Guard to prevent multiple API calls in development (React Strict Mode)
  // ---------------------------
  const hasFetchedRef = useRef(false);

  // ---------------------------
  // Check viewport size for responsive design
  // ---------------------------
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      // Auto-hide history panel on mobile devices
      if (window.innerWidth < 768) {
        setShowHistoryPanel(false);
      } else {
        setShowHistoryPanel(true);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ---------------------------
  // 1) Fetch user details
  // ---------------------------
  const fetchUserDetails = useCallback(async () => {
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
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
        console.error("Error fetching user details:", errorData);
        return;
      }

      const data = await response.json();
      // data.data.name is from the API response:
      // { data: { user_id, name, email, ... }, code, message, ... }
      if (data?.data?.name) {
        setUserName(data.data.name);
      }
    } catch (err) {
      console.error("Error in fetchUserDetails:", err);
    }
  }, [navigate]);

  // ---------------------------
  // 2) Random avatar color/initials
  // ---------------------------
  const [avatarBgColor] = useState(() => getRandomColor());
  // Compute initials from userName
  const initials = getProfileLetters(userName);

  function getRandomColor() {
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
  }

  function getProfileLetters(name) {
    if (!name) return "NA";
    return name.trim().slice(0, 2).toUpperCase();
  }

  // ---------------------------
  // 3) Start Recording
  // ---------------------------
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      setMediaRecorder(recorder);
      setRecording(true);
      recorder.start();
    } catch (err) {
      console.error("Error starting audio recording:", err);
      alert("Microphone access denied or not supported.");
    }
  };

  // ---------------------------
  // 4) Stop Recording AND Upload
  // ---------------------------
  const stopRecordingAndUpload = () => {
    if (!mediaRecorder) return;

    mediaRecorder.onstop = () => {
      const audioData = new Blob(chunksRef.current, { type: "audio/wav" });
      chunksRef.current = [];
      uploadAudio(audioData);
    };

    mediaRecorder.stop();
    setMediaRecorder(null);
    setRecording(false);
  };

  // ---------------------------
  // 5) Upload the recorded audio
  // ---------------------------
  const uploadAudio = async (blobParam) => {
    if (!blobParam) {
      alert("No audio to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(false);
      setOrderData(null);
      setOrderId(null);
      setSelectedHistoryItem(null); // Clear selected item if uploading a new file

      const formData = new FormData();
      formData.append("audio_file", blobParam, "recording.wav");

      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "https://clinicalpaws.com/api/signup/upload_audio_file",
        {
          method: "POST",
          headers: {
            token: accessToken,
            accept: "application/json",
          },
          body: formData,
        }
      );

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Upload failed");
      }

      // If we get an order_id, start polling for order details
      if (resData.order_id) {
        setOrderId(resData.order_id);
        setIsProcessing(true);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading audio: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // ---------------------------
  // 6) Poll the backend for status
  // ---------------------------
  const pollOrderStatus = async (order_id) => {
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `https://clinicalpaws.com/api/signup/fetch_order_details?order_id=${order_id}`,
        {
          headers: {
            token: accessToken,
            accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setOrderData(data);

        // If completed, stop polling
        if (data.status === "completed") {
          setIsProcessing(false);

          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
        }
      } else {
        console.error("Error fetching order details:", data);
      }
    } catch (err) {
      console.error("Error in pollOrderStatus:", err);
    }
  };

  // ---------------------------
  // 7) Auto start/stop polling
  // ---------------------------
  useEffect(() => {
    if (orderId && isProcessing) {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
      const newIntervalId = setInterval(() => {
        pollOrderStatus(orderId);
      }, 5000);
      setPollingIntervalId(newIntervalId);
    }

    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isProcessing]);

  // ---------------------------
  // 8) Mic button logic
  // ---------------------------
  const handleMicClick = async () => {
    if (!recording) {
      await startRecording();
    } else {
      stopRecordingAndUpload();
    }
  };

  const buttonDisabled = (isUploading || isProcessing) && !recording;

  // ---------------------------
  // 9) History (Infinite Scroll)
  // ---------------------------
  const fetchHistory = useCallback(async () => {
    if (isLoadingHistory || !hasMore) return;

    setIsLoadingHistory(true);
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `https://clinicalpaws.com/api/signup/fetch_history?page=${page}&size=10`,
        {
          headers: {
            token: accessToken,
            accept: "application/json",
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        const newItems = data.items || [];
        setHistoryData((prev) => [...prev, ...newItems]);

        // If we got fewer items than the page size, no more data left
        if (newItems.length < data.size) {
          setHasMore(false);
        } else {
          setPage((prev) => prev + 1);
        }
      } else {
        console.error("Error fetching history:", data);
      }
    } catch (err) {
      console.error("Error in fetchHistory:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMore, page, navigate]);

  // Fetch user details AND the first page of history on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchUserDetails();
      fetchHistory();
      hasFetchedRef.current = true;
    }
  }, [fetchUserDetails, fetchHistory]);

  // Scroll listener: load next page only if user scrolls down
  useEffect(() => {
    const handleScroll = () => {
      const container = historyPanelRef.current;
      if (!container) return;

      const currentScrollTop = container.scrollTop;

      // Only if the user scrolled down
      if (currentScrollTop > lastScrollTopRef.current) {
        const nearBottomThreshold = 50;
        // If near bottom, fetch next page
        if (
          container.scrollHeight - currentScrollTop <=
          container.clientHeight + nearBottomThreshold
        ) {
          fetchHistory();
        }
      }
      lastScrollTopRef.current = currentScrollTop;
    };

    const panel = historyPanelRef.current;
    if (panel) {
      panel.addEventListener("scroll", handleScroll);
    }
    return () => {
      if (panel) {
        panel.removeEventListener("scroll", handleScroll);
      }
    };
  }, [fetchHistory]);

  // ---------------------------
  // 10) Handling history selection
  // ---------------------------
  const handleHistoryItemClick = (item) => {
    setSelectedHistoryItem(item);
    // On mobile, close the history panel after selection
    if (isMobile) {
      setShowHistoryPanel(false);
    }
  };

  const getFirstLine = (text) => {
    if (!text) return "No final answer found.";
    return text.split(/\r?\n/)[0].trim();
  };

  // ---------------------------
  // 11) Profile dropdown logic
  // ---------------------------
  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleMyProfile = () => {
    alert("Navigating to My Profile...");
  };

  const handleSettings = () => {
    alert("Navigating to Settings...");
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    navigate("/login");
  };

  // Toggle history panel
  const toggleHistoryPanel = () => {
    setShowHistoryPanel(prev => !prev);
  };

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative",
        backgroundColor: "#111827", // More modern dark blue-gray
        fontFamily: "'Inter', 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        color: "#f3f4f6", // Lighter text for better contrast
        flexDirection: isMobile ? "column" : "row",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Left-side: History Panel */}
      <div
        style={{
          width: showHistoryPanel 
            ? isMobile ? "100%" : "300px" // Slightly wider for better reading
            : "0",
          borderRight: !isMobile && "1px solid rgba(255,255,255,0.08)",
          borderBottom: isMobile && showHistoryPanel && "1px solid rgba(255,255,255,0.08)",
          backgroundColor: "#1f2937", // Lighter than main background
          overflowY: "hidden",
          height: isMobile ? (showHistoryPanel ? "50vh" : "0") : "100vh",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", // Smooth easing
          position: isMobile ? "absolute" : "relative",
          display: "flex",
          flexDirection: "column",
          zIndex: isMobile ? "200" : "100",
          maxHeight: isMobile && showHistoryPanel ? "50vh" : "100vh",
          boxShadow: !isMobile && showHistoryPanel ? "inset -10px 0 15px -12px rgba(0,0,0,0.3)" : "none",
        }}
      >
        {/* Logo/Brand at the top of the sidebar - Only show when panel is visible */}
        {showHistoryPanel && (
          <div style={{ 
            padding: "20px", 
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center"
          }}>
            <div style={{ 
              fontWeight: "600", 
              fontSize: isMobile ? "16px" : "20px", 
              color: "#60A5FA", // Brighter blue
              display: "flex",
              alignItems: "center",
              letterSpacing: "0.5px"
            }}>
              <FontAwesomeIcon 
                icon={faMicrophone} 
                style={{ 
                  marginRight: "12px", 
                  color: "#60A5FA",
                  fontSize: isMobile ? "16px" : "18px"
                }} 
              />
              Clinical Paws
            </div>
          </div>
        )}

        {showHistoryPanel && (
          <div
            ref={historyPanelRef}
            style={{
              padding: isMobile ? "1rem" : "1.5rem",
              overflowY: "auto",
              height: "100%",
              flex: 1,
              WebkitOverflowScrolling: "touch",
            }}
          >
            <h3 style={{ 
              marginTop: 0, 
              color: "#f3f4f6", 
              fontSize: isMobile ? "16px" : "18px",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              paddingBottom: "12px",
              fontWeight: "500"
            }}>
              History
            </h3>
            {historyData && historyData.length > 0 ? (
              historyData.map((item) => {
                const firstLine = getFirstLine(item.final_answer);
                const isSelected = selectedHistoryItem && selectedHistoryItem.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleHistoryItemClick(item)}
                    style={{
                      padding: isMobile ? "12px" : "14px",
                      marginBottom: "10px",
                      border: isSelected ? "none" : "1px solid rgba(255,255,255,0.08)",
                      borderRadius: "12px",
                      backgroundColor: isSelected ? "#3B82F6" : "rgba(255,255,255,0.03)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      boxShadow: isSelected 
                        ? "0 4px 12px rgba(59, 130, 246, 0.3)" 
                        : "0 2px 4px rgba(0,0,0,0.1)",
                      transition: "all 0.2s ease",
                      fontSize: isMobile ? "13px" : "14px",
                      minHeight: isMobile ? "44px" : "auto",
                      display: "flex",
                      alignItems: "center",
                      color: isSelected ? "#ffffff" : "#e2e8f0",
                      transform: isSelected ? "translateY(-1px)" : "none",
                    }}
                  >
                    {firstLine}
                  </div>
                );
              })
            ) : (
              <p style={{ 
                color: "#94a3b8", 
                textAlign: "center",
                padding: "20px 0",
                fontSize: "14px" 
              }}>
                No history found.
              </p>
            )}

            {isLoadingHistory && (
              <p style={{ 
                color: "#94a3b8", 
                textAlign: "center",
                fontStyle: "italic",
                fontSize: "14px"
              }}>
                Loading more history...
              </p>
            )}
          </div>
        )}
      </div>

      {/* History Toggle Button - Positioned differently based on device */}
      <div
        onClick={toggleHistoryPanel}
        style={{
          position: "absolute",
          top: isMobile ? "70px" : "50%",
          left: isMobile 
            ? "10px"
            : (showHistoryPanel ? "284px" : "0"),
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          backgroundColor: "#374151", // Slightly lighter than background
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: isMobile ? "300" : "100",
          boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
          border: "1px solid rgba(255,255,255,0.1)",
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: isMobile ? "none" : "translateY(-50%)",
          color: "#60A5FA",
          opacity: 0.9,
          "&:hover": { // This won't directly work in inline styles but I'm including for documentation
            opacity: 1,
            backgroundColor: "#4B5563"
          }
        }}
      >
        <FontAwesomeIcon 
          icon={showHistoryPanel ? faChevronLeft : faChevronRight} 
          style={{ color: "#e2e8f0" }} 
        />
      </div>

      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          position: "relative",
          width: "100%",
          overflow: isMobile ? "visible" : "hidden",
          backdropFilter: "blur(5px)", // Subtle effect when elements overlap
        }}
      >
        {/* Top Navigation Bar */}
        <div
          style={{
            height: isMobile ? "60px" : "70px",
            backgroundColor: "rgba(31, 41, 55, 0.95)", // Slightly transparent
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            zIndex: 100,
            position: "relative",
            width: "100%",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          {/* Empty div for spacing or logo if needed */}
          <div style={{ width: "40px" }}></div>
          
          {/* Title for mobile (centered) */}
          {isMobile && (
            <div style={{ 
              fontWeight: "600", 
              fontSize: "18px", 
              color: "#60A5FA",
              letterSpacing: "0.5px"
            }}>
              Clinical Paws
            </div>
          )}
          
          {/* Profile Section - always on the right */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${avatarBgColor}, ${avatarBgColor}dd)`, // Subtle gradient
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
                "&:hover": { // This won't directly work in inline styles but I'm including for documentation
                  transform: "scale(1.05)"
                }
              }}
              onClick={toggleProfileMenu}
            >
              {initials}
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
                  animation: "fadeIn 0.2s ease-out", // Animation for menu appearance
                  overflow: "hidden", // Keep rounded corners on internal elements
                }}
              >
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
                  {userName || "User"}
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
                    "&:hover": { // This won't directly work in inline styles but I'm including for documentation
                      backgroundColor: "rgba(255,255,255,0.05)"
                    }
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
                    "&:hover": { // This won't directly work in inline styles but I'm including for documentation
                      backgroundColor: "rgba(255,255,255,0.05)"
                    }
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
                    color: "#f87171", // More vibrant red
                    borderTop: "1px solid rgba(255,255,255,0.08)",
                    minHeight: "44px",
                    transition: "background-color 0.15s ease",
                    "&:hover": { // This won't directly work in inline styles but I'm including for documentation
                      backgroundColor: "rgba(255,255,255,0.05)"
                    }
                  }}
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: "12px", width: "16px", flexShrink: 0, color: "#f87171" }} />
                  <span style={{ whiteSpace: "nowrap", fontSize: "14px" }}>Logout</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "flex-start",
            padding: isMobile ? "1.5rem 1rem" : "2rem",
            backgroundColor: "#111827", // Main dark blue-gray background
            overflowY: "auto",
            WebkitOverflowScrolling: "touch",
            width: "100%",
            boxSizing: "border-box",
            paddingRight: isMobile ? "1rem" : "2rem",
            backgroundImage: "radial-gradient(ellipse at top, rgba(59, 130, 246, 0.08), transparent 80%)",
            backgroundSize: "100% 1000px",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Microphone Button with Circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: isMobile ? "1.5rem" : "2.5rem",
              marginBottom: isMobile ? "2rem" : "3.5rem",
            }}
          >
            <div
              onClick={handleMicClick}
              style={{
                width: isMobile ? "100px" : "130px",
                height: isMobile ? "100px" : "130px",
                borderRadius: "50%",
                background: recording 
                  ? "linear-gradient(135deg, #ef4444, #dc2626)" // Red gradient when recording
                  : "linear-gradient(135deg, #3B82F6, #2563EB)", // Blue gradient when ready
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: buttonDisabled ? "not-allowed" : "pointer",
                boxShadow: recording 
                  ? "0 8px 20px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.2)" 
                  : "0 8px 20px rgba(59, 130, 246, 0.3), 0 0 0 1px rgba(59, 130, 246, 0.2)",
                transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                opacity: buttonDisabled ? 0.7 : 1,
                transform: buttonDisabled ? "none" : "translateY(0)",
                "&:hover": { // This won't directly work in inline styles but I'm including for documentation
                  transform: buttonDisabled ? "none" : "translateY(-3px)",
                  boxShadow: recording
                    ? "0 12px 28px rgba(239, 68, 68, 0.35), 0 0 0 2px rgba(239, 68, 68, 0.25)"
                    : "0 12px 28px rgba(59, 130, 246, 0.35), 0 0 0 2px rgba(59, 130, 246, 0.25)"
                },
                position: "relative",
              }}
            >
              {/* Pulse animation for recording state */}
              {recording && (
                <div style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  background: "rgba(239, 68, 68, 0.5)",
                  animation: "pulse 2s infinite"
                }}></div>
              )}
              <FontAwesomeIcon
                icon={recording ? faMicrophoneSlash : faMicrophone}
                style={{
                  fontSize: isMobile ? "36px" : "52px",
                  color: "#fff",
                  zIndex: 2, // Place above pulse animation
                }}
              />
            </div>
            <div
              style={{
                marginTop: "20px",
                fontSize: isMobile ? "15px" : "17px",
                color: "#e2e8f0",
                fontWeight: "500",
                textAlign: "center",
              }}
            >
              {recording ? "Tap to Stop Recording" : isProcessing ? "Processing..." : "Tap to Start Recording"}
            </div>
          </div>

          {isProcessing && (
            <div
              style={{
                marginTop: "20px",
                padding: isMobile ? "12px 18px" : "16px 24px",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "12px",
                color: "#60A5FA",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                border: "1px solid rgba(59, 130, 246, 0.15)",
                width: isMobile ? "90%" : "auto",
                maxWidth: "500px",
                backdropFilter: "blur(8px)",
                fontWeight: "500",
              }}
            >
              <div className="spinner" style={{
                width: "20px",
                height: "20px",
                border: "3px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "50%",
                borderTop: "3px solid #60A5FA",
                animation: "spin 1s linear infinite",
                marginRight: "12px",
              }}></div>
              <style>
                {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
                @keyframes pulse {
                  0% { transform: scale(0.95); opacity: 0.7; }
                  50% { transform: scale(1.05); opacity: 0.3; }
                  100% { transform: scale(0.95); opacity: 0.7; }
                }
                @keyframes fadeIn {
                  0% { opacity: 0; transform: translateY(-10px); }
                  100% { opacity: 1; transform: translateY(0); }
                }
                `}
              </style>
              Processing your audio...
            </div>
          )}

          {/* Show either a selected history item or newly recorded result */}
          {selectedHistoryItem ? (
            <div
              style={{
                marginTop: "25px",
                padding: isMobile ? "24px" : "32px",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: "16px",
                backgroundColor: "#1f2937",
                maxWidth: "900px",
                width: "100%",
                boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                overflowX: "hidden",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              {/* Transcribed Text - Now First */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "18px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "14px"
              }}>
                <h3 style={{ 
                  margin: 0, 
                  color: "#f3f4f6", 
                  fontSize: isMobile ? "17px" : "19px",
                  fontWeight: "600",
                  letterSpacing: "0.3px"
                }}>Transcribed Text</h3>
              </div>
              
              {selectedHistoryItem.transcribed_text ? (
                <p style={{ 
                  color: "#d1d5db", 
                  lineHeight: "1.8", 
                  fontSize: isMobile ? "15px" : "16px", 
                  marginBottom: "35px",
                  padding: "0 0 16px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  wordBreak: "break-word",
                  fontWeight: "400",
                  letterSpacing: "0.2px"
                }}>{selectedHistoryItem.transcribed_text}</p>
              ) : (
                <p style={{ 
                  color: "#94a3b8", 
                  marginBottom: "35px",
                  fontStyle: "italic"
                }}>No transcription data found.</p>
              )}

              {/* Final Answer - Now Second */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "18px",
                borderBottom: "1px solid rgba(255,255,255,0.08)",
                paddingBottom: "14px"
              }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "12px",
                  boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                }}>
                  <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "15px" }} />
                </div>
                <h3 style={{ 
                  margin: 0, 
                  color: "#f3f4f6", 
                  fontSize: isMobile ? "17px" : "19px",
                  fontWeight: "600",
                  letterSpacing: "0.3px"
                }}>Final Answer</h3>
              </div>
              
              {selectedHistoryItem.final_answer ? (
                <div style={{ 
                  lineHeight: "1.8", 
                  color: "#f3f4f6", 
                  fontSize: isMobile ? "15px" : "16px",
                  letterSpacing: "0.2px",
                  overflow: "auto",
                  wordBreak: "break-word",
                  fontWeight: "400"
                }}>
                  <ReactMarkdown>{selectedHistoryItem.final_answer}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ 
                  color: "#94a3b8",
                  fontStyle: "italic" 
                }}>No final answer found.</p>
              )}
            </div>
          ) : (
            <>
              {orderData && orderData.status === "completed" && (
                <div
                  style={{
                    marginTop: "25px",
                    padding: isMobile ? "24px" : "32px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "16px",
                    backgroundColor: "#1f2937",
                    maxWidth: "900px",
                    width: "100%",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
                    overflowX: "hidden",
                    animation: "fadeIn 0.3s ease-out",
                  }}
                >
                  {/* Transcribed Text - Now First */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "18px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "14px"
                  }}>
                    <h3 style={{ 
                      margin: 0, 
                      color: "#f3f4f6", 
                      fontSize: isMobile ? "17px" : "19px",
                      fontWeight: "600",
                      letterSpacing: "0.3px"
                    }}>Transcribed Text</h3>
                  </div>
                  
                  {orderData.transcribed_text ? (
                    <p style={{ 
                      color: "#d1d5db", 
                      lineHeight: "1.8", 
                      fontSize: isMobile ? "15px" : "16px", 
                      marginBottom: "35px",
                      padding: "0 0 16px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.06)",
                      wordBreak: "break-word",
                      fontWeight: "400",
                      letterSpacing: "0.2px"
                    }}>{orderData.transcribed_text}</p>
                  ) : (
                    <p style={{ 
                      color: "#94a3b8", 
                      marginBottom: "35px",
                      fontStyle: "italic"
                    }}>No transcription data found.</p>
                  )}

                  {/* Final Answer - Now Second */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "18px",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                    paddingBottom: "14px"
                  }}>
                    <div style={{
                      width: "34px",
                      height: "34px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "12px",
                      boxShadow: "0 2px 6px rgba(59, 130, 246, 0.3)",
                    }}>
                      <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "15px" }} />
                    </div>
                    <h3 style={{ 
                      margin: 0, 
                      color: "#f3f4f6", 
                      fontSize: isMobile ? "17px" : "19px",
                      fontWeight: "600",
                      letterSpacing: "0.3px"
                    }}>Final Answer</h3>
                  </div>
                  
                  {orderData.final_answer ? (
                    <div style={{ 
                      lineHeight: "1.8", 
                      color: "#f3f4f6", 
                      fontSize: isMobile ? "15px" : "16px",
                      letterSpacing: "0.2px",
                      overflow: "auto",
                      wordBreak: "break-word",
                      fontWeight: "400"
                    }}>
                      <ReactMarkdown>{orderData.final_answer}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ 
                      color: "#94a3b8",
                      fontStyle: "italic" 
                    }}>No final answer found.</p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Add viewport meta tag for mobile responsiveness */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @media (max-width: 768px) {
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
              font-family: 'Inter', sans-serif;
            }
          }
          
          /* Allow scrolling on mobile devices */
          @media (max-width: 768px) {
            html, body {
              position: relative;
              width: 100%;
              height: 100%;
              overflow-y: auto;
              overflow-x: hidden;
              font-family: 'Inter', sans-serif;
            }
          }
          
          /* Only prevent rubber-band scrolling on desktop */
          @media (min-width: 769px) {
            html, body {
              overflow: auto;
              width: 100%;
              height: 100%;
              font-family: 'Inter', sans-serif;
            }
            
            /* Custom scrollbar styling for all devices */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
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
          }
          
          /* Apply scrollbar styling to all devices */
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
          
          /* Add more responsive styles here */
          @media (max-width: 480px) {
            /* Extra small devices */
            body {
              -webkit-overflow-scrolling: touch;
            }
          }
          
          /* Additional Animation for button hover states, transitions, etc */
          @keyframes pulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.05); opacity: 0.3; }
            100% { transform: scale(0.95); opacity: 0.7; }
          }
          
          @keyframes fadeIn {
            0% { opacity: 0; transform: translateY(-10px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          
          /* Ripple effect for buttons */
          @keyframes ripple {
            0% {
              transform: scale(0);
              opacity: 1;
            }
            100% {
              transform: scale(1.5);
              opacity: 0;
            }
          }
          
          /* Smooth transition for all interactive elements */
          button, a, div[role="button"] {
            transition: all 0.2s ease-in-out !important;
          }
        `}
      </style>
    </div>
  );
}

export default AudioRecorderPage;
