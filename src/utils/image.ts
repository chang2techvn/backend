import fs from 'fs/promises';

/**
 * Converts an image file to Base64 string
 * @param filePath - Path to the image file
 * @returns Promise that resolves to the Base64 encoded string
 */
export async function imageToBase64(filePath: string): Promise<string> {
  try {
    // Read the file as a buffer
    const buffer = await fs.readFile(filePath);
    
    // Determine file type based on extension
    const fileExtension = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeType = getMimeType(fileExtension);
    
    // Convert buffer to Base64
    const base64String = buffer.toString('base64');
    
    // Return with data URI format
    return `data:${mimeType};base64,${base64String}`;
  } catch (error) {
    console.error("Error converting image to Base64:", error);
    throw new Error("Failed to convert image to Base64");
  }
}

/**
 * Get MIME type from file extension
 * @param extension - File extension
 * @returns MIME type string
 */
function getMimeType(extension: string): string {
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Check if a string is a valid Base64 image data URI
 * @param str - String to check
 * @returns boolean indicating if the string is a valid Base64 image data URI
 */
export function isBase64Image(str: string): boolean {
  return /^data:image\/[a-zA-Z+]+;base64,([0-9a-zA-Z+/=]+)$/.test(str);
}

/**
 * Extract file size (in KB) from a Base64 string
 * @param base64String - Base64 encoded string
 * @returns Size in KB
 */
export function getBase64FileSize(base64String: string): number {
  // Remove the data URI prefix
  const base64WithoutPrefix = base64String.split(',')[1] || base64String;
  
  // Calculate size: (length of Base64 string × 3/4) - number of padding characters
  const padding = base64WithoutPrefix.endsWith('==') ? 2 : base64WithoutPrefix.endsWith('=') ? 1 : 0;
  const sizeInBytes = (base64WithoutPrefix.length * 3 / 4) - padding;
  
  // Convert to KB
  return Math.round(sizeInBytes / 1024);
}