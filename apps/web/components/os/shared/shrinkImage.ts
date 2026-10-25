'use client'
/** Phone photos are often 5–10 MB; the platform takes 4. Re-encode large images in the browser. */
export async function shrinkImage(file: File, maxBytes = 3_500_000, maxSide = 2200): Promise<File> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size <= maxBytes) return file
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale)
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  const blob = await new Promise<Blob | null>(r => canvas.toBlob(r, 'image/jpeg', 0.85))
  return blob ? new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }) : file
}
