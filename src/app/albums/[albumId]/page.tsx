import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { ArrowLeft, Play, Music } from 'lucide-react';
import Link from 'next/link';

// Mock data - replace with actual data fetching based on albumId
const mockAlbumData = {
  'person1': {
    name: 'Alex Johnson',
    media: [
      { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1' },
      { id: 102, type: 'video', url: 'https://picsum.photos/seed/alex2/300/200', alt: 'Alex video 2' },
      { id: 103, type: 'audio', url: 'https://picsum.photos/seed/alex3/300/200', alt: 'Alex audio 3' },
      { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4' },
    ],
    voiceSampleUrl: '/api/voice-sample/person1.mp3', // Placeholder
  },
  'person2': {
    name: 'Maria Garcia',
     media: [
      { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1' },
      { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2' },
    ],
     voiceSampleUrl: null,
  },
   'person3': {
    name: 'Chen Wei',
     media: [
      { id: 301, type: 'video', url: 'https://picsum.photos/seed/chen1/300/200', alt: 'Chen video 1' },
       { id: 302, type: 'audio', url: 'https://picsum.photos/seed/chen2/300/200', alt: 'Chen audio 2' },
    ],
     voiceSampleUrl: '/api/voice-sample/person3.mp3', // Placeholder
  },
   'person4': {
     name: 'Unknown Face',
     media: [
       { id: 401, type: 'image', url: 'https://picsum.photos/seed/unknown1/300/200', alt: 'Unknown 1' },
     ],
      voiceSampleUrl: null,
   },
   'person5': {
    name: 'Samira Khan',
    media: [
      { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1' },
      { id: 502, type: 'video', url: 'https://picsum.photos/seed/samira2/300/200', alt: 'Samira video 2' },
      { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3' },
       { id: 504, type: 'audio', url: 'https://picsum.photos/seed/samira4/300/200', alt: 'Samira audio 4' },
    ],
    voiceSampleUrl: '/api/voice-sample/person5.mp3', // Placeholder
  },
  // Add more mock data as needed
};

interface AlbumPageParams {
  params: {
    albumId: string;
  };
}

// Function to fetch album data (replace with actual fetching logic)
async function getAlbumData(albumId: string) {
   // Simulate API call delay
   await new Promise(resolve => setTimeout(resolve, 100));
   return mockAlbumData[albumId as keyof typeof mockAlbumData] || null;
}


export default async function AlbumDetailPage({ params }: AlbumPageParams) {
  const { albumId } = params;
  const album = await getAlbumData(albumId);

  if (!album) {
    // Handle case where album is not found
    return (
       <>
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-semibold mb-4">Album Not Found</h1>
          <p className="text-muted-foreground">The requested album could not be found.</p>
           <Button variant="link" asChild className="mt-4">
             <Link href="/albums">
               <ArrowLeft className="mr-2 h-4 w-4" /> Go Back to Albums
             </Link>
           </Button>
        </div>
      </>
    );
  }

  const handlePlayVoiceSample = () => {
      // TODO: Implement audio playback logic
      console.log('Playing voice sample:', album.voiceSampleUrl);
      if (album.voiceSampleUrl) {
        const audio = new Audio(album.voiceSampleUrl);
        audio.play().catch(e => console.error("Error playing audio:", e));
         // Potentially show a toast or visual indicator that audio is playing
      }
  };

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

        {album.media.length > 0 ? (
           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {album.media.map((media) => (
              <Card key={media.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0 relative aspect-video">
                  <Image
                    src={media.url}
                    alt={media.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                   {media.type === 'video' && (
                     <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                     </div>
                   )}
                   {media.type === 'audio' && (
                     <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                       <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white opacity-75"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                     </div>
                   )}
                </CardContent>
                 {/* Optional: Add footer for media type or date */}
                 {/* <CardFooter className="p-2 text-xs text-muted-foreground">{media.type}</CardFooter> */}
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No media found in this album yet.</p>
          </div>
        )}
      </div>
    </>
  );
}

// Optional: Generate static paths if you know all album IDs beforehand
// export async function generateStaticParams() {
//   const albumIds = Object.keys(mockAlbumData);
//   return albumIds.map((albumId) => ({
//     albumId: albumId,
//   }));
// }
