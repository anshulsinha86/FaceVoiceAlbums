
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { MediaItem } from '@/types';
import { MediaViewerModal } from '@/components/media-viewers/media-viewer-modal';
import { MessageSquare, Music, Video } from 'lucide-react';

// Mock data for demonstration purposes using MediaItem type
const mockMedia: MediaItem[] = [
  { id: 1, type: 'image', url: 'https://picsum.photos/seed/picsum1/300/200', alt: 'Random image 1' },
  { id: 2, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Big Buck Bunny video thumbnail', source: 'upload' }, // Placeholder for video
  { id: 3, type: 'image', url: 'https://picsum.photos/seed/picsum3/300/200', alt: 'Random image 3' },
  { id: 4, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'T-Rex Roar audio thumbnail', source: 'upload' }, // Placeholder for audio
  { id: 5, type: 'image', url: 'https://picsum.photos/seed/picsum5/300/200', alt: 'Random image 5' },
  { id: 6, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Elephants Dream video thumbnail', source: 'upload' },
  { id: 7, type: 'image', url: 'https://picsum.photos/seed/picsum7/300/200', alt: 'Random image 7' },
  { id: 8, type: 'image', url: 'https://picsum.photos/seed/picsum8/300/200', alt: 'Random image 8' },
  { id: 9, type: 'chat', url: 'chat_9', alt: 'WhatsApp Chat Excerpt', source: 'whatsapp', chatData: `[01/01/2024, 10:00:00] Alice: Hey Bob!\n[01/01/2024, 10:00:05] Bob: Hi Alice, how are you?\n[01/01/2024, 10:00:15] Alice: Good, thanks! Just wanted to check in about the project.\n[01/01/2024, 10:00:30] Bob: Yeah, I've made some progress. Sent you an email.\n...\n(Scroll to see more)`},
  { id: 10, type: 'chat', url: 'chat_10', alt: 'Instagram DM Excerpt', source: 'instagram', chatData: `User1: Did you see that post?\nUser2: Yeah, crazy!\nUser1: I know right!\n...\n(Scroll to see more)`},
];


export default function Home() {
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMedia(null);
  };

  const getThumbnailUrl = (media: MediaItem): string => {
    if (media.type === 'video') return `https://picsum.photos/seed/${media.id}/300/200`; // Use placeholder for video thumbs
    if (media.type === 'audio') return `https://picsum.photos/seed/audio${media.id}/300/200`; // Use placeholder for audio thumbs
     if (media.type === 'chat') return `https://picsum.photos/seed/chat${media.id}/300/200`; // Use placeholder for chat thumbs
    return media.url; // Use actual URL for images
  }

  const renderOverlayIcon = (type: MediaItem['type']) => {
     switch (type) {
       case 'video':
         return <Video className="h-12 w-12 text-white opacity-75" />;
       case 'audio':
         return <Music className="h-12 w-12 text-white opacity-75" />;
        case 'chat':
            return <MessageSquare className="h-12 w-12 text-white opacity-75" />;
       default:
         return null;
     }
   }

  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">All Media</h1>
        {mockMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockMedia.map((media) => (
              <Card
                key={media.id}
                className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                onClick={() => handleMediaClick(media)}
              >
                <CardContent className="p-0 relative aspect-video">
                  <Image
                    src={getThumbnailUrl(media)}
                    alt={media.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                  {media.type !== 'image' && (
                     <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                       {renderOverlayIcon(media.type)}
                     </div>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No media uploaded yet. <a href="/upload" className="text-primary hover:underline">Upload your first file!</a></p>
          </div>
        )}
      </div>

      {selectedMedia && (
        <MediaViewerModal
          media={selectedMedia}
          isOpen={isViewerOpen}
          onClose={handleCloseViewer}
        />
      )}
    </>
  );
}
