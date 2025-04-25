

/**
 * Represents a single media item (image, video, audio, or chat).
 */
export type MediaItem = {
  id: string | number;
  type: 'image' | 'video' | 'audio' | 'chat';
  url: string; // URL for image/video/audio, or identifier for chat data
  alt: string;
  chatData?: string; // Content for chat type
  source?: 'whatsapp' | 'instagram' | 'facebook' | 'upload'; // Origin of the chat or if it was a direct upload
  file?: File; // Keep the original File object if needed temporarily client-side
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
  media: MediaItem[]; // Media items belonging to this album
  voiceSampleUrl: string | null; // URL to a representative voice sample
  summary?: string; // AI-generated summary
};

/**
 * Represents a chat file prepared for linking during upload/review.
 * Different from MediaItem of type 'chat' which exists *within* an album.
 */
export type ChatFileLinkInfo = {
    fileId: string; // Temporary identifier based on File object (e.g., name + lastModified)
    fileName: string;
    file: File; // Keep the original file object
    source: 'whatsapp' | 'instagram' | 'facebook' | 'upload'; // Default source if not detected
    // This is the user's selection *during* the review step
    selectedAlbumId: string | 'new_unnamed' | null;
};

/**
 * Represents a detected face with a temporary ID assigned during analysis.
 */
export interface AnalyzedFace {
  tempId: string; // e.g., "face_0", "face_1" within the context of a single upload batch
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  imageDataUrl?: string; // Optional: Data URL of the cropped face for display in review
  // This is the user's selection *during* the review step
  selectedAlbumId: string | 'new_unnamed' | null; // null means 'ignore' or unassigned initially
}

/**
 * Represents an identified voice with a temporary ID during analysis.
 */
export interface AnalyzedVoice {
    tempId: string; // e.g., "voice_0"
    profileId: string; // ID from the (mock) recognition service
    name: string; // Name from the (mock) recognition service
     // This is the user's selection *during* the review step
    selectedAlbumId: string | 'new_unnamed' | null; // Link voice to an album
}


/**
 * Represents the analysis results for a single uploaded media file.
 */
export interface MediaAnalysisResult {
    originalMedia: MediaItem; // The originally uploaded item (with File object)
    analyzedFaces: AnalyzedFace[];
    analyzedVoice: AnalyzedVoice | null;
}

/**
 * Structure holding the results of the analysis phase, passed to the review modal.
 */
export interface UploadAnalysisResults {
    mediaResults: MediaAnalysisResult[];
    chatFilesToLink: ChatFileLinkInfo[];
    existingAlbums: Album[]; // To populate dropdowns for matching
}


/**
 * Structure holding the user's decisions from the review modal, passed to the finalization step.
 */
export interface UserReviewDecisions {
     faceMappings: { tempFaceId: string; assignedAlbumId: string | 'new_unnamed' | null }[];
     voiceMappings: { tempVoiceId: string; assignedAlbumId: string | 'new_unnamed' | null }[]; // If associating voices directly
     chatLinks: { fileId: string; linkedAlbumId: string | null }[]; // fileId matches ChatFileLinkInfo.fileId
}

