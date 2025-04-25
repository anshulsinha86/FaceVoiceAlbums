
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
  /** Optional face ID from recognition service if available */
  recognitionId?: string;
}

/**
 * Asynchronously detects faces in an image or video file.
 * MOCK IMPLEMENTATION
 *
 * @param mediaFile The image or video File object to analyze.
 * @returns A promise that resolves to an array of DetectedFace objects.
 */
export async function detectFaces(mediaFile: File): Promise<DetectedFace[]> {
  console.log(`Mock: Detecting faces in ${mediaFile.name} (${(mediaFile.size / 1024).toFixed(1)} KB)`);
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 500));

  // Simulate finding 0 to 3 faces based on filename or random chance
  const numFaces = Math.floor(Math.random() * 4); // 0, 1, 2, or 3 faces

  if (numFaces === 0) {
    console.log(`Mock: No faces found in ${mediaFile.name}`);
    return [];
  }

  const faces: DetectedFace[] = [];
  for (let i = 0; i < numFaces; i++) {
      // Generate somewhat random bounding boxes
      const size = 50 + Math.random() * 50; // Random size between 50 and 100
      const x = Math.random() * (200 - size); // Random x pos (assuming image width ~200 for mock)
      const y = Math.random() * (150 - size); // Random y pos (assuming image height ~150 for mock)
      const confidence = 0.8 + Math.random() * 0.19; // Confidence between 0.8 and 0.99

      faces.push({
        boundingBox: {
            x: Math.round(x),
            y: Math.round(y),
            width: Math.round(size),
            height: Math.round(size * (0.9 + Math.random() * 0.2)) // Slightly variable aspect ratio
        },
        confidence: parseFloat(confidence.toFixed(2)),
        // recognitionId: `mock_face_${Date.now()}_${i}` // Simulate a unique ID if needed later
      });
  }

   console.log(`Mock: Found ${faces.length} faces in ${mediaFile.name}`);
  return faces;
}
