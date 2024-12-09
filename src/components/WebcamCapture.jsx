import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import axios from "axios";

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [recentPhoto, setRecentPhoto] = useState(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const captureIntervalRef = useRef(null);

  // Start capturing when component mounts
  useEffect(() => {
    startCapturing();

    // Cleanup function to stop capturing when component unmounts
    return () => {
      stopCapturing();
    };
  }, []);

  const startCapturing = () => {
    // Start automatic capture every 2 seconds
    captureIntervalRef.current = setInterval(captureAndUploadPhoto, 2000);
    setIsCapturing(true);
  };

  const stopCapturing = () => {
    // Stop the interval
    if (captureIntervalRef.current) {
      clearInterval(captureIntervalRef.current);
      captureIntervalRef.current = null;
    }
    setIsCapturing(false);
  };

  const captureAndUploadPhoto = async () => {
    try {
      if (!webcamRef.current) return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      // Convert base64 to Blob
      const blob = await (await fetch(imageSrc)).blob();
      const file = new File([blob], "captured_photo.png", {
        type: "image/png",
      });

      const formData = new FormData();
      formData.append("image", file);

      const response = await axios.post(
        "http://127.0.0.1:8000/PhotoUploadView/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Update the recent photo
      setRecentPhoto({
        id: response.data.id,
        image: response.data.image,
        created_at: response.data.created_at,
      });
    } catch (error) {
      console.error("Capture and upload error:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Webcam Capture Section */}
      <div className="w-1/2 p-4 flex flex-col items-center justify-center relative">
        <h2 className="text-4xl mb-2 text-green-500">Live wabscam</h2>
        <Webcam
          audio={false}
          ref={webcamRef}
          screenshotFormat="image/png"
          className={`w-full max-w-md rounded-lg shadow-lg border-4 ${
            recentPhoto ? "border-green-500" : "border-gray-600"
          }`}
        />

        {/* Stop Capture Button */}
        <button
          onClick={stopCapturing}
          className={`absolute bottom-8 left-1/2 transform -translate-x-1/2 
                       px-6 py-3 rounded-full text-white transition-colors ${
                         isCapturing
                           ? "bg-red-500 hover:bg-red-600"
                           : "bg-gray-500 hover:bg-gray-600"
                       }`}
        >
          {isCapturing ? "Stop Capture" : "Capture Paused"}
        </button>
      </div>

      {/* Recent Captured Photo */}
      <div className="w-1/2 p-4 bg-white flex flex-col items-center justify-center">
        <h2 className="text-4xl mb-2 text-sky-800">Capture Photos</h2>
        {recentPhoto ? (
          <div className="border rounded overflow-hidden">
            <img
              src={`http://127.0.0.1:8000${recentPhoto.image}`}
              alt={`Captured at ${recentPhoto.created_at}`}
              className="w-full h-auto"
            />
            <p className="text-sm p-2 text-gray-600">
              {new Date(recentPhoto.created_at).toLocaleString()}
            </p>
          </div>
        ) : (
          <p>Capturing photo...</p>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;
