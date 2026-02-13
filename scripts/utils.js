/**
 * Utility functions for RPGNautas File Manager
 */

/**
 * Convert an image file to WebP format
 * @param {Blob|File} file - Original image blob or file
 * @param {string} originalName - Original filename to preserve base name
 * @param {number} quality - WebP quality (0-1)
 * @returns {Promise<File>} - Converted WebP file
 */
export async function convertToWebP(file, originalName, quality = 0.8) {
  return new Promise((resolve, reject) => {
    // 1. Create Image object
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      
      // 2. Create Canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      
      // 3. Convert to Blob (WebP)
      canvas.toBlob(blob => {
        if (!blob) {
          reject(new Error('Canvas to Blob conversion failed'));
          return;
        }
        
        // 4. Create new File object
        // Change extension to .webp
        const newName = originalName.replace(/\.[^/.]+$/, "") + ".webp";
        const newFile = new File([blob], newName, { type: 'image/webp' });
        resolve(newFile);
      }, 'image/webp', quality);
    };
    
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    
    img.src = url;
  });
}

/**
 * Fetch a file as a Blob
 * @param {string} url 
 * @returns {Promise<Blob>}
 */
export async function fetchBlob(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`404: ${url}`);
    return await response.blob();
}
