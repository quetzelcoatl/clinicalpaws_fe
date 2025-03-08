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
        backgroundColor: "#121212", // Dark background
        fontFamily: "'Segoe UI', Roboto, 'Helvetica Neue', sans-serif",
        color: "#e0e0e0", // Light text for dark background
        flexDirection: isMobile ? "column" : "row", // Stack vertically on mobile
        overflow: "hidden", // Prevent scrolling of the container
        width: "100%",
      }}
    >
      {/* Left-side: History Panel */}
      <div
        style={{
          width: showHistoryPanel 
            ? isMobile ? "100%" : "280px" 
            : "0",
          borderRight: !isMobile && "1px solid #2a2a2a",
          borderBottom: isMobile && showHistoryPanel && "1px solid #2a2a2a",
          backgroundColor: "#1a1a1a", // Slightly lighter than main background
          overflowY: "hidden",
          height: isMobile ? (showHistoryPanel ? "50vh" : "0") : "100vh",
          transition: "all 0.3s ease",
          position: isMobile ? "absolute" : "relative",
          display: "flex",
          flexDirection: "column",
          zIndex: isMobile ? "200" : "100",
          maxHeight: isMobile && showHistoryPanel ? "50vh" : "100vh",
        }}
      >
        {/* Logo/Brand at the top of the sidebar - Only show when panel is visible */}
        {showHistoryPanel && (
          <div style={{ 
            padding: "15px 20px", 
            borderBottom: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center"
          }}>
            <div style={{ 
              fontWeight: "bold", 
              fontSize: isMobile ? "16px" : "20px", 
              color: "#4A90E2",
              display: "flex",
              alignItems: "center"
            }}>
              <FontAwesomeIcon 
                icon={faMicrophone} 
                style={{ 
                  marginRight: "10px", 
                  color: "#4A90E2" 
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
              WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            }}
          >
            <h3 style={{ 
              marginTop: 0, 
              color: "#e0e0e0", 
              fontSize: isMobile ? "16px" : "18px",
              borderBottom: "1px solid #333",
              paddingBottom: "10px"
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
                      padding: isMobile ? "10px" : "12px",
                      marginBottom: "10px",
                      border: `1px solid ${isSelected ? "#4A90E2" : "#333"}`,
                      borderRadius: "8px",
                      backgroundColor: isSelected ? "#2c3e50" : "#252525",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      boxShadow: isSelected ? "0 2px 4px rgba(74, 144, 226, 0.2)" : "none",
                      transition: "all 0.2s ease",
                      fontSize: isMobile ? "13px" : "14px",
                      minHeight: isMobile ? "44px" : "auto", // Ensure touch-friendly size
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    {firstLine}
                  </div>
                );
              })
            ) : (
              <p style={{ color: "#999" }}>No history found.</p>
            )}

            {isLoadingHistory && (
              <p style={{ color: "#999", textAlign: "center" }}>Loading more history...</p>
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
            : (showHistoryPanel ? "264px" : "0"),
          width: "44px", // Larger touch target
          height: "44px", // Larger touch target
          borderRadius: "50%",
          backgroundColor: "#333",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          zIndex: isMobile ? "300" : "100", // Higher z-index to ensure visibility
          boxShadow: "0 2px 5px rgba(0,0,0,0.3)",
          border: "1px solid #444",
          transition: isMobile 
            ? "background-color 0.3s" 
            : "left 0.3s ease", // Different transitions for mobile/desktop
          transform: isMobile ? "none" : "translateY(-50%)", // Center vertically on desktop only
        }}
      >
        <FontAwesomeIcon 
          icon={showHistoryPanel ? faChevronLeft : faChevronRight} 
          style={{ color: "#e0e0e0" }} 
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
          overflow: isMobile ? "visible" : "hidden", // Hide overflow on desktop
        }}
      >
        {/* Top Navigation Bar */}
        <div
          style={{
            height: isMobile ? "60px" : "60px",
            backgroundColor: "#1a1a1a",
            borderBottom: "1px solid #2a2a2a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between", // Changed from flex-end to space-between
            padding: "0 20px",
            zIndex: 100,
            position: "relative", // Ensure positioning context
            width: "100%", // Full width
          }}
        >
          {/* Empty div for spacing or logo if needed */}
          <div style={{ width: "40px" }}></div>
          
          {/* Title for mobile (centered) */}
          {isMobile && (
            <div style={{ 
              fontWeight: "bold", 
              fontSize: "16px", 
              color: "#4A90E2"
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
                backgroundColor: avatarBgColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontWeight: "bold",
                cursor: "pointer",
                userSelect: "none",
              }}
              onClick={toggleProfileMenu}
            >
              {initials}
            </div>
            {showProfileMenu && (
              <div
                style={{
                  position: "absolute",
                  top: "50px",
                  right: 0,
                  backgroundColor: "#252525",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                  borderRadius: "8px",
                  zIndex: 999,
                  minWidth: isMobile ? "160px" : "180px",
                  border: "1px solid #333",
                  maxWidth: isMobile ? "calc(100vw - 40px)" : "auto", // Prevent overflow on mobile
                }}
              >
                <div
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid #333",
                    fontWeight: "bold",
                    color: "#e0e0e0",
                    wordBreak: "break-word", // Prevent text overflow
                  }}
                >
                  {userName || "User"}
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#e0e0e0",
                    minHeight: "44px", // Touch-friendly
                  }}
                  onClick={handleMyProfile}
                >
                  <FontAwesomeIcon icon={faUser} style={{ marginRight: "10px", width: "16px", flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap" }}>My Profile</span>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#e0e0e0",
                    minHeight: "44px", // Touch-friendly
                  }}
                  onClick={handleSettings}
                >
                  <FontAwesomeIcon icon={faCog} style={{ marginRight: "10px", width: "16px", flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap" }}>Settings</span>
                </div>
                <div
                  style={{
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    color: "#ff6b6b",
                    borderTop: "1px solid #333",
                    minHeight: "44px", // Touch-friendly
                  }}
                  onClick={handleLogout}
                >
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ marginRight: "10px", width: "16px", flexShrink: 0 }} />
                  <span style={{ whiteSpace: "nowrap" }}>Logout</span>
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
            padding: isMobile ? "1rem" : "2rem",
            backgroundColor: "#121212",
            overflowY: "auto",
            WebkitOverflowScrolling: "touch", // Smooth scrolling on iOS
            width: "100%", // Full width
            boxSizing: "border-box", // Include padding in width calculation
            paddingRight: isMobile ? "1rem" : "2rem", // Remove extra padding for scrollbar
          }}
        >
          {/* Microphone Button with Circle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              marginTop: isMobile ? "1rem" : "2rem",
              marginBottom: isMobile ? "1.5rem" : "3rem",
            }}
          >
            <div
              onClick={handleMicClick}
              style={{
                width: isMobile ? "90px" : "120px",
                height: isMobile ? "90px" : "120px",
                borderRadius: "50%",
                backgroundColor: recording ? "#f44336" : "#4A90E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: buttonDisabled ? "not-allowed" : "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
                transition: "all 0.3s ease",
                opacity: buttonDisabled ? 0.7 : 1,
              }}
            >
              <FontAwesomeIcon
                icon={recording ? faMicrophoneSlash : faMicrophone}
                style={{
                  fontSize: isMobile ? "32px" : "48px",
                  color: "#fff",
                }}
              />
            </div>
            <div
              style={{
                marginTop: "15px",
                fontSize: isMobile ? "14px" : "16px",
                color: "#e0e0e0",
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
                padding: isMobile ? "10px 15px" : "15px 20px",
                backgroundColor: "rgba(74, 144, 226, 0.1)",
                borderRadius: "8px",
                color: "#4A90E2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                border: "1px solid rgba(74, 144, 226, 0.2)",
                width: isMobile ? "90%" : "auto",
                maxWidth: "100%",
              }}
            >
              <div className="spinner" style={{
                width: "20px",
                height: "20px",
                border: "3px solid rgba(74, 144, 226, 0.3)",
                borderRadius: "50%",
                borderTop: "3px solid #4A90E2",
                animation: "spin 1s linear infinite",
                marginRight: "10px",
              }}></div>
              <style>
                {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
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
                marginTop: "20px",
                padding: isMobile ? "20px" : "30px",
                border: "1px solid #333",
                borderRadius: "12px",
                backgroundColor: "#1e1e1e",
                maxWidth: "900px", // Increased width
                width: "100%",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                overflowX: "hidden", // Prevent horizontal scrolling on small screens
              }}
            >
              {/* Transcribed Text - Now First */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "15px",
                borderBottom: "1px solid #333",
                paddingBottom: "10px"
              }}>
                <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: isMobile ? "16px" : "18px" }}>Transcribed Text</h3>
              </div>
              
              {selectedHistoryItem.transcribed_text ? (
                <p style={{ 
                  color: "#bbb", 
                  lineHeight: "1.7", 
                  fontSize: isMobile ? "14px" : "15px", 
                  marginBottom: "30px",
                  padding: "0 0 10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  wordBreak: "break-word", // Handle long words on small screens
                }}>{selectedHistoryItem.transcribed_text}</p>
              ) : (
                <p style={{ color: "#999", marginBottom: "30px" }}>No transcription data found.</p>
              )}

              {/* Final Answer - Now Second */}
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                marginBottom: "15px",
                borderBottom: "1px solid #333",
                paddingBottom: "10px"
              }}>
                <div style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#4A90E2",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: "10px"
                }}>
                  <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "14px" }} />
                </div>
                <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: isMobile ? "16px" : "18px" }}>Final Answer</h3>
              </div>
              
              {selectedHistoryItem.final_answer ? (
                <div style={{ 
                  lineHeight: "1.8", 
                  color: "#e0e0e0", 
                  fontSize: isMobile ? "14px" : "16px",
                  letterSpacing: "0.2px",
                  overflow: "auto",
                  wordBreak: "break-word", // Handle long words on small screens
                }}>
                  <ReactMarkdown>{selectedHistoryItem.final_answer}</ReactMarkdown>
                </div>
              ) : (
                <p style={{ color: "#999" }}>No final answer found.</p>
              )}
            </div>
          ) : (
            <>
              {orderData && orderData.status === "completed" && (
                <div
                  style={{
                    marginTop: "20px",
                    padding: isMobile ? "20px" : "30px",
                    border: "1px solid #333",
                    borderRadius: "12px",
                    backgroundColor: "#1e1e1e",
                    maxWidth: "900px", // Increased width
                    width: "100%",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    overflowX: "hidden", // Prevent horizontal scrolling on small screens
                  }}
                >
                  {/* Transcribed Text - Now First */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "15px",
                    borderBottom: "1px solid #333",
                    paddingBottom: "10px"
                  }}>
                    <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: isMobile ? "16px" : "18px" }}>Transcribed Text</h3>
                  </div>
                  
                  {orderData.transcribed_text ? (
                    <p style={{ 
                      color: "#bbb", 
                      lineHeight: "1.7", 
                      fontSize: isMobile ? "14px" : "15px", 
                      marginBottom: "30px",
                      padding: "0 0 10px 0",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      wordBreak: "break-word", // Handle long words on small screens
                    }}>{orderData.transcribed_text}</p>
                  ) : (
                    <p style={{ color: "#999", marginBottom: "30px" }}>No transcription data found.</p>
                  )}

                  {/* Final Answer - Now Second */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    marginBottom: "15px",
                    borderBottom: "1px solid #333",
                    paddingBottom: "10px"
                  }}>
                    <div style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "50%",
                      backgroundColor: "#4A90E2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "10px"
                    }}>
                      <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "14px" }} />
                    </div>
                    <h3 style={{ margin: 0, color: "#e0e0e0", fontSize: isMobile ? "16px" : "18px" }}>Final Answer</h3>
                  </div>
                  
                  {orderData.final_answer ? (
                    <div style={{ 
                      lineHeight: "1.8", 
                      color: "#e0e0e0", 
                      fontSize: isMobile ? "14px" : "16px",
                      letterSpacing: "0.2px",
                      overflow: "auto",
                      wordBreak: "break-word", // Handle long words on small screens
                    }}>
                      <ReactMarkdown>{orderData.final_answer}</ReactMarkdown>
                    </div>
                  ) : (
                    <p style={{ color: "#999" }}>No final answer found.</p>
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
          @media (max-width: 768px) {
            body {
              margin: 0;
              padding: 0;
              overflow-x: hidden;
              -webkit-text-size-adjust: 100%;
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
            }
          }
          
          /* Only prevent rubber-band scrolling on desktop */
          @media (min-width: 769px) {
            html, body {
              overflow: auto;
              width: 100%;
              height: 100%;
            }
            
            /* Custom scrollbar styling for all devices */
            ::-webkit-scrollbar {
              width: 8px;
              height: 8px;
            }
            
            ::-webkit-scrollbar-track {
              background: #1a1a1a;
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb {
              background: #444;
              border-radius: 4px;
            }
            
            ::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          }
          
          /* Apply scrollbar styling to all devices */
          ::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: #1a1a1a;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb {
            background: #444;
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: #555;
          }
          
          /* Add more responsive styles here */
          @media (max-width: 480px) {
            /* Extra small devices */
            body {
              -webkit-overflow-scrolling: touch;
            }
          }
          
          @media (min-width: 481px) and (max-width: 767px) {
            /* Small devices */
          }
          
          @media (min-width: 768px) and (max-width: 991px) {
            /* Medium devices (tablets) */
          }
        `}
      </style>
    </div>
  );
}

export default AudioRecorderPage;
