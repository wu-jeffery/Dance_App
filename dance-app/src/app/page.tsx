"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null); 
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [bpm, setBPM] = useState<number | null>(null);
  const [timestamps, setTimestamps] = useState<number[] | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isLooping, setIsLooping] = useState(false);
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoURL(url);
    }
  };

  // Effect to send video to backend whenever `videoFile` is updated
  useEffect(() => {
    if (videoFile) {
      sendVideoToBackend(); // Trigger backend upload
    }
  }, [videoFile]);

  const sendVideoToBackend = async () => {
    if (!videoFile) {
      console.error("No video file selected.");
      return;
    }

    const formData = new FormData();
    formData.append("video", videoFile);

    try {
      const response = await fetch("http://127.0.0.1:5000/api/analyze-beats", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log(data);
      setBPM(data.tempo);
      setTimestamps(data.beats);
      
    } catch (error) {
      console.error("Error analyzing beats:", error);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;

    if (canvas && video && videoURL) {
      const ctx = canvas.getContext("2d");

      // Match canvas size to video size
      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setDuration(video.duration);
        video.play(); // Automatically play the video
      });

      const drawFrame = () => {
        if (video.paused || video.ended) return;
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Mirror the video
          if (isMirrored) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        }
        setCurrentTime(video.currentTime); // Update current time for the scrollbar
        requestAnimationFrame(drawFrame);
      };

      video.addEventListener("play", () => {
        requestAnimationFrame(drawFrame);
      });

      video.playbackRate = playbackRate; // Set playback speed
      drawFrame();
    }
  }, [videoURL, isMirrored, playbackRate]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
      } else {
        video.pause();
      }
    }
  };

  const toggleMirror = () => setIsMirrored((prev) => !prev);
  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    setIsDropdownOpen(false); // Close the dropdown after selecting a speed
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const time = parseFloat(event.target.value);
    if (video) {
      video.currentTime = time;
      setCurrentTime(time);
    }
  };

  // looping 
  const toggleLooping = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isLooping) {
      // Turn off looping
      setIsLooping(false);
      setLoopStart(null);
      setLoopEnd(null);
    } else {
      // Set loop start time when first clicking
      if (!loopStart) {
        setLoopStart(video.currentTime);
        alert("Loop start set! Now set the loop end by clicking again.");
      } else if (!loopEnd) {
        setLoopEnd(video.currentTime);
        setIsLooping(true);
        alert("Loop end set! The video will now loop between these times.");
      }
    }
  };

  // Effect to handle looping
  useEffect(() => {
    const video = videoRef.current;

    if (!video || !isLooping || loopStart === null || loopEnd === null) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= loopEnd) {
        video.currentTime = loopStart;
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
    };
  }, [isLooping, loopStart, loopEnd]);

  return (
    <div>
      {/* Pre-upload layout */}
      {!videoURL && (
        <div className="container">
          <h1 className="container-title">TEMP8</h1>
          <h2 className="container-heading">Never miss a beat again.</h2>
          <input
            type="file"
            accept="video/*"
            className="upload-button"
            onChange={handleFileUpload}
          />
        </div>
      )}

      {/* Post-upload layout */}
      {videoURL && (
        <div className="video-container">
          {/* Hidden video element for playback */}
          <video ref={videoRef} src={videoURL} style={{ display: "none" }} />

          {/* Canvas for displaying the video */}
          <canvas ref={canvasRef} className="w-full h-full" onClick={togglePlayPause} />

          {/* Sidebar buttons */}
          <div className="video-sidebar">
            <button onClick={toggleMirror}>
              Mirror {isMirrored ? "On" : "Off"}
            </button>

            {/* Speed dropdown */}
            <div className="dropdown">
              <button className="dropdown-btn" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                Speed {playbackRate}x
              </button>
              {isDropdownOpen && (
                <div className="dropdown-menu">
                  <button onClick={() => changeSpeed(1)}>1x Speed</button>
                  <button onClick={() => changeSpeed(0.75)}>0.75x Speed</button>
                  <button onClick={() => changeSpeed(0.5)}>0.5x Speed</button>
                </div>
              )}
            </div>

            {/* loop button */}
            <button onClick={toggleLooping}>
              {isLooping ? "Disable Loop" : "Set Loop"}
            </button>
          </div>

          {/* Scroll bar for seeking */}
          <div className="video-scrollbar">
            <input
              type="range"
              min="0"
              max={duration}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
            />
          </div>
        </div>
      )}
    </div>
  );
}
