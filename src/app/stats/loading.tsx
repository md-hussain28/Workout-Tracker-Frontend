import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="mx-auto max-w-lg px-4 pt-6 pb-4">
            <div className="mb-2 h-8 w-32">
                <Skeleton className="h-full w-full" />
            </div>
            <div className="mb-6 h-5 w-48">
                <Skeleton className="h-full w-full" />
            </div>

            {/* PRs Card Skeleton */}
            <Card className="mb-6 border-primary/20">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Skeleton className="size-5 rounded-full" />
                        <Skeleton className="h-6 w-32" />
                    </CardTitle>
                    <div className="pt-1">
                        <Skeleton className="h-4 w-48" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3 pt-2">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-[140px]" />
                                    <Skeleton className="h-3 w-[100px]" />
                                </div>
                                <Skeleton className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Consistency Card Skeleton */}
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Skeleton className="size-5 rounded-md" />
                        <Skeleton className="h-6 w-28" />
                    </CardTitle>
                    <div className="pt-1">
                        <Skeleton className="h-4 w-36" />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {[...Array(7)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-4 mx-auto" />
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array(30)].map((_, i) => (
                            <Skeleton key={i} className="aspect-square rounded-lg" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
