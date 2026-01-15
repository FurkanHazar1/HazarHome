
/**
 * Compresses an image file by resizing and reducing quality.
 * @param file The original image file
 * @param maxWidth Maximum width of the output image (default 1920)
 * @param quality Quality of the output image (0 to 1, default 0.8)
 * @returns Promise resolving to a new compressed File object
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            // Create a new file with the compressed blob
            // Preserve original name but maybe change extension if we force type
            // For now, let's stick to jpeg for compression efficiency if original was jpg/png
            // Or keep original type if possible, but canvas.toBlob defaults to png usually unless specified.
            // Using image/jpeg is usually best for reducing file size of photos.
            // However, if transparency is needed (PNG), jpeg kills it. 
            // Furniture images are usually photos, so JPEG is safe and preferred for size.
            // Let's use image/webp if supported, or jpeg. WebP is great.
            
            const newFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".webp", {
              type: 'image/webp',
              lastModified: Date.now(),
            });
            resolve(newFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
}
