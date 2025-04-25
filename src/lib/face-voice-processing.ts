
'use server'; // Potentially needed if functions are called from server components/actions

import type { FaceBoundingBox } from '@/services/face-recognition'; // Keep BoundingBox if used internally
import type { VoiceProfile } from '@/services/voice-recognition';
import { detectFaces } from '@/services/face-recognition';
import { identifySpeaker } from '@/services/voice-recognition';
import { summarizeAlbumContent } from '@/ai/flows/summarize-album-content';
import type {
    MediaItem,
    Album,
    ChatFileLinkInfo,
    AnalyzedFace,
    AnalyzedVoice,
    MediaAnalysisResult,
    UploadAnalysisResults,
    UserReviewDecisions
} from '@/types'; // Import shared types

// --- Mock Database/State ---
// In a real app, this would interact with a database (e.g., Firestore, Prisma)
let mockAlbumDatabase: Map<string, Album> = new Map([
    // Add some initial mock albums if needed for testing
    // { id: 'face_alex_j', name: 'Alex Johnson', mediaCount: 4, voiceSampleAvailable: true, coverImage: '...', media: [], voiceSampleUrl: '...' },
]);

async function fetchAlbumsFromDatabase(): Promise<Album[]> {
    console.log("Fetching albums from mock DB...");
    // Simulate DB fetch delay
    await new Promise(resolve => setTimeout(resolve, 50));
    return Array.from(mockAlbumDatabase.values());
}

async function saveAlbumsToDatabase(albums: Album[]): Promise<void> {
    console.log(`Saving ${albums.length} albums to mock DB...`);
    // Simulate DB save delay
    await new Promise(resolve => setTimeout(resolve, 100));
    // Update the mock database
    const newDb = new Map<string, Album>();
    albums.forEach(album => newDb.set(album.id, album));
    mockAlbumDatabase = newDb;
    console.log("Mock DB updated.");
}

async function fetchChatContent(file: File): Promise<string> {
     console.log(`Simulating fetching content for chat file: ${file.name}`);
     // Simulate reading file content
     await new Promise(resolve => setTimeout(resolve, 50));
     try {
         return await file.text();
     } catch (error) {
         console.error(`Error reading chat file ${file.name}:`, error);
         return `[Error reading content for ${file.name}]`;
     }
}
// --- End Mock Database/State ---


/**
 * Placeholder function to simulate extracting audio from video.
 * @param videoFile The video File object.
 * @returns Promise resolving to a placeholder URL or identifier for the extracted audio.
 */
async function extractAudio(videoFile: File): Promise<string> {
    console.log(`Simulating audio extraction from ${videoFile.name}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    // Return a placeholder representing the extracted audio data path
    return `extracted_audio_path/${videoFile.name.replace(/\.[^/.]+$/, "")}.mp3`;
}

/**
 * Placeholder function to simulate cropping a face from an image.
 * @param mediaFile The image/video File object.
 * @param boundingBox The bounding box of the face.
 * @returns Promise resolving to a Data URL of the cropped face.
 */
async function cropFace(mediaFile: File, boundingBox: FaceBoundingBox): Promise<string> {
    console.log(`Simulating face crop from ${mediaFile.name}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

    // In a real app, use Canvas API or a server-side library
    // Check if running in a browser environment before using Canvas
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = boundingBox.width || 50; // Add fallback size
            canvas.height = boundingBox.height || 50; // Add fallback size
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // If the file is an image, draw it and crop
                if (mediaFile.type.startsWith('image/')) {
                    const img = await createImageBitmap(mediaFile);
                    // Calculate source rectangle (sx, sy, sWidth, sHeight) from boundingBox
                    // Assuming boundingBox coordinates are relative to the image's original size
                    const sx = boundingBox.x;
                    const sy = boundingBox.y;
                    const sWidth = boundingBox.width;
                    const sHeight = boundingBox.height;
                    // Draw the cropped portion onto the canvas
                    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                    img.close(); // Release memory
                } else {
                     // Placeholder for non-image files (e.g., video frames - needs more complex handling)
                    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`; // Random color placeholder
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'black';
                    ctx.font = '10px sans-serif';
                    ctx.fillText('Face', 5, 15);
                }
                return canvas.toDataURL('image/png');
            }
        } catch (error) {
            console.error("Error during face cropping with Canvas:", error);
            // Fallback or re-throw error
        }
    }

    // Fallback if not in browser or canvas failed
    console.warn("Canvas API not available or failed, returning placeholder Data URL for face crop.");
    return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSJsaWdodGdyYXkiLz48dGV4dCB4PSI1IiB5PSIxNSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTAiIGZpbGw9ImJsYWNrIj5GYWNlPC90ZXh0Pjwvc3ZnPg==`; // Simple SVG placeholder
}


/**
 * Processes a single uploaded media file (image, video, audio) for analysis.
 * @param mediaItem The media item containing the File object.
 * @returns Promise resolving to MediaAnalysisResult.
 */
async function analyzeSingleMediaFile(mediaItem: MediaItem): Promise<MediaAnalysisResult> {
    if (!mediaItem.file) {
        throw new Error(`MediaItem ${mediaItem.id} is missing the File object for analysis.`);
    }

    let audioPathForVoiceAnalysis: string | null = null; // Path/URL used for voice analysis
    let analyzedFaces: AnalyzedFace[] = [];
    let analyzedVoice: AnalyzedVoice | null = null;

    try {
        // --- Audio Extraction (for Videos) ---
        if (mediaItem.type === 'video') {
            audioPathForVoiceAnalysis = await extractAudio(mediaItem.file);
        } else if (mediaItem.type === 'audio') {
            audioPathForVoiceAnalysis = `audio_path/${mediaItem.file.name}`; // Use placeholder path for audio
        }

        // --- Concurrent Face and Voice Analysis ---
        const analysisPromises: [Promise<any>, Promise<any>] = [Promise.resolve([]), Promise.resolve(null)]; // Defaults

        if (mediaItem.type === 'video' || mediaItem.type === 'image') {
            analysisPromises[0] = detectFaces(mediaItem.file) // Pass File object to mock service
                .then(async (detectedFaces) => {
                    // Assign temporary IDs and crop faces
                    const facesWithTempIds = await Promise.all(
                        detectedFaces.map(async (face, index) => ({
                            ...face,
                            tempId: `${mediaItem.id}_face_${index}`, // Unique temp ID per upload batch
                            imageDataUrl: await cropFace(mediaItem.file!, face.boundingBox).catch(e => {
                                console.error("Face cropping failed:", e); return undefined;
                            }),
                            selectedAlbumId: null, // Initialize selection
                        }))
                    );
                    return facesWithTempIds;
                })
                .catch(err => {
                    console.error(`Face detection failed for ${mediaItem.file?.name}:`, err);
                    return []; // Return empty array on failure
                });
        }

        if (audioPathForVoiceAnalysis) {
            analysisPromises[1] = identifySpeaker(audioPathForVoiceAnalysis) // Pass audio path/ID
                 .then((voiceProfile) => {
                     if (voiceProfile) {
                         return {
                             tempId: `${mediaItem.id}_voice_${voiceProfile.id}`, // Unique temp ID
                             profileId: voiceProfile.id,
                             name: voiceProfile.name,
                             selectedAlbumId: null, // Initialize selection
                         } as AnalyzedVoice;
                     }
                     return null;
                 })
                .catch(err => {
                    console.error(`Voice identification failed for ${audioPathForVoiceAnalysis} (from ${mediaItem.file?.name}):`, err);
                    return null; // Return null on failure
                });
        }

        [analyzedFaces, analyzedVoice] = await Promise.all(analysisPromises);

    } catch (error) {
        console.error(`Error analyzing file ${mediaItem.file.name}:`, error);
        // Reset results on error
        analyzedFaces = [];
        analyzedVoice = null;
    }

    // Clean up temporary Object URL if it was created and no longer needed
     if (mediaItem.url.startsWith('blob:') && analyzedFaces.every(f => f.imageDataUrl)) {
          console.log(`Revoking temporary URL for ${mediaItem.alt}: ${mediaItem.url}`);
          URL.revokeObjectURL(mediaItem.url);
     }

    return {
        originalMedia: {
            ...mediaItem,
            // Replace temporary URL with a placeholder persistent path BEFORE review
            // In real app, this path comes from successful storage upload
            url: `persistent/path/to/${mediaItem.file.name}`,
            // Remove File object after analysis, unless needed downstream (unlikely)
            file: undefined, // Remove file object to prevent serialization issues if passed around
        },
        analyzedFaces: analyzedFaces,
        analyzedVoice: analyzedVoice,
    };
}

/**
 * Analyzes a batch of uploaded files (media and chats) to detect faces/voices
 * and prepare data for the user review step.
 *
 * @param uploadedFiles Array of File objects from the input.
 * @returns Promise resolving to UploadAnalysisResults containing data for the review modal.
 */
export async function analyzeUploadedFiles(uploadedFiles: File[]): Promise<UploadAnalysisResults> {
    console.log(`Starting analysis for ${uploadedFiles.length} files...`);

    const mediaItemsToAnalyze: MediaItem[] = [];
    const chatFilesToLink: ChatFileLinkInfo[] = [];

    // --- 1. Categorize files and create initial MediaItem/ChatFileLinkInfo objects ---
    uploadedFiles.forEach((file, index) => {
        const fileId = `${file.name}_${file.lastModified}`; // Simple unique ID for client-side tracking

        let mediaType: MediaItem['type'] | null = null;
        if (file.type.startsWith('image/')) mediaType = 'image';
        else if (file.type.startsWith('video/')) mediaType = 'video';
        else if (file.type.startsWith('audio/')) mediaType = 'audio';
        else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) mediaType = 'chat';

        if (mediaType && mediaType !== 'chat') {
            let tempUrl = '';
            try {
                 // Create temporary URL only if needed (e.g., for potential cropping preview)
                 // This might not be necessary if cropping happens server-side or isn't previewed
                 tempUrl = URL.createObjectURL(file);
                 console.log(`Created temporary URL for ${file.name}: ${tempUrl}`);
             } catch (e) {
                 console.error("Could not create Object URL (maybe not in browser context?):", e);
             }
            mediaItemsToAnalyze.push({
                id: `upload_${Date.now()}_${index}`, // Temporary processing ID
                type: mediaType,
                url: tempUrl, // Store temporary URL
                alt: file.name,
                source: 'upload',
                file: file, // Keep File object for analysis
            });
        } else if (mediaType === 'chat') {
            // Determine source (basic example)
            let source: ChatFileLinkInfo['source'] = 'upload';
            if (file.name.toLowerCase().includes('whatsapp')) source = 'whatsapp';
            else if (file.name.toLowerCase().includes('instagram')) source = 'instagram';
            else if (file.name.toLowerCase().includes('facebook')) source = 'facebook';

            chatFilesToLink.push({
                fileId: fileId,
                fileName: file.name,
                file: file, // Keep file object for content reading later if needed
                source: source,
                selectedAlbumId: null, // Initialize selection
            });
        } else {
            console.warn(`Skipping unsupported file type: ${file.name} (${file.type})`);
        }
    });

    // --- 2. Analyze Media Files Concurrently ---
    console.log(`Analyzing ${mediaItemsToAnalyze.length} media files...`);
    const analysisPromises = mediaItemsToAnalyze.map(analyzeSingleMediaFile);
    const mediaResults = await Promise.all(analysisPromises);
    console.log("Media analysis complete.");

    // --- 3. Fetch Existing Albums for Linking ---
    const existingAlbums = await fetchAlbumsFromDatabase();

    console.log("Analysis phase complete. Returning results for review.");
    return {
        mediaResults,
        chatFilesToLink,
        existingAlbums,
    };
}


/**
 * Creates or updates albums based on user decisions from the review step.
 *
 * @param userDecisions The mappings decided by the user in the review modal.
 * @param analysisResults The original analysis results containing media/face/voice details.
 * @param existingAlbums Current list of albums from the database.
 * @returns Promise resolving to the updated array of Album objects.
 */
async function createOrUpdateAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    existingAlbums: Album[]
): Promise<Album[]> {
    console.log("Applying user review decisions to albums...");
    const albumsMap: Map<string, Album> = new Map(existingAlbums.map(a => [a.id, { ...a, media: [...a.media] }])); // Deep copy media array
    const newUnnamedAlbums: Map<string, Album> = new Map(); // Track newly created unnamed albums in this batch
    const mediaAddedToAlbum: Map<string, Set<string | number>> = new Map(); // Track which media (by id) was added to which album (by id) in this run

    // Initialize tracking sets for existing albums
    existingAlbums.forEach(album => {
        mediaAddedToAlbum.set(album.id, new Set());
    });


    // --- 1. Process Face Mappings ---
    for (const faceMap of userDecisions.faceMappings) {
        if (faceMap.assignedAlbumId === null) continue; // User chose to ignore this face

        // Find the original media item and face details
        const resultContainingFace = analysisResults.mediaResults.find(res =>
            res.analyzedFaces.some(f => f.tempId === faceMap.tempFaceId)
        );
        if (!resultContainingFace) {
            console.warn(`Could not find original media for face ${faceMap.tempFaceId}`);
            continue;
        }
        const analyzedFace = resultContainingFace.analyzedFaces.find(f => f.tempId === faceMap.tempFaceId)!;
        const mediaItem = resultContainingFace.originalMedia; // Contains the persistent URL now

        let targetAlbum: Album | undefined;
        let isNewAlbum = false;

        if (faceMap.assignedAlbumId === 'new_unnamed') {
            // --- Create a new "Unnamed" album ---
            const newAlbumId = `album_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
            console.log(`Creating new unnamed album (ID: ${newAlbumId}) for face ${faceMap.tempFaceId}`);

            // Find associated voice *from the same media item* if any was analyzed
            const associatedVoice = resultContainingFace.analyzedVoice;
            let voiceUrl: string | null = null;
            if (associatedVoice && userDecisions.voiceMappings.some(vm => vm.tempVoiceId === associatedVoice.tempId && vm.assignedAlbumId === 'new_unnamed')) {
                // If a voice from the *same media* is also being assigned to a *new* album
                 if (mediaItem.type === 'audio') voiceUrl = mediaItem.url;
                 else if (mediaItem.type === 'video') voiceUrl = `extracted_audio_path/${mediaItem.file?.name.replace(/\.[^/.]+$/, "")}.mp3`; // Use consistent placeholder path
            }

            targetAlbum = {
                id: newAlbumId,
                name: 'Unnamed',
                coverImage: analyzedFace.imageDataUrl || // Use cropped face if available
                              (mediaItem.type === 'image' || mediaItem.type === 'video'
                                ? mediaItem.url // Fallback to media URL
                                : 'https://picsum.photos/seed/placeholder/200/200'), // Placeholder if audio
                media: [],
                mediaCount: 0,
                voiceSampleAvailable: !!voiceUrl,
                voiceSampleUrl: voiceUrl,
                summary: '' // Generate summary later
            };
            albumsMap.set(newAlbumId, targetAlbum);
            newUnnamedAlbums.set(newAlbumId, targetAlbum); // Track it
            mediaAddedToAlbum.set(newAlbumId, new Set()); // Initialize tracking for new album
            isNewAlbum = true;

        } else {
            // --- Assign to Existing Album ---
            targetAlbum = albumsMap.get(faceMap.assignedAlbumId);
            if (!targetAlbum) {
                console.warn(`Target album ${faceMap.assignedAlbumId} not found for face ${faceMap.tempFaceId}`);
                continue;
            }
            console.log(`Assigning face ${faceMap.tempFaceId} (from ${mediaItem.alt}) to album ${targetAlbum.name} (${targetAlbum.id})`);
        }

        // --- Add Media to Target Album ---
        // Check if this specific media item was *already* in the album *before* this run
        const alreadyExisted = existingAlbums.find(a => a.id === targetAlbum!.id)?.media.some(m => m.id === mediaItem.id);
        // Check if it was added *during* this run to this album
        const addedThisRun = mediaAddedToAlbum.get(targetAlbum!.id)?.has(mediaItem.id);

        if (!alreadyExisted && !addedThisRun) {
            targetAlbum.media.push(mediaItem);
            targetAlbum.mediaCount = targetAlbum.media.length;
            mediaAddedToAlbum.get(targetAlbum!.id)?.add(mediaItem.id); // Mark as added this run

            // --- Update Cover Image Logic (Prefer face crop, then image/video) ---
             if (analyzedFace.imageDataUrl && (!targetAlbum.coverImage || targetAlbum.coverImage.includes('placeholder') || targetAlbum.coverImage.includes('picsum'))) {
                 targetAlbum.coverImage = analyzedFace.imageDataUrl;
             } else if ((mediaItem.type === 'image' || mediaItem.type === 'video') && (!targetAlbum.coverImage || targetAlbum.coverImage.includes('placeholder') || targetAlbum.coverImage.includes('picsum'))) {
                 targetAlbum.coverImage = mediaItem.url; // Use the media URL as cover
            }

            // --- Update Voice Sample Logic (if applicable and not already set) ---
            const associatedVoice = resultContainingFace.analyzedVoice;
            const voiceMapping = userDecisions.voiceMappings.find(vm => vm.tempVoiceId === associatedVoice?.tempId);
            if (!targetAlbum.voiceSampleUrl && associatedVoice && voiceMapping?.assignedAlbumId === targetAlbum.id) {
                 if (mediaItem.type === 'audio') targetAlbum.voiceSampleUrl = mediaItem.url;
                 else if (mediaItem.type === 'video') targetAlbum.voiceSampleUrl = `extracted_audio_path/${mediaItem.file?.name.replace(/\.[^/.]+$/, "")}.mp3`;
                 targetAlbum.voiceSampleAvailable = true;
                 console.log(`Set voice sample for album ${targetAlbum.id} from ${mediaItem.alt}`);
            }
        }
    }

    // --- 2. Process Direct Voice Mappings (if needed, e.g., voice-only media assigned) ---
    for (const voiceMap of userDecisions.voiceMappings) {
        if (voiceMap.assignedAlbumId === null) continue; // Ignored

        const resultContainingVoice = analysisResults.mediaResults.find(res => res.analyzedVoice?.tempId === voiceMap.tempVoiceId);
         if (!resultContainingVoice) continue;
         const mediaItem = resultContainingVoice.originalMedia;

         // Was a face from the *same* media item mapped?
         const faceMapped = userDecisions.faceMappings.some(fm =>
             resultContainingVoice.analyzedFaces.some(f => f.tempId === fm.tempFaceId) && fm.assignedAlbumId !== null
         );

        if (faceMapped) continue; // Handled by face mapping logic above

         // Handle direct voice assignment (e.g., audio file, or video where face was ignored)
         let targetAlbum: Album | undefined;
         let isNewAlbum = false;

         if (voiceMap.assignedAlbumId === 'new_unnamed') {
             // Need to create a *new* unnamed album specifically for this voice
             const newAlbumId = `album_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
             console.log(`Creating new unnamed album (ID: ${newAlbumId}) for voice ${voiceMap.tempVoiceId}`);

             let voiceUrl : string | null = null;
             if (mediaItem.type === 'audio') voiceUrl = mediaItem.url;
             else if (mediaItem.type === 'video') voiceUrl = `extracted_audio_path/${mediaItem.file?.name.replace(/\.[^/.]+$/, "")}.mp3`;

             targetAlbum = {
                id: newAlbumId,
                name: 'Unnamed (Voice)', // Indicate it might be voice-only initially
                coverImage: 'https://picsum.photos/seed/voice_placeholder/200/200', // Placeholder cover
                media: [],
                mediaCount: 0,
                voiceSampleAvailable: !!voiceUrl,
                voiceSampleUrl: voiceUrl,
                summary: ''
             };
             albumsMap.set(newAlbumId, targetAlbum);
             newUnnamedAlbums.set(newAlbumId, targetAlbum);
             mediaAddedToAlbum.set(newAlbumId, new Set()); // Initialize tracking
             isNewAlbum = true;
         } else {
            targetAlbum = albumsMap.get(voiceMap.assignedAlbumId);
             if (!targetAlbum) {
                console.warn(`Target album ${voiceMap.assignedAlbumId} not found for voice ${voiceMap.tempVoiceId}`);
                continue;
            }
             console.log(`Assigning voice ${voiceMap.tempVoiceId} (from ${mediaItem.alt}) directly to album ${targetAlbum.name} (${targetAlbum.id})`);
         }

         // Add media and potentially set voice sample if not already set
        const alreadyExisted = existingAlbums.find(a => a.id === targetAlbum!.id)?.media.some(m => m.id === mediaItem.id);
        const addedThisRun = mediaAddedToAlbum.get(targetAlbum!.id)?.has(mediaItem.id);

        if (!alreadyExisted && !addedThisRun) {
            targetAlbum.media.push(mediaItem);
            targetAlbum.mediaCount = targetAlbum.media.length;
            mediaAddedToAlbum.get(targetAlbum!.id)?.add(mediaItem.id); // Mark as added

             if (!targetAlbum.voiceSampleUrl) {
                 let voiceUrl : string | null = null;
                 if (mediaItem.type === 'audio') voiceUrl = mediaItem.url;
                 else if (mediaItem.type === 'video') voiceUrl = `extracted_audio_path/${mediaItem.file?.name.replace(/\.[^/.]+$/, "")}.mp3`;
                 targetAlbum.voiceSampleUrl = voiceUrl;
                 targetAlbum.voiceSampleAvailable = !!voiceUrl;
             }
        }
    }


     // --- 3. Generate Summaries for New/Updated Albums ---
     for (const album of albumsMap.values()) {
         // Check if any media was added *this run* OR if it's a brand new album
         const wasMediaAdded = mediaAddedToAlbum.get(album.id)?.size > 0;
         const isNewOrUpdated = newUnnamedAlbums.has(album.id) || wasMediaAdded;

         if (isNewOrUpdated && album.media.length > 0) { // Generate/Regenerate if new/updated & has media
             console.log(`Attempting to generate summary for ${isNewOrUpdated ? 'new/updated' : ''} album ${album.id} (${album.name})`);
             try {
                  // Simple description based on current state
                 const description = `Album for ${album.name === 'Unnamed' ? 'an unnamed person' : album.name}, containing ${album.mediaCount} items. Types include: ${[...new Set(album.media.map(m => m.type))].join(', ')}.`;
                 const summaryResult = await summarizeAlbumContent({ albumDescription: description });
                 album.summary = summaryResult.summary;
                 console.log(`Generated summary for album ${album.id}: "${album.summary.substring(0,50)}..."`);
             } catch (error) {
                 console.error(`Failed to generate summary for album ${album.id}:`, error);
                 album.summary = `[Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}]`; // Add error placeholder
             }
         }
     }


    const finalAlbums = Array.from(albumsMap.values());
    console.log("Albums after applying review:", finalAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount, summary: a.summary?.substring(0, 30) })));
    return finalAlbums;
}

/**
 * Links chat files to albums based on user decisions from the review step.
 * Assumes albums have potentially been created/updated in the previous step.
 *
 * @param userDecisions User's choices from the review modal.
 * @param analysisResults The original analysis results containing ChatFileLinkInfo.
 * @param currentAlbums The state of albums *after* face/voice processing but *before* chat linking.
 * @returns The updated list of albums with chats linked.
 */
export async function linkChatsToAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    currentAlbums: Album[]
): Promise<Album[]> {
     console.log("Linking chats based on review decisions:", userDecisions.chatLinks);
     const albumsMap = new Map(currentAlbums.map(a => [a.id, a])); // Use current state

     for (const chatDecision of userDecisions.chatLinks) {
         if (!chatDecision.linkedAlbumId) continue; // User chose "Don't Link"

         const chatInfo = analysisResults.chatFilesToLink.find(cf => cf.fileId === chatDecision.fileId);
         if (!chatInfo) {
             console.warn(`Chat info not found for fileId ${chatDecision.fileId}`);
             continue;
         }

         const targetAlbum = albumsMap.get(chatDecision.linkedAlbumId);
         if (!targetAlbum) {
             console.warn(`Target album ${chatDecision.linkedAlbumId} not found for chat ${chatInfo.fileName}`);
             // This shouldn't happen if 'new_unnamed' albums were created correctly in the previous step
             continue;
         }

         // --- Create MediaItem for the chat ---
         // Fetch actual chat content asynchronously ONLY NOW when we know it's needed
         const chatContent = await fetchChatContent(chatInfo.file);

         const chatMediaItem: MediaItem = {
             // Use a persistent ID scheme, maybe based on hash or DB id after upload
             id: `chat_${chatInfo.fileId}_${Date.now()}`, // Example persistent ID
             type: 'chat',
             // In a real app, this URL points to the stored chat content in the backend/cloud
             url: `persistent/chat_path/${chatInfo.fileId}.txt`, // Placeholder persistent path
             alt: `Chat: ${chatInfo.fileName}`,
             source: chatInfo.source,
             chatData: chatContent, // Include the fetched content
             file: undefined // Remove file object
         };


         // --- Add Chat MediaItem to Album ---
         if (!targetAlbum.media.some(m => m.type === 'chat' && m.url === chatMediaItem.url)) { // Prevent duplicate links
            targetAlbum.media.push(chatMediaItem);
            targetAlbum.mediaCount = targetAlbum.media.length;
            console.log(`Linked chat ${chatInfo.fileName} to album ${targetAlbum.name}`);
         }
     }

     const updatedAlbums = Array.from(albumsMap.values());
     console.log("Albums after linking chats:", updatedAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
     return updatedAlbums;
}


/**
 * Orchestrates the final processing after user review:
 * Updates/creates albums, links chats, and persists changes.
 *
 * @param userDecisions The decisions made by the user in the review modal.
 * @param analysisResults The results from the initial analysis phase.
 */
export async function finalizeUploadProcessing(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
) {
    console.log("Finalizing upload processing with user decisions...");
    console.log("User Decisions:", userDecisions);

    try {
        // --- Step 1: Fetch current state of albums ---
        // Important to get the latest state before applying changes,
        // especially if multiple uploads could happen concurrently.
        const existingAlbums = await fetchAlbumsFromDatabase();

        // --- Step 2: Create/Update Albums based on face/voice mappings ---
        let updatedAlbums = await createOrUpdateAlbumsFromReview(
            userDecisions,
            analysisResults,
            existingAlbums
        );
        console.log("Album creation/update based on review complete.");

        // --- Step 3: Link Chats based on review decisions ---
        // Pass the albums *after* potential new unnamed ones were created
        updatedAlbums = await linkChatsToAlbumsFromReview(
            userDecisions,
            analysisResults,
            updatedAlbums // Use the state after face/voice mapping
        );
        console.log("Chat linking complete.");

        // --- Step 4: Persist all changes to the database ---
        await saveAlbumsToDatabase(updatedAlbums);
        console.log("Final albums persisted.");

        // --- Step 5: Update application state / Trigger UI refresh ---
        // This might involve notifying the client, invalidating caches, etc.
        // Example: using TanStack Query's queryClient.invalidateQueries(['albums'])
        console.log("Processing finished. UI should refresh.");

        return { success: true, updatedAlbums }; // Indicate success

    } catch (error) {
        console.error("Error during final upload processing:", error);
        // Handle error appropriately (e.g., notify user, potentially rollback?)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
}

// Example Usage Flow (conceptual):
// 1. User uploads files -> `handleFileChange` on upload page.
// 2. User clicks "Upload" -> `handleUpload` on upload page calls `analyzeUploadedFiles`.
// 3. `analyzeUploadedFiles` returns `analysisResults`.
// 4. `analysisResults` are passed to the `UploadReviewModal`.
// 5. User makes selections in the modal -> `handleConfirmReview` (in modal) gathers `userDecisions`.
// 6. `handleConfirmReview` calls `finalizeUploadProcessing(userDecisions, analysisResults)`.
// 7. `finalizeUploadProcessing` updates the database and returns success/failure.
// 8. UI updates based on the result (e.g., shows success toast, navigates to albums page).


    