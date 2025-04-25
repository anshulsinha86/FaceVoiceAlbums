

'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, FileText, Link2, AlertTriangle, Voicemail, MessageCircle } from 'lucide-react'; // Added more icons
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
        // Ensure we map from the potentially nested structure in analysisResults
        const initialFaceAssignments = analysisResults.mediaResults.flatMap(res =>
            res.analyzedFaces.map(face => ({
                tempId: face.tempId,
                selectedAlbumId: face.selectedAlbumId // Default to null if not present
            }))
        );
        const initialVoiceAssignments = analysisResults.mediaResults
            .filter(res => res.analyzedVoice) // Ensure voice exists
            .map(res => ({
                tempId: res.analyzedVoice!.tempId,
                selectedAlbumId: res.analyzedVoice!.selectedAlbumId
            }));
        const initialChatAssignments = analysisResults.chatFilesToLink.map(chat => ({
            fileId: chat.fileId,
            selectedAlbumId: chat.selectedAlbumId // Default to null if not present
        }));

      setFaceAssignments(initialFaceAssignments);
      setVoiceAssignments(initialVoiceAssignments);
      setChatAssignments(initialChatAssignments);
    }
     // Optional: Reset on close? Depends on desired behavior.
     // if (!isOpen) {
     //     setFaceAssignments([]);
     //     setVoiceAssignments([]);
     //     setChatAssignments([]);
     // }
  }, [isOpen, analysisResults]); // Depend on isOpen and analysisResults


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
    // Construct UserReviewDecisions based on the current local state
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
  // Derive flattened lists from analysisResults when it changes
    const allAnalyzedFaces = useMemo(() =>
        analysisResults.mediaResults.flatMap(res =>
            res.analyzedFaces.map(face => ({
                ...face,
                // Find the original media item this face belongs to using the ID
                originalMediaAlt: analysisResults.mediaResults.find(
                    innerRes => innerRes.analyzedFaces.some(f => f.tempId === face.tempId)
                )?.originalMedia?.alt || 'Unknown Media',
            })) || [] // Add default empty array
        ), [analysisResults]);


   const allAnalyzedVoices = useMemo(() =>
        analysisResults.mediaResults
            .filter(res => res.analyzedVoice) // Filter out results without a voice
            .map(res => ({
                ...res.analyzedVoice!, // Assert non-null because we filtered
                 originalMediaAlt: res.originalMedia?.alt || 'Unknown Media',
            })) || [] // Add default empty array
    , [analysisResults]);

  const allChatFiles = useMemo(() => analysisResults.chatFilesToLink || [], [analysisResults]);

  // Combine existing albums with the "New Unnamed" option
   const albumOptionsForFacesVoices = useMemo(() => [
        { id: 'none', name: 'Ignore / Do Not Assign' }, // Use 'none' for ignore
        { id: 'new_unnamed', name: 'Create New Unnamed Album' },
         ...(analysisResults.existingAlbums || []).map(album => ({ id: album.id, name: album.name })),
    ], [analysisResults.existingAlbums]);


    const albumOptionsForChats = useMemo(() => [ // Slightly different for chats ("Don't Link")
        { id: 'none', name: "Don't Link" }, // Use 'none' for not linking
        ...(analysisResults.existingAlbums || []).map(album => ({ id: album.id, name: album.name })),
        // Optionally allow creating a new album directly from chat linking?
        // { id: 'new_unnamed', name: 'Create New Unnamed Album' },
    ], [analysisResults.existingAlbums]);


  // Helper to find the current assignment for a given ID, defaulting to 'none'
  const findFaceAssignment = (tempId: string) => faceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? 'none';
  const findVoiceAssignment = (tempId: string) => voiceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? 'none';
  const findChatAssignment = (fileId: string) => chatAssignments.find(a => a.fileId === fileId)?.selectedAlbumId ?? 'none';


  // Check if there's anything to review
  const hasContentToReview = allAnalyzedFaces.length > 0 || allAnalyzedVoices.length > 0 || allChatFiles.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0 !rounded-lg">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center">
           <div>
             <DialogTitle className="text-xl">Review Upload Analysis</DialogTitle>
             <DialogDescription>
                 Review detected faces, voices, and link chats. Confirm to finalize.
             </DialogDescription>
           </div>
            <DialogClose asChild>
                 <Button variant="ghost" size="icon" className="rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
            </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-grow h-0"> {/* Make ScrollArea take remaining space */}
          <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Column 1 & 2: Detected Faces */}
             {allAnalyzedFaces.length > 0 && (
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Users className="h-5 w-5 text-primary" /> Detected Faces ({allAnalyzedFaces.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-[calc(80vh-200px)] overflow-y-auto pr-2">
                        {allAnalyzedFaces.map((face) => (
                            <div key={face.tempId} className="flex flex-col items-center space-y-2 p-2 border rounded-lg shadow-sm bg-card">
                                <div className="w-24 h-24 relative overflow-hidden rounded-md bg-muted flex items-center justify-center border">
                                    {face.imageDataUrl ? (
                                        <Image src={face.imageDataUrl} alt={`Detected face from ${face.originalMediaAlt}`} layout="fill" objectFit="cover" />
                                    ) : (
                                        <span className="text-xs text-muted-foreground p-1 text-center">Preview Not Available</span>
                                    )}
                                </div>
                                 <p className="text-xs text-muted-foreground text-center w-full truncate px-1" title={`From: ${face.originalMediaAlt}`}>
                                     From: {face.originalMediaAlt}
                                 </p>
                                <Select
                                    value={findFaceAssignment(face.tempId)} // Default handled by findFaceAssignment
                                    onValueChange={(value) => handleFaceAssignmentChange(face.tempId, value === 'none' ? null : value)}
                                    disabled={isProcessing}
                                >
                                    <SelectTrigger id={`face-select-${face.tempId}`} className="w-full text-xs h-8">
                                        <SelectValue placeholder="Assign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {albumOptionsForFacesVoices.map(option => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                                className={option.id === 'new_unnamed' ? 'text-primary font-medium' : ''}
                                            >
                                                {option.id === 'new_unnamed' && <UserPlus className="h-3 w-3 mr-1.5 inline-block relative -top-px" />}
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </CardContent>
                </Card>
             )}

            {/* Column 3: Voices and Chats */}
             <div className="lg:col-span-1 space-y-6">
                {/* Identified Voices Section */}
                 {allAnalyzedVoices.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Voicemail className="h-5 w-5 text-blue-500" /> Identified Voices ({allAnalyzedVoices.length})
                            </CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-3 max-h-[calc(40vh-100px)] overflow-y-auto pr-2">
                             {allAnalyzedVoices.map(voice => (
                                 <div key={voice.tempId} className="space-y-1.5 p-3 border rounded-lg shadow-sm bg-card">
                                      <p className="text-sm font-medium">
                                          Voice: <span className="text-foreground">{voice.name || 'Unknown'}</span>
                                         {voice.profileId && <span className="text-xs text-muted-foreground ml-1">({voice.profileId})</span>}
                                     </p>
                                     <p className="text-xs text-muted-foreground">From: <span className="font-medium">{voice.originalMediaAlt}</span></p>
                                     <Select
                                        value={findVoiceAssignment(voice.tempId)}
                                        onValueChange={(value) => handleVoiceAssignmentChange(voice.tempId, value === 'none' ? null : value)}
                                        disabled={isProcessing}
                                     >
                                       <SelectTrigger className="w-full text-xs h-8">
                                         <SelectValue placeholder="Associate with..." />
                                       </SelectTrigger>
                                       <SelectContent>
                                         {albumOptionsForFacesVoices.map(option => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                                className={option.id === 'new_unnamed' ? 'text-primary font-medium' : ''}
                                            >
                                                 {option.id === 'new_unnamed' && <UserPlus className="h-3 w-3 mr-1.5 inline-block relative -top-px" />}
                                                 {option.name}
                                            </SelectItem>
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
                    <Card>
                        <CardHeader>
                             <CardTitle className="flex items-center gap-2 text-lg">
                                <MessageCircle className="h-5 w-5 text-green-600" /> Link Chat Files ({allChatFiles.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 max-h-[calc(40vh-100px)] overflow-y-auto pr-2">
                             {allChatFiles.map((chat) => (
                                <div key={chat.fileId} className="space-y-1.5 p-3 border rounded-lg shadow-sm bg-card">
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                         <span className="text-sm font-medium truncate flex-grow" title={chat.fileName}>
                                            {chat.fileName}
                                         </span>
                                         <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                            {chat.source}
                                        </span>
                                    </div>
                                    <Select
                                         value={findChatAssignment(chat.fileId)}
                                         onValueChange={(value) => handleChatAssignmentChange(chat.fileId, value === 'none' ? null : value)}
                                         disabled={isProcessing}
                                    >
                                        <SelectTrigger className="w-full text-xs h-8">
                                            <SelectValue placeholder="Link to album..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {albumOptionsForChats.map(option => (
                                                <SelectItem key={option.id} value={option.id}>
                                                    {option.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                             ))}
                         </CardContent>
                    </Card>
                )}
             </div>


             {/* Add a message if nothing was detected/uploaded that requires review */}
             {!hasContentToReview && (
                 <div className="col-span-1 lg:col-span-3 text-center text-muted-foreground py-12 flex flex-col items-center justify-center">
                     <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                     <p className="text-lg font-medium">No items requiring review.</p>
                      <p className="text-sm">No new faces or voices were detected, and no chat files were uploaded in this batch.</p>
                 </div>
             )}

          </div>
        </ScrollArea>

        <DialogFooter className="p-4 border-t bg-background">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
           {/* Only enable confirm if there was content to review or if it's just finalizing */}
          <Button onClick={handleConfirmClick} disabled={isProcessing || !hasContentToReview}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
             {hasContentToReview ? 'Confirm & Finalize' : 'Finalize (No Review Needed)'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
