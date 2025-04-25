
'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, FastForward, Rewind } from 'lucide-react';
import { Slider } from '@/components/ui/slider'; // Import Slider

interface VideoViewerProps {
  src: string;
  alt: string; // Keep alt for consistency, maybe display as title
}

export function VideoViewer({ src, alt }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to update current time and duration
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
     const handleVolumeChange = () => {
        setVolume(video.volume);
        setIsMuted(video.muted);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('volumechange', handleVolumeChange);


    // Set initial duration if available
    if (video.readyState >= 1) {
        updateDuration();
    }
     // Set initial volume/muted state
    handleVolumeChange();


    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
       video.removeEventListener('volumechange', handleVolumeChange);
    };
  }, []);

   // Fullscreen change listener
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, []);

   // Auto-hide controls logic
  const hideControls = () => {
    if (isPlaying && videoRef.current && !videoRef.current.paused) { // Only hide if playing
        setShowControls(false);
    }
  };

  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(hideControls, 3000); // Hide after 3 seconds
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mousemove', resetControlsTimeout);
    container.addEventListener('mouseleave', hideControls); // Hide when mouse leaves
    resetControlsTimeout(); // Initial show

    return () => {
      container.removeEventListener('mousemove', resetControlsTimeout);
       container.removeEventListener('mouseleave', hideControls);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]); // Re-attach listeners if playing state changes


  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) {
      video.play().catch(error => console.error("Error playing video:", error));
    } else {
      video.pause();
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    const newVolume = value[0];
    video.volume = newVolume;
    setVolume(newVolume);
    // Unmute if volume is adjusted while muted
    if (newVolume > 0 && video.muted) {
        video.muted = false;
        setIsMuted(false);
    } else if (newVolume === 0) {
        video.muted = true;
        setIsMuted(true);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
    // If unmuting and volume was 0, set a default volume
    if (!video.muted && video.volume === 0) {
        video.volume = 0.5; // Or restore previous volume if you stored it
        setVolume(0.5);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value[0];
    setCurrentTime(value[0]);
  };

   const handleSeekForward = () => {
     const video = videoRef.current;
     if (!video) return;
     video.currentTime = Math.min(video.currentTime + 10, duration);
   };

    const handleSeekBackward = () => {
        const video = videoRef.current;
        if (!video) return;
        video.currentTime = Math.max(video.currentTime - 10, 0);
    };

  const toggleFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message} (${err.name})`);
      });
    } else {
      document.exitFullscreen();
    }
  };


  const formatTime = (timeInSeconds: number): string => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };


  return (
    <div ref={containerRef} className="relative w-full h-full flex items-center justify-center bg-black group" >
      <video
        ref={videoRef}
        src={src}
        className="max-w-full max-h-full object-contain"
        onClick={togglePlay} // Allow clicking video to play/pause
         onDoubleClick={toggleFullScreen} // Double click for fullscreen
      >
        Your browser does not support the video tag.
      </video>

      {/* Custom Controls Overlay */}
      <div
        className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent transition-opacity duration-300 ${showControls || !isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
         onClick={(e) => e.stopPropagation()} // Prevent clicks on controls from bubbling to video
      >
        {/* Progress Bar */}
         <Slider
            value={[currentTime]}
            max={duration || 0}
            step={1}
            onValueChange={handleSeek}
            className="w-full h-1 cursor-pointer [&>span>span]:h-1 [&>span]:h-1 [&>span>span]:bg-primary [&>span]:bg-gray-500"
             disabled={!duration}
          />

        {/* Bottom Controls Row */}
        <div className="flex items-center justify-between mt-2 text-white">
          <div className="flex items-center space-x-3">
            <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>

             <Button variant="ghost" size="icon" onClick={handleSeekBackward} className="text-white hover:bg-white/20" disabled={!duration}>
                <Rewind className="h-5 w-5" />
            </Button>
             <Button variant="ghost" size="icon" onClick={handleSeekForward} className="text-white hover:bg-white/20" disabled={!duration}>
                <FastForward className="h-5 w-5" />
            </Button>

            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={toggleMute} className="text-white hover:bg-white/20">
                {isMuted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </Button>
               <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.05}
                    onValueChange={handleVolumeChange}
                    className="w-20 h-1 cursor-pointer [&>span>span]:h-1 [&>span]:h-1 [&>span>span]:bg-white [&>span]:bg-gray-500"
                />
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <span className="text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration || 0)}
            </span>
            <Button variant="ghost" size="icon" onClick={toggleFullScreen} className="text-white hover:bg-white/20">
              {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
        </div>
         {/* Optional: Display Title */}
         {alt && <p className="text-white text-xs mt-1 truncate">{alt}</p>}
      </div>
    </div>
  );
}
