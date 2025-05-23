

/**
 * Represents a single media item (image, video, audio, or chat).
 */
export type MediaItem = {
  id: string | number;
  type: 'image' | 'video' | 'audio' | 'chat';
  url: string; // URL for image/video/audio, or persistent identifier for chat data
  alt: string;
  chatData?: string; // Content for chat type (loaded when needed or during processing)
  source?: 'whatsapp' | 'instagram' | 'facebook' | 'upload'; // Origin of the chat or if it was a direct upload
  file?: File; // Optional: Keep the original File object ONLY temporarily client-side or during initial server-side processing. Should NOT be stored persistently or returned from Server Actions after processing.
};

/**
 * Represents an album created based on face/voice recognition.
 */
export type Album = {
  id: string; // Unique identifier for the album (e.g., face ID or generated ID)
  name: string; // Name of the person/album (can be "Unnamed")
  mediaCount: number;
  voiceSampleAvailable: boolean;
  coverImage: string; // URL of the face thumbnail or representative image
  // IMPORTANT: Media items stored here MUST NOT contain the 'file' property.
  media: Omit<MediaItem, 'file'>[]; // Media items belonging to this album (ensure serializable)
  voiceSampleUrl: string | null; // URL to a representative voice sample
  summary?: string; // AI-generated summary
};

/**
 * Represents a chat file prepared for linking during upload/review.
 * Contains necessary info for display and linking, excluding the non-serializable File object after analysis.
 */
export type ChatFileLinkInfo = {
    fileId: string; // Temporary identifier based on File object used during the upload/analysis lifecycle
    fileName: string;
    source: 'whatsapp' | 'instagram' | 'facebook' | 'upload'; // Default source if not detected
    chatContent: string; // Store the actual content read during analysis
    // This is the user's selection *during* the review step
    selectedAlbumId: string | 'new_unnamed' | 'none' | null; // 'none' explicitly means do not link
};

/**
 * Represents a detected face with a temporary ID assigned during analysis.
 */
export interface AnalyzedFace {
  tempId: string; // e.g., "face_0", "face_1" within the context of a single upload batch
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  imageDataUrl?: string; // Optional: Placeholder URL or Data URL of the cropped face for display in review
  // This is the user's selection *during* the review step
  selectedAlbumId: string | 'new_unnamed' | 'none' | null; // 'none' means ignore/do not assign
}

/**
 * Represents an identified voice with a temporary ID during analysis.
 */
export interface AnalyzedVoice {
    tempId: string; // e.g., "voice_0"
    profileId: string; // ID from the (mock) recognition service
    name: string; // Name from the (mock) recognition service
     // This is the user's selection *during* the review step
    selectedAlbumId: string | 'new_unnamed' | 'none' | null; // 'none' means ignore/do not assign
}


/**
 * Represents the analysis results for a single uploaded media file.
 * Contains persistent URLs and analysis data, removing the File object.
 * MUST be serializable.
 */
export interface MediaAnalysisResult {
    originalMedia: Omit<MediaItem, 'file'>; // Contains persistent URL, File object removed
    analyzedFaces: AnalyzedFace[];
    analyzedVoice: AnalyzedVoice | null;
    error?: string | null; // Optional: Record any error during this specific file's analysis
}

/**
 * Structure holding the results of the analysis phase, passed to the review modal.
 * All data within this structure MUST be serializable.
 */
export interface UploadAnalysisResults {
    mediaResults: MediaAnalysisResult[]; // Contains processed MediaItems without File objects
    chatFilesToLink: ChatFileLinkInfo[]; // Contains processed ChatFileLinkInfo without File objects
    existingAlbums: Album[]; // To populate dropdowns for matching (ensure MediaItems inside don't have File objects)
}


/**
 * Structure holding the user's decisions from the review modal, passed to the finalization step.
 * MUST be serializable.
 */
export interface UserReviewDecisions {
     faceMappings: { tempFaceId: string; assignedAlbumId: string | 'new_unnamed' | 'none' | null }[]; // 'none' means ignore
     voiceMappings: { tempVoiceId: string; assignedAlbumId: string | 'new_unnamed' | 'none' | null }[]; // 'none' means ignore
     chatLinks: { fileId: string; linkedAlbumId: string | 'none' | null }[]; // 'none' means don't link
}
