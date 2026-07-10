export default function LibraryLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      <div className="flex flex-col items-center pt-6 sm:pt-10">
        <div className="h-4 w-40 rounded bg-muted" />
        <div className="mt-3 h-10 w-80 max-w-full rounded-lg bg-muted" />
        <div className="mt-7 h-16 w-full max-w-2xl rounded-3xl bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card p-5">
            <div className="size-11 rounded-2xl bg-muted" />
            <div className="space-y-2">
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-3 w-14 rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
