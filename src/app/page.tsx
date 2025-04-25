import { Header } from '@/components/header';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

// Mock data for demonstration purposes
const mockMedia = [
  { id: 1, type: 'image', url: 'https://picsum.photos/seed/picsum1/300/200', alt: 'Random image 1' },
  { id: 2, type: 'video', url: 'https://picsum.photos/seed/picsum2/300/200', alt: 'Random video thumbnail 2' }, // Placeholder for video
  { id: 3, type: 'image', url: 'https://picsum.photos/seed/picsum3/300/200', alt: 'Random image 3' },
  { id: 4, type: 'audio', url: 'https://picsum.photos/seed/picsum4/300/200', alt: 'Random audio thumbnail 4' }, // Placeholder for audio
  { id: 5, type: 'image', url: 'https://picsum.photos/seed/picsum5/300/200', alt: 'Random image 5' },
  { id: 6, type: 'video', url: 'https://picsum.photos/seed/picsum6/300/200', alt: 'Random video thumbnail 6' },
  { id: 7, type: 'image', url: 'https://picsum.photos/seed/picsum7/300/200', alt: 'Random image 7' },
  { id: 8, type: 'image', url: 'https://picsum.photos/seed/picsum8/300/200', alt: 'Random image 8' },
];

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">All Media</h1>
        {mockMedia.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {mockMedia.map((media) => (
              <Card key={media.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0 relative aspect-video">
                  <Image
                    src={media.url}
                    alt={media.alt}
                    layout="fill"
                    objectFit="cover"
                    className="transition-transform duration-300 hover:scale-105"
                  />
                  {/* Add overlay icons for video/audio if needed */}
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
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10">
            <p>No media uploaded yet. <a href="/upload" className="text-primary hover:underline">Upload your first file!</a></p>
          </div>
        )}
      </div>
    </>
  );
}
