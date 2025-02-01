// src/pages/AudioRecorderPage.js

import React, { useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";

function AudioRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  // 1) Start recording
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
        // Combine all chunks into a single blob
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

  // 2) Stop recording
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecording(false);
    }
  };

  // 3) Upload the blob to FastAPI
  const uploadAudio = async () => {
    if (!audioBlob) return alert("No audio to upload.");
    try {
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.wav");

      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch("https://clinicalpaws.com/api/signup/upload_audio_file", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        body: formData, // multipart/form-data
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Upload failed");
      }

      const resData = await response.json();
      alert(`Upload success: ${resData.message}`);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Error uploading audio: " + err.message);
    }
  };

  return (
  <div style={{ padding: "2rem" }}>
    <h2>Audio Recorder</h2>
    {!recording && (
      <button
        onClick={startRecording}
        style={{
          padding: "10px 20px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          margin: "5px"
        }}
      >
        Start Recording
      </button>
    )}
    {recording && (
      <button
        onClick={stopRecording}
        style={{
          padding: "10px 20px",
          backgroundColor: "#f44336",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
          margin: "5px"
        }}
      >
        Stop Recording
      </button>
    )}
    <br /><br />
    <button
      onClick={uploadAudio}
      disabled={!audioBlob}
      style={{
        padding: "10px 20px",
        backgroundColor: "#2196F3",
        color: "white",
        border: "none",
        borderRadius: "4px",
        cursor: "pointer",
        margin: "5px",
        opacity: audioBlob ? 1 : 0.5
      }}
    >
      Upload Audio
    </button>
  </div>
);


export default AudioRecorderPage;
