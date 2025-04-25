# FaceVoiceAlbums

This is a Next.js application designed to automatically organize media files based on detected faces and voices.

## Features

*   **Media Upload:** Upload images, videos, audio files, and chat history (.txt).
*   **Face & Voice Recognition:** (Simulated) Detects faces in images/videos and identifies voices in audio/videos.
*   **Automatic Album Creation:** Creates albums for each unique face detected. Unnamed albums are created for new faces, which can be renamed.
*   **Media Organization:** Groups uploaded media into the corresponding face albums.
*   **Chat Linking:** Allows manually linking chat history files to specific face albums during upload.
*   **Media Viewing:** In-app viewers for images (zoom/pan), videos (player controls), and chats.
*   **PWA Ready:** Includes a manifest file for Progressive Web App features, allowing users to "install" the web app to their home screen on supported devices (Android/iOS).

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Set up environment variables:**
    *   Create a `.env.local` file (copy from `.env` if it exists).
    *   Add necessary API keys (e.g., `GOOGLE_GENAI_API_KEY` for AI summarization).
    ```env
    GOOGLE_GENAI_API_KEY=YOUR_API_KEY_HERE
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```
4.  **Run the Genkit development flow (optional, for AI features):**
    ```bash
    npm run genkit:dev
    ```
    Open [http://localhost:9002](http://localhost:9002) (or your configured port) with your browser to see the result.

## Important Considerations

*   **Encryption & Storage:**
    *   **This frontend application does NOT implement file encryption.** Implementing robust, cross-platform file encryption requires a secure backend service and appropriate storage solutions (like encrypted cloud storage). File storage directly "within an app folder" on the user's device is not feasible or secure for a web application due to browser limitations.
    *   Uploaded files in this demo are handled client-side (using Object URLs temporarily) and then simulated as being processed and stored. A real-world application would need a backend to handle uploads, persistent storage (e.g., Firebase Storage, AWS S3), and encryption.
*   **Cross-Platform Compatibility:**
    *   The application is built with Next.js and is primarily a **web application**, accessible via any modern web browser.
    *   It includes basic **Progressive Web App (PWA)** features (via `manifest.json`), allowing users to add it to their home screen on Android and iOS for a more app-like experience.
    *   This is **NOT a native Android or iOS app**. Building a fully native application would require separate development using tools like React Native, Flutter, Swift (iOS), or Kotlin (Android).
*   **Face/Voice Recognition:**
    *   The face and voice recognition features (`src/services/`) are currently **simulated**. They return mock data. Integrating actual recognition services (like cloud AI APIs or on-device models) is required for real functionality.
*   **Placeholder Icons:** The PWA icons (`public/icons/`) are text placeholders as image generation is not supported. Replace these with actual image files for a production application.

## Key Technologies

*   Next.js (App Router)
*   React
*   TypeScript
*   Tailwind CSS
*   Shadcn/ui
*   Lucide Icons
*   Genkit (for AI flows - currently summarization)
*   Zod (for schema validation)
