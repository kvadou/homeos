export function Greeting({ firstName }: { firstName?: string | null }) {
  const hour = new Date().getHours();
  const timeOfDay = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

  return (
    <div className="max-w-2xl space-y-3">
      <p className="text-sm font-medium text-sage-foreground">
        Good {timeOfDay}
        {firstName ? `, ${firstName}` : ""}
      </p>
      {/* ponytail: narrative headline is static copy for now. could be AI-generated later */}
      <h1 className="text-pretty font-serif text-3xl leading-tight tracking-tight sm:text-[2.5rem] sm:leading-[1.1]">
        Your home has been well cared for this year.
      </h1>
      <p className="text-pretty text-base leading-relaxed text-muted-foreground">
        Spend just 45 minutes this weekend and you&apos;ll stay ahead of every major maintenance
        item through September.
      </p>
    </div>
  );
}
