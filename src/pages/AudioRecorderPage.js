// src/pages/AudioRecorderPage.js

import React, { useState, useRef } from "react";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

function AudioRecorderPage() {
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const chunksRef = useRef([]);
  const navigate = useNavigate();

  // Start recording audio
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

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setMediaRecorder(null);
      setRecording(false);
    }
  };

  // Upload the recorded audio blob to FastAPI
  const uploadAudio = async () => {
    if (!audioBlob) {
      alert("No audio to upload.");
      return;
    }
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("audio_file", audioBlob, "recording.wav");

      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      // Using the headers shown in your FastAPI Swagger docs:
      const response = await fetch(
        "https://clinicalpaws.com/api/signup/upload_audio_file",
        {
          method: "POST",
          headers: {
            token: accessToken, // The JWT sent in "token" header
            accept: "application/json", // So we receive JSON response
          },
          body: formData,
        }
      );

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.detail || "Upload failed");
      }

      // Save the API response to state so it can be displayed
      setApiResponse(resData);
    } catch (err) {
      console.error("Upload error:", err);
      setApiResponse({ error: err.message });
    } finally {
      setIsUploading(false);
    }
  };

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
              margin: "5px",
              minWidth: "150px",
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

      {/* Display API response in a dignified card */}
      {apiResponse && (
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
          {apiResponse.error ? (
            <div style={{ color: "red" }}>
              <strong>Error:</strong> {apiResponse.error}
            </div>
          ) : (
            <>
              <h3>Response</h3>
              {/* If final_answer is returned, only then render it */}
              {apiResponse.final_answer ? (
                <>
                  <ReactMarkdown>
                    {apiResponse.final_answer.answer || ""}
                  </ReactMarkdown>
                  {apiResponse.final_answer.citations &&
                    apiResponse.final_answer.citations.length > 0 && (
                      <div>
                        <h4>Citations:</h4>
                        <ul>
                          {apiResponse.final_answer.citations.map(
                            (cite, index) => (
                              <li key={index}>
                                <a
                                  href={cite}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  {cite}
                                </a>
                              </li>
                            )
                          )}
                        </ul>
                      </div>
                    )}
                </>
              ) : (
                <p>No final_answer data returned.</p>
              )}
              <p>
                <strong>Filename:</strong> {apiResponse.filename}
              </p>
              <p>
                <strong>Size:</strong> {apiResponse.size}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default AudioRecorderPage;
