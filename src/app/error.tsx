'use client' // Error components must be Client Components

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 text-center p-4">
       <AlertTriangle className="w-16 h-16 text-destructive" />
      <h2 className="text-2xl font-semibold text-destructive">Something went wrong!</h2>
       <p className="text-muted-foreground max-w-md">{error.message || "An unexpected error occurred."}</p>
      <Button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        variant="destructive"
      >
        Try again
      </Button>
       <Button variant="link" asChild>
           <a href="/">Go back home</a>
       </Button>
    </div>
  )
}
