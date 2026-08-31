export function messageFromApiBody(body: unknown, fallback = "Couldn’t update stage"): string {
  if (
    body != null &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string" &&
    body.error.length > 0
  ) {
    return body.error;
  }
  return fallback;
}
