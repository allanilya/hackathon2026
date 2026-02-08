export interface ImageData {
  fileName: string;
  base64: string;
  mimeType: string;
}

const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export function isSupportedImage(file: File): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type.toLowerCase());
}

export async function processImage(file: File): Promise<ImageData> {
  if (!isSupportedImage(file)) {
    throw new Error(
      `Unsupported image type. Please upload ${SUPPORTED_IMAGE_TYPES.map((t) => t.split("/")[1]).join(", ")} images.`
    );
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Image is too large. Please upload an image under 10 MB.");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Extract base64 data (remove data:image/...;base64, prefix)
      const base64Match = result.match(/^data:([^;]+);base64,(.+)$/);
      if (!base64Match) {
        reject(new Error("Failed to process image."));
        return;
      }
      resolve({
        fileName: file.name,
        base64: base64Match[2],
        mimeType: base64Match[1],
      });
    };
    reader.onerror = () => reject(new Error("Failed to read image file."));
    reader.readAsDataURL(file);
  });
}
