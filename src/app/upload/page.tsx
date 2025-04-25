'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

export default function UploadPage() {
  const [files, setFiles] = useState<FileList | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFiles(event.target.files);
    setUploadProgress(0); // Reset progress when new files are selected
  };

  const handleUpload = async () => {
    if (!files || files.length === 0) {
      toast({
        title: 'No files selected',
        description: 'Please select files to upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    // In a real application, you would use fetch or a library like Axios
    // to upload files and track progress.
    const totalFiles = files.length;
    for (let i = 0; i < totalFiles; i++) {
        // Simulate network delay for each file
        await new Promise(resolve => setTimeout(resolve, 500));
        const progress = ((i + 1) / totalFiles) * 100;
        setUploadProgress(progress);
        // Here you would typically call your upload function for files[i]
        console.log(`Uploading ${files[i].name}...`);
    }


    // TODO: Implement actual file upload logic here
    // - Call backend API to upload files
    // - Trigger face/voice analysis process after successful upload

    console.log('Uploading files:', files);

    // Simulate successful upload completion
    setTimeout(() => {
      setIsUploading(false);
      setFiles(null); // Clear selection after upload
       // Reset input field visually
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
      toast({
        title: 'Upload Complete',
        description: `${totalFiles} file(s) uploaded successfully. Analysis will begin shortly.`,
      });
       setUploadProgress(100); // Ensure progress bar shows 100% on completion
       // Optionally reset progress bar after a short delay
       setTimeout(() => setUploadProgress(0), 2000);
    }, 1000); // Adjust timing as needed
  };

  return (
    <>
      <Header />
      <div className="flex-1 container mx-auto px-4 py-8 flex items-center justify-center">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-center">Upload Media</CardTitle>
            <CardDescription className="text-center text-muted-foreground">
              Upload video or audio files to start creating albums.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">Select Files</Label>
              <Input
                id="file-upload"
                type="file"
                multiple
                accept="video/*,audio/*"
                onChange={handleFileChange}
                disabled={isUploading}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

             {files && files.length > 0 && !isUploading && (
                <div className="text-sm text-muted-foreground">
                    {files.length} file(s) selected: {Array.from(files).map(f => f.name).join(', ')}
                </div>
             )}

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-center text-muted-foreground">Uploading... {Math.round(uploadProgress)}%</p>
              </div>
            )}


            <Button
              onClick={handleUpload}
              disabled={isUploading || !files || files.length === 0}
              className="w-full bg-teal-600 hover:bg-teal-700"
            >
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Uploading...' : 'Upload Files'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
