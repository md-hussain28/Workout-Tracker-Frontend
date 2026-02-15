import { Skeleton } from "@/components/ui/skeleton";

export default function ExercisesLoading() {
  return (
    <div className="mx-auto max-w-lg flex flex-col px-4 pt-6 pb-4">
      <Skeleton className="h-8 w-32 mb-4" />
      <Skeleton className="h-10 w-full mb-4 rounded-xl" />
      <div className="flex gap-1 p-1 bg-muted rounded-xl mb-4">
        <Skeleton className="flex-1 h-9 rounded-lg" />
        <Skeleton className="flex-1 h-9 rounded-lg" />
      </div>
      <div className="space-y-5 pt-2">
        <Skeleton className="h-4 w-24" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
