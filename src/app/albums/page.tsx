import { Header } from '@/components/header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import Link from 'next/link';
import { FolderHeart, Mic } from 'lucide-react';

// Mock data for albums - replace with actual data fetching
const mockAlbums = [
  { id: 'person1', name: 'Alex Johnson', mediaCount: 15, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/person1/200/200' },
  { id: 'person2', name: 'Maria Garcia', mediaCount: 8, voiceSampleAvailable: false, coverImage: 'https://picsum.photos/seed/person2/200/200' },
  { id: 'person3', name: 'Chen Wei', mediaCount: 22, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/person3/200/200' },
  { id: 'person4', name: 'Unknown Face', mediaCount: 5, voiceSampleAvailable: false, coverImage: 'https://picsum.photos/seed/person4/200/200' },
  { id: 'person5', name: 'Samira Khan', mediaCount: 11, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/person5/200/200' },
];

export default function AlbumsPage() {
  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">People & Voices Albums</h1>
        {mockAlbums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mockAlbums.map((album) => (
              <Link key={album.id} href={`/albums/${album.id}`} passHref>
                <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer group">
                  <CardContent className="p-0 relative aspect-square">
                    <Image
                      src={album.coverImage}
                      alt={`Album cover for ${album.name}`}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </CardContent>
                   <CardFooter className="p-3 bg-card flex flex-col items-start absolute bottom-0 left-0 right-0 bg-opacity-90 backdrop-blur-sm">
                    <p className="font-medium text-sm truncate w-full">{album.name}</p>
                    <div className="flex items-center justify-between w-full mt-1">
                     <p className="text-xs text-muted-foreground">{album.mediaCount} items</p>
                      {album.voiceSampleAvailable && (
                          <Mic className="h-3 w-3 text-primary" aria-label="Voice sample available"/>
                      )}
                    </div>
                   </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10 flex flex-col items-center space-y-4">
             <FolderHeart className="w-16 h-16 text-muted-foreground/50" />
            <p>No albums have been created yet.</p>
            <p>Albums are automatically created based on faces and voices found in your uploaded media.</p>
            <p> <a href="/upload" className="text-primary hover:underline">Upload some files</a> to get started!</p>
          </div>
        )}
      </div>
    </>
  );
}
