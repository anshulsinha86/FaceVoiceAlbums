import Link from 'next/link';
import { Camera, Users, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <Camera className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">FaceVoiceAlbums</span>
        </Link>
        <nav className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/upload">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/albums">
              <Users className="mr-2 h-4 w-4" />
              Albums
            </Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
