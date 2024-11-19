import Image from "next/image";

"use client";

import { useEffect, useRef, useState } from "react";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoURL, setVideoURL] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mirror, setMirror] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Handle file upload
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

    if (canvas && video) {
      const ctx = canvas.getContext("2d");
      const drawFrame = () => {
        if (!ctx || !video) return;

        // Adjust canvas size to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Mirror effect
        if (mirror) {
          ctx.save();
          ctx.scale(-1, 1);
          ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
          ctx.restore();
        } else {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        }

        if (isPlaying) {
          requestAnimationFrame(drawFrame);
        }
      };

      drawFrame();
    }
  }, [isPlaying, mirror]);

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handlePlaybackRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  return (
    <div>
      <h1>Video Processor</h1>
      <input
        type="file"
        accept="video/*"
        onChange={handleFileUpload}
      />
      {videoURL && (
        <div>
          <video
            ref={videoRef}
            src={videoURL}
            style={{ display: "none" }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
          <canvas ref={canvasRef} />
          <div >
            <button onClick={playVideo}>Play</button>
            <button onClick={pauseVideo}>Pause</button>
            <button onClick={() => setMirror(!mirror)}>
              {mirror ? "Unmirror" : "Mirror"}
            </button>
            <button onClick={() => handlePlaybackRateChange(0.5)}>
              0.5x
            </button>
            <button onClick={() => handlePlaybackRateChange(1)}>
              1x
            </button>
            <button onClick={() => handlePlaybackRateChange(2)}>
              2x
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
