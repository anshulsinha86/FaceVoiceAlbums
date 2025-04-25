
'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus, Users, FileText, Link2, AlertTriangle, Voicemail, MessageCircle, ImageOff, AlertCircle } from 'lucide-react'; // Added more icons
import type { UploadAnalysisResults, UserReviewDecisions, Album, AnalyzedFace, ChatFileLinkInfo, AnalyzedVoice, MediaAnalysisResult } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'; // Added Tooltip

interface UploadReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (decisions: UserReviewDecisions) => void;
  analysisResults: UploadAnalysisResults;
  isProcessing: boolean; // To disable confirm button during finalization
}

// Helper type for managing local state of assignments
type FaceAssignment = { tempId: string; selectedAlbumId: string | 'new_unnamed' | 'none' | null };
type VoiceAssignment = { tempId: string; selectedAlbumId: string | 'new_unnamed' | 'none' | null };
type ChatAssignment = { fileId: string; selectedAlbumId: string | 'none' | null };


export function UploadReviewModal({
  isOpen,
  onClose,
  onConfirm,
  analysisResults,
  isProcessing,
}: UploadReviewModalProps) {

  const [faceAssignments, setFaceAssignments] = useState<FaceAssignment[]>([]);
  const [voiceAssignments, setVoiceAssignments] = useState<VoiceAssignment[]>([]);
  const [chatAssignments, setChatAssignments] = useState<ChatAssignment[]>([]);

   // Initialize local state when analysisResults change (modal opens)
    useEffect(() => {
    if (isOpen && analysisResults) {
      const initialFaceAssignments = analysisResults.mediaResults.flatMap(res =>
        res.analyzedFaces.map(face => ({
          tempId: face.tempId,
          // Default to 'none' (ignore) if no selection yet, or keep existing selection
          selectedAlbumId: face.selectedAlbumId ?? 'none',
        }))
      );
      const initialVoiceAssignments = analysisResults.mediaResults
        .filter(res => res.analyzedVoice)
        .map(res => ({
          tempId: res.analyzedVoice!.tempId,
          selectedAlbumId: res.analyzedVoice!.selectedAlbumId ?? 'none',
        }));
      const initialChatAssignments = analysisResults.chatFilesToLink.map(chat => ({
        fileId: chat.fileId,
        selectedAlbumId: chat.selectedAlbumId ?? 'none', // Default to 'none' (don't link)
      }));

      setFaceAssignments(initialFaceAssignments);
      setVoiceAssignments(initialVoiceAssignments);
      setChatAssignments(initialChatAssignments);
    }
    // Reset on close? Optional.
    // if (!isOpen) { setFaceAssignments([]); setVoiceAssignments([]); setChatAssignments([]); }
  }, [isOpen, analysisResults]);


  const handleAssignmentChange = (
      type: 'face' | 'voice' | 'chat',
      id: string, // tempId for face/voice, fileId for chat
      albumId: string | null // Can be 'none', 'new_unnamed', or an album ID
    ) => {
        // Ensure 'null' is mapped to 'none' for consistency in state
        const finalAlbumId = albumId === null ? 'none' : albumId;

        switch (type) {
            case 'face':
                 setFaceAssignments(prev =>
                    prev.map(assign =>
                        assign.tempId === id ? { ...assign, selectedAlbumId: finalAlbumId } : assign
                    )
                );
                break;
            case 'voice':
                setVoiceAssignments(prev =>
                    prev.map(assign =>
                        assign.tempId === id ? { ...assign, selectedAlbumId: finalAlbumId } : assign
                    )
                );
                break;
            case 'chat':
                 setChatAssignments(prev =>
                    prev.map(assign =>
                        assign.fileId === id ? { ...assign, selectedAlbumId: finalAlbumId } : assign
                    )
                );
                break;
        }
    };


  const handleConfirmClick = () => {
    // Construct UserReviewDecisions, passing the selections including 'none'
    const decisions: UserReviewDecisions = {
        faceMappings: faceAssignments.map(({ tempId, selectedAlbumId }) => ({
            tempFaceId: tempId,
            assignedAlbumId: selectedAlbumId // Pass 'none', 'new_unnamed', or album ID
        })),
        voiceMappings: voiceAssignments.map(({ tempId, selectedAlbumId }) => ({
            tempVoiceId: tempId,
            assignedAlbumId: selectedAlbumId
        })),
        chatLinks: chatAssignments.map(({ fileId, selectedAlbumId }) => ({
            fileId: fileId,
            linkedAlbumId: selectedAlbumId // Pass 'none' or album ID
        })),
    };
    onConfirm(decisions);
  };

  // --- Prepare data for rendering ---
   // Derive flattened lists of faces and voices from the nested analysisResults
    const allAnalyzedFaces: (AnalyzedFace & { originalMediaAlt: string; originalMediaId: string | number; analysisError?: string | null })[] = useMemo(() =>
        analysisResults.mediaResults.flatMap(res =>
            res.analyzedFaces.map(face => ({
                ...face,
                originalMediaAlt: res.originalMedia?.alt || 'Unknown Media',
                originalMediaId: res.originalMedia?.id || 'unknown_id',
                analysisError: res.error // Propagate file-level analysis error
            })) || []
        ), [analysisResults]);

    const allAnalyzedVoices: (AnalyzedVoice & { originalMediaAlt: string; originalMediaId: string | number; analysisError?: string | null })[] = useMemo(() =>
        analysisResults.mediaResults
            .filter(res => res.analyzedVoice)
            .map(res => ({
                ...res.analyzedVoice!,
                originalMediaAlt: res.originalMedia?.alt || 'Unknown Media',
                originalMediaId: res.originalMedia?.id || 'unknown_id',
                analysisError: res.error // Propagate file-level analysis error
            })) || []
    , [analysisResults]);

  const allChatFiles = useMemo(() => analysisResults.chatFilesToLink || [], [analysisResults]);

   // Define options for Select dropdowns, including 'none' and 'new_unnamed'
    const albumOptionsForFacesVoices = useMemo(() => [
        { id: 'none', name: 'Ignore / Do Not Assign' },
        { id: 'new_unnamed', name: 'Create New Unnamed Album' },
        ...(analysisResults.existingAlbums || []).map(album => ({ id: album.id, name: album.name })),
    ], [analysisResults.existingAlbums]);

    const albumOptionsForChats = useMemo(() => [
        { id: 'none', name: "Don't Link" },
        ...(analysisResults.existingAlbums || []).map(album => ({ id: album.id, name: album.name })),
    ], [analysisResults.existingAlbums]);


  // Find current assignment, defaulting to 'none'
  const findFaceAssignment = (tempId: string) => faceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? 'none';
  const findVoiceAssignment = (tempId: string) => voiceAssignments.find(a => a.tempId === tempId)?.selectedAlbumId ?? 'none';
  const findChatAssignment = (fileId: string) => chatAssignments.find(a => a.fileId === fileId)?.selectedAlbumId ?? 'none';


  // Check if there's anything to review
  const hasContentToReview = allAnalyzedFaces.length > 0 || allAnalyzedVoices.length > 0 || allChatFiles.length > 0;
  const analysisHadErrors = analysisResults.mediaResults.some(res => !!res.error);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl w-[95vw] h-[90vh] p-0 flex flex-col gap-0 !rounded-lg">
        <DialogHeader className="p-4 border-b flex flex-row justify-between items-center sticky top-0 bg-background z-10">
           <div>
             <DialogTitle className="text-xl">Review Upload Analysis</DialogTitle>
             <DialogDescription>
                 Review detected items and confirm assignments.
                 {analysisHadErrors && <span className="text-destructive font-medium ml-2">(Some files had analysis errors)</span>}
             </DialogDescription>
           </div>
            <DialogClose asChild>
                 <Button variant="ghost" size="icon" className="rounded-full">
                    <X className="h-4 w-4" />
                 </Button>
            </DialogClose>
        </DialogHeader>

         <TooltipProvider>
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
                                <div key={face.tempId} className="flex flex-col items-center space-y-2 p-2 border rounded-lg shadow-sm bg-card relative">
                                     {/* Error indicator for the source file */}
                                    {face.analysisError && (
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="absolute top-1 right-1 p-0.5 bg-destructive/20 rounded-full">
                                                     <AlertCircle className="h-3 w-3 text-destructive" />
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent side="top" className="max-w-xs text-xs">
                                                <p>Analysis Error on <span className='font-medium'>{face.originalMediaAlt}</span>:</p>
                                                <p>{face.analysisError}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    )}
                                    <div className="w-24 h-24 relative overflow-hidden rounded-md bg-muted flex items-center justify-center border">
                                        {face.imageDataUrl && !face.imageDataUrl.startsWith('data:') ? ( // Handle URL case
                                             <Image
                                                src={face.imageDataUrl}
                                                alt={`Detected face from ${face.originalMediaAlt}`}
                                                layout="fill"
                                                objectFit="cover"
                                                unoptimized={face.imageDataUrl.includes('picsum.photos')} // Don't optimize picsum
                                                onError={(e) => { e.currentTarget.src = '/placeholder-face.svg'; }} // Fallback
                                             />
                                         ) : face.imageDataUrl ? ( // Handle Data URL case (less likely now)
                                             <Image src={face.imageDataUrl} alt={`Detected face from ${face.originalMediaAlt}`} layout="fill" objectFit="cover" />
                                         ) : (
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                 <ImageOff className="h-8 w-8 mb-1" />
                                                 <span className="text-xs text-center">Preview N/A</span>
                                            </div>
                                        )}
                                    </div>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground text-center w-full truncate px-1">
                                                From: {face.originalMediaAlt}
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent side="bottom" className="text-xs">
                                            {face.originalMediaAlt} (ID: {face.originalMediaId})
                                         </TooltipContent>
                                    </Tooltip>
                                    <Select
                                        value={findFaceAssignment(face.tempId)}
                                        onValueChange={(value) => handleAssignmentChange('face', face.tempId, value)}
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
                                                    className={cn(
                                                        "text-xs",
                                                        option.id === 'new_unnamed' ? 'text-primary font-medium' : '',
                                                        option.id === 'none' ? 'text-muted-foreground italic' : ''
                                                    )}
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
                                    <div key={voice.tempId} className="space-y-1.5 p-3 border rounded-lg shadow-sm bg-card relative">
                                         {voice.analysisError && (
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                     <span className="absolute top-1 right-1 p-0.5 bg-destructive/20 rounded-full">
                                                         <AlertCircle className="h-3 w-3 text-destructive" />
                                                     </span>
                                                </TooltipTrigger>
                                                 <TooltipContent side="top" className="max-w-xs text-xs">
                                                     <p>Analysis Error on <span className='font-medium'>{voice.originalMediaAlt}</span>:</p>
                                                     <p>{voice.analysisError}</p>
                                                 </TooltipContent>
                                            </Tooltip>
                                        )}
                                        <p className="text-sm font-medium pr-4">
                                            Voice: <span className="text-foreground">{voice.name || 'Unknown'}</span>
                                            {voice.profileId && <span className="text-xs text-muted-foreground ml-1">({voice.profileId})</span>}
                                        </p>
                                         <Tooltip>
                                            <TooltipTrigger asChild>
                                                 <p className="text-xs text-muted-foreground truncate">From: <span className="font-medium">{voice.originalMediaAlt}</span></p>
                                             </TooltipTrigger>
                                             <TooltipContent side="bottom" className="text-xs">
                                                {voice.originalMediaAlt} (ID: {voice.originalMediaId})
                                             </TooltipContent>
                                         </Tooltip>
                                        <Select
                                            value={findVoiceAssignment(voice.tempId)}
                                            onValueChange={(value) => handleAssignmentChange('voice', voice.tempId, value)}
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
                                                         className={cn(
                                                             "text-xs",
                                                             option.id === 'new_unnamed' ? 'text-primary font-medium' : '',
                                                             option.id === 'none' ? 'text-muted-foreground italic' : ''
                                                         )}
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
                                        <Tooltip>
                                             <TooltipTrigger asChild>
                                                <div className="flex items-center gap-2">
                                                    <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm font-medium truncate flex-grow">{chat.fileName}</span>
                                                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{chat.source}</span>
                                                </div>
                                             </TooltipTrigger>
                                            <TooltipContent side="top" className="text-xs">
                                                {chat.fileName}
                                            </TooltipContent>
                                        </Tooltip>
                                        <Select
                                            value={findChatAssignment(chat.fileId)}
                                            onValueChange={(value) => handleAssignmentChange('chat', chat.fileId, value)}
                                            disabled={isProcessing}
                                        >
                                            <SelectTrigger className="w-full text-xs h-8">
                                                <SelectValue placeholder="Link to album..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {albumOptionsForChats.map(option => (
                                                    <SelectItem
                                                        key={option.id}
                                                        value={option.id}
                                                        className={cn(
                                                            "text-xs",
                                                            option.id === 'none' ? 'text-muted-foreground italic' : ''
                                                        )}
                                                        >
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

                {/* Message if nothing requires review */}
                {!hasContentToReview && (
                    <div className="col-span-1 lg:col-span-3 text-center text-muted-foreground py-12 flex flex-col items-center justify-center">
                        <AlertTriangle className="h-10 w-10 mx-auto mb-4 text-muted-foreground/50" />
                        <p className="text-lg font-medium">No items requiring review.</p>
                        <p className="text-sm">No new faces or voices detected, and no chat files uploaded.</p>
                    </div>
                )}

            </div>
            </ScrollArea>
         </TooltipProvider>

        <DialogFooter className="p-4 border-t bg-background sticky bottom-0">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleConfirmClick} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Confirm & Finalize
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Add a placeholder SVG for face previews if image loading fails
// Create a file `public/placeholder-face.svg` with the following content:
// <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
