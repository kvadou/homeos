import Link from "next/link";
import { ArrowLeft, ScanLine, PenLine, ArrowRight } from "lucide-react";

const options = [
  {
    href: "/dashboard/scan",
    icon: ScanLine,
    tint: "bg-sage/15 text-sage-foreground",
    title: "Scan an item",
    description: "Point your camera at an appliance, label, or document and let HomeOS fill in the details.",
  },
  {
    href: "/items/new",
    icon: PenLine,
    tint: "bg-primary/10 text-primary",
    title: "Add manually",
    description: "Type in the details yourself. Great for warranties, paint colors, and notes.",
  },
];

export default function LibraryUploadPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/library"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" strokeWidth={2} />
        Library
      </Link>

      <header className="text-center">
        <h1 className="font-serif text-3xl tracking-tight sm:text-4xl">Add to your home</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          HomeOS remembers it from here. Choose how you&apos;d like to start.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {options.map(({ href, icon: Icon, tint, title, description }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-4 rounded-3xl border border-border/70 bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sage/40 hover:shadow-md sm:p-7"
          >
            <span className={`flex size-12 items-center justify-center rounded-2xl ${tint}`}>
              <Icon className="size-6" strokeWidth={1.75} />
            </span>
            <div className="flex-1">
              <p className="font-serif text-xl tracking-tight">{title}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Continue
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" strokeWidth={2.25} />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
