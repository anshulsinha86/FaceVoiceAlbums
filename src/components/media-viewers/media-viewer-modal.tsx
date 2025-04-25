
'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { ImageViewer } from './image-viewer';
import { VideoViewer } from './video-viewer';
import { ChatViewer } from './chat-viewer';
import type { MediaItem } from '@/types';

interface MediaViewerModalProps {
  media: MediaItem;
  isOpen: boolean;
  onClose: () => void;
}

export function MediaViewerModal({ media, isOpen, onClose }: MediaViewerModalProps) {
  const renderMediaContent = () => {
    switch (media.type) {
      case 'image':
        return <ImageViewer src={media.url} alt={media.alt} />;
      case 'video':
         // Ensure URL is valid for video player
        return <VideoViewer src={media.url} alt={media.alt} />;
       case 'audio':
         // Placeholder for Audio Player - Needs Implementation
         return (
            <div className="p-6 flex flex-col items-center justify-center h-full bg-muted">
                 <p className="text-lg font-semibold mb-4">Audio Player</p>
                 <audio controls src={media.url} className="w-full">
                     Your browser does not support the audio element.
                 </audio>
                 <p className="text-sm text-muted-foreground mt-2">{media.alt}</p>
             </div>
         );
      case 'chat':
         return <ChatViewer media={media} />;
      default:
        return <p className="p-4 text-center">Unsupported media type.</p>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] p-0 gap-0 flex flex-col !rounded-lg overflow-hidden">
        {/* Custom Header for better control if needed, otherwise DialogTitle works */}
        {/* <DialogHeader className="p-4 border-b flex flex-row justify-between items-center bg-card">
          <DialogTitle className="truncate">{media.alt || 'Media Viewer'}</DialogTitle>
           <DialogClose asChild>
               <Button variant="ghost" size="icon">
                 <X className="h-4 w-4" />
               </Button>
           </DialogClose>
        </DialogHeader> */}

        {/* Render the specific viewer based on type */}
        <div className="flex-grow h-full overflow-hidden">
          {renderMediaContent()}
        </div>
         {/* Ensure close button is always accessible */}
         <DialogClose className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground z-10 bg-background/50 hover:bg-background/80">
             <X className="h-4 w-4" />
             <span className="sr-only">Close</span>
         </DialogClose>
      </DialogContent>
    </Dialog>
  );
}
