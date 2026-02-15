import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <Skeleton className="h-10 w-[140px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="md:col-span-2 w-full h-[320px] rounded-xl" />
        <Skeleton className="w-full h-[300px] rounded-xl" />
        <Skeleton className="w-full h-[300px] rounded-xl" />
        <Skeleton className="md:col-span-2 w-full h-[300px] rounded-xl" />
      </div>
    </div>
  );
}
