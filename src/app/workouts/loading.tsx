import { Skeleton } from "@/components/ui/skeleton";

export default function WorkoutsLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <Skeleton className="h-8 w-40 mb-4" />
      <div className="flex gap-1 mb-6 p-1 bg-muted rounded-xl">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="flex-1 h-9 rounded-lg" />
        ))}
      </div>
      <div className="space-y-5">
        <Skeleton className="h-4 w-24 mb-2" />
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center justify-between p-4 border rounded-xl">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-3 w-[60px]" />
                </div>
              </div>
              <Skeleton className="h-4 w-[40px]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
