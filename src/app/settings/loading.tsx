import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-2xl" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      <div className="mb-8">
        <div className="flex justify-between mb-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-9 w-16 rounded-xl" />
        </div>
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[120px]" />
                    <Skeleton className="h-3 w-[80px]" />
                  </div>
                  <Skeleton className="h-8 w-14 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="mb-8">
        <Skeleton className="h-6 w-24 mb-3" />
        <Card>
          <CardContent className="py-6">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-2" />
          </CardContent>
        </Card>
      </div>
      <div>
        <Skeleton className="h-6 w-24 mb-3" />
        <div className="space-y-3">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
