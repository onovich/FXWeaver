import { MAX_IMAGE_BYTES, MAX_IMAGE_DIMENSION, type EmbeddedImage } from './assets';

/** Decode a local image before embedding it into a portable project. */
export async function readEmbeddedImage(file: File): Promise<EmbeddedImage> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) throw new Error('Use a PNG, JPEG, or WebP image.');
  if (file.size > MAX_IMAGE_BYTES) throw new Error('An image must be 2 MiB or smaller.');
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image.'));
    reader.readAsDataURL(file);
  });
  const element = new Image();
  element.src = dataUrl;
  await element.decode();
  if (!element.naturalWidth || !element.naturalHeight ||
    element.naturalWidth > MAX_IMAGE_DIMENSION || element.naturalHeight > MAX_IMAGE_DIMENSION) {
    throw new Error('Image dimensions must be between 1 and 4096 pixels.');
  }
  return { id: crypto.randomUUID(), name: file.name, mimeType: file.type as EmbeddedImage['mimeType'],
    dataUrl, width: element.naturalWidth, height: element.naturalHeight };
}
