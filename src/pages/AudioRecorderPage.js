// src/pages/AudioRecorderPage.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

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
      "#FFB6C1", // Light Pink
      "#AFEEEE", // Pale Turquoise
      "#98FB98", // Pale Green
      "#FFD700", // Gold
      "#FFA500", // Orange
      "#00FFFF", // Aqua
      "#E6E6FA", // Lavender
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
  let buttonLabel = "Start Recording 🎤";
  if (recording) {
    buttonLabel = "Stop Recording 🔴";
  } else if (isUploading || isProcessing) {
    buttonLabel = "Processing...";
  }

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

  // ---------------------------
  // RENDER
  // ---------------------------
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        position: "relative", // so we can position the profile icon top-right
      }}
    >
      {/* Profile "avatar" at top-right */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
        }}
      >
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
              backgroundColor: "#fff",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              borderRadius: "4px",
              zIndex: 999,
            }}
          >
            <div
              style={{
                padding: "10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={handleMyProfile}
            >
              My Profile
            </div>
            <div
              style={{
                padding: "10px",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
              onClick={handleSettings}
            >
              Settings
            </div>
          </div>
        )}
      </div>

      {/* Left-side: History Panel */}
      <div
        ref={historyPanelRef}
        style={{
          width: "300px",
          borderRight: "1px solid #ddd",
          padding: "1rem",
          backgroundColor: "#f7f7f7",
          overflowY: "scroll",
          height: "100vh",
        }}
      >
        <h3>History</h3>
        {historyData && historyData.length > 0 ? (
          historyData.map((item) => {
            const firstLine = getFirstLine(item.final_answer);
            return (
              <div
                key={item.id}
                onClick={() => handleHistoryItemClick(item)}
                style={{
                  padding: "10px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {firstLine}
              </div>
            );
          })
        ) : (
          <p>No history found.</p>
        )}

        {isLoadingHistory && <p>Loading more history...</p>}
      </div>

      {/* Right-side: Main Recorder/Results */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#f0f2f5",
        }}
      >
        {/* The single mic button */}
        <button
          onClick={handleMicClick}
          disabled={buttonDisabled}
          style={{
            padding: "15px 30px",
            fontSize: "16px",
            borderRadius: "50px",
            border: "none",
            cursor: buttonDisabled ? "not-allowed" : "pointer",
            backgroundColor: recording ? "#f44336" : "#4CAF50",
            color: "white",
            marginBottom: "20px",
          }}
        >
          {buttonLabel}
        </button>

        {isProcessing && (
          <div style={{ marginTop: "20px", color: "#555" }}>
            <strong>Processing your audio...</strong>
          </div>
        )}

        {/* Show either a selected history item or newly recorded result */}
        {selectedHistoryItem ? (
          <div
            style={{
              marginTop: "20px",
              padding: "15px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              backgroundColor: "#fff",
              maxWidth: "600px",
              width: "100%",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            }}
          >
            <h3>Final Answer</h3>
            {selectedHistoryItem.final_answer ? (
              <ReactMarkdown>{selectedHistoryItem.final_answer}</ReactMarkdown>
            ) : (
              <p>No final answer found.</p>
            )}

            <h3>Transcribed Text</h3>
            {selectedHistoryItem.transcribed_text ? (
              <p>{selectedHistoryItem.transcribed_text}</p>
            ) : (
              <p>No transcription data found.</p>
            )}
          </div>
        ) : (
          <>
            {orderData && orderData.status === "completed" && (
              <div
                style={{
                  marginTop: "20px",
                  padding: "15px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  backgroundColor: "#fff",
                  maxWidth: "600px",
                  width: "100%",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <h3>Final Answer</h3>
                {orderData.final_answer ? (
                  <ReactMarkdown>{orderData.final_answer}</ReactMarkdown>
                ) : (
                  <p>No final answer found.</p>
                )}

                <h3>Transcribed Text</h3>
                {orderData.transcribed_text ? (
                  <p>{orderData.transcribed_text}</p>
                ) : (
                  <p>No transcription data found.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AudioRecorderPage;
