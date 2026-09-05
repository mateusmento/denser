/** True for image and video attachments that should render as thumbnails. */
export function isMediaMime(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}
