
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';
import type { MediaItem, Album } from '@/types'; // Import types
import { MediaViewerModal } from '@/components/media-viewers/media-viewer-modal';
import { MessageSquare, Music, Video, FolderHeart } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton'; // For loading state
import Link from 'next/link';


// --- Mock Data Fetching ---
// Simulate fetching ALL albums and their media
async function getAllAlbums(): Promise<Album[]> {
  console.log("Mock: Fetching all albums for homepage...");
  // In a real app, fetch from your actual backend/database
  // For now, let's reuse the album detail mock data as a source
    const mockAlbumDatabase: Record<string, Album> = {
      'face_alex_j': { id: 'face_alex_j', name: 'Alex Johnson', coverImage: 'https://picsum.photos/seed/face_alex_j/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person1.mp3', media: [ { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1' }, { id: 102, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Alex video 2', source: 'upload' }, { id: 103, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Alex audio 3', source: 'upload' }, { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4' } ] },
      'face_maria_g': { id: 'face_maria_g', name: 'Maria Garcia', coverImage: 'https://picsum.photos/seed/face_maria_g/200/200', mediaCount: 2, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1' }, { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2' } ] },
      'face_chen_w': { id: 'face_chen_w', name: 'Chen Wei', coverImage: 'https://picsum.photos/seed/face_chen_w/200/200', mediaCount: 3, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person3.mp3', media: [ { id: 301, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Chen video 1', source: 'upload' }, { id: 302, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Chen audio 2', source: 'upload' }, { id: 303, type: 'chat', url: 'chat_chen_w_1', alt: 'Chat with Chen', source: 'whatsapp', chatData: `Chen: Let's meet tomorrow.\nYou: Sounds good, what time?\nChen: How about 2 PM?\n...(more)`} ] },
      'face_unknown_1': { id: 'face_unknown_1', name: 'Unnamed', coverImage: 'https://picsum.photos/seed/face_unknown_1/200/200', mediaCount: 1, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 401, type: 'image', url: 'https://picsum.photos/seed/unknown1/300/200', alt: 'Unknown 1' } ] },
      'face_samira_k': { id: 'face_samira_k', name: 'Samira Khan', coverImage: 'https://picsum.photos/seed/face_samira_k/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person5.mp3', media: [ { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1' }, { id: 502, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', alt: 'Samira video 2', source: 'upload' }, { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3' }, { id: 504, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Samira audio 4', source: 'upload' } ] },
      'face_new_unnamed_1678886400000': { id: 'face_new_unnamed_1678886400000', name: 'Unnamed', coverImage: 'https://picsum.photos/seed/new_unnamed/200/200', mediaCount: 1, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 601, type: 'image', url: 'https://picsum.photos/seed/new_unnamed_img/300/200', alt: 'New Unnamed Face 1' } ] },
      'face_unnamed_2': { id: 'face_unnamed_2', name: 'Unnamed', coverImage: 'https://picsum.photos/seed/face_unnamed_2/200/200', mediaCount: 3, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 701, type: 'image', url: 'https://picsum.photos/seed/unnamed2_1/300/200', alt: 'Unnamed 2 - Img 1' }, { id: 702, type: 'image', url: 'https://picsum.photos/seed/unnamed2_2/300/200', alt: 'Unnamed 2 - Img 2' }, { id: 703, type: 'image', url: 'https://picsum.photos/seed/unnamed2_3/300/200', alt: 'Unnamed 2 - Img 3' } ] }
   };
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
  return Object.values(mockAlbumDatabase);
}
// --- End Mock Data Fetching ---


export default function Home() {
  const [allMedia, setAllMedia] = useState<MediaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    getAllAlbums()
      .then(albums => {
         // Flatten all media items from all albums into a single array
        const flattenedMedia = albums.flatMap(album => album.media);
         // Optional: Sort by a criteria, e.g., mock ID or a future timestamp
        // flattenedMedia.sort((a, b) => /* some sorting logic */);
        setAllMedia(flattenedMedia);
        setError(null);
      })
      .catch(err => {
        console.error("Error fetching albums:", err);
        setError("Failed to load media.");
        setAllMedia([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Fetch on initial mount


  const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMedia(null);
  };

  // Use persistent paths directly if available, otherwise fall back to placeholders
  const getThumbnailUrl = (media: MediaItem): string => {
    // Prefer the actual stored URL if it seems valid (basic check)
     if (media.url && !media.url.startsWith('blob:') && !media.url.includes('placeholder')) {
       // If it's an image or looks like a persistent path, use it.
       // For video/audio/chat, we still might need specific thumbnail logic.
       if (media.type === 'image') return media.url;
       // Fallback to placeholder generation for non-image types for now
     }

     // Generate placeholder thumbnails based on type and ID
    const seed = typeof media.id === 'string' ? media.id.replace(/[^a-zA-Z0-9]/g, '') : media.id;
    if (media.type === 'video') return `https://picsum.photos/seed/vid_${seed}/300/200`;
    if (media.type === 'audio') return `https://picsum.photos/seed/aud_${seed}/300/200`;
    if (media.type === 'chat') return `https://picsum.photos/seed/chat_${seed}/300/200`;
    // Fallback for images if URL wasn't suitable or for errors
    return `https://picsum.photos/seed/img_${seed}/300/200`;
  }

  const renderOverlayIcon = (type: MediaItem['type']) => {
     switch (type) {
       case 'video':
         return <Video className="h-10 w-10 text-white opacity-80" />; // Slightly smaller
       case 'audio':
         return <Music className="h-10 w-10 text-white opacity-80" />;
        case 'chat':
            return <MessageSquare className="h-10 w-10 text-white opacity-80" />;
       default:
         return null;
     }
   }

   // Loading State UI
   if (isLoading) {
       return (
           <>
             <Header />
             <div className="flex-1 container mx-auto px-4 py-8">
                 <h1 className="text-2xl font-semibold mb-6">All Media</h1>
                 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => ( // Show 12 skeletons
                      <Skeleton key={i} className="h-40 w-full rounded-lg" />
                    ))}
                 </div>
             </div>
            </>
       );
   }

    // Error State UI
    if (error) {
       return (
           <>
             <Header />
             <div className="flex-1 container mx-auto px-4 py-8 text-center">
                 <h1 className="text-2xl font-semibold mb-4 text-destructive">Error Loading Media</h1>
                 <p className="text-muted-foreground">{error}</p>
                 {/* Optional: Add a retry button */}
             </div>
           </>
       );
    }


  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">All Media</h1>
        {allMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {allMedia.map((media) => (
              <Card
                key={media.id} // Use the unique ID from the media item
                className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group" // Added group for potential hover effects on overlay
                onClick={() => handleMediaClick(media)}
              >
                <CardContent className="p-0 relative aspect-video">
                  <Image
                    src={getThumbnailUrl(media)}
                    alt={media.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => { // Handle image loading errors
                        // Replace with a fallback image or style
                        e.currentTarget.src = 'https://picsum.photos/seed/error/300/200';
                    }}
                  />
                  {media.type !== 'image' && (
                     <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center transition-opacity duration-300 opacity-0 group-hover:opacity-100">
                       {renderOverlayIcon(media.type)}
                     </div>
                   )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
           <div className="text-center text-muted-foreground py-10 flex flex-col items-center space-y-4">
             <FolderHeart className="w-16 h-16 text-muted-foreground/50" />
             <p>No media has been uploaded or processed yet.</p>
             <p> <Link href="/upload" className="text-primary hover:underline">Upload some files</Link> to get started!</p>
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
