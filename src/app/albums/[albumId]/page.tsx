
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowLeft, Play, Music, MessageSquare, Video } from 'lucide-react';
import Link from 'next/link';
import { MediaViewerModal } from '@/components/media-viewers/media-viewer-modal';
import type { Album, MediaItem } from '@/types'; // Import types
import { useParams } from 'next/navigation'; // Use useParams hook for client component

// Mock data - replace with actual data fetching based on albumId
const mockAlbumDatabase: Record<string, Album> = {
  'face_alex_j': {
    id: 'face_alex_j',
    name: 'Alex Johnson',
    coverImage: 'https://picsum.photos/seed/face_alex_j/200/200',
    mediaCount: 4,
    voiceSampleAvailable: true,
    voiceSampleUrl: '/api/voice-sample/person1.mp3', // Placeholder
    media: [
      { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1' },
      { id: 102, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Alex video 2', source: 'upload' },
      { id: 103, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Alex audio 3', source: 'upload' },
      { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4' },
    ],
  },
  'face_maria_g': {
    id: 'face_maria_g',
    name: 'Maria Garcia',
    coverImage: 'https://picsum.photos/seed/face_maria_g/200/200',
    mediaCount: 2,
    voiceSampleAvailable: false,
    voiceSampleUrl: null,
     media: [
      { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1' },
      { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2' },
    ],
  },
   'face_chen_w': {
     id: 'face_chen_w',
     name: 'Chen Wei',
     coverImage: 'https://picsum.photos/seed/face_chen_w/200/200',
     mediaCount: 3, // Added chat
     voiceSampleAvailable: true,
     voiceSampleUrl: '/api/voice-sample/person3.mp3', // Placeholder
     media: [
      { id: 301, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Chen video 1', source: 'upload' },
       { id: 302, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Chen audio 2', source: 'upload' },
       { id: 303, type: 'chat', url: 'chat_chen_w_1', alt: 'Chat with Chen', source: 'whatsapp', chatData: `Chen: Let's meet tomorrow.\nYou: Sounds good, what time?\nChen: How about 2 PM?\n...(more)`},
    ],
  },
   'face_unknown_1': {
     id: 'face_unknown_1',
     name: 'Unnamed',
     coverImage: 'https://picsum.photos/seed/face_unknown_1/200/200',
     mediaCount: 1,
     voiceSampleAvailable: false,
     voiceSampleUrl: null,
     media: [
       { id: 401, type: 'image', url: 'https://picsum.photos/seed/unknown1/300/200', alt: 'Unknown 1' },
     ],
   },
   'face_samira_k': {
    id: 'face_samira_k',
    name: 'Samira Khan',
    coverImage: 'https://picsum.photos/seed/face_samira_k/200/200',
    mediaCount: 4,
    voiceSampleAvailable: true,
    voiceSampleUrl: '/api/voice-sample/person5.mp3', // Placeholder
    media: [
      { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1' },
      { id: 502, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', alt: 'Samira video 2', source: 'upload' },
      { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3' },
       { id: 504, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Samira audio 4', source: 'upload' },
    ],
  },
   'face_new_unnamed_1678886400000': { // Example timestamp ID
    id: 'face_new_unnamed_1678886400000',
    name: 'Unnamed',
    coverImage: 'https://picsum.photos/seed/new_unnamed/200/200',
    mediaCount: 1,
    voiceSampleAvailable: false,
    voiceSampleUrl: null,
    media: [
        { id: 601, type: 'image', url: 'https://picsum.photos/seed/new_unnamed_img/300/200', alt: 'New Unnamed Face 1' }
    ]
    },
     'face_unnamed_2': {
     id: 'face_unnamed_2',
     name: 'Unnamed',
     coverImage: 'https://picsum.photos/seed/face_unnamed_2/200/200',
     mediaCount: 3,
     voiceSampleAvailable: false,
     voiceSampleUrl: null,
     media: [
        { id: 701, type: 'image', url: 'https://picsum.photos/seed/unnamed2_1/300/200', alt: 'Unnamed 2 - Img 1' },
        { id: 702, type: 'image', url: 'https://picsum.photos/seed/unnamed2_2/300/200', alt: 'Unnamed 2 - Img 2' },
        { id: 703, type: 'image', url: 'https://picsum.photos/seed/unnamed2_3/300/200', alt: 'Unnamed 2 - Img 3' }
     ]
   }
};


// Function to fetch album data (replace with actual fetching logic)
// Now async to simulate real fetching
async function getAlbumData(albumId: string): Promise<Album | null> {
   console.log(`Fetching data for album: ${albumId}`);
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 150));
   const album = mockAlbumDatabase[albumId as keyof typeof mockAlbumDatabase] || null;
   console.log("Fetched album data:", album);
   return album;
}


export default function AlbumDetailPage() {
  const params = useParams(); // Get route parameters
  const albumId = params.albumId as string; // Type assertion

  const [album, setAlbum] = useState<Album | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

   useEffect(() => {
    if (!albumId) return;

    setIsLoading(true);
    setError(null);

    getAlbumData(albumId)
      .then(data => {
        if (data) {
          setAlbum(data);
        } else {
          setError('Album not found.');
        }
      })
      .catch(err => {
        console.error("Error fetching album data:", err);
        setError('Failed to load album data.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [albumId]); // Re-run effect when albumId changes


  const handlePlayVoiceSample = () => {
      // TODO: Implement audio playback logic for the specific voice sample
      if (album?.voiceSampleUrl) {
        console.log('Playing voice sample:', album.voiceSampleUrl);
        const audio = new Audio(album.voiceSampleUrl);
        audio.play().catch(e => console.error("Error playing audio:", e));
         // Potentially show a toast or visual indicator
      }
  };

   const handleMediaClick = (media: MediaItem) => {
    setSelectedMedia(media);
    setIsViewerOpen(true);
  };

  const handleCloseViewer = () => {
    setIsViewerOpen(false);
    setSelectedMedia(null);
  };

   const getThumbnailUrl = (media: MediaItem): string => {
    if (media.type === 'video') return `https://picsum.photos/seed/thumb_${media.id}/300/200`; // Use placeholder for video thumbs
    if (media.type === 'audio') return `https://picsum.photos/seed/audio_${media.id}/300/200`; // Use placeholder for audio thumbs
    if (media.type === 'chat') return `https://picsum.photos/seed/chat_${media.id}/300/200`; // Use placeholder for chat thumbs
    return media.url; // Use actual URL for images
  }

   const renderOverlayIcon = (type: MediaItem['type']) => {
     switch (type) {
       case 'video':
         return <Video className="h-8 w-8 text-white opacity-75" />; // Smaller icon for grid
       case 'audio':
         return <Music className="h-8 w-8 text-white opacity-75" />;
       case 'chat':
         return <MessageSquare className="h-8 w-8 text-white opacity-75" />;
       default:
         return null;
     }
   }

  if (isLoading) {
    // TODO: Implement a better loading state, maybe skeleton loaders
    return (
         <>
            <Header />
             <div className="flex-1 container mx-auto px-4 py-8 text-center">
                <p>Loading album...</p>
            </div>
         </>
    );
  }

  if (error) {
    return (
       <>
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold mb-4 text-destructive">{error}</h1>
           <Button variant="link" asChild className="mt-4">
             <Link href="/albums">
               <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Albums
             </Link>
           </Button>
        </div>
      </>
    );
  }

   if (!album) {
    // This case should ideally be covered by the error state, but added for safety
    return (
       <>
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Album Not Found</h1>
          <p className="text-muted-foreground">The requested album data could not be loaded.</p>
           <Button variant="link" asChild className="mt-4">
             <Link href="/albums">
               <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Albums
             </Link>
           </Button>
        </div>
      </>
    );
  }


  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
           <div className="flex items-center space-x-4">
              <Button variant="outline" size="icon" asChild>
                 <Link href="/albums">
                   <ArrowLeft className="h-4 w-4" />
                    <span className="sr-only">Back to Albums</span>
                 </Link>
               </Button>
              <h1 className="text-2xl font-semibold">{album.name}</h1>
           </div>
           {album.voiceSampleUrl && (
            <Button onClick={handlePlayVoiceSample} variant="outline" size="sm">
              <Play className="mr-2 h-4 w-4" /> Play Voice Sample
            </Button>
           )}
        </div>

        {album.media && album.media.length > 0 ? (
           <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {album.media.map((media) => (
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
            <p>No media found in this album yet.</p>
             {/* TODO: Add a link/button to add media or link chats if applicable */}
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
