
'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area'; // Use ShadCN ScrollArea
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { MediaItem } from '@/types';

interface ChatViewerProps {
  media: MediaItem; // Pass the full media item
}

export function ChatViewer({ media }: ChatViewerProps) {
   if (media.type !== 'chat' || !media.chatData) {
       return (
           <div className="p-4 text-center text-muted-foreground">
               Invalid chat data.
           </div>
       );
   }

  // Basic styling for chat lines - could be enhanced significantly
  const renderChatMessage = (line: string, index: number) => {
    // Basic detection for sender/timestamp (highly simplified)
    const match = line.match(/^\[(.*?)\]\s*([^:]+):\s*(.*)/);
    if (match) {
      const timestamp = match[1];
      const sender = match[2];
      const message = match[3];
       // Crude alignment based on sender (example)
      const isMe = sender.toLowerCase() === 'you' || sender.toLowerCase() === 'me';

      return (
        <div key={index} className={`mb-2 flex ${isMe ? 'justify-end' : 'justify-start'}`}>
          <div className={`p-2 rounded-lg max-w-[75%] ${isMe ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
            {!isMe && <p className="text-xs font-semibold mb-1">{sender}</p>}
            <p className="text-sm whitespace-pre-wrap">{message}</p>
             <p className="text-xs text-right opacity-70 mt-1">{timestamp}</p>
          </div>
        </div>
      );
    }
     // Fallback for lines without clear structure
    return <p key={index} className="text-sm text-muted-foreground mb-1 whitespace-pre-wrap">{line}</p>;
  };

  const chatLines = media.chatData.split('\n');

  return (
    <div className="w-full h-full flex flex-col p-4 bg-background">
        <Card className="flex-grow flex flex-col overflow-hidden">
             <CardHeader className="py-3 px-4 border-b">
                 <CardTitle className="text-lg">{media.alt || `Chat (${media.source || 'Unknown'})`}</CardTitle>
             </CardHeader>
             <CardContent className="p-0 flex-grow overflow-hidden">
                 <ScrollArea className="h-full p-4">
                     {chatLines.map(renderChatMessage)}
                     {/* Add padding at the bottom */}
                     <div className="h-4" />
                 </ScrollArea>
             </CardContent>
        </Card>
    </div>
  );
}
