

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
// IMPORTANT: This in-memory database will reset on server restarts.
// It's suitable for demonstration purposes only.
let mockAlbumDatabase: Map<string, Album> = new Map([
    // Pre-populate with some example albums for initial testing
      { id: 'face_alex_j', name: 'Alex Johnson', coverImage: 'https://picsum.photos/seed/face_alex_j/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person1.mp3', media: [ { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1', file: undefined }, { id: 102, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Alex video 2', source: 'upload', file: undefined }, { id: 103, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Alex audio 3', source: 'upload', file: undefined }, { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4', file: undefined } ] },
      { id: 'face_maria_g', name: 'Maria Garcia', coverImage: 'https://picsum.photos/seed/face_maria_g/200/200', mediaCount: 2, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1', file: undefined }, { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2', file: undefined } ] },
      { id: 'face_chen_w', name: 'Chen Wei', coverImage: 'https://picsum.photos/seed/face_chen_w/200/200', mediaCount: 3, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person3.mp3', media: [ { id: 301, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Chen video 1', source: 'upload', file: undefined }, { id: 302, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Chen audio 2', source: 'upload', file: undefined }, { id: 303, type: 'chat', url: 'persistent/chat_path/chat_chen_w_1_example.txt', alt: 'Chat with Chen', source: 'whatsapp', chatData: `Chen: Let's meet tomorrow.\nYou: Sounds good, what time?\nChen: How about 2 PM?\n...(more)`, file: undefined } ] },
      { id: 'face_samira_k', name: 'Samira Khan', coverImage: 'https://picsum.photos/seed/face_samira_k/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person5.mp3', media: [ { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1', file: undefined }, { id: 502, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', alt: 'Samira video 2', source: 'upload', file: undefined }, { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3', file: undefined }, { id: 504, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Samira audio 4', source: 'upload', file: undefined } ] },
]);

// --- Mock API for getting/setting album data ---
// Replace these with actual database interactions in a real app
export async function fetchAlbumsFromDatabase(): Promise<Album[]> {
    console.log("[DB Mock] Fetching albums...");
    // Simulate DB fetch delay
    await new Promise(resolve => setTimeout(resolve, 50));
    // Return a deep copy to prevent direct modification of the map's values
    // Ensure MediaItems within albums don't contain File objects
    const albums = Array.from(mockAlbumDatabase.values()).map(album => ({
        ...album,
        // Ensure media array is cloned and File objects are explicitly undefined
        media: album.media.map(media => ({ ...media, file: undefined }))
    }));
    console.log(`[DB Mock] Returning ${albums.length} albums.`);
    return albums;
}

export async function saveAlbumsToDatabase(albums: Album[]): Promise<void> {
    console.log(`[DB Mock] Saving ${albums.length} albums...`);
    // Simulate DB save delay
    await new Promise(resolve => setTimeout(resolve, 100));
    // Update the mock database
    const newDb = new Map<string, Album>();
    albums.forEach(album => {
        // Ensure media arrays are copied and File objects are explicitly undefined before saving
        newDb.set(album.id, {
            ...album,
            media: album.media.map(media => ({ ...media, file: undefined }))
        });
    });
    mockAlbumDatabase = newDb;
    console.log("[DB Mock] Database updated.");
}

// --- Mock Chat Content Fetching ---
export async function fetchChatContent(file: File): Promise<string> {
     console.log(`[Mock] Reading content for chat file: ${file.name}`);
     // Simulate reading file content
     await new Promise(resolve => setTimeout(resolve, 50));
     try {
         return await file.text();
     } catch (error) {
         console.error(`[Mock] Error reading chat file ${file.name}:`, error);
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
    console.log(`[Mock] Simulating audio extraction from ${videoFile.name}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
    // Return a placeholder representing the extracted audio data path
    // In a real app, this would be a path to the actual extracted file in storage
    const safeFileName = videoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
    return `persistent/extracted_audio/${safeFileName.replace(/\.[^/.]+$/, "")}.mp3`;
}

/**
 * Placeholder function to simulate cropping a face from an image or video frame.
 * @param mediaFile The image/video File object.
 * @param boundingBox The bounding box of the face.
 * @returns Promise resolving to a Data URL of the cropped face.
 */
async function cropFace(mediaFile: File, boundingBox: FaceBoundingBox): Promise<string> {
    console.log(`[Mock] Simulating face crop from ${mediaFile.name}`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

    // In a real app, use Canvas API (client-side) or a server-side library (like Sharp)
    // Check if running in a browser environment before using Canvas
    if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        try {
            const canvas = document.createElement('canvas');
            // Use a reasonable fixed size for the crop preview for simplicity
            const targetSize = 80;
            canvas.width = targetSize;
            canvas.height = targetSize;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // If the file is an image, draw it and crop
                if (mediaFile.type.startsWith('image/')) {
                    const img = await createImageBitmap(mediaFile);
                    // Calculate source rectangle (sx, sy, sWidth, sHeight) from boundingBox
                    const sx = boundingBox.x;
                    const sy = boundingBox.y;
                    const sWidth = boundingBox.width;
                    const sHeight = boundingBox.height;
                    // Draw the cropped portion onto the canvas, maintaining aspect ratio
                    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
                    img.close(); // Release memory
                } else {
                     // Placeholder for non-image files (e.g., video frames - needs more complex handling)
                    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 80%)`; // Random color placeholder
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    ctx.fillStyle = 'black';
                    ctx.font = '10px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText('Face', canvas.width / 2, canvas.height / 2);
                }
                return canvas.toDataURL('image/png');
            }
        } catch (error) {
            console.error("[Mock] Error during face cropping with Canvas:", error);
            // Fallback or re-throw error
        }
    }

    // Fallback if not in browser or canvas failed
    console.warn("[Mock] Canvas API not available or failed, returning placeholder Data URL for face crop.");
    return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2Ij5GYWNlPC90ZXh0Pjwvc3ZnPg==`; // Simple SVG placeholder
}


/**
 * Processes a single uploaded media file (image, video, audio) for analysis.
 * @param mediaItem The media item containing the File object.
 * @returns Promise resolving to MediaAnalysisResult.
 */
async function analyzeSingleMediaFile(mediaItem: MediaItem): Promise<MediaAnalysisResult> {
    if (!mediaItem.file) {
        // This should ideally not happen if called correctly from analyzeUploadedFiles
        console.error(`MediaItem ${mediaItem.id} is missing the File object for analysis.`);
        return { // Return a default error state or minimal result
            originalMedia: { ...mediaItem, file: undefined },
            analyzedFaces: [],
            analyzedVoice: null,
        };
    }

    const file = mediaItem.file; // Keep reference to the File object
    console.log(`Analyzing file: ${file.name} (Type: ${mediaItem.type})`);
    let audioPathForVoiceAnalysis: string | null = null; // Path/URL used for voice analysis
    let analyzedFaces: AnalyzedFace[] = [];
    let analyzedVoice: AnalyzedVoice | null = null;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_'); // Sanitize filename
    let temporaryUrlCreated = false; // Flag to track if URL.createObjectURL was used

    try {
        // --- Audio Extraction (for Videos) ---
        if (mediaItem.type === 'video') {
            audioPathForVoiceAnalysis = await extractAudio(file);
        } else if (mediaItem.type === 'audio') {
            // For direct audio uploads, use a placeholder representing its eventual stored path
            audioPathForVoiceAnalysis = `persistent/audio/${safeFileName}`;
        }

        // --- Concurrent Face and Voice Analysis ---
        const analysisPromises: [Promise<AnalyzedFace[]>, Promise<AnalyzedVoice | null>] =
            [Promise.resolve([]), Promise.resolve(null)]; // Defaults

        // Face Detection for Images and Videos
        if (mediaItem.type === 'video' || mediaItem.type === 'image') {
            analysisPromises[0] = detectFaces(file)
                .then(async (detectedFaces) => {
                    const facesWithDetails = await Promise.all(
                        detectedFaces.map(async (face, index) => {
                            const tempId = `${mediaItem.id}_face_${index}`; // Unique temp ID per upload batch
                            const imageDataUrl = await cropFace(file, face.boundingBox).catch(e => {
                                console.error(`Failed to crop face ${tempId}:`, e); return undefined;
                            });
                            return {
                                ...face, // Includes boundingBox, confidence
                                tempId: tempId,
                                imageDataUrl: imageDataUrl,
                                selectedAlbumId: null, // Initialize selection
                            };
                        })
                    );
                    console.log(` -> Found ${facesWithDetails.length} faces in ${file.name}`);
                    return facesWithDetails;
                })
                .catch(err => {
                    console.error(`Face detection failed for ${file.name}:`, err);
                    return []; // Return empty array on failure
                });
        }

        // Voice Identification if audio is available
        if (audioPathForVoiceAnalysis) {
            analysisPromises[1] = identifySpeaker(audioPathForVoiceAnalysis)
                 .then((voiceProfile) => {
                     if (voiceProfile) {
                         console.log(` -> Identified voice ${voiceProfile.name} in ${file.name}`);
                         return {
                             tempId: `${mediaItem.id}_voice_${voiceProfile.id}`, // Unique temp ID
                             profileId: voiceProfile.id,
                             name: voiceProfile.name,
                             selectedAlbumId: null, // Initialize selection
                         } as AnalyzedVoice;
                     }
                      console.log(` -> No distinct voice identified in ${file.name}`);
                     return null;
                 })
                .catch(err => {
                    console.error(`Voice identification failed for ${audioPathForVoiceAnalysis} (from ${file.name}):`, err);
                    return null; // Return null on failure
                });
        }

        [analyzedFaces, analyzedVoice] = await Promise.all(analysisPromises);

        // Set flag if a temporary URL was created
        if (mediaItem.url.startsWith('blob:')) {
            temporaryUrlCreated = true;
        }

    } catch (error) {
        console.error(`Error analyzing file ${file.name}:`, error);
        // Reset results on error
        analyzedFaces = [];
        analyzedVoice = null;
    } finally {
         // Clean up temporary Object URL if it was created
         // Check if running in browser context before attempting to revoke
        if (temporaryUrlCreated && typeof window !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
            console.log(`Revoking temporary URL for ${mediaItem.alt}: ${mediaItem.url}`);
            try {
                 URL.revokeObjectURL(mediaItem.url);
            } catch (revokeError) {
                 console.warn(`Failed to revoke Object URL ${mediaItem.url}:`, revokeError);
            }
        }
    }


    // IMPORTANT: Simulate storing the file and getting a persistent URL
    // In a real app, this involves uploading the file to cloud storage (S3, Firebase Storage, etc.)
    // and getting back the permanent URL. Here, we just create a placeholder path.
    const persistentUrl = `persistent/${mediaItem.type}/${safeFileName}`;
    console.log(` -> Simulating storage: ${file.name} stored at ${persistentUrl}`);


    return {
        originalMedia: {
            ...mediaItem,
            url: persistentUrl, // Replace temporary URL with the persistent path
            file: undefined, // Explicitly remove file object to ensure serialization
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
 *          All data returned MUST be serializable.
 */
export async function analyzeUploadedFiles(uploadedFiles: File[]): Promise<UploadAnalysisResults> {
    // --- Top-level try-catch for the server action ---
    try {
        console.log(`[Analysis] Starting analysis for ${uploadedFiles.length} files...`);

        const mediaItemsToAnalyze: MediaItem[] = [];
        const chatFileInfos: {file: File, fileId: string, source: ChatFileLinkInfo['source']}[] = []; // Temp storage for chat file info

        // --- 1. Categorize files and create initial MediaItem/ChatFileLinkInfo objects ---
        uploadedFiles.forEach((file, index) => {
            const fileId = `upload_${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; // Sanitize ID

            let mediaType: MediaItem['type'] | null = null;
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('video/')) mediaType = 'video';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';
            else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) mediaType = 'chat';

            if (mediaType && mediaType !== 'chat') {
                let tempUrl = '';
                 if (typeof window !== 'undefined' && typeof URL.createObjectURL === 'function') {
                    try {
                        tempUrl = URL.createObjectURL(file);
                        console.log(`[Analysis] Created temporary URL for ${file.name}: ${tempUrl.substring(0, 50)}...`);
                    } catch (e) {
                        console.error("[Analysis] Could not create Object URL:", e);
                         tempUrl = `error://creation-failed/${file.name}`;
                    }
                 } else {
                      console.warn("[Analysis] Cannot create Object URL in this environment. Using placeholder.");
                      tempUrl = `placeholder://env/${file.name}`;
                 }

                mediaItemsToAnalyze.push({
                    id: fileId,
                    type: mediaType,
                    url: tempUrl,
                    alt: file.name,
                    source: 'upload',
                    file: file, // Keep File object for analysis ONLY
                });
            } else if (mediaType === 'chat') {
                let source: ChatFileLinkInfo['source'] = 'upload';
                if (file.name.toLowerCase().includes('whatsapp')) source = 'whatsapp';
                else if (file.name.toLowerCase().includes('instagram')) source = 'instagram';
                else if (file.name.toLowerCase().includes('facebook')) source = 'facebook';

                chatFileInfos.push({ file, fileId, source }); // Store info temporarily
                console.log(`[Analysis] Identified chat file: ${file.name}`);
            } else {
                console.warn(`[Analysis] Skipping unsupported file type: ${file.name} (${file.type})`);
            }
        });

        // --- 2. Analyze Media Files Concurrently ---
        console.log(`[Analysis] Analyzing ${mediaItemsToAnalyze.length} media files...`);
        const analysisPromises = mediaItemsToAnalyze.map(analyzeSingleMediaFile);
        const mediaResults = await Promise.all(analysisPromises);
        console.log("[Analysis] Media analysis complete.");

        // --- 3. Read Chat File Content Concurrently ---
        console.log(`[Analysis] Reading content for ${chatFileInfos.length} chat files...`);
        const chatFilesToLink: ChatFileLinkInfo[] = await Promise.all(
            chatFileInfos.map(async ({ file, fileId, source }) => {
                const content = await fetchChatContent(file);
                 // Ensure content is serializable (it's already a string)
                return {
                    fileId: fileId,
                    fileName: file.name,
                    source: source,
                    chatContent: content, // Store the content read
                    selectedAlbumId: null, // Initialize selection
                };
            })
        );
        console.log("[Analysis] Chat content reading complete.");


        // --- 4. Fetch Existing Albums for Linking ---
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        // Ensure albums passed to the client are serializable
        const existingAlbums = existingAlbumsRaw.map(album => ({
            ...album,
            media: album.media.map(m => ({ ...m, file: undefined })) // Ensure no File objects here
        }));

        console.log(`[Analysis] Fetched ${existingAlbums.length} existing albums for review.`);

        const results: UploadAnalysisResults = {
             mediaResults, // Already processed to be serializable
             chatFilesToLink, // Already processed to be serializable
             existingAlbums, // Processed to be serializable
        };

         // --- 5. Final Serialization Check ---
         try {
            JSON.stringify(results);
            console.log("[Analysis] Analysis results successfully serialized.");
         } catch (e) {
             console.error("[Analysis] CRITICAL ERROR: Analysis results are not serializable!", e);
             // This should not happen if previous steps are correct, but good safeguard
             throw new Error(`Failed to serialize analysis results: ${e instanceof Error ? e.message : String(e)}`);
         }

        console.log("[Analysis] Analysis phase complete. Returning SERIALIZABLE results for review modal.");
        return results;

    } catch (error) {
        // --- Catch any error during the analysis process ---
        console.error("[Analysis Action Error] An error occurred during analyzeUploadedFiles:", error);
        // Re-throw the error so Next.js Server Action handler can catch it
        // It will likely result in the generic "unexpected response" on the client,
        // but the actual error will be logged on the server.
        throw error;
    }
}


/**
 * Creates or updates albums based on user decisions from the review step.
 * This function focuses on assigning faces and voices to albums and creating new ones.
 *
 * @param userDecisions The mappings decided by the user in the review modal.
 * @param analysisResults The original analysis results containing media/face/voice details.
 * @param existingAlbums Current list of albums from the database (ensure they are serializable).
 * @returns Promise resolving to the updated array of Album objects (without chats linked yet, ensure serializable).
 */
async function createOrUpdateAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    existingAlbums: Album[]
): Promise<{ updatedAlbums: Album[], mediaAddedToAlbum: Map<string, Set<string | number>>, newUnnamedAlbums: Map<string, Album>}> {
    console.log("[Processing] Applying face/voice review decisions to albums...");
    // Work with a mutable map, starting with serializable albums
    const albumsMap: Map<string, Album> = new Map(
        existingAlbums.map(a => [a.id, JSON.parse(JSON.stringify(a))]) // Deep copy to ensure serializability and mutability
    );
    const newUnnamedAlbums: Map<string, Album> = new Map();
    const mediaAddedToAlbum: Map<string, Set<string | number>> = new Map();
    existingAlbums.forEach(album => mediaAddedToAlbum.set(album.id, new Set()));
    const processedMediaIds = new Set<string | number>(); // Track media already added to avoid duplicates across different faces/voices in the same file

    // Helper to safely add media to an album
    const addMediaToAlbum = (album: Album, media: MediaItem) => {
        const serializableMedia = { ...media, file: undefined }; // Ensure no File object
        if (!album.media.some(m => m.id === serializableMedia.id)) {
            album.media.push(serializableMedia);
            album.mediaCount = album.media.length;
            mediaAddedToAlbum.get(album.id)?.add(serializableMedia.id);
             console.log(`   - Added media ${serializableMedia.id} (${serializableMedia.alt}) to album ${album.id}`);
            processedMediaIds.add(serializableMedia.id);
            return true;
        }
         console.log(`   - Media ${serializableMedia.id} (${serializableMedia.alt}) already in album ${album.id}.`);
        return false;
    };

     // Helper to update cover image if needed
    const updateCoverImage = (album: Album, face: AnalyzedFace | null, media: MediaItem) => {
        const currentCoverIsPlaceholder = !album.coverImage || album.coverImage.includes('placeholder') || album.coverImage.includes('picsum');
        if (face?.imageDataUrl && currentCoverIsPlaceholder) {
            album.coverImage = face.imageDataUrl;
             console.log(`   - Updated cover image for album ${album.id} with face crop.`);
        } else if ((media.type === 'image' || media.type === 'video') && currentCoverIsPlaceholder) {
            album.coverImage = media.url; // Use the persistent media URL
             console.log(`   - Updated cover image for album ${album.id} with media URL.`);
        }
    };

     // Helper to update voice sample if needed
    const updateVoiceSample = (album: Album, voice: AnalyzedVoice | null, media: MediaItem) => {
        if (!album.voiceSampleUrl && voice) {
            let voiceUrl: string | null = null;
            if (media.type === 'audio') voiceUrl = media.url; // Use persistent audio URL
            else if (mediaItemToAdd.type === 'video') { // Typo fixed: should be media.type
                 const safeFileName = media.alt.replace(/[^a-zA-Z0-9._-]/g, '_');
                 // Construct the persistent path for extracted audio
                 voiceUrl = `persistent/extracted_audio/${safeFileName.replace(/\.[^/.]+$/, "")}.mp3`;
            }

            if (voiceUrl) {
                album.voiceSampleUrl = voiceUrl;
                album.voiceSampleAvailable = true;
                console.log(`   - Set voice sample for album ${album.id} from ${media.alt}`);
            }
        }
    };

    // Find media result by tempFaceId or tempVoiceId
    const findMediaResultByTempId = (tempId: string): MediaAnalysisResult | undefined => {
        return analysisResults.mediaResults.find(res =>
            res.analyzedFaces.some(f => f.tempId === tempId) || res.analyzedVoice?.tempId === tempId
        );
    };

    // --- 1. Process Face Mappings ---
    for (const faceMap of userDecisions.faceMappings) {
        if (faceMap.assignedAlbumId === null) {
            console.log(` -> Ignoring face ${faceMap.tempFaceId} as per user decision.`);
            continue;
        }

        const resultContainingFace = findMediaResultByTempId(faceMap.tempFaceId);
        if (!resultContainingFace) {
            console.warn(`[Processing] Could not find original media for face ${faceMap.tempFaceId}. Skipping.`);
            continue;
        }
        const analyzedFace = resultContainingFace.analyzedFaces.find(f => f.tempId === faceMap.tempFaceId)!;
        const mediaItemToAdd = resultContainingFace.originalMedia; // Already serializable with persistent URL

         if (processedMediaIds.has(mediaItemToAdd.id)) {
             console.log(` -> Media ${mediaItemToAdd.id} already processed for another face/voice. Skipping duplicate addition for face ${faceMap.tempFaceId}.`);
             continue;
         }


        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (faceMap.assignedAlbumId === 'new_unnamed') {
            targetAlbumId = `album_unnamed_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
            console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) for face ${faceMap.tempFaceId} from ${mediaItemToAdd.alt}`);

            // Check if the voice from the *same* media is also assigned to 'new_unnamed'
             const associatedVoice = resultContainingFace.analyzedVoice;
             const voiceAlsoMappedToNew = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === 'new_unnamed'
             );

            targetAlbum = {
                id: targetAlbumId,
                name: 'Unnamed',
                 // Use face crop first, then media URL, then fallback
                coverImage: analyzedFace.imageDataUrl ||
                              (mediaItemToAdd.type === 'image' || mediaItemToAdd.type === 'video' ? mediaItemToAdd.url : '') ||
                              'https://picsum.photos/seed/placeholder/200/200',
                media: [], // Start empty
                mediaCount: 0,
                voiceSampleAvailable: false, // Initial state
                voiceSampleUrl: null, // Initial state
                summary: ''
            };
            albumsMap.set(targetAlbumId, targetAlbum);
            newUnnamedAlbums.set(targetAlbumId, targetAlbum);
            mediaAddedToAlbum.set(targetAlbumId, new Set());
            // Update voice sample later if voice is mapped
            if(voiceAlsoMappedToNew && associatedVoice) updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);

        } else {
            targetAlbumId = faceMap.assignedAlbumId;
            targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
                console.warn(`[Processing] Target album ${targetAlbumId} not found for face ${faceMap.tempFaceId}. Skipping.`);
                continue;
            }
            console.log(` -> Assigning face ${faceMap.tempFaceId} (from ${mediaItemToAdd.alt}) to album '${targetAlbum.name}' (${targetAlbumId})`);
        }

        // Add media, update cover, update voice
        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) {
            updateCoverImage(targetAlbum, analyzedFace, mediaItemToAdd);
            // Update voice only if the voice from the same media is mapped to *this* album
            const associatedVoice = resultContainingFace.analyzedVoice;
             const voiceMappedToThisAlbum = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === targetAlbumId
             );
            if(voiceMappedToThisAlbum && associatedVoice) updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);
        }
    }

     // --- 2. Process Direct Voice Mappings (ONLY IF face wasn't mapped) ---
     for (const voiceMap of userDecisions.voiceMappings) {
        if (voiceMap.assignedAlbumId === null) {
            console.log(` -> Ignoring voice ${voiceMap.tempVoiceId} as per user decision.`);
            continue;
        }

        const resultContainingVoice = findMediaResultByTempId(voiceMap.tempVoiceId);
        if (!resultContainingVoice) {
            console.warn(`[Processing] Could not find original media for voice ${voiceMap.tempVoiceId}. Skipping.`);
            continue;
        }
        const mediaItemToAdd = resultContainingVoice.originalMedia;
        const analyzedVoice = resultContainingVoice.analyzedVoice!;

         if (processedMediaIds.has(mediaItemToAdd.id)) {
             console.log(` -> Media ${mediaItemToAdd.id} already processed for a face mapping. Skipping direct voice mapping for ${voiceMap.tempVoiceId}.`);
             continue;
         }


        // Check if any face from the *same media* was mapped somewhere else
        const faceWasMapped = userDecisions.faceMappings.some(fm =>
            fm.assignedAlbumId !== null && // Check if the face was mapped (not ignored)
            resultContainingVoice.analyzedFaces.some(f => f.tempId === fm.tempFaceId)
        );

        if (faceWasMapped) {
            console.log(` -> Skipping direct voice mapping for ${voiceMap.tempVoiceId} as a face from the same media (${mediaItemToAdd.alt}) was already mapped.`);
            continue;
        }

        // Proceed with voice mapping only if no face from the same media was mapped
        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (voiceMap.assignedAlbumId === 'new_unnamed') {
             targetAlbumId = `album_unnamed_voice_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
             console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) for voice ${voiceMap.tempVoiceId} from ${mediaItemToAdd.alt}`);

             targetAlbum = {
                id: targetAlbumId,
                name: `Unnamed (${analyzedVoice.name || 'Voice'})`,
                coverImage: 'https://picsum.photos/seed/voice_placeholder/200/200', // Default for voice-only
                media: [],
                mediaCount: 0,
                voiceSampleAvailable: false, // Updated below
                voiceSampleUrl: null, // Updated below
                summary: ''
             };
             albumsMap.set(targetAlbumId, targetAlbum);
             newUnnamedAlbums.set(targetAlbumId, targetAlbum);
             mediaAddedToAlbum.set(targetAlbumId, new Set());
             updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd); // Set voice sample for new album

        } else {
           targetAlbumId = voiceMap.assignedAlbumId;
           targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
               console.warn(`[Processing] Target album ${targetAlbumId} not found for voice ${voiceMap.tempVoiceId}. Skipping.`);
               continue;
           }
            console.log(` -> Assigning voice ${voiceMap.tempVoiceId} (from ${mediaItemToAdd.alt}) directly to album '${targetAlbum.name}' (${targetAlbumId})`);
        }

        // Add media, update cover, update voice
        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) {
            updateCoverImage(targetAlbum, null, mediaItemToAdd); // No face data for cover here
            updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd);
        }
   }

    const finalAlbums = Array.from(albumsMap.values());
     // Final serialization check before returning
    const serializableFinalAlbums = finalAlbums.map(a => JSON.parse(JSON.stringify(a)));

    console.log("[Processing] Albums after face/voice review:", serializableFinalAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
    return { updatedAlbums: serializableFinalAlbums, mediaAddedToAlbum, newUnnamedAlbums };
}

/**
 * Links chat files to albums based on user decisions from the review step.
 * Assumes albums have potentially been created/updated in the previous step.
 *
 * @param userDecisions User's choices from the review modal.
 * @param analysisResults The original analysis results containing ChatFileLinkInfo (with chatContent).
 * @param currentAlbums The state of albums *after* face/voice processing but *before* chat linking (ensure serializable).
 * @returns The updated list of albums with chats linked (ensure serializable).
 */
export async function linkChatsToAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    currentAlbums: Album[]
): Promise<Album[]> {
     console.log("[Processing] Linking chats based on review decisions:", userDecisions.chatLinks);
      // Work with a mutable map, starting with serializable albums
     const albumsMap = new Map(currentAlbums.map(a => [a.id, JSON.parse(JSON.stringify(a))])); // Deep copy

     for (const chatDecision of userDecisions.chatLinks) {
        if (chatDecision.linkedAlbumId === null || chatDecision.linkedAlbumId === 'none') {
             console.log(` -> Skipping chat link for fileId ${chatDecision.fileId} (user chose 'Don't Link').`);
             continue;
        }

        const chatInfo = analysisResults.chatFilesToLink.find(cf => cf.fileId === chatDecision.fileId);
        if (!chatInfo) {
            console.warn(`[Processing] Chat info not found for fileId ${chatDecision.fileId}. Skipping link.`);
            continue;
        }

        const targetAlbum = albumsMap.get(chatDecision.linkedAlbumId);
        if (!targetAlbum) {
            console.warn(`[Processing] Target album ${chatDecision.linkedAlbumId} not found for chat ${chatInfo.fileName}. Skipping link.`);
            continue;
        }

        try {
             // Simulate storing the chat content and getting a persistent URL/identifier
             const safeFileName = chatInfo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
             const persistentChatUrl = `persistent/chat/${chatInfo.fileId}_${safeFileName}`;
             console.log(`   - Simulating storage: ${chatInfo.fileName} content stored at ${persistentChatUrl}`);

             const chatMediaItem: MediaItem = {
                 id: `chat_${chatInfo.fileId}_${Date.now()}`,
                 type: 'chat',
                 url: persistentChatUrl, // This URL now represents the stored chat content
                 alt: `Chat: ${chatInfo.fileName}`,
                 source: chatInfo.source,
                 chatData: chatInfo.chatContent, // Include content for potential display later
                 file: undefined // Ensure no File object
             };

             if (!targetAlbum.media.some(m => m.type === 'chat' && m.url === chatMediaItem.url)) {
                targetAlbum.media.push(chatMediaItem);
                targetAlbum.mediaCount = targetAlbum.media.length;
                console.log(` -> Linked chat ${chatInfo.fileName} (ID: ${chatMediaItem.id}) to album '${targetAlbum.name}' (${targetAlbum.id})`);
             } else {
                 console.log(` -> Chat ${chatInfo.fileName} (URL: ${chatMediaItem.url}) already linked to album '${targetAlbum.name}'. Skipping duplicate.`);
             }

        } catch (error) {
             console.error(`[Processing] Error linking chat file ${chatInfo.fileName}:`, error);
        }
     }

     const updatedAlbums = Array.from(albumsMap.values());
     // Final serialization check
     const serializableUpdatedAlbums = updatedAlbums.map(a => JSON.parse(JSON.stringify(a)));


     console.log("[Processing] Albums after linking chats:", serializableUpdatedAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount, hasChat: a.media.some(m=>m.type==='chat') })));
     return serializableUpdatedAlbums;
}


/**
 * Generates AI summaries for albums that need them.
 * @param albumsToSummarize List of albums (potentially new or updated).
 * @param mediaAddedToAlbum Map tracking which media was added to which album in this batch.
 * @param newUnnamedAlbums Map tracking newly created albums in this batch.
 * @returns Promise resolving when all summaries are attempted. Updates albums in place.
 */
async function generateAlbumSummaries(
    albumsToSummarize: Album[], // This should be the mutable list/map
    mediaAddedToAlbum: Map<string, Set<string | number>>,
    newUnnamedAlbums: Map<string, Album>
): Promise<void> {
    console.log("[Processing] Generating summaries for new/updated albums...");
    const summaryPromises: Promise<void>[] = [];

    for (const album of albumsToSummarize) {
         // Determine if the album was actually modified in *this* run
        const wasMediaAddedThisRun = (mediaAddedToAlbum.get(album.id)?.size ?? 0) > 0;
        const isNewAlbumThisRun = newUnnamedAlbums.has(album.id);
        // Trigger summary if it's new, or if media was added, or if summary is missing/failed previously
        const needsSummaryUpdate = isNewAlbumThisRun || wasMediaAddedThisRun || !album.summary || album.summary.startsWith('[Summary generation failed');


        if (needsSummaryUpdate && album.media.length > 0) {
            console.log(` -> Queueing summary generation for ${isNewAlbumThisRun ? 'new' : 'updated'} album ${album.id} ('${album.name}')`);
            summaryPromises.push(
                (async () => {
                    try {
                         // Generate a more descriptive input for the summary
                        const mediaTypes = [...new Set(album.media.map(m => m.type))].join(', ');
                        const imageCount = album.media.filter(m => m.type === 'image').length;
                        const videoCount = album.media.filter(m => m.type === 'video').length;
                        const audioCount = album.media.filter(m => m.type === 'audio').length;
                        const chatCount = album.media.filter(m => m.type === 'chat').length;

                        let description = `Summarize the content of this album for ${album.name === 'Unnamed' ? 'an unnamed person' : album.name}. `;
                        description += `It contains ${album.mediaCount} items: ${imageCount} images, ${videoCount} videos, ${audioCount} audio files, and ${chatCount} chats. `;
                        if (album.voiceSampleAvailable) description += `A voice sample is available. `;
                         // Maybe add first few chat lines if available? Could be too long.
                         // Consider adding keywords from media analysis if available in the future.

                        const summaryResult = await summarizeAlbumContent({ albumDescription: description });
                         // Mutate the album object directly (assuming albumsToSummarize is mutable)
                        album.summary = summaryResult.summary;
                        console.log(` -> Summary generated for album ${album.id}: "${album.summary.substring(0, 50)}..."`);
                    } catch (error) {
                        console.error(`[Processing] AI Summary Generation Failed for album ${album.id}:`, error);
                         // Mutate the album object directly
                        album.summary = `[Summary generation failed: ${error instanceof Error ? error.message : 'AI error'}]`;
                    }
                })()
            );
        } else if (needsSummaryUpdate && album.media.length === 0) {
             console.log(` -> Skipping summary generation for album ${album.id} ('${album.name}') as it has no media.`);
             album.summary = "[Album is empty]"; // Update summary for empty albums
        }
    }

    await Promise.all(summaryPromises);
    console.log("[Processing] Summary generation attempts complete.");
}


/**
 * Orchestrates the final processing after user review:
 * Fetches current albums, updates/creates albums based on face/voice, links chats, generates summaries, and persists changes.
 *
 * @param userDecisions The decisions made by the user in the review modal.
 * @param analysisResults The results from the initial analysis phase (MUST be serializable).
 * @returns Promise resolving to an object indicating success or failure, and the final list of albums (serializable).
 */
export async function finalizeUploadProcessing(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
): Promise<{ success: boolean; updatedAlbums?: Album[]; error?: string }> {
     // --- Top-level try-catch for the server action ---
    try {
        console.log("[Finalize] Starting final processing with user decisions...");

        // --- Step 0: Verify Serializability (Defensive Check) ---
         try {
             JSON.stringify(analysisResults);
             JSON.stringify(userDecisions);
             console.log("[Finalize] Input parameters verified as serializable.");
         } catch (stringifyError) {
             console.error("[Finalize] CRITICAL ERROR: Received non-serializable input!", stringifyError);
             return { success: false, error: `Internal Server Error: Input data could not be processed (serialization failed: ${stringifyError instanceof Error ? stringifyError.message : String(stringifyError)})` };
         }

        // --- Step 1: Fetch current state of albums ---
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        // Crucially, ensure fetched albums are also prepped for modification (deep copy if needed)
        // and are serializable (no File objects)
        const existingAlbums = existingAlbumsRaw.map(a => JSON.parse(JSON.stringify(a)));


        console.log(`[Finalize] Fetched ${existingAlbums.length} existing albums.`);

        // --- Step 2: Create/Update Albums based on face/voice mappings ---
        // This function should return a *new* array/map reflecting the changes
        const { updatedAlbums: albumsAfterFaceVoice, mediaAddedToAlbum, newUnnamedAlbums } = await createOrUpdateAlbumsFromReview(
            userDecisions,
            analysisResults,
            existingAlbums // Pass the serializable, mutable copy
        );
        console.log("[Finalize] Album creation/update based on face/voice review complete.");

        // --- Step 3: Link Chats based on review decisions ---
        // Pass the result from the previous step
        let albumsAfterChatLinking = await linkChatsToAlbumsFromReview(
            userDecisions,
            analysisResults,
            albumsAfterFaceVoice // Pass the updated list
        );
        console.log("[Finalize] Chat linking complete.");

        // --- Step 4: Generate Summaries ---
        // Pass the *latest* version of the albums list
        await generateAlbumSummaries(albumsAfterChatLinking, mediaAddedToAlbum, newUnnamedAlbums);
        console.log("[Finalize] Summary generation attempted.");

        // --- Step 5: Persist all changes to the database ---
        // Pass the final, fully updated list
        await saveAlbumsToDatabase(albumsAfterChatLinking);
        console.log("[Finalize] Final albums persisted to database.");

        // --- Step 6: Return Success ---
        console.log("[Finalize] Upload processing finished successfully.");

        // Ensure the final returned albums are serializable (should be if handled correctly in steps)
        const finalSerializableAlbums = albumsAfterChatLinking.map(a => JSON.parse(JSON.stringify(a)));
        return { success: true, updatedAlbums: finalSerializableAlbums };

    } catch (error) {
        // --- Catch any error during the finalization process ---
        console.error("[Finalize Action Error] An error occurred during finalizeUploadProcessing:", error);
        let clientErrorMessage = "An error occurred while finalizing the upload.";
        if (error instanceof Error) {
             // Be cautious about leaking internal details
             clientErrorMessage = `Failed to finalize upload: ${error.message}`;
        }
        // Return a structured error to the client
        return { success: false, error: clientErrorMessage };
    }
}

