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
  faChevronRight,
  faArrowDown,
  faChevronDown,
  faCrown,
  faCheck,
  faTimes,
  faPaperclip, // Added paperclip icon for attachment
  faVial,      // Added vial icon for blood analysis
  faFlask      // Added flask icon for urine analysis
} from "@fortawesome/free-solid-svg-icons";

function AudioRecorderPage() {
  // ---------------------------
  // STATES
  // ---------------------------
  // Recorder-related
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);  // Time elapsed in seconds
  const [timerInterval, setTimerInterval] = useState(null);  // To store the interval ID
  const MINIMUM_RECORDING_TIME = 5; // Minimum recording time in seconds

  // Text input state
  const [textInput, setTextInput] = useState("");
  
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

  // Chat continuity states
  const [isNewChat, setIsNewChat] = useState(true);
  const [previousOrderId, setPreviousOrderId] = useState(null);
  const [currentChatMessages, setCurrentChatMessages] = useState([]);

  // Subscription status
  const [isProUser, setIsProUser] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  
  // Pro user popup
  const [showProPopup, setShowProPopup] = useState(false);

  // Remaining free uses counter
  const [remainingFreeUses, setRemainingFreeUses] = useState(null);

  // Image analysis states
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageType, setSelectedImageType] = useState("blood"); // Default to blood
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

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
      
      // Set remaining free uses if available in the response
      if (data?.data?.remaining_free_uses !== undefined) {
        setRemainingFreeUses(data.data.remaining_free_uses);
        console.log("Remaining free uses:", data.data.remaining_free_uses);
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
      setRecordingTime(0); // Reset timer
      
      // Start the timer
      const interval = setInterval(() => {
        setRecordingTime(prevTime => prevTime + 1);
      }, 1000);
      setTimerInterval(interval);
      
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
    if (!mediaRecorder || recordingTime < MINIMUM_RECORDING_TIME) return;

    // Clear the timer interval
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }

    // Set the onstop handler BEFORE calling stop
    mediaRecorder.onstop = () => {
      const audioData = new Blob(chunksRef.current, { type: "audio/wav" });
      chunksRef.current = [];
      uploadAudio(audioData);
    };

    mediaRecorder.stop();
    setMediaRecorder(null);
    setRecording(false);
    setRecordingTime(0); // Reset timer
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [timerInterval]);

  // ---------------------------
  // 5) Upload the recorded audio
  // ---------------------------
  const uploadAudio = async (blobParam) => {
    if (!blobParam && !textInput) {
      alert("No audio or text to upload.");
      return;
    }

    try {
      setIsUploading(true);
      setIsProcessing(false);
      
      // Don't reset order data and order ID if continuing a conversation
      if (isNewChat) {
        setOrderData(null);
        setOrderId(null);
        setSelectedHistoryItem(null); // Clear selected item if uploading a new file
      }

      const formData = new FormData();
      if (blobParam) {
        formData.append("audio_file", blobParam, "recording.wav");
      }
      
      // Add text input to form data if provided
      if (textInput) {
        formData.append("text_input", textInput);
      }
      
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      // Build the URL with query parameters
      let url = "https://clinicalpaws.com/api/signup/upload_audio_file";
      
      // Add query parameters for chat continuity
      const params = new URLSearchParams();
      
      // IMPORTANT: Fix - use actual boolean values instead of strings
      console.log(previousOrderId)
      if (!isNewChat && previousOrderId) {
        params.append("is_new_chat", false); // Changed from "false" to false (boolean)
        params.append("previous_order_id", previousOrderId);
        console.log("Continuing conversation with previous_order_id:", previousOrderId);
      } else {
        params.append("is_new_chat", true); // Changed from "true" to true (boolean)
        console.log("Starting new conversation");
      }
      
      // Append the query parameters to the URL
      url = `${url}?${params.toString()}`;
      console.log("Request URL:", url);
      
      const response = await fetch(url, {
        method: "POST",
        headers: {
          token: accessToken,
          accept: "application/json",
        },
        body: formData,
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.detail || "Upload failed");
      }

      // If we get an order_id, start polling for order details
      if (resData.order_id) {
        setOrderId(resData.order_id);
        
        // Always update previousOrderId to the latest order_id
        setPreviousOrderId(resData.order_id);
        console.log("Setting previousOrderId to:", resData.order_id);
        
        // After first message, subsequent messages are part of the same chat
        if (isNewChat) {
          setIsNewChat(false);
          console.log("Setting isNewChat to false for subsequent messages");
        }
        
        setIsProcessing(true);
      }
      
      // Clear the text input field after submission
      setTextInput("");
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

        // If completed, stop polling and add to current chat messages
        if (data.status === "completed") {
          setIsProcessing(false);
          
          if (pollingIntervalId) {
            clearInterval(pollingIntervalId);
            setPollingIntervalId(null);
          }
          
          // Add the new message to the current chat if it's completed and not already added
          if (data.transcribed_text && data.final_answer) {
            // Use a function to check if we've already added this message
            setCurrentChatMessages(prev => {
              // Check if this order_id already exists in the messages
              const alreadyExists = prev.some(msg => msg.order_id === order_id);
              if (alreadyExists) return prev; // Don't add duplicates
              
              // Append the new message to the end of the array
              return [
                ...prev, 
                {
                  id: Date.now(), // Temporary ID for UI purposes
                  order_id: order_id,
                  transcribed_text: data.transcribed_text,
                  final_answer: data.final_answer,
                  timestamp: new Date().toISOString()
                }
              ];
            });
            
            // Clear selectedHistoryItem so we only show currentChatMessages
            setSelectedHistoryItem(null);
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
    } else if (recordingTime >= MINIMUM_RECORDING_TIME) {
      stopRecordingAndUpload();
    }
  };

  const buttonDisabled = (isUploading || isProcessing) && !recording;
  const stopButtonDisabled = recording && recordingTime < MINIMUM_RECORDING_TIME;

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
        
        // Process the items to handle nested messages
        const processedItems = newItems.map(item => {
          // Add a property to indicate if this item has follow-up messages
          return {
            ...item,
            hasMessages: item.messages && item.messages.length > 0,
            expanded: false // Add a property to track if messages are expanded
          };
        });
        
        setHistoryData((prev) => [...prev, ...processedItems]);

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

  // ---------------------------
  // Fetch subscription status
  // ---------------------------
  const fetchSubscriptionStatus = useCallback(async () => {
    try {
      setIsLoadingSubscription(true);
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        console.error("No access token found");
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
        console.error("Error fetching subscription status:", errorData);
        return;
      }

      const data = await response.json();
      setSubscriptionData(data);
      setIsProUser(data.is_active === true);
      console.log("Subscription status:", data);
    } catch (err) {
      console.error("Error in fetchSubscriptionStatus:", err);
    } finally {
      setIsLoadingSubscription(false);
    }
  }, []);

  // Fetch user details AND subscription status on mount
  useEffect(() => {
    if (!hasFetchedRef.current) {
      fetchUserDetails();
      fetchHistory();
      fetchSubscriptionStatus();
      hasFetchedRef.current = true;
    }
  }, [fetchUserDetails, fetchHistory, fetchSubscriptionStatus]);

  // ---------------------------
  // 10) Handling history selection
  // ---------------------------
  const handleHistoryItemClick = (item) => {
    // Initialize an array to hold the new current chat messages
    let initialChatMessages = [];

    // Check if this is a main conversation or a follow-up message
    if (item.messages && item.messages.length > 0) {
      // This is a main conversation with follow-ups
      // Create a combined view with the main message and all follow-ups
      const combinedConversation = {
        ...item,
        isConversationThread: true,
        thread: [
          {
            id: item.id,
            transcribed_text: item.transcribed_text,
            final_answer: item.final_answer,
            created_at: item.created_at,
            status: item.status
          },
          ...item.messages.map(msg => ({
            id: msg.id,
            transcribed_text: msg.transcribed_text,
            final_answer: msg.final_answer,
            created_at: msg.created_at,
            status: msg.status
          }))
        ]
      };
      setSelectedHistoryItem(combinedConversation);
      
      // Set previousOrderId to the latest message's id in the conversation
      // This will be either the last follow-up message id or the main message id if no follow-ups
      const latestMessageId = item.messages.length > 0 
        ? item.messages[item.messages.length - 1].id 
        : item.id;
      
      setPreviousOrderId(latestMessageId);
      setIsNewChat(false); // Set to false since we're continuing an existing conversation
      console.log("Setting previousOrderId to latest in thread:", latestMessageId);
      
      // Initialize currentChatMessages with all messages from the thread
      initialChatMessages = [
        // Start with the main message
        {
          id: item.id,
          order_id: item.id,
          transcribed_text: item.transcribed_text,
          final_answer: item.final_answer,
          timestamp: item.created_at
        },
        // Then add all follow-up messages in order
        ...item.messages.map(msg => ({
          id: msg.id,
          order_id: msg.id,
          transcribed_text: msg.transcribed_text,
          final_answer: msg.final_answer,
          timestamp: msg.created_at
        }))
      ];
    } else {
      // This is either a single message or a follow-up message selected directly
      setSelectedHistoryItem(item);
      
      // Set previousOrderId to this message's id
      setPreviousOrderId(item.id);
      setIsNewChat(false); // Set to false since we're continuing an existing conversation
      console.log("Setting previousOrderId to selected item:", item.id);
      
      // Initialize currentChatMessages with just this message
      initialChatMessages = [{
        id: item.id,
        order_id: item.id,
        transcribed_text: item.transcribed_text,
        final_answer: item.final_answer,
        timestamp: item.created_at
      }];
    }
    
    // Set the current chat messages to our initialized array
    setCurrentChatMessages(initialChatMessages);
    
    // On mobile, close the history panel after selection
    if (isMobile) {
      setShowHistoryPanel(false);
    }
  };

  // New function to toggle message expansion
  const toggleMessageExpansion = (itemId) => {
    setHistoryData(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, expanded: !item.expanded } 
          : item
      )
    );
  };

  // New function to get first line of transcribed text instead of final answer
  const getFirstLine = (text) => {
    if (!text) return "No transcription found.";
    return text.split(/\r?\n/)[0].trim();
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString || dateString === "0001-01-01T00:00:00") return "Processing...";
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle Load More button click
  const handleLoadMore = () => {
    fetchHistory();
  };

  // ---------------------------
  // 11) Profile dropdown logic
  // ---------------------------
  const toggleProfileMenu = () => {
    setShowProfileMenu((prev) => !prev);
  };

  const handleMyProfile = () => {
    // Navigate to profile page instead of showing alert
    navigate("/profile");
  };

  const handleSettings = () => {
    navigate("/settings");
  };

  const handleLogout = () => {
    Cookies.remove("accessToken");
    navigate("/login");
  };

  // Toggle history panel
  const toggleHistoryPanel = () => {
    setShowHistoryPanel(prev => !prev);
  };

  // Formatting time for display (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ---------------------------
  // New Chat Button Handler
  // ---------------------------
  const handleNewChat = () => {
    // Only reset everything if we're not already in a new chat state
    if (!isNewChat || currentChatMessages.length > 0 || selectedHistoryItem) {
      setIsNewChat(true);
      setPreviousOrderId(null);
      setCurrentChatMessages([]);
      setOrderData(null);
      setOrderId(null);
      setSelectedHistoryItem(null); // Clear the selected history item when starting a new chat
    }
  };

  // Handler for text input submission
  const handleTextSubmit = () => {
    if (textInput.trim() === "") return;
    uploadAudio(null); // Pass null as blob, will use textInput instead
  };

  // Handler for text input changes
  const handleTextInputChange = (e) => {
    setTextInput(e.target.value);
  };

  // Handle Enter key press in text input field
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent default to avoid newline in the input
      handleTextSubmit();
    }
  };

  // Add Pro version navigation handler
  const handleProVersion = () => {
    if (isProUser) {
      // Show the Pro popup instead of navigating
      setShowProPopup(true);
      
      // Auto-hide the popup after 5 seconds
      setTimeout(() => {
        setShowProPopup(false);
      }, 5000);
    } else {
      // For non-Pro users, also show the popup with free uses info
      setShowProPopup(true);
      
      // Auto-hide the popup after 5 seconds
      setTimeout(() => {
        setShowProPopup(false);
      }, 5000);
    }
  };

  // ---------------------------
  // New functions for image analysis
  // ---------------------------
  // Handle attachment button click
  const handleAttachmentClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Handle image file selection
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
      }
      
      // Check file size (limit to 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB.');
        return;
      }
      
      setSelectedImage(file);
      setShowImageModal(true);
    }
  };

  // Handle image type selection
  const handleImageTypeSelect = (type) => {
    setSelectedImageType(type);
  };

  // Handle image upload and analysis
  const handleImageUpload = async () => {
    if (!selectedImage) return;
    
    try {
      setIsUploadingImage(true);
      setShowImageModal(false);
      setIsProcessing(true);
      
      const formData = new FormData();
      formData.append("image_file", selectedImage);
      formData.append("image_type", selectedImageType);
      
      // Add query parameters for chat continuity
      formData.append("is_new_chat", isNewChat);
      if (!isNewChat && previousOrderId) {
        formData.append("previous_order_id", previousOrderId);
        console.log("Continuing conversation with previous_order_id:", previousOrderId);
      } else {
        console.log("Starting new conversation with image");
      }
      
      // Add optional parameters (empty for now, could be added in future)
      formData.append("animal_species", "");
      formData.append("animal_age", "");
      formData.append("clinical_notes", "");
      
      const accessToken = Cookies.get("accessToken");
      if (!accessToken) {
        alert("No access token found, please log in again.");
        navigate("/login");
        return;
      }

      const response = await fetch(
        "https://clinicalpaws.com/api/signup/image_analysis",
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
        throw new Error(resData.detail || "Image analysis failed");
      }

      // If we get an order_id, start polling for order details
      if (resData.order_id) {
        setOrderId(resData.order_id);
        
        // Always update previousOrderId to the latest order_id
        setPreviousOrderId(resData.order_id);
        console.log("Setting previousOrderId to:", resData.order_id);
        
        // After first message, subsequent messages are part of the same chat
        if (isNewChat) {
          setIsNewChat(false);
          console.log("Setting isNewChat to false for subsequent messages");
        }
      }
      
    } catch (err) {
      console.error("Image analysis error:", err);
      alert("Error analyzing image: " + err.message);
      setIsProcessing(false);
    } finally {
      setIsUploadingImage(false);
      setSelectedImage(null);
    }
  };

  // Close image modal
  const closeImageModal = () => {
    setShowImageModal(false);
    setSelectedImage(null);
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
        overflow: "auto", // Changed from "hidden" to "auto"
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
          overflowY: "hidden", // Changed from auto to hidden - container shouldn't scroll
          height: isMobile ? (showHistoryPanel ? "50vh" : "0") : "100vh",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)", // Smooth easing
          position: isMobile ? "absolute" : "fixed", // Changed from relative to fixed for desktop
          top: 0, // Fixed position needs positioning coordinates
          left: 0,
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
            alignItems: "center",
            justifyContent: "space-between"
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
            
            {/* Remaining Free Uses Counter in History Panel */}
            {!isProUser && remainingFreeUses !== null && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "8px",
                padding: "6px 10px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}>
                <span style={{
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#60A5FA",
                }}>
                  {remainingFreeUses} uses left
                </span>
              </div>
            )}
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
              position: "relative",
              scrollbarWidth: "thin",
              scrollbarColor: "#4b5563 #1f2937", // Firefox scrollbar colors
            }}
          >
            {/* New Chat Button - Moved here from top navigation */}
            <button
              onClick={handleNewChat}
              style={{
                padding: "10px 16px",
                borderRadius: "8px",
                background: (isNewChat && currentChatMessages.length === 0 && !selectedHistoryItem)
                  ? "rgba(59, 130, 246, 0.2)" 
                  : "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#ffffff",
                border: (isNewChat && currentChatMessages.length === 0 && !selectedHistoryItem) ? "1px solid #3B82F6" : "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                boxShadow: (isNewChat && currentChatMessages.length === 0 && !selectedHistoryItem) ? "none" : "0 2px 4px rgba(59, 130, 246, 0.25)",
                marginBottom: "20px",
                width: "100%",
              }}
            >
              {(isNewChat && currentChatMessages.length === 0 && !selectedHistoryItem) ? "New Chat" : "Start New Chat"}
            </button>
            
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
              <>
                {historyData.map((item) => {
                  // Use transcribed_text instead of final_answer for the first line
                  const firstLine = getFirstLine(item.transcribed_text);
                  const isSelected = selectedHistoryItem && 
                    (selectedHistoryItem.id === item.id || 
                     (selectedHistoryItem.isConversationThread && selectedHistoryItem.thread[0].id === item.id));
                  
                  return (
                    <div key={item.id}>
                      <div
                        onClick={() => handleHistoryItemClick(item)}
                        style={{
                          padding: isMobile ? "12px 0" : "14px 0",
                          marginBottom: "10px",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          transition: "all 0.2s ease",
                          fontSize: isMobile ? "13px" : "14px",
                          minHeight: isMobile ? "44px" : "auto",
                          display: "flex",
                          alignItems: "center",
                          color: isSelected ? "#60A5FA" : "#e2e8f0",
                          borderBottom: "1px solid rgba(255,255,255,0.03)",
                        }}
                      >
                        <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {firstLine}
                          {item.hasMessages && (
                            <span style={{ 
                              marginLeft: "8px", 
                              fontSize: "11px", 
                              color: "#60A5FA",
                              fontStyle: "italic"
                            }}>
                              ({item.messages.length} follow-up{item.messages.length > 1 ? 's' : ''})
                            </span>
                          )}
                          <div style={{ 
                            fontSize: "11px", 
                            color: "#9CA3AF", 
                            marginTop: "4px" 
                          }}>
                            {formatDate(item.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "20px",
                    marginBottom: "10px",
                  }}>
                    <button
                      onClick={handleLoadMore}
                      disabled={isLoadingHistory}
                      style={{
                        padding: "10px 20px",
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                        color: "#ffffff",
                        border: "none",
                        cursor: isLoadingHistory ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
                        opacity: isLoadingHistory ? 0.7 : 1,
                        position: "relative",
                        overflow: "hidden",
                        width: isMobile ? "90%" : "200px",
                      }}
                    >
                      {isLoadingHistory ? "Loading..." : "Load More"}

                      {/* Add ripple effect to button */}
                      <span className="ripple-effect"></span>
                    </button>
                  </div>
                )}
              </>
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

      {/* History Toggle Button - Positioning adjustment */}
      <div
        onClick={toggleHistoryPanel}
        style={{
          position: "fixed", // Changed from absolute to fixed
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

      {/* Floating Remaining Free Uses Counter - Always visible */}
      {!isProUser && remainingFreeUses !== null && !showHistoryPanel && (
        <div
          style={{
            position: "fixed",
            top: isMobile ? "130px" : "120px",
            left: "10px",
            backgroundColor: "rgba(31, 41, 55, 0.9)",
            borderRadius: "8px",
            padding: "8px 12px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            border: "1px solid rgba(59, 130, 246, 0.3)",
            zIndex: "90",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(4px)",
            animation: "fadeIn 0.3s ease-out",
            transition: "all 0.3s ease",
            transform: "translateZ(0)", // Force hardware acceleration for smoother animations
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}>
            <FontAwesomeIcon 
              icon={faMicrophone} 
              style={{ 
                color: "#60A5FA", 
                fontSize: "12px" 
              }} 
            />
            <span style={{
              fontSize: "13px",
              fontWeight: "600",
              color: "#60A5FA",
              whiteSpace: "nowrap",
            }}>
              {remainingFreeUses} free uses left
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area - adjust margin when history panel is visible */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          width: "100%",
          overflow: "visible", // Changed from "hidden" to "visible"
          backdropFilter: "blur(5px)", // Subtle effect when elements overlap
          marginLeft: !isMobile && showHistoryPanel ? "300px" : "0", // Add margin to make room for fixed history panel
          transition: "margin-left 0.4s cubic-bezier(0.16, 1, 0.3, 1)", // Smooth transition for margin
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
          {/* Left side: Title for desktop and Free Uses Counter */}
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "16px"
          }}>
            {/* Title */}
            <div style={{
              fontWeight: "600",
              fontSize: "18px",
              color: "#60A5FA",
              letterSpacing: "0.5px"
            }}>
              Clinical Paws
            </div>
            
            {/* Remaining Free Uses Counter in Top Nav */}
            {!isProUser && remainingFreeUses !== null && (
              <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "rgba(59, 130, 246, 0.1)",
                borderRadius: "8px",
                padding: "6px 12px",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}>
                <span style={{
                  fontSize: isMobile ? "12px" : "14px",
                  fontWeight: "600",
                  color: "#60A5FA",
                }}>
                  {isMobile ? `${remainingFreeUses} left` : `${remainingFreeUses} free uses remaining`}
                </span>
              </div>
            )}
          </div>

          {/* Right side buttons container */}
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {/* Pro Version Button - Updated to show status */}
            <button 
              onClick={handleProVersion}
              style={{
                padding: "8px 16px",
                borderRadius: "8px",
                background: isProUser 
                  ? "linear-gradient(135deg, #F59E0B, #D97706)" // Gold gradient for active Pro
                  : "linear-gradient(135deg, #9CA3AF, #6B7280)", // Gray gradient for non-Pro
                color: "#ffffff",
                border: "none",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.3s ease",
                boxShadow: isProUser 
                  ? "0 2px 8px rgba(245, 158, 11, 0.3)" 
                  : "0 2px 8px rgba(156, 163, 175, 0.3)",
                gap: "6px",
              }}
            >
              <FontAwesomeIcon icon={faCrown} />
              {!isMobile && (isProUser ? "Pro Active" : "Get Pro")}
            </button>

            {/* Profile Section */}
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
            width: "100%",
            boxSizing: "border-box",
            paddingRight: isMobile ? "1rem" : "2rem",
            backgroundImage: "radial-gradient(ellipse at top, rgba(59, 130, 246, 0.08), transparent 80%)",
            backgroundSize: "100% 1000px",
            backgroundRepeat: "no-repeat",
            overflowY: "auto", // Add this to enable scrolling
            overflowX: "hidden", // Prevent horizontal scrolling
          }}
        >
          {/* Instructional Text Box for New Chat */}
          {isNewChat && currentChatMessages.length === 0 && !selectedHistoryItem && (
            <div style={{
              maxWidth: "700px",
              width: "90%",
              marginTop: "30px",
              marginBottom: "30px",
              padding: "24px",
              borderRadius: "12px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.25)",
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
              animation: "fadeIn 0.4s ease-out",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center"
            }}>
              <div style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "24px" }} />
              </div>
              <h3 style={{
                margin: "0 0 12px 0",
                color: "#f3f4f6",
                fontSize: isMobile ? "18px" : "20px",
                fontWeight: "600",
              }}>Ready to Help with Your Case</h3>
              <p style={{
                color: "#d1d5db",
                fontSize: isMobile ? "14px" : "16px",
                lineHeight: "1.7",
                marginBottom: "16px",
              }}>
                Tap the microphone below to transcribe your conversation with your client and/or describe the patient's condition in detail.
                Include relevant symptoms, medical history, and any specific questions you might have.
              </p>

            </div>
          )}
          
          {/* Chat Status Indicator */}
          {!isNewChat && previousOrderId && (
            <div style={{
              padding: "8px 16px",
              borderRadius: "20px",
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              color: "#60A5FA",
              fontSize: "14px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              border: "1px solid rgba(59, 130, 246, 0.2)",
            }}>
              <span style={{ marginRight: "8px" }}>●</span>
              Continuing conversation
            </div>
          )}

          {/* Current Chat Messages - Show whenever we have messages */}
          {currentChatMessages.length > 0 && (
            <div
              style={{
                marginTop: "25px",
                padding: isMobile ? "24px 0" : "32px 0",
                maxWidth: "900px",
                width: "100%",
                overflowX: "hidden",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
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
                }}>Current Conversation</h3>
              </div>

              {currentChatMessages.map((message, index) => (
                <div key={message.id || index} style={{
                  marginBottom: "30px",
                  padding: "20px",
                  borderRadius: "12px",
                  backgroundColor: "rgba(31, 41, 55, 0.5)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}>
                  {/* User's transcribed text */}
                  <div style={{
                    marginBottom: "15px",
                    padding: "0 0 15px 0",
                    borderBottom: "1px solid rgba(255,255,255,0.08)",
                  }}>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}>
                      <div style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: avatarBgColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "10px",
                        fontSize: "12px",
                        color: "#fff",
                      }}>
                        {initials}
                      </div>
                      <span style={{ fontWeight: "500", color: "#e2e8f0" }}>You</span>
                    </div>
                    <p style={{
                      color: "#d1d5db",
                      lineHeight: "1.6",
                      fontSize: "15px",
                      margin: "0 0 0 40px",
                      wordBreak: "break-word",
                    }}>{message.transcribed_text}</p>
                  </div>

                  {/* AI's response */}
                  <div>
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}>
                      <div style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "10px",
                      }}>
                        <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "12px" }} />
                      </div>
                      <span style={{ fontWeight: "500", color: "#e2e8f0" }}>Clinical Paws</span>
                    </div>
                    <div style={{
                      lineHeight: "1.7",
                      color: "#f3f4f6",
                      fontSize: "15px",
                      margin: "0 0 0 40px",
                      wordBreak: "break-word",
                    }}>
                      <ReactMarkdown>{message.final_answer}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Only show selectedHistoryItem if we're in a new chat and there are no current messages */}
          {selectedHistoryItem && currentChatMessages.length === 0 && (
            <div
              style={{
                marginTop: "25px",
                padding: isMobile ? "24px 0" : "32px 0",
                maxWidth: "900px",
                width: "100%",
                overflowX: "hidden",
                animation: "fadeIn 0.3s ease-out",
              }}
            >
              {selectedHistoryItem.isConversationThread ? (
                // Display conversation thread
                <>
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
                    }}>Conversation Thread</h3>
                  </div>

                  {selectedHistoryItem.thread.map((message, index) => (
                    <div key={message.id} style={{
                      marginBottom: "30px",
                      padding: "20px",
                      borderRadius: "12px",
                      backgroundColor: "rgba(31, 41, 55, 0.5)",
                      border: "1px solid rgba(255,255,255,0.05)",
                    }}>
                      {/* User's transcribed text */}
                      <div style={{
                        marginBottom: "15px",
                        padding: "0 0 15px 0",
                        borderBottom: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          marginBottom: "10px",
                          justifyContent: "space-between"
                        }}>
                          <div style={{ display: "flex", alignItems: "center" }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: avatarBgColor,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "10px",
                              fontSize: "12px",
                              color: "#fff",
                            }}>
                              {initials}
                            </div>
                            <span style={{ fontWeight: "500", color: "#e2e8f0" }}>You</span>
                          </div>
                          <span style={{ 
                            fontSize: "12px", 
                            color: "#9CA3AF",
                            fontStyle: "italic"
                          }}>
                            {formatDate(message.created_at)}
                          </span>
                        </div>
                        <p style={{
                          color: "#d1d5db",
                          lineHeight: "1.6",
                          fontSize: "15px",
                          margin: "0 0 0 40px",
                          wordBreak: "break-word",
                        }}>{message.transcribed_text}</p>
                      </div>

                      {/* AI's response */}
                      {message.final_answer ? (
                        <div>
                          <div style={{
                            display: "flex",
                            alignItems: "center",
                            marginBottom: "10px",
                          }}>
                            <div style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: "10px",
                            }}>
                              <FontAwesomeIcon icon={faMicrophone} style={{ color: "#fff", fontSize: "12px" }} />
                            </div>
                            <span style={{ fontWeight: "500", color: "#e2e8f0" }}>Clinical Paws</span>
                          </div>
                          <div style={{
                            lineHeight: "1.7",
                            color: "#f3f4f6",
                            fontSize: "15px",
                            margin: "0 0 0 40px",
                            wordBreak: "break-word",
                          }}>
                            <ReactMarkdown>{message.final_answer}</ReactMarkdown>
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          color: "#9CA3AF",
                          fontStyle: "italic",
                          fontSize: "14px",
                          marginTop: "10px"
                        }}>
                          <div className="spinner" style={{
                            width: "16px",
                            height: "16px",
                            border: "2px solid rgba(59, 130, 246, 0.2)",
                            borderRadius: "50%",
                            borderTop: "2px solid #60A5FA",
                            animation: "spin 1s linear infinite",
                            marginRight: "10px",
                          }}></div>
                          Processing response...
                        </div>
                      )}
                    </div>
                  ))}
                </>
              ) : (
                // Display single message (existing code)
                <>
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
                    }}>User</h3>
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
                </>
              )}
            </div>
          )}

          {/* Add padding at the bottom to ensure content isn't hidden behind the floating mic button */}
          <div style={{ height: isMobile ? "140px" : "180px" }}></div>

          {/* Scroll to bottom button - appears when there are multiple messages */}
          {currentChatMessages.length > 1 && (
            <div 
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              style={{
                position: "fixed",
                bottom: isMobile ? "100px" : "140px", // Increased for desktop to account for separate text input
                right: "20px",
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: "#3B82F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(59, 130, 246, 0.4)",
                zIndex: 100,
              }}
            >
              <FontAwesomeIcon icon={faArrowDown} style={{ color: "#fff" }} />
            </div>
          )}

          {/* Microphone Button - Only show when not processing */}
          {!isProcessing && (
            <div
              style={{
                position: "fixed",
                bottom: "110px", // Moved up to make room for the text input below
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 200,
                backgroundColor: "rgba(17, 24, 39, 0.6)",
                backdropFilter: "blur(8px)",
                padding: "12px",
                borderRadius: "50px",
                width: isMobile ? "90%" : "auto",
              }}
            >
              <div
                onClick={handleMicClick}
                style={{
                  width: isMobile ? "90px" : "110px",
                  height: isMobile ? "90px" : "110px",
                  borderRadius: "50%",
                  background: recording
                    ? (stopButtonDisabled ? "#9CA3AF" : "linear-gradient(135deg, #ef4444, #dc2626)")
                    : "linear-gradient(135deg, #3B82F6, #2563EB)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: buttonDisabled || stopButtonDisabled ? "not-allowed" : "pointer",
                  boxShadow: recording
                    ? (stopButtonDisabled ? "0 8px 20px rgba(156, 163, 175, 0.3)" : "0 8px 20px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.2)")
                    : "0 10px 25px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(59, 130, 246, 0.2)",
                  transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                  opacity: buttonDisabled || stopButtonDisabled ? 0.7 : 1,
                  position: "relative",
                }}
              >
                {/* Pulse animation for recording state */}
                {recording && !stopButtonDisabled && (
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
                    fontSize: isMobile ? "38px" : "48px",
                    color: "#fff",
                    zIndex: 2,
                  }}
                />
              </div>

              {/* Recording Timer */}
              {recording && (
                <div
                  style={{
                    marginTop: "12px",
                    fontSize: isMobile ? "18px" : "20px",
                    color: recordingTime < MINIMUM_RECORDING_TIME ? "#F87171" : "#60A5FA",
                    fontWeight: "600",
                    fontFamily: "monospace",
                    letterSpacing: "1px",
                    animation: recordingTime < MINIMUM_RECORDING_TIME ? "pulse 1s infinite" : "none",
                  }}
                >
                  {formatTime(recordingTime)}
                </div>
              )}

              <div
                style={{
                  marginTop: "8px",
                  fontSize: isMobile ? "14px" : "16px",
                  color: "#e2e8f0",
                  fontWeight: "500",
                  textAlign: "center",
                }}
              >
                {recording
                  ? (recordingTime < MINIMUM_RECORDING_TIME
                     ? `Recording... (${MINIMUM_RECORDING_TIME - recordingTime}s)`
                     : "Tap to Stop")
                  : "Tap to Record"}
              </div>
            </div>
          )}
          
          {/* Processing indicator - Show when processing */}
          {isProcessing && (
            <div
              style={{
                position: "fixed",
                bottom: "80px",
                left: "50%",
                transform: "translateX(-50%)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                zIndex: 200,
                backgroundColor: "rgba(17, 24, 39, 0.8)",
                backdropFilter: "blur(8px)",
                padding: "16px 24px",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div className="spinner" style={{
                width: "36px",
                height: "36px",
                border: "3px solid rgba(59, 130, 246, 0.2)",
                borderRadius: "50%",
                borderTop: "3px solid #60A5FA",
                animation: "spin 1s linear infinite",
                marginBottom: "12px",
              }}></div>
              <div style={{
                fontSize: "16px",
                color: "#e2e8f0",
                fontWeight: "500",
              }}>
                Processing your request...
              </div>
            </div>
          )}
          
          {/* Text Input - Only show when not processing */}
          {!isProcessing && (
            <div
              style={{
                position: "fixed",
                bottom: "20px",
                left: "50%",
                transform: "translateX(-50%)",
                width: isMobile ? "90%" : "60%",
                maxWidth: "800px",
                display: "flex",
                alignItems: "center",
                zIndex: 200,
                padding: isMobile ? "12px" : "15px 20px",
                borderRadius: isMobile ? "50px" : "16px",
                backgroundColor: "rgba(31, 41, 55, 0.8)",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              {/* Attachment Button */}
              <button
                onClick={handleAttachmentClick}
                disabled={recording || isUploading}
                style={{
                  background: "none",
                  border: "none",
                  color: "#60A5FA",
                  fontSize: "22px",
                  cursor: (recording || isUploading) ? "not-allowed" : "pointer",
                  marginRight: "8px",
                  padding: "8px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s ease",
                  opacity: (recording || isUploading) ? 0.5 : 1,
                  "&:hover": {
                    backgroundColor: "rgba(59, 130, 246, 0.1)"
                  }
                }}
              >
                <FontAwesomeIcon icon={faPaperclip} />
              </button>
              
              {/* Hidden file input for image selection */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                style={{ display: "none" }}
              />
              
              <input
                type="text"
                value={textInput}
                onChange={handleTextInputChange}
                onKeyPress={handleKeyPress}
                placeholder="Type your message here..."
                disabled={recording || isUploading}
                style={{
                  flex: 1,
                  padding: isMobile ? "12px 16px" : "16px 20px",
                  height: isMobile ? "auto" : "50px",
                  borderRadius: isMobile ? "24px" : "12px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  backgroundColor: "rgba(17, 24, 39, 0.7)",
                  color: "#f3f4f6",
                  fontSize: isMobile ? "15px" : "16px",
                  outline: "none",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  marginRight: "10px",
                  transition: "all 0.3s ease",
                  "&:focus": {
                    borderColor: "#3B82F6",
                    boxShadow: "0 0 0 2px rgba(59, 130, 246, 0.3)"
                  }
                }}
              />
              <button
                onClick={handleTextSubmit}
                disabled={textInput.trim() === "" || isUploading}
                style={{
                  padding: isMobile ? "12px 20px" : "16px 28px",
                  height: isMobile ? "auto" : "50px",
                  borderRadius: isMobile ? "24px" : "12px",
                  backgroundColor: textInput.trim() === "" || isUploading ? 
                    "rgba(59, 130, 246, 0.3)" : 
                    "linear-gradient(135deg, #3B82F6, #2563EB)",
                  color: "#ffffff",
                  border: "none",
                  fontSize: isMobile ? "15px" : "16px",
                  fontWeight: "500",
                  cursor: textInput.trim() === "" || isUploading ? 
                    "not-allowed" : "pointer",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "all 0.3s ease",
                  whiteSpace: "nowrap",
                }}
              >
                {isMobile ? "Go" : "Send"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image Analysis Modal */}
      {showImageModal && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div 
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: isMobile ? "90%" : "500px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
              animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Close button */}
            <button
              onClick={closeImageModal}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                color: "#9CA3AF",
                fontSize: "20px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            <h2 
              style={{
                textAlign: "center",
                color: "#60A5FA",
                fontSize: "24px",
                fontWeight: "700",
                margin: "0 0 20px 0",
                animation: "slideUp 0.5s ease-out",
              }}
            >
              Medical Report Analysis
            </h2>
            
            {/* Warning notice */}
            <div style={{
              backgroundColor: "rgba(59, 130, 246, 0.1)",
              borderRadius: "8px",
              padding: "12px 16px",
              marginBottom: "20px",
              border: "1px solid rgba(59, 130, 246, 0.3)",
            }}>
              <p style={{
                color: "#60A5FA",
                fontSize: "14px",
                margin: 0,
                textAlign: "center",
                fontWeight: "500",
              }}>
                Please upload only medical report images for accurate analysis
              </p>
            </div>
            
            {selectedImage && (
              <div style={{
                marginBottom: "20px",
                textAlign: "center"
              }}>
                <img 
                  src={URL.createObjectURL(selectedImage)} 
                  alt="Selected for analysis" 
                  style={{
                    maxWidth: "100%",
                    maxHeight: "200px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                />
                <p style={{
                  fontSize: "14px",
                  color: "#9CA3AF",
                  marginTop: "8px"
                }}>
                  {selectedImage.name} ({Math.round(selectedImage.size / 1024)} KB)
                </p>
              </div>
            )}
            
            <div style={{
              backgroundColor: "rgba(31, 41, 55, 0.4)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "25px",
              border: "1px solid rgba(255,255,255,0.05)",
            }}>
              <h3 style={{
                color: "#e2e8f0",
                fontSize: "18px",
                textAlign: "center",
                margin: "0 0 15px 0",
                fontWeight: "600"
              }}>
                What type of report are you analyzing?
              </h3>
              
              {/* Analysis Type Selection */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                gap: "20px",
                marginBottom: "10px"
              }}>
                <button
                  onClick={() => handleImageTypeSelect("blood")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px 15px",
                    borderRadius: "12px",
                    border: selectedImageType === "blood" 
                      ? "2px solid #60A5FA" 
                      : "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: selectedImageType === "blood"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(31, 41, 55, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flex: 1,
                    boxShadow: selectedImageType === "blood" ? "0 0 15px rgba(59, 130, 246, 0.3)" : "none",
                  }}
                >
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(220, 38, 38, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    color: "#ef4444", // Red color for blood
                    fontSize: "28px",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                  }}>
                    <FontAwesomeIcon icon={faVial} />
                  </div>
                  <span style={{
                    color: selectedImageType === "blood" ? "#60A5FA" : "#e2e8f0",
                    fontWeight: selectedImageType === "blood" ? "600" : "400",
                    fontSize: "16px",
                  }}>
                    Blood Report
                  </span>
                  {selectedImageType === "blood" && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                      color: "#60A5FA",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}>
                      <FontAwesomeIcon icon={faCheck} style={{ marginRight: "6px" }} />
                      Selected
                    </div>
                  )}
                </button>
                
                <button
                  onClick={() => handleImageTypeSelect("urine")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    padding: "20px 15px",
                    borderRadius: "12px",
                    border: selectedImageType === "urine" 
                      ? "2px solid #60A5FA" 
                      : "1px solid rgba(255,255,255,0.1)",
                    backgroundColor: selectedImageType === "urine"
                      ? "rgba(59, 130, 246, 0.15)"
                      : "rgba(31, 41, 55, 0.6)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    flex: 1,
                    boxShadow: selectedImageType === "urine" ? "0 0 15px rgba(59, 130, 246, 0.3)" : "none",
                  }}
                >
                  <div style={{
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    backgroundColor: "rgba(245, 158, 11, 0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: "12px",
                    color: "#f59e0b", // Amber color for urine
                    fontSize: "28px",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}>
                    <FontAwesomeIcon icon={faFlask} />
                  </div>
                  <span style={{
                    color: selectedImageType === "urine" ? "#60A5FA" : "#e2e8f0",
                    fontWeight: selectedImageType === "urine" ? "600" : "400",
                    fontSize: "16px",
                  }}>
                    Urine Report
                  </span>
                  {selectedImageType === "urine" && (
                    <div style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "8px",
                      color: "#60A5FA",
                      fontWeight: "500",
                      fontSize: "14px",
                    }}>
                      <FontAwesomeIcon icon={faCheck} style={{ marginRight: "6px" }} />
                      Selected
                    </div>
                  )}
                </button>
              </div>
            </div>
            
            {/* Analysis Button */}
            <button
              onClick={handleImageUpload}
              disabled={!selectedImage || isUploadingImage}
              style={{
                width: "100%",
                padding: "16px 0",
                borderRadius: "12px",
                background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                color: "#ffffff",
                border: "none",
                cursor: !selectedImage || isUploadingImage ? "not-allowed" : "pointer",
                fontSize: "16px",
                fontWeight: "600",
                marginTop: "15px",
                boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
                opacity: !selectedImage || isUploadingImage ? 0.7 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
              }}
            >
              {isUploadingImage ? (
                <>
                  <div className="spinner" style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderRadius: "50%",
                    borderTop: "2px solid #fff",
                    animation: "spin 1s linear infinite",
                  }}></div>
                  Uploading...
                </>
              ) : (
                `Analyze ${selectedImageType === "blood" ? "Blood" : "Urine"} Report`
              )}
            </button>
          </div>
        </div>
      )}

      {/* Pro User Popup */}
      {showProPopup && (
        <div 
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            zIndex: 1000,
            backdropFilter: "blur(8px)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div 
            style={{
              backgroundColor: "#1f2937",
              borderRadius: "16px",
              padding: "30px",
              maxWidth: isMobile ? "90%" : "450px",
              width: "100%",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              position: "relative",
              overflow: "hidden",
              animation: "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowProPopup(false)}
              style={{
                position: "absolute",
                top: "15px",
                right: "15px",
                background: "none",
                border: "none",
                color: "#9CA3AF",
                fontSize: "20px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            {isProUser ? (
              // Pro User Content
              <>
                {/* Crown icon with animation */}
                <div 
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #F59E0B, #D97706)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto",
                    position: "relative",
                    animation: "pulse 2s infinite",
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faCrown} 
                    style={{ 
                      fontSize: "40px", 
                      color: "#fff",
                      animation: "float 3s ease-in-out infinite",
                    }} 
                  />
                  
                  {/* Animated particles */}
                  <div className="particles">
                    {[...Array(6)].map((_, i) => (
                      <div 
                        key={i} 
                        className="particle"
                        style={{
                          position: "absolute",
                          width: "10px",
                          height: "10px",
                          borderRadius: "50%",
                          background: "#FFD700",
                          opacity: 0.8,
                          animation: `particle${i+1} 2s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <h2 
                  style={{
                    textAlign: "center",
                    color: "#F59E0B",
                    fontSize: "24px",
                    fontWeight: "700",
                    margin: "0 0 15px 0",
                    animation: "slideUp 0.5s ease-out",
                  }}
                >
                  Pro Membership Active
                </h2>
                
                <p 
                  style={{
                    textAlign: "center",
                    color: "#e2e8f0",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    marginBottom: "25px",
                    animation: "slideUp 0.6s ease-out",
                  }}
                >
                  You're enjoying all the premium features of Clinical Paws Pro! Thank you for your support.
                </p>
                
                {/* Features list */}
                <div 
                  style={{
                    marginBottom: "25px",
                    animation: "slideUp 0.7s ease-out",
                  }}
                >
                  {[
                    "Unlimited conversations",
                    "Priority processing",
                    "Advanced clinical insights",
                    "Early access to new features"
                  ].map((feature, index) => (
                    <div 
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                        animation: `slideRight ${0.3 + index * 0.1}s ease-out`,
                      }}
                    >
                      <div 
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(245, 158, 11, 0.2)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={faCheck} 
                          style={{ 
                            color: "#F59E0B", 
                            fontSize: "12px" 
                          }} 
                        />
                      </div>
                      <span style={{ color: "#d1d5db" }}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Subscription info */}
                {subscriptionData && subscriptionData.current_period_end && (
                  <div 
                    style={{
                      textAlign: "center",
                      fontSize: "14px",
                      color: "#9CA3AF",
                      marginTop: "20px",
                      animation: "slideUp 0.8s ease-out",
                    }}
                  >
                    Subscription renews on {new Date(subscriptionData.current_period_end * 1000).toLocaleDateString()}
                  </div>
                )}
              </>
            ) : (
              // Non-Pro User Content
              <>
                {/* Limited icon */}
                <div 
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto",
                    position: "relative",
                  }}
                >
                  <FontAwesomeIcon 
                    icon={faMicrophone} 
                    style={{ 
                      fontSize: "40px", 
                      color: "#fff",
                    }} 
                  />
                </div>
                
                <h2 
                  style={{
                    textAlign: "center",
                    color: "#3B82F6",
                    fontSize: "24px",
                    fontWeight: "700",
                    margin: "0 0 15px 0",
                    animation: "slideUp 0.5s ease-out",
                  }}
                >
                  Free Plan
                </h2>
                
                <div
                  style={{
                    textAlign: "center",
                    backgroundColor: "rgba(59, 130, 246, 0.1)",
                    borderRadius: "12px",
                    padding: "15px",
                    marginBottom: "20px",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    animation: "pulse 2s infinite",
                  }}
                >
                  <span style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: "#60A5FA",
                  }}>
                    {remainingFreeUses} free uses remaining
                  </span>
                </div>
                
                <p 
                  style={{
                    textAlign: "center",
                    color: "#e2e8f0",
                    fontSize: "16px",
                    lineHeight: "1.6",
                    marginBottom: "25px",
                    animation: "slideUp 0.6s ease-out",
                  }}
                >
                  Upgrade to Pro for unlimited access and premium features!
                </p>
                
                {/* Pro features list */}
                <div 
                  style={{
                    marginBottom: "25px",
                    animation: "slideUp 0.7s ease-out",
                  }}
                >
                  {[
                    "Unlimited conversations",
                    "Priority processing",
                    "Advanced clinical insights",
                    "Early access to new features"
                  ].map((feature, index) => (
                    <div 
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "12px",
                        animation: `slideRight ${0.3 + index * 0.1}s ease-out`,
                      }}
                    >
                      <div 
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          backgroundColor: "rgba(59, 130, 246, 0.1)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: "12px",
                        }}
                      >
                        <FontAwesomeIcon 
                          icon={faCheck} 
                          style={{ 
                            color: "#3B82F6", 
                            fontSize: "12px" 
                          }} 
                        />
                      </div>
                      <span style={{ color: "#d1d5db" }}>{feature}</span>
                    </div>
                  ))}
                </div>
                
                {/* Upgrade button */}
                <button
                  onClick={() => {
                    setShowProPopup(false);
                    navigate("/pro-version");
                  }}
                  style={{
                    width: "100%",
                    padding: "12px 0",
                    borderRadius: "8px",
                    background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                    color: "#ffffff",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                    marginTop: "10px",
                    boxShadow: "0 4px 6px rgba(59, 130, 246, 0.25)",
                  }}
                >
                  Upgrade to Pro
                </button>
              </>
            )}
            
            {/* Glowing border effect */}
            <div className="glow-effect"></div>
          </div>
        </div>
      )}

      {/* Add viewport meta tag for mobile responsiveness */}
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

          /* Specific scrollbar styling for history panel */
          .history-panel::-webkit-scrollbar {
            width: 4px;
          }

          .history-panel::-webkit-scrollbar-track {
            background: #1f2937;
          }

          .history-panel::-webkit-scrollbar-thumb {
            background: #4b5563;
            border-radius: 10px;
          }

          .history-panel::-webkit-scrollbar-thumb:hover {
            background: #60a5fa;
          }

          /* Apply scrollbar styling to Firefox */
          * {
            scrollbar-width: thin;
            scrollbar-color: #4b5563 #1f2937;
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

          /* Pro popup animations */
          @keyframes scaleIn {
            0% { transform: scale(0.9); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }

          @keyframes slideUp {
            0% { transform: translateY(20px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }

          @keyframes slideRight {
            0% { transform: translateX(-20px); opacity: 0; }
            100% { transform: translateX(0); opacity: 1; }
          }

          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
          }

          /* Particle animations */
          @keyframes particle1 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(40px, -40px); opacity: 0; }
            100% { opacity: 0; }
          }

          @keyframes particle2 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(-40px, -40px); opacity: 0; }
            100% { opacity: 0; }
          }

          @keyframes particle3 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(40px, 40px); opacity: 0; }
            100% { opacity: 0; }
          }

          @keyframes particle4 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(-40px, 40px); opacity: 0; }
            100% { opacity: 0; }
          }

          @keyframes particle5 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(0, -50px); opacity: 0; }
            100% { opacity: 0; }
          }

          @keyframes particle6 {
            0% { transform: translate(0, 0); opacity: 0; }
            25% { opacity: 1; }
            50% { transform: translate(0, 50px); opacity: 0; }
            100% { opacity: 0; }
          }

          /* Glow effect */
          .glow-effect {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            border-radius: 16px;
            pointer-events: none;
            z-index: -1;
            background: linear-gradient(45deg, rgba(245, 158, 11, 0) 0%, rgba(245, 158, 11, 0.3) 50%, rgba(245, 158, 11, 0) 100%);
            background-size: 200% 200%;
            animation: glow 3s linear infinite;
          }

          @keyframes glow {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }

          /* Spinner animation */
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Smooth transition for all interactive elements */
          button, a, div[role="button"] {
            transition: all 0.2s ease-in-out !important;
          }

          /* Ripple effect for Load More button */
          .ripple-effect {
            position: absolute;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            pointer-events: none;
            transform: scale(0);
            animation: ripple 0.6s linear;
          }

          button:hover {
            background: linear-gradient(135deg, #4B91FF, #3570E3);
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(59, 130, 246, 0.3);
          }

          button:active {
            transform: translateY(0);
            box-shadow: 0 2px 3px rgba(59, 130, 246, 0.2);
          }
        `}
      </style>
    </div>
  );
}

export default AudioRecorderPage;
