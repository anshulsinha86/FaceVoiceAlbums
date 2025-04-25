/**
 * Represents a bounding box around a detected face.
 */
export interface FaceBoundingBox {
  /**
   * The x-coordinate of the top-left corner of the bounding box.
   */
  x: number;
  /**
   * The y-coordinate of the top-left corner of the bounding box.
   */
  y: number;
  /**
   * The width of the bounding box.
   */
  width: number;
  /**
   * The height of the bounding box.
   */
  height: number;
}

/**
 * Represents a detected face in an image or video frame.
 */
export interface DetectedFace {
  /**
   * The bounding box around the detected face.
   */
  boundingBox: FaceBoundingBox;
  /**
   * Confidence score of the face detection.
   */
  confidence: number;
}

/**
 * Asynchronously detects faces in an image or video.
 *
 * @param mediaUrl The URL of the image or video to analyze.
 * @returns A promise that resolves to an array of DetectedFace objects.
 */
export async function detectFaces(mediaUrl: string): Promise<DetectedFace[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      boundingBox: { x: 10, y: 20, width: 50, height: 60 },
      confidence: 0.95,
    },
  ];
}
