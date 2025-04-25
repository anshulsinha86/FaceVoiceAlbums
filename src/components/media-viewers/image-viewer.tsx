
'use client';

import React, { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageViewerProps {
  src: string;
  alt: string;
}

export function ImageViewer({ src, alt }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const MAX_SCALE = 5;
  const MIN_SCALE = 0.5;
  const ZOOM_STEP = 0.3;

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + ZOOM_STEP, MAX_SCALE));
  };

  const handleZoomOut = () => {
     const newScale = Math.max(scale - ZOOM_STEP, MIN_SCALE);
     setScale(newScale);
     // Reset position if zoomed out significantly
     if (newScale <= 1) {
        setPosition({ x: 0, y: 0 });
     }
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

 const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (scale <= 1) return; // Only allow dragging when zoomed in
    e.preventDefault();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    if (imageRef.current) {
        imageRef.current.style.cursor = 'grabbing';
    }
  }, [position.x, position.y, scale]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || scale <= 1) return;
    e.preventDefault();
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  }, [isDragging, dragStart.x, dragStart.y, scale]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
        setIsDragging(false);
        if (imageRef.current) {
            imageRef.current.style.cursor = 'grab';
        }
    }
  }, [isDragging]);

   const handleMouseLeave = useCallback(() => {
    if (isDragging) {
        setIsDragging(false);
        if (imageRef.current) {
            imageRef.current.style.cursor = 'grab';
        }
    }
   }, [isDragging]);


  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden bg-background/80">
       {/* Image Container */}
      <div
        ref={imageRef}
        className="flex-grow w-full h-full flex items-center justify-center overflow-hidden"
         style={{ cursor: scale > 1 ? 'grab' : 'default' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave} // Handle leaving the container while dragging
      >
        <div
            className="relative transition-transform duration-100 ease-out" // Added transition for smoother zoom
             style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
                transformOrigin: 'center center', // Ensure zoom centers correctly
                maxWidth: '100%', // Prevent image exceeding container width initially
                maxHeight: '100%', // Prevent image exceeding container height initially
             }}
        >
             {/* Using next/image with unoptimized to allow direct style manipulation for zoom/pan */}
             {/* Adjust width/height constraints as needed */}
            <Image
                src={src}
                alt={alt}
                width={800} // Provide base dimensions, adjust as needed
                height={600}
                quality={90}
                draggable="false" // Prevent native image dragging
                style={{ objectFit: 'contain', display: 'block' }} // Ensure image scales within its container
                unoptimized // Important for transform to work reliably without layout shifts
            />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 bg-card/80 backdrop-blur-sm p-2 rounded-full shadow-md">
        <Button variant="ghost" size="icon" onClick={handleZoomOut} disabled={scale <= MIN_SCALE}>
          <ZoomOut className="h-5 w-5" />
        </Button>
        <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
        <Button variant="ghost" size="icon" onClick={handleZoomIn} disabled={scale >= MAX_SCALE}>
          <ZoomIn className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={handleReset} disabled={scale === 1 && position.x === 0 && position.y === 0}>
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
