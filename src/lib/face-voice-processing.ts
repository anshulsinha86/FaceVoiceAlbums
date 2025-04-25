
import type { DetectedFace } from '@/services/face-recognition';
import type { VoiceProfile } from '@/services/voice-recognition';
import { detectFaces } from '@/services/face-recognition';
import { identifySpeaker } from '@/services/voice-recognition';
import { summarizeAlbumContent } from '@/ai/flows/summarize-album-content';
import type { MediaItem, Album, LinkedChat } from '@/types'; // Import shared types


interface ProcessedMedia extends MediaItem {
    detectedFaces: DetectedFace[];
    identifiedVoice: VoiceProfile | null;
}


/**
 * Placeholder function to simulate extracting audio from video.
 * In a real app, this would use a library like ffmpeg.
 * @param videoUrl URL of the video file.
 * @returns Promise resolving to the URL of the extracted audio file.
 */
async function extractAudio(videoUrl: string): Promise<string> {
    console.log(`Simulating audio extraction from ${videoUrl}`);
    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Return a placeholder audio URL
    return `${videoUrl.replace(/\.\w+$/, '')}_audio.mp3`;
}


/**
 * Processes a batch of uploaded media files to detect faces and identify voices.
 * Filters out chat files as they don't undergo face/voice processing directly.
 * @param mediaFiles Array of media files to process.
 * @returns Promise resolving to an array of processed media objects (excluding chats).
 */
export async function processMediaFiles(mediaFiles: MediaItem[]): Promise<ProcessedMedia[]> {
    const processableFiles = mediaFiles.filter(file => file.type !== 'chat');

    const processedMediaPromises = processableFiles.map(async (file) => {
        let audioUrl = file.url;
        let voice: VoiceProfile | null = null;
        let faces: DetectedFace[] = [];

        try {
            // Extract audio only if it's a video or audio file
            if (file.type === 'video') {
                audioUrl = await extractAudio(file.url);
            }

            // Run face and voice recognition concurrently only for relevant types
            const promises = [];
            if (file.type === 'video' || file.type === 'image') {
                promises.push(
                    detectFaces(file.url).catch(err => {
                        console.error(`Face detection failed for ${file.url}:`, err);
                        return []; // Return empty array on failure
                    })
                );
            } else {
                promises.push(Promise.resolve([])); // No faces for audio files
            }

            if (file.type === 'video' || file.type === 'audio') {
                 // Use the potentially extracted audio URL
                promises.push(
                    identifySpeaker(audioUrl).catch(err => {
                        console.error(`Voice identification failed for ${audioUrl} (from ${file.url}):`, err);
                        return null; // Return null on failure
                    })
                );
            } else {
                 promises.push(Promise.resolve(null)); // No voice for image files
            }

            [faces, voice] = await Promise.all(promises);

        } catch (error) {
             console.error(`Error processing file ${file.url}:`, error);
             // Continue with empty results if processing fails mid-way
             faces = [];
             voice = null;
        }


        return {
            ...file, // Spread original file info
            detectedFaces: faces,
            identifiedVoice: voice,
        } as ProcessedMedia; // Cast to ProcessedMedia
    });

    return Promise.all(processedMediaPromises);
}

/**
 * Clusters processed media into albums based on detected faces.
 * Creates "Unnamed" albums for new faces.
 * Allows linking chat files separately.
 *
 * @param processedMedia Array of processed media objects (images, videos, audio).
 * @param existingAlbums Current list of albums (to avoid duplicates and find existing).
 * @returns Promise resolving to an updated array of Album objects.
 */
export async function createOrUpdateAlbums(
    processedMedia: ProcessedMedia[],
    existingAlbums: Album[] = [] // Pass existing albums if available
): Promise<Album[]> {
    const albumsMap: Map<string, Album> = new Map(existingAlbums.map(a => [a.id, a]));

    // --- 1. Group Media by Face ---
    processedMedia.forEach(media => {
        if (media.detectedFaces.length === 0 && media.identifiedVoice) {
            // Handle voice-only media if needed (e.g., create voice-specific albums)
             console.log(`Media ${media.id} has voice but no faces.`);
            // Simplified: Add to a generic 'Voice Notes' album or handle differently
             // const voiceAlbumId = `voice_${media.identifiedVoice.id}`;
             // if (!albumsMap.has(voiceAlbumId)) { ... }
             // albumsMap.get(voiceAlbumId)?.media.push(media);
        }

        media.detectedFaces.forEach(face => {
            // Generate a unique ID for the face.
            // In a real system, this would come from a face recognition service
            // or be based on comparing face embeddings/vectors.
            // Simple placeholder using bounding box for demo uniqueness:
            const faceId = `face_${Math.round(face.boundingBox.x / 10)}_${Math.round(face.boundingBox.y / 10)}`;

            let album = albumsMap.get(faceId);

            if (!album) {
                // --- Create New "Unnamed" Album ---
                 console.log(`Creating new unnamed album for face ID: ${faceId}`);
                 // Determine the audio URL for the first voice sample
                 let initialVoiceUrl: string | null = null;
                 if (media.identifiedVoice) {
                    if (media.type === 'audio') {
                        initialVoiceUrl = media.url;
                    } else if (media.type === 'video') {
                        // Use the potentially extracted audio URL (simulated)
                        initialVoiceUrl = `${media.url.replace(/\.\w+$/, '')}_audio.mp3`;
                    }
                 }

                album = {
                    id: faceId,
                    name: 'Unnamed', // Default name for new faces
                    coverImage: media.type === 'image' || media.type === 'video' ? media.url : 'https://picsum.photos/seed/placeholder/200/200', // Use media as initial cover, or placeholder
                    media: [],
                    mediaCount: 0,
                    voiceSampleAvailable: !!media.identifiedVoice, // Check if the *first* media has voice
                    voiceSampleUrl: initialVoiceUrl, // Use first identified voice sample
                    summary: ''
                };
                albumsMap.set(faceId, album);
            }

            // --- Add Media to Album ---
            // Avoid adding duplicates if processing is re-run
            if (!album.media.some(m => m.id === media.id)) {
                album.media.push(media);
                album.mediaCount = album.media.length; // Update count

                 // Update cover image preference (image > video > audio)
                if (media.type === 'image') {
                     album.coverImage = media.url; // Prefer image covers
                } else if (media.type === 'video' && !album.media.some(m => m.type === 'image')) {
                     // Use video thumbnail URL (assuming generated elsewhere or use original URL)
                     album.coverImage = media.url; // Or a specific thumbnail URL
                }

                 // Update voice sample if not set and current media has identified voice
                 if (!album.voiceSampleUrl && media.identifiedVoice) {
                    album.voiceSampleAvailable = true;
                     if (media.type === 'audio') {
                        album.voiceSampleUrl = media.url;
                    } else if (media.type === 'video') {
                        // Use the potentially extracted audio URL (simulated)
                        album.voiceSampleUrl = `${media.url.replace(/\.\w+$/, '')}_audio.mp3`;
                    }
                 }
            }
        });
    });


     // --- 2. Generate Summaries (Optional) ---
     // Could be done here or lazily when an album is viewed
     for (const album of albumsMap.values()) {
         if (!album.summary && album.media.length > 0) { // Only generate if missing and has media
             try {
                 const description = `Album for ${album.name === 'Unnamed' ? 'an unnamed person' : album.name}, containing ${album.mediaCount} items. Types include: ${[...new Set(album.media.map(m => m.type))].join(', ')}.`;
                 const summaryResult = await summarizeAlbumContent({ albumDescription: description });
                 album.summary = summaryResult.summary;
                 console.log(`Generated summary for album ${album.id}`);
             } catch (error) {
                 console.error(`Failed to generate summary for album ${album.id}:`, error);
             }
         }
     }


    const finalAlbums = Array.from(albumsMap.values());
    console.log("Updated Albums:", finalAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
    // TODO: Persist finalAlbums to database
    return finalAlbums;
}

/**
 * Links uploaded chat files to specified albums.
 *
 * @param chatLinks Information about which chat file to link to which album.
 * @param existingAlbums The current list of albums.
 * @returns The updated list of albums (potentially with chat media added).
 */
export async function linkChatsToAlbums(
    chatLinks: LinkedChat[],
    existingAlbums: Album[]
): Promise<Album[]> {
     console.log("Linking chats:", chatLinks);
     const albumsMap = new Map(existingAlbums.map(a => [a.id, a]));

     for (const link of chatLinks) {
         if (link.linkedAlbumId) {
             const album = albumsMap.get(link.linkedAlbumId);
             if (album) {
                 // Construct a MediaItem for the chat
                 // Find the corresponding chat MediaItem from the full upload list
                 // This assumes chatLinks fileId matches the generated ID in upload page
                 // A more robust approach might use the persistent URL or a DB lookup.
                 // For simulation, we'll rely on the fileId matching.

                 // TODO: Fetch actual chatData content from storage based on a persistent ID/URL
                 // let chatContent = await fetchChatContent(link.persistentUrl); // Example
                 const chatContent = `[Content for ${link.fileName} - load from storage]`;

                 const chatMediaItem: MediaItem = {
                     id: link.fileId, // Use the chat file identifier from link
                     type: 'chat',
                     url: `chat_data_path/${link.fileId}`, // Placeholder URL/path to actual chat content
                     alt: `Chat: ${link.fileName}`,
                     source: link.source,
                     chatData: chatContent,
                 };


                 // Avoid adding duplicate chat links
                 if (!album.media.some(m => m.id === chatMediaItem.id && m.type === 'chat')) {
                    album.media.push(chatMediaItem);
                    album.mediaCount = album.media.length;
                    console.log(`Linked chat ${link.fileName} to album ${album.name}`);
                 }
             } else {
                 console.warn(`Album ID ${link.linkedAlbumId} not found for chat ${link.fileName}`);
             }
         }
     }

     const updatedAlbums = Array.from(albumsMap.values());
      // TODO: Persist updated album data (specifically the added chat MediaItems)
     console.log("Albums after linking chats:", updatedAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
     return updatedAlbums;
}


/**
 * Orchestrates the process after uploads: processes media, creates/updates albums, and links chats.
 *
 * @param uploadedMediaFiles All uploaded files represented as MediaItems (including chats).
 * @param chatLinkingInfo Information about how chats should be linked. Defaults to empty array.
 */
export async function handleNewUploads(
    uploadedMediaFiles: MediaItem[],
    chatLinkingInfo: LinkedChat[] = [] // Default to empty array if undefined
) {
    console.log("Processing new uploads:", uploadedMediaFiles.map(f => f.id));
    console.log("Chat linking info:", chatLinkingInfo);

    try {
        // --- Step 1: Process Media Files (Face/Voice Recognition) ---
        // This filters out chats internally
        const processedMedia = await processMediaFiles(uploadedMediaFiles);
        console.log("Media processing complete:", processedMedia.length, "files processed.");

        // --- Step 2: Fetch Existing Albums (from DB) ---
        // const existingAlbums = await fetchAlbumsFromDatabase(); // Placeholder
        const existingAlbums: Album[] = []; // Start with empty for this example

        // --- Step 3: Create or Update Albums based on processed media ---
        let updatedAlbums = await createOrUpdateAlbums(processedMedia, existingAlbums);
        console.log("Album creation/update based on media complete.");

        // --- Step 4: Link Chats to the updated albums ---
        // Ensure chatLinkingInfo is an array before checking length
        if (Array.isArray(chatLinkingInfo) && chatLinkingInfo.length > 0) {
            updatedAlbums = await linkChatsToAlbums(chatLinkingInfo, updatedAlbums);
            console.log("Chat linking complete.");
        } else {
             console.log("No chat linking information provided or chatLinkingInfo is empty.");
        }

        // --- Step 5: Persist all changes ---
         // await saveAlbumsToDatabase(updatedAlbums); // Placeholder
         console.log("Final albums ready for persistence:", updatedAlbums);

        // Here you might trigger UI updates or notifications

    } catch (error) {
        console.error("Error during post-upload processing:", error);
        // Handle error appropriately (e.g., notify user)
    }
}

// Example Usage (conceptual - would be triggered by upload page completion)
// const exampleUploads: MediaItem[] = [
//     { id: 'vid1', url: 'persistent/path/to/video1.mp4', type: 'video', alt: 'Video 1' },
//     { id: 'aud1', url: 'persistent/path/to/audio1.mp3', type: 'audio', alt: 'Audio 1' },
//     { id: 'img1', url: 'persistent/path/to/image1.jpg', type: 'image', alt: 'Image 1' },
//     { id: 'chat1_txt_1678886400000', url: 'persistent/path/to/whatsapp_chat.txt', type: 'chat', alt: 'whatsapp_chat.txt', source: 'whatsapp' },
// ];
// const exampleLinks: LinkedChat[] = [
//     { fileId: 'chat1_txt_1678886400000', fileName: 'whatsapp_chat.txt', source: 'whatsapp', linkedAlbumId: 'face_alex_j' }
// ];
// handleNewUploads(exampleUploads, exampleLinks);
