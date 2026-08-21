/**
 * High-Resolution Image Compression Utility.
 * Prioritizes maximum sharpness & crystal-clear readability for mindmaps,
 * documents, flowcharts, and code screenshots up to 4K resolution (4096px).
 */
export async function compressImageToWebP(
  file: File,
  maxDimension = 4096,
  quality = 0.95
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

        // Downscale proportionally ONLY if dimension exceeds 4K maxDimension (4096px)
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

        const ctx = canvas.getContext('2d', { alpha: true })
        if (!ctx) {
          return reject(new Error('Không thể khởi tạo bộ xử lý Canvas!'))
        }

        // Enable ultra-high smoothing for razor-sharp text and lines
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, width, height)

        // Try WebP first with 0.95 high quality (pixel-perfect clarity)
        let dataUrl = canvas.toDataURL('image/webp', quality)
        if (!dataUrl.startsWith('data:image/webp')) {
          // Fallback to high-quality JPEG if WebP is not supported by environment
          dataUrl = canvas.toDataURL('image/jpeg', quality)
        }

        resolve(dataUrl)
      }

      img.src = event.target?.result as string
    }

    reader.readAsDataURL(file)
  })
}
