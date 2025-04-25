import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  // You can add any UI inside Loading, including a Skeleton.
  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
             {/* Spinner using Tailwind classes */}
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
            <p className="text-muted-foreground">Loading...</p>
        </div>

      {/* Or use Skeletons for a more structured loading UI */}
      {/* <div className="space-y-4 p-4 container">
        <Skeleton className="h-14 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
          <Skeleton className="h-[200px] w-full rounded-lg" />
        </div>
      </div> */}
    </div>
  );
}
