import { Scale } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MeLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center">
      <div className="relative mb-8">
        <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center animate-pulse">
          <Scale className="size-10 text-primary/70" />
        </div>
        <div className="absolute -inset-2 rounded-[1.75rem] bg-primary/5 animate-pulse" />
      </div>
      <p className="text-sm font-medium text-foreground mb-1">Loading your body analytics</p>
      <p className="text-xs text-muted-foreground max-w-[240px]">
        Fetching your profile and stats…
      </p>
      <div className="mt-8 w-full max-w-[280px] space-y-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    </div>
  );
}
