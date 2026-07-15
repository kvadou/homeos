import { BrandLogo } from '@/components/brand-logo'

export default function Loading() {
  return <main className="min-h-dvh bg-background" aria-busy="true" aria-label="Loading your home">
    <div className="mx-auto max-w-6xl px-5 py-6 sm:px-8 lg:px-12">
      <BrandLogo />
      <div className="mt-10 animate-pulse space-y-7 motion-reduce:animate-none">
        <div className="space-y-3"><div className="h-8 w-56 rounded-lg bg-muted" /><div className="h-4 w-full max-w-md rounded bg-muted" /></div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-40 rounded-2xl bg-muted" />)}</div>
        <div className="h-72 rounded-2xl bg-muted" />
      </div>
    </div>
  </main>
}
