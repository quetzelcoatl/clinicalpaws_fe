// src/pages/AudioRecorderPage.js
import React, { useState, useRef, useEffect } from "react";
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
  const [audioBlob, setAudioBlob] = useState(null);

  // Processing status
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Polling / Order
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  // History pagination
  const [historyData, setHistoryData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const chunksRef = useRef([]);
  const navigate = useNavigate();

  // ---------------------------
  // 1) Start Recording
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

      recorder.onstop = () => {
        // Combine all chunks into one blob
        const audioData = new Blob(chunksRef.current, { type: "audio/wav" });
        setAudioBlob(audioData);
        chunksRef.current = [];
      };

      recorder.start();
      setMediaRecorder(recorder);
      setRecording(true);
    } catch (err) {
      console.error("Error starting audio recording:", err);
      alert("Microphone access denied or not supported.");
    }
  };

  // ---------------------------
  // 2) Stop Recording
  // ---------------------------
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecording(false);
    }
  };

  // ---------------------------
  // 3) Upload the recorded audio
  //    to /upload_audio_file
  // ---------------------------
  const uploadAudio = async () => {
    if (!audioBlob) {
      alert("No audio to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(false);
      setOrderData(null);
      setOrderId(null);

      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.wav");

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

      // We have an order_id; start polling fetch_order_details
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
  // 4) Poll the backend for status
  //    using /fetch_order_details
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
  // 5) UseEffect to automatically
  //    start / stop polling
  // ---------------------------
  useEffect(() => {
    if (orderId && isProcessing) {
      // Clear any old interval
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
  // 6) Single button logic:
  //    - If NOT recording => start
  //    - If recording => stop and upload
  //    After that, button is disabled
  //    until processing is complete
  // ---------------------------
  const handleMicClick = async () => {
    if (!recording) {
      // Start recording
      await startRecording();
    } else {
      // Stop recording and immediately upload
      stopRecording();
      // Once stopped, we do the upload
      uploadAudio();
    }
  };

  // Determine if the button is clickable
  // We allow a second click only if we're currently recording.
  // Once we stop -> we disable until the entire pipeline is done.
  const buttonDisabled =
    (!recording && (isUploading || isProcessing)) ||
    (recording && (isUploading || isProcessing));

  // Button label (and optional icon)
  let buttonLabel = "Start Recording 🎤";
  if (recording) {
    buttonLabel = "Stop Recording 🔴";
  } else if (isUploading || isProcessing) {
    buttonLabel = "Processing...";
  }

  // ---------------------------
  // 7) History (Paginated)
  //    Adjust the fetchHistory call to match your actual backend.
  // ---------------------------
  const fetchHistory = async (page) => {
    try {
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        `https://clinicalpaws.com/api/signup/fetch_history?page=${page}`,
        {
          headers: {
            token: accessToken,
            accept: "application/json",
          },
        }
      );
      const data = await response.json();
      if (response.ok) {
        // Adjust based on how your backend returns the data
        setHistoryData(data.history); // e.g. data.history or data.results
        setTotalPages(data.total_pages);
      } else {
        console.error("Error fetching history:", data);
      }
    } catch (err) {
      console.error("Error in fetchHistory:", err);
    }
  };

  useEffect(() => {
    fetchHistory(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const handlePrevPage = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev < totalPages ? prev + 1 : prev));
  };

  // ---------------------------
  // 8) Render the component
  // ---------------------------
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      {/** Left-side: History Panel */}
      <div
        style={{
          width: "300px",
          borderRight: "1px solid #ddd",
          padding: "1rem",
          backgroundColor: "#f7f7f7",
        }}
      >
        <h3>History</h3>
        {historyData && historyData.length > 0 ? (
          historyData.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "10px",
                marginBottom: "10px",
                border: "1px solid #ccc",
                borderRadius: "4px",
                backgroundColor: "#fff",
              }}
            >
              {/* Adjust how you display each item based on your data */}
              <p><strong>ID:</strong> {item.id}</p>
              <p><strong>Filename:</strong> {item.filename}</p>
              <p><strong>Date:</strong> {item.timestamp}</p>
            </div>
          ))
        ) : (
          <p>No history found.</p>
        )}

        {/** Pagination Buttons */}
        <div style={{ marginTop: "1rem" }}>
          <button onClick={handlePrevPage} disabled={currentPage <= 1}>
            Prev
          </button>
          <span style={{ margin: "0 10px" }}>
            Page {currentPage} of {totalPages}
          </span>
          <button onClick={handleNextPage} disabled={currentPage >= totalPages}>
            Next
          </button>
        </div>
      </div>

      {/** Right-side: Main Recorder/Results */}
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
        {/** The single mic button */}
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

        {/** Once orderData is loaded and status is completed, show result */}
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
      </div>
    </div>
  );
}

export default AudioRecorderPage;
