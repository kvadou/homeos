'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow-sm print:hidden"><Printer className="size-4" />Print or save PDF</button>
}

