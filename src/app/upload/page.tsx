
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload, FileText, MessageSquare, Music, Video, Loader2 } from 'lucide-react';
import { analyzeUploadedFiles, finalizeUploadProcessing } from '@/lib/face-voice-processing';
import type { Album, MediaItem, UploadAnalysisResults, UserReviewDecisions } from '@/types';
import { UploadReviewModal } from '@/components/upload-review-modal'; // Import the new modal


export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0); // Optional: for finer progress
  const [analysisResults, setAnalysisResults] = useState<UploadAnalysisResults | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);

  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    setSelectedFiles(files);
    setAnalysisResults(null); // Reset previous results
    setAnalysisProgress(0);
    setIsReviewModalOpen(false); // Close modal if it was open
  };

  const handleAnalyzeUploads = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0); // Reset progress
    setAnalysisResults(null);

    try {
      // Simulate progress (optional) - In real app, backend might provide progress updates
      const progressInterval = setInterval(() => {
          setAnalysisProgress(prev => Math.min(prev + 10, 90)); // Simulate progress up to 90%
      }, 300);

      const results = await analyzeUploadedFiles(Array.from(selectedFiles));
      clearInterval(progressInterval); // Stop simulation
      setAnalysisProgress(100); // Mark as complete

      setAnalysisResults(results);
      setIsReviewModalOpen(true); // Open the review modal with the results
      toast({
        title: 'Analysis Complete',
        description: 'Review the findings and confirm associations.',
      });

    } catch (error) {
      console.error("Error during file analysis:", error);
      toast({
        title: 'Analysis Error',
        description: `Failed to analyze files. ${error instanceof Error ? error.message : ''}`,
        variant: 'destructive',
      });
       setAnalysisProgress(0); // Reset progress on error
    } finally {
      setIsAnalyzing(false);
       // Keep files selected in case user wants to retry analysis without re-selecting
    }
  };

   // Callback function when the user confirms the review in the modal
   const handleConfirmReview = async (userDecisions: UserReviewDecisions) => {
     setIsReviewModalOpen(false); // Close the modal first
     if (!analysisResults) {
         console.error("Cannot finalize, analysis results are missing.");
         toast({ title: 'Error', description: 'Analysis results missing.', variant: 'destructive' });
         return;
     }

     setIsFinalizing(true);
     console.log("Finalizing with decisions:", userDecisions);

     try {
         const result = await finalizeUploadProcessing(userDecisions, analysisResults);

         if (result.success) {
             toast({
                 title: 'Upload Successful',
                 description: 'Files processed and added to albums.',
             });
             // Reset state after successful finalization
             setSelectedFiles(null);
             setAnalysisResults(null);
             setAnalysisProgress(0);
             // Clear the file input visually
             const fileInput = document.getElementById('file-upload') as HTMLInputElement;
             if (fileInput) fileInput.value = '';
         } else {
             throw new Error(result.error || "Finalization failed.");
         }

     } catch (error) {
         console.error("Error during finalization:", error);
         toast({
             title: 'Processing Error',
             description: `Could not save changes. ${error instanceof Error ? error.message : ''}`,
             variant: 'destructive',
         });
         // Keep state as is, user might want to retry confirming
     } finally {
         setIsFinalizing(false);
     }
   };

  const handleCancelReview = () => {
    setIsReviewModalOpen(false);
    // Keep analysis results, user might want to re-open review
    toast({ title: 'Review Cancelled', description: 'You can analyze again or modify selections.' });
  };


   const getFileIcon = (file: File) => {
     if (file.type.startsWith('video/')) return <Video className="h-5 w-5 text-muted-foreground" />;
     if (file.type.startsWith('audio/')) return <Music className="h-5 w-5 text-muted-foreground" />;
     if (file.type.startsWith('image/')) return null; // No specific icon for image, handled by filename
     if (file.type.startsWith('text/') || file.name.endsWith('.txt')) return <MessageSquare className="h-5 w-5 text-muted-foreground" />;
     return <FileText className="h-5 w-5 text-muted-foreground" />; // Default file icon
   }

  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col items-center space-y-6">
        {/* Upload Card */}
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Upload & Analyze</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Select files to upload and analyze for faces and voices.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="file-upload">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="video/*,audio/*,image/*,text/plain,.txt"
                onChange={handleFileChange}
                disabled={isAnalyzing || isFinalizing} // Disable while processing
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            {(isAnalyzing || isFinalizing) && (
              <div className="space-y-2">
                <Progress value={isAnalyzing ? analysisProgress : (isFinalizing ? undefined : 0)} className="w-full [&>div]:bg-primary" />
                <p className="text-sm text-center text-muted-foreground">
                  {isAnalyzing && `Analyzing... ${Math.round(analysisProgress)}%`}
                  {isFinalizing && 'Finalizing upload...'}
                </p>
              </div>
            )}

             {/* Display Selected Files */}
             {selectedFiles && selectedFiles.length > 0 && !isAnalyzing && !isFinalizing && (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-2">
                    <p className="text-sm font-medium">{selectedFiles.length} file(s) selected:</p>
                    <ul className="list-none space-y-1">
                        {Array.from(selectedFiles).map((file, index) => (
                            <li key={index} className="text-xs text-muted-foreground flex items-center space-x-2">
                                {getFileIcon(file)}
                                <span>{file.name}</span>
                            </li>
                        ))}
                    </ul>
                </div>
             )}


            <Button
              onClick={handleAnalyzeUploads}
              disabled={isAnalyzing || isFinalizing || !selectedFiles || selectedFiles.length === 0 || !!analysisResults} // Disable if already analyzed or processing
              className="w-full"
            >
              {isAnalyzing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {isAnalyzing
                ? 'Analyzing...'
                : analysisResults
                ? 'Analyzed - Review Pending'
                : `Analyze ${selectedFiles?.length ?? 0} File(s)`}
            </Button>
          </CardContent>
        </Card>

       {/* Removed Chat Linking Card - Now part of the Review Modal */}
      </div>

        {/* Review Modal */}
        {analysisResults && (
             <UploadReviewModal
                isOpen={isReviewModalOpen}
                onClose={handleCancelReview} // Use cancel handler for closing via 'X' or overlay click
                onConfirm={handleConfirmReview}
                analysisResults={analysisResults}
                isProcessing={isFinalizing} // Pass finalizing state to disable confirm button
            />
         )}
    </>
  );
}
