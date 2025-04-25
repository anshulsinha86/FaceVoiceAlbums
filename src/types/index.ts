
/**
 * Represents a single media item (image, video, audio, or chat).
 */
export type MediaItem = {
  id: string | number;
  type: 'image' | 'video' | 'audio' | 'chat';
  url: string; // URL for image/video/audio, or identifier for chat data
  alt: string;
  chatData?: string; // Content for chat type
  source?: 'whatsapp' | 'instagram' | 'facebook' | 'upload'; // Origin of the chat
};

/**
 * Represents an album created based on face/voice recognition.
 */
export type Album = {
  id: string; // Unique identifier for the album (e.g., face ID)
  name: string; // Name of the person/album (can be "Unnamed")
  mediaCount: number;
  voiceSampleAvailable: boolean;
  coverImage: string; // URL of the face thumbnail
  media: MediaItem[]; // Media items belonging to this album
  voiceSampleUrl: string | null;
  summary?: string;
};

/**
 * Represents a chat file linked to an album.
 */
export type LinkedChat = {
    fileId: string; // Identifier for the uploaded chat file
    fileName: string;
    source: 'whatsapp' | 'instagram' | 'facebook';
    linkedAlbumId: string | null; // ID of the album it's linked to
};
