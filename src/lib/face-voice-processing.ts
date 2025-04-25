
'use server'; // Mark this module for Server Actions

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
      { id: 'face_alex_j', name: 'Alex Johnson', coverImage: 'https://picsum.photos/seed/face_alex_j/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person1.mp3', media: [ { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1', file: undefined }, { id: 102, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Alex video 2', source: 'upload', file: undefined }, { id: 103, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Alex audio 3', source: 'upload', file: undefined }, { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4', file: undefined } ], summary: 'Album containing images and videos of Alex Johnson.' },
      { id: 'face_maria_g', name: 'Maria Garcia', coverImage: 'https://picsum.photos/seed/face_maria_g/200/200', mediaCount: 2, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1', file: undefined }, { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2', file: undefined } ], summary: 'Images featuring Maria Garcia.' },
      { id: 'face_chen_w', name: 'Chen Wei', coverImage: 'https://picsum.photos/seed/face_chen_w/200/200', mediaCount: 3, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person3.mp3', media: [ { id: 301, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Chen video 1', source: 'upload', file: undefined }, { id: 302, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Chen audio 2', source: 'upload', file: undefined }, { id: 303, type: 'chat', url: 'persistent/chat_path/chat_chen_w_1_example.txt', alt: 'Chat with Chen', source: 'whatsapp', chatData: `Chen: Let's meet tomorrow.\nYou: Sounds good, what time?\nChen: How about 2 PM?\n...(more)`, file: undefined } ], summary: 'Videos, audio and chat history related to Chen Wei.' },
      { id: 'face_samira_k', name: 'Samira Khan', coverImage: 'https://picsum.photos/seed/face_samira_k/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person5.mp3', media: [ { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1', file: undefined }, { id: 502, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', alt: 'Samira video 2', source: 'upload', file: undefined }, { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3', file: undefined }, { id: 504, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Samira audio 4', source: 'upload', file: undefined } ], summary: 'Collection of media featuring Samira Khan.' },
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
 * In a real application, this would use server-side image processing libraries.
 * @param mediaFile The image/video File object (used only for logging here).
 * @param boundingBox The bounding box of the face.
 * @returns Promise resolving to a Data URL of the cropped face (using picsum placeholder).
 */
async function cropFace(mediaFile: File, boundingBox: FaceBoundingBox): Promise<string> {
    console.log(`[Mock] Simulating face crop from ${mediaFile.name} at bbox [${boundingBox.x},${boundingBox.y},${boundingBox.width},${boundingBox.height}]`);
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate delay

    // Use a consistent placeholder image service (like picsum) based on some unique ID
    // This provides a visual representation without needing Canvas or server-side processing for the mock.
    // Generate a seed based on file name and bounding box for pseudo-uniqueness
    const seed = `${mediaFile.name}_${boundingBox.x}_${boundingBox.y}`.replace(/[^a-zA-Z0-9]/g, '');
    const placeholderUrl = `https://picsum.photos/seed/${seed}/80/80`; // Generate 80x80 placeholder

    console.log(`[Mock] Using placeholder image for face crop: ${placeholderUrl}`);
    // In a real app, you'd return a Data URL from canvas or a URL to a stored crop.
    // For simulation returning the placeholder URL. Data URLs can be large and non-ideal.
    // We will simulate fetching this URL to get a data URL if needed client-side,
    // but store the URL here. For simplicity in this mock, we'll just return the URL.
    // To simulate a data URL, we'd fetch this and convert.
    // For this simulation, we'll just return the placeholder URL directly.
    // If a Data URL is strictly required by the caller, this would need modification.
    return placeholderUrl;

    // --- Alternative: If Data URL is strictly needed (more complex mock) ---
    // try {
    //   console.log(`[Mock] Fetching placeholder ${placeholderUrl} to generate Data URL...`)
    //   const response = await fetch(placeholderUrl);
    //   if (!response.ok) throw new Error(`Failed to fetch placeholder: ${response.statusText}`);
    //   const blob = await response.blob();
    //   return await new Promise((resolve, reject) => {
    //       const reader = new FileReader();
    //       reader.onloadend = () => resolve(reader.result as string);
    //       reader.onerror = reject;
    //       reader.readAsDataURL(blob);
    //   });
    // } catch (error) {
    //     console.error("[Mock] Error fetching or converting placeholder for face crop:", error);
    //     // Fallback SVG placeholder
    //     return `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjZWNlY2VjIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjEyIiBmaWxsPSIjNjY2Ij5GYWNlPC90ZXh0Pjwvc3ZnPg==`;
    // }
    // --- End Alternative ---
}


/**
 * Processes a single uploaded media file (image, video, audio) for analysis.
 * Simulates face/voice detection and returns serializable results.
 * @param mediaItem The media item containing the File object.
 * @returns Promise resolving to MediaAnalysisResult.
 */
async function analyzeSingleMediaFile(mediaItem: MediaItem): Promise<MediaAnalysisResult> {
    if (!mediaItem.file) {
        console.error(`[Analysis] MediaItem ${mediaItem.id} is missing the File object for analysis.`);
        return {
            originalMedia: { ...mediaItem, file: undefined, url: `error://missing-file/${mediaItem.alt}` },
            analyzedFaces: [],
            analyzedVoice: null,
            error: "Missing file object",
        };
    }

    const file = mediaItem.file;
    console.log(`[Analysis] Analyzing file: ${file.name} (Type: ${mediaItem.type})`);
    let audioPathForVoiceAnalysis: string | null = null;
    let analyzedFaces: AnalyzedFace[] = [];
    let analyzedVoice: AnalyzedVoice | null = null;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let analysisError: string | null = null;

    try {
        // --- Audio Extraction (for Videos) ---
        if (mediaItem.type === 'video') {
            audioPathForVoiceAnalysis = await extractAudio(file);
        } else if (mediaItem.type === 'audio') {
            audioPathForVoiceAnalysis = `persistent/audio/${safeFileName}`; // Placeholder persistent path
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
                            const tempId = `${mediaItem.id}_face_${index}`;
                            const imageDataUrl = await cropFace(file, face.boundingBox).catch(e => {
                                console.error(`Failed to crop face ${tempId}:`, e); return undefined;
                            });
                            return {
                                ...face, // Includes boundingBox, confidence
                                tempId: tempId,
                                imageDataUrl: imageDataUrl, // This is now potentially a URL, not Data URL
                                selectedAlbumId: null, // Initialize selection
                            };
                        })
                    );
                    console.log(` -> Found ${facesWithDetails.length} faces in ${file.name}`);
                    return facesWithDetails;
                })
                .catch(err => {
                    console.error(`Face detection failed for ${file.name}:`, err);
                    analysisError = analysisError ? `${analysisError}; Face detection failed` : 'Face detection failed';
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
                             tempId: `${mediaItem.id}_voice_${voiceProfile.id}`,
                             profileId: voiceProfile.id,
                             name: voiceProfile.name,
                             selectedAlbumId: null,
                         } as AnalyzedVoice;
                     }
                      console.log(` -> No distinct voice identified in ${file.name}`);
                     return null;
                 })
                .catch(err => {
                    console.error(`Voice identification failed for ${audioPathForVoiceAnalysis} (from ${file.name}):`, err);
                    analysisError = analysisError ? `${analysisError}; Voice identification failed` : 'Voice identification failed';
                    return null; // Return null on failure
                });
        }

        [analyzedFaces, analyzedVoice] = await Promise.all(analysisPromises);

    } catch (error) {
        console.error(`[Analysis] Error during analysis of ${file.name}:`, error);
        analysisError = error instanceof Error ? error.message : String(error);
        // Reset results on major error during setup
        analyzedFaces = [];
        analyzedVoice = null;
    }

    // Simulate storing the file and getting a persistent URL
    const persistentUrl = `persistent/${mediaItem.type}/${safeFileName}`;
    console.log(` -> Simulating storage: ${file.name} stored at ${persistentUrl}`);

     // Revoke temporary URL if it was created (and if in browser context)
     if (mediaItem.url.startsWith('blob:') && typeof window !== 'undefined' && typeof URL.revokeObjectURL === 'function') {
        console.log(`[Analysis] Revoking temporary URL for ${mediaItem.alt}: ${mediaItem.url.substring(0,50)}...`);
        try { URL.revokeObjectURL(mediaItem.url); }
        catch (revokeError) { console.warn(`Failed to revoke Object URL ${mediaItem.url}:`, revokeError); }
    }

    return {
        originalMedia: {
            ...mediaItem,
            url: persistentUrl, // Replace temporary/error URL with the persistent path
            file: undefined, // Explicitly remove file object
        },
        analyzedFaces: analyzedFaces,
        analyzedVoice: analyzedVoice,
        error: analysisError, // Include any specific errors encountered during analysis
    };
}

/**
 * Analyzes a batch of uploaded files (media and chats) to detect faces/voices
 * and prepare data for the user review step. Uses mock services.
 *
 * @param uploadedFiles Array of File objects from the input.
 * @returns Promise resolving to UploadAnalysisResults containing data for the review modal.
 *          All data returned MUST be serializable.
 */
export async function analyzeUploadedFiles(uploadedFiles: File[]): Promise<UploadAnalysisResults> {
    try {
        console.log(`[Analysis] Starting analysis for ${uploadedFiles.length} files...`);

        const mediaItemsToAnalyze: MediaItem[] = [];
        const chatFileInfos: {file: File, fileId: string, source: ChatFileLinkInfo['source']}[] = [];

        // --- 1. Categorize files and create initial MediaItem/ChatFileLinkInfo objects ---
        uploadedFiles.forEach((file, index) => {
            const fileId = `upload_${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; // Sanitize ID

            let mediaType: MediaItem['type'] | null = null;
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('video/')) mediaType = 'video';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';
            else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) mediaType = 'chat';

            if (mediaType && mediaType !== 'chat') {
                let tempUrl = `placeholder://processing/${file.name}`; // Use placeholder initially
                 if (typeof window !== 'undefined' && typeof URL.createObjectURL === 'function') {
                    try {
                        tempUrl = URL.createObjectURL(file);
                        console.log(`[Analysis] Created temporary URL for ${file.name}: ${tempUrl.substring(0, 50)}...`);
                    } catch (e) {
                        console.error("[Analysis] Could not create Object URL:", e);
                        // Keep placeholder URL if creation fails
                    }
                 } else {
                      console.warn("[Analysis] Cannot create Object URL in this environment. Using placeholder.");
                 }

                mediaItemsToAnalyze.push({
                    id: fileId,
                    type: mediaType,
                    url: tempUrl, // Temporary URL or placeholder
                    alt: file.name,
                    source: 'upload',
                    file: file, // Keep File object for analysis ONLY
                });
            } else if (mediaType === 'chat') {
                let source: ChatFileLinkInfo['source'] = 'upload';
                if (file.name.toLowerCase().includes('whatsapp')) source = 'whatsapp';
                else if (file.name.toLowerCase().includes('instagram')) source = 'instagram';
                else if (file.name.toLowerCase().includes('facebook')) source = 'facebook';
                chatFileInfos.push({ file, fileId, source });
                console.log(`[Analysis] Identified chat file: ${file.name}`);
            } else {
                console.warn(`[Analysis] Skipping unsupported file type: ${file.name} (${file.type})`);
            }
        });

        // --- 2. Analyze Media Files Concurrently ---
        console.log(`[Analysis] Analyzing ${mediaItemsToAnalyze.length} media files...`);
        const mediaResults = await Promise.all(mediaItemsToAnalyze.map(analyzeSingleMediaFile));
        console.log("[Analysis] Media analysis complete.");

        // --- 3. Read Chat File Content Concurrently ---
        console.log(`[Analysis] Reading content for ${chatFileInfos.length} chat files...`);
        const chatFilesToLink: ChatFileLinkInfo[] = await Promise.all(
            chatFileInfos.map(async ({ file, fileId, source }) => {
                const content = await fetchChatContent(file);
                return {
                    fileId: fileId,
                    fileName: file.name,
                    source: source,
                    chatContent: content,
                    selectedAlbumId: null,
                };
            })
        );
        console.log("[Analysis] Chat content reading complete.");

        // --- 4. Fetch Existing Albums for Linking ---
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        const existingAlbums = existingAlbumsRaw.map(album => ({
            ...album,
            media: album.media.map(m => ({ ...m, file: undefined })) // Ensure no File objects
        }));
        console.log(`[Analysis] Fetched ${existingAlbums.length} existing albums for review.`);

        const results: UploadAnalysisResults = {
             mediaResults, // Already processed to be serializable
             chatFilesToLink,
             existingAlbums,
        };

         // --- 5. Final Serialization Check ---
         try {
            JSON.stringify(results); // Verify the entire structure is serializable
            console.log("[Analysis] Analysis results successfully verified as serializable.");
         } catch (e) {
             console.error("[Analysis] CRITICAL ERROR: Analysis results are not serializable!", e);
             // Log the problematic part if possible (difficult without custom logic)
             // Example: Find which mediaResult has issues
             for (const res of results.mediaResults) {
                 try { JSON.stringify(res); } catch (nestedE) { console.error("Problematic mediaResult:", res, nestedE); }
             }
             throw new Error(`Failed to serialize analysis results: ${e instanceof Error ? e.message : String(e)}`);
         }

        console.log("[Analysis] Analysis phase complete. Returning SERIALIZABLE results for review modal.");
        return results;

    } catch (error) {
        console.error("[Analysis Action Error] An error occurred during analyzeUploadedFiles:", error);
        // Propagate the error to be handled by the Server Action caller
        throw error instanceof Error ? error : new Error(String(error));
    }
}


/**
 * Creates or updates albums based on user decisions from the review step.
 * Handles assigning faces/voices and adding media to albums.
 *
 * @param userDecisions The mappings decided by the user.
 * @param analysisResults The original analysis results.
 * @param existingAlbums Current list of albums from the database (serializable).
 * @returns Promise resolving to the updated array of Album objects and tracking info.
 */
async function createOrUpdateAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    existingAlbums: Album[]
): Promise<{ updatedAlbums: Album[], mediaAddedToAlbum: Map<string, Set<string | number>>, newUnnamedAlbums: Map<string, Album>}> {
    console.log("[Processing] Applying face/voice review decisions to albums...");
    const albumsMap: Map<string, Album> = new Map(
        existingAlbums.map(a => [a.id, JSON.parse(JSON.stringify(a))]) // Deep copy
    );
    const newUnnamedAlbums: Map<string, Album> = new Map();
    const mediaAddedToAlbum: Map<string, Set<string | number>> = new Map();
    existingAlbums.forEach(album => mediaAddedToAlbum.set(album.id, new Set()));
    const processedMediaIds = new Set<string | number>();

    const addMediaToAlbum = (album: Album, media: MediaItem) => {
        const serializableMedia = { ...media, file: undefined };
        if (!album.media.some(m => m.id === serializableMedia.id)) {
            album.media.push(serializableMedia);
            album.mediaCount = album.media.length;
            // Ensure the album entry exists in mediaAddedToAlbum before adding
            if (!mediaAddedToAlbum.has(album.id)) {
                mediaAddedToAlbum.set(album.id, new Set());
            }
            mediaAddedToAlbum.get(album.id)!.add(serializableMedia.id); // Use non-null assertion
            console.log(`   - Added media ${serializableMedia.id} (${serializableMedia.alt}) to album ${album.id}`);
            processedMediaIds.add(serializableMedia.id);
            return true;
        }
        console.log(`   - Media ${serializableMedia.id} (${serializableMedia.alt}) already in album ${album.id}.`);
        return false;
    };

    const updateCoverImage = (album: Album, face: AnalyzedFace | null, media: MediaItem) => {
         // If face provides a URL (now placeholder URL, not Data URL) and current cover is default/placeholder
        const currentCoverIsPlaceholder = !album.coverImage || album.coverImage.includes('placeholder') || album.coverImage.includes('picsum');
         if (face?.imageDataUrl && currentCoverIsPlaceholder && !face.imageDataUrl.startsWith('data:')) {
            album.coverImage = face.imageDataUrl; // Use the placeholder URL directly
            console.log(`   - Updated cover image for album ${album.id} with face placeholder URL.`);
        } else if ((media.type === 'image' || media.type === 'video') && currentCoverIsPlaceholder) {
            album.coverImage = media.url; // Use the persistent media URL
            console.log(`   - Updated cover image for album ${album.id} with media URL.`);
        }
    };

    const updateVoiceSample = (album: Album, voice: AnalyzedVoice | null, media: MediaItem) => {
        if (!album.voiceSampleUrl && voice) {
            let voiceUrl: string | null = null;
            if (media.type === 'audio') voiceUrl = media.url; // Use persistent audio URL
            else if (media.type === 'video') {
                 const safeFileName = media.alt.replace(/[^a-zA-Z0-9._-]/g, '_');
                 voiceUrl = `persistent/extracted_audio/${safeFileName.replace(/\.[^/.]+$/, "")}.mp3`;
            }

            if (voiceUrl) {
                album.voiceSampleUrl = voiceUrl;
                album.voiceSampleAvailable = true;
                console.log(`   - Set voice sample for album ${album.id} from ${media.alt}`);
            }
        }
    };

    const findMediaResultByTempId = (tempId: string): MediaAnalysisResult | undefined => {
        return analysisResults.mediaResults.find(res =>
            res.analyzedFaces.some(f => f.tempId === tempId) || res.analyzedVoice?.tempId === tempId
        );
    };

    // --- 1. Process Face Mappings ---
    for (const faceMap of userDecisions.faceMappings) {
        if (faceMap.assignedAlbumId === null || faceMap.assignedAlbumId === 'none') {
            console.log(` -> Ignoring face ${faceMap.tempFaceId}.`);
            continue;
        }

        const resultContainingFace = findMediaResultByTempId(faceMap.tempFaceId);
        if (!resultContainingFace) {
            console.warn(`[Processing] Could not find original media for face ${faceMap.tempFaceId}. Skipping.`);
            continue;
        }
        const analyzedFace = resultContainingFace.analyzedFaces.find(f => f.tempId === faceMap.tempFaceId);
        if (!analyzedFace) { // Extra check
             console.warn(`[Processing] AnalyzedFace object not found for ${faceMap.tempFaceId}. Skipping.`);
             continue;
        }
        const mediaItemToAdd = resultContainingFace.originalMedia;

        if (processedMediaIds.has(mediaItemToAdd.id)) {
            console.log(` -> Media ${mediaItemToAdd.id} already processed. Skipping duplicate for face ${faceMap.tempFaceId}.`);
            continue;
        }

        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (faceMap.assignedAlbumId === 'new_unnamed') {
            targetAlbumId = `album_unnamed_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
            console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) for face ${faceMap.tempFaceId} from ${mediaItemToAdd.alt}`);

            const associatedVoice = resultContainingFace.analyzedVoice;
            const voiceAlsoMappedToNew = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === 'new_unnamed'
            );

            targetAlbum = {
                id: targetAlbumId, name: 'Unnamed',
                coverImage: analyzedFace.imageDataUrl || // Placeholder URL or actual image URL
                              (mediaItemToAdd.type === 'image' || mediaItemToAdd.type === 'video' ? mediaItemToAdd.url : '') ||
                              'https://picsum.photos/seed/placeholder/200/200',
                media: [], mediaCount: 0, voiceSampleAvailable: false, voiceSampleUrl: null, summary: ''
            };
            albumsMap.set(targetAlbumId, targetAlbum);
            newUnnamedAlbums.set(targetAlbumId, targetAlbum);
            mediaAddedToAlbum.set(targetAlbumId, new Set()); // Initialize for new album
             if (voiceAlsoMappedToNew && associatedVoice) updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);

        } else {
            targetAlbumId = faceMap.assignedAlbumId;
            targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
                console.warn(`[Processing] Target album ${targetAlbumId} not found for face ${faceMap.tempFaceId}. Skipping.`);
                continue;
            }
            console.log(` -> Assigning face ${faceMap.tempFaceId} (from ${mediaItemToAdd.alt}) to album '${targetAlbum.name}' (${targetAlbumId})`);
        }

        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) {
            updateCoverImage(targetAlbum, analyzedFace, mediaItemToAdd);
            const associatedVoice = resultContainingFace.analyzedVoice;
             const voiceMappedToThisAlbum = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === targetAlbumId
             );
            if (voiceMappedToThisAlbum && associatedVoice) updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);
        }
    }

     // --- 2. Process Direct Voice Mappings (ONLY IF face wasn't mapped) ---
     for (const voiceMap of userDecisions.voiceMappings) {
        if (voiceMap.assignedAlbumId === null || voiceMap.assignedAlbumId === 'none') {
            console.log(` -> Ignoring voice ${voiceMap.tempVoiceId}.`);
            continue;
        }

        const resultContainingVoice = findMediaResultByTempId(voiceMap.tempVoiceId);
         if (!resultContainingVoice || !resultContainingVoice.analyzedVoice) {
             console.warn(`[Processing] Could not find original media or voice for voice ${voiceMap.tempVoiceId}. Skipping.`);
             continue;
         }
        const mediaItemToAdd = resultContainingVoice.originalMedia;
        const analyzedVoice = resultContainingVoice.analyzedVoice; // Already checked non-null

        if (processedMediaIds.has(mediaItemToAdd.id)) {
            console.log(` -> Media ${mediaItemToAdd.id} already processed. Skipping direct voice mapping for ${voiceMap.tempVoiceId}.`);
            continue;
        }

        const faceWasMapped = userDecisions.faceMappings.some(fm =>
            fm.assignedAlbumId !== null && fm.assignedAlbumId !== 'none' &&
            resultContainingVoice.analyzedFaces.some(f => f.tempId === fm.tempFaceId)
        );

        if (faceWasMapped) {
            console.log(` -> Skipping direct voice mapping for ${voiceMap.tempVoiceId} as a face from the same media (${mediaItemToAdd.alt}) was mapped.`);
            continue;
        }

        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (voiceMap.assignedAlbumId === 'new_unnamed') {
             targetAlbumId = `album_unnamed_voice_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
             console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) for voice ${voiceMap.tempVoiceId} from ${mediaItemToAdd.alt}`);

             targetAlbum = {
                id: targetAlbumId, name: `Unnamed (${analyzedVoice.name || 'Voice'})`,
                coverImage: 'https://picsum.photos/seed/voice_placeholder/200/200',
                media: [], mediaCount: 0, voiceSampleAvailable: false, voiceSampleUrl: null, summary: ''
             };
             albumsMap.set(targetAlbumId, targetAlbum);
             newUnnamedAlbums.set(targetAlbumId, targetAlbum);
             mediaAddedToAlbum.set(targetAlbumId, new Set()); // Initialize for new album
             updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd);

        } else {
           targetAlbumId = voiceMap.assignedAlbumId;
           targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
               console.warn(`[Processing] Target album ${targetAlbumId} not found for voice ${voiceMap.tempVoiceId}. Skipping.`);
               continue;
           }
            console.log(` -> Assigning voice ${voiceMap.tempVoiceId} (from ${mediaItemToAdd.alt}) directly to album '${targetAlbum.name}' (${targetAlbumId})`);
        }

        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) {
            updateCoverImage(targetAlbum, null, mediaItemToAdd);
            updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd);
        }
   }

    const finalAlbums = Array.from(albumsMap.values());
    const serializableFinalAlbums = finalAlbums.map(a => JSON.parse(JSON.stringify(a)));

    console.log("[Processing] Albums after face/voice review:", serializableFinalAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
    return { updatedAlbums: serializableFinalAlbums, mediaAddedToAlbum, newUnnamedAlbums };
}


/**
 * Links chat files to albums based on user decisions.
 * Assumes albums have potentially been created/updated.
 *
 * @param userDecisions User's choices.
 * @param analysisResults Original analysis results containing chat content.
 * @param currentAlbums The state of albums *after* face/voice processing.
 * @returns The updated list of albums with chats linked (serializable).
 */
export async function linkChatsToAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    currentAlbums: Album[]
): Promise<Album[]> {
     console.log("[Processing] Linking chats based on review decisions:", userDecisions.chatLinks);
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
             const safeFileName = chatInfo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
             const persistentChatUrl = `persistent/chat/${chatInfo.fileId}_${safeFileName}`;
             console.log(`   - Simulating storage: ${chatInfo.fileName} content stored at ${persistentChatUrl}`);

             const chatMediaItem: MediaItem = {
                 id: `chat_${chatInfo.fileId}_${Date.now()}`,
                 type: 'chat',
                 url: persistentChatUrl, // Represents stored chat
                 alt: `Chat: ${chatInfo.fileName}`,
                 source: chatInfo.source,
                 chatData: chatInfo.chatContent, // Include content
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
     const serializableUpdatedAlbums = updatedAlbums.map(a => JSON.parse(JSON.stringify(a)));

     console.log("[Processing] Albums after linking chats:", serializableUpdatedAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount, hasChat: a.media.some(m=>m.type==='chat') })));
     return serializableUpdatedAlbums;
}


/**
 * Generates AI summaries for albums that were newly created or had media added.
 * @param albumsToSummarize Mutable list/map of albums.
 * @param mediaAddedToAlbum Map tracking media added in this batch.
 * @param newUnnamedAlbums Map tracking newly created albums in this batch.
 * @returns Promise resolving when all summaries are attempted. Updates albums in place.
 */
async function generateAlbumSummaries(
    albumsToSummarize: Album[], // Should be the mutable list from previous steps
    mediaAddedToAlbum: Map<string, Set<string | number>>,
    newUnnamedAlbums: Map<string, Album>
): Promise<void> {
    console.log("[Processing] Generating summaries for new/updated albums...");
    const summaryPromises: Promise<void>[] = [];

    for (const album of albumsToSummarize) {
        // Check if this specific album instance needs a summary update
        const wasMediaAddedThisRun = (mediaAddedToAlbum.get(album.id)?.size ?? 0) > 0;
        const isNewAlbumThisRun = newUnnamedAlbums.has(album.id);
        const needsSummaryUpdate = isNewAlbumThisRun || wasMediaAddedThisRun || !album.summary || album.summary.startsWith('[Summary generation failed');

        if (needsSummaryUpdate && album.media.length > 0) {
            console.log(` -> Queueing summary generation for ${isNewAlbumThisRun ? 'new' : 'updated'} album ${album.id} ('${album.name}')`);
            summaryPromises.push(
                (async () => {
                    try {
                        const mediaTypes = [...new Set(album.media.map(m => m.type))].join(', ');
                        const imageCount = album.media.filter(m => m.type === 'image').length;
                        const videoCount = album.media.filter(m => m.type === 'video').length;
                        const audioCount = album.media.filter(m => m.type === 'audio').length;
                        const chatCount = album.media.filter(m => m.type === 'chat').length;

                        let description = `Summarize the content of this album for ${album.name === 'Unnamed' ? 'an unnamed person' : album.name}. `;
                        description += `It contains ${album.mediaCount} items: ${imageCount} images, ${videoCount} videos, ${audioCount} audio files, and ${chatCount} chats. `;
                        if (album.voiceSampleAvailable) description += `A voice sample is available. `;
                        // Consider adding first few chat lines if available?
                         if (chatCount > 0) {
                            const firstChat = album.media.find(m => m.type === 'chat');
                            if (firstChat?.chatData) {
                                description += `First few lines of a chat: ${firstChat.chatData.substring(0, 100)}... `;
                            }
                        }

                        const summaryResult = await summarizeAlbumContent({ albumDescription: description });
                        album.summary = summaryResult.summary; // Mutate the album object
                        console.log(` -> Summary generated for album ${album.id}: "${album.summary.substring(0, 50)}..."`);
                    } catch (error) {
                        console.error(`[Processing] AI Summary Generation Failed for album ${album.id}:`, error);
                        album.summary = `[Summary generation failed: ${error instanceof Error ? error.message : 'AI error'}]`; // Mutate
                    }
                })()
            );
        } else if (needsSummaryUpdate && album.media.length === 0) {
             console.log(` -> Skipping summary generation for album ${album.id} ('${album.name}') as it has no media.`);
             album.summary = "[Album is empty]"; // Update summary for empty albums
        }
    }

    try {
        await Promise.all(summaryPromises);
        console.log("[Processing] Summary generation attempts complete.");
    } catch (error) {
        console.error("[Processing] Error during Promise.all for summaries:", error);
        // Errors within individual summaries are caught and logged inside the async lambda
    }
}


/**
 * Orchestrates the final processing after user review:
 * Fetches current albums, updates/creates albums based on face/voice, links chats, generates summaries, and persists changes.
 *
 * @param userDecisions The decisions made by the user.
 * @param analysisResults The results from the initial analysis phase (serializable).
 * @returns Promise resolving to an object indicating success or failure, and the final list of albums (serializable).
 */
export async function finalizeUploadProcessing(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
): Promise<{ success: boolean; updatedAlbums?: Album[]; error?: string }> {
     try {
        console.log("[Finalize] Starting final processing with user decisions...");

        // --- Step 0: Verify Serializability ---
         try {
             JSON.stringify(analysisResults);
             JSON.stringify(userDecisions);
             console.log("[Finalize] Input parameters verified as serializable.");
         } catch (stringifyError) {
             console.error("[Finalize] CRITICAL ERROR: Received non-serializable input!", stringifyError);
             return { success: false, error: `Internal Server Error: Input data could not be processed (serialization failed)` };
         }

        // --- Step 1: Fetch current state of albums ---
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        // Ensure fetched albums are serializable (deep copy if needed)
        const existingAlbums = existingAlbumsRaw.map(a => JSON.parse(JSON.stringify(a)));
        console.log(`[Finalize] Fetched ${existingAlbums.length} existing albums.`);

        // --- Step 2: Create/Update Albums based on face/voice mappings ---
        const { updatedAlbums: albumsAfterFaceVoice, mediaAddedToAlbum, newUnnamedAlbums } = await createOrUpdateAlbumsFromReview(
            userDecisions, analysisResults, existingAlbums
        );
        console.log("[Finalize] Album creation/update based on face/voice review complete.");

        // --- Step 3: Link Chats based on review decisions ---
        let albumsAfterChatLinking = await linkChatsToAlbumsFromReview(
            userDecisions, analysisResults, albumsAfterFaceVoice
        );
        console.log("[Finalize] Chat linking complete.");

        // --- Step 4: Generate Summaries ---
        // Pass the mutable list `albumsAfterChatLinking`
        await generateAlbumSummaries(albumsAfterChatLinking, mediaAddedToAlbum, newUnnamedAlbums);
        console.log("[Finalize] Summary generation attempted.");

        // --- Step 5: Persist all changes ---
        await saveAlbumsToDatabase(albumsAfterChatLinking); // Pass the final, mutated list
        console.log("[Finalize] Final albums persisted to database.");

        // --- Step 6: Return Success ---
        console.log("[Finalize] Upload processing finished successfully.");
        // Ensure the final returned albums are serializable
        const finalSerializableAlbums = albumsAfterChatLinking.map(a => JSON.parse(JSON.stringify(a)));
        return { success: true, updatedAlbums: finalSerializableAlbums };

    } catch (error) {
        console.error("[Finalize Action Error] An error occurred during finalizeUploadProcessing:", error);
        let clientErrorMessage = "An error occurred while finalizing the upload.";
        if (error instanceof Error) {
             clientErrorMessage = `Failed to finalize upload: ${error.message}`;
        }
        return { success: false, error: clientErrorMessage };
    }
}
