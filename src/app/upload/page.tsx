
'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Upload, Link2, FileText, MessageSquare, Music, Video } from 'lucide-react';
import { handleNewUploads } from '@/lib/face-voice-processing'; // Assuming this handles post-upload logic
import type { Album, MediaItem, LinkedChat } from '@/types'; // Import types

// Mock function to get available albums (replace with actual API call)
async function getAvailableAlbums(): Promise<Album[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300));
  // Return mock album names/IDs for linking
   const mockAlbumDatabase: Record<string, Album> = {
    'face_alex_j': { id: 'face_alex_j', name: 'Alex Johnson', mediaCount: 4, voiceSampleAvailable: true, coverImage: '', media: [], voiceSampleUrl: '' },
    'face_maria_g': { id: 'face_maria_g', name: 'Maria Garcia', mediaCount: 2, voiceSampleAvailable: false, coverImage: '', media: [], voiceSampleUrl: '' },
    'face_chen_w': { id: 'face_chen_w', name: 'Chen Wei', mediaCount: 3, voiceSampleAvailable: true, coverImage: '', media: [], voiceSampleUrl: '' },
    'face_samira_k': { id: 'face_samira_k', name: 'Samira Khan', mediaCount: 4, voiceSampleAvailable: true, coverImage: '', media: [], voiceSampleUrl: '' },
    'face_unnamed_1': { id: 'face_unnamed_1', name: 'Unnamed', mediaCount: 1, voiceSampleAvailable: false, coverImage: '', media: [], voiceSampleUrl: '' },
    'face_unnamed_2': { id: 'face_unnamed_2', name: 'Unnamed', mediaCount: 3, voiceSampleAvailable: false, coverImage: '', media: [], voiceSampleUrl: '' },
  };
  return Object.values(mockAlbumDatabase);
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [linkedChats, setLinkedChats] = useState<LinkedChat[]>([]); // State to track linked chats
  const { toast } = useToast();

   // Fetch available albums on component mount
  useEffect(() => {
    getAvailableAlbums().then(setAlbums);
  }, []);


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    setFiles(selectedFiles);
    setUploadProgress(0);

    // Prepare initial linking state for chat files
    if (selectedFiles) {
        const initialLinks: LinkedChat[] = Array.from(selectedFiles)
            .filter(file => file.type.startsWith('text/') || file.name.endsWith('.txt')) // Basic chat file detection
            .map(file => ({
                fileId: file.name + file.lastModified, // Simple unique ID for demo
                fileName: file.name,
                // Determine source based on filename (basic example)
                source: file.name.toLowerCase().includes('whatsapp') ? 'whatsapp' :
                        file.name.toLowerCase().includes('instagram') ? 'instagram' :
                        file.name.toLowerCase().includes('facebook') ? 'facebook' : 'whatsapp', // default
                linkedAlbumId: null,
            }));
        setLinkedChats(initialLinks);
    } else {
        setLinkedChats([]);
    }
  };

   const handleAlbumLinkChange = (fileId: string, albumId: string | null) => {
        setLinkedChats(prevLinks => prevLinks.map(link =>
            link.fileId === fileId ? { ...link, linkedAlbumId: albumId === 'none' ? null : albumId } : link
        ));
    };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const mediaFilesToProcess: MediaItem[] = [];
    const chatFilesToLink: LinkedChat[] = [...linkedChats]; // Use the state

    const totalFiles = files.length;
    let uploadedCount = 0;

    for (let i = 0; i < totalFiles; i++) {
      const file = files[i];
      // Simulate network delay for each file
      await new Promise(resolve => setTimeout(resolve, 500));

      // Determine file type for processing
      let fileType: MediaItem['type'] = 'image'; // Default guess
      if (file.type.startsWith('video/')) {
          fileType = 'video';
      } else if (file.type.startsWith('audio/')) {
          fileType = 'audio';
      } else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) { // Basic chat detection
          fileType = 'chat';
      }

      // Add non-chat files to the processing list
       if (fileType !== 'chat') {
            mediaFilesToProcess.push({
                id: `upload_${Date.now()}_${i}`, // Temporary ID for processing
                url: URL.createObjectURL(file), // Use object URL for local preview/processing simulation
                type: fileType,
                alt: file.name,
                // source: 'upload' // Implicit
            });
        }
        // NOTE: Chat files are handled separately via `chatFilesToLink`

      uploadedCount++;
      const progress = (uploadedCount / totalFiles) * 100;
      setUploadProgress(progress);
      console.log(`Simulating upload of ${file.name}...`);
    }

    console.log('Media files ready for processing:', mediaFilesToProcess);
    console.log('Chat files ready for linking:', chatFilesToLink);

    // TODO: Implement actual file upload logic here
    // 1. Upload all files (media and chats) to storage (e.g., Firebase Storage)
    // 2. Get persistent URLs/identifiers for uploaded files.
    // 3. Replace temporary URLs in `mediaFilesToProcess` with persistent ones.
    // 4. Update `chatFilesToLink` with persistent file identifiers.

    // Simulate processing and linking after successful upload
    try {
      // Trigger background processing for face/voice in media files
       if (mediaFilesToProcess.length > 0) {
         // Replace object URLs with placeholder persistent URLs before sending
         const processedMediaWithPersistentUrls = mediaFilesToProcess.map(mf => ({
            ...mf,
             // Replace with actual URLs after upload
            url: `persistent/path/to/${mf.alt}`
         }));
         await handleNewUploads(processedMediaWithPersistentUrls); // Call the processing function
       }

      // TODO: Send `chatFilesToLink` data to the backend to store the links
      // The backend would save which chat file is linked to which albumId.
       if (chatFilesToLink.length > 0) {
           console.log("Sending chat link data to backend:", chatFilesToLink);
           // Simulate backend call
           await new Promise(resolve => setTimeout(resolve, 300));
       }

      toast({
        title: 'Upload Complete',
        description: `${totalFiles} file(s) processed. Media analysis initiated, chats linked.`,
      });
      setUploadProgress(100); // Ensure progress bar shows 100%
    } catch (error) {
       console.error("Error during post-upload handling:", error);
       toast({
        title: 'Processing Error',
        description: 'Could not start media analysis or link chats.',
        variant: 'destructive',
      });
    } finally {
       setIsUploading(false);
       setFiles(null);
       setLinkedChats([]); // Clear linking state
       // Reset input field visually
       const fileInput = document.getElementById('file-upload') as HTMLInputElement;
       if (fileInput) fileInput.value = '';
       // Optionally reset progress bar after a short delay
       setTimeout(() => setUploadProgress(0), 2000);
    }
  };

   const getFileIcon = (file: File) => {
     if (file.type.startsWith('video/')) return <Video className="h-5 w-5 text-muted-foreground" />;
     if (file.type.startsWith('audio/')) return <Music className="h-5 w-5 text-muted-foreground" />;
     if (file.type.startsWith('image/')) return null; // No specific icon for image, handled by filename
     if (file.type.startsWith('text/') || file.name.endsWith('.txt')) return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
     return <FileText className="h-5 w-5 text-muted-foreground" />; // Default file icon
   }

  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        {/* Upload Card */}
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Upload Media & Chats</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Upload videos, audio, images, or chat history files (.txt).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file-upload">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="video/*,audio/*,image/*,text/plain,.txt" // Accept various types
                onChange={handleFileChange}
                disabled={isUploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
              </div>
            )}

             {/* Display Selected Files */}
             {files && files.length > 0 && !isUploading && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    <p className="text-sm font-medium">{files.length} file(s) selected:</p>
                    <ul className="list-none space-y-1">
                        {Array.from(files).map((file, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                                {getFileIcon(file)}
                                <span>{file.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
             )}


            <Button
              onClick={handleUpload}
              disabled={isUploading || !files || files.length === 0}
              className="w-full" // Use theme color
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : `Upload ${files?.length ?? 0} File(s)`}
            </Button>
          </CardContent>
        </Card>

        {/* Chat Linking Card - Show only if chat files are selected */}
        {linkedChats.length > 0 && !isUploading && (
          <Card className="w-full max-w-lg shadow-lg">
             <CardHeader>
                 <CardTitle className="text-xl font-semibold text-center">Link Chats to Albums</CardTitle>
                 <CardDescription className="text-center text-muted-foreground">
                     Optionally link uploaded chat files to existing face/voice albums.
                 </CardDescription>
             </CardHeader>
             <CardContent className="space-y-4">
                {linkedChats.map(chatLink => (
                    <div key={chatLink.fileId} className="flex flex-col sm:flex-row items-center justify-between gap-2 p-3 border rounded-md">
                         <div className="flex items-center gap-2 flex-grow">
                            <MessageSquare className="h-5 w-5 text-primary flex-shrink-0" />
                            <span className="text-sm font-medium truncate" title={chatLink.fileName}>{chatLink.fileName}</span>
                         </div>
                         <Select
                            value={chatLink.linkedAlbumId ?? 'none'}
                            onValueChange={(value) => handleAlbumLinkChange(chatLink.fileId, value)}
                         >
                           <SelectTrigger className="w-full sm:w-[200px]">
                             <SelectValue placeholder="Link to album..." />
                           </SelectTrigger>
                           <SelectContent>
                             <SelectItem value="none">Don't Link</SelectItem>
                             {albums.map(album => (
                               <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                    </div>
                ))}
             </CardContent>
              <CardFooter className="text-xs text-muted-foreground text-center justify-center">
                 <Link2 className="h-3 w-3 mr-1" /> Linking helps associate conversations with the people involved.
             </CardFooter>
          </Card>
        )}
      </div>
    </>
  );
}
