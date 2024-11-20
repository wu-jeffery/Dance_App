import Image from "next/image";

"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);

  // file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file); 
      setVideoURL(url);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video && videoURL) {
      const ctx = canvas.getContext("2d");

      // match canvas size to video size
      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      });

      const drawFrame = () => {
        // stop playing if its paused or ends
        if (video.paused || video.ended) return; 
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height); 

          // mirror horizontally
          if (isMirrored) {
            ctx.save();
            ctx.scale(-1, 1); 
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
        requestAnimationFrame(drawFrame); // Continue the animation loop
      };

      video.addEventListener("play", () => {
        requestAnimationFrame(drawFrame); // Start rendering frames when the video plays
      });

      // Set playback speed when it changes
      video.playbackRate = playbackRate;
    }
  }, [videoURL, isMirrored, playbackRate]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play(); // Play the video
      } else {
        video.pause(); // Pause the video
      }
    }
  };

  const toggleMirror = () => {
    setIsMirrored((prev) => !prev); // Flip the mirroring state
  };

  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed); // Update playback rate
  };

  return (
    <div>
      <h1>Video Processor</h1>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
        style={{ marginBottom: "20px" }}
      />
      {videoURL && (
        <div>
          {/* Hidden video element for playback control */}
          <video
            ref={videoRef}
            src={videoURL}
            style={{ display: "none" }}
            autoPlay
          />
          {/* Canvas for displaying the video */}
          <canvas
            ref={canvasRef}
            onClick={togglePlayPause}
            style={{
              cursor: "pointer",
              border: "1px solid black",
            }}
          />
          {/* Buttons for video options */}
          <div style={{ marginTop: "20px" }}>
            <button
              onClick={toggleMirror}
              style={{ marginRight: "10px" }}
            >
              {isMirrored ? "Unmirror" : "Mirror"}
            </button>
            
            <button
              onClick={() => changeSpeed(1)}
              style={{ marginRight: "10px" }}
            >
              Normal Speed
            </button>
            <button
              onClick={() => changeSpeed(0.75)}
              style={{ marginRight: "10px" }}
            >
              Slow (0.75x)
            </button>
            <button
              onClick={() => changeSpeed(0.5)}
              style={{ marginRight: "10px" }}
            >
              Very Slow (0.5x)
            </button>
            <button
              onClick={() => changeSpeed(0.25)}
              style={{ marginRight: "10px" }}
            >
              Slowest (0.25x)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
