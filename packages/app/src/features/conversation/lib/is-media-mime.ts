/** True for image and video attachments that should render as thumbnails. */
export function isMediaMime(mimeType: string): boolean {
  return mimeType.startsWith("image/") || mimeType.startsWith("video/");
}

export function isAudioMime(mimeType: string): boolean {
  return mimeType.startsWith("audio/");
}

export function attachmentViewKind(mimeType: string): "media" | "audio" | "file" {
  if (isMediaMime(mimeType)) return "media";
  if (isAudioMime(mimeType)) return "audio";
  return "file";
}
