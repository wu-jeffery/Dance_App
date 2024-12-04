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
  
    if (canvas && video && bpm && videoURL) {
      const ctx = canvas.getContext("2d");
  
      // Match canvas size to video size
      video.addEventListener("loadedmetadata", () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setDuration(video.duration);
        video.play(); // Automatically play the video
      });
  
      const beatInterval = 60 / bpm; // Time between beats in seconds
      let beatNumber = 1; // Initial beat number
      let flashColor = "white"; // Default border color
  
      const drawFrame = () => {
        if (video.paused || video.ended) return;
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
  
          // Calculate the current beat based on video time
          const currentTime = video.currentTime;
          const isOnBeat = Math.floor(currentTime / beatInterval) !== Math.floor((currentTime - 0.1) / beatInterval);
          beatNumber = Math.floor(currentTime / beatInterval) % 8 + 1; // Loop beat numbers 1 through 8
  
          // Change border color if on a beat
          if (isOnBeat) {
            flashColor = "red"; // Flash color
          } else {
            flashColor = "white"; // Default border color
          }
  
          // Draw the mirrored or normal video
          if (isMirrored) {
            ctx.save();
            ctx.scale(-1, 1);
            ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
            ctx.restore();
          } else {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
  
          // Draw the border
          ctx.lineWidth = 10; // Border thickness
          ctx.strokeStyle = flashColor; // Border color
          ctx.strokeRect(0, 0, canvas.width, canvas.height);
  
          // Draw the beat number in the top-left corner
          ctx.font = "24px Arial"; // Smaller font size
          ctx.fillStyle = "white";
          ctx.textAlign = "left";
          ctx.fillText(`${beatNumber}`, 10, 30); // Position in top-left corner
        }
  
        // Update current time for the scrollbar
        setCurrentTime(video.currentTime);
  
        requestAnimationFrame(drawFrame);
      };
  
      video.addEventListener("play", () => {
        requestAnimationFrame(drawFrame);
      });
  
      video.playbackRate = playbackRate; // Set playback speed
      drawFrame();
    }
  }, [videoURL, isMirrored, bpm, playbackRate]);
  
  useEffect(() => {
    const video = videoRef.current;
  
    if (video) {
      // Update `currentTime` as the video plays
      const updateTime = () => setCurrentTime(video.currentTime);
  
      // Set `duration` when metadata loads
      const setVideoDuration = () => setDuration(video.duration);
  
      video.addEventListener("timeupdate", updateTime);
      video.addEventListener("loadedmetadata", setVideoDuration);
  
      // Cleanup listeners
      return () => {
        video.removeEventListener("timeupdate", updateTime);
        video.removeEventListener("loadedmetadata", setVideoDuration);
      };
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

  const toggleMirror = () => setIsMirrored(
    (prev) => !prev
  );
  const changeSpeed = (speed: number) => {
    setPlaybackRate(speed);
    setIsDropdownOpen(false); // Close the dropdown after selecting a speed
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    const time = parseFloat(event.target.value);
    if (video) {
      video.currentTime = time;
      setCurrentTime(video.currentTime);
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
