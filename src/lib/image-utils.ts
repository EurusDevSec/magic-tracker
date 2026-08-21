/**
 * Utility for high-fidelity client-side image compression to WebP.
 * Produces crisp, readable text for mindmaps, screenshots, and diagrams
 * while keeping file sizes extremely light (~120KB - 180KB).
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 2048,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error(`Tệp "${file.name}" không phải là định dạng hình ảnh hợp lệ!`))
    }

    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Lỗi khi đọc tệp hình ảnh!'))
    reader.onload = (event) => {
      const img = new window.Image()
      img.onerror = () => reject(new Error('Lỗi khi xử lý dữ liệu hình ảnh!'))
      img.onload = () => {
        let width = img.naturalWidth || img.width
        let height = img.naturalHeight || img.height

        // Downscale proportionally only if dimension exceeds maxDimension (e.g. 2048px)
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo bộ xử lý Canvas!'))
        }

        // Enable high-quality smoothing for sharp text and clean lines
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first for optimal compression & sharpness
        let dataUrl = canvas.toDataURL('image/webp', quality)
        if (!dataUrl.startsWith('data:image/webp')) {
          // Fallback to JPEG if WebP is not supported by environment
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      }

      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
