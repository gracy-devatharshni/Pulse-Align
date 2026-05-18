import { Skeleton } from "@/components/ui/skeleton";

export default function GoalsLoading() {
  return (
    <div className="space-y-8 animate-page">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <div className="border border-border rounded-xl bg-card/50 overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-5 w-24" />
        </div>
        <div className="divide-y divide-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
              <div className="md:col-span-4">
                <Skeleton className="h-5 w-full max-w-[200px] mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="md:col-span-2">
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <div className="md:col-span-2">
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="md:col-span-3">
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
              <div className="md:col-span-1 flex justify-end">
                <Skeleton className="h-8 w-8 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
