
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
    // Ensure no 'file' properties exist here
    ['face_alex_j', { id: 'face_alex_j', name: 'Alex Johnson', coverImage: 'https://picsum.photos/seed/face_alex_j/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person1.mp3', media: [ { id: 101, type: 'image', url: 'https://picsum.photos/seed/alex1/300/200', alt: 'Alex 1' }, { id: 102, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', alt: 'Alex video 2', source: 'upload' }, { id: 103, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Alex audio 3', source: 'upload' }, { id: 104, type: 'image', url: 'https://picsum.photos/seed/alex4/300/200', alt: 'Alex 4' } ], summary: 'Album containing images and videos of Alex Johnson.' }],
    ['face_maria_g', { id: 'face_maria_g', name: 'Maria Garcia', coverImage: 'https://picsum.photos/seed/face_maria_g/200/200', mediaCount: 2, voiceSampleAvailable: false, voiceSampleUrl: null, media: [ { id: 201, type: 'image', url: 'https://picsum.photos/seed/maria1/300/200', alt: 'Maria 1' }, { id: 202, type: 'image', url: 'https://picsum.photos/seed/maria2/300/200', alt: 'Maria 2' } ], summary: 'Images featuring Maria Garcia.' }],
    ['face_chen_w', { id: 'face_chen_w', name: 'Chen Wei', coverImage: 'https://picsum.photos/seed/face_chen_w/200/200', mediaCount: 3, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person3.mp3', media: [ { id: 301, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', alt: 'Chen video 1', source: 'upload' }, { id: 302, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Chen audio 2', source: 'upload' }, { id: 303, type: 'chat', url: 'persistent/chat_path/chat_chen_w_1_example.txt', alt: 'Chat with Chen', source: 'whatsapp', chatData: `Chen: Let's meet tomorrow.\nYou: Sounds good, what time?\nChen: How about 2 PM?\n...(more)`} ], summary: 'Videos, audio and chat history related to Chen Wei.' }],
    ['face_samira_k', { id: 'face_samira_k', name: 'Samira Khan', coverImage: 'https://picsum.photos/seed/face_samira_k/200/200', mediaCount: 4, voiceSampleAvailable: true, voiceSampleUrl: '/api/voice-sample/person5.mp3', media: [ { id: 501, type: 'image', url: 'https://picsum.photos/seed/samira1/300/200', alt: 'Samira 1' }, { id: 502, type: 'video', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', alt: 'Samira video 2', source: 'upload' }, { id: 503, type: 'image', url: 'https://picsum.photos/seed/samira3/300/200', alt: 'Samira 3' }, { id: 504, type: 'audio', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-audio/t-rex-roar.mp3', alt: 'Samira audio 4', source: 'upload' } ], summary: 'Collection of media featuring Samira Khan.' }],
]);

// Helper function to ensure serializability (removes 'file' property)
function makeMediaItemSerializable(mediaItem: MediaItem): Omit<MediaItem, 'file'> {
    const { file, ...rest } = mediaItem;
    return rest;
}
function makeAlbumSerializable(album: Album): Album {
    return {
        ...album,
        media: album.media.map(makeMediaItemSerializable)
    };
}


// --- Mock API for getting/setting album data ---
// Replace these with actual database interactions in a real app
export async function fetchAlbumsFromDatabase(): Promise<Album[]> {
    console.log("[DB Mock] Fetching albums...");
    // Simulate DB fetch delay
    await new Promise(resolve => setTimeout(resolve, 50));
    // Return a deep copy and ensure serializability
    const albums = Array.from(mockAlbumDatabase.values()).map(makeAlbumSerializable);
    console.log(`[DB Mock] Returning ${albums.length} serializable albums.`);
    return albums;
}

export async function saveAlbumsToDatabase(albums: Album[]): Promise<void> {
    console.log(`[DB Mock] Saving ${albums.length} albums...`);
    // Simulate DB save delay
    await new Promise(resolve => setTimeout(resolve, 100));
    // Update the mock database ensuring serializability
    const newDb = new Map<string, Album>();
    albums.forEach(album => {
        newDb.set(album.id, makeAlbumSerializable(album)); // Ensure data saved is clean
    });
    mockAlbumDatabase = newDb;
    console.log("[DB Mock] Database updated with serializable albums.");
}

// --- Mock Chat Content Fetching ---
export async function fetchChatContent(file: File): Promise<string> {
     console.log(`[Mock] Reading content for chat file: ${file.name}`);
     // Simulate reading file content
     await new Promise(resolve => setTimeout(resolve, 50));
     try {
         // File reading MUST happen within the server action context
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
    const seed = `${mediaFile.name}_${boundingBox.x}_${boundingBox.y}`.replace(/[^a-zA-Z0-9]/g, '');
    const placeholderUrl = `https://picsum.photos/seed/${seed}/80/80`; // Generate 80x80 placeholder

    console.log(`[Mock] Using placeholder image for face crop: ${placeholderUrl}`);
    // Return the placeholder URL directly for serialization.
    return placeholderUrl;
}


/**
 * Processes a single uploaded media file (image, video, audio) for analysis.
 * Simulates face/voice detection and returns serializable results.
 * @param mediaItem The media item containing the File object.
 * @returns Promise resolving to MediaAnalysisResult.
 */
async function analyzeSingleMediaFile(mediaItem: MediaItem): Promise<MediaAnalysisResult> {
    const startTime = Date.now();
    if (!mediaItem.file) {
        console.error(`[Analysis SF Error] MediaItem ${mediaItem.id} is missing the File object.`);
        return {
            // Ensure originalMedia is serializable even in error cases
            originalMedia: { ...makeMediaItemSerializable(mediaItem), url: `error://missing-file/${mediaItem.alt}` },
            analyzedFaces: [],
            analyzedVoice: null,
            error: "Missing file object",
        };
    }

    const file = mediaItem.file;
    console.log(`[Analysis SF] Analyzing file: ${file.name} (ID: ${mediaItem.id}, Type: ${mediaItem.type})`);
    let audioPathForVoiceAnalysis: string | null = null;
    let analyzedFaces: AnalyzedFace[] = [];
    let analyzedVoice: AnalyzedVoice | null = null;
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    let analysisError: string | null = null;
    let persistentUrl = `persistent/${mediaItem.type}/${safeFileName}`; // Default path

    try {
        // --- Audio Extraction (for Videos) ---
        if (mediaItem.type === 'video') {
            try {
                audioPathForVoiceAnalysis = await extractAudio(file);
            } catch (extractErr) {
                console.error(` -> Audio extraction failed for ${file.name}:`, extractErr);
                analysisError = `Audio extraction failed: ${extractErr instanceof Error ? extractErr.message : extractErr}`;
            }
        } else if (mediaItem.type === 'audio') {
            audioPathForVoiceAnalysis = persistentUrl; // Use the final path for audio analysis
        }

        // --- Concurrent Face and Voice Analysis ---
        const analysisPromises: [Promise<AnalyzedFace[]>, Promise<AnalyzedVoice | null>] =
            [Promise.resolve([]), Promise.resolve(null)]; // Defaults

        // Face Detection for Images and Videos
        if (mediaItem.type === 'video' || mediaItem.type === 'image') {
            analysisPromises[0] = (async () => {
                try {
                    const detectedFaces = await detectFaces(file);
                    const facesWithDetails = await Promise.all(
                        detectedFaces.map(async (face, index) => {
                            const tempId = `${mediaItem.id}_face_${index}`;
                             let imageDataUrl: string | undefined = undefined;
                            try {
                                imageDataUrl = await cropFace(file, face.boundingBox);
                            } catch (cropErr) {
                                console.error(` -> Face cropping failed for tempId ${tempId} from ${file.name}:`, cropErr);
                                // Don't set analysisError here, just skip the image URL
                            }
                            return {
                                ...face, // Includes boundingBox, confidence
                                tempId: tempId,
                                imageDataUrl: imageDataUrl, // Store the URL (or undefined)
                                selectedAlbumId: null, // Initialize selection
                            };
                        })
                    );
                    console.log(` -> Found ${facesWithDetails.length} faces in ${file.name}`);
                    return facesWithDetails;
                } catch (faceErr) {
                    console.error(` -> Face detection failed for ${file.name}:`, faceErr);
                    analysisError = (analysisError ? `${analysisError}; ` : '') + `Face detection failed: ${faceErr instanceof Error ? faceErr.message : faceErr}`;
                    return []; // Return empty array on failure
                }
            })();
        }

        // Voice Identification if audio is available
        if (audioPathForVoiceAnalysis) {
            analysisPromises[1] = (async () => {
                try {
                    const voiceProfile = await identifySpeaker(audioPathForVoiceAnalysis);
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
                } catch (voiceErr) {
                    console.error(` -> Voice identification failed for audio from ${file.name}:`, voiceErr);
                     analysisError = (analysisError ? `${analysisError}; ` : '') + `Voice ID failed: ${voiceErr instanceof Error ? voiceErr.message : voiceErr}`;
                    return null; // Return null on failure
                }
            })();
        }

        [analyzedFaces, analyzedVoice] = await Promise.all(analysisPromises);

    } catch (error) {
        console.error(`[Analysis SF Error] Top-level error during analysis of ${file.name}:`, error);
        analysisError = `Unexpected analysis error: ${error instanceof Error ? error.message : String(error)}`;
        // Reset results on major error
        analyzedFaces = [];
        analyzedVoice = null;
    }

    // Simulate storing the file (could involve actual upload to cloud storage here)
    console.log(` -> Simulating storage: ${file.name} stored at ${persistentUrl}`);

    // Construct the final serializable result
    const serializableMediaItem = {
        ...makeMediaItemSerializable(mediaItem),
        url: persistentUrl, // Use the persistent path
    };

    const result: MediaAnalysisResult = {
        originalMedia: serializableMediaItem,
        analyzedFaces: analyzedFaces,
        analyzedVoice: analyzedVoice,
        error: analysisError,
    };

     // Double-check serializability before returning
     try {
        JSON.stringify(result);
     } catch (e) {
        console.error(`[Analysis SF Error] Failed to serialize result for ${file.name}!`, e, result);
        // Attempt to salvage by removing potentially problematic parts
        result.analyzedFaces = []; // Clear faces if they cause issues
        result.analyzedVoice = null;
        result.error = (result.error ? `${result.error}; ` : '') + `Serialization failed: ${e instanceof Error ? e.message : e}`;
        // Try serializing the minimal error structure
        try {
             JSON.stringify(result);
        } catch (finalError) {
             console.error(`[Analysis SF Error] Cannot even serialize minimal error structure for ${file.name}`);
              // Return a very basic error structure
              return {
                 originalMedia: { id: mediaItem.id, type: mediaItem.type, url: `error://serialization-failed/${safeFileName}`, alt: file.name },
                 analyzedFaces: [],
                 analyzedVoice: null,
                 error: `Fatal serialization error: ${finalError instanceof Error ? finalError.message : finalError}`,
             };
        }
     }

    console.log(`[Analysis SF] Finished analyzing ${file.name} in ${Date.now() - startTime}ms. Errors: ${analysisError ? 'Yes' : 'No'}`);
    return result;
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
    const startTime = Date.now();
    console.log(`[Analysis Action] Starting analysis for ${uploadedFiles.length} files...`);

    // Input Validation: Ensure uploadedFiles is an array
    if (!Array.isArray(uploadedFiles)) {
        console.error("[Analysis Action Error] Invalid input: uploadedFiles is not an array.");
        throw new Error("Invalid input: Expected an array of files.");
    }

    const mediaItemsToAnalyze: MediaItem[] = [];
    const chatFileInfos: {file: File, fileId: string, source: ChatFileLinkInfo['source']}[] = [];

    // --- 1. Categorize files and create initial MediaItem/ChatFileLinkInfo objects ---
    try {
        uploadedFiles.forEach((file, index) => {
            // Basic file validation
            if (!(file instanceof File)) {
                 console.warn(`[Analysis Action] Skipping invalid file entry at index ${index}. Not a File object.`);
                 return; // Skip this entry
            }

            const fileId = `upload_${Date.now()}_${index}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`; // Sanitize ID

            let mediaType: MediaItem['type'] | null = null;
            if (file.type.startsWith('image/')) mediaType = 'image';
            else if (file.type.startsWith('video/')) mediaType = 'video';
            else if (file.type.startsWith('audio/')) mediaType = 'audio';
            else if (file.type.startsWith('text/') || file.name.endsWith('.txt')) mediaType = 'chat';

            if (mediaType && mediaType !== 'chat') {
                // NOTE: Object URLs are NOT created here. The 'file' object is passed directly.
                // The URL will be assigned the persistent path after analysis/mock storage.
                mediaItemsToAnalyze.push({
                    id: fileId,
                    type: mediaType,
                    url: `temp://processing/${file.name}`, // Temporary placeholder URL
                    alt: file.name,
                    source: 'upload',
                    file: file, // Keep File object for analysis ONLY within this action
                });
            } else if (mediaType === 'chat') {
                let source: ChatFileLinkInfo['source'] = 'upload';
                if (file.name.toLowerCase().includes('whatsapp')) source = 'whatsapp';
                // Add other chat sources if needed
                chatFileInfos.push({ file, fileId, source });
                console.log(`[Analysis Action] Identified chat file: ${file.name}`);
            } else {
                console.warn(`[Analysis Action] Skipping unsupported file type: ${file.name} (${file.type})`);
            }
        });
    } catch (categorizationError) {
         console.error("[Analysis Action Error] Error during file categorization:", categorizationError);
         throw new Error(`Error preparing files for analysis: ${categorizationError instanceof Error ? categorizationError.message : String(categorizationError)}`);
    }

    // --- 2. Analyze Media Files Concurrently ---
    let mediaResults: MediaAnalysisResult[] = [];
    try {
        console.log(`[Analysis Action] Analyzing ${mediaItemsToAnalyze.length} media files...`);
        mediaResults = await Promise.all(mediaItemsToAnalyze.map(analyzeSingleMediaFile));
        console.log("[Analysis Action] Media analysis promises resolved.");
    } catch (mediaAnalysisError) {
         console.error("[Analysis Action Error] Error during media analysis phase:", mediaAnalysisError);
         // We might have partial results in mediaResults, include them but add a general error?
         // For now, rethrow to indicate a major failure in this step.
         throw new Error(`Error analyzing media files: ${mediaAnalysisError instanceof Error ? mediaAnalysisError.message : String(mediaAnalysisError)}`);
    }

    // --- 3. Read Chat File Content Concurrently ---
    let chatFilesToLink: ChatFileLinkInfo[] = [];
    try {
        console.log(`[Analysis Action] Reading content for ${chatFileInfos.length} chat files...`);
        chatFilesToLink = await Promise.all(
            chatFileInfos.map(async ({ file, fileId, source }) => {
                let content = `[Error reading chat file ${file.name}]`; // Default error content
                try {
                    content = await fetchChatContent(file);
                } catch (chatReadError) {
                    console.error(` -> Error reading chat file ${file.name}:`, chatReadError);
                     // Keep the default error content assigned above
                }
                return {
                    fileId: fileId,
                    fileName: file.name,
                    source: source,
                    chatContent: content, // Include potentially error message content
                    selectedAlbumId: null,
                };
            })
        );
        console.log("[Analysis Action] Chat content reading complete.");
    } catch (chatReadingError) {
        console.error("[Analysis Action Error] Error during chat reading phase:", chatReadingError);
        // Proceed with empty chat list? Or throw? Let's proceed but log.
        chatFilesToLink = []; // Reset to empty on major failure
         // Consider adding a top-level error indicator if needed
    }

    // --- 4. Fetch Existing Albums for Linking ---
    let existingAlbums: Album[] = [];
    try {
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        // Ensure serializability of fetched albums
        existingAlbums = existingAlbumsRaw.map(makeAlbumSerializable);
        console.log(`[Analysis Action] Fetched ${existingAlbums.length} existing albums.`);
    } catch (fetchError) {
        console.error("[Analysis Action Error] Failed to fetch existing albums:", fetchError);
        throw new Error(`Failed to load existing album data: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }

    // --- 5. Construct Final Serializable Results ---
    const results: UploadAnalysisResults = {
        mediaResults, // Already made serializable in analyzeSingleMediaFile
        chatFilesToLink, // Content is string, should be serializable
        existingAlbums, // Made serializable after fetch
    };

    // --- 6. Final Serialization Check (Crucial) ---
    try {
        // Deep serialization check
        const serialized = JSON.stringify(results);
        JSON.parse(serialized); // Verify parsing works too
        console.log(`[Analysis Action] Analysis results successfully verified as serializable. Size: ${(serialized.length / 1024).toFixed(1)} KB`);
    } catch (e) {
        console.error("[Analysis Action Error] CRITICAL: Final analysis results are NOT serializable!", e);
        // Attempt to log problematic parts
        results.mediaResults.forEach((res, i) => { try { JSON.stringify(res); } catch (err) { console.error(` -> Non-serializable mediaResult at index ${i}:`, res, err); } });
        results.chatFilesToLink.forEach((res, i) => { try { JSON.stringify(res); } catch (err) { console.error(` -> Non-serializable chatFileToLink at index ${i}:`, res, err); } });
        results.existingAlbums.forEach((res, i) => { try { JSON.stringify(res); } catch (err) { console.error(` -> Non-serializable existingAlbum at index ${i}:`, res, err); } });
        throw new Error(`Internal Server Error: Failed to serialize analysis results. ${e instanceof Error ? e.message : String(e)}`);
    }

    console.log(`[Analysis Action] Completed in ${Date.now() - startTime}ms. Returning results.`);
    return results;
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
    // Use Map for efficient lookup and update, ensure deep copy for modification
    const albumsMap: Map<string, Album> = new Map(
        existingAlbums.map(a => [a.id, JSON.parse(JSON.stringify(a))])
    );
    const newUnnamedAlbums: Map<string, Album> = new Map();
    const mediaAddedToAlbum: Map<string, Set<string | number>> = new Map();
    existingAlbums.forEach(album => mediaAddedToAlbum.set(album.id, new Set()));
    const processedMediaIds = new Set<string | number>(); // Track media added this run

    // Helper to safely add media ensuring serializability
    const addMediaToAlbum = (album: Album, media: MediaItem) => {
        // Create serializable version FIRST
        const serializableMedia = makeMediaItemSerializable(media);
        if (!album.media.some(m => m.id === serializableMedia.id)) {
            album.media.push(serializableMedia); // Add the serializable version
            album.mediaCount = album.media.length;
            if (!mediaAddedToAlbum.has(album.id)) {
                mediaAddedToAlbum.set(album.id, new Set());
            }
            mediaAddedToAlbum.get(album.id)!.add(serializableMedia.id);
            console.log(`   - Added media ${serializableMedia.id} (${serializableMedia.alt}) to album ${album.id}`);
            processedMediaIds.add(serializableMedia.id); // Mark as processed
            return true;
        }
        console.log(`   - Media ${serializableMedia.id} (${serializableMedia.alt}) already in album ${album.id}.`);
        return false;
    };

    // Helper to update cover image
    const updateCoverImage = (album: Album, face: AnalyzedFace | null, media: MediaItem) => {
        const currentCoverIsPlaceholder = !album.coverImage || album.coverImage.includes('placeholder') || album.coverImage.includes('picsum');
        // Use face placeholder URL if available and needed
        if (face?.imageDataUrl && currentCoverIsPlaceholder && !face.imageDataUrl.startsWith('data:')) {
            album.coverImage = face.imageDataUrl;
            console.log(`   - Updated cover image for album ${album.id} with face placeholder URL.`);
        }
        // Otherwise, use media URL if it's an image/video and cover is placeholder
        else if ((media.type === 'image' || media.type === 'video') && currentCoverIsPlaceholder) {
            album.coverImage = media.url; // Use the persistent media URL
            console.log(`   - Updated cover image for album ${album.id} with media URL.`);
        }
    };

     // Helper to update voice sample URL
    const updateVoiceSample = (album: Album, voice: AnalyzedVoice | null, media: MediaItem) => {
        if (!album.voiceSampleUrl && voice) {
            let voiceUrl: string | null = null;
            if (media.type === 'audio') {
                voiceUrl = media.url; // Use persistent audio URL
            } else if (media.type === 'video') {
                // Construct the expected path for extracted audio
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

    // Helper to find the full MediaAnalysisResult containing a temp ID
    const findMediaResultByTempId = (tempId: string): MediaAnalysisResult | undefined => {
        return analysisResults.mediaResults.find(res =>
            res.analyzedFaces.some(f => f.tempId === tempId) || res.analyzedVoice?.tempId === tempId
        );
    };

    // --- 1. Process Face Mappings ---
    for (const faceMap of userDecisions.faceMappings) {
        const { tempFaceId, assignedAlbumId } = faceMap;
        if (assignedAlbumId === null || assignedAlbumId === 'none') {
            console.log(` -> Ignoring face ${tempFaceId}.`);
            continue;
        }

        const resultContainingFace = findMediaResultByTempId(tempFaceId);
        if (!resultContainingFace?.originalMedia) {
             console.warn(`[Processing] Could not find original media for face ${tempFaceId}. Skipping.`);
            continue;
        }
        const analyzedFace = resultContainingFace.analyzedFaces.find(f => f.tempId === tempFaceId);
        if (!analyzedFace) {
             console.warn(`[Processing] AnalyzedFace object not found for ${tempFaceId}. Skipping.`);
             continue;
        }
        const mediaItemToAdd = resultContainingFace.originalMedia; // This is already serializable

        // Check if this media was already added in this run (e.g., by another face/voice from same file)
        if (processedMediaIds.has(mediaItemToAdd.id)) {
            console.log(` -> Media ${mediaItemToAdd.id} already processed. Skipping duplicate add for face ${tempFaceId}.`);
            continue;
        }

        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (assignedAlbumId === 'new_unnamed') {
            targetAlbumId = `album_unnamed_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
            console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) for face ${tempFaceId} from ${mediaItemToAdd.alt}`);

            const associatedVoice = resultContainingFace.analyzedVoice;
            // Check if the voice from the SAME media file is ALSO mapped to 'new_unnamed'
            const voiceAlsoMappedToNew = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === 'new_unnamed'
            );

            targetAlbum = {
                id: targetAlbumId, name: 'Unnamed',
                coverImage: analyzedFace.imageDataUrl || // Use face placeholder URL if available
                              (mediaItemToAdd.type === 'image' || mediaItemToAdd.type === 'video' ? mediaItemToAdd.url : '') ||
                              'https://picsum.photos/seed/placeholder/200/200', // Fallback
                media: [], // Start empty
                mediaCount: 0,
                voiceSampleAvailable: false, voiceSampleUrl: null, summary: ''
            };
            albumsMap.set(targetAlbumId, targetAlbum); // Add to our working map
            newUnnamedAlbums.set(targetAlbumId, targetAlbum); // Track as new
            mediaAddedToAlbum.set(targetAlbumId, new Set()); // Initialize tracking set

            // Update voice sample if the co-occurring voice is also mapped here
            if (voiceAlsoMappedToNew && associatedVoice) {
                updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);
            }
        } else {
            targetAlbumId = assignedAlbumId;
            targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
                console.warn(`[Processing] Target album ${targetAlbumId} not found for face ${tempFaceId}. Skipping.`);
                continue;
            }
            console.log(` -> Assigning face ${tempFaceId} (from ${mediaItemToAdd.alt}) to album '${targetAlbum.name}' (${targetAlbumId})`);
        }

        // Add media, update cover, potentially update voice sample
        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) { // If media was actually added (not duplicate)
            updateCoverImage(targetAlbum, analyzedFace, mediaItemToAdd);

            const associatedVoice = resultContainingFace.analyzedVoice;
            // Check if the voice from the SAME media file is mapped to THIS album
            const voiceMappedToThisAlbum = userDecisions.voiceMappings.some(vm =>
                 vm.tempVoiceId === associatedVoice?.tempId && vm.assignedAlbumId === targetAlbumId
             );
            if (voiceMappedToThisAlbum && associatedVoice) {
                 updateVoiceSample(targetAlbum, associatedVoice, mediaItemToAdd);
            }
        }
    }

     // --- 2. Process Direct Voice Mappings (ONLY IF face wasn't mapped) ---
     // Iterate through voice mappings again, but only act if the media wasn't already processed
     for (const voiceMap of userDecisions.voiceMappings) {
        const { tempVoiceId, assignedAlbumId } = voiceMap;
        if (assignedAlbumId === null || assignedAlbumId === 'none') {
            console.log(` -> Ignoring voice ${tempVoiceId}.`);
            continue;
        }

        const resultContainingVoice = findMediaResultByTempId(tempVoiceId);
        if (!resultContainingVoice?.originalMedia || !resultContainingVoice.analyzedVoice) {
            console.warn(`[Processing] Could not find media/voice details for voice ${tempVoiceId}. Skipping.`);
            continue;
        }
        const mediaItemToAdd = resultContainingVoice.originalMedia;
        const analyzedVoice = resultContainingVoice.analyzedVoice;

        // **** Crucial Check: Skip if this media item was ALREADY processed ****
        if (processedMediaIds.has(mediaItemToAdd.id)) {
            console.log(` -> Media ${mediaItemToAdd.id} (containing voice ${tempVoiceId}) already processed via face mapping or earlier voice mapping. Skipping.`);
            continue;
        }

        // This voice mapping is only relevant if NO face from the same media file was assigned.
        // (The face assignment loop above handles adding media and associating voices if a face is mapped).
        const faceWasMapped = userDecisions.faceMappings.some(fm =>
            (fm.assignedAlbumId !== null && fm.assignedAlbumId !== 'none') &&
            resultContainingVoice.analyzedFaces.some(f => f.tempId === fm.tempFaceId)
        );

        if (faceWasMapped) {
            console.log(` -> Skipping direct voice mapping for ${tempVoiceId} as a face from the same media (${mediaItemToAdd.alt}) was mapped.`);
            continue; // Handled by the face loop
        }

        // If we reach here: a voice was detected, assigned by user, BUT no face from the same media was assigned.
        let targetAlbum: Album | undefined;
        let targetAlbumId: string;

        if (assignedAlbumId === 'new_unnamed') {
             targetAlbumId = `album_unnamed_voice_${Date.now()}_${Math.random().toString(16).substring(2, 8)}`;
             console.log(` -> Creating new unnamed album (ID: ${targetAlbumId}) solely for voice ${tempVoiceId} from ${mediaItemToAdd.alt}`);

             targetAlbum = {
                id: targetAlbumId, name: `Unnamed (${analyzedVoice.name || 'Voice'})`, // More specific name
                coverImage: 'https://picsum.photos/seed/voice_placeholder/200/200', // Generic voice cover
                media: [], mediaCount: 0, voiceSampleAvailable: false, voiceSampleUrl: null, summary: ''
             };
             albumsMap.set(targetAlbumId, targetAlbum);
             newUnnamedAlbums.set(targetAlbumId, targetAlbum);
             mediaAddedToAlbum.set(targetAlbumId, new Set());
             // Update voice sample for this new voice-only album
             updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd);

        } else {
           targetAlbumId = assignedAlbumId;
           targetAlbum = albumsMap.get(targetAlbumId);
            if (!targetAlbum) {
               console.warn(`[Processing] Target album ${targetAlbumId} not found for voice ${tempVoiceId}. Skipping.`);
               continue;
           }
            console.log(` -> Assigning voice ${tempVoiceId} (from ${mediaItemToAdd.alt}) directly to album '${targetAlbum.name}' (${targetAlbumId}) because no face was mapped`);
        }

        // Add media, update cover (generic), update voice sample
        if (addMediaToAlbum(targetAlbum, mediaItemToAdd)) {
            updateCoverImage(targetAlbum, null, mediaItemToAdd); // Update cover if needed (likely generic)
            updateVoiceSample(targetAlbum, analyzedVoice, mediaItemToAdd);
        }
   }

    // --- 3. Convert Map back to Array ---
    const finalAlbums = Array.from(albumsMap.values());

    console.log("[Processing] Albums after face/voice review:", finalAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount })));
    return { updatedAlbums: finalAlbums, mediaAddedToAlbum, newUnnamedAlbums };
}


/**
 * Links chat files to albums based on user decisions.
 * Assumes albums have potentially been created/updated.
 *
 * @param userDecisions User's choices.
 * @param analysisResults Original analysis results containing chat content.
 * @param currentAlbums The state of albums *after* face/voice processing (mutable list).
 * @returns The updated list of albums with chats linked (serializable).
 */
export async function linkChatsToAlbumsFromReview(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
    currentAlbums: Album[] // Assume this list is mutable and changes will persist
): Promise<Album[]> {
     console.log("[Processing] Linking chats based on review decisions:", userDecisions.chatLinks);
     const albumsMap = new Map(currentAlbums.map(a => [a.id, a])); // Use the passed list directly

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
             // Simulate storing chat content and getting a persistent identifier/URL
             const safeFileName = chatInfo.fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
             // Use fileId in the path for better uniqueness guarantee than just filename
             const persistentChatUrl = `persistent/chat/${chatInfo.fileId}_${safeFileName}`;
             console.log(`   - Simulating storage: ${chatInfo.fileName} content stored at ${persistentChatUrl}`);
             // TODO: In a real app, upload chatInfo.chatContent to cloud storage at persistentChatUrl

             // Create the serializable MediaItem for the chat
             const chatMediaItem: MediaItem = {
                 id: `chat_${chatInfo.fileId}`, // Use a more deterministic ID
                 type: 'chat',
                 url: persistentChatUrl, // Represents stored chat reference
                 alt: `Chat: ${chatInfo.fileName}`,
                 source: chatInfo.source,
                 chatData: chatInfo.chatContent, // Include content for display
                 // Ensure NO File object here
             };

             // Check if this exact chat URL is already linked
             if (!targetAlbum.media.some(m => m.type === 'chat' && m.url === chatMediaItem.url)) {
                targetAlbum.media.push(chatMediaItem); // Add the serializable item
                targetAlbum.mediaCount = targetAlbum.media.length;
                console.log(` -> Linked chat ${chatInfo.fileName} (URL: ${chatMediaItem.url}) to album '${targetAlbum.name}' (${targetAlbum.id})`);
             } else {
                 console.log(` -> Chat ${chatInfo.fileName} (URL: ${chatMediaItem.url}) already linked to album '${targetAlbum.name}'. Skipping duplicate.`);
             }

        } catch (error) {
             console.error(`[Processing] Error linking chat file ${chatInfo.fileName}:`, error);
             // Optionally add error info to the album or log externally
        }
     }

     // Return the modified list (or convert Map back if preferred)
     console.log("[Processing] Albums after linking chats:", currentAlbums.map(a => ({ id: a.id, name: a.name, count: a.mediaCount, hasChat: a.media.some(m=>m.type==='chat') })));
     return currentAlbums;
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
        // Regenerate if new, updated, or summary missing/failed previously
        const needsSummaryUpdate = isNewAlbumThisRun || wasMediaAddedThisRun || !album.summary || album.summary.startsWith('[Summary generation failed');

        if (needsSummaryUpdate && album.media.length > 0) {
            console.log(` -> Queueing summary generation for ${isNewAlbumThisRun ? 'new' : 'updated'} album ${album.id} ('${album.name}')`);
            summaryPromises.push(
                (async () => {
                    try {
                        // Create a more detailed description for the AI
                        const mediaTypes = [...new Set(album.media.map(m => m.type))];
                        const counts = mediaTypes.map(type => `${album.media.filter(m => m.type === type).length} ${type}(s)`).join(', ');
                        let description = `Summarize this photo/video album for ${album.name === 'Unnamed' ? 'an unnamed person' : `"${album.name}"`}. `;
                        description += `It contains ${album.mediaCount} items total (${counts}). `;
                        if (album.voiceSampleAvailable) description += `A voice sample is available. `;

                        // Include snippet of first chat if available
                        const firstChat = album.media.find(m => m.type === 'chat');
                        if (firstChat?.chatData) {
                            const snippet = firstChat.chatData.substring(0, 150).replace(/\n/g, ' ');
                            description += `A linked chat starts with: "${snippet}...". `;
                        }
                        description += `Generate a concise, engaging summary (1-2 sentences).`;

                        const summaryResult = await summarizeAlbumContent({ albumDescription: description });
                        // IMPORTANT: Mutate the album object passed into this function
                        album.summary = summaryResult.summary;
                        console.log(` -> Summary generated for album ${album.id}: "${album.summary.substring(0, 50)}..."`);
                    } catch (error) {
                        console.error(`[Processing] AI Summary Generation Failed for album ${album.id}:`, error);
                        // Mutate the album object with error info
                        album.summary = `[Summary generation failed: ${error instanceof Error ? error.message : 'AI error'}]`;
                    }
                })()
            );
        } else if (needsSummaryUpdate && album.media.length === 0) {
             console.log(` -> Skipping summary generation for album ${album.id} ('${album.name}') as it has no media.`);
             album.summary = "[Album is empty]"; // Update summary for empty albums
        } else if (!needsSummaryUpdate) {
             console.log(` -> Skipping summary generation for album ${album.id} ('${album.name}') - no changes requiring update.`);
        }
    }

    try {
        await Promise.all(summaryPromises);
        console.log("[Processing] Summary generation attempts complete.");
    } catch (error) {
        // This catch is unlikely to be hit due to individual catches, but good practice
        console.error("[Processing] Error during Promise.all for summaries (should have been caught individually):", error);
    }
}


/**
 * Orchestrates the final processing after user review:
 * Fetches current albums, updates/creates albums based on face/voice, links chats, generates summaries, and persists changes.
 * Ensures all returned data is serializable.
 *
 * @param userDecisions The decisions made by the user (must be serializable).
 * @param analysisResults The results from the initial analysis phase (must be serializable).
 * @returns Promise resolving to an object indicating success or failure, and the final list of albums (serializable).
 */
export async function finalizeUploadProcessing(
    userDecisions: UserReviewDecisions,
    analysisResults: UploadAnalysisResults,
): Promise<{ success: boolean; updatedAlbums?: Album[]; error?: string }> {
    const startTime = Date.now();
     try {
        console.log("[Finalize Action] Starting final processing with user decisions...");

        // --- Step 0: Verify Input Serializability (Crucial for Server Actions) ---
         try {
             // Attempt to stringify inputs to catch issues early
             JSON.stringify(userDecisions);
             JSON.stringify(analysisResults);
             console.log("[Finalize Action] Input parameters verified as serializable.");
         } catch (stringifyError) {
             console.error("[Finalize Action Error] CRITICAL: Received non-serializable input!", stringifyError);
             // Provide a detailed error message if possible
             let errorSource = "unknown";
             try { JSON.stringify(userDecisions); } catch (e) { errorSource = "userDecisions"; }
             try { JSON.stringify(analysisResults); } catch (e) { errorSource = "analysisResults"; }
             return { success: false, error: `Internal Server Error: Input data (${errorSource}) could not be processed (serialization failed).` };
         }

        // --- Step 1: Fetch current state of albums ---
        const existingAlbumsRaw = await fetchAlbumsFromDatabase();
        // Ensure fetched albums are serializable (map already does this)
        const existingAlbums = existingAlbumsRaw; // Already serializable from fetch function
        console.log(`[Finalize Action] Fetched ${existingAlbums.length} existing albums.`);

        // --- Step 2: Create/Update Albums based on face/voice mappings ---
        // This function returns serializable albums
        const { updatedAlbums: albumsAfterFaceVoice, mediaAddedToAlbum, newUnnamedAlbums } = await createOrUpdateAlbumsFromReview(
            userDecisions, analysisResults, existingAlbums
        );
        console.log("[Finalize Action] Album creation/update based on face/voice review complete.");

        // --- Step 3: Link Chats based on review decisions ---
        // Pass the potentially modified list; the function modifies it in place and returns the same list reference
        let albumsAfterChatLinking = await linkChatsToAlbumsFromReview(
            userDecisions, analysisResults, albumsAfterFaceVoice // Pass the updated list
        );
        console.log("[Finalize Action] Chat linking complete.");

        // --- Step 4: Generate Summaries ---
        // Pass the mutable list `albumsAfterChatLinking`; function updates summaries in place
        await generateAlbumSummaries(albumsAfterChatLinking, mediaAddedToAlbum, newUnnamedAlbums);
        console.log("[Finalize Action] Summary generation attempted.");

        // --- Step 5: Persist all changes ---
        // The list `albumsAfterChatLinking` now contains all updates
        await saveAlbumsToDatabase(albumsAfterChatLinking);
        console.log("[Finalize Action] Final albums persisted to database.");

        // --- Step 6: Return Success with Serializable Data ---
        // Ensure the final returned data is explicitly serializable (though it should be already)
        const finalSerializableAlbums = albumsAfterChatLinking.map(makeAlbumSerializable);

        // Final check before returning
        try {
            JSON.stringify(finalSerializableAlbums);
        } catch (finalSerializeError) {
             console.error("[Finalize Action Error] CRITICAL: Final album list is NOT serializable before returning!", finalSerializeError);
             return { success: false, error: `Internal Server Error: Could not serialize final album results. ${finalSerializeError instanceof Error ? finalSerializeError.message : ''}` };
        }

        console.log(`[Finalize Action] Upload processing finished successfully in ${Date.now() - startTime}ms.`);
        return { success: true, updatedAlbums: finalSerializableAlbums };

    } catch (error) {
        console.error("[Finalize Action Error] An uncaught error occurred during finalizeUploadProcessing:", error);
        // Avoid leaking detailed internal errors to the client
        let clientErrorMessage = "An unexpected error occurred while finalizing the upload.";
        if (error instanceof Error) {
             // Log the full error server-side
             console.error("Detailed error:", error.stack);
             // Provide a slightly more specific but still safe message
             if (error.message.includes("serialize")) {
                 clientErrorMessage = "A data processing error occurred while finalizing the upload.";
             } else if (error.message.includes("database") || error.message.includes("fetch")) {
                 clientErrorMessage = "A database error occurred while finalizing the upload.";
             }
             // Add other specific cases if needed
        }
        return { success: false, error: clientErrorMessage };
    }
}
