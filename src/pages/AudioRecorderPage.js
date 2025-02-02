// src/pages/AudioRecorderPage.js
import React, { useState, useRef, useEffect } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function AudioRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // For polling
  const [orderId, setOrderId] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollingIntervalId, setPollingIntervalId] = useState(null);

  const [isUploading, setIsUploading] = useState(false);

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
      setIsProcessing(false); // We'll flip this once we get the order_id back
      setOrderData(null); // reset previous poll results if any
      setOrderId(null);

      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.wav");

      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      // Call /upload_audio_file, expecting { order_id: ... }
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
    // If we have an orderId and we're in "processing" mode, start an interval
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

    // If we ever unmount, clear the interval
    return () => {
      if (pollingIntervalId) {
        clearInterval(pollingIntervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, isProcessing]);

  // ---------------------------
  // 6) Render the component
  // ---------------------------
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "2rem",
        minHeight: "100vh",
        backgroundColor: "#f0f2f5",
      }}
    >
      <h2>Audio Recorder</h2>
      <div>
        {!recording ? (
          <button
            onClick={startRecording}
            style={{
              padding: "10px 20px",
              backgroundColor: "#4CAF50",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              margin: "5px",
              minWidth: "150px",
            }}
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            style={{
              padding: "10px 20px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              margin: "5px",
              minWidth: "150px",
            }}
          >
            Stop Recording
          </button>
        )}
      </div>
      <div>
        <button
          onClick={uploadAudio}
          disabled={!audioBlob || isUploading}
          style={{
            padding: "10px 20px",
            backgroundColor: "#2196F3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            margin: "5px",
            opacity: audioBlob && !isUploading ? 1 : 0.5,
            minWidth: "150px",
          }}
        >
          {isUploading ? "Uploading..." : "Upload Audio"}
        </button>
      </div>

      {/* Loader or status while we wait for the final result */}
      {isProcessing && (
        <div style={{ marginTop: "20px", color: "#555" }}>
          <strong>Processing your audio...</strong>
        </div>
      )}

      {/* Once orderData is loaded and status is completed, show result */}
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
  );
}

export default AudioRecorderPage;
