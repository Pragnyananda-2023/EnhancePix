
export interface ImageFile {
  base64: string;
  mimeType: string;
  dataUrl: string;
}

export const fileToImageFile = (file: File): Promise<ImageFile> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
      const base64 = dataUrl.split(',')[1];
      if (base64 && mimeType) {
        resolve({ base64, mimeType, dataUrl });
      } else {
        reject(new Error("Failed to parse image file."));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

export const dataUrlToImageFile = (dataUrl: string): ImageFile => {
  const mimeType = dataUrl.split(',')[0].split(':')[1].split(';')[0];
  const base64 = dataUrl.split(',')[1];
  if (base64 && mimeType) {
    return { base64, mimeType, dataUrl };
  }
  throw new Error("Failed to parse data URL.");
};
