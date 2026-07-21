/** Guess a library type from a browser File before extraction begins. */
export function guessUploadType(file: File): 'photo' | 'video' | 'document' {
  if (file.type.startsWith('image/')) return 'photo'
  if (file.type.startsWith('video/')) return 'video'
  return 'document'
}

export function safeStorageName(name: string): string {
  return name.replace(/[^a-zA-Z0-9.-]+/g, '-').replace(/^-+|-+$/g, '') || 'file'
}

/** SHA-256 byte hash used by the database's per-home duplicate guard. */
export async function hashUpload(file: File): Promise<string | null> {
  try {
    const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer())
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, '0'))
      .join('')
  } catch {
    return null
  }
}
