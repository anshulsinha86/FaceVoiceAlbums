
'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Image from 'next/image';
import Link from 'next/link';
import { FolderHeart, Mic } from 'lucide-react';
import type { Album } from '@/types'; // Use Album type

// Mock data for albums - Now representing faces
// Use actual face crops or consistent placeholders
const initialMockAlbums: Album[] = [
  { id: 'face_alex_j', name: 'Alex Johnson', mediaCount: 15, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/face_alex_j/200/200', media: [], voiceSampleUrl: '/api/voice-sample/person1.mp3' },
  { id: 'face_maria_g', name: 'Maria Garcia', mediaCount: 8, voiceSampleAvailable: false, coverImage: 'https://picsum.photos/seed/face_maria_g/200/200', media: [], voiceSampleUrl: null },
  { id: 'face_chen_w', name: 'Chen Wei', mediaCount: 22, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/face_chen_w/200/200', media: [], voiceSampleUrl: '/api/voice-sample/person3.mp3' },
  { id: 'face_unknown_1', name: 'Unnamed', mediaCount: 5, voiceSampleAvailable: false, coverImage: 'https://picsum.photos/seed/face_unknown_1/200/200', media: [], voiceSampleUrl: null }, // Unnamed album
  { id: 'face_samira_k', name: 'Samira Khan', mediaCount: 11, voiceSampleAvailable: true, coverImage: 'https://picsum.photos/seed/face_samira_k/200/200', media: [], voiceSampleUrl: '/api/voice-sample/person5.mp3' },
  { id: 'face_unnamed_2', name: 'Unnamed', mediaCount: 3, voiceSampleAvailable: false, coverImage: 'https://picsum.photos/seed/face_unnamed_2/200/200', media: [], voiceSampleUrl: null }, // Another unnamed album
];

// Simulate fetching and potential creation of new "Unnamed" albums
// In a real app, this logic would happen server-side during processing.
// For demo, we just add one if none exist.
if (!initialMockAlbums.some(a => a.name === 'Unnamed')) {
    initialMockAlbums.push({
        id: `face_new_unnamed_${Date.now()}`,
        name: 'Unnamed',
        mediaCount: 1, // Example: found one new face
        voiceSampleAvailable: false,
        coverImage: 'https://picsum.photos/seed/new_unnamed/200/200',
        media: [],
        voiceSampleUrl: null
    });
}


export default function AlbumsPage() {
  const [albums, setAlbums] = useState<Album[]>(initialMockAlbums);
  const [editingAlbumId, setEditingAlbumId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleDoubleClick = (album: Album) => {
    setEditingAlbumId(album.id);
    setEditingName(album.name);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditingName(event.target.value);
  };

  const handleNameBlur = () => {
    if (editingAlbumId) {
      // Update the album name in the state
      setAlbums(albums.map(album =>
        album.id === editingAlbumId ? { ...album, name: editingName || 'Unnamed' } : album // Revert to 'Unnamed' if empty
      ));
      // TODO: Send update to backend API to save the name change
      console.log(`Updated album ${editingAlbumId} name to: ${editingName || 'Unnamed'}`);
      setEditingAlbumId(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleNameBlur();
    } else if (event.key === 'Escape') {
        setEditingAlbumId(null); // Cancel editing on Escape
    }
  };


  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold mb-6">People & Voices Albums</h1>
        {albums.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {albums.map((album) => (
              <div key={album.id} className="relative group">
                 <Link href={`/albums/${album.id}`} passHref className="block">
                   <Card className="overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer">
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
                   </Card>
                  </Link>
                   <CardFooter
                     className="p-3 bg-card flex flex-col items-start absolute bottom-0 left-0 right-0 bg-opacity-90 backdrop-blur-sm transition-opacity group-hover:opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      onDoubleClick={editingAlbumId === album.id ? undefined : () => handleDoubleClick(album)} // Only allow double-click if not editing
                    >
                     {editingAlbumId === album.id ? (
                       <Input
                         type="text"
                         value={editingName}
                         onChange={handleNameChange}
                         onBlur={handleNameBlur}
                         onKeyDown={handleKeyDown}
                         autoFocus
                         className="h-6 px-1 text-sm w-full bg-transparent border-primary" // Style the input
                       />
                     ) : (
                       <p className="font-medium text-sm truncate w-full cursor-pointer" title="Double-click to rename">
                         {album.name}
                       </p>
                     )}
                     <div className="flex items-center justify-between w-full mt-1">
                      <p className="text-xs text-muted-foreground">{album.mediaCount} items</p>
                       {album.voiceSampleAvailable && (
                           <Mic className="h-3 w-3 text-primary" aria-label="Voice sample available"/>
                       )}
                     </div>
                   </CardFooter>
                   {/* Static name visible when not hovered on larger screens */}
                  <div className="p-2 bg-card/80 absolute bottom-0 left-0 right-0 md:group-hover:opacity-0 opacity-100 transition-opacity pointer-events-none">
                       <p className="font-medium text-sm truncate w-full text-center">{album.name}</p>
                   </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-10 flex flex-col items-center space-y-4">
             <FolderHeart className="w-16 h-16 text-muted-foreground/50" />
            <p>No albums have been created yet.</p>
            <p>Albums are automatically created based on faces and voices found in your uploaded media.</p>
            <p> <Link href="/upload" className="text-primary hover:underline">Upload some files</Link> to get started!</p>
          </div>
        )}
      </div>
    </>
  );
}
