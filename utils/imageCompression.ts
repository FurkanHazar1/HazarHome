
/**
 * Compresses an image file by resizing and reducing quality.
 * @param file The original image file
 * @param maxWidth Maximum width of the output image (default 1920)
 * @param quality Quality of the output image (0 to 1, default 0.8)
 * @returns Promise resolving to a new compressed File object
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1600,
  quality: number = 0.75
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
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

    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };

    img.src = url;
  });
}
