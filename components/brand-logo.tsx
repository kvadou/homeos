import Image from 'next/image'
import { cn } from '@/lib/utils'

export function BrandLogo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <Image src="/brand/gatherroot-mark.svg" alt="" width={40} height={40} className={compact ? 'size-8' : 'size-10'} priority />
      <span className={cn('font-serif tracking-tight text-[#1F3D34]', compact ? 'text-lg' : 'text-xl')}>GatherRoot</span>
    </span>
  )
}
