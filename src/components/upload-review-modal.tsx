
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, FileText, Link2, AlertTriangle } from 'lucide-react';
import type { UploadAnalysisResults, UserReviewDecisions, Album, AnalyzedFace, ChatFileLinkInfo, AnalyzedVoice } from '@/types';

interface UploadReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (decisions: UserReviewDecisions) => void;
  analysisResults: UploadAnalysisResults;
  isProcessing: boolean; // To disable confirm button during finalization
}

// Helper type for managing local state of assignments
type FaceAssignment = { tempId: string; selectedAlbumId: string | 'new_unnamed' | null };
type VoiceAssignment = { tempId: string; selectedAlbumId: string | 'new_unnamed' | null };
type ChatAssignment = { fileId: string; selectedAlbumId: string | null };


export function UploadReviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisResults,
  isProcessing,
}: UploadReviewModalProps) {

  // Local state to track user selections within the modal
  const [faceAssignments, setFaceAssignments] = useState<FaceAssignment[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);
  const [chatAssignments, setChatAssignments] = useState<ChatAssignment[]>([]);

  // Initialize local state when analysisResults change (modal opens)
  useEffect(() => {
    if (isOpen && analysisResults) {
      const initialFaceAssignments = analysisResults.mediaResults.flatMap(res =>
        res.analyzedFaces.map(face => ({ tempId: face.tempId, selectedAlbumId: face.selectedAlbumId })) // Use initial value from analysis if any
      );
      const initialVoiceAssignments = analysisResults.mediaResults
        .filter(res => res.analyzedVoice)
        .map(res => ({ tempId: res.analyzedVoice!.tempId, selectedAlbumId: res.analyzedVoice!.selectedAlbumId }));

      const initialChatAssignments = analysisResults.chatFilesToLink.map(chat => ({
        fileId: chat.fileId, selectedAlbumId: chat.selectedAlbumId // Use initial value
      }));

      setFaceAssignments(initialFaceAssignments);
      setVoiceAssignments(initialVoiceAssignments);
      setChatAssignments(initialChatAssignments);
    }
     // Reset on close? Optional, depends on desired behavior if modal is re-opened without new analysis.
     // if (!isOpen) {
     //     setFaceAssignments([]);
     //     setVoiceAssignments([]);
     //     setChatAssignments([]);
     // }
  }, [isOpen, analysisResults]);

  const handleFaceAssignmentChange = (tempFaceId: string, albumId: string | null) => {
    setFaceAssignments(prev =>
      prev.map(assign =>
        assign.tempId === tempFaceId ? { ...assign, selectedAlbumId: albumId } : assign
      )
    );
  };

  const handleVoiceAssignmentChange = (tempVoiceId: string, albumId: string | null) => {
     setVoiceAssignments(prev =>
       prev.map(assign =>
         assign.tempId === tempVoiceId ? { ...assign, selectedAlbumId: albumId } : assign
       )
     );
   };

  const handleChatAssignmentChange = (fileId: string, albumId: string | null) => {
    setChatAssignments(prev =>
      prev.map(assign =>
        assign.fileId === fileId ? { ...assign, selectedAlbumId: albumId } : assign
      )
    );
  };

  const handleConfirmClick = () => {
    const decisions: UserReviewDecisions = {
      faceMappings: faceAssignments.map(({ tempId, selectedAlbumId }) => ({
          tempFaceId: tempId,
          assignedAlbumId: selectedAlbumId
      })),
       voiceMappings: voiceAssignments.map(({ tempId, selectedAlbumId }) => ({
          tempVoiceId: tempId,
          assignedAlbumId: selectedAlbumId
      })),
      chatLinks: chatAssignments.map(({ fileId, selectedAlbumId }) => ({
          fileId: fileId,
          linkedAlbumId: selectedAlbumId, // Pass null if "Don't Link" was selected
      })),
    };
    onConfirm(decisions);
  };

  // --- Prepare data for rendering ---
  const allAnalyzedFaces = useMemo(() =>
    analysisResults.mediaResults.flatMap(res =>
        res.analyzedFaces.map(face => ({
            ...face,
            // Find the original media item this face belongs to
            originalMediaAlt: res.originalMedia.alt
        }))
    ), [analysisResults]);

   const allAnalyzedVoices = useMemo(() =>
    analysisResults.mediaResults
        .filter(res => res.analyzedVoice)
        .map(res => ({
            ...res.analyzedVoice!,
            originalMediaAlt: res.originalMedia.alt
        })), [analysisResults]);

  const allChatFiles = useMemo(() => analysisResults.chatFilesToLink, [analysisResults]);

  // Combine existing albums with the "New Unnamed" option
  const albumOptions = useMemo(() => [
    { id: 'new_unnamed', name: 'Create New Unnamed Album' },
    ...analysisResults.existingAlbums,
  ], [analysisResults.existingAlbums]);

  const chatAlbumOptions = useMemo(() => [ // Slightly different for chats ("Don't Link")
    { id: 'none', name: "Don't Link" },
    ...analysisResults.existingAlbums,
    // Optionally allow creating a new album directly from chat linking?
    // { id: 'new_unnamed', name: 'Create New Unnamed Album' },
  ], [analysisResults.existingAlbums]);


  // Helper to find the current assignment for a given ID
  const findFaceAssignment = (tempId: string) => faceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? null;
  const findVoiceAssignment = (tempId: string) => voiceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? null;
  const findChatAssignment = (fileId: string) => chatAssignments.find(a => a.fileId === fileId)?.selectedAlbumId ?? null;


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col gap-0 !rounded-lg">
        <DialogHeader className="p-4 border-b">
          <DialogTitle className="text-xl">Review Upload Analysis</DialogTitle>
          <DialogDescription>
              Review the detected faces, voices, and link chats to albums. Confirm to finalize the upload.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-grow h-0"> {/* Make ScrollArea take remaining space */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

            {/* Detected Faces Section */}
            {allAnalyzedFaces.length > 0 && (
              <Card className="col-span-1 md:col-span-2 lg:col-span-3">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Detected Faces</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {allAnalyzedFaces.map((face) => (
                    <div key={face.tempId} className="flex flex-col items-center space-y-2 p-2 border rounded-md">
                      <div className="w-24 h-24 relative overflow-hidden rounded bg-muted flex items-center justify-center">
                        {face.imageDataUrl ? (
                           <Image src={face.imageDataUrl} alt={`Detected face from ${face.originalMediaAlt}`} layout="fill" objectFit="cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">Preview N/A</span>
                        )}
                      </div>
                      <Label htmlFor={`face-select-${face.tempId}`} className="text-xs text-center">
                         From: <span className="font-medium truncate" title={face.originalMediaAlt}>{face.originalMediaAlt}</span>
                      </Label>
                      <Select
                        value={findFaceAssignment(face.tempId) ?? 'none'} // Use 'none' for Select's null representation
                        onValueChange={(value) => handleFaceAssignmentChange(face.tempId, value === 'none' ? null : value)}
                        disabled={isProcessing}
                      >
                        <SelectTrigger id={`face-select-${face.tempId}`} className="w-full text-xs h-8">
                          <SelectValue placeholder="Assign to album..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Ignore Face</SelectItem>
                           <SelectItem value="new_unnamed" className="text-primary">
                               <UserPlus className="h-4 w-4 mr-2 inline-block" /> New Unnamed Album
                           </SelectItem>
                          {analysisResults.existingAlbums.map(album => (
                            <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Identified Voices Section - Simplified */}
             {allAnalyzedVoices.length > 0 && (
              <Card className="col-span-1 md:col-span-1 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" /> Identified Voices</CardTitle>
                </CardHeader>
                 <CardContent className="space-y-3">
                     {allAnalyzedVoices.map(voice => (
                         <div key={voice.tempId} className="space-y-1 p-2 border rounded-md">
                             <p className="text-sm font-medium">Voice: {voice.name} ({voice.profileId})</p>
                             <p className="text-xs text-muted-foreground">From: {voice.originalMediaAlt}</p>
                             <Select
                                value={findVoiceAssignment(voice.tempId) ?? 'none'}
                                onValueChange={(value) => handleVoiceAssignmentChange(voice.tempId, value === 'none' ? null : value)}
                                disabled={isProcessing}
                             >
                               <SelectTrigger className="w-full text-xs h-8">
                                 <SelectValue placeholder="Associate with album..." />
                               </SelectTrigger>
                               <SelectContent>
                                 <SelectItem value="none">Don't Associate</SelectItem>
                                 <SelectItem value="new_unnamed" className="text-primary">
                                      <UserPlus className="h-4 w-4 mr-2 inline-block" /> New Unnamed Album
                                 </SelectItem>
                                  {analysisResults.existingAlbums.map(album => (
                                    <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                                  ))}
                               </SelectContent>
                             </Select>
                         </div>
                     ))}
                 </CardContent>
              </Card>
            )}


            {/* Link Chats Section */}
            {allChatFiles.length > 0 && (
              <Card className="col-span-1 md:col-span-1 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5 text-green-600" /> Link Chat Files</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {allChatFiles.map((chat) => (
                    <div key={chat.fileId} className="flex flex-col sm:flex-row items-center justify-between gap-2 p-2 border rounded-md">
                      <div className="flex items-center gap-2 flex-grow mb-2 sm:mb-0">
                        <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                         <span className="text-sm font-medium truncate" title={chat.fileName}>
                            {chat.fileName} <span className="text-xs text-muted-foreground">({chat.source})</span>
                         </span>
                      </div>
                      <Select
                         value={findChatAssignment(chat.fileId) ?? 'none'} // Use 'none' for Select's null representation
                         onValueChange={(value) => handleChatAssignmentChange(chat.fileId, value === 'none' ? null : value)}
                         disabled={isProcessing}
                      >
                        <SelectTrigger className="w-full sm:w-[220px] text-xs h-8">
                          <SelectValue placeholder="Link to album..." />
                        </SelectTrigger>
                        <SelectContent>
                          {chatAlbumOptions.map(album => (
                            <SelectItem key={album.id} value={album.id}>{album.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

             {/* Add a message if nothing was detected/uploaded */}
            {allAnalyzedFaces.length === 0 && allAnalyzedVoices.length === 0 && allChatFiles.length === 0 && (
                <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center text-muted-foreground py-8">
                    <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                    No faces, voices, or chat files were detected or included in this upload batch for review.
                </div>
            )}

          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirmClick} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm & Finalize Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
